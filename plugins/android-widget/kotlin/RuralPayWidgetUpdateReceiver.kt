package com.zegiftedtechnologies.ruralpay

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent

import android.util.Log

class RuralPayWidgetUpdateReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "onReceive action=${intent.action}")
        if (intent.action != WidgetStorageModule.WIDGET_UPDATE_ACTION) return

        val manager = AppWidgetManager.getInstance(context)
        val role = WidgetStorage.read(context, "user_role") ?: "consumer"
        Log.d(TAG, "user_role=$role")

        if (role == "merchant") {
            val ids = manager.getAppWidgetIds(
                ComponentName(context, RuralPayMerchantWidget::class.java)
            )
            Log.d(TAG, "merchant widget ids=${ids.toList()}")
            ids.forEach { RuralPayMerchantWidget.updateWidget(context, manager, it) }
        } else {
            val ids = manager.getAppWidgetIds(
                ComponentName(context, RuralPayConsumerWidget::class.java)
            )
            Log.d(TAG, "consumer widget ids=${ids.toList()}")
            ids.forEach { RuralPayConsumerWidget.updateWidget(context, manager, it) }
        }
    }

    companion object { private const val TAG = "WidgetUpdateReceiver" }
}
