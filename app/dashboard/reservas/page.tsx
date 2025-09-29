"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, Search, Filter, Clock, MapPin, User, Home, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ReservationForm } from "@/components/reservation-form"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { LocalStorageDB, type Reservation } from "@/lib/local-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function DashboardReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    reservation: Reservation | undefined
    isDeleting: boolean
  }>({
    isOpen: false,
    reservation: undefined,
    isDeleting: false,
  })
  const { toast } = useToast()

  useEffect(() => {
    loadReservations()
  }, [])

  useEffect(() => {
    filterReservations()
  }, [reservations, searchTerm])

  const loadReservations = () => {
    const data = LocalStorageDB.getReservations()
    setReservations(data)
  }

  const filterReservations = () => {
    if (!searchTerm) {
      setFilteredReservations(reservations)
      return
    }

    const filtered = reservations.filter(
      (reservation) =>
        reservation.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.resident_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.house_number.includes(searchTerm) ||
        reservation.date.includes(searchTerm),
    )
    setFilteredReservations(filtered)
  }

  const handleReservationCreated = (reservation: Reservation) => {
    setReservations((prev) => [reservation, ...prev])
    setShowForm(false)
  }

  const handleDeleteClick = (reservation: Reservation) => {
    setDeleteDialog({
      isOpen: true,
      reservation: reservation,
      isDeleting: false,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.reservation) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      LocalStorageDB.deleteReservation(deleteDialog.reservation.id)
      loadReservations()
      toast({
        title: "Reserva eliminada",
        description: `La reserva de ${deleteDialog.reservation.area} ha sido eliminada exitosamente.`,
      })
      setDeleteDialog({ isOpen: false, reservation: undefined, isDeleting: false })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar la reserva. Intente nuevamente.",
        variant: "destructive",
      })
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmada":
        return "bg-green-100 text-green-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "cancelada":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00")
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Reservaciones</h1>
              <p className="text-muted-foreground">Gestionar reservas de áreas comunes y espacios del condominio</p>
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Reserva
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Reserva</DialogTitle>
                </DialogHeader>
                <ReservationForm onReservationCreated={handleReservationCreated} onClose={() => setShowForm(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por área, residente, casa o fecha..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Reservations List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReservations.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  {searchTerm ? "No se encontraron reservas" : "No hay reservas registradas"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Intenta con otros términos de búsqueda" : "Crea la primera reserva para comenzar"}
                </p>
              </div>
            ) : (
              filteredReservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      {reservation.area}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {reservation.resident_name}
                      <Home className="w-4 h-4 ml-2" />
                      Casa {reservation.house_number}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(reservation.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {reservation.start_time} - {reservation.end_time}
                        </span>
                      </div>
                      {reservation.notes && (
                        <div className="text-sm text-muted-foreground mt-2">
                          <strong>Notas:</strong> {reservation.notes}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}
                        >
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(reservation)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DeleteConfirmationDialog
            isOpen={deleteDialog.isOpen}
            onClose={() => setDeleteDialog({ isOpen: false, reservation: undefined, isDeleting: false })}
            onConfirm={handleDeleteConfirm}
            title={`¿Eliminar reserva de ${deleteDialog.reservation?.area}?`}
            description={`Esta acción eliminará permanentemente la reserva de ${deleteDialog.reservation?.area} para ${deleteDialog.reservation?.resident_name} el ${deleteDialog.reservation?.date ? formatDate(deleteDialog.reservation.date) : ""}. Todos los datos asociados se perderán.`}
            isDeleting={deleteDialog.isDeleting}
          />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
