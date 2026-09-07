package com.plataforma.lis

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * GeminiPlugin — Capacitor native bridge for Google Gemini AI SDK.
 *
 * ERROR PREVENTION:
 * The Gemini SDK throws "INVALID_ARGUMENT: Text part must not be empty"
 * when generateContent() is called with an empty or whitespace-only prompt.
 * This plugin enforces strict input validation BEFORE any SDK call is made,
 * guaranteeing the payload always contains at least one non-empty text part.
 *
 * Plugin name exposed to JS: "GeminiPlugin"
 * JS call: Capacitor.Plugins.GeminiPlugin.generateContent({ prompt: "..." })
 */
@CapacitorPlugin(name = "GeminiPlugin")
class GeminiPlugin : Plugin() {

    companion object {
        private const val TAG = "GeminiPlugin"

        // Validation constants
        private const val MIN_PROMPT_LENGTH = 1
        private const val MAX_PROMPT_LENGTH = 30_000

        // Model identifier — update to "gemini-2.0-flash" or "gemini-1.5-pro" as needed
        private const val DEFAULT_MODEL = "gemini-2.0-flash"
    }

    /**
     * Reads the Gemini API key from AndroidManifest metadata.
     * Key name in manifest: "com.plataforma.lis.GEMINI_API_KEY"
     */
    private fun getApiKey(): String? {
        return try {
            val appInfo = activity.packageManager.getApplicationInfo(
                activity.packageName,
                android.content.pm.PackageManager.GET_META_DATA
            )
            appInfo.metaData?.getString("com.plataforma.lis.GEMINI_API_KEY")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to read API key from manifest: ${e.message}")
            null
        }
    }

    /**
     * Validates the prompt string before passing it to the Gemini SDK.
     *
     * Validation rules (preventing INVALID_ARGUMENT):
     *  1. prompt must not be null
     *  2. prompt.trim() must not be empty (SDK rejects whitespace-only parts)
     *  3. prompt length must be within [MIN_PROMPT_LENGTH, MAX_PROMPT_LENGTH]
     *  4. prompt must not consist only of control characters or zero-width spaces
     *
     * @return null if valid, or an error message string if invalid.
     */
    private fun validatePrompt(prompt: String?): String? {
        if (prompt == null) {
            return "El prompt no puede ser nulo. Asegúrese de enviar el campo 'prompt' en la llamada."
        }

        val trimmed = prompt.trim()

        if (trimmed.isEmpty()) {
            return "INVALID_ARGUMENT prevenido: El texto del prompt está vacío o contiene solo espacios en blanco. " +
                   "El SDK de Gemini rechaza partes de texto vacías con error INVALID_ARGUMENT."
        }

        // Strip zero-width characters and check again
        val stripped = trimmed.replace(Regex("[\\u200B-\\u200D\\uFEFF\\u00AD]"), "")
        if (stripped.isEmpty()) {
            return "El prompt contiene solo caracteres de ancho cero o caracteres de control invisibles. " +
                   "Proporcione contenido de texto visible."
        }

        if (trimmed.length < MIN_PROMPT_LENGTH) {
            return "El prompt es demasiado corto (mínimo $MIN_PROMPT_LENGTH caracteres)."
        }

        if (trimmed.length > MAX_PROMPT_LENGTH) {
            return "El prompt excede el límite máximo permitido de $MAX_PROMPT_LENGTH caracteres " +
                   "(actual: ${trimmed.length}). Divida la solicitud en partes más pequeñas."
        }

        return null // valid
    }

    /**
     * @PluginMethod generateContent
     *
     * Accepts from JS:
     *   {
     *     prompt:  string  — required, the user/system message
     *     model:   string  — optional, defaults to DEFAULT_MODEL
     *     context: string  — optional, prepended system context
     *   }
     *
     * Returns to JS:
     *   { text: string }        on success
     *   { error: string }       on validation failure (before SDK call)
     *   reject(message)         on SDK/network error
     */
    @PluginMethod
    fun generateContent(call: PluginCall) {
        val rawPrompt = call.getString("prompt")
        val model = call.getString("model") ?: DEFAULT_MODEL
        val context = call.getString("context") ?: ""

        // --- STEP 1: Strict input validation (prevents INVALID_ARGUMENT) ---
        val validationError = validatePrompt(rawPrompt)
        if (validationError != null) {
            android.util.Log.w(TAG, "Prompt validation failed: $validationError")
            val errorResult = JSObject()
            errorResult.put("error", validationError)
            errorResult.put("code", "VALIDATION_ERROR")
            call.resolve(errorResult)
            return
        }

        // Safe to use after validation
        val cleanPrompt = rawPrompt!!.trim()

        // --- STEP 2: Build the final prompt text ---
        val finalPromptText = if (context.isNotBlank()) {
            "${context.trim()}\n\n${cleanPrompt}"
        } else {
            cleanPrompt
        }

        // Final safety check on assembled text (belt-and-suspenders)
        if (finalPromptText.isBlank()) {
            android.util.Log.e(TAG, "Final assembled prompt is blank — aborting to prevent INVALID_ARGUMENT.")
            val errorResult = JSObject()
            errorResult.put("error", "El prompt ensamblado final está vacío. No se puede llamar al SDK de Gemini.")
            errorResult.put("code", "ASSEMBLED_PROMPT_EMPTY")
            call.resolve(errorResult)
            return
        }

        // --- STEP 3: Read API key ---
        val apiKey = getApiKey()
        if (apiKey.isNullOrBlank()) {
            android.util.Log.e(TAG, "Gemini API key not found in AndroidManifest.")
            call.reject(
                "Clave de API de Gemini no configurada. Agregue 'com.plataforma.lis.GEMINI_API_KEY' " +
                "en los metadatos del AndroidManifest."
            )
            return
        }

        // --- STEP 4: Execute Gemini SDK call on IO dispatcher ---
        CoroutineScope(Dispatchers.IO).launch {
            try {
                android.util.Log.d(TAG, "Calling Gemini model '$model' with prompt length=${finalPromptText.length}")

                /*
                 * Gemini SDK Integration Point
                 * ─────────────────────────────
                 * Uncomment and use when com.google.ai.client.generativeai is added to build.gradle:
                 *
                 *   val generativeModel = GenerativeModel(
                 *       modelName = model,
                 *       apiKey = apiKey
                 *   )
                 *   val response = generativeModel.generateContent(finalPromptText)
                 *   val responseText = response.text ?: ""
                 *
                 * For now (SDK dependency pending), we return a validated mock response
                 * to confirm the validation pipeline works correctly.
                 */

                // Simulate network delay
                kotlinx.coroutines.delay(1200)

                val responseText = buildMockResponse(cleanPrompt, model)

                withContext(Dispatchers.Main) {
                    val result = JSObject()
                    result.put("text", responseText)
                    result.put("model", model)
                    result.put("promptLength", finalPromptText.length)
                    call.resolve(result)
                }

            } catch (e: Exception) {
                android.util.Log.e(TAG, "Gemini SDK call failed: ${e.javaClass.simpleName}: ${e.message}")

                // Detect and surface the specific INVALID_ARGUMENT error if SDK is active
                val isInvalidArg = e.message?.contains("INVALID_ARGUMENT", ignoreCase = true) == true ||
                                   e.message?.contains("Text part must not be empty", ignoreCase = true) == true

                withContext(Dispatchers.Main) {
                    if (isInvalidArg) {
                        call.reject(
                            "SDK Error INVALID_ARGUMENT: Una parte de texto enviada al SDK de Gemini está vacía. " +
                            "Esto NO debería ocurrir si el plugin valida correctamente. " +
                            "Revise GeminiPlugin.validatePrompt(). Detalle: ${e.message}"
                        )
                    } else {
                        call.reject("Error en la llamada al SDK de Gemini: ${e.message}")
                    }
                }
            }
        }
    }

    /**
     * Builds a clinically relevant mock response for LIS analytics.
     * Replace with real SDK response once dependency is added to build.gradle.
     */
    private fun buildMockResponse(prompt: String, model: String): String {
        val timestamp = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault())
            .format(java.util.Date())

        return """
            🤖 [Gemini $model — Respuesta Nativa Android — $timestamp]
            
            Análisis para: "${prompt.take(80)}${if (prompt.length > 80) "..." else ""}"
            
            ▸ Validación de entrada: EXITOSA ✓ (sin texto vacío detectado)
            ▸ Plugin Capacitor: com.plataforma.lis.GeminiPlugin
            ▸ Longitud del prompt procesado: ${prompt.length} caracteres
            
            NOTA: Para activar el SDK real, agregue al build.gradle del app:
            implementation("com.google.ai.client.generativeai:generativeai:0.9.0")
        """.trimIndent()
    }

    /**
     * @PluginMethod ping
     * Health check — verifies the plugin is registered and reachable from JS.
     */
    @PluginMethod
    fun ping(call: PluginCall) {
        val result = JSObject()
        result.put("status", "ok")
        result.put("plugin", "GeminiPlugin")
        result.put("version", "1.0.0")
        result.put("validationEnabled", true)
        call.resolve(result)
    }
}
