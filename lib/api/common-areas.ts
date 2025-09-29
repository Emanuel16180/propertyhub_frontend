import { tokenManager } from "@/services/authService"

const API_BASE_URL = "https://propertyhub-backend.onrender.com"

export interface CommonAreaAPI {
  id: number
  name: string
  area_type:
    | "pool"
    | "gym"
    | "salon_social"
    | "piscina"
    | "gimnasio"
    | "parque_jardin"
    | "cancha_deportiva"
    | "zona_bbq"
    | "other"
  area_type_display: string
  location: string
  capacity: number
  requires_reservation: boolean
  reservation_fee: string
  start_time: string // Changed from opening_time to start_time
  end_time: string // Changed from closing_time to end_time
  is_active: boolean
  is_under_maintenance: boolean
  usage_rules: string // Changed from rules to usage_rules
  description: string
  created_at: string
}

export interface CreateCommonAreaRequest {
  name: string
  area_type:
    | "pool"
    | "gym"
    | "salon_social"
    | "piscina"
    | "gimnasio"
    | "parque_jardin"
    | "cancha_deportiva"
    | "zona_bbq"
    | "other"
  location?: string
  capacity?: number
  requires_reservation?: boolean
  reservation_fee?: number
  start_time?: string // Changed from opening_time to start_time
  end_time?: string // Changed from closing_time to end_time
  usage_rules?: string // Changed from rules to usage_rules
  description?: string
}

export interface CommonAreasResponse {
  count: number
  next: string | null
  previous: string | null
  results: CommonAreaAPI[]
}

export interface AvailabilityCheckRequest {
  date: string
  time: string
}

export interface AvailabilityCheckResponse {
  is_available: boolean
  area_name: string
  date: string
  time: string
  message: string
  start_time: string // Changed from opening_time to start_time
  end_time: string // Changed from closing_time to end_time
}

export interface MaintenanceToggleRequest {
  is_under_maintenance: boolean
  maintenance_reason?: string
}

export interface CommonAreaStats {
  total_areas: number
  by_type: Record<string, { count: number; display_name: string }>
  available_areas: number
  under_maintenance: number
  requires_reservation: number
  free_access: number
  average_capacity: number
}

export interface CommonAreaType {
  type: string
  display_name: string
  count: number
}

export interface CommonAreaTypesResponse {
  area_types: CommonAreaType[]
  total_areas: number
}

class CommonAreasAPI {
  private getAuthHeaders(): HeadersInit {
    return {
      ...tokenManager.getAuthHeaders(),
      "Content-Type": "application/json",
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`

      try {
        const errorData = await response.json()
        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        // If we can't parse JSON, use status text
        errorMessage = response.statusText || errorMessage
      }

      // Handle specific HTTP status codes
      switch (response.status) {
        case 401:
          throw new Error("No autorizado. Por favor, inicie sesión nuevamente.")
        case 403:
          throw new Error("No tiene permisos para realizar esta acción.")
        case 404:
          throw new Error("El recurso solicitado no fue encontrado.")
        case 422:
          throw new Error(`Datos inválidos: ${errorMessage}`)
        case 500:
          throw new Error("Error interno del servidor. Intente nuevamente más tarde.")
        case 503:
          throw new Error("Servicio no disponible. Intente nuevamente más tarde.")
        default:
          throw new Error(`Error de API: ${errorMessage}`)
      }
    }
    return response.json()
  }

  private async makeRequest<T>(requestFn: () => Promise<Response>): Promise<T> {
    try {
      const response = await requestFn()
      return this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Error de conexión. Verifique su conexión a internet.")
      }
      throw error
    }
  }

  // CRUD Operations
  async getAllCommonAreas(): Promise<CommonAreasResponse> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      }),
    )
  }

  async getCommonAreaById(id: number): Promise<CommonAreaAPI> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/${id}/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      }),
    )
  }

  async createCommonArea(data: CreateCommonAreaRequest): Promise<CommonAreaAPI> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }),
    )
  }

  async updateCommonArea(id: number, data: Partial<CreateCommonAreaRequest>): Promise<CommonAreaAPI> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/${id}/`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }),
    )
  }

  async deleteCommonArea(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/common-areas/${id}/`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        await this.handleResponse(response) // This will throw the appropriate error
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Error de conexión. Verifique su conexión a internet.")
      }
      throw error
    }
  }

  // Filtering and Search
  async getCommonAreasByType(areaType: string): Promise<CommonAreaAPI[]> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/type/${areaType}/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      }),
    )
  }

  async getAvailableCommonAreas(): Promise<{ message: string; count: number; areas: CommonAreaAPI[] }> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/available/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      }),
    )
  }

  async getReservationRequiredAreas(): Promise<CommonAreaAPI[]> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/reservation-required/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      }),
    )
  }

  async searchCommonAreas(params: {
    q?: string
    area_type?: string
    requires_reservation?: boolean
  }): Promise<CommonAreaAPI[]> {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.append("q", params.q)
    if (params.area_type) searchParams.append("area_type", params.area_type)
    if (params.requires_reservation !== undefined) {
      searchParams.append("requires_reservation", params.requires_reservation.toString())
    }

    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/search/?${searchParams}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      }),
    )
  }

  // Availability Management
  async checkAvailability(areaId: number, data: AvailabilityCheckRequest): Promise<AvailabilityCheckResponse> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/${areaId}/check-availability/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }),
    )
  }

  async toggleMaintenance(areaId: number, data: MaintenanceToggleRequest): Promise<CommonAreaAPI> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/${areaId}/toggle-maintenance/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      }),
    )
  }

  // Information and Statistics
  async getCommonAreaTypes(): Promise<CommonAreaTypesResponse> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/types/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      }),
    )
  }

  async getCommonAreaStats(): Promise<CommonAreaStats> {
    return this.makeRequest(() =>
      fetch(`${API_BASE_URL}/api/common-areas/stats/`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      }),
    )
  }

  // Helper methods for compatibility with existing code
  async getCommonAreasForDropdown(): Promise<string[]> {
    try {
      const response = await this.getAllCommonAreas()
      return response.results.filter((area) => area.is_active && !area.is_under_maintenance).map((area) => area.name)
    } catch (error) {
      console.error("Error fetching common areas for dropdown:", error)
      if (error instanceof Error) {
        console.error("Detailed error:", error.message)
      }
      // Return empty array as fallback
      return []
    }
  }

  // Convert API format to local storage format for compatibility
  convertToLocalFormat(apiArea: CommonAreaAPI): {
    id: number
    name: string
    description: string
    capacity: number
    schedule: string
    location: string
  } {
    return {
      id: apiArea.id,
      name: apiArea.name,
      description: apiArea.description,
      capacity: apiArea.capacity,
      schedule: `${apiArea.start_time} - ${apiArea.end_time}`, // Updated field names
      location: apiArea.location,
    }
  }

  // Convert local format to API format
  convertToAPIFormat(localArea: {
    name: string
    type?: string
    location?: string
    capacity?: string
    available_hours_start?: string
    available_hours_end?: string
    requires_reservation?: boolean
    rules?: string
    description?: string
  }): CreateCommonAreaRequest {
    const typeMapping: Record<string, CreateCommonAreaRequest["area_type"]> = {
      salon: "salon_social",
      piscina: "piscina",
      gimnasio: "gimnasio",
      parque: "parque_jardin",
      cancha: "cancha_deportiva",
      bbq: "zona_bbq",
      otro: "other",
    }

    const formatTime = (time?: string): string | undefined => {
      if (!time) return undefined
      // Convert HH:MM to HH:MM:SS format
      return time.includes(":") && time.split(":").length === 2 ? `${time}:00` : time
    }

    return {
      name: localArea.name,
      area_type: typeMapping[localArea.type || "otro"] || "other",
      location: localArea.location,
      capacity: localArea.capacity ? Number.parseInt(localArea.capacity) : undefined,
      start_time: formatTime(localArea.available_hours_start), // Changed from opening_time to start_time
      end_time: formatTime(localArea.available_hours_end), // Changed from closing_time to end_time
      requires_reservation: localArea.requires_reservation,
      reservation_fee: localArea.requires_reservation ? 0 : undefined,
      usage_rules: localArea.rules, // Changed from rules to usage_rules
      description: localArea.description,
    }
  }
}

export const commonAreasAPI = new CommonAreasAPI()
