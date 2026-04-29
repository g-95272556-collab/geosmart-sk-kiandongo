package com.geosmart.activityreminder

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.geosmart.activityreminder.databinding.ActivityMainBinding
import com.geosmart.activityreminder.service.ActivityMonitorService
import com.geosmart.activityreminder.ui.MainViewModel
import com.geosmart.activityreminder.util.NotificationHelper
import com.geosmart.activityreminder.util.PreferencesManager

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: MainViewModel by viewModels()
    private lateinit var prefsManager: PreferencesManager

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.values.all { it }
        if (allGranted) {
            startMonitoringService()
        } else {
            Toast.makeText(this, getString(R.string.permission_required), Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefsManager = PreferencesManager(this)
        NotificationHelper.createNotificationChannels(this)

        setupUI()
        observeViewModel()
        checkAndRequestPermissions()
    }

    private fun setupUI() {
        binding.switchMonitoring.isChecked = prefsManager.isMonitoringEnabled()

        binding.switchMonitoring.setOnCheckedChangeListener { _, isChecked ->
            prefsManager.setMonitoringEnabled(isChecked)
            if (isChecked) {
                checkAndRequestPermissions()
            } else {
                stopMonitoringService()
                binding.tvStatus.text = getString(R.string.status_stopped)
                binding.tvIdleTime.text = getString(R.string.idle_time_default)
            }
        }

        binding.btnStartMovement.setOnClickListener {
            viewModel.startMovementSession()
            binding.btnStartMovement.isEnabled = false
            binding.btnCompleteMovement.isEnabled = true
        }

        binding.btnCompleteMovement.setOnClickListener {
            viewModel.completeMovementSession()
            binding.btnStartMovement.isEnabled = true
            binding.btnCompleteMovement.isEnabled = false
            sendBroadcast(Intent(ActivityMonitorService.ACTION_MOVEMENT_DONE))
        }

        // Tetapan tempoh idle (default 60 minit)
        binding.sliderIdleThreshold.value = prefsManager.getIdleThresholdMinutes().toFloat()
        binding.tvIdleThresholdValue.text = getString(
            R.string.minutes_format,
            prefsManager.getIdleThresholdMinutes()
        )

        binding.sliderIdleThreshold.addOnChangeListener { _, value, fromUser ->
            if (fromUser) {
                val minutes = value.toInt()
                prefsManager.setIdleThresholdMinutes(minutes)
                binding.tvIdleThresholdValue.text = getString(R.string.minutes_format, minutes)
                // Restart service supaya pakai tetapan baru
                if (prefsManager.isMonitoringEnabled()) {
                    restartMonitoringService()
                }
            }
        }

        // Tetapan tempoh pergerakan minimum (default 10 minit)
        binding.sliderMovementDuration.value = prefsManager.getMovementDurationMinutes().toFloat()
        binding.tvMovementDurationValue.text = getString(
            R.string.minutes_format,
            prefsManager.getMovementDurationMinutes()
        )

        binding.sliderMovementDuration.addOnChangeListener { _, value, fromUser ->
            if (fromUser) {
                val minutes = value.toInt()
                prefsManager.setMovementDurationMinutes(minutes)
                binding.tvMovementDurationValue.text = getString(R.string.minutes_format, minutes)
            }
        }
    }

    private fun observeViewModel() {
        viewModel.idleTimeText.observe(this) { text ->
            binding.tvIdleTime.text = text
        }

        viewModel.statusText.observe(this) { status ->
            binding.tvStatus.text = status
        }

        viewModel.isMovementActive.observe(this) { isActive ->
            binding.btnStartMovement.isEnabled = !isActive
            binding.btnCompleteMovement.isEnabled = isActive
            binding.movementTimerCard.visibility =
                if (isActive) android.view.View.VISIBLE else android.view.View.GONE
        }

        viewModel.movementTimerText.observe(this) { timerText ->
            binding.tvMovementTimer.text = timerText
        }

        viewModel.lastActivityTime.observe(this) { timeText ->
            binding.tvLastActivity.text = timeText
        }
    }

    private fun checkAndRequestPermissions() {
        val permissionsNeeded = mutableListOf<String>()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                permissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION)
            != PackageManager.PERMISSION_GRANTED
        ) {
            permissionsNeeded.add(Manifest.permission.ACTIVITY_RECOGNITION)
        }

        if (permissionsNeeded.isNotEmpty()) {
            permissionLauncher.launch(permissionsNeeded.toTypedArray())
        } else {
            if (prefsManager.isMonitoringEnabled()) {
                startMonitoringService()
            }
        }
    }

    private fun startMonitoringService() {
        val intent = Intent(this, ActivityMonitorService::class.java)
        ContextCompat.startForegroundService(this, intent)
        binding.tvStatus.text = getString(R.string.status_monitoring)
    }

    private fun stopMonitoringService() {
        val intent = Intent(this, ActivityMonitorService::class.java)
        stopService(intent)
    }

    private fun restartMonitoringService() {
        stopMonitoringService()
        startMonitoringService()
    }

    override fun onResume() {
        super.onResume()
        viewModel.refreshStatus(this)
    }
}
