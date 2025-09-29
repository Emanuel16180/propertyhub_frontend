"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CameraCapture } from "./camera-capture"
import { UserPlus, Loader2, Phone } from "lucide-react"
import { residentService, type ApiResident, type CreateResidentData } from "@/services/residentService"
import { propertyService } from "@/services/propertyService"

interface ResidentFormProps {
  editingResident?: ApiResident | null
  onClose?: () => void
  onSuccess?: () => void
}

export function ResidentForm({ editingResident, onClose, onSuccess }: ResidentFormProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    resident_type: "" as "owner" | "tenant" | "family" | "",
    birth_date: "",
    phone: "",
    document_number: "",
    house_identifier: "",
    emergency_contact: "",
  })

  const [faceImage, setFaceImage] = useState<string | null>(null)
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [availableHouses, setAvailableHouses] = useState<string[]>([])
  const [loadingHouses, setLoadingHouses] = useState(true)

  const loadHouses = async () => {
    try {
      setLoadingHouses(true)
      const response = await propertyService.getProperties()

      if (response.success && response.data) {
        const houseIds = response.data.map((property) => {
          const houseNumber = property.house_number || property.id
          const block = property.block ? ` - Bloque ${property.block}` : ""
          return `Casa ${houseNumber}${block}`
        })
        setAvailableHouses(houseIds)
      } else {
        setAvailableHouses([
          "Casa 101 - Bloque A",
          "Casa 102 - Bloque A",
          "Casa 103 - Bloque A",
          "Casa 104 - Bloque A",
          "Casa 105 - Bloque A",
          "Casa 106 - Bloque A",
          "Casa 201 - Bloque B",
          "Casa 202 - Bloque B",
          "Casa 203 - Bloque B",
          "Casa 204 - Bloque B",
          "Casa 205 - Bloque B",
          "Casa 206 - Bloque B",
          "Casa 301 - Bloque C",
          "Casa 302 - Bloque C",
          "Casa 303 - Bloque C",
          "Casa 304 - Bloque C",
          "Casa 305 - Bloque C",
          "Casa 306 - Bloque C",
        ])
      }
    } catch (error) {
      setAvailableHouses([
        "Casa 101 - Bloque A",
        "Casa 102 - Bloque A",
        "Casa 103 - Bloque A",
        "Casa 104 - Bloque A",
        "Casa 105 - Bloque A",
        "Casa 106 - Bloque A",
        "Casa 201 - Bloque B",
        "Casa 202 - Bloque B",
        "Casa 203 - Bloque B",
        "Casa 204 - Bloque B",
        "Casa 205 - Bloque B",
        "Casa 206 - Bloque B",
        "Casa 301 - Bloque C",
        "Casa 302 - Bloque C",
        "Casa 303 - Bloque C",
        "Casa 304 - Bloque C",
        "Casa 305 - Bloque C",
        "Casa 306 - Bloque C",
      ])
    } finally {
      setLoadingHouses(false)
    }
  }

  useEffect(() => {
    if (editingResident) {
      setFormData({
        first_name: editingResident.first_name,
        last_name: editingResident.last_name,
        username: editingResident.username,
        email: editingResident.email,
        password: "", // Don't pre-fill password
        resident_type: editingResident.profile.resident_info.resident_type,
        birth_date: editingResident.profile.resident_info.birth_date,
        phone: editingResident.profile.phone,
        document_number: editingResident.profile.resident_info.document_number,
        house_identifier: editingResident.profile.resident_info.house_identifier,
        emergency_contact: editingResident.profile.resident_info.emergency_contact,
      })

      if (editingResident.profile.resident_info.face_photo) {
        setFaceImage(editingResident.profile.resident_info.face_photo)
      }
    }
  }, [editingResident])

  useEffect(() => {
    loadHouses()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-generate username from first and last name
    if (field === "first_name" || field === "last_name") {
      const firstName = field === "first_name" ? value : formData.first_name
      const lastName = field === "last_name" ? value : formData.last_name
      if (firstName && lastName && !editingResident) {
        const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, "")
        setFormData((prev) => ({ ...prev, username }))
      }
    }
  }

  const handleFaceCapture = (imageData: string) => {
    setFaceImage(imageData)

    // Convert base64 to File
    fetch(imageData)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `face_${Date.now()}.jpg`, { type: "image/jpeg" })
        setFaceFile(file)
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingResident && !faceImage) {
      setMessage({ type: "error", text: "Por favor, capture una foto del rostro" })
      return
    }

    if (!editingResident && !formData.password) {
      setMessage({ type: "error", text: "Por favor, ingrese una contraseña" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const residentData: CreateResidentData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        user_type: "resident",
        phone: formData.phone,
        resident_type: formData.resident_type as "owner" | "tenant" | "family",
        birth_date: formData.birth_date,
        document_number: formData.document_number,
        house_identifier: formData.house_identifier,
        emergency_contact: formData.emergency_contact,
        face_photo: faceFile || undefined,
      }

      let response
      if (editingResident) {
        // Update existing resident
        response = await residentService.updateResident(editingResident.id, residentData)
      } else {
        // Create new resident
        response = await residentService.createResident(residentData)
      }

      if (response.success) {
        setMessage({
          type: "success",
          text: editingResident
            ? `Residente ${formData.first_name} ${formData.last_name} actualizado exitosamente`
            : `Residente ${formData.first_name} ${formData.last_name} registrado correctamente`,
        })

        if (onSuccess) {
          onSuccess()
        }

        if ((window as any).refreshCasasData) {
          ;(window as any).refreshCasasData()
        }

        if (!editingResident) {
          // Clear form for new resident
          setFormData({
            first_name: "",
            last_name: "",
            username: "",
            email: "",
            password: "",
            resident_type: "",
            birth_date: "",
            phone: "",
            document_number: "",
            house_identifier: "",
            emergency_contact: "",
          })
          setFaceImage(null)
          setFaceFile(null)
        }

        // Close form after 2 seconds
        setTimeout(() => {
          if (onClose) {
            onClose()
          }
        }, 2000)
      } else {
        setMessage({
          type: "error",
          text: response.error || "Error al procesar la solicitud",
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {editingResident ? "Editar Residente" : "Registro de Residente"}
          </CardTitle>
          <CardDescription>
            {editingResident
              ? "Modifique los datos del residente"
              : "Complete los datos del propietario, familiar o inquilino y capture su rostro para el sistema de reconocimiento"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nombre</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Ej: Juan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Ej: Pérez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="Ej: juan.perez"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              {!editingResident && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Contraseña segura"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="resident_type">Tipo de Residente</Label>
                <Select
                  value={formData.resident_type}
                  onValueChange={(value) => handleInputChange("resident_type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Propietario</SelectItem>
                    <SelectItem value="tenant">Inquilino</SelectItem>
                    <SelectItem value="family">Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange("birth_date", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document_number">Número de Documento</Label>
                <Input
                  id="document_number"
                  value={formData.document_number}
                  onChange={(e) => handleInputChange("document_number", e.target.value)}
                  placeholder="Ej: 12345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="house">Casa</Label>
                <Select
                  value={formData.house_identifier}
                  onValueChange={(value) => handleInputChange("house_identifier", value)}
                  required
                  disabled={loadingHouses}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingHouses ? "Cargando casas..." : "Seleccionar casa"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableHouses.map((house) => (
                      <SelectItem key={house} value={house}>
                        {house}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+57 300 123 4567"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emergency_contact">Contacto de Emergencia</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                  placeholder="Ej: María Pérez - 555-1234"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Captura de Rostro</Label>
              <CameraCapture onCapture={handleFaceCapture} captured={!!faceImage} />
              {faceImage && (
                <div className="mt-2">
                  <img
                    src={faceImage || "/placeholder.svg"}
                    alt="Rostro capturado"
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                </div>
              )}
            </div>

            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting || (!editingResident && !faceImage)}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingResident ? "Actualizando..." : "Registrando..."}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {editingResident ? "Actualizar Residente" : "Registrar Residente"}
                  </>
                )}
              </Button>
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
