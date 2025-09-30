import { tokenManager } from "./authService"

const API_BASE_URL = "https://propertyhub-backend.onrender.com"

// Types
export interface VisitorFormData {
  reasons: Array<{ value: string; label: string }>
  vehicle_types: Array<{ value: string; label: string }>
  properties: Array<{ id: number; identifier: string; owner_name: string }>
  common_areas: Array<{ id: number; name: string }>
}

export interface VisitorVehicle {
  license_plate: string
  color: string
  model: string
  vehicle_type: string
}

export interface VisitorCheckInRequest {
  full_name: string
  document_id?: string
  reason: string
  property_to_visit?: number
  common_area_to_visit?: number
  observations?: string
  vehicle?: VisitorVehicle
}

export interface VisitorLog {
  id: number
  full_name: string
  document_id: string | null
  reason: string
  property_to_visit: number | null
  common_area_to_visit: number | null
  observations: string | null
  vehicle: VisitorVehicle | null
  check_in_time: string
  check_out_time: string | null
  is_active: boolean
  registered_by: number
  property_details?: {
    id: number
    identifier: string
    owner_name: string
  }
  common_area_details?: {
    id: number
    name: string
  }
}

export interface Property {
  id: number
  house_number: string
  owner_name: string
  owner_email: string
  owner_phone: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export const visitorService = {
  // Get form data for visitor registration
  getFormData: async (): Promise<ApiResponse<VisitorFormData>> => {
    try {
      console.log("[v0] Fetching visitor form data")

      const response = await fetch(`${API_BASE_URL}/api/visitor-control/form-data/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Form data fetched successfully:", data)
        return {
          success: true,
          data: data,
        }
      } else {
        console.error("[v0] Failed to fetch form data:", data)
        return {
          success: false,
          error: data.message || data.error || data.detail || "Error al obtener datos del formulario",
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching form data:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },

  // Register visitor check-in
  checkIn: async (visitorData: VisitorCheckInRequest): Promise<ApiResponse<VisitorLog>> => {
    try {
      console.log("[v0] Registering visitor check-in:", visitorData)

      const response = await fetch(`${API_BASE_URL}/api/visitor-control/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(visitorData),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Visitor checked in successfully:", data)
        return {
          success: true,
          data: data,
        }
      } else {
        console.error("[v0] Failed to check in visitor:", data)
        return {
          success: false,
          error: data.message || data.error || data.detail || "Error al registrar visitante",
        }
      }
    } catch (error) {
      console.error("[v0] Error checking in visitor:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },

  // Get all visitors (active and inactive)
  getAllVisitors: async (includeInactive = true): Promise<ApiResponse<VisitorLog[]>> => {
    try {
      console.log("[v0] Fetching all visitors (includeInactive:", includeInactive, ")")

      const url = `${API_BASE_URL}/api/visitor-control/${includeInactive ? "?include_inactive=true" : ""}`

      const response = await fetch(url, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        const visitors = Array.isArray(data) ? data : data.results || []
        console.log("[v0] Visitors fetched successfully. Count:", visitors.length)
        return {
          success: true,
          data: visitors,
        }
      } else {
        console.error("[v0] Failed to fetch visitors:", data)
        return {
          success: false,
          error: data.message || data.error || data.detail || "Error al obtener visitantes",
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching visitors:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },

  // Check out visitor
  checkOut: async (logId: number): Promise<ApiResponse<VisitorLog>> => {
    try {
      console.log("[v0] Checking out visitor:", logId)

      const response = await fetch(`${API_BASE_URL}/api/visitor-control/${logId}/check-out/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        console.log("[v0] Visitor checked out successfully:", data)
        return {
          success: true,
          data: data,
        }
      } else {
        console.error("[v0] Failed to check out visitor:", data)
        return {
          success: false,
          error: data.message || data.error || data.detail || "Error al registrar salida",
        }
      }
    } catch (error) {
      console.error("[v0] Error checking out visitor:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },

  getProperties: async (): Promise<ApiResponse<Property[]>> => {
    try {
      console.log("[v0] Fetching properties from /api/properties/")

      const response = await fetch(`${API_BASE_URL}/api/properties/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        const properties = Array.isArray(data) ? data : data.results || []
        console.log("[v0] Properties fetched successfully. Count:", properties.length)
        return {
          success: true,
          data: properties,
        }
      } else {
        console.error("[v0] Failed to fetch properties:", data)
        return {
          success: false,
          error: data.message || data.error || data.detail || "Error al obtener propiedades",
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching properties:", error)
      return {
        success: false,
        error: `Error de conexión: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  },
}
