"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Camera, Scan, Car, User, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  visitorService,
  type VisitorFormData,
  type VisitorCheckInRequest,
  type Property,
} from "@/services/visitorService"
import { LocalVehicleAnalyzer } from "@/lib/vehicle-analyzer"
import { IdCardDetector, type IdCardResult } from "@/lib/id-card-detector"

interface VisitorFormProps {
  onClose: () => void
  onSuccess: () => void
}

const VISIT_REASONS = [
  { value: "visita_social", label: "Visita Social" },
  { value: "entrega", label: "Entrega/Delivery" },
  { value: "servicio_tecnico", label: "Servicio Técnico" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "proveedor", label: "Proveedor" },
  { value: "familiar", label: "Familiar" },
  { value: "otro", label: "Otro" },
]

const VEHICLE_TYPES = [
  { value: "light", display: "Vehículo Liviano" },
  { value: "heavy", display: "Vehículo Pesado" },
  { value: "motorcycle", display: "Motocicleta" },
]

export function VisitorForm({ onClose, onSuccess }: VisitorFormProps) {
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    id_number: "",
    property_id: "",
    common_area_id: "",
    visit_purpose: "",
    has_vehicle: false,
    license_plate: "",
    vehicle_color: "",
    vehicle_model: "",
    vehicle_type: "",
    notes: "",
  })

  const [apiFormData, setApiFormData] = useState<VisitorFormData | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoadingFormData, setIsLoadingFormData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  useEffect(() => {
    loadFormData()
  }, [])

  const loadFormData = async () => {
    setIsLoadingFormData(true)

    const [formDataResponse, propertiesResponse] = await Promise.all([
      visitorService.getFormData(),
      visitorService.getProperties(),
    ])

    if (formDataResponse.success && formDataResponse.data) {
      console.log("[v0] API Form Data received:", formDataResponse.data)
      console.log("[v0] Visit reasons from API:", formDataResponse.data.reasons)
      console.log("[v0] Vehicle types from API:", formDataResponse.data.vehicle_types)
      setApiFormData(formDataResponse.data)
    } else {
      console.error("[v0] Failed to load form data:", formDataResponse.error)
      toast({
        variant: "destructive",
        title: "Error",
        description: formDataResponse.error || "Error al cargar datos del formulario",
      })
    }

    if (propertiesResponse.success && propertiesResponse.data) {
      setProperties(propertiesResponse.data)
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: propertiesResponse.error || "Error al cargar propiedades",
      })
    }

    setIsLoadingFormData(false)
  }

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
      toast({
        variant: "destructive",
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Por favor, ingrese los datos manualmente.",
      })
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
    setOcrProgress("Analizando vehículo...")

    try {
      const analyzer = new LocalVehicleAnalyzer()

      setOcrProgress("Detectando placa y color del vehículo...")
      const result = await analyzer.analyzeVehicle(imageBlob)

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

        toast({
          title: "¡Análisis completado!",
          description: `Se detectó: ${foundItems.join(", ")} (Confianza: ${result.confidence}%)`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "No se detectaron datos",
          description: "No se pudieron extraer datos del vehículo. Intente con mejor iluminación o ángulo.",
        })
      }

      await analyzer.cleanup()
    } catch (error) {
      console.error("Vehicle Analysis Error:", error)
      toast({
        variant: "destructive",
        title: "Error en el análisis",
        description: `${(error as Error).message}. Intente de nuevo o ingrese los datos manualmente.`,
      })
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress("")
      stopCamera()
    }
  }

  const processIdCard = async (imageBlob: Blob, side: "front" | "back") => {
    setIsProcessingOCR(true)
    setOcrProgress(`Procesando ${side === "front" ? "anverso" : "reverso"} de la cédula con OCR profesional...`)

    try {
      const result = await IdCardDetector.detectIdCard(imageBlob, side)

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

        toast({
          title: `¡${side === "front" ? "Anverso" : "Reverso"} procesado!`,
          description: `Se detectó: ${capturedItems.join(", ")} (Confianza: ${result.confidence}%)`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "No se detectaron datos",
          description: `No se pudieron extraer datos del ${side === "front" ? "anverso" : "reverso"}. Intente con mejor iluminación o ángulo.`,
        })
      }
    } catch (error) {
      console.error(`ID Card ${side} Processing Error:`, error)
      toast({
        variant: "destructive",
        title: "Error al procesar",
        description: `Error al procesar el ${side === "front" ? "anverso" : "reverso"}: ${(error as Error).message}`,
      })
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

    if (front?.name && back?.name) {
      if (front.confidence >= back.confidence) {
        bestName = front.name
      } else {
        bestName = back.name
      }

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

    return {
      name: bestName,
      id_number: bestIdNumber,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.visit_purpose) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor, complete todos los campos obligatorios.",
      })
      return
    }

    if (!formData.property_id && !formData.common_area_id) {
      toast({
        variant: "destructive",
        title: "Destino requerido",
        description: "Por favor, seleccione una casa o área común a visitar.",
      })
      return
    }

    setIsSubmitting(true)

    const visitorData: VisitorCheckInRequest = {
      full_name: formData.name,
      document_id: formData.id_number || undefined,
      reason: formData.visit_purpose,
      property_to_visit: formData.property_id ? Number.parseInt(formData.property_id) : undefined,
      common_area_to_visit: formData.common_area_id ? Number.parseInt(formData.common_area_id) : undefined,
      observations: formData.notes || undefined,
      vehicle: formData.has_vehicle
        ? {
            license_plate: formData.license_plate,
            color: formData.vehicle_color,
            model: formData.vehicle_model,
            vehicle_type: formData.vehicle_type,
          }
        : undefined,
    }

    const response = await visitorService.checkIn(visitorData)

    if (response.success) {
      toast({
        title: "¡Éxito!",
        description: "Visitante registrado exitosamente",
      })
      onSuccess()
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: response.error || "Error al registrar visitante",
      })
    }

    setIsSubmitting(false)
  }

  const vehicleTypes =
    apiFormData?.vehicle_types && apiFormData.vehicle_types.length > 0 ? apiFormData.vehicle_types : VEHICLE_TYPES

  const visitReasons = apiFormData?.reasons && apiFormData.reasons.length > 0 ? apiFormData.reasons : VISIT_REASONS

  if (isLoadingFormData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
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
                          ? "Usando detector de placas especializado y análisis de color"
                          : "Usando OCR.space API profesional para reconocimiento de cédulas"}
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
                  ? "Usando detector de placas especializado y análisis de color"
                  : "Usando OCR.space API profesional para reconocimiento de cédulas"}
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
                    <Label htmlFor="id_number">Cédula/CI</Label>
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
                    <Label htmlFor="property_id">Casa a Visitar</Label>
                    <Select
                      value={formData.property_id}
                      onValueChange={(value) => {
                        handleInputChange("property_id", value)
                        handleInputChange("common_area_id", "")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar casa" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            Casa {property.house_number} - {property.owner_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="common_area_id">Área Común</Label>
                    <Select
                      value={formData.common_area_id}
                      onValueChange={(value) => {
                        handleInputChange("common_area_id", value)
                        handleInputChange("property_id", "")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar área común" />
                      </SelectTrigger>
                      <SelectContent>
                        {apiFormData?.common_areas.map((area) => (
                          <SelectItem key={area.id} value={area.id.toString()}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      {visitReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {(reason as any).display || (reason as any).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                              {type.display}
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
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Registrar Visitante"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
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
