import { tokenManager } from "./authService"

// API Configuration
const API_BASE_URL = "https://propertyhub-backend.onrender.com"

// Types based on the API endpoints provided
export interface Property {
  id?: number
  house_number: string
  block?: string
  floor?: string
  area_m2?: number
  bedrooms?: number
  bathrooms?: number
  parking_spaces?: number
  status: "available" | "occupied" | "maintenance" | "reserved"
  description?: string
  owner?: {
    id: number
    name: string
  }
  residents?: Array<{
    id: number
    name: string
    relationship: string
  }>
  created_at?: string
  updated_at?: string
  resident_count?: number
}

export interface PropertyStats {
  total_properties: number
  available: number
  occupied: number
  maintenance: number
  reserved: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Property API Service
export const propertyService = {
  // Get all properties
  getProperties: async (): Promise<ApiResponse<Property[]>> => {
    try {
      console.log("[v0] Fetching all properties...")

      const response = await fetch(`${API_BASE_URL}/api/properties/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      console.log("[v0] Properties response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Properties error response:", errorText)

        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      console.log("[v0] Properties data:", data)

      const properties = data.results || data
      console.log("[v0] Extracted properties:", properties)

      return {
        success: true,
        data: properties,
      }
    } catch (error) {
      console.error("[v0] Get properties error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Get property by ID
  getProperty: async (id: number): Promise<ApiResponse<Property>> => {
    try {
      console.log("[v0] Fetching property with ID:", id)

      const response = await fetch(`${API_BASE_URL}/api/properties/${id}/`, {
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
      console.error("[v0] Get property error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Create new property
  createProperty: async (
    property: Omit<Property, "id" | "created_at" | "updated_at">,
  ): Promise<ApiResponse<Property>> => {
    try {
      console.log("[v0] Creating property:", property)

      const response = await fetch(`${API_BASE_URL}/api/properties/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(property),
      })

      console.log("[v0] Create property response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Create property error response:", errorText)

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
      console.log("[v0] Created property data:", data)

      return {
        success: true,
        data: data,
      }
    } catch (error) {
      console.error("[v0] Create property error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Update property
  updateProperty: async (id: number, property: Partial<Property>): Promise<ApiResponse<Property>> => {
    try {
      console.log("[v0] Updating property:", id, property)

      const response = await fetch(`${API_BASE_URL}/api/properties/${id}/`, {
        method: "PUT",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify(property),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Update property error response:", errorText)

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
      console.error("[v0] Update property error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Delete property
  deleteProperty: async (id: number): Promise<ApiResponse<void>> => {
    try {
      console.log("[v0] Deleting property:", id)

      const response = await fetch(`${API_BASE_URL}/api/properties/${id}/`, {
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
      console.error("[v0] Delete property error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Get properties by status
  getPropertiesByStatus: async (status: Property["status"]): Promise<ApiResponse<Property[]>> => {
    try {
      console.log("[v0] Fetching properties by status:", status)

      const response = await fetch(`${API_BASE_URL}/api/properties/status/${status}/`, {
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
      const properties = data.results || data

      return {
        success: true,
        data: properties,
      }
    } catch (error) {
      console.error("[v0] Get properties by status error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Get property statistics
  getPropertyStats: async (): Promise<ApiResponse<PropertyStats>> => {
    try {
      console.log("[v0] Fetching property statistics...")

      const response = await fetch(`${API_BASE_URL}/api/properties/stats/`, {
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
      console.error("[v0] Get property stats error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Assign owner to property
  assignOwner: async (propertyId: number, ownerId: number): Promise<ApiResponse<Property>> => {
    try {
      console.log("[v0] Assigning owner to property:", propertyId, ownerId)

      const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/assign-owner/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify({ owner_id: ownerId }),
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
      console.error("[v0] Assign owner error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Remove owner from property
  removeOwner: async (propertyId: number): Promise<ApiResponse<Property>> => {
    try {
      console.log("[v0] Removing owner from property:", propertyId)

      const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/remove-owner/`, {
        method: "POST",
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
      console.error("[v0] Remove owner error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Add resident to property
  addResident: async (propertyId: number, residentId: number, relationship: string): Promise<ApiResponse<Property>> => {
    try {
      console.log("[v0] Adding resident to property:", propertyId, residentId, relationship)

      const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/add-resident/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
        body: JSON.stringify({
          resident_id: residentId,
          relationship: relationship,
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
      console.error("[v0] Add resident error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Get properties with residents
  getPropertiesWithResidents: async (): Promise<ApiResponse<Property[]>> => {
    try {
      console.log("[v0] Fetching properties with residents...")

      const response = await fetch(`${API_BASE_URL}/api/properties/with-residents/`, {
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
      const properties = data.results || data

      // Add resident count to each property
      const propertiesWithCount = properties.map((property: any) => ({
        ...property,
        resident_count: property.residents?.length || 0,
      }))

      return {
        success: true,
        data: propertiesWithCount,
      }
    } catch (error) {
      console.error("[v0] Get properties with residents error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },
}
