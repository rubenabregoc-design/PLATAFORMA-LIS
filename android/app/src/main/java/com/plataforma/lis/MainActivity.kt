package com.plataforma.lis

import android.os.Bundle
import com.getcapacitor.BridgeActivity

/**
 * MainActivity — Capacitor BridgeActivity for PLATAFORMA-LIS.
 *
 * All Capacitor plugins must be registered here.
 * GeminiPlugin is registered to expose Gemini AI functionality
 * to the React/Vite web layer via the Capacitor JS bridge.
 */
class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Register native plugins before super.onCreate()
        registerPlugin(GeminiPlugin::class.java)

        super.onCreate(savedInstanceState)
    }
}
