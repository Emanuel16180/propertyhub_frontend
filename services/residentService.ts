import { tokenManager } from "./authService"
import { propertyService } from "./propertyService" // Import propertyService for house assignment

// API Configuration
const API_BASE_URL = "https://propertyhub-backend.onrender.com"

// Resident types based on API
export interface ApiResident {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: "resident"
  is_active: boolean
  date_joined: string
  profile: {
    user_type: "resident"
    phone: string
    is_active: boolean
    resident_info: {
      resident_type: "owner" | "tenant" | "family"
      birth_date: string
      document_number: string
      house_identifier: string
      emergency_contact: string
      face_photo?: string
    }
  }
}

export interface CreateResidentData {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  user_type: "resident"
  phone: string
  resident_type: "owner" | "tenant" | "family"
  birth_date: string
  document_number: string
  house_identifier: string
  emergency_contact: string
  face_photo?: File
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// Resident API Service
export const residentService = {
  // Get all residents
  getResidents: async (): Promise<ApiResponse<ApiResident[]>> => {
    try {
      console.log("[v0] Loading residents...")

      const response = await fetch(`${API_BASE_URL}/api/users/residents/detail/`, {
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
      console.log("[v0] Raw API response:", data)

      let residents: ApiResident[] = []

      if (data.residents && Array.isArray(data.residents)) {
        residents = data.residents.map((resident: any) => ({
          id: resident.id,
          username: resident.username,
          email: resident.email,
          first_name: resident.first_name,
          last_name: resident.last_name,
          user_type: "resident",
          is_active: resident.is_active,
          date_joined: resident.date_joined,
          profile: {
            user_type: "resident",
            phone: resident.profile?.phone || "",
            is_active: resident.is_active,
            resident_info: {
              resident_type: resident.resident_details?.resident_type || "owner",
              birth_date: resident.resident_details?.birth_date || "",
              document_number: resident.resident_details?.document_number || "",
              house_identifier: resident.resident_details?.house_identifier || "",
              emergency_contact: resident.resident_details?.emergency_contact || "",
              face_photo: resident.resident_details?.face_photo
                ? resident.resident_details.face_photo.startsWith("http")
                  ? resident.resident_details.face_photo
                  : `${API_BASE_URL}${resident.resident_details.face_photo}`
                : undefined,
            },
          },
        }))
      } else if (Array.isArray(data)) {
        residents = data.map((resident: any) => ({
          id: resident.id,
          username: resident.username || `${resident.first_name}.${resident.last_name}`.toLowerCase(),
          email: resident.email,
          first_name: resident.first_name || "",
          last_name: resident.last_name || "",
          user_type: resident.user_type || "resident",
          is_active: resident.is_active !== false,
          date_joined: resident.date_joined || new Date().toISOString(),
          profile: {
            user_type: "resident",
            phone: resident.profile?.phone || "",
            is_active: resident.is_active !== false,
            resident_info: {
              resident_type: resident.profile?.resident_info?.resident_type || "owner",
              birth_date: resident.profile?.resident_info?.birth_date || "",
              document_number: resident.profile?.resident_info?.document_number || "",
              house_identifier: resident.profile?.resident_info?.house_identifier || "",
              emergency_contact: resident.profile?.resident_info?.emergency_contact || "",
              face_photo: resident.profile?.resident_info?.face_photo || undefined,
            },
          },
        }))
      } else if (data.data && Array.isArray(data.data)) {
        residents = data.data
      } else {
        residents = []
      }

      console.log("[v0] Processed residents:", residents)

      return {
        success: true,
        data: residents,
      }
    } catch (error) {
      console.log("[v0] Failed to load residents:", error.message)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Create new resident with two-step process
  createResident: async (residentData: CreateResidentData): Promise<ApiResponse<ApiResident>> => {
    try {
      const cleanData = {
        first_name: residentData.first_name,
        last_name: residentData.last_name,
        username: residentData.username,
        email: residentData.email,
        password: residentData.password,
        user_type: "resident" as const,
        resident_type: residentData.resident_type,
        birth_date: residentData.birth_date,
        phone: residentData.phone,
        document_number: residentData.document_number,
        house_identifier: residentData.house_identifier,
        emergency_contact: residentData.emergency_contact,
      }

      // Step 1: Create the resident
      const response = await fetch(`${API_BASE_URL}/api/users/`, {
        method: "POST",
        headers: {
          ...tokenManager.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      const newResidentId = data.user?.id

      if (!newResidentId) {
        return {
          success: false,
          error: "No se pudo obtener el ID del residente creado",
        }
      }

      // Step 2: Upload photo if provided
      if (residentData.face_photo) {
        const photoResult = await residentService.uploadResidentPhoto(newResidentId, residentData.face_photo)
        if (!photoResult.success) {
          console.warn("Photo upload failed, but resident was created:", photoResult.error)
        }
      }

      // Step 3: Extract property ID from house_identifier and assign resident to house
      if (residentData.house_identifier) {
        try {
          // Parse house identifier to get property ID
          const propertyId = await residentService.getPropertyIdFromIdentifier(residentData.house_identifier)

          if (propertyId) {
            const relationship =
              residentData.resident_type === "owner"
                ? "owner"
                : residentData.resident_type === "tenant"
                  ? "tenant"
                  : "family"
            const isPrimary = residentData.resident_type === "owner"

            const houseAssignResult = await residentService.assignResidentToHouse(
              newResidentId,
              propertyId,
              relationship,
              isPrimary,
            )
            if (!houseAssignResult.success) {
              console.warn("House assignment failed:", houseAssignResult.error)
            }

            // If resident is owner, also assign as property owner
            if (residentData.resident_type === "owner") {
              const ownerAssignResult = await propertyService.assignOwner(propertyId, newResidentId)
              if (!ownerAssignResult.success) {
                console.warn("Owner assignment failed:", ownerAssignResult.error)
              }
            }
          }
        } catch (error) {
          console.warn("Property assignment failed:", error.message)
        }
      }

      return {
        success: true,
        data: data.user,
        message: data.message,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  uploadResidentPhoto: async (userId: number, photoFile: File): Promise<ApiResponse<any>> => {
    try {
      console.log("[v0] Starting photo upload for user:", userId)
      console.log("[v0] Photo file:", photoFile.name, photoFile.type, photoFile.size)

      const formData = new FormData()
      formData.append("face_photo", photoFile)

      const authHeaders = tokenManager.getAuthHeaders()
      const cleanHeaders: Record<string, string> = {}

      // Only include Authorization header, exclude Content-Type
      if (authHeaders.Authorization) {
        cleanHeaders.Authorization = authHeaders.Authorization
      }

      console.log("[v0] Uploading to:", `${API_BASE_URL}/api/users/${userId}/resident/photo/`)
      console.log("[v0] Headers:", cleanHeaders)

      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/resident/photo/`, {
        method: "POST",
        headers: cleanHeaders, // Use clean headers without Content-Type
        body: formData,
      })

      console.log("[v0] Photo upload response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Photo upload error:", errorText)
        return {
          success: false,
          error: `Error uploading photo ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      console.log("[v0] Photo upload success:", data)

      return {
        success: true,
        data: data,
      }
    } catch (error) {
      console.log("[v0] Photo upload exception:", error)
      return {
        success: false,
        error: `Error de conexión al subir foto: ${error.message}`,
      }
    }
  },

  // Get resident by ID
  getResident: async (id: number): Promise<ApiResponse<ApiResident>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/residents/detail/`, {
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

      // Find the specific resident by ID
      let resident = null
      if (data.residents && Array.isArray(data.residents)) {
        resident = data.residents.find((r: any) => r.id === id)
      }

      if (!resident) {
        return {
          success: false,
          error: `Resident with ID ${id} not found`,
        }
      }

      const transformedResident = {
        id: resident.id,
        username: resident.username,
        email: resident.email,
        first_name: resident.first_name,
        last_name: resident.last_name,
        user_type: "resident" as const,
        is_active: resident.is_active,
        date_joined: resident.date_joined,
        profile: {
          user_type: "resident" as const,
          phone: resident.profile?.phone || "",
          is_active: resident.is_active,
          resident_info: {
            resident_type: resident.resident_details?.resident_type || "owner",
            birth_date: resident.resident_details?.birth_date || "",
            document_number: resident.resident_details?.document_number || "",
            house_identifier: resident.resident_details?.house_identifier || "",
            emergency_contact: resident.resident_details?.emergency_contact || "",
            face_photo: resident.resident_details?.face_photo
              ? resident.resident_details.face_photo.startsWith("http")
                ? resident.resident_details.face_photo
                : `${API_BASE_URL}${resident.resident_details.face_photo}`
              : undefined,
          },
        },
      }

      return {
        success: true,
        data: transformedResident,
      }
    } catch (error) {
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Update resident
  updateResident: async (id: number, residentData: Partial<CreateResidentData>): Promise<ApiResponse<ApiResident>> => {
    try {
      const { face_photo, ...updateData } = residentData

      if (Object.keys(updateData).length > 0) {
        const response = await fetch(`${API_BASE_URL}/api/users/${id}/`, {
          method: "PATCH",
          headers: {
            ...tokenManager.getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          const errorText = await response.text()
          return {
            success: false,
            error: `Error ${response.status}: ${errorText}`,
          }
        }
      }

      if (face_photo instanceof File) {
        const photoResult = await residentService.uploadResidentPhoto(id, face_photo)
        if (!photoResult.success) {
          console.warn("Photo update failed:", photoResult.error)
        }
      }

      const updatedResident = await residentService.getResident(id)
      return updatedResident
    } catch (error) {
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Delete/deactivate resident
  deactivateResident: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}/`, {
        method: "PATCH",
        headers: {
          ...tokenManager.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: false,
        }),
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
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Activate resident
  activateResident: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}/`, {
        method: "PATCH",
        headers: {
          ...tokenManager.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: true,
        }),
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
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Assign resident to house with relationship and primary resident flag
  assignResidentToHouse: async (
    residentId: number,
    propertyId: number,
    relationship = "family",
    isPrimary = false,
  ): Promise<ApiResponse<any>> => {
    try {
      console.log("[v0] Assigning resident to house:", residentId, propertyId)

      const response = await fetch(`${API_BASE_URL}/api/users/${residentId}/assign-house/`, {
        method: "POST",
        headers: {
          ...tokenManager.getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          property_id: propertyId, // Changed from house_id to property_id
          relationship: relationship,
          is_primary_resident: isPrimary,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] House assignment error:", errorText)
        return {
          success: false,
          error: `Error ${response.status}: ${errorText}`,
        }
      }

      const data = await response.json()
      console.log("[v0] House assignment success:", data)
      return {
        success: true,
        data: data,
      }
    } catch (error) {
      console.log("[v0] House assignment exception:", error)
      return {
        success: false,
        error: `Error de conexión: ${error.message}`,
      }
    }
  },

  // Helper function to get property ID from house identifier
  getPropertyIdFromIdentifier: async (houseIdentifier: string): Promise<number | null> => {
    try {
      // Get all properties to find matching identifier
      const propertiesResult = await propertyService.getProperties()
      if (!propertiesResult.success || !propertiesResult.data) {
        return null
      }

      // Find property that matches the house identifier
      const property = propertiesResult.data.find((p) => {
        const fullIdentifier = `Casa ${p.house_number} - Bloque ${p.block}`
        return fullIdentifier === houseIdentifier
      })

      return property?.id || null
    } catch (error) {
      console.error("Error getting property ID:", error)
      return null
    }
  },
}
