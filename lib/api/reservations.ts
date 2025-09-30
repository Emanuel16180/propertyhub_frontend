import { tokenManager } from "@/services/authService"

const API_BASE_URL = "https://propertyhub-backend.onrender.com/api/reservations"

// Type definitions based on API documentation
export interface CommonAreaOption {
  id: number
  name: string
  area_type_display: string
  capacity: number
  operating_hours: string
  requires_reservation: boolean
  is_available: boolean
}

export interface PropertyOption {
  id: number
  house_number: string
  block: string
  display_name: string
}

export interface ResidentOption {
  id: number
  display_name: string
  is_owner: boolean
}

export interface TimeSlot {
  start_time: string
  end_time: string
  display: string
  available: boolean
  is_past: boolean
  is_occupied: boolean
}

export interface Reservation {
  id: number
  common_area: {
    id: number
    name: string
    area_type_display: string
    capacity: number
    operating_hours: string
  }
  house_property: {
    id: number
    house_number: string
    block: string
    display_name: string
  }
  resident: {
    id: number
    display_name: string
  }
  date: string
  start_time: string
  end_time: string
  notes?: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  status_display: string
  created_by_name: string
  created_at: string
  duration_hours: number
  can_be_cancelled: boolean
}

export interface ReservationStats {
  total_reservations: number
  confirmed_reservations: number
  pending_reservations: number
  cancelled_reservations: number
  today_reservations: number
  week_reservations: number
  month_reservations: number
  upcoming_reservations: number
  by_area: Record<string, { count: number; area_type: string }>
  by_status: Record<string, number>
}

export interface CreateReservationData {
  common_area_id: number
  property_id: number
  resident_id: number
  date: string
  start_time: string
  end_time: string
  notes?: string
}

// Helper function to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = await response.json()
      if (errorData.detail) {
        errorMessage = errorData.detail
      } else if (typeof errorData === "object") {
        // Handle field-specific errors
        const errors = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
          .join("; ")
        errorMessage = errors || errorMessage
      }
    } catch {
      // If error response is not JSON, use status text
    }
    throw new Error(errorMessage)
  }
  return response.json()
}

export const reservationsAPI = {
  // Get available common areas for reservation
  async getCommonAreas(): Promise<CommonAreaOption[]> {
    const response = await fetch(`${API_BASE_URL}/common-areas/`, {
      headers: tokenManager.getAuthHeaders(),
    })
    const data = await handleResponse<{ areas: CommonAreaOption[] }>(response)
    return data.areas
  },

  // Get available properties
  async getProperties(): Promise<PropertyOption[]> {
    const response = await fetch(`${API_BASE_URL}/properties/`, {
      headers: tokenManager.getAuthHeaders(),
    })
    const data = await handleResponse<{ properties: PropertyOption[] }>(response)
    return data.properties
  },

  // Get residents by property
  async getResidentsByProperty(propertyId: number): Promise<ResidentOption[]> {
    const response = await fetch(`${API_BASE_URL}/residents-by-property/`, {
      method: "POST",
      headers: {
        ...tokenManager.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ property_id: propertyId }),
    })
    const data = await handleResponse<{ residents: ResidentOption[] }>(response)
    return data.residents
  },

  // Get available time slots for a specific area and date
  async getAvailableTimeSlots(commonAreaId: number, date: string): Promise<TimeSlot[]> {
    const response = await fetch(`${API_BASE_URL}/available-time-slots/`, {
      method: "POST",
      headers: {
        ...tokenManager.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        common_area_id: commonAreaId,
        date: date,
      }),
    })
    const data = await handleResponse<{ time_slots: TimeSlot[] }>(response)
    return data.time_slots
  },

  // Create a new reservation
  async createReservation(reservationData: CreateReservationData): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: "POST",
      headers: {
        ...tokenManager.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reservationData),
    })
    const data = await handleResponse<{ reservation: Reservation }>(response)
    return data.reservation
  },

  // Get all reservations with optional filters
  async getReservations(filters?: {
    common_area_id?: number
    property_id?: number
    resident_id?: number
    status?: string
    date?: string
    page?: number
    page_size?: number
  }): Promise<{ results: Reservation[]; count: number; next: string | null; previous: string | null }> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    const url = `${API_BASE_URL}/${params.toString() ? `?${params.toString()}` : ""}`
    const response = await fetch(url, {
      headers: tokenManager.getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Get a specific reservation by ID
  async getReservation(id: number): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/${id}/`, {
      headers: tokenManager.getAuthHeaders(),
    })
    return handleResponse(response)
  },

  // Update a reservation
  async updateReservation(id: number, updates: Partial<CreateReservationData>): Promise<Reservation> {
    const response = await fetch(`${API_BASE_URL}/${id}/`, {
      method: "PATCH",
      headers: {
        ...tokenManager.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })
    return handleResponse(response)
  },

  // Cancel a reservation
  async cancelReservation(id: number, reason?: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/${id}/cancel/`, {
      method: "POST",
      headers: {
        ...tokenManager.getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason: reason || "Cancelada por el usuario" }),
    })
    return handleResponse(response)
  },

  // Delete a reservation
  async deleteReservation(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}/`, {
      method: "DELETE",
      headers: tokenManager.getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error(`Failed to delete reservation: ${response.statusText}`)
    }
  },

  // Get my reservations
  async getMyReservations(): Promise<Reservation[]> {
    const response = await fetch(`${API_BASE_URL}/my-reservations/`, {
      headers: tokenManager.getAuthHeaders(),
    })
    const data = await handleResponse<{ results: Reservation[] }>(response)
    return data.results
  },

  // Get reservations by area
  async getReservationsByArea(
    areaId: number,
    filters?: {
      date_from?: string
      date_to?: string
      status?: string
    },
  ): Promise<Reservation[]> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }

    const url = `${API_BASE_URL}/by-area/${areaId}/${params.toString() ? `?${params.toString()}` : ""}`
    const response = await fetch(url, {
      headers: tokenManager.getAuthHeaders(),
    })
    const data = await handleResponse<{ results: Reservation[] }>(response)
    return data.results
  },

  // Get reservations by date
  async getReservationsByDate(date: string): Promise<Reservation[]> {
    const response = await fetch(`${API_BASE_URL}/by-date/?date=${date}`, {
      headers: tokenManager.getAuthHeaders(),
    })
    const data = await handleResponse<{ results: Reservation[] }>(response)
    return data.results
  },

  // Get upcoming reservations
  async getUpcomingReservations(): Promise<Reservation[]> {
    const response = await fetch(`${API_BASE_URL}/upcoming/`, {
      headers: tokenManager.getAuthHeaders(),
    })
    const data = await handleResponse<{ results: Reservation[] }>(response)
    return data.results
  },

  // Check availability for a date range
  async checkAvailability(areaId: number, startDate: string, endDate: string) {
    const response = await fetch(
      `${API_BASE_URL}/check-availability/?area_id=${areaId}&start_date=${startDate}&end_date=${endDate}`,
      {
        headers: tokenManager.getAuthHeaders(),
      },
    )
    return handleResponse(response)
  },

  // Get reservation statistics
  async getStats(): Promise<ReservationStats> {
    const response = await fetch(`${API_BASE_URL}/stats/`, {
      headers: tokenManager.getAuthHeaders(),
    })
    return handleResponse(response)
  },
}
