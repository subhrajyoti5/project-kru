package com.kru.files.kru_android

import android.Manifest
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.provider.Settings
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private var pendingPlace: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "kru/network")
            .setMethodCallHandler { call, result ->
                if (call.method == "device") {
                    result.success(deviceDetails())
                    return@setMethodCallHandler
                }
                if (call.method != "place") {
                    result.notImplemented()
                    return@setMethodCallHandler
                }
                val missing = requiredPermissions().filter {
                    ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
                }
                if (missing.isEmpty()) {
                    result.success(networkPlace())
                } else {
                    pendingPlace = result
                    ActivityCompat.requestPermissions(this, missing.toTypedArray(), PLACE_REQUEST)
                }
            }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != PLACE_REQUEST) return
        pendingPlace?.success(networkPlace())
        pendingPlace = null
    }

    private fun requiredPermissions(): List<String> {
        val permissions = mutableListOf(Manifest.permission.ACCESS_WIFI_STATE)
        if (Build.VERSION.SDK_INT >= 33) {
            permissions.add(Manifest.permission.NEARBY_WIFI_DEVICES)
        } else {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        return permissions
    }

    private fun deviceDetails(): Map<String, String> {
        val manufacturer = Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
        val model = Build.MODEL
        val configured = Settings.Global.getString(contentResolver, Settings.Global.DEVICE_NAME)
        val name = if (configured.isNullOrBlank()) "$manufacturer $model" else configured
        return mapOf(
            "name" to name,
            "manufacturer" to manufacturer,
            "model" to model,
            "brand" to Build.BRAND,
            "androidVersion" to Build.VERSION.RELEASE,
            "sdkInt" to Build.VERSION.SDK_INT.toString(),
        )
    }

    private fun networkPlace(): String {
        if (hotspotIsOn()) return "hotspot"
        if (campusWifi()) return "campus"
        return "home"
    }

    private fun hotspotIsOn(): Boolean {
        return try {
            val wifi = applicationContext.getSystemService(WifiManager::class.java)
            val method = wifi.javaClass.getDeclaredMethod("isWifiApEnabled")
            method.isAccessible = true
            method.invoke(wifi) == true
        } catch (_: Exception) {
            false
        }
    }

    private fun campusWifi(): Boolean {
        val connectivity = getSystemService(ConnectivityManager::class.java)
        val capabilities = connectivity.getNetworkCapabilities(connectivity.activeNetwork)
        if (capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_CAPTIVE_PORTAL) == true) {
            return true
        }
        if (Build.VERSION.SDK_INT < 31) return false
        val wifi = applicationContext.getSystemService(WifiManager::class.java)
        return when (wifi.connectionInfo.currentSecurityType) {
            WifiInfo.SECURITY_TYPE_EAP,
            WifiInfo.SECURITY_TYPE_EAP_WPA3_ENTERPRISE,
            WifiInfo.SECURITY_TYPE_EAP_WPA3_ENTERPRISE_192_BIT,
            WifiInfo.SECURITY_TYPE_PASSPOINT_R1_R2,
            WifiInfo.SECURITY_TYPE_PASSPOINT_R3,
            -> true
            else -> false
        }
    }

    companion object {
        private const val PLACE_REQUEST = 41
    }
}
