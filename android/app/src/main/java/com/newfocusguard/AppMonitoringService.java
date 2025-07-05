package com.newfocusguard;

import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.LinearLayout.LayoutParams;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Space;
import android.view.Gravity;
import android.graphics.Typeface;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONException;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.TimeZone;
import java.util.Arrays;

public class AppMonitoringService extends Service {
    private static final String TAG = "AppMonitoringService";
    private static final long CHECK_INTERVAL_MS = 1000;
    private static final String NOTIFICATION_CHANNEL_ID = "FocusGuardChannel";
    private static final int NOTIFICATION_ID = 1867;
    private static final String PREFS_NAME = "FocusGuardLocks";
    private static final String PREFS_KEY = "lockedAppsMap";
    private static final String PREFS_KEY_SCHEDULES = "schedulesJson";

    private Handler handler;
    private boolean isRunning = false;
    private String lastForegroundApp = "";
    private long lastAppChangeTime = 0;
    private UsageStatsManager usageStatsManager;
    private Map<String, Long> lockedApps = new HashMap<>();
    private List<ScheduledLock> scheduledLocks = new ArrayList<>();

    private WindowManager windowManager;
    private View overlayView;
    private WindowManager.LayoutParams overlayParams;
    private String currentlyOverlayingPackage = null;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service onCreate");
        loadLockedApps();
        loadSchedules();
        createNotificationChannel();
        handler = new Handler(Looper.getMainLooper());
        usageStatsManager = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);

        overlayParams = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ?
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY :
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service onStartCommand with action: " + (intent != null ? intent.getAction() : "null"));
        if (intent != null) {
            String action = intent.getAction();
            if (action != null) {
                switch (action) {
                    case "START_SERVICE":
                        Log.d(TAG, "Received START_SERVICE action.");
                        startMonitoring();
                        break;
                    case "LOCK_APP":
                        String packageToLock = intent.getStringExtra("packageName");
                        long duration = intent.getLongExtra("duration", -1);
                        Log.d(TAG, "Received LOCK_APP for: " + packageToLock + " with duration: " + duration);
                        if (duration > 0) {
                            lockedApps.put(packageToLock, System.currentTimeMillis() + duration * 60 * 1000);
                        } else {
                            lockedApps.put(packageToLock, -1L);
                        }
                        saveLockedApps();
                        if (!isRunning) {
                            startMonitoring();
                        }
                        break;
                    case "UNLOCK_APP":
                        String packageToUnlock = intent.getStringExtra("packageName");
                        Log.d(TAG, "Received UNLOCK_APP for: " + packageToUnlock);
                        lockedApps.remove(packageToUnlock);
                        saveLockedApps();
                        if (packageToUnlock != null && packageToUnlock.equals(currentlyOverlayingPackage)) {
                            hideNativeOverlay();
                        }
                        if (lockedApps.isEmpty()) {
                            stopMonitoring();
                        }
                        break;
                    case "SET_SCHEDULES":
                        String schedulesJson = intent.getStringExtra("schedulesJson");
                        Log.d(TAG, "Received SET_SCHEDULES action.");
                        
                        // Persist schedules so they survive service restarts
                        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                        prefs.edit().putString(PREFS_KEY_SCHEDULES, schedulesJson).apply();
                        Log.d(TAG, "Saved schedules to SharedPreferences.");

                        updateSchedules(schedulesJson);

                        // Ensure monitoring is active if we just set a schedule
                        if (!isRunning) {
                            startMonitoring();
                        }
                        break;
                    default:
                        Log.w(TAG, "Received unknown action: " + action);
                        if (!isRunning) {
                           startMonitoring();
                        }
                        break;
                }
            } else {
                if (!isRunning) {
                   startMonitoring();
                }
            }
        } else {
            Log.d(TAG, "Service restarted (intent is null), restarting monitoring.");
            startMonitoring();
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "Service onDestroy");
        super.onDestroy();
        stopMonitoring();
        
        // If we still have locked apps or schedules, schedule a restart
        if (!lockedApps.isEmpty() || !scheduledLocks.isEmpty()) {
            Log.d(TAG, "Service destroyed but we still have work to do. Setting up restart...");
            scheduleServiceRestart();
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.d(TAG, "onTaskRemoved called. App was swiped away.");
        super.onTaskRemoved(rootIntent);
        
        // If we still have locked apps or schedules, schedule a restart
        if (!lockedApps.isEmpty() || !scheduledLocks.isEmpty()) {
            Log.d(TAG, "Task removed but we still have work to do. Setting up restart...");
            scheduleServiceRestart();
        }
    }
    
    public void stopMonitoring() {
        Log.d(TAG, "Stopping monitoring service (and foreground state)");
        isRunning = false;
        if (handler != null) {
            handler.removeCallbacksAndMessages(null);
        }
        // When stopping, record the final app usage
        if (!lastForegroundApp.isEmpty() && lastAppChangeTime > 0) {
            long duration = System.currentTimeMillis() - lastAppChangeTime;
            if (duration > CHECK_INTERVAL_MS) { // Only record if it's significant
                sendAppChangeEvent(lastForegroundApp, duration);
            }
        }
        hideNativeOverlay();
        stopForeground(true);
        Log.d(TAG, "stopForeground(true) called.");
    }

    private void scheduleServiceRestart() {
        Log.d(TAG, "Scheduling service restart...");
        
        // Create an intent that will be fired when the alarm goes off
        Intent restartIntent = new Intent(getApplicationContext(), AppMonitoringService.class);
        restartIntent.setAction("START_SERVICE");
        restartIntent.setPackage(getPackageName());
        
        // Create a pending intent that will be triggered when the alarm goes off
        PendingIntent pendingIntent = PendingIntent.getService(
            getApplicationContext(), 
            1, 
            restartIntent, 
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Schedule the alarm to go off in 1 second
        android.app.AlarmManager alarmManager = (android.app.AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.set(
                android.app.AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + 1000,
                pendingIntent
            );
            Log.d(TAG, "Service restart scheduled in 1 second");
        } else {
            Log.e(TAG, "Failed to get AlarmManager for service restart");
        }
    }

    private void startMonitoring() {
        if (isRunning) {
            Log.d(TAG, "Service already running, skipping start");
            return;
        }
        
        Log.d(TAG, "Starting monitoring service as a foreground service");
        
        // Create a notification to keep the service in the foreground
        Notification notification = createForegroundNotification();
        Log.d(TAG, "Starting service in foreground mode");

        try {
            startForeground(NOTIFICATION_ID, notification);
            Log.d(TAG, "startForeground called successfully.");
            isRunning = true;
        } catch (Exception e) {
            Log.e(TAG, "Error starting foreground service", e);
            return;
        }

        handler.post(new Runnable() {
            @Override
            public void run() {
                if (!isRunning) return;

                String foregroundApp = getCurrentForegroundApp();
                
                if (foregroundApp != null && !foregroundApp.equals(lastForegroundApp)) {
                    Log.d(TAG, "App changed from " + lastForegroundApp + " to " + foregroundApp);
                    if (!lastForegroundApp.isEmpty() && lastAppChangeTime > 0) {
                        long duration = System.currentTimeMillis() - lastAppChangeTime;
                        // Only send event for significant usage time
                        if (duration > CHECK_INTERVAL_MS) { 
                           sendAppChangeEvent(lastForegroundApp, duration);
                        }
                    }
                    
                    // Hide overlay if we're showing it for the previous app
                    if (currentlyOverlayingPackage != null) {
                        hideNativeOverlay();
                    }
                    
                    lastForegroundApp = foregroundApp;
                    lastAppChangeTime = System.currentTimeMillis();
                    
                    // Check if the new foreground app is locked
                    if (isAppLocked(foregroundApp)) {
                        Log.d(TAG, "Showing overlay for locked app: " + foregroundApp);
                        showNativeOverlay(foregroundApp);
                        currentlyOverlayingPackage = foregroundApp;
                        sendAppBlockedEvent(foregroundApp);
                    }
                } else if (foregroundApp != null && currentlyOverlayingPackage == null && isAppLocked(foregroundApp)) {
                    // This handles the case where the app was already in foreground when it got locked
                    Log.d(TAG, "Showing overlay for already-foreground locked app: " + foregroundApp);
                    showNativeOverlay(foregroundApp);
                    currentlyOverlayingPackage = foregroundApp;
                    sendAppBlockedEvent(foregroundApp);
                }

                checkExpiredLocks();
                checkScheduledLocks();

                if (isRunning && handler != null) {
                    handler.postDelayed(this, CHECK_INTERVAL_MS);
                }
            }
        });
    }

    private void saveLockedApps() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        JSONObject json = new JSONObject(lockedApps);
        String jsonString = json.toString();
        editor.putString(PREFS_KEY, jsonString);
        editor.apply();
        Log.d(TAG, "Saved locked apps to SharedPreferences: " + jsonString);
    }

    private void loadLockedApps() {
        lockedApps.clear();
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String jsonString = prefs.getString(PREFS_KEY, null);
        if (jsonString != null) {
            try {
                JSONObject json = new JSONObject(jsonString);
                Iterator<String> keys = json.keys();
                while(keys.hasNext()) {
                    String key = keys.next();
                    lockedApps.put(key, json.getLong(key));
                }
                Log.d(TAG, "Loaded " + lockedApps.size() + " locked apps from SharedPreferences.");
            } catch (Exception e) {
                Log.e(TAG, "Failed to load locked apps from SharedPreferences", e);
            }
        } else {
            Log.d(TAG, "No locked apps found in SharedPreferences.");
        }
    }

    private boolean isAppLocked(String packageName) {
        if (packageName == null) return false;
        Long unlockTime = lockedApps.get(packageName);
        if (unlockTime == null) return false;
        if (unlockTime == -1L) return true;
        return System.currentTimeMillis() < unlockTime;
    }

    private String getCurrentForegroundApp() {
        long endTime = System.currentTimeMillis();
        long beginTime = endTime - 10000;
        UsageEvents.Event event = new UsageEvents.Event();
        UsageEvents usageEvents = usageStatsManager.queryEvents(beginTime, endTime);
        String currentApp = null;
        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event);
            if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                currentApp = event.getPackageName();
            }
        }
        return currentApp;
    }

    private void sendAppChangeEvent(String packageName, long durationMs) {
        WritableMap params = Arguments.createMap();
        params.putString("packageName", packageName);
        params.putDouble("durationMs", durationMs);
        sendEvent("onAppChange", params);
    }

    private void sendAppBlockedEvent(String packageName) {
        sendEvent("onAppBlocked", packageName);
    }

    private void sendEvent(String eventName, String packageName) {
        WritableMap params = Arguments.createMap();
        params.putString("packageName", packageName);
        sendEvent(eventName, params);
    }

    private void sendEvent(String eventName, WritableMap params) {
        try {
            ReactNativeHost reactNativeHost = ((ReactApplication) getApplication()).getReactNativeHost();
            if (reactNativeHost.hasInstance()) {
                reactNativeHost.getReactInstanceManager().getCurrentReactContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
                Log.d(TAG, "Sent event " + eventName + " with params: " + params.toString());
            } else {
                Log.w(TAG, "Cannot send event, no React instance running.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception while sending event " + eventName, e);
        }
    }

    private void showNativeOverlay(String packageName) {
        if (overlayView != null) {
            return;
        }

        try {
            // Create a layout for our overlay
            FrameLayout overlayLayout = new FrameLayout(this);
            overlayLayout.setBackgroundColor(Color.parseColor("#FF8C00")); // Orange background
            
            // Create a vertical layout for content
            LinearLayout contentLayout = new LinearLayout(this);
            contentLayout.setOrientation(LinearLayout.VERTICAL);
            contentLayout.setGravity(Gravity.CENTER);
            contentLayout.setPadding(50, 100, 50, 100);
            
            // Create a circular background for the lock icon
            FrameLayout iconContainer = new FrameLayout(this);
            FrameLayout.LayoutParams iconContainerParams = new FrameLayout.LayoutParams(
                240, 240
            );
            iconContainerParams.gravity = Gravity.CENTER_HORIZONTAL;
            iconContainer.setLayoutParams(iconContainerParams);
            iconContainer.setBackgroundColor(Color.parseColor("#33FFFFFF")); // Semi-transparent white
            
            // Set the container to be circular
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                iconContainer.setBackground(getDrawable(R.drawable.circle_background));
            } else {
                iconContainer.setBackgroundColor(Color.parseColor("#33FFFFFF"));
            }
            
            // Create the lock icon
            ImageView lockIcon = new ImageView(this);
            FrameLayout.LayoutParams lockIconParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            );
            lockIconParams.gravity = Gravity.CENTER;
            lockIcon.setLayoutParams(lockIconParams);
            lockIcon.setImageResource(android.R.drawable.ic_lock_lock);
            lockIcon.setColorFilter(Color.WHITE);
            iconContainer.addView(lockIcon);
            
            // Add the icon container to the content layout
            contentLayout.addView(iconContainer);
            
            // Add some spacing
            Space space1 = new Space(this);
            space1.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 40
            ));
            contentLayout.addView(space1);
            
            // Create the app name text
            TextView appNameText = new TextView(this);
            appNameText.setText(packageName + " is locked");
            appNameText.setTextColor(Color.WHITE);
            appNameText.setTextSize(24);
            appNameText.setGravity(Gravity.CENTER);
            appNameText.setTypeface(null, Typeface.BOLD);
            contentLayout.addView(appNameText);
            
            // Add some spacing
            Space space2 = new Space(this);
            space2.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 40
            ));
            contentLayout.addView(space2);
            
            // Create a container for the quote
            FrameLayout quoteContainer = new FrameLayout(this);
            quoteContainer.setBackgroundColor(Color.parseColor("#33FFFFFF")); // Semi-transparent white
            quoteContainer.setPadding(30, 30, 30, 30);
            
            // Create the quote text
            TextView quoteText = new TextView(this);
            quoteText.setText("\"Focus on what matters most today.\"");
            quoteText.setTextColor(Color.WHITE);
            quoteText.setTextSize(18);
            quoteText.setGravity(Gravity.CENTER);
            quoteText.setTypeface(null, Typeface.ITALIC);
            quoteContainer.addView(quoteText);
            
            // Add the quote container to the content layout
            contentLayout.addView(quoteContainer);
            
            // Add some spacing
            Space space3 = new Space(this);
            space3.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 40
            ));
            contentLayout.addView(space3);
            
            // Create a container for emergency unlock chances
            FrameLayout chancesContainer = new FrameLayout(this);
            chancesContainer.setBackgroundColor(Color.parseColor("#33FFFFFF")); // Semi-transparent white
            chancesContainer.setPadding(30, 20, 30, 20);
            
            // Create the emergency unlock chances text
            TextView chancesText = new TextView(this);
            chancesText.setText("Emergency unlock chances remaining this week: 3");
            chancesText.setTextColor(Color.WHITE);
            chancesText.setTextSize(16);
            chancesText.setGravity(Gravity.CENTER);
            chancesContainer.addView(chancesText);
            
            // Add the chances container to the content layout
            contentLayout.addView(chancesContainer);
            
            // Add some spacing
            Space space4 = new Space(this);
            space4.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 40
            ));
            contentLayout.addView(space4);
            
            // Create the emergency unlock button
            TextView emergencyButton = new TextView(this);
            emergencyButton.setText("Emergency Unlock");
            emergencyButton.setTextColor(Color.parseColor("#FF8C00")); // Orange text
            emergencyButton.setBackgroundColor(Color.WHITE);
            emergencyButton.setTextSize(18);
            emergencyButton.setTypeface(null, Typeface.BOLD);
            emergencyButton.setPadding(60, 30, 60, 30);
            emergencyButton.setGravity(Gravity.CENTER);
            
            // Make the button look rounded
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                emergencyButton.setBackground(getDrawable(R.drawable.rounded_button));
            }
            
            // Add onClick listener to the button
            emergencyButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    // Remove the app from locked apps
                    if (currentlyOverlayingPackage != null) {
                        lockedApps.remove(currentlyOverlayingPackage);
                        saveLockedApps();
                        hideNativeOverlay();
                        
                        // Send event to React Native
                        sendEvent("onEmergencyUnlock", currentlyOverlayingPackage);
                    }
                }
            });
            
            // Add the button to the content layout
            contentLayout.addView(emergencyButton);
            
            // Add the content layout to the main overlay layout
            overlayLayout.addView(contentLayout, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
                Gravity.CENTER
            ));
            
            // Use the layout as our overlay view
            overlayView = overlayLayout;
            windowManager.addView(overlayView, overlayParams);
            currentlyOverlayingPackage = packageName;
            Log.i(TAG, "Enhanced overlay ADDED for " + packageName);
        } catch (Exception e) {
            Log.e(TAG, "CRITICAL ERROR adding overlay view for " + packageName, e);
            overlayView = null;
        }
    }

    private void hideNativeOverlay() {
        if (overlayView == null) {
            return;
        }
        try {
            windowManager.removeView(overlayView);
            Log.i(TAG, "Overlay REMOVED successfully for " + currentlyOverlayingPackage);
        } catch (Exception e) {
            Log.e(TAG, "CRITICAL ERROR removing overlay view for " + currentlyOverlayingPackage, e);
        } finally {
            overlayView = null;
            currentlyOverlayingPackage = null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "FocusGuard Background Service";
            String description = "Channel for FocusGuard app monitoring service";
            int importance = NotificationManager.IMPORTANCE_LOW;
            NotificationChannel channel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, name, importance);
            channel.setDescription(description);
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createForegroundNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);
        
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("FocusGuard Active")
            .setContentText("Monitoring app usage")
            .setSmallIcon(R.drawable.ic_launcher_background)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW);
            
        return builder.build();
    }

    private void updateSchedules(String jsonString) {
        if (jsonString == null) {
            Log.w(TAG, "Received null JSON string for schedules.");
            return;
        }
        try {
            JSONArray jsonArray = new JSONArray(jsonString);
            scheduledLocks.clear();
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject jsonObject = jsonArray.getJSONObject(i);
                // Simple parsing, assuming structure from JS. Robust parsing would be needed for production.
                ScheduledLock lock = new ScheduledLock(jsonObject);
                if (lock.isEnabled) {
                    scheduledLocks.add(lock);
                }
            }
            Log.d(TAG, "Successfully parsed and updated " + scheduledLocks.size() + " schedules.");
        } catch (JSONException e) {
            Log.e(TAG, "Failed to parse schedules JSON.", e);
        }
    }
    
    private void checkScheduledLocks() {
        if (scheduledLocks.isEmpty()) {
            Log.d(TAG, "No schedules to check");
            return;
        }

        Calendar now = Calendar.getInstance(TimeZone.getDefault());
        int dayOfWeek = now.get(Calendar.DAY_OF_WEEK); // Sunday = 1, Saturday = 7
        int currentHour = now.get(Calendar.HOUR_OF_DAY);
        int currentMinute = now.get(Calendar.MINUTE);

        Log.d(TAG, String.format("Checking schedules at day %d, time %02d:%02d", dayOfWeek, currentHour, currentMinute));

        for (ScheduledLock schedule : scheduledLocks) {
            Log.d(TAG, "Checking schedule: " + schedule.id);
            Log.d(TAG, String.format("Schedule times: %02d:%02d - %02d:%02d", 
                schedule.startHour, schedule.startMinute, schedule.endHour, schedule.endMinute));
            Log.d(TAG, "Selected days: " + Arrays.toString(schedule.selectedDays));
            
            if (schedule.isTimeWithinSchedule(now, dayOfWeek, currentHour, currentMinute)) {
                Log.d(TAG, "Schedule is active now");
                for (String packageName : schedule.appPackageNames) {
                    // If app is within a schedule, lock it "indefinitely" (-1L)
                    // The lock will be lifted when it's no longer within the schedule.
                    if (!isAppLocked(packageName)) {
                        Log.d(TAG, "Scheduled lock activating for: " + packageName);
                        lockedApps.put(packageName, -1L);
                    }
                }
            } else {
                Log.d(TAG, "Schedule is not active now");
                // If the app is NOT within schedule anymore, but was previously locked by a schedule
                for (String packageName : schedule.appPackageNames) {
                    if (isAppLocked(packageName) && lockedApps.get(packageName) == -1L) {
                        Log.d(TAG, "Scheduled lock de-activating for: " + packageName);
                        lockedApps.remove(packageName);
                        if (packageName.equals(currentlyOverlayingPackage)) {
                            hideNativeOverlay();
                        }
                    }
                }
            }
        }
    }

    private void loadSchedules() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String schedulesJson = prefs.getString(PREFS_KEY_SCHEDULES, null);
        Log.d(TAG, "Loading schedules from SharedPreferences.");
        updateSchedules(schedulesJson);
    }
    
    private void checkExpiredLocks() {
        Log.d(TAG, "Checking for expired locks...");
        long currentTime = System.currentTimeMillis();
        List<String> expiredApps = new ArrayList<>();
        
        // Log all current locks
        Log.d(TAG, "Current locks (" + lockedApps.size() + "):");
        for (Map.Entry<String, Long> entry : lockedApps.entrySet()) {
            String packageName = entry.getKey();
            Long unlockTime = entry.getValue();
            if (unlockTime == -1L) {
                Log.d(TAG, "  - " + packageName + ": indefinite lock");
            } else {
                long remainingMs = unlockTime - currentTime;
                Log.d(TAG, "  - " + packageName + ": unlock in " + (remainingMs / 1000) + " seconds (at " + new Date(unlockTime) + ")");
            }
        }
        
        // Find all apps with expired locks
        for (Map.Entry<String, Long> entry : lockedApps.entrySet()) {
            String packageName = entry.getKey();
            Long unlockTime = entry.getValue();
            
            // Skip indefinite locks (-1L)
            if (unlockTime != null && unlockTime != -1L && currentTime >= unlockTime) {
                Log.d(TAG, "Lock expired for app: " + packageName + " (current time: " + new Date(currentTime) + ", unlock time: " + new Date(unlockTime) + ")");
                expiredApps.add(packageName);
            }
        }
        
        // Remove expired locks
        for (String packageName : expiredApps) {
            Log.d(TAG, "Removing expired lock for: " + packageName);
            lockedApps.remove(packageName);
            
            // Hide overlay if it's currently showing for this app
            if (packageName.equals(currentlyOverlayingPackage)) {
                Log.d(TAG, "Hiding overlay for unlocked app: " + packageName);
                hideNativeOverlay();
            }
            
            // Also call the native module's unlockApp method to ensure it's unlocked
            try {
                Intent unlockIntent = new Intent(getApplicationContext(), AppMonitoringService.class);
                unlockIntent.setAction("UNLOCK_APP");
                unlockIntent.putExtra("packageName", packageName);
                startService(unlockIntent);
                Log.d(TAG, "Sent UNLOCK_APP intent for: " + packageName);
            } catch (Exception e) {
                Log.e(TAG, "Failed to send unlock intent", e);
            }
        }
        
        // Save changes if any locks were removed
        if (!expiredApps.isEmpty()) {
            Log.d(TAG, "Removed " + expiredApps.size() + " expired locks");
            saveLockedApps();
        } else {
            Log.d(TAG, "No expired locks found");
        }
    }
}

// Helper class to represent a scheduled lock
class ScheduledLock {
    private static final String TAG = "ScheduledLock";
    String id;
    List<String> appPackageNames = new ArrayList<>();
    boolean isEnabled;
    // We will simplify time storage for native side
    int startHour, startMinute, endHour, endMinute;
    boolean[] selectedDays = new boolean[7]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat

    ScheduledLock(JSONObject jsonObject) throws JSONException {
        this.id = jsonObject.getString("id");
        this.isEnabled = jsonObject.getBoolean("isEnabled");
        
        JSONArray packages = jsonObject.getJSONArray("appPackageNames");
        for(int i=0; i<packages.length(); i++) {
            appPackageNames.add(packages.getString(i));
        }
        
        JSONObject scheduleConfig = jsonObject.getJSONObject("scheduleConfig");
        
        // Dates are parsed as ISO-8601 strings e.g., "2024-06-05T09:00:00.000Z"
        String startTimeStr = scheduleConfig.getString("startTime");
        String endTimeStr = scheduleConfig.getString("endTime");

        try {
            // Dates are parsed as ISO-8601 strings (e.g., "2024-06-05T09:00:00.000Z") from JS, which are in UTC.
            // We need to convert them to the phone's local timezone for correct time comparison.
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
            sdf.setTimeZone(TimeZone.getTimeZone("UTC"));

            Date startDate = sdf.parse(startTimeStr);
            Date endDate = sdf.parse(endTimeStr);

            Calendar cal = Calendar.getInstance(); // Gets calendar in local timezone

            cal.setTime(startDate);
            this.startHour = cal.get(Calendar.HOUR_OF_DAY);
            this.startMinute = cal.get(Calendar.MINUTE);

            cal.setTime(endDate);
            this.endHour = cal.get(Calendar.HOUR_OF_DAY);
            this.endMinute = cal.get(Calendar.MINUTE);
            
            Log.d(TAG, "Parsed schedule " + this.id + ": Local start " + this.startHour + ":" + this.startMinute + ", end " + this.endHour + ":" + this.endMinute);

        } catch (ParseException e) {
            Log.e(TAG, "Failed to parse date string for schedule " + this.id, e);
            // Fallback to incorrect simple parsing to avoid crash, though schedule will be wrong.
            this.startHour = Integer.parseInt(startTimeStr.substring(11, 13));
            this.startMinute = Integer.parseInt(startTimeStr.substring(14, 16));
            this.endHour = Integer.parseInt(endTimeStr.substring(11, 13));
            this.endMinute = Integer.parseInt(endTimeStr.substring(14, 16));
        }

        JSONArray days = scheduleConfig.getJSONArray("selectedDays");
        // The JS boolean array is [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
        // The Java Calendar day of week is [Sun=1, Mon=2, ..., Sat=7]
        // We will align our array to match Calendar: index 0=Sun, 1=Mon, etc.
        this.selectedDays = new boolean[8]; // Using 1-based indexing for days
        this.selectedDays[2] = days.getBoolean(0); // Mon
        this.selectedDays[3] = days.getBoolean(1); // Tue
        this.selectedDays[4] = days.getBoolean(2); // Wed
        this.selectedDays[5] = days.getBoolean(3); // Thu
        this.selectedDays[6] = days.getBoolean(4); // Fri
        this.selectedDays[7] = days.getBoolean(5); // Sat
        this.selectedDays[1] = days.getBoolean(6); // Sun
    }
    
    boolean isTimeWithinSchedule(Calendar now, int dayOfWeek, int currentHour, int currentMinute) {
        // Check if any days are selected
        boolean anyDaySelected = false;
        for (int i = 1; i < selectedDays.length; i++) {  // Start from 1 since we use 1-based indexing
            if (selectedDays[i]) {
                anyDaySelected = true;
                break;
            }
        }

        // If no days are selected, treat all days as selected
        if (!anyDaySelected) {
            Log.d(TAG, "No days selected, treating all days as active");
            // Create array with 8 elements to match 1-based indexing
            selectedDays = new boolean[8];
            for (int i = 1; i < 8; i++) {  // Fill indices 1-7 with true
                selectedDays[i] = true;
            }
        }

        // Check if the schedule is active for the current day of the week
        int currentTimeInMinutes = currentHour * 60 + currentMinute;
        int startTimeInMinutes = startHour * 60 + startMinute;
        int endTimeInMinutes = endHour * 60 + endMinute;

        Log.d(TAG, String.format("Checking schedule: day=%d, current=%02d:%02d, start=%02d:%02d, end=%02d:%02d",
            dayOfWeek, currentHour, currentMinute, startHour, startMinute, endHour, endMinute));
        Log.d(TAG, "Selected days: " + Arrays.toString(selectedDays));

        boolean isOvernight = startTimeInMinutes > endTimeInMinutes;

        if (isOvernight) {
            // Overnight schedule, e.g., Mon 10 PM - Tue 2 AM
            // Check if current time is after start time on the selected day
            if (selectedDays[dayOfWeek] && currentTimeInMinutes >= startTimeInMinutes) {
                Log.d(TAG, "Schedule active - overnight, after start time");
                return true;
            }
            // Check if current time is before end time on the day AFTER the selected day
            int previousDayOfWeek = (dayOfWeek == 1) ? 7 : dayOfWeek - 1;
            if (selectedDays[previousDayOfWeek] && currentTimeInMinutes < endTimeInMinutes) {
                Log.d(TAG, "Schedule active - overnight, before end time next day");
                return true;
            }
        } else {
            // Same-day schedule
            if (selectedDays[dayOfWeek] && currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes) {
                Log.d(TAG, "Schedule active - same day schedule");
                return true;
            }
        }
        
        Log.d(TAG, "Schedule not active at this time");
        return false;
    }
}