"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Building, Loader2 } from "lucide-react"
import { propertyService, type Property } from "@/services/propertyService"
import { userService, type User as Owner } from "@/services/userService"

interface HouseFormProps {
  editingHouse?: Property | null
  onClose?: () => void
}

export function HouseForm({ editingHouse, onClose }: HouseFormProps) {
  const [formData, setFormData] = useState({
    house_number: "",
    block: "",
    floor: "",
    area_m2: "",
    bedrooms: "",
    bathrooms: "",
    parking_spaces: "",
    status: "" as "available" | "occupied" | "maintenance" | "reserved" | "",
    description: "",
    owner_id: null as number | null, // Added owner_id field
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [availableOwners, setAvailableOwners] = useState<Owner[]>([]) // Added state for available owners
  const [loadingOwners, setLoadingOwners] = useState(true) // Added loading state for owners

  useEffect(() => {
    const loadOwners = async () => {
      try {
        const response = await userService.getAvailableOwners()
        if (response.success && response.data) {
          setAvailableOwners(response.data)
        } else {
          console.error("[v0] Failed to load owners:", response.error)
        }
      } catch (error) {
        console.error("[v0] Error loading owners:", error)
      } finally {
        setLoadingOwners(false)
      }
    }

    loadOwners()
  }, [])

  useEffect(() => {
    if (editingHouse) {
      setFormData({
        house_number: editingHouse.house_number,
        block: editingHouse.block || "",
        floor: editingHouse.floor || "",
        area_m2: editingHouse.area_m2?.toString() || "",
        bedrooms: editingHouse.bedrooms?.toString() || "",
        bathrooms: editingHouse.bathrooms?.toString() || "",
        parking_spaces: editingHouse.parking_spaces?.toString() || "",
        status: editingHouse.status,
        description: editingHouse.description || "",
        owner_id: editingHouse.owner?.id || null, // Set owner_id from existing property
      })
    }
  }, [editingHouse])

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const propertyData = {
        house_number: formData.house_number,
        block: formData.block || undefined,
        floor: formData.floor || undefined,
        area_m2: formData.area_m2 ? Number.parseFloat(formData.area_m2) : undefined,
        bedrooms: formData.bedrooms ? Number.parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? Number.parseInt(formData.bathrooms) : undefined,
        parking_spaces: formData.parking_spaces ? Number.parseInt(formData.parking_spaces) : undefined,
        status: formData.status as Property["status"],
        description: formData.description || undefined,
      }

      console.log("[v0] Submitting property data:", propertyData)

      let response
      if (editingHouse?.id) {
        response = await propertyService.updateProperty(editingHouse.id, propertyData)
      } else {
        response = await propertyService.createProperty(propertyData)
      }

      if (response.success && response.data) {
        if (formData.owner_id && response.data.id) {
          console.log("[v0] Assigning owner to property:", response.data.id, formData.owner_id)
          const ownerResponse = await propertyService.assignOwner(response.data.id, formData.owner_id)

          if (!ownerResponse.success) {
            console.warn("[v0] Failed to assign owner:", ownerResponse.error)
            // Don't fail the entire operation, just log the warning
          }
        }

        setMessage({
          type: "success",
          text: `Casa ${formData.house_number} ${editingHouse ? "actualizada" : "registrada"} exitosamente`,
        })

        setTimeout(() => {
          if (onClose) onClose()
        }, 1500)
      } else {
        setMessage({
          type: "error",
          text: response.error || `Error al ${editingHouse ? "actualizar" : "registrar"} la casa`,
        })
      }
    } catch (error) {
      console.error("[v0] Form submission error:", error)
      setMessage({
        type: "error",
        text: `Error al ${editingHouse ? "actualizar" : "registrar"} la casa: ${error instanceof Error ? error.message : "Error desconocido"}`,
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
            <Building className="w-5 h-5" />
            {editingHouse ? `Editar Casa ${editingHouse.house_number}` : "Registro de Casa"}
          </CardTitle>
          <CardDescription>Complete los datos de la propiedad del condominio</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="house_number">Número de Casa *</Label>
                <Input
                  id="house_number"
                  value={formData.house_number}
                  onChange={(e) => handleInputChange("house_number", e.target.value)}
                  placeholder="Ej: 101, A-205"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="block">Bloque</Label>
                <Input
                  id="block"
                  value={formData.block}
                  onChange={(e) => handleInputChange("block", e.target.value)}
                  placeholder="Ej: A, B, Torre 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Piso</Label>
                <Input
                  id="floor"
                  value={formData.floor}
                  onChange={(e) => handleInputChange("floor", e.target.value)}
                  placeholder="Ej: 1, 2, 3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area_m2">Área (m²)</Label>
                <Input
                  id="area_m2"
                  type="number"
                  value={formData.area_m2}
                  onChange={(e) => handleInputChange("area_m2", e.target.value)}
                  placeholder="Ej: 85.5"
                  min="1"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms">Habitaciones</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                  placeholder="Ej: 3"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Baños</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                  placeholder="Ej: 2"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parking_spaces">Espacios de Parqueo</Label>
                <Input
                  id="parking_spaces"
                  type="number"
                  value={formData.parking_spaces}
                  onChange={(e) => handleInputChange("parking_spaces", e.target.value)}
                  placeholder="Ej: 1"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="occupied">Ocupada</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    <SelectItem value="reserved">Reservada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_id" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Propietario
              </Label>
              {loadingOwners ? (
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Cargando propietarios...</span>
                </div>
              ) : (
                <Select
                  value={formData.owner_id?.toString() || "null"}
                  onValueChange={(value) =>
                    handleInputChange("owner_id", value === "null" ? null : Number.parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar propietario" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOwners.map((owner) => (
                      <SelectItem key={owner.id || "null"} value={owner.id?.toString() || "null"}>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{owner.name}</span>
                          {owner.type && owner.id && (
                            <span className="text-xs text-muted-foreground">({owner.type})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Seleccione el propietario de la casa. Puede dejarlo "Sin asignar" y editarlo después.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descripción adicional de la propiedad..."
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingHouse ? "Actualizando..." : "Registrando..."}
                </>
              ) : (
                <>
                  <Building className="w-4 h-4 mr-2" />
                  {editingHouse ? "Actualizar Casa" : "Registrar Casa"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
