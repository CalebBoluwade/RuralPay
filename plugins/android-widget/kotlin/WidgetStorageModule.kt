package com.zegiftedtechnologies.ruralpay

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetStorageModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WidgetStorage"

    @ReactMethod
    fun setItem(key: String, value: String) {
        WidgetStorage.write(reactContext, key, value)
        broadcastWidgetUpdate(reactContext)
    }

    private fun broadcastWidgetUpdate(context: Context) {
        context.sendBroadcast(
            Intent(WIDGET_UPDATE_ACTION).setPackage(context.packageName)
        )
    }

    companion object {
        const val WIDGET_UPDATE_ACTION = "com.zegiftedtechnologies.ruralpay.WIDGET_UPDATE"
    }
}
