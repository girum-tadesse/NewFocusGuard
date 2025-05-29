package com.newfocusguard

import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream

class AppIconModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppIconModule"

    @ReactMethod
    fun getAppIcon(packageName: String, promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val ai = pm.getApplicationInfo(packageName, 0)
            val icon = pm.getApplicationIcon(ai)
            
            // Convert drawable to bitmap
            val bitmap = Bitmap.createBitmap(
                icon.intrinsicWidth,
                icon.intrinsicHeight,
                Bitmap.Config.ARGB_8888
            )
            val canvas = Canvas(bitmap)
            icon.setBounds(0, 0, canvas.width, canvas.height)
            icon.draw(canvas)

            // Convert bitmap to base64
            val byteArrayOutputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream)
            val byteArray = byteArrayOutputStream.toByteArray()
            val base64Icon = Base64.encodeToString(byteArray, Base64.DEFAULT)

            val result = Arguments.createMap()
            result.putString("icon", base64Icon)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
} 