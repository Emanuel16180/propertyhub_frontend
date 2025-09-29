import { tokenManager } from "./authService"

// API Configuration
const API_BASE_URL = "https://propertyhub-backend.onrender.com"

// Vehicle types based on API
export interface ApiVehicle {
  id?: number
  license_plate: string
  brand: string
  model: string
  year: number
  color: string
  vehicle_type: "light" | "heavy" | "motorcycle"
  vehicle_type_display?: string
  owner: {
    id: number
    full_name: string
    house_info: string
  }
  is_active: boolean
  created_at?: string
  description?: string
}

export interface CreateVehicleData {
  license_plate: string
  brand: string
  model: string
  year: number
  color: string
  vehicle_type: "light" | "heavy" | "motorcycle"
  owner_id: number
  description?: string
}

export interface VehicleResident {
  full_name: string
  house_info: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Vehicle API Service
export const vehicleService = {
  // Get all vehicles
  getVehicles: async (): Promise<ApiResponse<ApiVehicle[]>> => {
    try {
      console.log("[v0] Fetching all vehicles...")

      const response = await fetch(`${API_BASE_URL}/api/vehicles/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      console.log("[v0] Vehicles response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Vehicles error response:", errorText)

        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      console.log("[v0] Vehicles data:", data)

      const vehicles = data.results || data
      console.log("[v0] Extracted vehicles:", vehicles)

      return {
        success: true,
        data: vehicles,
      }
    } catch (error) {
      console.error("[v0] Get vehicles error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Get vehicle by ID
  getVehicle: async (id: number): Promise<ApiResponse<ApiVehicle>> => {
    try {
      console.log("[v0] Fetching vehicle with ID:", id)

      const response = await fetch(`${API_BASE_URL}/api/vehicles/${id}/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data,
      }
    } catch (error) {
      console.error("[v0] Get vehicle error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Create new vehicle
  createVehicle: async (vehicle: CreateVehicleData): Promise<ApiResponse<ApiVehicle>> => {
    try {
      console.log("[v0] Creating vehicle:", vehicle)

      const response = await fetch(`${API_BASE_URL}/api/vehicles/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(vehicle),
      })

      console.log("[v0] Create vehicle response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Create vehicle error response:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          return {
            success: false,
            error: errorData.message || errorData.error || `Error ${response.status}`,
          }
        } catch {
          return {
            success: false,
            error: `Error ${response.status}: ${errorText}`,
          }
        }
      }

      const data = await response.json()
      console.log("[v0] Created vehicle data:", data)

      return {
        success: true,
        data: data,
      }
    } catch (error) {
      console.error("[v0] Create vehicle error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Update vehicle
  updateVehicle: async (id: number, vehicle: Partial<CreateVehicleData>): Promise<ApiResponse<ApiVehicle>> => {
    try {
      console.log("[v0] Updating vehicle:", id, vehicle)

      const response = await fetch(`${API_BASE_URL}/api/vehicles/${id}/`, {
        method: "PUT",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(vehicle),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Update vehicle error response:", errorText)

        try {
          const errorData = JSON.parse(errorText)
          return {
            success: false,
            error: errorData.message || errorData.error || `Error ${response.status}`,
          }
        } catch {
          return {
            success: false,
            error: `Error ${response.status}: ${errorText}`,
          }
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data,
      }
    } catch (error) {
      console.error("[v0] Update vehicle error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Delete vehicle
  deleteVehicle: async (id: number): Promise<ApiResponse<void>> => {
    try {
      console.log("[v0] Deleting vehicle:", id)

      const response = await fetch(`${API_BASE_URL}/api/vehicles/${id}/`, {
        method: "DELETE",
        headers: tokenManager.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      console.error("[v0] Delete vehicle error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Get residents for dropdown (key endpoint from API docs)
  getResidentsForDropdown: async (): Promise<ApiResponse<VehicleResident[]>> => {
    try {
      console.log("[v0] Fetching residents for vehicle dropdown...")

      const response = await fetch(`${API_BASE_URL}/api/vehicles/residents/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      console.log("[v0] Vehicle residents response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Vehicle residents error response:", errorText)

        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      console.log("[v0] Vehicle residents data:", data)

      const residents = data.residents || data
      console.log("[v0] Extracted residents for dropdown:", residents)

      return {
        success: true,
        data: residents,
      }
    } catch (error) {
      console.error("[v0] Get vehicle residents error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Get vehicles by type
  getVehiclesByType: async (vehicleType: "light" | "heavy" | "motorcycle"): Promise<ApiResponse<ApiVehicle[]>> => {
    try {
      console.log("[v0] Fetching vehicles by type:", vehicleType)

      const response = await fetch(`${API_BASE_URL}/api/vehicles/type/${vehicleType}/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      const vehicles = data.results || data

      return {
        success: true,
        data: vehicles,
      }
    } catch (error) {
      console.error("[v0] Get vehicles by type error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Get vehicles by resident
  getVehiclesByResident: async (residentId: number): Promise<ApiResponse<ApiVehicle[]>> => {
    try {
      console.log("[v0] Fetching vehicles by resident:", residentId)

      const response = await fetch(`${API_BASE_URL}/api/vehicles/resident/${residentId}/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      const vehicles = data.results || data

      return {
        success: true,
        data: vehicles,
      }
    } catch (error) {
      console.error("[v0] Get vehicles by resident error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Search vehicles
  searchVehicles: async (query: string, vehicleType?: string, owner?: string): Promise<ApiResponse<ApiVehicle[]>> => {
    try {
      console.log("[v0] Searching vehicles:", query, vehicleType, owner)

      const params = new URLSearchParams()
      if (query) params.append("q", query)
      if (vehicleType) params.append("vehicle_type", vehicleType)
      if (owner) params.append("owner", owner)

      const response = await fetch(`${API_BASE_URL}/api/vehicles/search/?${params.toString()}`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      const vehicles = data.results || data

      return {
        success: true,
        data: vehicles,
      }
    } catch (error) {
      console.error("[v0] Search vehicles error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Change vehicle owner
  changeVehicleOwner: async (
    vehicleId: number,
    newOwnerId: number,
    reason?: string,
  ): Promise<ApiResponse<ApiVehicle>> => {
    try {
      console.log("[v0] Changing vehicle owner:", vehicleId, newOwnerId, reason)

      const response = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/change-owner/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify({
          new_owner_id: newOwnerId,
          reason: reason || "Cambio de propietario",
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data,
      }
    } catch (error) {
      console.error("[v0] Change vehicle owner error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Get vehicle statistics
  getVehicleStats: async (): Promise<ApiResponse<any>> => {
    try {
      console.log("[v0] Fetching vehicle statistics...")

      const response = await fetch(`${API_BASE_URL}/api/vehicles/stats/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: data,
      }
    } catch (error) {
      console.error("[v0] Get vehicle stats error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },
}
