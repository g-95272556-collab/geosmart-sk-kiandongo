package com.geosmart.activityreminder.ui

import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.geosmart.activityreminder.util.PreferencesManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

class MainViewModel : ViewModel() {

    private val _idleTimeText = MutableLiveData<String>()
    val idleTimeText: LiveData<String> = _idleTimeText

    private val _statusText = MutableLiveData<String>()
    val statusText: LiveData<String> = _statusText

    private val _isMovementActive = MutableLiveData(false)
    val isMovementActive: LiveData<Boolean> = _isMovementActive

    private val _movementTimerText = MutableLiveData<String>()
    val movementTimerText: LiveData<String> = _movementTimerText

    private val _lastActivityTime = MutableLiveData<String>()
    val lastActivityTime: LiveData<String> = _lastActivityTime

    private var movementStartTime: Long = 0L
    private var movementTimerJob: Job? = null
    private var idleUpdateJob: Job? = null

    fun refreshStatus(context: Context) {
        val prefs = PreferencesManager(context)
        val lastActivity = prefs.getLastActivityTime()
        val formatter = SimpleDateFormat("hh:mm a", Locale.getDefault())

        _lastActivityTime.value = if (lastActivity > 0) {
            formatter.format(Date(lastActivity))
        } else {
            "Tidak diketahui"
        }

        startIdleTimeUpdater(prefs)
    }

    private fun startIdleTimeUpdater(prefs: PreferencesManager) {
        idleUpdateJob?.cancel()
        idleUpdateJob = viewModelScope.launch {
            while (true) {
                val lastActivity = prefs.getLastActivityTime()
                if (lastActivity > 0) {
                    val idleMs = System.currentTimeMillis() - lastActivity
                    _idleTimeText.value = formatDuration(idleMs)
                }
                delay(1000L)
            }
        }
    }

    fun startMovementSession() {
        movementStartTime = System.currentTimeMillis()
        _isMovementActive.value = true
        startMovementTimer()
    }

    fun completeMovementSession() {
        movementTimerJob?.cancel()
        _isMovementActive.value = false
        _movementTimerText.value = "00:00"
    }

    private fun startMovementTimer() {
        movementTimerJob?.cancel()
        movementTimerJob = viewModelScope.launch {
            while (true) {
                val elapsed = System.currentTimeMillis() - movementStartTime
                _movementTimerText.value = formatDuration(elapsed)
                delay(1000L)
            }
        }
    }

    private fun formatDuration(ms: Long): String {
        val totalSeconds = ms / 1000
        val hours = TimeUnit.SECONDS.toHours(totalSeconds)
        val minutes = TimeUnit.SECONDS.toMinutes(totalSeconds) % 60
        val seconds = totalSeconds % 60

        return if (hours > 0) {
            String.format("%02d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format("%02d:%02d", minutes, seconds)
        }
    }

    override fun onCleared() {
        super.onCleared()
        movementTimerJob?.cancel()
        idleUpdateJob?.cancel()
    }
}
