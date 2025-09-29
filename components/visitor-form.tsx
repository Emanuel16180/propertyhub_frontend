"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Camera, Scan, Car, User, X, Loader2 } from "lucide-react"
import { LocalStorageDB, type Visitor } from "@/lib/local-storage"
import Tesseract from "tesseract.js"
import { LocalVehicleAnalyzer } from "@/lib/vehicle-analyzer"
import { IdCardDetector, type IdCardResult } from "@/lib/id-card-detector"

interface VisitorFormProps {
  onClose: () => void
  onSuccess: (visitor: Visitor) => void
}

export function VisitorForm({ onClose, onSuccess }: VisitorFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    id_number: "",
    house_number: "",
    host_name: "",
    visit_purpose: "",
    has_vehicle: false,
    license_plate: "",
    vehicle_color: "",
    vehicle_model: "",
    vehicle_type: "",
    notes: "",
  })

  const [isScanning, setIsScanning] = useState(false)
  const [scanType, setScanType] = useState<"id" | "vehicle" | null>(null)
  const [idCardSide, setIdCardSide] = useState<"front" | "back" | null>(null)
  const [capturedIdData, setCapturedIdData] = useState<{
    front?: IdCardResult
    back?: IdCardResult
  }>({})
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrProgress, setOcrProgress] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const houses = LocalStorageDB.getHouses()
  const visitPurposes = LocalStorageDB.getVisitPurposes()
  const vehicleTypes = LocalStorageDB.getVehicleTypes()

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const startCamera = async (type: "id" | "vehicle", side?: "front" | "back") => {
    setScanType(type)
    setIsScanning(true)

    if (type === "id" && side) {
      setIdCardSide(side)
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("No se pudo acceder a la cámara. Por favor, ingrese los datos manualmente.")
      setIsScanning(false)
      setIdCardSide(null)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
    }
    setIsScanning(false)
    setScanType(null)
    setIdCardSide(null)
    setIsProcessingOCR(false)
    setOcrProgress("")
  }

  const preprocessImage = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, type: "id" | "vehicle") => {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])

      if (type === "vehicle") {
        const enhanced = gray > 128 ? Math.min(255, gray * 1.3) : Math.max(0, gray * 0.7)
        data[i] = data[i + 1] = data[i + 2] = enhanced
      } else {
        data[i] = data[i + 1] = data[i + 2] = gray
      }
    }

    context.putImageData(imageData, 0, 0)
    return canvas
  }

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    const processedCanvas = preprocessImage(canvas, context, scanType!)

    processedCanvas.toBlob(
      async (blob) => {
        if (!blob) return

        if (scanType === "vehicle") {
          await processVehicleWithLocalAnalysis(blob)
        } else if (scanType === "id" && idCardSide) {
          await processIdCard(blob, idCardSide)
        }
      },
      "image/jpeg",
      0.9,
    )
  }

  const processVehicleWithLocalAnalysis = async (imageBlob: Blob) => {
    setIsProcessingOCR(true)
    setOcrProgress("Cargando modelos de IA...")

    try {
      const analyzer = new LocalVehicleAnalyzer()

      setOcrProgress("Cargando TensorFlow.js y detector de placas...")
      const result = await analyzer.analyzeVehicle(imageBlob)

      console.log("[v0] Real Vehicle Analysis Result:", result)

      if (result.license_plate || result.vehicle_color || result.vehicle_type || result.vehicle_model) {
        setFormData((prev) => ({
          ...prev,
          license_plate: result.license_plate || prev.license_plate,
          vehicle_color: result.vehicle_color || prev.vehicle_color,
          vehicle_type: result.vehicle_type || prev.vehicle_type,
          vehicle_model: result.vehicle_model || prev.vehicle_model,
        }))

        const foundItems = []
        if (result.license_plate) foundItems.push("placa")
        if (result.vehicle_color) foundItems.push("color")
        if (result.vehicle_type) foundItems.push("tipo")
        if (result.vehicle_model) foundItems.push("modelo")

        alert(
          `¡Análisis completado con IA especializada! Se detectó: ${foundItems.join(", ")} (Confianza: ${result.confidence}/10)`,
        )
      } else {
        alert("No se pudieron extraer datos del vehículo. Intente con mejor iluminación o ángulo.")
      }

      await analyzer.cleanup()
    } catch (error) {
      console.error("Real Vehicle Analysis Error:", error)
      alert(
        `Error en el análisis con IA: ${(error as Error).message}. Intente de nuevo o ingrese los datos manualmente.`,
      )
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress("")
      stopCamera()
    }
  }

  const processIdCard = async (imageBlob: Blob, side: "front" | "back") => {
    setIsProcessingOCR(true)
    setOcrProgress(`Procesando ${side === "front" ? "anverso" : "reverso"} de la cédula...`)

    try {
      const result = await IdCardDetector.detectIdCard(imageBlob, side)

      console.log(`[v0] ID Card ${side} Result:`, result)

      const newCapturedData = {
        ...capturedIdData,
        [side]: result,
      }
      setCapturedIdData(newCapturedData)

      const combinedData = combineIdCardData(newCapturedData)

      if (combinedData.name || combinedData.id_number) {
        setFormData((prev) => ({
          ...prev,
          name: combinedData.name || prev.name,
          id_number: combinedData.id_number || prev.id_number,
        }))

        const capturedItems = []
        if (combinedData.name) capturedItems.push("nombre")
        if (combinedData.id_number) capturedItems.push("cédula")

        alert(
          `¡${side === "front" ? "Anverso" : "reverso"} procesado! Se detectó: ${capturedItems.join(", ")} (Confianza: ${result.confidence}%)`,
        )
      } else {
        alert(
          `No se pudieron extraer datos del ${side === "front" ? "anverso" : "reverso"}. Intente con mejor iluminación o ángulo.`,
        )
      }
    } catch (error) {
      console.error(`ID Card ${side} Processing Error:`, error)
      alert(`Error al procesar el ${side === "front" ? "anverso" : "reverso"}: ${(error as Error).message}`)
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress("")
      stopCamera()
    }
  }

  const combineIdCardData = (idData: { front?: IdCardResult; back?: IdCardResult }) => {
    const { front, back } = idData

    let bestName = ""
    let bestIdNumber = ""

    // Combine names - prefer the one with higher confidence and more complete data
    if (front?.name && back?.name) {
      // If both sides have names, choose the one with higher confidence
      if (front.confidence >= back.confidence) {
        bestName = front.name
      } else {
        bestName = back.name
      }

      // If one name is clearly more complete (more words), prefer that one
      const frontWords = front.name.split(" ").length
      const backWords = back.name.split(" ").length

      if (backWords > frontWords + 1) {
        bestName = back.name
      } else if (frontWords > backWords + 1) {
        bestName = front.name
      }
    } else if (front?.name) {
      bestName = front.name
    } else if (back?.name) {
      bestName = back.name
    }

    // Combine ID numbers - prefer the one with higher confidence
    if (front?.id_number && back?.id_number) {
      if (front.confidence >= back.confidence) {
        bestIdNumber = front.id_number
      } else {
        bestIdNumber = back.id_number
      }
    } else if (front?.id_number) {
      bestIdNumber = front.id_number
    } else if (back?.id_number) {
      bestIdNumber = back.id_number
    }

    console.log("[v0] Combined ID data:", { name: bestName, id_number: bestIdNumber })

    return {
      name: bestName,
      id_number: bestIdNumber,
    }
  }

  const processWithTesseract = async (imageBlob: Blob, type: "id" | "vehicle") => {
    setIsProcessingOCR(true)
    setOcrProgress("Procesando imagen...")

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(imageBlob, "spa+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(`Procesando... ${Math.round(m.progress * 100)}%`)
          }
        },
      })

      console.log("[v0] OCR Result:", text)

      if (type === "id") {
        const processedIdData = extractIdData(text)

        if (processedIdData.name || processedIdData.id_number) {
          setFormData((prev) => ({
            ...prev,
            name: processedIdData.name || prev.name,
            id_number: processedIdData.id_number || prev.id_number,
          }))
          alert("¡Datos de cédula escaneados exitosamente!")
        } else {
          alert("No se pudieron extraer datos de la cédula. Por favor, intente de nuevo o ingrese manualmente.")
        }
      }
    } catch (error) {
      console.error("OCR Error:", error)
      alert("Error al procesar la imagen. Por favor, intente de nuevo o ingrese los datos manualmente.")
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress("")
      stopCamera()
    }
  }

  const extractIdData = (text: string) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    let name = ""
    let id_number = ""

    for (const line of lines) {
      const idMatch = line.match(/\b(\d{7,8}[A-Z]?|\d{4,5}-\d{1,2}-\d{1,2}|\d{8,10})\b/)
      if (idMatch && !id_number) {
        id_number = idMatch[1]
      }

      if (line.match(/^[A-ZÁÉÍÓÚÑ\s]{10,}$/) && !name) {
        name = line
      }
    }

    return { name, id_number }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.id_number || !formData.visit_purpose) {
      alert("Por favor, complete todos los campos obligatorios.")
      return
    }

    const selectedHouse = houses.find((h) => h.number === formData.house_number)

    const visitorData: Omit<Visitor, "id" | "created_at"> = {
      name: formData.name,
      id_number: formData.id_number,
      house_number: formData.house_number || "N/A",
      host_name:
        formData.house_number === "areas_comunes"
          ? "Áreas Comunes"
          : formData.house_number
            ? selectedHouse?.owner || "No especificado"
            : "No especificado",
      visit_purpose: formData.visit_purpose as any,
      entry_time: new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "dentro",
      vehicle: formData.has_vehicle
        ? {
            has_vehicle: true,
            license_plate: formData.license_plate,
            color: formData.vehicle_color,
            model: formData.vehicle_model,
            type: formData.vehicle_type as any,
          }
        : { has_vehicle: false },
      notes: formData.notes || undefined,
    }

    const savedVisitor = LocalStorageDB.saveVisitor(visitorData)
    onSuccess(savedVisitor)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Registrar Visitante
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <video ref={videoRef} className="w-full h-64 bg-black rounded-lg" autoPlay playsInline />
                <canvas ref={canvasRef} className="hidden" />
                {isProcessingOCR && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="font-medium">{ocrProgress || "Procesando imagen..."}</p>
                      <p className="text-sm opacity-75">
                        {scanType === "vehicle"
                          ? "Usando TensorFlow.js + Detector de Placas Especializado"
                          : "Esto puede tomar unos segundos"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={captureAndProcess} className="flex-1" disabled={isProcessingOCR}>
                  {isProcessingOCR ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Capturar y Procesar
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={stopCamera} disabled={isProcessingOCR}>
                  Cancelar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {scanType === "vehicle"
                  ? "Usando TensorFlow.js COCO-SSD para detección + Detector de Placas Especializado"
                  : "Usando Tesseract.js para reconocimiento óptico de caracteres"}
              </p>
            </div>
          )}

          {!isScanning && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Datos Personales</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startCamera("id", "front")}
                      className="text-xs"
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Anverso
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startCamera("id", "back")}
                      className="text-xs"
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Reverso
                    </Button>
                  </div>
                </div>

                {(capturedIdData.front || capturedIdData.back) && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <Camera className="w-4 h-4" />
                      <span className="font-medium">Datos capturados:</span>
                      {capturedIdData.front && (
                        <span className="bg-green-200 px-2 py-1 rounded text-xs">Anverso ✓</span>
                      )}
                      {capturedIdData.back && <span className="bg-green-200 px-2 py-1 rounded text-xs">Reverso ✓</span>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Nombre del visitante"
                    />
                  </div>
                  <div>
                    <Label htmlFor="id_number">Cédula/CI *</Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) => handleInputChange("id_number", e.target.value)}
                      placeholder="Número de cédula"
                    />
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información de Visita</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="house_number">Casa a Visitar</Label>
                    <Select
                      value={formData.house_number}
                      onValueChange={(value) => handleInputChange("house_number", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar casa (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="areas_comunes">Áreas Comunes</SelectItem>
                        {houses.map((house) => (
                          <SelectItem key={house.number} value={house.number}>
                            Casa {house.number} - {house.owner}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="visit_purpose">Motivo de Visita *</Label>
                    <Select
                      value={formData.visit_purpose}
                      onValueChange={(value) => handleInputChange("visit_purpose", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {visitPurposes.map((purpose) => (
                          <SelectItem key={purpose.value} value={purpose.value}>
                            {purpose.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has_vehicle"
                      checked={formData.has_vehicle}
                      onCheckedChange={(checked) => handleInputChange("has_vehicle", checked as boolean)}
                    />
                    <Label htmlFor="has_vehicle" className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Llega en vehículo
                    </Label>
                  </div>

                  {formData.has_vehicle && (
                    <Button type="button" variant="outline" size="sm" onClick={() => startCamera("vehicle")}>
                      <Camera className="w-4 h-4 mr-2" />
                      Escanear Vehículo
                    </Button>
                  )}
                </div>

                {formData.has_vehicle && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="license_plate">Placa</Label>
                      <Input
                        id="license_plate"
                        value={formData.license_plate}
                        onChange={(e) => handleInputChange("license_plate", e.target.value)}
                        placeholder="ABC-1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_color">Color</Label>
                      <Input
                        id="vehicle_color"
                        value={formData.vehicle_color}
                        onChange={(e) => handleInputChange("vehicle_color", e.target.value)}
                        placeholder="Color del vehículo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_model">Modelo</Label>
                      <Input
                        id="vehicle_model"
                        value={formData.vehicle_model}
                        onChange={(e) => handleInputChange("vehicle_model", e.target.value)}
                        placeholder="Modelo del vehículo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_type">Tipo de Vehículo</Label>
                      <Select
                        value={formData.vehicle_type}
                        onValueChange={(value) => handleInputChange("vehicle_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de vehículo" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Observaciones adicionales (opcional)"
                  rows={3}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Registrar Visitante
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
