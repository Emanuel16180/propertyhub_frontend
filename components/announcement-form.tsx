"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LocalStorageDB, type Announcement } from "@/lib/local-storage"
import { X, Send, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AnnouncementFormProps {
  onClose: () => void
  onSuccess: (announcement: Announcement) => void
  editingAnnouncement?: Announcement
}

export function AnnouncementForm({ onClose, onSuccess, editingAnnouncement }: AnnouncementFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: editingAnnouncement?.title || "",
    message: editingAnnouncement?.message || "",
    type: editingAnnouncement?.type || ("anuncio" as Announcement["type"]),
    priority: editingAnnouncement?.priority || ("media" as Announcement["priority"]),
    target_audience: editingAnnouncement?.target_audience || ("todos" as Announcement["target_audience"]),
    is_active: editingAnnouncement?.is_active ?? true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; message?: string }>({})

  const validateForm = () => {
    const newErrors: { title?: string; message?: string } = {}

    if (!formData.title.trim()) {
      newErrors.title = "El título es obligatorio"
    }

    if (!formData.message.trim()) {
      newErrors.message = "El mensaje es obligatorio"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor, complete todos los campos obligatorios.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (editingAnnouncement) {
        LocalStorageDB.updateAnnouncement(editingAnnouncement.id, formData)
        const updatedAnnouncement = LocalStorageDB.getAnnouncements().find((a) => a.id === editingAnnouncement.id)
        if (updatedAnnouncement) {
          onSuccess(updatedAnnouncement)
          toast({
            title: "Comunicado actualizado",
            description: "El comunicado se ha actualizado correctamente.",
          })
        }
      } else {
        const announcementData = {
          ...formData,
          created_by: "Administrador", // In a real app, this would come from auth
        }

        const newAnnouncement = LocalStorageDB.saveAnnouncement(announcementData)
        onSuccess(newAnnouncement)
        toast({
          title: "Comunicado creado",
          description: "El comunicado se ha creado correctamente.",
        })
      }
    } catch (error) {
      console.error("Error saving announcement:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al guardar el comunicado. Intente nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const announcementTypes = LocalStorageDB.getAnnouncementTypes()
  const priorityTypes = LocalStorageDB.getPriorityTypes()
  const targetAudiences = LocalStorageDB.getTargetAudiences()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {editingAnnouncement ? "Editar Comunicado" : "Crear Nuevo Comunicado"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título del Comunicado *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Mantenimiento de ascensores programado"
                className={`w-full ${errors.title ? "border-red-500" : ""}`}
              />
              {errors.title && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </div>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Escriba el contenido del comunicado..."
                className={`min-h-32 resize-none ${errors.message ? "border-red-500" : ""}`}
              />
              {errors.message && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.message}
                </div>
              )}
            </div>

            {/* Type and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Comunicado</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Announcement["type"]) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {announcementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${type.color.includes("red") ? "bg-red-500" : type.color.includes("blue") ? "bg-blue-500" : type.color.includes("yellow") ? "bg-yellow-500" : "bg-green-500"}`}
                          />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Announcement["priority"]) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityTypes.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label>Dirigido a</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value: Announcement["target_audience"]) =>
                  setFormData({ ...formData, target_audience: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {targetAudiences.map((audience) => (
                    <SelectItem key={audience.value} value={audience.value}>
                      {audience.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {editingAnnouncement ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {editingAnnouncement ? "Actualizar Comunicado" : "Crear Comunicado"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
