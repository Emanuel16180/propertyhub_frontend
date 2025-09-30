import { tokenManager } from "@/services/authService"

const API_BASE_URL = "https://propertyhub-backend.onrender.com/api"

export interface CommunicationAuthor {
  id: number
  username: string
  first_name: string
  last_name: string
}

export interface Communication {
  id: number
  title: string
  message: string
  communication_type: "urgent" | "general" | "maintenance" | "event"
  communication_type_display: string
  priority: "baja" | "media" | "alta"
  priority_display: string
  target_audience: "all_residents" | "owners_only" | "tenants_only"
  target_audience_display: string
  author: CommunicationAuthor
  author_name: string
  created_at: string
  updated_at: string
  published_at: string
  expires_at: string | null
  is_active: boolean
  attachments: string | null
  read_count: number
  is_read_by_user: boolean
}

export interface CommunicationListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Communication[]
}

export interface CommunicationStats {
  total_communications: number
  by_type: Array<{ communication_type: string; count: number }>
  by_priority: Array<{ priority: string; count: number }>
  user_communications: number
  unread_count: number
}

export interface CreateCommunicationData {
  title: string
  message: string
  communication_type: "urgent" | "general" | "maintenance" | "event"
  priority: "baja" | "media" | "alta"
  target_audience: "all_residents" | "owners_only" | "tenants_only"
  expires_at?: string | null
}

export interface UpdateCommunicationData extends Partial<CreateCommunicationData> {}

export interface CommunicationFilters {
  type?: "urgent" | "general" | "maintenance" | "event"
  priority?: "baja" | "media" | "alta"
  audience?: "all_residents" | "owners_only" | "tenants_only"
  search?: string
  page?: number
  page_size?: number
}

class CommunicationsAPI {
  async getCommunications(filters?: CommunicationFilters): Promise<CommunicationListResponse> {
    const queryParams = new URLSearchParams()

    if (filters?.type) queryParams.append("type", filters.type)
    if (filters?.priority) queryParams.append("priority", filters.priority)
    if (filters?.audience) queryParams.append("audience", filters.audience)
    if (filters?.search) queryParams.append("search", filters.search)
    if (filters?.page) queryParams.append("page", filters.page.toString())
    if (filters?.page_size) queryParams.append("page_size", filters.page_size.toString())

    const url = `${API_BASE_URL}/communications/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      if (!response.ok) {
        let errorMessage = `Failed to fetch communications: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch (e) {
          // Ignore parse error
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("[v0] Fetch error:", error)
      throw error
    }
  }

  async getCommunication(id: number): Promise<Communication> {
    try {
      const response = await fetch(`${API_BASE_URL}/communications/${id}/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      if (!response.ok) {
        let errorMessage = `Failed to fetch communication: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch (e) {
          // Ignore parse error
        }
        throw new Error(errorMessage)
      }

      return response.json()
    } catch (error) {
      console.error("[v0] Fetch communication error:", error)
      throw error
    }
  }

  async createCommunication(data: CreateCommunicationData): Promise<Communication> {
    const response = await fetch(`${API_BASE_URL}/communications/`, {
      method: "POST",
      headers: tokenManager.getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to create communication: ${response.statusText}`)
    }

    return response.json()
  }

  async updateCommunication(id: number, data: UpdateCommunicationData): Promise<Communication> {
    const response = await fetch(`${API_BASE_URL}/communications/${id}/`, {
      method: "PATCH",
      headers: tokenManager.getAuthHeaders(),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to update communication: ${response.statusText}`)
    }

    return response.json()
  }

  async deleteCommunication(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/communications/${id}/`, {
      method: "DELETE",
      headers: tokenManager.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete communication: ${response.statusText}`)
    }

    return response.json()
  }

  async markAsRead(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/communications/${id}/mark-read/`, {
      method: "POST",
      headers: tokenManager.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to mark communication as read: ${response.statusText}`)
    }

    return response.json()
  }

  async getMyCommunications(): Promise<Communication[]> {
    const response = await fetch(`${API_BASE_URL}/communications/my-communications/`, {
      method: "GET",
      headers: tokenManager.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch my communications: ${response.statusText}`)
    }

    return response.json()
  }

  async getUrgentCommunications(): Promise<Communication[]> {
    const response = await fetch(`${API_BASE_URL}/communications/urgent/`, {
      method: "GET",
      headers: tokenManager.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch urgent communications: ${response.statusText}`)
    }

    return response.json()
  }

  async getStats(): Promise<CommunicationStats> {
    const url = `${API_BASE_URL}/communications/stats/`

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      if (!response.ok) {
        let errorMessage = `Failed to fetch communication stats: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch (e) {
          // Ignore parse error
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("[v0] Fetch stats error:", error)
      throw error
    }
  }
}

export const communicationsAPI = new CommunicationsAPI()

// Helper functions for UI
export const getCommunicationTypeConfig = (
  type: Communication["communication_type"],
): { label: string; color: string } => {
  const configs = {
    urgent: { label: "Urgente", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
    general: { label: "Anuncio General", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
    maintenance: {
      label: "Mantenimiento",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    },
    event: { label: "Evento", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
  }
  return configs[type] || configs.general
}

export const getPriorityIcon = (priority: Communication["priority"]): string => {
  const icons = {
    alta: "🔴",
    media: "🟡",
    baja: "🟢",
  }
  return icons[priority] || "⚪"
}

export const getTargetAudienceLabel = (audience: Communication["target_audience"]): string => {
  const labels = {
    all_residents: "Todos los Residentes",
    owners_only: "Solo Propietarios",
    tenants_only: "Solo Inquilinos",
  }
  return labels[audience] || audience
}
