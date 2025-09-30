"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AnnouncementForm } from "@/components/announcement-form"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Megaphone, Clock, Users, Eye, Trash2, Edit, AlertCircle, ExternalLink } from "lucide-react"
import {
  communicationsAPI,
  type Communication,
  type CommunicationStats,
  getCommunicationTypeConfig,
  getPriorityIcon,
  getTargetAudienceLabel,
} from "@/lib/api/communications"
import { useToast } from "@/hooks/use-toast"
import { CommunicationDetailModal } from "@/components/communication-detail-modal"

export default function DashboardComunicadosPage() {
  const { toast } = useToast()
  const [communications, setCommunications] = useState<Communication[]>([])
  const [filteredCommunications, setFilteredCommunications] = useState<Communication[]>([])
  const [stats, setStats] = useState<CommunicationStats | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCommunication, setEditingCommunication] = useState<Communication | undefined>()
  const [viewingCommunication, setViewingCommunication] = useState<Communication | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | Communication["communication_type"]>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    communication?: Communication
    isDeleting: boolean
  }>({
    isOpen: false,
    communication: undefined,
    isDeleting: false,
  })

  useEffect(() => {
    loadCommunications()
    loadStats()
  }, [])

  useEffect(() => {
    filterCommunications()
  }, [communications, searchQuery, typeFilter])

  const loadCommunications = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await communicationsAPI.getCommunications({
        page_size: 50,
      })
      setCommunications(response.results)
    } catch (error) {
      console.error("Error loading communications:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido"
      setError(`Error al cargar los comunicados: ${errorMessage}`)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await communicationsAPI.getStats()
      setStats(statsData)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const filterCommunications = () => {
    let filtered = communications

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (communication) =>
          communication.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          communication.message.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((communication) => communication.communication_type === typeFilter)
    }

    setFilteredCommunications(filtered)
  }

  const handleCommunicationSuccess = () => {
    setShowForm(false)
    setEditingCommunication(undefined)
    loadCommunications()
    loadStats()
  }

  const handleEditCommunication = (communication: Communication) => {
    setEditingCommunication(communication)
    setShowForm(true)
  }

  const handleDeleteClick = (communication: Communication) => {
    setDeleteDialog({
      isOpen: true,
      communication,
      isDeleting: false,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.communication) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      await communicationsAPI.deleteCommunication(deleteDialog.communication.id)
      loadCommunications()
      loadStats()
      toast({
        title: "Comunicado eliminado",
        description: "El comunicado se ha eliminado correctamente.",
      })
      setDeleteDialog({ isOpen: false, communication: undefined, isDeleting: false })
    } catch (error) {
      console.error("Error deleting communication:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar el comunicado. Intente nuevamente.",
      })
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const handleViewCommunication = (communication: Communication) => {
    setViewingCommunication(communication)
  }

  const handleMarkedAsRead = () => {
    loadCommunications()
    loadStats()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const communicationTypes = [
    { value: "urgent", label: "Urgente" },
    { value: "general", label: "Anuncio General" },
    { value: "maintenance", label: "Mantenimiento" },
    { value: "event", label: "Evento" },
  ]

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Comunicados</h1>
              <p className="text-muted-foreground">Gestionar anuncios y comunicaciones para los residentes</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Comunicado
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por título o contenido..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {communicationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats?.total_communications || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Activos</p>
                    <p className="text-2xl font-bold">{communications.filter((c) => c.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Urgentes</p>
                    <p className="text-2xl font-bold">
                      {stats?.by_type.find((t) => t.communication_type === "urgent")?.count || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No Leídos</p>
                    <p className="text-2xl font-bold">{stats?.unread_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Cargando comunicados...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error al cargar</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadCommunications}>Reintentar</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCommunications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay comunicados</h3>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "No se encontraron comunicados con esos criterios"
                        : "No hay comunicados registrados"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredCommunications.map((communication) => {
                  const typeConfig = getCommunicationTypeConfig(communication.communication_type)
                  return (
                    <Card key={communication.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{communication.title}</h3>
                              <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                              <span className="text-sm">{getPriorityIcon(communication.priority)}</span>
                              {!communication.is_read_by_user && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Nuevo
                                </Badge>
                              )}
                            </div>

                            <p className="text-muted-foreground mb-4 line-clamp-2">{communication.message}</p>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(communication.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {getTargetAudienceLabel(communication.target_audience)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {communication.read_count} lecturas
                              </div>
                            </div>

                            {communication.author_name && (
                              <p className="text-xs text-muted-foreground mt-2">Por: {communication.author_name}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="outline" size="sm" onClick={() => handleViewCommunication(communication)}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>

                            <Button variant="outline" size="sm" onClick={() => handleEditCommunication(communication)}>
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(communication)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Announcement Form Modal */}
        {showForm && (
          <AnnouncementForm
            onClose={() => {
              setShowForm(false)
              setEditingCommunication(undefined)
            }}
            onSuccess={handleCommunicationSuccess}
            editingCommunication={editingCommunication}
          />
        )}

        {/* Communication Detail Modal */}
        {viewingCommunication && (
          <CommunicationDetailModal
            communication={viewingCommunication}
            onClose={() => setViewingCommunication(undefined)}
            onMarkAsRead={handleMarkedAsRead}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, communication: undefined, isDeleting: false })}
          onConfirm={handleDeleteConfirm}
          title={`¿Eliminar "${deleteDialog.communication?.title}"?`}
          description="Este comunicado será eliminado permanentemente y no podrá ser recuperado."
          isDeleting={deleteDialog.isDeleting}
        />
      </DashboardLayout>
    </AuthGuard>
  )
}
