export interface FaceRecognitionResult {
  verified?: boolean
  found?: boolean
  resident_id?: string
  confidence: number
  distance?: number
  threshold?: number
  error?: string
  recognized?: boolean
}

export class FaceRecognitionAPI {
  private static readonly DEEPFACE_SERVER_URL = "http://localhost:5000"

  private static async callDeepFaceServer(endpoint: string, data: any): Promise<any> {
    try {
      console.log(`[v0] Llamando a DeepFace server: ${endpoint}`, data.resident_id || "reconocimiento")

      const response = await fetch(`${this.DEEPFACE_SERVER_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`[v0] Respuesta de DeepFace:`, result)
      return result
    } catch (error) {
      console.error(`[v0] Error conectando con DeepFace server:`, error)
      throw error
    }
  }

  static async registerFace(residentId: string, base64Image: string): Promise<FaceRecognitionResult> {
    try {
      const result = await this.callDeepFaceServer("/register_face", {
        resident_id: residentId,
        face_image: base64Image,
      })

      if (result.success) {
        return {
          confidence: 1.0,
          verified: true,
          resident_id: residentId,
        }
      } else {
        return {
          confidence: 0,
          error: result.error || "Error registering face",
        }
      }
    } catch (error) {
      return {
        confidence: 0,
        error: `Error registering face: ${error}`,
      }
    }
  }

  static async verifyFace(residentId: string, base64Image: string): Promise<FaceRecognitionResult> {
    try {
      const result = await this.callDeepFaceServer("/recognize_face", {
        face_image: base64Image,
      })

      if (result.success && result.recognized) {
        const isCorrectResident = result.resident_id === residentId
        return {
          verified: isCorrectResident,
          confidence: result.confidence,
          distance: result.distance,
          resident_id: result.resident_id,
        }
      } else {
        return {
          verified: false,
          confidence: result.confidence || 0,
          error: result.error,
        }
      }
    } catch (error) {
      return {
        verified: false,
        confidence: 0,
        error: `Error verifying face: ${error}`,
      }
    }
  }

  static async findFace(base64Image: string): Promise<FaceRecognitionResult> {
    try {
      const result = await this.callDeepFaceServer("/recognize_face", {
        face_image: base64Image,
      })

      if (result.success) {
        return {
          found: result.recognized,
          resident_id: result.resident_id,
          confidence: result.confidence,
          distance: result.distance,
          error: result.error,
        }
      } else {
        return {
          found: false,
          confidence: 0,
          error: result.error || "Error finding face",
        }
      }
    } catch (error) {
      return {
        found: false,
        confidence: 0,
        error: `Error finding face: ${error}`,
      }
    }
  }

  static async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.DEEPFACE_SERVER_URL}/health`)
      return response.ok
    } catch (error) {
      console.error("[v0] DeepFace server no está disponible:", error)
      return false
    }
  }
}
