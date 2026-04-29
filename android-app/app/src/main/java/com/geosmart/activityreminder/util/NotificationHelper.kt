package com.geosmart.activityreminder.util

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import com.geosmart.activityreminder.MainActivity
import com.geosmart.activityreminder.R
import com.geosmart.activityreminder.receiver.NotificationActionReceiver

object NotificationHelper {

    const val SERVICE_NOTIFICATION_ID = 1001
    const val REMINDER_NOTIFICATION_ID = 1002
    const val SNOOZE_NOTIFICATION_ID = 1003

    private const val CHANNEL_SERVICE = "activity_monitor_service"
    private const val CHANNEL_REMINDER = "activity_reminder"
    private const val SNOOZE_REQUEST_CODE = 2001

    fun createNotificationChannels(context: Context) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Saluran untuk servis latar belakang (kepentingan rendah – tiada bunyi)
        val serviceChannel = NotificationChannel(
            CHANNEL_SERVICE,
            context.getString(R.string.channel_service_name),
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = context.getString(R.string.channel_service_desc)
            setShowBadge(false)
        }

        // Saluran untuk peringatan pergerakan (kepentingan tinggi – ada bunyi & getaran)
        val reminderChannel = NotificationChannel(
            CHANNEL_REMINDER,
            context.getString(R.string.channel_reminder_name),
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = context.getString(R.string.channel_reminder_desc)
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 500, 200, 500, 200, 500)
            enableLights(true)
        }

        notificationManager.createNotificationChannel(serviceChannel)
        notificationManager.createNotificationChannel(reminderChannel)
    }

    fun createServiceNotification(context: Context): Notification {
        val openAppIntent = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(context, CHANNEL_SERVICE)
            .setContentTitle(context.getString(R.string.service_notification_title))
            .setContentText(context.getString(R.string.service_notification_text))
            .setSmallIcon(R.drawable.ic_notification_monitor)
            .setContentIntent(openAppIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }

    fun sendMovementReminder(context: Context, idleMinutes: Long, movementMinutes: Int) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Intent untuk buka app
        val openAppPendingIntent = PendingIntent.getActivity(
            context,
            0,
            Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Tindakan: Mula Bergerak
        val startMovementIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = NotificationActionReceiver.ACTION_START_MOVEMENT
        }
        val startMovementPendingIntent = PendingIntent.getBroadcast(
            context,
            1001,
            startMovementIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Tindakan: Tangguh (Snooze)
        val snoozeIntent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = NotificationActionReceiver.ACTION_SNOOZE
        }
        val snoozePendingIntent = PendingIntent.getBroadcast(
            context,
            1002,
            snoozeIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_REMINDER)
            .setContentTitle(context.getString(R.string.reminder_title))
            .setContentText(
                context.getString(R.string.reminder_text, idleMinutes, movementMinutes)
            )
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(
                        context.getString(
                            R.string.reminder_big_text,
                            idleMinutes,
                            movementMinutes
                        )
                    )
            )
            .setSmallIcon(R.drawable.ic_notification_walk)
            .setContentIntent(openAppPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(false)
            .setOngoing(true)
            .setVibrate(longArrayOf(0, 500, 200, 500, 200, 500))
            .addAction(
                R.drawable.ic_action_walk,
                context.getString(R.string.action_start_movement),
                startMovementPendingIntent
            )
            .addAction(
                R.drawable.ic_action_snooze,
                context.getString(R.string.action_snooze, 15),
                snoozePendingIntent
            )
            .build()

        notificationManager.notify(REMINDER_NOTIFICATION_ID, notification)
    }

    fun cancelMovementReminder(context: Context) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(REMINDER_NOTIFICATION_ID)
    }

    fun scheduleSnoozeReminder(context: Context, delayMs: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

        // Buat intent palsu – servis akan semak sendiri bila masa habis
        // Kita hanya perlu pastikan servis masih berjalan
        val triggerTime = SystemClock.elapsedRealtime() + delayMs

        val intent = Intent(context, NotificationActionReceiver::class.java).apply {
            action = "com.geosmart.activityreminder.SNOOZE_EXPIRED"
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            SNOOZE_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.ELAPSED_REALTIME_WAKEUP,
            triggerTime,
            pendingIntent
        )
    }
}
