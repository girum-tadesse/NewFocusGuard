package com.newfocusguard;

import android.content.Intent;
import android.provider.Settings;
import android.app.AppOpsManager;
import android.content.Context;
import android.os.Process;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = AppMonitoringModule.NAME)
public class AppMonitoringModule extends ReactContextBaseJavaModule {
    public static final String NAME = "AppMonitoringModule";
    private static final String TAG = "FocusGuardAppMonitor";
    private final ReactApplicationContext reactContext;
    private Intent serviceIntent;

    public AppMonitoringModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.serviceIntent = new Intent(reactContext, AppMonitoringService.class);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void startMonitoring(Promise promise) {
        try {
            // Check for usage stats permission
            if (!hasUsageStatsPermission()) {
                // Open usage access settings if permission not granted
                requestUsageStatsPermission(promise);
                return;
            }

            reactContext.startService(serviceIntent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("START_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void stopMonitoring(Promise promise) {
        try {
            reactContext.stopService(serviceIntent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("STOP_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void isMonitoring(Promise promise) {
        // TODO: Implement service status check
        promise.resolve(true);
    }

    @ReactMethod
    public void lockApp(String packageName, Double duration, Promise promise) {
        try {
            // Check for usage stats permission
            if (!hasUsageStatsPermission()) {
                promise.reject("PERMISSION_DENIED", "Usage stats permission not granted");
                return;
            }

            Intent lockIntent = new Intent(reactContext, AppMonitoringService.class);
            lockIntent.setAction("LOCK_APP");
            lockIntent.putExtra("packageName", packageName);
            if (duration != null) {
                lockIntent.putExtra("duration", duration.longValue());
            }
            reactContext.startService(lockIntent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("LOCK_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void unlockApp(String packageName, Promise promise) {
        try {
            Intent unlockIntent = new Intent(reactContext, AppMonitoringService.class);
            unlockIntent.setAction("UNLOCK_APP");
            unlockIntent.putExtra("packageName", packageName);
            reactContext.startService(unlockIntent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("UNLOCK_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void hasUsageStatsPermission(Promise promise) {
        Log.d(TAG, "Native: ReactMethod hasUsageStatsPermission called, invoking private method.");
        promise.resolve(hasUsageStatsPermission());
    }

    @ReactMethod
    public void requestUsageStatsPermission(Promise promise) {
        Log.d(TAG, "Native: requestUsageStatsPermission called. Opening settings.");
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("PERMISSION_ERROR", e.getMessage(), e);
        }
    }

    private boolean hasUsageStatsPermission() {
        Log.d(TAG, "Native: hasUsageStatsPermission() called");
        try {
            AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
            if (appOps == null) {
                Log.e(TAG, "Native: AppOpsManager is null, cannot check permission.");
                return false;
            }
            // Note: using getApplicationContext() for getPackageName() just to be absolutely sure about the context.
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                    Process.myUid(), reactContext.getApplicationContext().getPackageName());
            
            Log.d(TAG, "Native: UsageStats AppOpsManager mode: " + mode + " (MODE_ALLOWED is " + AppOpsManager.MODE_ALLOWED + ")");

            if (mode == AppOpsManager.MODE_ERRORED) {
                 Log.w(TAG, "Native: AppOpsManager returned MODE_ERRORED. This can happen if the permission is not declared in AndroidManifest.xml");
            }

            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            Log.e(TAG, "Native: Exception in hasUsageStatsPermission()", e);
            return false;
        }
    }
} 