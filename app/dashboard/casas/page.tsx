"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Building, Plus, Search, Filter, Home, Users, User, Trash2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HouseForm } from "@/components/house-form"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { propertyService, type Property } from "@/services/propertyService"
import { residentService, type ApiResident } from "@/services/residentService"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DashboardCasasPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingHouse, setEditingHouse] = useState<Property | null>(null)
  const [selectedHouse, setSelectedHouse] = useState<Property | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    house: Property | undefined
    isDeleting: boolean
  }>({
    isOpen: false,
    house: undefined,
    isDeleting: false,
  })
  const [houses, setHouses] = useState<Property[]>([])
  const [residents, setResidents] = useState<ApiResident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [housesResponse, residentsResponse] = await Promise.all([
        propertyService.getProperties(),
        residentService.getResidents(),
      ])

      if (housesResponse.success && housesResponse.data) {
        setHouses(housesResponse.data)
      } else {
        toast({
          title: "Error",
          description: housesResponse.error || "Error al cargar las propiedades",
          variant: "destructive",
        })
      }

      if (residentsResponse.success && residentsResponse.data) {
        console.log("[v0] Setting residents data:", residentsResponse.data)
        setResidents(residentsResponse.data)
      } else {
        console.warn("Failed to load residents:", residentsResponse.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadHouses = async () => {
    await loadData()
  }

  const handleEditHouse = (house: Property) => {
    setEditingHouse(house)
    setShowForm(true)
  }

  const handleNewHouse = () => {
    setEditingHouse(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingHouse(null)
    loadData()
  }

  const handleDeleteClick = (house: Property) => {
    setDeleteDialog({
      isOpen: true,
      house: house,
      isDeleting: false,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.house?.id) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      const response = await propertyService.deleteProperty(deleteDialog.house.id)
      if (response.success) {
        loadHouses()
        toast({
          title: "Casa eliminada",
          description: `La casa ${deleteDialog.house.house_number} ha sido eliminada exitosamente.`,
        })
        setDeleteDialog({ isOpen: false, house: undefined, isDeleting: false })
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al eliminar la casa",
          variant: "destructive",
        })
        setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión al eliminar la casa",
        variant: "destructive",
      })
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "available":
        return { text: "Disponible", color: "text-green-600" }
      case "occupied":
        return { text: "Ocupada", color: "text-blue-600" }
      case "maintenance":
        return { text: "Mantenimiento", color: "text-yellow-600" }
      case "reserved":
        return { text: "Reservada", color: "text-purple-600" }
      default:
        return { text: status, color: "text-gray-600" }
    }
  }

  const getResidentCountForHouse = (house: Property): number => {
    if (!residents || residents.length === 0) return 0

    const houseResidents = residents.filter((resident) => {
      const residentHouse = resident.profile?.resident_info?.house_identifier
      if (!residentHouse) return false

      // Extract house number and block from resident identifier
      // Format: "101 - Bloque A, Piso 1" or "101 - A, Piso 1"
      const residentMatch = residentHouse.match(/^(\d+)\s*-\s*(?:Bloque\s+)?([A-Z])/i)

      if (!residentMatch) return false

      const residentHouseNumber = residentMatch[1]
      const residentBlock = residentMatch[2]

      // Compare with current house
      const matches = house.house_number === residentHouseNumber && house.block === residentBlock

      console.log(
        `[v0] Comparing resident ${residentHouse} with house ${house.house_number}-${house.block}: ${matches}`,
      )

      return matches
    })

    console.log(`[v0] Found ${houseResidents.length} residents for Casa ${house.house_number} - Bloque ${house.block}`)
    return houseResidents.length
  }

  const handleViewDetails = async (house: Property) => {
    setSelectedHouse(house)
    try {
      const [housesResponse, residentsResponse] = await Promise.all([
        propertyService.getProperties(),
        residentService.getResidents(),
      ])

      if (housesResponse.success && housesResponse.data) {
        const updatedHouse = housesResponse.data.find((h) => h.id === house.id)
        if (updatedHouse) {
          setSelectedHouse(updatedHouse)
        }
        setHouses(housesResponse.data)
      }

      if (residentsResponse.success && residentsResponse.data) {
        setResidents(residentsResponse.data)
      }
    } catch (error) {
      console.log("[v0] Error refreshing house details:", error)
    }
  }

  const refreshData = () => {
    loadData()
  }

  useEffect(() => {
    // Store refresh function globally so ResidentForm can access it
    ;(window as any).refreshCasasData = refreshData

    return () => {
      delete (window as any).refreshCasasData
    }
  }, [])

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Casas</h1>
              <p className="text-muted-foreground">Gestionar las propiedades del condominio</p>
            </div>
            <Button onClick={showForm ? handleCloseForm : handleNewHouse} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {showForm ? "Ver Lista" : "Nueva Casa"}
            </Button>
          </div>

          {showForm ? (
            <HouseForm editingHouse={editingHouse} onClose={handleCloseForm} />
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Buscar por número de casa, propietario..." className="pl-10" />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando propiedades...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {houses.map((house) => {
                    const statusDisplay = getStatusDisplay(house.status)
                    return (
                      <Card key={house.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary" />
                            Casa {house.house_number}
                          </CardTitle>
                          <CardDescription>Propietario: {house.owner_name || "Sin asignar"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Estado:</span>
                              <span className={`text-sm font-medium ${statusDisplay.color}`}>{statusDisplay.text}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Residentes:</span>
                              <span className="text-sm font-medium">{getResidentCountForHouse(house)}</span>
                            </div>
                            {house.area_m2 && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Área:</span>
                                <span className="text-sm font-medium">{house.area_m2} m²</span>
                              </div>
                            )}
                            {house.bedrooms && (
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Habitaciones:</span>
                                <span className="text-sm font-medium">{house.bedrooms}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="flex-1 bg-transparent"
                                  size="sm"
                                  onClick={() => handleViewDetails(house)}
                                >
                                  Ver Detalles
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Home className="w-5 h-5 text-primary" />
                                    Detalles de Casa {selectedHouse?.house_number || house.house_number}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">
                                        Número de Casa
                                      </label>
                                      <p className="text-sm font-semibold">
                                        {selectedHouse?.house_number || house.house_number}
                                      </p>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Estado</label>
                                      <p
                                        className={`text-sm font-semibold ${getStatusDisplay(selectedHouse?.status || house.status).color}`}
                                      >
                                        {getStatusDisplay(selectedHouse?.status || house.status).text}
                                      </p>
                                    </div>
                                  </div>
                                  {(selectedHouse?.block || house.block) && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Bloque</label>
                                      <p className="text-sm font-semibold">{selectedHouse?.block || house.block}</p>
                                    </div>
                                  )}
                                  {(selectedHouse?.floor || house.floor) && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Piso</label>
                                      <p className="text-sm font-semibold">{selectedHouse?.floor || house.floor}</p>
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      Propietario
                                    </label>
                                    <p className="text-sm font-semibold">
                                      {selectedHouse?.owner_name || house.owner_name || "Sin propietario"}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      Número de Residentes
                                    </label>
                                    <p className="text-sm font-semibold">
                                      {selectedHouse
                                        ? getResidentCountForHouse(selectedHouse)
                                        : getResidentCountForHouse(house)}{" "}
                                      {(selectedHouse
                                        ? getResidentCountForHouse(selectedHouse)
                                        : getResidentCountForHouse(house)) === 1
                                        ? "residente"
                                        : "residentes"}
                                    </p>
                                  </div>
                                  {(selectedHouse?.description || house.description) && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                                      <p className="text-sm">{selectedHouse?.description || house.description}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              className="flex-1 bg-transparent"
                              size="sm"
                              onClick={() => handleEditHouse(house)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(house)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <DeleteConfirmationDialog
            isOpen={deleteDialog.isOpen}
            onClose={() => setDeleteDialog({ isOpen: false, house: undefined, isDeleting: false })}
            onConfirm={handleDeleteConfirm}
            title={`¿Eliminar Casa ${deleteDialog.house?.house_number}?`}
            description={`Esta acción eliminará permanentemente la casa ${deleteDialog.house?.house_number} de ${deleteDialog.house?.owner_name || "Sin propietario"}. Todos los datos asociados se perderán.`}
            isDeleting={deleteDialog.isDeleting}
          />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
