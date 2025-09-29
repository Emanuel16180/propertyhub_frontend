"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LocalStorageDB, type Reservation } from "@/lib/local-storage"
import { commonAreasAPI } from "@/lib/api/common-areas"
import { Calendar, Clock, MapPin, User, Home, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ReservationFormProps {
  onReservationCreated?: (reservation: Reservation) => void
  onClose?: () => void
}

export function ReservationForm({ onReservationCreated, onClose }: ReservationFormProps) {
  const [formData, setFormData] = useState({
    area: "",
    resident_name: "",
    house_number: "",
    date: "",
    start_time: "",
    end_time: "",
    notes: "",
  })

  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string; available: boolean }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [commonAreas, setCommonAreas] = useState<string[]>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(true)

  const houses = LocalStorageDB.getHouses()

  useEffect(() => {
    loadCommonAreas()
  }, [])

  const loadCommonAreas = async () => {
    try {
      setIsLoadingAreas(true)
      console.log("[v0] Loading common areas for dropdown...")

      const areas = await commonAreasAPI.getCommonAreasForDropdown()
      console.log("[v0] Common areas loaded:", areas)

      setCommonAreas(areas)
    } catch (error) {
      console.error("[v0] Error loading common areas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las áreas comunes",
        variant: "destructive",
      })
      // Fallback to empty array
      setCommonAreas([])
    } finally {
      setIsLoadingAreas(false)
    }
  }

  const handleDateChange = (date: string) => {
    setFormData((prev) => ({ ...prev, date, start_time: "", end_time: "" }))

    if (date && formData.area) {
      const slots = LocalStorageDB.getAvailableTimeSlots(formData.area, date)
      setAvailableSlots(slots)
    }
  }

  const handleAreaChange = (area: string) => {
    setFormData((prev) => ({ ...prev, area, start_time: "", end_time: "" }))

    if (area && formData.date) {
      const slots = LocalStorageDB.getAvailableTimeSlots(area, formData.date)
      setAvailableSlots(slots)
    }
  }

  const handleHouseChange = (houseNumber: string) => {
    const house = houses.find((h) => h.number === houseNumber)
    setFormData((prev) => ({
      ...prev,
      house_number: houseNumber,
      resident_name: house?.owner || "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form
      if (
        !formData.area ||
        !formData.resident_name ||
        !formData.house_number ||
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

      // Check if time slot is still available
      if (!LocalStorageDB.isTimeSlotAvailable(formData.area, formData.date, formData.start_time, formData.end_time)) {
        toast({
          title: "Error",
          description: "El horario seleccionado ya no está disponible",
          variant: "destructive",
        })
        return
      }

      // Create reservation
      const reservation = LocalStorageDB.saveReservation({
        ...formData,
        status: "confirmada",
      })

      toast({
        title: "Reserva creada",
        description: `Reserva confirmada para ${formData.area} el ${formData.date}`,
      })

      onReservationCreated?.(reservation)
      onClose?.()

      // Reset form
      setFormData({
        area: "",
        resident_name: "",
        house_number: "",
        date: "",
        start_time: "",
        end_time: "",
        notes: "",
      })
      setAvailableSlots([])
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la reserva",
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
            <Select value={formData.area} onValueChange={handleAreaChange} disabled={isLoadingAreas}>
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
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* House and Resident Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="house" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Casa
              </Label>
              <Select value={formData.house_number} onValueChange={handleHouseChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una casa" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.number} value={house.number}>
                      Casa {house.number} - {house.owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resident" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Residente
              </Label>
              <Input
                id="resident"
                value={formData.resident_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, resident_name: e.target.value }))}
                placeholder="Nombre del residente"
              />
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
          {availableSlots.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Disponibilidad de Horarios
              </Label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
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
                      <span className="text-xs">
                        {slot.start}-{slot.end}
                      </span>
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
            <Button type="submit" disabled={isLoading || isLoadingAreas} className="flex-1">
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
