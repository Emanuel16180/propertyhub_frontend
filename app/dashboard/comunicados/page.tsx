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
import { Plus, Search, Megaphone, Clock, Users, Eye, Trash2, Edit } from "lucide-react"
import { LocalStorageDB, type Announcement } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"

export default function DashboardComunicadosPage() {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | Announcement["type"]>("all")
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    announcement?: Announcement
    isDeleting: boolean
  }>({
    isOpen: false,
    announcement: undefined,
    isDeleting: false,
  })

  useEffect(() => {
    loadAnnouncements()
  }, [])

  useEffect(() => {
    filterAnnouncements()
  }, [announcements, searchQuery, typeFilter])

  const loadAnnouncements = () => {
    const data = LocalStorageDB.getAnnouncements()
    setAnnouncements(data)
  }

  const filterAnnouncements = () => {
    let filtered = announcements

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (announcement) =>
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.message.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((announcement) => announcement.type === typeFilter)
    }

    setFilteredAnnouncements(filtered)
  }

  const handleAnnouncementSuccess = (announcement: Announcement) => {
    setShowForm(false)
    setEditingAnnouncement(undefined)
    loadAnnouncements()
  }

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setShowForm(true)
  }

  const handleDeleteClick = (announcement: Announcement) => {
    setDeleteDialog({
      isOpen: true,
      announcement,
      isDeleting: false,
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.announcement) return

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }))

    try {
      LocalStorageDB.deleteAnnouncement(deleteDialog.announcement.id)
      loadAnnouncements()
      toast({
        title: "Comunicado eliminado",
        description: "El comunicado se ha eliminado correctamente.",
      })
      setDeleteDialog({ isOpen: false, announcement: undefined, isDeleting: false })
    } catch (error) {
      console.error("Error deleting announcement:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar el comunicado. Intente nuevamente.",
      })
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }))
    }
  }

  const getTypeColor = (type: Announcement["type"]) => {
    const typeConfig = LocalStorageDB.getAnnouncementTypes().find((t) => t.value === type)
    return typeConfig?.color || "bg-gray-100 text-gray-800"
  }

  const getPriorityIcon = (priority: Announcement["priority"]) => {
    switch (priority) {
      case "alta":
        return "🔴"
      case "media":
        return "🟡"
      case "baja":
        return "🟢"
      default:
        return "⚪"
    }
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

  const announcementTypes = LocalStorageDB.getAnnouncementTypes()

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
                {announcementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{announcements.length}</p>
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
                    <p className="text-2xl font-bold">{announcements.filter((a) => a.is_active).length}</p>
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
                      {announcements.filter((a) => a.type === "urgente" && a.is_active).length}
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
                    <p className="text-sm text-muted-foreground">Hoy</p>
                    <p className="text-2xl font-bold">
                      {
                        announcements.filter((a) => a.created_at.startsWith(new Date().toISOString().split("T")[0]))
                          .length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements List */}
          <div className="space-y-4">
            {filteredAnnouncements.length === 0 ? (
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
              filteredAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{announcement.title}</h3>
                          <Badge className={getTypeColor(announcement.type)}>
                            {announcementTypes.find((t) => t.value === announcement.type)?.label}
                          </Badge>
                          <span className="text-sm">{getPriorityIcon(announcement.priority)}</span>
                        </div>

                        <p className="text-muted-foreground mb-4 line-clamp-2">{announcement.message}</p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(announcement.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {
                              LocalStorageDB.getTargetAudiences().find((t) => t.value === announcement.target_audience)
                                ?.label
                            }
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handleEditAnnouncement(announcement)}>
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(announcement)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {announcement.read_by.length > 0 && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Leído por:</strong> {announcement.read_by.length} persona(s)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Announcement Form Modal */}
        {showForm && (
          <AnnouncementForm
            onClose={() => {
              setShowForm(false)
              setEditingAnnouncement(undefined)
            }}
            onSuccess={handleAnnouncementSuccess}
            editingAnnouncement={editingAnnouncement}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, announcement: undefined, isDeleting: false })}
          onConfirm={handleDeleteConfirm}
          title={`¿Eliminar "${deleteDialog.announcement?.title}"?`}
          description="Este comunicado será eliminado permanentemente y no podrá ser recuperado."
          isDeleting={deleteDialog.isDeleting}
        />
      </DashboardLayout>
    </AuthGuard>
  )
}
