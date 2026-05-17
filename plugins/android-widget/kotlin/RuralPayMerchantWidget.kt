package com.zegiftedtechnologies.ruralpay

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.Bitmap
import android.net.Uri
import android.util.Base64
import android.widget.RemoteViews
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class RuralPayMerchantWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        Log.d(TAG, "onUpdate ids=${ids.toList()}")
        ids.forEach { id -> updateWidget(context, manager, id) }
    }

    companion object {
        private const val TAG = "MerchantWidget"
        // Hardcoded sample red 100x100 bitmap for testing
        private const val SAMPLE_QR_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw0pVOAAAAIElEQVR4nO3ZMQEAAAjDQM/SFytoYM/AvIkgICAgIL+dBfWhBT2gzDo+AAAAAElFTkSuQmCC"

        fun updateWidget(context: Context, manager: AppWidgetManager, id: Int) {
            Log.d(TAG, "updateWidget id=$id")
            val views = RemoteViews(context.packageName, R.layout.widget_merchant)

            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("ruralpay://merchant/qr")).apply {
                setPackage(context.packageName)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pending = PendingIntent.getActivity(
                context, id, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_merchant_root, pending)
            
            // Test: set placeholder to verify ImageView works
            Log.d(TAG, "Setting placeholder drawable to test ImageView")
            views.setImageViewResource(R.id.widget_merchant_qr, R.drawable.ic_qr_placeholder)
            manager.updateAppWidget(id, views)

            val b64 = WidgetStorage.read(context, "merchant_qr_b64")
            Log.d(TAG, "merchant_qr_b64 present=${b64 != null} len=${b64?.length ?: 0}")
            
            if (b64 == null) {
                Log.d(TAG, "No QR stored, showing placeholder only")
                return
            }

            val merchantName = WidgetStorage.read(context, "merchant_name")
            if (!merchantName.isNullOrBlank()) {
                views.setTextViewText(R.id.widget_merchant_name, merchantName)
                views.setViewVisibility(R.id.widget_merchant_name, android.view.View.VISIBLE)
            } else {
                views.setViewVisibility(R.id.widget_merchant_name, android.view.View.GONE)
            }

            try {
                val bytes = Base64.decode(b64, Base64.DEFAULT)
                Log.d(TAG, "Decoded ${bytes.size} bytes")
                var bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                if (bitmap == null) {
                    Log.e(TAG, "BitmapFactory returned null for ${bytes.size} bytes")
                    return
                }
                Log.d(TAG, "Bitmap created: ${bitmap.width}x${bitmap.height}")
                if (bitmap.width > 200 || bitmap.height > 200) {
                    val scaled = Bitmap.createScaledBitmap(bitmap, 200, 200, true)
                    bitmap.recycle()
                    bitmap = scaled
                }
                views.setImageViewBitmap(R.id.widget_merchant_qr, bitmap)
                manager.updateAppWidget(id, views)
                Log.d(TAG, "Widget updated with QR bitmap (${bitmap.width}x${bitmap.height})")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to decode/set QR bitmap", e)
            }
        }
    }
}
