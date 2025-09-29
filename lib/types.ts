export interface Resident {
  id: string
  name: string
  type: "propietario" | "familiar"
  age: number
  email: string
  phone?: string
  apartment_number: string
  face_encoding?: string
  face_image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccessLog {
  id: string
  resident_id: string
  access_time: string
  access_type: string
  confidence_score?: number
  status: "granted" | "denied"
  notes?: string
  resident?: Resident
}

export interface FaceRecognitionResult {
  recognized: boolean
  resident?: Resident
  confidence: number
  message: string
}
