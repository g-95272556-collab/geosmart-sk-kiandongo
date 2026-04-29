package com.geosmart.activityreminder.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.geosmart.activityreminder.service.ActivityMonitorService
import com.geosmart.activityreminder.util.NotificationHelper
import com.geosmart.activityreminder.util.PreferencesManager

class NotificationActionReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_START_MOVEMENT = "com.geosmart.activityreminder.START_MOVEMENT"
        const val ACTION_SNOOZE = "com.geosmart.activityreminder.SNOOZE"
        const val SNOOZE_DURATION_MS = 15 * 60 * 1000L // 15 minit
    }

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            ACTION_START_MOVEMENT -> {
                // Tandakan pengguna mula bergerak
                val prefs = PreferencesManager(context)
                prefs.updateLastActivityTime()
                NotificationHelper.cancelMovementReminder(context)

                // Hantar broadcast ke servis
                val serviceIntent = Intent(ActivityMonitorService.ACTION_MOVEMENT_DONE)
                context.sendBroadcast(serviceIntent)

                // Buka app untuk tunjukkan timer pergerakan
                val appIntent = context.packageManager
                    .getLaunchIntentForPackage(context.packageName)
                    ?.apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                        putExtra("start_movement", true)
                    }
                appIntent?.let { context.startActivity(it) }
            }

            ACTION_SNOOZE -> {
                // Tangguh peringatan 15 minit
                val prefs = PreferencesManager(context)
                prefs.setSnoozeUntil(System.currentTimeMillis() + SNOOZE_DURATION_MS)
                NotificationHelper.cancelMovementReminder(context)
                NotificationHelper.scheduleSnoozeReminder(context, SNOOZE_DURATION_MS)
            }
        }
    }
}
