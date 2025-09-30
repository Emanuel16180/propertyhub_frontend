"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VisitorForm } from "@/components/visitor-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Clock, User, Car, LogOut, Eye, Loader2 } from "lucide-react"
import { visitorService, type VisitorLog } from "@/services/visitorService"

export default function DashboardVisitantesPage() {
  const [visitors, setVisitors] = useState<VisitorLog[]>([])
  const [filteredVisitors, setFilteredVisitors] = useState<VisitorLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkingOutVisitorId, setCheckingOutVisitorId] = useState<number | null>(null)

  useEffect(() => {
    loadVisitors()
  }, [])

  useEffect(() => {
    filterVisitors()
  }, [visitors, searchQuery, statusFilter])

  const loadVisitors = async () => {
    setIsLoading(true)
    setError(null)

    const response = await visitorService.getAllVisitors(true)

    if (response.success && response.data) {
      setVisitors(response.data)
      console.log("[v0] Visitors data:", response.data)
      console.log(
        "[v0] Active visitors:",
        response.data.filter((v) => v.is_active),
      )
      console.log(
        "[v0] Visitors with vehicles:",
        response.data.filter((v) => v.vehicle),
      )
      console.log(
        "[v0] Active visitors with vehicles:",
        response.data.filter((v) => v.vehicle && v.is_active),
      )
    } else {
      setError(response.error || "Error al cargar visitantes")
    }

    setIsLoading(false)
  }

  const filterVisitors = () => {
    let filtered = visitors

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (visitor) =>
          visitor.full_name.toLowerCase().includes(query) ||
          visitor.document_id?.toLowerCase().includes(query) ||
          visitor.property_details?.identifier.toLowerCase().includes(query) ||
          visitor.common_area_details?.name.toLowerCase().includes(query) ||
          visitor.vehicle?.license_plate.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((visitor) => visitor.is_active)
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((visitor) => !visitor.is_active)
    }

    setFilteredVisitors(filtered)
  }

  const handleVisitorSuccess = () => {
    setShowForm(false)
    loadVisitors()
  }

  const handleVisitorExit = async (visitorId: number) => {
    if (checkingOutVisitorId === visitorId) {
      return
    }

    setCheckingOutVisitorId(visitorId)
    const response = await visitorService.checkOut(visitorId)

    if (response.success) {
      await loadVisitors()
    } else {
      alert(response.error || "Error al registrar salida")
    }

    setCheckingOutVisitorId(null)
  }

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      visita_familiar: "Visita Familiar",
      delivery: "Delivery",
      servicio_tecnico: "Servicio Técnico",
      proveedor: "Proveedor",
      otro: "Otro",
    }
    return reasonMap[reason] || reason
  }

  const getVehicleTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      light: "Liviano",
      motorcycle: "Motocicleta",
      heavy: "Pesado",
    }
    return typeMap[type] || type
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES")
  }

  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Control de Visitantes</h1>
              <p className="text-muted-foreground">Registrar y gestionar el acceso de visitantes al condominio</p>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Visitante
            </Button>
          </div>

          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, cédula, casa, placa..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los visitantes</SelectItem>
                <SelectItem value="active">Visitantes dentro</SelectItem>
                <SelectItem value="inactive">Visitantes que salieron</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Visitantes Dentro</p>
                    <p className="text-2xl font-bold">{visitors.filter((v) => v.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Visitas Hoy</p>
                    <p className="text-2xl font-bold">{visitors.filter((v) => isToday(v.check_in_time)).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Con Vehículo</p>
                    <p className="text-2xl font-bold">{visitors.filter((v) => v.vehicle && v.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visitors List */}
          <div className="space-y-4">
            {filteredVisitors.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay visitantes</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "No se encontraron visitantes con esos criterios" : "No hay visitantes registrados"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredVisitors.map((visitor) => (
                <Card key={visitor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{visitor.full_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Cédula: {visitor.document_id || "No especificada"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {visitor.destination_display ||
                              (visitor.property_details
                                ? `Casa ${visitor.property_details.identifier} - ${visitor.property_details.owner_name}`
                                : visitor.common_area_details
                                  ? `Área Común: ${visitor.common_area_details.name}`
                                  : "Destino no especificado")}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getReasonLabel(visitor.reason)}
                            </Badge>
                            {visitor.vehicle && (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                {visitor.vehicle.license_plate}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm font-medium">Entrada</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(visitor.check_in_time)}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(visitor.check_in_time)}</p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-medium">Salida</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {visitor.check_out_time ? formatTime(visitor.check_out_time) : "-"}
                          </p>
                          {visitor.check_out_time && (
                            <p className="text-xs text-muted-foreground">{formatDate(visitor.check_out_time)}</p>
                          )}
                        </div>

                        <div className="text-center">
                          <Badge
                            variant={visitor.is_active ? "default" : "secondary"}
                            className={visitor.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {visitor.is_active ? "Dentro" : "Salió"}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedVisitor(visitor)}>
                            <Eye className="w-4 h-4" />
                          </Button>

                          {visitor.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVisitorExit(visitor.id)}
                              disabled={checkingOutVisitorId === visitor.id}
                            >
                              {checkingOutVisitorId === visitor.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <LogOut className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {visitor.vehicle && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">Vehículo:</span>
                          <span>{visitor.vehicle.license_plate}</span>
                          <span>•</span>
                          <span>{visitor.vehicle.color}</span>
                          <span>•</span>
                          <span>{visitor.vehicle.model}</span>
                          <span>•</span>
                          <span>{getVehicleTypeLabel(visitor.vehicle.vehicle_type)}</span>
                        </div>
                      </div>
                    )}

                    {visitor.observations && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Observaciones:</strong> {visitor.observations}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Visitor Form Modal */}
        {showForm && <VisitorForm onClose={() => setShowForm(false)} onSuccess={handleVisitorSuccess} />}

        {/* Visitor Details Modal */}
        {selectedVisitor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Detalles del Visitante</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedVisitor(null)}>
                    ×
                  </Button>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Nombre:</strong> {selectedVisitor.full_name}
                  </div>
                  <div>
                    <strong>Cédula:</strong> {selectedVisitor.document_id || "No especificada"}
                  </div>
                  <div>
                    <strong>Destino:</strong>{" "}
                    {selectedVisitor.destination_display ||
                      (selectedVisitor.property_details
                        ? `Casa ${selectedVisitor.property_details.identifier} - ${selectedVisitor.property_details.owner_name}`
                        : selectedVisitor.common_area_details
                          ? `Área Común: ${selectedVisitor.common_area_details.name}`
                          : "No especificado")}
                  </div>
                  <div>
                    <strong>Motivo:</strong> {getReasonLabel(selectedVisitor.reason)}
                  </div>
                  <div>
                    <strong>Entrada:</strong> {formatTime(selectedVisitor.check_in_time)} -{" "}
                    {formatDate(selectedVisitor.check_in_time)}
                  </div>
                  <div>
                    <strong>Salida:</strong>{" "}
                    {selectedVisitor.check_out_time
                      ? `${formatTime(selectedVisitor.check_out_time)} - ${formatDate(selectedVisitor.check_out_time)}`
                      : "Aún dentro"}
                  </div>

                  {selectedVisitor.vehicle && (
                    <div className="pt-2 border-t">
                      <strong>Información del Vehículo:</strong>
                      <div className="ml-4 mt-1 space-y-1">
                        <div>Placa: {selectedVisitor.vehicle.license_plate}</div>
                        <div>Color: {selectedVisitor.vehicle.color}</div>
                        <div>Modelo: {selectedVisitor.vehicle.model}</div>
                        <div>Tipo: {getVehicleTypeLabel(selectedVisitor.vehicle.vehicle_type)}</div>
                      </div>
                    </div>
                  )}

                  {selectedVisitor.observations && (
                    <div className="pt-2 border-t">
                      <strong>Observaciones:</strong>
                      <div className="mt-1">{selectedVisitor.observations}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
