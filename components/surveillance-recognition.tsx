"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, Loader2, Eye, CheckCircle } from "lucide-react"
import { backendFaceRecognitionService } from "@/lib/face-recognition-backend"
import { intrusionService, type IntrusionAlertResponse } from "@/services/intrusionService"
import { communicationsAPI } from "@/lib/api/communications"

interface SurveillanceResult {
  intruderDetected: boolean
  resident?: any
  confidence: number
  message: string
}

export function SurveillanceRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const motionCanvasRef = useRef<HTMLCanvasElement>(null)
  const motionDetectionRef = useRef<NodeJS.Timeout | null>(null)
  const previousFrameRef = useRef<ImageData | null>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [surveillanceResult, setSurveillanceResult] = useState<SurveillanceResult | null>(null)
  const [intrusionAlerts, setIntrusionAlerts] = useState<IntrusionAlertResponse[]>([])
  const [systemStatus, setSystemStatus] = useState<"waiting" | "motion_detected" | "searching" | "processing">(
    "waiting",
  )

  const detectMotion = useCallback(() => {
    if (!videoRef.current || !motionCanvasRef.current) return false

    const canvas = motionCanvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (!context) return false

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    const currentFrame = context.getImageData(0, 0, canvas.width, canvas.height)

    if (!previousFrameRef.current) {
      previousFrameRef.current = currentFrame
      return false
    }

    const previousFrame = previousFrameRef.current
    let diffPixels = 0
    const threshold = 30
    const motionThreshold = canvas.width * canvas.height * 0.02

    for (let i = 0; i < currentFrame.data.length; i += 4) {
      const rDiff = Math.abs(currentFrame.data[i] - previousFrame.data[i])
      const gDiff = Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1])
      const bDiff = Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2])

      const totalDiff = (rDiff + gDiff + bDiff) / 3

      if (totalDiff > threshold) {
        diffPixels++
      }
    }

    previousFrameRef.current = currentFrame
    return diffPixels > motionThreshold
  }, [])

  const startMotionDetection = useCallback(() => {
    if (motionDetectionRef.current) {
      clearInterval(motionDetectionRef.current)
    }

    motionDetectionRef.current = setInterval(async () => {
      if (!isStreaming || isProcessing) return

      const hasMotion = detectMotion()

      if (hasMotion && systemStatus === "waiting") {
        console.log("[v0] Movimiento detectado, iniciando vigilancia")
        setSystemStatus("motion_detected")

        setTimeout(async () => {
          setSystemStatus("searching")
          await processRecognition()
          setTimeout(() => {
            setSystemStatus("waiting")
            startMotionDetection()
          }, 6000)
        }, 1000)
      }
    }, 500)

    if (systemStatus === "waiting") {
      console.log("[v0] Sistema de vigilancia iniciado")
    }
  }, [isStreaming, isProcessing, systemStatus, detectMotion])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        setSurveillanceResult(null)
        setSystemStatus("waiting")
        console.log("[v0] Cámara de vigilancia iniciada automáticamente")
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("No se pudo acceder a la cámara. Por favor, verifica los permisos.")
    }
  }, [])

  const processRecognition = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = canvas.toDataURL("image/jpeg", 0.8)

        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        console.log("[v0] Procesando detección de intrusos...")

        const faceResult = await backendFaceRecognitionService.recognizeFace(img)

        let result: SurveillanceResult

        if (faceResult.recognized && faceResult.confidence >= 0.45) {
          const resident = faceResult.resident

          if (resident) {
            console.log(`[v0] Residente autorizado detectado: ${resident.first_name} ${resident.last_name}`)
            result = {
              intruderDetected: false,
              resident: {
                id: resident.id.toString(),
                name: `${resident.first_name} ${resident.last_name}`,
                apartment_number: resident.profile.resident_info.house_identifier,
                type: resident.profile.resident_info.resident_type,
              },
              confidence: faceResult.confidence,
              message: `Residente autorizado: ${resident.first_name} ${resident.last_name}`,
            }
          } else {
            console.log("[v0] Intruso detectado - rostro reconocido pero no autorizado")
            result = {
              intruderDetected: true,
              confidence: faceResult.confidence,
              message: "Intruso detectado - Persona no autorizada",
            }

            const intrusionResponse = await intrusionService.registerIntrusion({
              message: "Intruso detectado - Persona no autorizada",
              confidence: faceResult.confidence,
              camera_identifier: "CAM-Principal-01",
            })

            if (intrusionResponse.success) {
              console.log("[v0] Creating security communication for intrusion alert")
              try {
                await communicationsAPI.createCommunication({
                  title: "Alerta de Seguridad: Persona no autorizada detectada",
                  message: `Estimados residentes,

Se ha detectado el ingreso de una persona no reconocida/no autorizada en el condominio.

Por favor, mantengan la calma, eviten salir innecesariamente y asegúrense de mantener puertas y ventanas cerradas.

La administración y el personal de seguridad ya están atendiendo la situación.

Ante cualquier emergencia, comuníquese de inmediato con la portería.

Detalles de la detección:
- Cámara: CAM-Principal-01
- Fecha y hora: ${new Date().toLocaleString("es-ES")}
- Nivel de confianza: ${(faceResult.confidence * 100).toFixed(1)}%`,
                  communication_type: "urgent",
                  priority: "alta",
                  target_audience: "all_residents",
                  expires_at: null,
                })
                console.log("[v0] Security communication created successfully")
              } catch (commError) {
                console.error("[v0] Error creating security communication:", commError)
              }
            }
          }
        } else {
          console.log("[v0] Intruso detectado - rostro no reconocido")
          result = {
            intruderDetected: true,
            confidence: faceResult.confidence,
            message: faceResult.message || "Intruso detectado - Rostro no reconocido",
          }

          const intrusionResponse = await intrusionService.registerIntrusion({
            message: faceResult.message || "Intruso detectado - Rostro no reconocido",
            confidence: faceResult.confidence,
            camera_identifier: "CAM-Principal-01",
          })

          if (intrusionResponse.success) {
            console.log("[v0] Creating security communication for intrusion alert")
            try {
              await communicationsAPI.createCommunication({
                title: "Alerta de Seguridad: Persona no autorizada detectada",
                message: `Estimados residentes,

Se ha detectado el ingreso de una persona no reconocida/no autorizada en el condominio.

Por favor, mantengan la calma, eviten salir innecesariamente y asegúrense de mantener puertas y ventanas cerradas.

La administración y el personal de seguridad ya están atendiendo la situación.

Ante cualquier emergencia, comuníquese de inmediato con la portería.

Detalles de la detección:
- Cámara: CAM-Principal-01
- Fecha y hora: ${new Date().toLocaleString("es-ES")}
- Nivel de confianza: ${(faceResult.confidence * 100).toFixed(1)}%`,
                communication_type: "urgent",
                priority: "alta",
                target_audience: "all_residents",
                expires_at: null,
              })
              console.log("[v0] Security communication created successfully")
            } catch (commError) {
              console.error("[v0] Error creating security communication:", commError)
            }
          }
        }

        setSurveillanceResult(result)

        loadIntrusionAlerts()

        setTimeout(
          () => {
            setSurveillanceResult(null)
          },
          result.intruderDetected ? 5000 : 3000,
        )
      }
    } catch (error) {
      console.error("[v0] Error processing surveillance:", error)
      setSurveillanceResult({
        intruderDetected: true,
        confidence: 0,
        message: "Error en el sistema de vigilancia",
      })

      setTimeout(() => {
        setSurveillanceResult(null)
      }, 4000)
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing])

  const loadIntrusionAlerts = useCallback(async () => {
    const response = await intrusionService.getIntrusions(false)
    if (response.success && response.data) {
      setIntrusionAlerts(response.data.slice(0, 10))
    } else {
      console.error("Error loading intrusion alerts:", response.error)
    }
  }, [])

  const handleResolveAlert = useCallback(
    async (alertId: number) => {
      const response = await intrusionService.resolveIntrusion(alertId)
      if (response.success) {
        console.log("[v0] Alert resolved successfully")
        loadIntrusionAlerts()
      } else {
        console.error("Error resolving alert:", response.error)
        alert(`Error al resolver alerta: ${response.error}`)
      }
    },
    [loadIntrusionAlerts],
  )

  useEffect(() => {
    loadIntrusionAlerts()
    startCamera()

    return () => {
      if (motionDetectionRef.current) {
        clearInterval(motionDetectionRef.current)
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [loadIntrusionAlerts, startCamera])

  useEffect(() => {
    if (isStreaming) {
      setTimeout(() => {
        startMotionDetection()
      }, 1000)
    }
    return () => {
      if (motionDetectionRef.current) {
        clearInterval(motionDetectionRef.current)
      }
    }
  }, [isStreaming, startMotionDetection])

  const getStatusDisplay = () => {
    switch (systemStatus) {
      case "waiting":
        return {
          color: "bg-green-500",
          icon: <Eye className="w-4 h-4" />,
          text: "Vigilancia activa",
        }
      case "motion_detected":
        return {
          color: "bg-orange-500",
          icon: <Eye className="w-4 h-4" />,
          text: "Movimiento detectado",
        }
      case "searching":
        return {
          color: "bg-blue-500",
          icon: <Eye className="w-4 h-4" />,
          text: "Analizando amenaza...",
        }
      default:
        return {
          color: "bg-green-500",
          icon: <Eye className="w-4 h-4" />,
          text: "Vigilancia activa",
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sistema de Vigilancia Automático
            </CardTitle>
            <CardDescription>Detección automática de intrusos mediante reconocimiento facial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isStreaming ? "block" : "none" }}
              />

              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-2 text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground">Iniciando sistema de vigilancia...</p>
                  </div>
                </div>
              )}

              {isStreaming && !surveillanceResult && (
                <div
                  className={`absolute top-4 left-4 ${statusDisplay.color} text-white px-3 py-1 rounded-full text-sm flex items-center gap-2`}
                >
                  {statusDisplay.icon}
                  {statusDisplay.text}
                </div>
              )}

              {surveillanceResult && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div
                    className={`bg-white rounded-lg p-6 text-center max-w-sm mx-4 ${
                      surveillanceResult.intruderDetected ? "border-red-500 border-2" : "border-green-500 border-2"
                    }`}
                  >
                    {surveillanceResult.intruderDetected ? (
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                    ) : (
                      <Shield className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    )}
                    <h3 className="font-semibold text-lg mb-2">
                      {surveillanceResult.intruderDetected ? "INTRUSO DETECTADO" : "RESIDENTE AUTORIZADO"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">{surveillanceResult.message}</p>
                    {surveillanceResult.resident && (
                      <div className="text-xs text-muted-foreground">
                        <p>Apartamento: {surveillanceResult.resident.apartment_number}</p>
                        <p>Confianza: {(surveillanceResult.confidence * 100).toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={motionCanvasRef} className="hidden" />

            <div className="text-center text-sm text-muted-foreground">
              <p>Sistema de vigilancia funcionando automáticamente</p>
              <p>Detectando intrusos las 24 horas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Intrusión Pendientes
            </CardTitle>
            <CardDescription>Intrusiones detectadas que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {intrusionAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay alertas pendientes</p>
              ) : (
                intrusionAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg border bg-red-50 border-red-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">Cámara: {alert.camera_identifier}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.detection_time).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.detection_time).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(Number.parseFloat(alert.confidence) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    {!alert.is_resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 bg-transparent"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Marcar como Resuelta
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
