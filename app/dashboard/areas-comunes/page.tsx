"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, Clock, Users, Plus, Edit, Building, Trash2, Loader2, AlertCircle } from "lucide-react"
import { CommonAreaForm } from "@/components/common-area-form"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { commonAreasAPI } from "@/lib/api/common-areas"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

type CommonArea = {
  id: number
  name: string
  description: string
  capacity: number
  schedule: string
  location: string
  area_type?: string
  area_type_display?: string
  requires_reservation?: boolean
  is_active?: boolean
  is_under_maintenance?: boolean
  rules?: string
  opening_time?: string
  closing_time?: string
}

export default function AreasComunes() {
  const [showForm, setShowForm] = useState(false)
  const [editingArea, setEditingArea] = useState<CommonArea | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    area: CommonArea | undefined
    isDeleting: boolean
  }>({
    isOpen: false,
    area: undefined,
    isDeleting: false,
  })
  const [areas, setAreas] = useState<CommonArea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadAreas()
  }, [])

  const loadAreas = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("[v0] Loading areas from API...")

      const response = await commonAreasAPI.getAllCommonAreas()
      console.log("[v0] API response:", response)

      // Convert API format to local format for compatibility
      const convertedAreas = response.results.map((apiArea) => commonAreasAPI.convertToLocalFormat(apiArea))

      setAreas(convertedAreas)
      console.log("[v0] Areas loaded successfully:", convertedAreas.length)
    } catch (error) {
      console.error("[v0] Error loading areas:", error)
      setError(error instanceof Error ? error.message : "Error al cargar las áreas comunes")
      toast({
        title: "Error",
        description: "No se pudieron cargar las áreas comunes. Verifique su conexión.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (area: CommonArea) => {
    setDeleteDialog({
      isOpen: true,
      area: area,
      isDeleting: false,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.area) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      console.log("[v0] Deleting area:", deleteDialog.area.id)
      await commonAreasAPI.deleteCommonArea(deleteDialog.area.id)

      await loadAreas() // Reload areas after deletion
      toast({
        title: "Área común eliminada",
        description: `El área "${deleteDialog.area.name}" ha sido eliminada exitosamente.`,
      })
      setDeleteDialog({ isOpen: false, area: undefined, isDeleting: false })
    } catch (error) {
      console.error("[v0] Error deleting area:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el área común. Intente nuevamente.",
        variant: "destructive",
      })
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const handleEdit = (area: CommonArea) => {
    setEditingArea(area)
    setShowForm(true)
  }

  const handleNewArea = () => {
    setEditingArea(null)
    setShowForm(true)
  }

  const handleBackToList = () => {
    setShowForm(false)
    setEditingArea(null)
    // Reload areas when returning from form
    loadAreas()
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Cargando áreas comunes...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (error) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
              <div>
                <p className="text-lg font-semibold">Error al cargar las áreas comunes</p>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={loadAreas} variant="outline">
                Reintentar
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Áreas Comunes</h1>
              <p className="text-muted-foreground">Gestión de espacios comunitarios</p>
            </div>
            <Button onClick={showForm ? handleBackToList : handleNewArea} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {showForm ? "Ver Lista" : "Nueva Área"}
            </Button>
          </div>

          {showForm ? (
            <CommonAreaForm editingArea={editingArea} onSuccess={handleBackToList} />
          ) : (
            <div className="space-y-6">
              {areas.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay áreas comunes registradas</h3>
                  <p className="text-muted-foreground mb-4">Comience agregando la primera área común del condominio.</p>
                  <Button onClick={handleNewArea}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primera Área
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {areas.map((area) => (
                    <Card key={area.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{area.name}</CardTitle>
                        <CardDescription>{area.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {area.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {area.schedule}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          Capacidad: {area.capacity} personas
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                                Ver Detalles
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Building className="w-5 h-5 text-primary" />
                                  Detalles del Área Común
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="pb-4 border-b">
                                  <h3 className="font-semibold text-lg">{area.name}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">{area.description}</p>
                                </div>

                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      Ubicación
                                    </label>
                                    <p className="text-sm font-semibold">{area.location}</p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      Horario de Funcionamiento
                                    </label>
                                    <p className="text-sm font-semibold">{area.schedule}</p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      Capacidad Máxima
                                    </label>
                                    <p className="text-sm font-semibold">{area.capacity} personas</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => handleEdit(area)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(area)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          <DeleteConfirmationDialog
            isOpen={deleteDialog.isOpen}
            onClose={() => setDeleteDialog({ isOpen: false, area: undefined, isDeleting: false })}
            onConfirm={handleDeleteConfirm}
            title={`¿Eliminar "${deleteDialog.area?.name}"?`}
            description={`Esta acción eliminará permanentemente el área común "${deleteDialog.area?.name}" ubicada en ${deleteDialog.area?.location}. Todos los datos asociados se perderán.`}
            isDeleting={deleteDialog.isDeleting}
          />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
