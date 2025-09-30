"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  reservationsAPI,
  type CommonAreaOption,
  type PropertyOption,
  type ResidentOption,
  type TimeSlot,
  type Reservation,
} from "@/lib/api/reservations"
import { Calendar, Clock, MapPin, User, Home, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ReservationFormProps {
  onReservationCreated?: (reservation: Reservation) => void
  onClose?: () => void
}

export function ReservationForm({ onReservationCreated, onClose }: ReservationFormProps) {
  const [formData, setFormData] = useState({
    common_area_id: 0,
    property_id: 0,
    resident_id: 0,
    date: "",
    start_time: "",
    end_time: "",
    notes: "",
  })

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [commonAreas, setCommonAreas] = useState<CommonAreaOption[]>([])
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [residents, setResidents] = useState<ResidentOption[]>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(true)
  const [isLoadingProperties, setIsLoadingProperties] = useState(true)
  const [isLoadingResidents, setIsLoadingResidents] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  useEffect(() => {
    loadCommonAreas()
    loadProperties()
  }, [])

  const loadCommonAreas = async () => {
    try {
      setIsLoadingAreas(true)
      const areas = await reservationsAPI.getCommonAreas()
      setCommonAreas(areas)
    } catch (error) {
      console.error("Error loading common areas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las áreas comunes",
        variant: "destructive",
      })
      setCommonAreas([])
    } finally {
      setIsLoadingAreas(false)
    }
  }

  const loadProperties = async () => {
    try {
      setIsLoadingProperties(true)
      const props = await reservationsAPI.getProperties()
      setProperties(props)
    } catch (error) {
      console.error("Error loading properties:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las propiedades",
        variant: "destructive",
      })
      setProperties([])
    } finally {
      setIsLoadingProperties(false)
    }
  }

  const handlePropertyChange = async (propertyId: string) => {
    const id = Number.parseInt(propertyId)
    setFormData((prev) => ({ ...prev, property_id: id, resident_id: 0 }))
    setResidents([])

    if (id) {
      try {
        setIsLoadingResidents(true)
        const residentsList = await reservationsAPI.getResidentsByProperty(id)
        setResidents(residentsList)
      } catch (error) {
        console.error("Error loading residents:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los residentes",
          variant: "destructive",
        })
      } finally {
        setIsLoadingResidents(false)
      }
    }
  }

  const loadTimeSlots = async (areaId: number, date: string) => {
    if (!areaId || !date) return

    // Validate date is not in the past
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      console.log("[v0] Skipping time slots load - date is in the past")
      return
    }

    try {
      setIsLoadingSlots(true)
      const slots = await reservationsAPI.getAvailableTimeSlots(areaId, date)
      setAvailableSlots(slots)
    } catch (error) {
      console.error("Error loading time slots:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los horarios disponibles",
        variant: "destructive",
      })
      setAvailableSlots([])
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleDateChange = (date: string) => {
    setFormData((prev) => ({ ...prev, date, start_time: "", end_time: "" }))
    if (date && formData.common_area_id) {
      loadTimeSlots(formData.common_area_id, date)
    } else {
      setAvailableSlots([])
    }
  }

  const handleAreaChange = (areaId: string) => {
    const id = Number.parseInt(areaId)
    setFormData((prev) => ({ ...prev, common_area_id: id, start_time: "", end_time: "" }))
    if (id && formData.date) {
      loadTimeSlots(id, formData.date)
    } else {
      setAvailableSlots([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form
      if (
        !formData.common_area_id ||
        !formData.property_id ||
        !formData.resident_id ||
        !formData.date ||
        !formData.start_time ||
        !formData.end_time
      ) {
        toast({
          title: "Error",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        })
        return
      }

      const formatTime = (time: string) => {
        return time.length === 5 ? `${time}:00` : time
      }

      // Create reservation via API
      const reservation = await reservationsAPI.createReservation({
        common_area_id: formData.common_area_id,
        property_id: formData.property_id,
        resident_id: formData.resident_id,
        date: formData.date,
        start_time: formatTime(formData.start_time),
        end_time: formatTime(formData.end_time),
        notes: formData.notes || undefined,
      })

      toast({
        title: "Reserva creada",
        description: `Reserva confirmada para ${reservation.common_area.name} el ${formData.date}`,
      })

      onReservationCreated?.(reservation)
      onClose?.()

      // Reset form
      setFormData({
        common_area_id: 0,
        property_id: 0,
        resident_id: 0,
        date: "",
        start_time: "",
        end_time: "",
        notes: "",
      })
      setAvailableSlots([])
      setResidents([])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo crear la reserva"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Nueva Reserva
        </CardTitle>
        <CardDescription>Reservar un área común para un residente</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Area Selection */}
          <div className="space-y-2">
            <Label htmlFor="area" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Área Común
            </Label>
            <Select
              value={formData.common_area_id.toString()}
              onValueChange={handleAreaChange}
              disabled={isLoadingAreas}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingAreas ? "Cargando áreas..." : "Selecciona un área común"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingAreas ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Cargando...</span>
                  </div>
                ) : commonAreas.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">No hay áreas comunes disponibles</div>
                ) : (
                  commonAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name} - {area.area_type_display}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Property and Resident Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Propiedad
              </Label>
              <Select
                value={formData.property_id.toString()}
                onValueChange={handlePropertyChange}
                disabled={isLoadingProperties}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingProperties ? "Cargando..." : "Selecciona una propiedad"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProperties ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Cargando...</span>
                    </div>
                  ) : properties.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">No hay propiedades disponibles</div>
                  ) : (
                    properties.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.display_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resident" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Residente
              </Label>
              <Select
                value={formData.resident_id.toString()}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, resident_id: Number.parseInt(value) }))}
                disabled={!formData.property_id || isLoadingResidents}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingResidents ? "Cargando..." : "Selecciona un residente"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingResidents ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Cargando...</span>
                    </div>
                  ) : residents.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {formData.property_id
                        ? "No hay residentes en esta propiedad"
                        : "Selecciona una propiedad primero"}
                    </div>
                  ) : (
                    residents.map((resident) => (
                      <SelectItem key={resident.id} value={resident.id.toString()}>
                        {resident.display_name} {resident.is_owner && "(Propietario)"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha
            </Label>
            <Input
              id="date"
              type="date"
              min={getMinDate()}
              value={formData.date}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          {/* Time Availability Display */}
          {isLoadingSlots && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Cargando horarios disponibles...</span>
            </div>
          )}

          {!isLoadingSlots && availableSlots.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Disponibilidad de Horarios
              </Label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {availableSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-md text-sm text-center border ${
                      slot.available
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {slot.available ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span className="text-xs">{slot.display}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Hora de Inicio</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Hora de Fin</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Información adicional sobre la reserva..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading || isLoadingAreas || isLoadingProperties} className="flex-1">
              {isLoading ? "Creando..." : "Crear Reserva"}
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
  )
}
