import { tokenManager } from "./authService"

const API_BASE_URL = "https://propertyhub-backend.onrender.com"

// Types
export interface AccessLogRequest {
  resident_id?: number | null
  confidence: number
  is_authorized: boolean
  main_message: string
  detail_message: string
  access_point?: string
}

export interface AccessLogResponse {
  id: number
  resident_id: number | null
  confidence: string
  is_authorized: boolean
  main_message: string
  detail_message: string
  access_point: string
  access_time: string
  resident?: {
    id: number
    first_name: string
    last_name: string
    profile: {
      resident_info: {
        house_identifier: string
        resident_type: string
      }
    }
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export const accessControlService = {
  // Register access attempt
  registerAccessAttempt: async (accessLog: AccessLogRequest): Promise<ApiResponse<AccessLogResponse>> => {
    try {
      const formattedAccessLog = {
        ...accessLog,
        confidence: Math.round(accessLog.confidence * 100) / 100, // e.g., 0.8534567 -> 0.85
      }

      console.log("[v0] Registering access attempt:", formattedAccessLog)

      const response = await fetch(`${API_BASE_URL}/api/access-control/logs/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(formattedAccessLog),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Access attempt registered successfully:", data)
        return {
          success: true,
          data: data,
        }
      } else {
        console.error("[v0] Failed to register access attempt:", data)
        return {
          success: false,
          error: data.message || data.error || "Error al registrar intento de acceso",
        }
      }
    } catch (error) {
      console.error("[v0] Error registering access attempt:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },

  // Get latest access logs
  getLatestAccessLogs: async (limit = 5): Promise<ApiResponse<AccessLogResponse[]>> => {
    try {
      console.log(`[v0] Fetching latest ${limit} access logs`)

      const response = await fetch(`${API_BASE_URL}/api/access-control/logs/latest/${limit}/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Access logs fetched successfully:", data)
        return {
          success: true,
          data: Array.isArray(data) ? data : [],
        }
      } else {
        console.error("[v0] Failed to fetch access logs:", data)
        return {
          success: false,
          error: data.message || data.error || "Error al obtener registros de acceso",
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching access logs:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },

  // Get all access logs (paginated)
  getAllAccessLogs: async (page = 1, pageSize = 50): Promise<ApiResponse<AccessLogResponse[]>> => {
    try {
      console.log(`[v0] Fetching all access logs (page: ${page}, pageSize: ${pageSize})`)

      const url = `${API_BASE_URL}/api/access-control/logs/?page=${page}&page_size=${pageSize}`
      console.log(`[v0] Request URL:`, url)
      console.log(`[v0] Request headers:`, tokenManager.getAuthHeaders())

      const response = await fetch(url, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      console.log(`[v0] Response status:`, response.status)
      console.log(`[v0] Response ok:`, response.ok)

      const data = await response.json()
      console.log(`[v0] Response data:`, data)

      if (response.ok) {
        const logs = data.results || data
        console.log(`[v0] Access logs fetched successfully. Count:`, Array.isArray(logs) ? logs.length : 0)
        return {
          success: true,
          data: Array.isArray(logs) ? logs : [],
        }
      } else {
        console.error(`[v0] Failed to fetch access logs. Status: ${response.status}`, data)
        return {
          success: false,
          error: data.message || data.error || data.detail || "Error al obtener registros de acceso",
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching all access logs:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },
}
