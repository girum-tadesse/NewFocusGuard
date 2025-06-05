package com.newfocusguard;

import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.drawable.Drawable;
import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.module.annotations.ReactModule;

import java.io.ByteArrayOutputStream;
import java.util.List;
import android.graphics.Bitmap;
import android.graphics.Canvas;

@ReactModule(name = InstalledAppsModule.NAME)
public class InstalledAppsModule extends ReactContextBaseJavaModule {
    public static final String NAME = "InstalledApps";
    private final ReactApplicationContext reactContext;

    public InstalledAppsModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built in Event Emitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built in Event Emitter
    }

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            PackageManager pm = reactContext.getPackageManager();
            List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            WritableArray appList = Arguments.createArray();

            for (ApplicationInfo app : apps) {
                // Skip system apps if they don't have a launcher
                if ((app.flags & ApplicationInfo.FLAG_SYSTEM) != 0) {
                    if (pm.getLaunchIntentForPackage(app.packageName) == null) {
                        continue;
                    }
                }

                WritableMap appInfo = Arguments.createMap();
                appInfo.putString("appName", pm.getApplicationLabel(app).toString());
                appInfo.putString("packageName", app.packageName);
                
                try {
                    String versionName = pm.getPackageInfo(app.packageName, 0).versionName;
                    appInfo.putString("versionName", versionName);
                } catch (Exception e) {
                    appInfo.putString("versionName", "");
                }

                // Convert app icon to Base64 string
                try {
                    Drawable icon = pm.getApplicationIcon(app.packageName);
                    String base64Icon = drawableToBase64(icon);
                    appInfo.putString("icon", base64Icon);
                } catch (Exception e) {
                    appInfo.putString("icon", "");
                }

                appList.pushMap(appInfo);
            }

            promise.resolve(appList);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    private void sendEvent(String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    private String drawableToBase64(Drawable drawable) {
        Bitmap bitmap = Bitmap.createBitmap(drawable.getIntrinsicWidth(),
                drawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);

        ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteStream);
        byte[] byteArray = byteStream.toByteArray();
        return Base64.encodeToString(byteArray, Base64.DEFAULT);
    }
} 