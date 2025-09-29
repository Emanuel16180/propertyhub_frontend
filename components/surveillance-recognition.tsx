"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle, Loader2, Eye } from "lucide-react"
import { LocalStorageDB, type AccessLog } from "@/lib/local-storage"
import { faceRecognitionService } from "@/lib/face-recognition-real"

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
  const [intruderDetections, setIntruderDetections] = useState<AccessLog[]>([])
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

        const faceResult = await faceRecognitionService.recognizeFace(img)

        let result: SurveillanceResult

        if (faceResult && faceResult.confidence >= 0.55) {
          const residents = LocalStorageDB.getResidents()
          const resident = residents.find((r) => r.name === faceResult.name)

          if (resident) {
            console.log("[v0] Residente autorizado detectado:", resident.name)
            result = {
              intruderDetected: false,
              resident,
              confidence: faceResult.confidence,
              message: `Residente autorizado: ${resident.name}`,
            }
          } else {
            console.log("[v0] Intruso detectado - rostro reconocido pero no autorizado:", faceResult.name)
            result = {
              intruderDetected: true,
              confidence: faceResult.confidence,
              message: `Intruso detectado - Persona no autorizada`,
            }
          }
        } else {
          console.log("[v0] Intruso detectado - rostro no reconocido")
          result = {
            intruderDetected: true,
            confidence: faceResult?.confidence || 0,
            message: "Intruso detectado - Rostro no reconocido",
          }
        }

        setSurveillanceResult(result)

        LocalStorageDB.saveAccessLog({
          resident_id: result.resident?.id || undefined,
          access_time: new Date().toISOString(),
          access_type: "surveillance",
          confidence_score: result.confidence,
          status: result.intruderDetected ? "intrusion" : "authorized",
          notes: result.message,
        })

        loadIntruderDetections()

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

  const loadIntruderDetections = useCallback(() => {
    const logs = LocalStorageDB.getAccessLogs()
      .filter((log) => log.access_type === "surveillance")
      .slice(0, 5)
    setIntruderDetections(logs)
  }, [])

  useEffect(() => {
    loadIntruderDetections()
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
  }, [loadIntruderDetections, startCamera])

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
              Intrusos Detectados
            </CardTitle>
            <CardDescription>Últimas detecciones del sistema de vigilancia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {intruderDetections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay detecciones recientes</p>
              ) : (
                intruderDetections.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${
                      log.status === "intrusion" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {log.status === "intrusion" ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Shield className="w-4 h-4 text-green-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {log.status === "intrusion"
                              ? "Intruso detectado"
                              : log.resident?.name || "Residente autorizado"}
                          </p>
                          {log.resident && (
                            <p className="text-xs text-muted-foreground">
                              {log.resident.apartment_number} • {log.resident.type}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.access_time).toLocaleTimeString()}
                        </p>
                        {log.confidence_score && (
                          <p className="text-xs text-muted-foreground">{(log.confidence_score * 100).toFixed(1)}%</p>
                        )}
                      </div>
                    </div>
                    {log.notes && <p className="text-xs text-muted-foreground mt-1">{log.notes}</p>}
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
