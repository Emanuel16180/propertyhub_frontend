"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Search, Building, User, Mail, Phone, Calendar, Home, Loader2 } from "lucide-react"
import { residentService, type ApiResident } from "@/services/residentService"

interface ResidentsListProps {
  onEditResident?: (resident: ApiResident) => void
}

export function ResidentsList({ onEditResident }: ResidentsListProps) {
  const [residents, setResidents] = useState<ApiResident[]>([])
  const [filteredResidents, setFilteredResidents] = useState<ApiResident[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadResidents = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Loading residents...")

      const response = await residentService.getResidents()
      console.log("[v0] Service response:", response)

      if (response.success && response.data) {
        console.log("[v0] Setting residents data:", response.data)
        const residentsArray = Array.isArray(response.data) ? response.data : []
        setResidents(residentsArray)
        setFilteredResidents(residentsArray)
      } else {
        console.error("[v0] Failed to load residents:", response.error)
        setError(response.error || "Error al cargar residentes")
        setResidents([])
        setFilteredResidents([])
      }
    } catch (error) {
      console.error("[v0] Error loading residents:", error)
      setError("Error de conexión al cargar residentes")
      setResidents([])
      setFilteredResidents([])
    } finally {
      setLoading(false)
    }
  }

  const toggleResidentStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = currentStatus
        ? await residentService.deactivateResident(id)
        : await residentService.activateResident(id)

      if (response.success) {
        // Reload residents to get updated data
        await loadResidents()
      } else {
        setError(response.error || "Error al actualizar estado del residente")
      }
    } catch (error) {
      console.error("Error updating resident status:", error)
      setError("Error de conexión al actualizar residente")
    }
  }

  useEffect(() => {
    loadResidents()
  }, [])

  useEffect(() => {
    if (!Array.isArray(residents)) {
      console.warn("[v0] Residents is not an array:", residents)
      setFilteredResidents([])
      return
    }

    const filtered = residents.filter(
      (resident) =>
        `${resident.first_name} ${resident.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.profile.resident_info.house_identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resident.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    console.log("[v0] Filtered residents:", filtered.length)
    setFilteredResidents(filtered)
  }, [searchTerm, residents])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Cargando residentes...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadResidents} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Residentes Registrados
          </CardTitle>
          <CardDescription>Lista de todos los propietarios y familiares registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, apartamento o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3">
              {!Array.isArray(filteredResidents) || filteredResidents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchTerm ? "No se encontraron residentes" : "No hay residentes registrados"}
                  </p>
                </div>
              ) : (
                filteredResidents.map((resident) => (
                  <Card key={resident.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                          {resident.profile.resident_info.face_photo ? (
                            <img
                              src={resident.profile.resident_info.face_photo || "/placeholder.svg"}
                              alt={`${resident.first_name} ${resident.last_name}`}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-7 h-7 text-muted-foreground" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base">
                              {resident.first_name} {resident.last_name}
                            </h3>
                            <Badge
                              variant={
                                resident.profile.resident_info.resident_type === "owner" ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {resident.profile.resident_info.resident_type === "owner"
                                ? "propietario"
                                : resident.profile.resident_info.resident_type === "tenant"
                                  ? "inquilino"
                                  : "familiar"}
                            </Badge>
                            <Badge
                              variant={resident.is_active ? "default" : "destructive"}
                              className="text-xs bg-green-600 hover:bg-green-700"
                            >
                              {resident.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              <span className="font-medium">{resident.profile.resident_info.house_identifier}</span>
                            </div>
                            <span>
                              Edad:{" "}
                              {new Date().getFullYear() -
                                new Date(resident.profile.resident_info.birth_date).getFullYear()}
                            </span>
                            <span className="truncate max-w-[200px]">{resident.email}</span>
                          </div>

                          {resident.profile.phone && (
                            <p className="text-sm text-muted-foreground">Tel: {resident.profile.phone}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs bg-transparent">
                              Ver Detalles
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Detalles del Residente
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex items-center gap-4 pb-4 border-b">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                  {resident.profile.resident_info.face_photo ? (
                                    <img
                                      src={resident.profile.resident_info.face_photo || "/placeholder.svg"}
                                      alt={`${resident.first_name} ${resident.last_name}`}
                                      className="w-16 h-16 rounded-full object-cover"
                                    />
                                  ) : (
                                    <Users className="w-8 h-8 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {resident.first_name} {resident.last_name}
                                  </h3>
                                  <div className="flex gap-2 mt-1">
                                    <Badge
                                      variant={
                                        resident.profile.resident_info.resident_type === "owner"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {resident.profile.resident_info.resident_type === "owner"
                                        ? "Propietario"
                                        : resident.profile.resident_info.resident_type === "tenant"
                                          ? "Inquilino"
                                          : "Familiar"}
                                    </Badge>
                                    <Badge variant={resident.is_active ? "default" : "destructive"}>
                                      {resident.is_active ? "Activo" : "Inactivo"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Home className="w-4 h-4" />
                                    Casa
                                  </label>
                                  <p className="text-sm font-semibold">
                                    {resident.profile.resident_info.house_identifier}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Edad
                                  </label>
                                  <p className="text-sm font-semibold">
                                    {new Date().getFullYear() -
                                      new Date(resident.profile.resident_info.birth_date).getFullYear()}{" "}
                                    años
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  Email
                                </label>
                                <p className="text-sm font-semibold">{resident.email}</p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  Teléfono
                                </label>
                                <p className="text-sm font-semibold">{resident.profile.phone || "No registrado"}</p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Documento</label>
                                <p className="text-sm font-semibold">
                                  {resident.profile.resident_info.document_number}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                  Contacto de Emergencia
                                </label>
                                <p className="text-sm font-semibold">
                                  {resident.profile.resident_info.emergency_contact}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Fecha de Registro</label>
                                <p className="text-sm font-semibold">
                                  {new Date(resident.date_joined).toLocaleDateString("es-ES", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs bg-transparent"
                          onClick={() => {
                            if (onEditResident) {
                              onEditResident(resident)
                            }
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs"
                          onClick={() => toggleResidentStatus(resident.id, resident.is_active)}
                        >
                          {resident.is_active ? "Desactivar" : "Activar"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
