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

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class AppMonitoringService extends Service {
    private static final String TAG = "AppMonitoringService";
    private static final long CHECK_INTERVAL_MS = 1000;
    private static final String NOTIFICATION_CHANNEL_ID = "FocusGuardChannel";
    private static final int NOTIFICATION_ID = 1867;
    private static final String PREFS_NAME = "FocusGuardLocks";
    private static final String PREFS_KEY = "lockedAppsMap";

    private Handler handler;
    private boolean isRunning = false;
    private String lastForegroundApp = "";
    private UsageStatsManager usageStatsManager;
    private Map<String, Long> lockedApps = new HashMap<>();

    private WindowManager windowManager;
    private View overlayView;
    private WindowManager.LayoutParams overlayParams;
    private String currentlyOverlayingPackage = null;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service onCreate");
        loadLockedApps();
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
        
        // If we still have locked apps, schedule a restart
        if (!lockedApps.isEmpty()) {
            Log.d(TAG, "Service destroyed but we still have locked apps. Setting up restart...");
            scheduleServiceRestart();
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.d(TAG, "onTaskRemoved called. App was swiped away.");
        super.onTaskRemoved(rootIntent);
        
        // If we still have locked apps, schedule a restart
        if (!lockedApps.isEmpty()) {
            Log.d(TAG, "Task removed but we still have locked apps. Setting up restart...");
            scheduleServiceRestart();
        }
    }
    
    public void stopMonitoring() {
        Log.d(TAG, "Stopping monitoring service (and foreground state)");
        isRunning = false;
        if (handler != null) {
            handler.removeCallbacksAndMessages(null);
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
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("FocusGuard Active")
            .setContentText("App monitoring is active to help you focus.")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();

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
                String currentApp = getCurrentForegroundApp();
                if (currentApp != null && !currentApp.equals(lastForegroundApp)) {
                    Log.d(TAG, "Foreground app changed from: " + lastForegroundApp + " to: " + currentApp);
                    lastForegroundApp = currentApp;

                    if (currentlyOverlayingPackage != null && !currentlyOverlayingPackage.equals(currentApp)) {
                        hideNativeOverlay();
                    }
                    
                    if (isAppLocked(currentApp)) {
                        showNativeOverlay(currentApp);
                        sendAppBlockedEvent(currentApp);
                    } else {
                        if (currentlyOverlayingPackage != null && currentlyOverlayingPackage.equals(currentApp)) {
                           hideNativeOverlay();
                        }
                        sendAppChangeEvent(currentApp);
                    }
                } else if (currentApp != null && isAppLocked(currentApp) && overlayView == null) {
                    showNativeOverlay(currentApp);
                    sendAppBlockedEvent(currentApp);
                }

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

    private void sendAppChangeEvent(String packageName) {
        sendEvent("onAppChange", packageName);
    }

    private void sendAppBlockedEvent(String packageName) {
        sendEvent("onAppBlocked", packageName);
    }

    private void sendEvent(String eventName, String packageName) {
        WritableMap params = Arguments.createMap();
        params.putString("packageName", packageName);
        params.putString("eventType", eventName);

        String headlessTaskKey = "AppBlocked";
        Bundle bundle = Arguments.toBundle(params);
        if (bundle == null) bundle = new Bundle();
        bundle.putString("taskName", headlessTaskKey);

        Intent serviceIntent = new Intent(getApplicationContext(), FocusGuardHeadlessTaskService.class);
        serviceIntent.putExtras(bundle);
        
        try {
            getApplicationContext().startService(serviceIntent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start FocusGuardHeadlessTaskService for " + headlessTaskKey, e);
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
}