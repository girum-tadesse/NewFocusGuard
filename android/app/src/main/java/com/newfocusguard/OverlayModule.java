package com.newfocusguard;

import android.app.Activity;
import android.content.Context;
import android.graphics.PixelFormat;
import android.os.Build;
import android.util.Log;
import android.view.WindowManager;
import android.widget.FrameLayout;

import com.facebook.react.ReactRootView;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class OverlayModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private static final String TAG = "OverlayModule";
    private ReactRootView overlayView;
    private WindowManager windowManager;
    private WindowManager.LayoutParams params;
    private boolean isOverlayShowing = false;

    public OverlayModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addLifecycleEventListener(this);
        windowManager = (WindowManager) reactContext.getSystemService(Context.WINDOW_SERVICE);
        
        // Setup window parameters
        params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ?
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY :
                WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
    }

    @Override
    public String getName() {
        return "OverlayModule";
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter
    }

    @ReactMethod
    public void removeListeners(int count) {
        // Keep: Required for RN built in Event Emitter
    }

    @ReactMethod
    public void showOverlay(final String appName, final String timeRemaining, final int emergencyUnlockChances, final String quote) {
        if (isOverlayShowing) {
            return;
        }

        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    ReactApplicationContext context = getReactApplicationContext();
                    if (context == null || !context.hasActiveReactInstance()) {
                        Log.e(TAG, "Cannot show overlay: React context is null or has no active instance");
                        return;
                    }

                    // Get the React instance manager
                    ReactInstanceManager reactInstanceManager = null;
                    
                    // Try to get it from the application
                    Context appContext = context.getApplicationContext();
                    if (appContext instanceof ReactApplication) {
                        reactInstanceManager = ((ReactApplication) appContext).getReactNativeHost().getReactInstanceManager();
                    }
                    
                    // If still null, try to get it from the current activity
                    if (reactInstanceManager == null) {
                        Activity currentActivity = getCurrentActivity();
                        if (currentActivity instanceof ReactActivity) {
                            Context activityContext = currentActivity.getApplicationContext();
                            if (activityContext instanceof ReactApplication) {
                                reactInstanceManager = ((ReactApplication) activityContext).getReactNativeHost().getReactInstanceManager();
                            }
                        }
                    }
                    
                    if (reactInstanceManager == null) {
                        Log.e(TAG, "Failed to get ReactInstanceManager");
                        return;
                    }

                    // Create a new ReactRootView
                    overlayView = new ReactRootView(context);
                    
                    // Start the React application
                    overlayView.startReactApplication(
                        reactInstanceManager,
                        "LockOverlay", // This must match the component registered in AppRegistry
                        null // Pass null instead of props.toHashMap() which is causing the error
                    );

                    // Add the view to the window
                    windowManager.addView(overlayView, params);
                    isOverlayShowing = true;
                    Log.d(TAG, "React overlay added successfully for " + appName);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to show React overlay", e);
                }
            }
        });
    }

    @ReactMethod
    public void hideOverlay() {
        if (!isOverlayShowing || overlayView == null) {
            return;
        }

        UiThreadUtil.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    windowManager.removeView(overlayView);
                    overlayView = null;
                    isOverlayShowing = false;
                    Log.d(TAG, "React overlay removed successfully");
                } catch (Exception e) {
                    Log.e(TAG, "Failed to remove React overlay", e);
                }
            }
        });
    }

    @ReactMethod
    public void onEmergencyUnlock() {
        // Send event to JS side
        getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("onEmergencyUnlock", null);
        
        // Hide overlay
        hideOverlay();
    }

    @Override
    public void onHostResume() {
        // React context resumed
    }

    @Override
    public void onHostPause() {
        // React context paused
    }

    @Override
    public void onHostDestroy() {
        // Clean up when host is destroyed
        if (isOverlayShowing && overlayView != null) {
            UiThreadUtil.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        windowManager.removeView(overlayView);
                        overlayView = null;
                        isOverlayShowing = false;
                    } catch (Exception e) {
                        Log.e(TAG, "Error cleaning up overlay", e);
                    }
                }
            });
        }
    }
} 