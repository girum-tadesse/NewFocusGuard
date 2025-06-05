package com.newfocusguard;

import android.app.Activity;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.view.View;
import android.graphics.Color;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class OverlayPermissionModule extends ReactContextBaseJavaModule {
    private static final int OVERLAY_PERMISSION_REQ_CODE = 1234;
    private static final String TAG = "FocusGuardPermissions";
    private final ReactApplicationContext reactContext;
    private WindowManager windowManager;
    private View overlayView;
    private WindowManager.LayoutParams params;

    public OverlayPermissionModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.windowManager = (WindowManager) reactContext.getSystemService(reactContext.WINDOW_SERVICE);
    }

    @Override
    public String getName() {
        return "OverlayPermission";
    }

    @ReactMethod
    public void checkPermission(Callback callback) {
        Log.d(TAG, "checkPermission called");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean hasPermission = Settings.canDrawOverlays(reactContext);
            Log.d(TAG, "Overlay permission status: " + hasPermission);
            callback.invoke(hasPermission);
        } else {
            Log.d(TAG, "Overlay permission not required (SDK < M), returning true");
            callback.invoke(true);
        }
    }

    @ReactMethod
    public void requestPermission(Promise promise) {
        Log.d(TAG, "requestPermission called");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (!Settings.canDrawOverlays(reactContext)) {
                Log.d(TAG, "Overlay permission NOT granted. Creating intent to request.");
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + reactContext.getPackageName()));
                Activity currentActivity = getCurrentActivity();
                if (currentActivity != null) {
                    Log.d(TAG, "Activity found, starting activity for result.");
                    currentActivity.startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE);
                    promise.resolve(true);
                } else {
                    Log.e(TAG, "Current activity is null, cannot request overlay permission.");
                    promise.reject("ACTIVITY_NULL", "Current activity is null");
                }
            } else {
                Log.d(TAG, "Overlay permission ALREADY granted.");
                promise.resolve(true);
            }
        } else {
            Log.d(TAG, "Overlay permission not required (SDK < M), resolving true");
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void showOverlay() {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            Log.e(TAG, "showOverlay: Current activity is null");
            return;
        }
        Log.d(TAG, "showOverlay called");

        activity.runOnUiThread(() -> {
            if (overlayView != null) {
                Log.d(TAG, "showOverlay: Overlay view already exists.");
                return;
            }
            Log.d(TAG, "showOverlay: Creating and adding overlay view.");

            overlayView = new View(reactContext);
            overlayView.setBackgroundColor(Color.argb(200, 0, 0, 0));

            params = new WindowManager.LayoutParams(
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

            windowManager.addView(overlayView, params);
        });
    }

    @ReactMethod
    public void hideOverlay() {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            Log.e(TAG, "hideOverlay: Current activity is null");
            return;
        }
        Log.d(TAG, "hideOverlay called");

        activity.runOnUiThread(() -> {
            if (overlayView == null) {
                 Log.d(TAG, "hideOverlay: Overlay view is already null.");
                return;
            }
            Log.d(TAG, "hideOverlay: Removing overlay view.");

            windowManager.removeView(overlayView);
            overlayView = null;
        });
    }

    private void sendEvent(String eventName, String message) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, message);
    }
} 