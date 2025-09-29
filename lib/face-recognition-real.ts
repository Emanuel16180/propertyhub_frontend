import * as faceapi from "face-api.js"

export class FaceRecognitionService {
  private isInitialized = false
  private labeledDescriptors: faceapi.LabeledFaceDescriptors[] = []

  async initialize() {
    if (this.isInitialized) return

    console.log("[v0] Inicializando face-api.js...")

    try {
      const MODEL_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      ])

      this.isInitialized = true
      console.log("[v0] face-api.js inicializado correctamente")
    } catch (error) {
      console.error("[v0] Error inicializando face-api.js:", error)
      throw new Error("No se pudieron cargar los modelos de reconocimiento facial")
    }
  }

  async registerFace(imageElement: HTMLImageElement, personName: string): Promise<string> {
    await this.initialize()

    console.log("[v0] Registrando cara para:", personName)

    try {
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        throw new Error(
          "No se pudo detectar una cara clara en la imagen. Por favor, asegúrese de que su rostro esté bien iluminado y centrado.",
        )
      }

      console.log("[v0] Cara detectada con confianza:", detection.detection.score)

      // Crear descriptor etiquetado
      const labeledDescriptor = new faceapi.LabeledFaceDescriptors(personName, [detection.descriptor])

      // Agregar a la lista de descriptores conocidos
      this.labeledDescriptors.push(labeledDescriptor)

      // Guardar en localStorage para persistencia
      this.saveDescriptors()

      console.log("[v0] Cara registrada exitosamente para:", personName)
      return "success"
    } catch (error) {
      console.error("[v0] Error registrando cara:", error)
      throw error
    }
  }

  async recognizeFace(imageElement: HTMLImageElement): Promise<{ name: string; confidence: number } | null> {
    await this.initialize()
    this.loadDescriptors()

    console.log("[v0] Iniciando reconocimiento facial...")

    if (this.labeledDescriptors.length === 0) {
      console.log("[v0] No hay caras registradas")
      return null
    }

    try {
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        console.log("[v0] No se detectó cara en la imagen")
        return null
      }

      console.log("[v0] Cara detectada con confianza:", detection.detection.score, "comparando con base de datos...")

      const faceMatcher = new faceapi.FaceMatcher(this.labeledDescriptors, 0.5) // Umbral de 0.5 para mayor precisión

      const bestMatch = faceMatcher.findBestMatch(detection.descriptor)

      console.log("[v0] Mejor coincidencia:", bestMatch.label, "Distancia:", bestMatch.distance)

      if (bestMatch.label === "unknown") {
        console.log("[v0] Persona no reconocida")
        return null
      }

      // Convertir distancia a confianza (menor distancia = mayor confianza)
      const confidence = Math.max(0, 1 - bestMatch.distance)

      console.log("[v0] Persona reconocida:", bestMatch.label, "Confianza:", confidence)

      return {
        name: bestMatch.label,
        confidence: confidence,
      }
    } catch (error) {
      console.error("[v0] Error en reconocimiento facial:", error)
      return null
    }
  }

  private saveDescriptors() {
    try {
      const descriptorsData = this.labeledDescriptors.map((desc) => ({
        label: desc.label,
        descriptors: Array.from(desc.descriptors).map((d) => Array.from(d)),
      }))
      localStorage.setItem("faceDescriptors", JSON.stringify(descriptorsData))
      console.log("[v0] Descriptores guardados en localStorage:", this.labeledDescriptors.length, "personas")
    } catch (error) {
      console.error("[v0] Error guardando descriptores:", error)
    }
  }

  private loadDescriptors() {
    try {
      const saved = localStorage.getItem("faceDescriptors")
      if (saved) {
        const descriptorsData = JSON.parse(saved)
        this.labeledDescriptors = descriptorsData.map(
          (data: any) =>
            new faceapi.LabeledFaceDescriptors(
              data.label,
              data.descriptors.map((d: number[]) => new Float32Array(d)),
            ),
        )
        console.log("[v0] Descriptores cargados desde localStorage:", this.labeledDescriptors.length, "personas")
      }
    } catch (error) {
      console.error("[v0] Error cargando descriptores:", error)
      this.labeledDescriptors = []
    }
  }

  clearAllFaces() {
    this.labeledDescriptors = []
    localStorage.removeItem("faceDescriptors")
    console.log("[v0] Todas las caras eliminadas")
  }

  getStats() {
    return {
      registeredFaces: this.labeledDescriptors.length,
      isInitialized: this.isInitialized,
    }
  }
}

export const faceRecognitionService = new FaceRecognitionService()
