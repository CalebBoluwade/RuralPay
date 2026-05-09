package com.zegiftedtechnologies.ruralpay

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PaymentActivityModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "PaymentActivity"

    companion object {
        private const val CHANNEL_ID = "ruralpay_payment_activity"
        private const val NOTIFICATION_ID = 9001
    }

    private fun ensureChannel() {
        val mgr = reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (mgr.getNotificationChannel(CHANNEL_ID) != null) return
        mgr.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Payment Activity", NotificationManager.IMPORTANCE_LOW).apply {
                description = "Shows live payment progress"
                setShowBadge(false)
            }
        )
    }

    @ReactMethod
    fun start(transactionId: String, amount: String, merchant: String) {
        ensureChannel()
        val views = buildRemoteViews("processing", amount, merchant)
        val tapIntent = PendingIntent.getActivity(
            reactContext, 0,
            Intent(Intent.ACTION_VIEW, Uri.parse("ruralpay://transaction/$transactionId"))
                .setPackage(reactContext.packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setCustomContentView(views)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(tapIntent)
            .build()

        NotificationManagerCompat.from(reactContext).notify(NOTIFICATION_ID, notification)
    }

    @ReactMethod
    fun update(status: String, amount: String, merchant: String) {
        ensureChannel()
        val views = buildRemoteViews(status, amount, merchant)
        val isTerminal = status == "success" || status == "failed"
        val notification = NotificationCompat.Builder(reactContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setCustomContentView(views)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .setOngoing(!isTerminal)
            .setOnlyAlertOnce(true)
            .setAutoCancel(isTerminal)
            .build()

        NotificationManagerCompat.from(reactContext).notify(NOTIFICATION_ID, notification)
    }

    @ReactMethod
    fun dismiss() {
        NotificationManagerCompat.from(reactContext).cancel(NOTIFICATION_ID)
    }

    private fun buildRemoteViews(status: String, amount: String, merchant: String): RemoteViews {
        val views = RemoteViews(reactContext.packageName, R.layout.notification_payment_activity)
        val (label, amountColor) = when (status) {
            "success" -> Pair("Paid $merchant", android.R.color.holo_green_dark)
            "failed"  -> Pair("Payment Failed", android.R.color.holo_red_dark)
            else      -> Pair("Paying $merchant…", android.R.color.holo_orange_dark)
        }
        views.setTextViewText(R.id.notif_status_label, label)
        views.setTextViewText(R.id.notif_amount, amount)
        views.setTextColor(R.id.notif_amount, reactContext.getColor(amountColor))
        views.setViewVisibility(
            R.id.notif_progress,
            if (status == "processing") android.view.View.VISIBLE else android.view.View.GONE
        )
        return views
    }
}
