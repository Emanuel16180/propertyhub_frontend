"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  communicationsAPI,
  type Communication,
  getCommunicationTypeConfig,
  getPriorityIcon,
  getTargetAudienceLabel,
} from "@/lib/api/communications"
import { X, Clock, Users, Eye, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CommunicationDetailModalProps {
  communication: Communication
  onClose: () => void
  onMarkAsRead?: () => void
}

export function CommunicationDetailModal({ communication, onClose, onMarkAsRead }: CommunicationDetailModalProps) {
  const { toast } = useToast()
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false)
  const [isRead, setIsRead] = useState(communication.is_read_by_user)

  const handleMarkAsRead = async () => {
    if (isRead) return

    setIsMarkingAsRead(true)
    try {
      await communicationsAPI.markAsRead(communication.id)
      setIsRead(true)
      toast({
        title: "Marcado como leído",
        description: "El comunicado ha sido marcado como leído.",
      })
      onMarkAsRead?.()
    } catch (error) {
      console.error("Error marking as read:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al marcar como leído. Intente nuevamente.",
      })
    } finally {
      setIsMarkingAsRead(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const typeConfig = getCommunicationTypeConfig(communication.communication_type)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl font-semibold">{communication.title}</CardTitle>
            {!isRead && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Nuevo
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Badges and Priority */}
          <div className="flex items-center gap-3">
            <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
            <span className="text-lg">{getPriorityIcon(communication.priority)}</span>
            <span className="text-sm text-muted-foreground capitalize">{communication.priority} prioridad</span>
          </div>

          {/* Message Content */}
          <div className="prose prose-sm max-w-none">
            <p className="text-foreground whitespace-pre-wrap">{communication.message}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Publicado</p>
                <p className="text-muted-foreground">{formatDate(communication.published_at)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Dirigido a</p>
                <p className="text-muted-foreground">{getTargetAudienceLabel(communication.target_audience)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Lecturas</p>
                <p className="text-muted-foreground">{communication.read_count} personas</p>
              </div>
            </div>

            {communication.author_name && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {communication.author_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">Autor</p>
                  <p className="text-muted-foreground">{communication.author_name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Expiration Date */}
          {communication.expires_at && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Expira:</strong> {formatDate(communication.expires_at)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cerrar
            </Button>
            {!isRead && (
              <Button onClick={handleMarkAsRead} disabled={isMarkingAsRead} className="flex-1">
                {isMarkingAsRead ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Marcando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar como Leído
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
