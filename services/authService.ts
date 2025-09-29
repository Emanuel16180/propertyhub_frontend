// API Configuration
const API_BASE_URL = "https://propertyhub-backend.onrender.com"
const DEVELOPMENT_MODE = process.env.NODE_ENV === "development"

// Types
export interface LoginCredentials {
  username: string
  password: string
}

export interface User {
  id: string
  username: string
  email: string
  role: "admin" | "resident" | "security" | "camera"
  firstName: string
  lastName: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token")
    }
    return null
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token")
    }
    return null
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken)
      localStorage.setItem("refresh_token", refreshToken)
    }
  },

  clearTokens: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      localStorage.removeItem("isAuthenticated")
    }
  },

  getAuthHeaders: (): Record<string, string> => {
    const token = tokenManager.getAccessToken()
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  },
}

// API Service
export const authService = {
  testConnection: async (): Promise<ApiResponse<{ status: string }>> => {
    try {
      console.log("[v0] Testing Render backend connection...")

      // First try a simple GET request to test connectivity
      const response = await fetch(`${API_BASE_URL}/api/auth/verify/`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      console.log("[v0] Connection test response status:", response.status)
      console.log("[v0] Connection test response headers:", Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()

      if (response.status === 401) {
        // 401 is expected without token, means server is reachable
        return {
          success: true,
          data: { status: "connected" },
          message: "Servidor conectado correctamente",
        }
      }

      if (response.ok) {
        return {
          success: true,
          data: { status: "connected" },
          message: "Servidor conectado correctamente",
        }
      }

      return {
        success: false,
        error: `Servidor respondió con status ${response.status}`,
      }
    } catch (error) {
      console.error("[v0] Connection test error:", error)

      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          error: "connection_failed",
        }
      }

      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Login
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    try {
      console.log("[v0] Attempting login with credentials:", { username: credentials.username })
      console.log("[v0] API URL:", `${API_BASE_URL}/api/auth/login/`)

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      }

      console.log("[v0] Request options:", requestOptions)

      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, requestOptions)

      console.log("[v0] Login response status:", response.status)
      console.log("[v0] Login response headers:", Object.fromEntries(response.headers.entries()))

      const responseText = await response.text()

      if (!response.ok) {
        console.log("[v0] Error response text:", responseText)

        try {
          const errorData = JSON.parse(responseText)
          return {
            success: false,
            error: errorData.message || errorData.error || `Error ${response.status}`,
          }
        } catch {
          return {
            success: false,
            error: `Error ${response.status}: ${responseText}`,
          }
        }
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        return {
          success: false,
          error: "Respuesta del servidor no es JSON válido",
        }
      }

      console.log("[v0] Login response data:", data)

      if (data.access_token) {
        // Store tokens and user data
        tokenManager.setTokens(data.access_token, data.refresh_token)

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(data.user))
          localStorage.setItem("isAuthenticated", "true")
        }

        return {
          success: true,
          data: data,
        }
      } else {
        return {
          success: false,
          error: data.message || "Error de autenticación - no se recibió token",
        }
      }
    } catch (error) {
      console.error("[v0] Login error:", error)
      console.log("[v0] Error type:", error.constructor.name)
      console.log("[v0] Error message:", error.message)

      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.log("[v0] Network/CORS error detected")
        return {
          success: false,
          error: "connection_failed",
        }
      }

      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Logout
  logout: async (): Promise<ApiResponse<void>> => {
    try {
      console.log("[v0] Attempting logout")

      const response = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: "POST",
        headers: tokenManager.getAuthHeaders(),
      })

      console.log("[v0] Logout response status:", response.status)

      // Clear tokens regardless of response
      tokenManager.clearTokens()

      if (response.ok) {
        return { success: true }
      } else {
        const errorText = await response.text()
        console.log("[v0] Logout error response:", errorText)
        return {
          success: false,
          error: "Error al cerrar sesión",
        }
      }
    } catch (error) {
      console.error("[v0] Logout error:", error)
      // Still clear tokens on error
      tokenManager.clearTokens()

      return {
        success: false,
        error: "Error de conexión al cerrar sesión",
      }
    }
  },

  // Refresh token
  refreshToken: async (): Promise<ApiResponse<{ access_token: string }>> => {
    try {
      const refreshToken = tokenManager.getRefreshToken()

      if (!refreshToken) {
        return {
          success: false,
          error: "No refresh token available",
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      const data = await response.json()

      if (response.ok && data.access_token) {
        // Update access token
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", data.access_token)
        }

        return {
          success: true,
          data: data,
        }
      } else {
        // Refresh token is invalid, clear all tokens
        tokenManager.clearTokens()
        return {
          success: false,
          error: data.message || "Token refresh failed",
        }
      }
    } catch (error) {
      console.error("Token refresh error:", error)
      tokenManager.clearTokens()
      return {
        success: false,
        error: "Error de conexión",
      }
    }
  },

  // Verify token
  verifyToken: async (): Promise<ApiResponse<{ valid: boolean }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          data: { valid: true },
        }
      } else {
        return {
          success: false,
          data: { valid: false },
          error: data.message || "Token inválido",
        }
      }
    } catch (error) {
      console.error("Token verification error:", error)
      return {
        success: false,
        data: { valid: false },
        error: "Error de conexión",
      }
    }
  },

  // Get user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
        method: "GET",
        headers: tokenManager.getAuthHeaders(),
      })

      const data = await response.json()

      if (response.ok) {
        // Update stored user data
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(data))
        }

        return {
          success: true,
          data: data,
        }
      } else {
        return {
          success: false,
          error: data.message || "Error al obtener perfil",
        }
      }
    } catch (error) {
      console.error("Get profile error:", error)
      return {
        success: false,
        error: "Error de conexión",
      }
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false

    const token = tokenManager.getAccessToken()
    const isAuth = localStorage.getItem("isAuthenticated")

    return !!(token && isAuth === "true")
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null

    try {
      const userStr = localStorage.getItem("user")
      return userStr ? JSON.parse(userStr) : null
    } catch {
      return null
    }
  },
}
