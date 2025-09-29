"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Loader2 } from "lucide-react"
import { commonAreasAPI, type CommonAreaAPI } from "@/lib/api/common-areas"
import { useToast } from "@/hooks/use-toast"

interface CommonAreaFormProps {
  editingArea?: any
  onSuccess?: () => void
}

export function CommonAreaForm({ editingArea, onSuccess }: CommonAreaFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "" as "salon" | "piscina" | "gimnasio" | "parque" | "cancha" | "bbq" | "otro" | "",
    location: "",
    capacity: "",
    available_hours_start: "",
    available_hours_end: "",
    requires_reservation: false,
    rules: "",
    description: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (editingArea) {
      console.log("[v0] Editing area:", editingArea)

      const typeMapping: Record<string, typeof formData.type> = {
        salon_eventos: "salon",
        pool: "piscina",
        gym: "gimnasio",
        playground: "parque",
        sports_court: "cancha",
        bbq_area: "bbq",
        other: "otro",
      }

      setFormData({
        name: editingArea.name || "",
        type: typeMapping[editingArea.area_type] || editingArea.type || "",
        location: editingArea.location || "",
        capacity: editingArea.capacity?.toString() || "",
        available_hours_start: editingArea.opening_time || editingArea.available_hours_start || "",
        available_hours_end: editingArea.closing_time || editingArea.available_hours_end || "",
        requires_reservation: editingArea.requires_reservation || false,
        rules: editingArea.rules || "",
        description: editingArea.description || "",
      })
    }
  }, [editingArea])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      console.log("[v0] Submitting form data:", formData)

      if (!formData.name.trim()) {
        throw new Error("El nombre del área es requerido")
      }

      if (!formData.type) {
        throw new Error("El tipo de área es requerido")
      }

      const apiData = commonAreasAPI.convertToAPIFormat(formData)
      console.log("[v0] Converted API data:", apiData)

      let result: CommonAreaAPI
      if (editingArea) {
        result = await commonAreasAPI.updateCommonArea(editingArea.id, apiData)
        console.log("[v0] Area updated:", result)
      } else {
        result = await commonAreasAPI.createCommonArea(apiData)
        console.log("[v0] Area created:", result)
      }

      const successMessage = `Área común "${formData.name}" ${editingArea ? "actualizada" : "registrada"} exitosamente`

      setMessage({
        type: "success",
        text: successMessage,
      })

      toast({
        title: editingArea ? "Área actualizada" : "Área creada",
        description: successMessage,
      })

      if (!editingArea) {
        setFormData({
          name: "",
          type: "",
          location: "",
          capacity: "",
          available_hours_start: "",
          available_hours_end: "",
          requires_reservation: false,
          rules: "",
          description: "",
        })
      }

      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
      const errorMessage = `Error al ${editingArea ? "actualizar" : "registrar"} el área común: ${error instanceof Error ? error.message : "Error desconocido"}`

      setMessage({
        type: "error",
        text: errorMessage,
      })

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
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
            <MapPin className="w-5 h-5" />
            {editingArea ? "Editar Área Común" : "Registro de Área Común"}
          </CardTitle>
          <CardDescription>
            {editingArea ? "Modifique los datos del área común" : "Complete los datos del área común del condominio"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Área *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ej: Salón Social, Piscina Principal"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salon">Salón Social</SelectItem>
                    <SelectItem value="piscina">Piscina</SelectItem>
                    <SelectItem value="gimnasio">Gimnasio</SelectItem>
                    <SelectItem value="parque">Parque/Jardín</SelectItem>
                    <SelectItem value="cancha">Cancha Deportiva</SelectItem>
                    <SelectItem value="bbq">Zona BBQ</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Ej: Primer piso, Torre A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad (personas)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  placeholder="Ej: 50"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Hora de Inicio</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.available_hours_start}
                  onChange={(e) => handleInputChange("available_hours_start", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">Hora de Fin</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.available_hours_end}
                  onChange={(e) => handleInputChange("available_hours_end", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_reservation"
                  checked={formData.requires_reservation}
                  onCheckedChange={(checked) => handleInputChange("requires_reservation", checked as boolean)}
                />
                <Label htmlFor="requires_reservation">Requiere reserva previa</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Reglas de Uso</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => handleInputChange("rules", e.target.value)}
                placeholder="Reglas y normas para el uso del área común..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descripción adicional del área común..."
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
                  {editingArea ? "Actualizando..." : "Registrando..."}
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  {editingArea ? "Actualizar Área Común" : "Registrar Área Común"}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
