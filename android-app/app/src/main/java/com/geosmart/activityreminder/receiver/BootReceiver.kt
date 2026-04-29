package com.geosmart.activityreminder.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.geosmart.activityreminder.service.ActivityMonitorService
import com.geosmart.activityreminder.util.PreferencesManager

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            val prefs = PreferencesManager(context)
            if (prefs.isMonitoringEnabled()) {
                val serviceIntent = Intent(context, ActivityMonitorService::class.java)
                ContextCompat.startForegroundService(context, serviceIntent)
            }
        }
    }
}
