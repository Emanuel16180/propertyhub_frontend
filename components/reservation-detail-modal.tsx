"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, User, Home, FileText, XCircle, CheckCircle } from "lucide-react"
import type { Reservation } from "@/lib/api/reservations"

interface ReservationDetailModalProps {
  reservation: Reservation | null
  isOpen: boolean
  onClose: () => void
  onCancel?: (reservation: Reservation) => void
}

export function ReservationDetailModal({ reservation, isOpen, onClose, onCancel }: ReservationDetailModalProps) {
  if (!reservation) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Detalles de la Reserva
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(reservation.status)} flex items-center gap-2 px-3 py-1`}>
              {getStatusIcon(reservation.status)}
              {reservation.status_display}
            </Badge>
            <span className="text-sm text-muted-foreground">ID: #{reservation.id}</span>
          </div>

          <Separator />

          {/* Common Area Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Área Común
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="font-medium text-lg">{reservation.common_area.name}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-medium">Tipo:</span> {reservation.common_area.area_type_display}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Capacidad:</span> {reservation.common_area.capacity} personas
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Horario:</span> {reservation.common_area.operating_hours}
              </p>
            </div>
          </div>

          <Separator />

          {/* Property and Resident Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                Propiedad
              </h3>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-medium">{reservation.house_property.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  Casa {reservation.house_property.house_number}
                  {reservation.house_property.block && ` - Bloque ${reservation.house_property.block}`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Residente
              </h3>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-medium">{reservation.resident.display_name}</p>
                <p className="text-sm text-muted-foreground">ID: {reservation.resident.id}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Date and Time Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Fecha y Horario
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(reservation.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>
                  {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                </span>
                <span className="text-sm text-muted-foreground">({reservation.duration_hours} hora(s))</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {reservation.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Notas
                </h3>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm">{reservation.notes}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium">Creado por:</span> {reservation.created_by_name}
            </p>
            <p>
              <span className="font-medium">Fecha de creación:</span> {formatDateTime(reservation.created_at)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {reservation.can_be_cancelled && reservation.status === "confirmed" && onCancel && (
              <Button variant="destructive" onClick={() => onCancel(reservation)} className="flex-1">
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar Reserva
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
