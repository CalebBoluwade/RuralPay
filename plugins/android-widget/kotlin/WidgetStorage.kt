package com.zegiftedtechnologies.ruralpay

import android.content.Context

object WidgetStorage {
    private const val PREFS_NAME = "ruralpay_widget_prefs"

    fun write(context: Context, key: String, value: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString(key, value).apply()
    }

    fun read(context: Context, key: String): String? =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(key, null)
}
