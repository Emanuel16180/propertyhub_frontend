import { tokenManager } from "./authService"

const API_BASE_URL = "https://propertyhub-backend.onrender.com"

// Types
export interface IntrusionAlertRequest {
  message: string
  confidence: number
  camera_identifier: string
}

export interface IntrusionAlertResponse {
  id: number
  message: string
  confidence: string
  detection_time: string
  camera_identifier: string
  is_resolved: boolean
  resolved_by: number | null
  resolved_by_name: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export const intrusionService = {
  // Register a new intrusion alert
  registerIntrusion: async (alert: IntrusionAlertRequest): Promise<ApiResponse<IntrusionAlertResponse>> => {
    try {
      const formattedAlert = {
        ...alert,
        confidence: Math.round(alert.confidence * 100) / 100, // Format to 2 decimals
      }

      console.log("[v0] Registering intrusion alert:", formattedAlert)

      const response = await fetch(`${API_BASE_URL}/api/security/intrusions/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(formattedAlert),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Intrusion alert registered successfully:", data)
        return {
          success: true,
          data: data,
        }
      } else {
        console.error("[v0] Failed to register intrusion alert:", data)
        return {
          success: false,
          error: data.message || data.error || "Error al registrar alerta de intrusión",
        }
      }
    } catch (error) {
      console.error("[v0] Error registering intrusion alert:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },

  // Get all intrusion alerts (optionally filter by resolved status)
  getIntrusions: async (isResolved?: boolean): Promise<ApiResponse<IntrusionAlertResponse[]>> => {
    try {
      const url =
        isResolved !== undefined
          ? `${API_BASE_URL}/api/security/intrusions/?is_resolved=${isResolved}`
          : `${API_BASE_URL}/api/security/intrusions/`

      console.log("[v0] Fetching intrusion alerts from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Intrusion alerts fetched successfully:", data)
        return {
          success: true,
          data: Array.isArray(data) ? data : data.results || [],
        }
      } else {
        console.error("[v0] Failed to fetch intrusion alerts:", data)
        return {
          success: false,
          error: data.message || data.error || "Error al obtener alertas de intrusión",
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching intrusion alerts:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },

  // Mark an intrusion alert as resolved
  resolveIntrusion: async (
    intrusionId: number,
  ): Promise<ApiResponse<{ message: string; log: IntrusionAlertResponse }>> => {
    try {
      console.log(`[v0] Resolving intrusion alert ${intrusionId}`)

      const response = await fetch(`${API_BASE_URL}/api/security/intrusions/${intrusionId}/resolve/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Intrusion alert resolved successfully:", data)
        return {
          success: true,
          data: data,
        }
      } else {
        console.error("[v0] Failed to resolve intrusion alert:", data)
        return {
          success: false,
          error: data.message || data.error || "Error al resolver alerta de intrusión",
        }
      }
    } catch (error) {
      console.error("[v0] Error resolving intrusion alert:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },
}
