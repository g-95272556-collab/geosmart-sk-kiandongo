package com.geosmart.activityreminder.util

import android.content.Context
import android.content.SharedPreferences

class PreferencesManager(context: Context) {

    companion object {
        private const val PREFS_NAME = "activity_reminder_prefs"
        private const val KEY_MONITORING_ENABLED = "monitoring_enabled"
        private const val KEY_LAST_ACTIVITY_TIME = "last_activity_time"
        private const val KEY_IDLE_THRESHOLD_MINUTES = "idle_threshold_minutes"
        private const val KEY_MOVEMENT_DURATION_MINUTES = "movement_duration_minutes"
        private const val KEY_SNOOZE_UNTIL = "snooze_until"
        private const val KEY_TOTAL_REMINDERS_SENT = "total_reminders_sent"
        private const val KEY_TOTAL_MOVEMENTS_COMPLETED = "total_movements_completed"

        const val DEFAULT_IDLE_THRESHOLD = 60   // 60 minit
        const val DEFAULT_MOVEMENT_DURATION = 10 // 10 minit
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun isMonitoringEnabled(): Boolean =
        prefs.getBoolean(KEY_MONITORING_ENABLED, true)

    fun setMonitoringEnabled(enabled: Boolean) =
        prefs.edit().putBoolean(KEY_MONITORING_ENABLED, enabled).apply()

    fun getLastActivityTime(): Long =
        prefs.getLong(KEY_LAST_ACTIVITY_TIME, 0L)

    fun updateLastActivityTime() =
        prefs.edit().putLong(KEY_LAST_ACTIVITY_TIME, System.currentTimeMillis()).apply()

    fun getIdleThresholdMinutes(): Int =
        prefs.getInt(KEY_IDLE_THRESHOLD_MINUTES, DEFAULT_IDLE_THRESHOLD)

    fun setIdleThresholdMinutes(minutes: Int) =
        prefs.edit().putInt(KEY_IDLE_THRESHOLD_MINUTES, minutes).apply()

    fun getMovementDurationMinutes(): Int =
        prefs.getInt(KEY_MOVEMENT_DURATION_MINUTES, DEFAULT_MOVEMENT_DURATION)

    fun setMovementDurationMinutes(minutes: Int) =
        prefs.edit().putInt(KEY_MOVEMENT_DURATION_MINUTES, minutes).apply()

    fun getSnoozeUntil(): Long =
        prefs.getLong(KEY_SNOOZE_UNTIL, 0L)

    fun setSnoozeUntil(time: Long) =
        prefs.edit().putLong(KEY_SNOOZE_UNTIL, time).apply()

    fun isInSnooze(): Boolean =
        System.currentTimeMillis() < getSnoozeUntil()

    fun incrementRemindersSent() {
        val count = prefs.getInt(KEY_TOTAL_REMINDERS_SENT, 0)
        prefs.edit().putInt(KEY_TOTAL_REMINDERS_SENT, count + 1).apply()
    }

    fun getTotalRemindersSent(): Int =
        prefs.getInt(KEY_TOTAL_REMINDERS_SENT, 0)

    fun incrementMovementsCompleted() {
        val count = prefs.getInt(KEY_TOTAL_MOVEMENTS_COMPLETED, 0)
        prefs.edit().putInt(KEY_TOTAL_MOVEMENTS_COMPLETED, count + 1).apply()
    }

    fun getTotalMovementsCompleted(): Int =
        prefs.getInt(KEY_TOTAL_MOVEMENTS_COMPLETED, 0)
}
