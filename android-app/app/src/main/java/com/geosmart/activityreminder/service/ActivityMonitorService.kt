package com.geosmart.activityreminder.service

import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.geosmart.activityreminder.R
import com.geosmart.activityreminder.util.NotificationHelper
import com.geosmart.activityreminder.util.PreferencesManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class ActivityMonitorService : Service(), SensorEventListener {

    companion object {
        const val TAG = "ActivityMonitorService"
        const val ACTION_MOVEMENT_DONE = "com.geosmart.activityreminder.MOVEMENT_DONE"

        // Ambang langkah yang dikira sebagai aktif (min 5 langkah dalam tempoh semakan)
        private const val STEP_THRESHOLD = 5
        // Semak setiap 30 saat
        private const val CHECK_INTERVAL_MS = 30_000L
    }

    private lateinit var sensorManager: SensorManager
    private lateinit var prefsManager: PreferencesManager
    private lateinit var wakeLock: PowerManager.WakeLock

    private var stepCounterSensor: Sensor? = null
    private var accelerometerSensor: Sensor? = null

    private val serviceJob = SupervisorJob()
    private val serviceScope = CoroutineScope(Dispatchers.Default + serviceJob)

    private var idleCheckJob: Job? = null
    private var reminderSent = false
    private var lastStepCount = -1
    private var stepsInPeriod = 0

    // Tangkap apabila pengguna selesai bergerak dari notifikasi
    private val movementDoneReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action == ACTION_MOVEMENT_DONE) {
                onMovementCompleted()
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        prefsManager = PreferencesManager(this)
        sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager

        val powerManager = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "ActivityReminder::MonitorWakeLock"
        )

        stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        accelerometerSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        ContextCompat.registerReceiver(
            this,
            movementDoneReceiver,
            IntentFilter(ACTION_MOVEMENT_DONE),
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Servis pemantauan aktiviti dimulakan")

        val notification = NotificationHelper.createServiceNotification(this)
        startForeground(NotificationHelper.SERVICE_NOTIFICATION_ID, notification)

        registerSensors()
        startIdleMonitoring()

        // Rekod masa aplikasi dimulakan sebagai masa aktiviti terakhir
        if (prefsManager.getLastActivityTime() == 0L) {
            prefsManager.updateLastActivityTime()
        }

        return START_STICKY
    }

    private fun registerSensors() {
        if (stepCounterSensor != null) {
            sensorManager.registerListener(
                this,
                stepCounterSensor,
                SensorManager.SENSOR_DELAY_NORMAL
            )
            Log.d(TAG, "Penderia step counter didaftarkan")
        } else if (accelerometerSensor != null) {
            sensorManager.registerListener(
                this,
                accelerometerSensor,
                SensorManager.SENSOR_DELAY_NORMAL
            )
            Log.d(TAG, "Penderia akselerometer didaftarkan sebagai alternatif")
        } else {
            Log.w(TAG, "Tiada penderia gerakan tersedia – gunakan semakan berkala sahaja")
        }
    }

    private fun startIdleMonitoring() {
        idleCheckJob?.cancel()
        idleCheckJob = serviceScope.launch {
            while (true) {
                delay(CHECK_INTERVAL_MS)
                checkIdleState()
            }
        }
    }

    private fun checkIdleState() {
        val idleThresholdMs = prefsManager.getIdleThresholdMinutes() * 60_000L
        val lastActivity = prefsManager.getLastActivityTime()
        val idleMs = System.currentTimeMillis() - lastActivity

        Log.d(TAG, "Masa idle: ${idleMs / 60000} minit | Ambang: ${idleThresholdMs / 60000} minit")

        if (idleMs >= idleThresholdMs && !reminderSent) {
            Log.d(TAG, "Pengguna idle terlalu lama – hantar peringatan")
            reminderSent = true
            sendIdleReminder(idleMs)
        }
    }

    private fun sendIdleReminder(idleMs: Long) {
        val idleMinutes = idleMs / 60_000L
        val movementMinutes = prefsManager.getMovementDurationMinutes()
        NotificationHelper.sendMovementReminder(this, idleMinutes, movementMinutes)
    }

    fun onMovementCompleted() {
        Log.d(TAG, "Pengguna telah selesai bergerak – tetapkan semula timer idle")
        reminderSent = false
        prefsManager.updateLastActivityTime()
        NotificationHelper.cancelMovementReminder(this)
        updateServiceNotification()
    }

    private fun updateServiceNotification() {
        val notification = NotificationHelper.createServiceNotification(this)
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        notificationManager.notify(NotificationHelper.SERVICE_NOTIFICATION_ID, notification)
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event ?: return

        when (event.sensor.type) {
            Sensor.TYPE_STEP_COUNTER -> {
                val currentSteps = event.values[0].toInt()

                if (lastStepCount == -1) {
                    lastStepCount = currentSteps
                    return
                }

                val stepsDelta = currentSteps - lastStepCount
                if (stepsDelta >= STEP_THRESHOLD) {
                    // Pengguna sedang berjalan
                    prefsManager.updateLastActivityTime()
                    lastStepCount = currentSteps
                    stepsInPeriod += stepsDelta

                    if (reminderSent) {
                        Log.d(TAG, "Aktiviti dikesan – tetapkan semula peringatan")
                        reminderSent = false
                        NotificationHelper.cancelMovementReminder(this)
                    }
                }
            }

            Sensor.TYPE_ACCELEROMETER -> {
                // Gunakan akselerometer jika tiada step counter
                val magnitude = Math.sqrt(
                    (event.values[0] * event.values[0] +
                     event.values[1] * event.values[1] +
                     event.values[2] * event.values[2]).toDouble()
                ).toFloat()

                // Gerakan ketara melebihi graviti
                val gravityCorrected = Math.abs(magnitude - SensorManager.GRAVITY_EARTH)
                if (gravityCorrected > 2.0f) {
                    prefsManager.updateLastActivityTime()
                    if (reminderSent) {
                        reminderSent = false
                        NotificationHelper.cancelMovementReminder(this)
                    }
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        sensorManager.unregisterListener(this)
        idleCheckJob?.cancel()
        serviceJob.cancel()
        unregisterReceiver(movementDoneReceiver)
        if (wakeLock.isHeld) wakeLock.release()
        Log.d(TAG, "Servis pemantauan dihentikan")
    }
}
