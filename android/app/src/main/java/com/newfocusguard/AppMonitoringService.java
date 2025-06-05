package com.newfocusguard;

import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.WindowManager;
import android.view.View;
import android.graphics.PixelFormat;
import android.graphics.Color;
import android.os.Build;

import java.util.HashMap;
import java.util.Map;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class AppMonitoringService extends Service {
    private static final String TAG = "AppMonitoringService";
    private static final long CHECK_INTERVAL_MS = 1000; // Check every second
    private Handler handler;
    private boolean isRunning = false;
    private String lastForegroundApp = "";
    private UsageStatsManager usageStatsManager;
    private Map<String, Long> lockedApps = new HashMap<>(); // packageName -> unlock time (in ms)

    // Overlay related members
    private WindowManager windowManager;
    private View overlayView;
    private WindowManager.LayoutParams overlayParams;
    private String currentlyOverlayingPackage = null;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service onCreate");
        handler = new Handler(Looper.getMainLooper());
        usageStatsManager = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);

        // Define overlay parameters (similar to OverlayPermissionModule)
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
        
        if (intent != null && intent.getAction() != null) {
            switch (intent.getAction()) {
                case "LOCK_APP":
                    String packageToLock = intent.getStringExtra("packageName");
                    long duration = intent.getLongExtra("duration", -1);
                    Log.d(TAG, "Received LOCK_APP for: " + packageToLock + " with duration: " + duration);
                    if (duration > 0) {
                        lockedApps.put(packageToLock, System.currentTimeMillis() + duration * 60 * 1000);
                    } else {
                        lockedApps.put(packageToLock, -1L); // -1 means indefinite lock
                    }
                    break;
                case "UNLOCK_APP":
                    String packageToUnlock = intent.getStringExtra("packageName");
                    Log.d(TAG, "Received UNLOCK_APP for: " + packageToUnlock);
                    lockedApps.remove(packageToUnlock);
                    // If this was the app being overlaid, hide the overlay
                    if (packageToUnlock != null && packageToUnlock.equals(currentlyOverlayingPackage)) {
                        hideNativeOverlay();
                    }
                    break;
                default:
                    startMonitoring();
                    break;
            }
        } else {
            startMonitoring();
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    public void stopMonitoring() {
        Log.d(TAG, "Stopping monitoring service");
        isRunning = false;
        if (handler != null) {
            handler.removeCallbacksAndMessages(null);
        }
        hideNativeOverlay();
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "Service onDestroy");
        super.onDestroy();
        stopMonitoring();
    }

    private void startMonitoring() {
        if (isRunning) {
            Log.d(TAG, "Service already running, skipping start");
            return;
        }
        
        Log.d(TAG, "Starting monitoring service");
        isRunning = true;

        handler.post(new Runnable() {
            @Override
            public void run() {
                if (!isRunning) return;

                String currentApp = getCurrentForegroundApp();
                if (currentApp != null && !currentApp.equals(lastForegroundApp)) {
                    Log.d(TAG, "Foreground app changed from: " + lastForegroundApp + " to: " + currentApp);
                    lastForegroundApp = currentApp;

                    // If an overlay is shown for a package that is NO LONGER the current foreground app, hide it.
                    if (currentlyOverlayingPackage != null && !currentlyOverlayingPackage.equals(currentApp)) {
                        Log.d(TAG, "Different app ("+currentApp+") in foreground, removing overlay for " + currentlyOverlayingPackage);
                        hideNativeOverlay();
                    }
                    
                    if (isAppLocked(currentApp)) {
                        Log.d(TAG, "App is locked: " + currentApp);
                        showNativeOverlay(currentApp);
                        sendAppBlockedEvent(currentApp);
                    } else {
                        Log.d(TAG, "App is not locked: " + currentApp);
                        if (currentlyOverlayingPackage != null && currentlyOverlayingPackage.equals(currentApp)) {
                           hideNativeOverlay();
                        }
                        sendAppChangeEvent(currentApp);
                    }
                } else if (currentApp != null && isAppLocked(currentApp) && overlayView == null) {
                    Log.d(TAG, "Locked app " + currentApp + " in foreground, but no overlay. Attempting to show.");
                    showNativeOverlay(currentApp);
                    sendAppBlockedEvent(currentApp);
                }

                if (isRunning && handler != null) {
                    handler.postDelayed(this, CHECK_INTERVAL_MS);
                }
            }
        });
    }

    private boolean isAppLocked(String packageName) {
        Long unlockTime = lockedApps.get(packageName);
        if (unlockTime == null) return false;
        if (unlockTime == -1L) return true; // Indefinite lock
        boolean isLocked = System.currentTimeMillis() < unlockTime;
        Log.d(TAG, "Checking lock status for " + packageName + ": " + isLocked + 
              " (unlock time: " + unlockTime + ", current time: " + System.currentTimeMillis() + ")");
        return isLocked;
    }

    private String getCurrentForegroundApp() {
        long endTime = System.currentTimeMillis();
        long beginTime = endTime - 10000; // Look at last 10 seconds

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
        Log.d(TAG, "Attempting to send app change event for: " + packageName);
        WritableMap params = Arguments.createMap();
        params.putString("packageName", packageName);
        
        // Get the ReactContext from MainApplication
        MainApplication application = (MainApplication) getApplication();
        if (application.getReactNativeHost().getReactInstanceManager().getCurrentReactContext() != null) {
            application.getReactNativeHost()
                    .getReactInstanceManager()
                    .getCurrentReactContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onAppChange", params);
        } else {
            Log.e(TAG, "Failed to send app change event: React context is null");
        }
    }

    private void sendAppBlockedEvent(String packageName) {
        Log.d(TAG, "Attempting to send app blocked event for: " + packageName);
        WritableMap params = Arguments.createMap();
        params.putString("packageName", packageName);
        Long unlockTime = lockedApps.get(packageName);
        if (unlockTime != null && unlockTime > 0) {
            params.putDouble("remainingTime", (unlockTime - System.currentTimeMillis()) / 1000.0);
        }
        
        MainApplication application = (MainApplication) getApplication();
        if (application.getReactNativeHost().getReactInstanceManager().getCurrentReactContext() != null) {
            application.getReactNativeHost()
                    .getReactInstanceManager()
                    .getCurrentReactContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onAppBlocked", params);
        } else {
            Log.e(TAG, "Failed to send app blocked event: React context is null");
        }
    }

    // Native Overlay Methods (adapted from OverlayPermissionModule)
    private void showNativeOverlay(String packageName) {
        Log.d(TAG, "Enter showNativeOverlay for: " + packageName); // Entry log
        if (overlayView != null) {
            Log.d(TAG, "showNativeOverlay: Overlay view already exists for " + currentlyOverlayingPackage + ". current target: " + packageName);
            // If it's for a different package, update, otherwise do nothing.
            if (currentlyOverlayingPackage != null && !currentlyOverlayingPackage.equals(packageName)) {
                Log.d(TAG, "showNativeOverlay: Hiding existing overlay for " + currentlyOverlayingPackage + " before showing for " + packageName);
                hideNativeOverlay(); 
            } else if (currentlyOverlayingPackage != null && currentlyOverlayingPackage.equals(packageName)) {
                Log.d(TAG, "showNativeOverlay: Overlay already showing for correct package " + packageName);
                return;
            }
        }
        
        Log.d(TAG, "showNativeOverlay: Creating and adding overlay view for " + packageName);
        // Consider using application context if this service context causes issues with UI components
        overlayView = new View(this); 
        overlayView.setBackgroundColor(Color.argb(200, 0, 0, 0)); // Semi-transparent black

        try {
            Log.d(TAG, "showNativeOverlay: Attempting windowManager.addView for " + packageName);
            windowManager.addView(overlayView, overlayParams);
            currentlyOverlayingPackage = packageName;
            Log.i(TAG, "showNativeOverlay: Overlay ADDED successfully for " + packageName); // Changed to Info level
        } catch (Exception e) {
            Log.e(TAG, "showNativeOverlay: CRITICAL ERROR adding overlay view for " + packageName, e);
            overlayView = null; // Ensure it's null if addView failed
            currentlyOverlayingPackage = null;
        }
        Log.d(TAG, "Exit showNativeOverlay for: " + packageName); // Exit log
    }

    private void hideNativeOverlay() {
        Log.d(TAG, "Enter hideNativeOverlay for: " + (currentlyOverlayingPackage != null ? currentlyOverlayingPackage : "null")); // Entry log, check for null
        if (overlayView == null) {
            Log.d(TAG, "hideNativeOverlay: Overlay view is already null.");
            return;
        }
        Log.d(TAG, "hideNativeOverlay: Attempting windowManager.removeView for " + currentlyOverlayingPackage);
        try {
            windowManager.removeView(overlayView);
            Log.i(TAG, "hideNativeOverlay: Overlay REMOVED successfully for " + currentlyOverlayingPackage); // Changed to Info level
        } catch (Exception e) {
            Log.e(TAG, "hideNativeOverlay: CRITICAL ERROR removing overlay view for " + currentlyOverlayingPackage, e);
        } finally {
            overlayView = null;
            currentlyOverlayingPackage = null;
            Log.d(TAG, "hideNativeOverlay: Overlay and currentlyOverlayingPackage set to null."); // Clarified log
        }
        Log.d(TAG, "Exit hideNativeOverlay"); // Exit log
    }
} 