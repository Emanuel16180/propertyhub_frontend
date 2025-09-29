import { tokenManager } from "./authService"
import { LocalStorageDB } from "@/lib/local-storage"

// API Configuration
const API_BASE_URL = "https://propertyhub-backend.onrender.com"

// User/Resident types for property ownership
export interface User {
  id: number | null
  name: string
  email?: string
  phone?: string
  type?: "propietario" | "familiar"
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// User/Resident API Service
export const userService = {
  // Get all users/residents that can be property owners
  getAvailableOwners: async (): Promise<ApiResponse<User[]>> => {
    try {
      console.log("[v0] Fetching available owners...")

      // For now, we'll use the local storage residents as potential owners
      // In the future, this could be replaced with an API call to get users
      const residents = LocalStorageDB.getActiveResidents()

      // Convert residents to User format and add "Sin asignar" option
      const users: User[] = [
        {
          id: null,
          name: "Sin asignar",
          email: "",
          type: "propietario",
        },
        ...residents.map((resident) => ({
          id: Number.parseInt(resident.id),
          name: resident.name,
          email: resident.email,
          phone: resident.phone,
          type: resident.type,
        })),
      ]

      console.log("[v0] Available owners:", users)

      return {
        success: true,
        data: users,
      }
    } catch (error) {
      console.error("[v0] Get available owners error:", error)
      return {
        success: false,
        error: `Error al obtener usuarios: ${error.message}`,
      }
    }
  },

  // Get user by ID (for displaying owner info)
  getUserById: async (id: number): Promise<ApiResponse<User>> => {
    try {
      console.log("[v0] Fetching user with ID:", id)

      const residents = LocalStorageDB.getResidents()
      const resident = residents.find((r) => Number.parseInt(r.id) === id)

      if (!resident) {
        return {
          success: false,
          error: "Usuario no encontrado",
        }
      }

      const user: User = {
        id: Number.parseInt(resident.id),
        name: resident.name,
        email: resident.email,
        phone: resident.phone,
        type: resident.type,
      }

      return {
        success: true,
        data: user,
      }
    } catch (error) {
      console.error("[v0] Get user error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Future: API call to get users from backend
  // This would replace the localStorage approach when the backend has a users endpoint
  getApiUsers: async (): Promise<ApiResponse<User[]>> => {
    try {
      console.log("[v0] Fetching users from API...")

      const response = await fetch(`${API_BASE_URL}/api/users/`, {
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
      const users = data.results || data

      return {
        success: true,
        data: users,
      }
    } catch (error) {
      console.error("[v0] Get API users error:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },
}
