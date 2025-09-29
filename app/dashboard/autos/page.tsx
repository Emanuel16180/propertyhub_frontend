"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Car, Plus, Search, Filter, User, Home, Calendar, Settings, Trash2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CarForm } from "@/components/car-form"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { vehicleService, type ApiVehicle } from "@/services/vehicleService"

export default function DashboardAutosPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<ApiVehicle | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    vehicle: ApiVehicle | undefined
    isDeleting: boolean
  }>({
    isOpen: false,
    vehicle: undefined,
    isDeleting: false,
  })
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading vehicles from API...")
      const result = await vehicleService.getVehicles()
      if (result.success && result.data) {
        console.log("[v0] Loaded vehicles:", result.data)
        setVehicles(result.data)
      } else {
        console.error("[v0] Failed to load vehicles:", result.error)
        toast({
          title: "Error",
          description: `Error al cargar vehículos: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Exception loading vehicles:", error)
      toast({
        title: "Error",
        description: "Error de conexión al cargar vehículos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditVehicle = (vehicle: ApiVehicle) => {
    setEditingVehicle(vehicle)
    setShowForm(true)
  }

  const handleNewVehicle = () => {
    setEditingVehicle(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingVehicle(null)
  }

  const handleFormSuccess = () => {
    // Refresh vehicles list after successful form submission
    loadVehicles()
  }

  const handleDeleteClick = (vehicle: ApiVehicle) => {
    setDeleteDialog({
      isOpen: true,
      vehicle: vehicle,
      isDeleting: false,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.vehicle?.id) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      const result = await vehicleService.deleteVehicle(deleteDialog.vehicle.id)
      if (result.success) {
        loadVehicles()
        toast({
          title: "Vehículo eliminado",
          description: `El vehículo ${deleteDialog.vehicle.license_plate} ha sido eliminado exitosamente.`,
        })
        setDeleteDialog({ isOpen: false, vehicle: undefined, isDeleting: false })
      } else {
        toast({
          title: "Error",
          description: `Error al eliminar el vehículo: ${result.error}`,
          variant: "destructive",
        })
        setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el vehículo. Intente nuevamente.",
        variant: "destructive",
      })
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      vehicle.license_plate.toLowerCase().includes(query) ||
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.owner_name.toLowerCase().includes(query) ||
      vehicle.owner_house.toLowerCase().includes(query)
    )
  })

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Autos</h1>
              <p className="text-muted-foreground">Gestionar los vehículos registrados en el condominio</p>
            </div>
            <Button onClick={showForm ? handleCloseForm : handleNewVehicle} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {showForm ? "Ver Lista" : "Nuevo Vehículo"}
            </Button>
          </div>

          {showForm ? (
            <CarForm editingVehicle={editingVehicle} onClose={handleCloseForm} onSuccess={handleFormSuccess} />
          ) : (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por placa, propietario, modelo..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Cargando vehículos...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Cars List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVehicles.map((car) => (
                      <Card key={car.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Car className="w-5 h-5 text-primary" />
                            {car.license_plate}
                          </CardTitle>
                          <CardDescription>
                            {car.brand} {car.model} ({car.year})
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Propietario:</span>
                              <span className="text-sm font-medium">{car.owner_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Casa:</span>
                              <span className="text-sm font-medium">{car.owner_house}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Tipo:</span>
                              <span className="text-sm font-medium">
                                {car.vehicle_type_display || car.vehicle_type}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Color:</span>
                              <span className="text-sm font-medium">{car.color}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="flex-1 bg-transparent" size="sm">
                                  Ver Detalles
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Car className="w-5 h-5 text-primary" />
                                    Detalles del Vehículo
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Placa</label>
                                      <p className="text-sm font-semibold text-lg">{car.license_plate}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                        <Settings className="w-4 h-4" />
                                        Tipo
                                      </label>
                                      <p className="text-sm font-semibold">
                                        {car.vehicle_type_display || car.vehicle_type}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Marca y Modelo</label>
                                    <p className="text-sm font-semibold">
                                      {car.brand} {car.model}
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      Propietario
                                    </label>
                                    <p className="text-sm font-semibold">{car.owner_name}</p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                      <Home className="w-4 h-4" />
                                      Casa Asignada
                                    </label>
                                    <p className="text-sm font-semibold">{car.owner_house}</p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      Año del Vehículo
                                    </label>
                                    <p className="text-sm font-semibold">{car.year}</p>
                                  </div>

                                  {car.description && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Observaciones</label>
                                      <p className="text-sm">{car.description}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              className="flex-1 bg-transparent"
                              size="sm"
                              onClick={() => handleEditVehicle(car)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(car)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredVehicles.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        {searchQuery ? "No se encontraron vehículos" : "No hay vehículos registrados"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery
                          ? "Intenta con otros términos de búsqueda"
                          : "Comienza registrando el primer vehículo del condominio"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DeleteConfirmationDialog
            isOpen={deleteDialog.isOpen}
            onClose={() => setDeleteDialog({ isOpen: false, vehicle: undefined, isDeleting: false })}
            onConfirm={handleDeleteConfirm}
            title={`¿Eliminar vehículo ${deleteDialog.vehicle?.license_plate}?`}
            description={`Esta acción eliminará permanentemente el vehículo ${deleteDialog.vehicle?.license_plate} (${deleteDialog.vehicle?.brand} ${deleteDialog.vehicle?.model}) de ${deleteDialog.vehicle?.owner_name}. Todos los datos asociados se perderán.`}
            isDeleting={deleteDialog.isDeleting}
          />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
