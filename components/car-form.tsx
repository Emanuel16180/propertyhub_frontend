"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Car, Loader2 } from "lucide-react"
import { vehicleService, type CreateVehicleData } from "@/services/vehicleService"
import { residentService, type ApiResident } from "@/services/residentService"

interface CarFormProps {
  editingVehicle?: any
  onClose?: () => void
  onSuccess?: () => void
}

export function CarForm({ editingVehicle, onClose, onSuccess }: CarFormProps) {
  const [formData, setFormData] = useState({
    license_plate: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    vehicle_type: "" as "light" | "heavy" | "motorcycle" | "",
    owner_id: "",
    description: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [residents, setResidents] = useState<ApiResident[]>([])
  const [loadingResidents, setLoadingResidents] = useState(true)

  useEffect(() => {
    const loadResidents = async () => {
      try {
        console.log("[v0] Loading residents for vehicle form...")
        const result = await residentService.getResidents()
        if (result.success && result.data) {
          console.log("[v0] Loaded residents:", result.data)
          setResidents(result.data)
        } else {
          console.error("[v0] Failed to load residents:", result.error)
          setMessage({
            type: "error",
            text: `Error al cargar residentes: ${result.error}`,
          })
        }
      } catch (error) {
        console.error("[v0] Exception loading residents:", error)
        setMessage({
          type: "error",
          text: "Error de conexión al cargar residentes",
        })
      } finally {
        setLoadingResidents(false)
      }
    }

    loadResidents()
  }, [])

  useEffect(() => {
    if (editingVehicle) {
      setFormData({
        license_plate: editingVehicle.license_plate || "",
        brand: editingVehicle.brand || "",
        model: editingVehicle.model || "",
        year: editingVehicle.year?.toString() || "",
        color: editingVehicle.color || "",
        vehicle_type: editingVehicle.vehicle_type || "",
        owner_id: editingVehicle.owner?.id?.toString() || "",
        description: editingVehicle.description || "",
      })
    }
  }, [editingVehicle])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const vehicleData: CreateVehicleData = {
        license_plate: formData.license_plate,
        brand: formData.brand,
        model: formData.model,
        year: Number.parseInt(formData.year),
        color: formData.color,
        vehicle_type: formData.vehicle_type as "light" | "heavy" | "motorcycle",
        owner_id: Number.parseInt(formData.owner_id),
        description: formData.description,
      }

      console.log("[v0] Submitting vehicle data:", vehicleData)

      let result
      if (editingVehicle?.id) {
        // Update existing vehicle
        result = await vehicleService.updateVehicle(editingVehicle.id, vehicleData)
      } else {
        // Create new vehicle
        result = await vehicleService.createVehicle(vehicleData)
      }

      if (result.success) {
        setMessage({
          type: "success",
          text: `Vehículo ${formData.license_plate} ${editingVehicle ? "actualizado" : "registrado"} exitosamente`,
        })

        // Clear form if creating new vehicle
        if (!editingVehicle) {
          setFormData({
            license_plate: "",
            brand: "",
            model: "",
            year: "",
            color: "",
            vehicle_type: "",
            owner_id: "",
            description: "",
          })
        }

        // Call success callback to refresh parent component
        if (onSuccess) {
          onSuccess()
        }

        // Close form after short delay
        setTimeout(() => {
          if (onClose) {
            onClose()
          }
        }, 1500)
      } else {
        setMessage({
          type: "error",
          text: `Error al ${editingVehicle ? "actualizar" : "registrar"} el vehículo: ${result.error}`,
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error al ${editingVehicle ? "actualizar" : "registrar"} el vehículo: ${error instanceof Error ? error.message : "Error desconocido"}`,
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
            <Car className="w-5 h-5" />
            {editingVehicle ? "Editar Vehículo" : "Registro de Vehículo"}
          </CardTitle>
          <CardDescription>
            {editingVehicle ? "Actualizar los datos del vehículo" : "Complete los datos del vehículo del residente"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="license_plate">Placa *</Label>
                <Input
                  id="license_plate"
                  value={formData.license_plate}
                  onChange={(e) => handleInputChange("license_plate", e.target.value.toUpperCase())}
                  placeholder="Ej: ABC123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                  placeholder="Ej: Toyota, Chevrolet"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  placeholder="Ej: Corolla, Spark"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  placeholder="Ej: 2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  placeholder="Ej: Blanco, Negro, Azul"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Tipo de Vehículo</Label>
                <Select
                  value={formData.vehicle_type}
                  onValueChange={(value) => handleInputChange("vehicle_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Vehículo Ligero</SelectItem>
                    <SelectItem value="heavy">Vehículo Pesado</SelectItem>
                    <SelectItem value="motorcycle">Motocicleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="owner_id">Propietario *</Label>
                {loadingResidents ? (
                  <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando residentes...
                  </div>
                ) : (
                  <Select
                    value={formData.owner_id}
                    onValueChange={(value) => handleInputChange("owner_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar residente" />
                    </SelectTrigger>
                    <SelectContent>
                      {residents.map((resident) => (
                        <SelectItem key={resident.id} value={resident.id.toString()}>
                          {resident.first_name} {resident.last_name} - {resident.profile.resident_info.house_identifier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Observaciones</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Observaciones adicionales del vehículo..."
                rows={3}
              />
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
              <Button type="submit" className="flex-1" disabled={isSubmitting || loadingResidents}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingVehicle ? "Actualizando..." : "Registrando..."}
                  </>
                ) : (
                  <>
                    <Car className="w-4 h-4 mr-2" />
                    {editingVehicle ? "Actualizar Vehículo" : "Registrar Vehículo"}
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
