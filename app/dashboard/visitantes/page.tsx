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
import { Plus, Search, Clock, User, Car, LogOut, Eye } from "lucide-react"
import { LocalStorageDB, type Visitor } from "@/lib/local-storage"

export default function DashboardVisitantesPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "dentro" | "salio">("all")
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)

  useEffect(() => {
    loadVisitors()
  }, [])

  useEffect(() => {
    filterVisitors()
  }, [visitors, searchQuery, statusFilter])

  const loadVisitors = () => {
    const allVisitors = LocalStorageDB.getVisitors()
    setVisitors(allVisitors)
  }

  const filterVisitors = () => {
    let filtered = visitors

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = LocalStorageDB.searchVisitors(searchQuery)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((visitor) => visitor.status === statusFilter)
    }

    setFilteredVisitors(filtered)
  }

  const handleVisitorSuccess = (visitor: Visitor) => {
    setShowForm(false)
    loadVisitors()
  }

  const handleVisitorExit = (visitorId: string) => {
    LocalStorageDB.updateVisitorExit(visitorId)
    loadVisitors()
  }

  const getVisitPurposeLabel = (purpose: string) => {
    const purposes = LocalStorageDB.getVisitPurposes()
    return purposes.find((p) => p.value === purpose)?.label || purpose
  }

  const getVehicleTypeLabel = (type: string) => {
    const types = LocalStorageDB.getVehicleTypes()
    return types.find((t) => t.value === type)?.label || type
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
                <SelectItem value="dentro">Visitantes dentro</SelectItem>
                <SelectItem value="salio">Visitantes que salieron</SelectItem>
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
                    <p className="text-2xl font-bold">{visitors.filter((v) => v.status === "dentro").length}</p>
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
                    <p className="text-2xl font-bold">
                      {visitors.filter((v) => v.created_at.startsWith(new Date().toISOString().split("T")[0])).length}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {visitors.filter((v) => v.vehicle?.has_vehicle && v.status === "dentro").length}
                    </p>
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
                          <h3 className="font-semibold">{visitor.name}</h3>
                          <p className="text-sm text-muted-foreground">Cédula: {visitor.id_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Casa {visitor.house_number} - {visitor.host_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getVisitPurposeLabel(visitor.visit_purpose)}
                            </Badge>
                            {visitor.vehicle?.has_vehicle && (
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
                            {visitor.entry_time}
                          </p>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-medium">Salida</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {visitor.exit_time || "-"}
                          </p>
                        </div>

                        <div className="text-center">
                          <Badge
                            variant={visitor.status === "dentro" ? "default" : "secondary"}
                            className={
                              visitor.status === "dentro" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }
                          >
                            {visitor.status === "dentro" ? "Dentro" : "Salió"}
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedVisitor(visitor)}>
                            <Eye className="w-4 h-4" />
                          </Button>

                          {visitor.status === "dentro" && (
                            <Button variant="outline" size="sm" onClick={() => handleVisitorExit(visitor.id)}>
                              <LogOut className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {visitor.vehicle?.has_vehicle && (
                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium">Vehículo:</span>
                          <span>{visitor.vehicle.license_plate}</span>
                          <span>•</span>
                          <span>{visitor.vehicle.color}</span>
                          <span>•</span>
                          <span>{visitor.vehicle.model}</span>
                          <span>•</span>
                          <span>{getVehicleTypeLabel(visitor.vehicle.type || "")}</span>
                        </div>
                      </div>
                    )}

                    {visitor.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Observaciones:</strong> {visitor.notes}
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
                    <strong>Nombre:</strong> {selectedVisitor.name}
                  </div>
                  <div>
                    <strong>Cédula:</strong> {selectedVisitor.id_number}
                  </div>
                  <div>
                    <strong>Casa:</strong> {selectedVisitor.house_number}
                  </div>
                  <div>
                    <strong>Anfitrión:</strong> {selectedVisitor.host_name}
                  </div>
                  <div>
                    <strong>Motivo:</strong> {getVisitPurposeLabel(selectedVisitor.visit_purpose)}
                  </div>
                  <div>
                    <strong>Entrada:</strong> {selectedVisitor.entry_time}
                  </div>
                  <div>
                    <strong>Salida:</strong> {selectedVisitor.exit_time || "Aún dentro"}
                  </div>

                  {selectedVisitor.vehicle?.has_vehicle && (
                    <div className="pt-2 border-t">
                      <strong>Información del Vehículo:</strong>
                      <div className="ml-4 mt-1 space-y-1">
                        <div>Placa: {selectedVisitor.vehicle.license_plate}</div>
                        <div>Color: {selectedVisitor.vehicle.color}</div>
                        <div>Modelo: {selectedVisitor.vehicle.model}</div>
                        <div>Tipo: {getVehicleTypeLabel(selectedVisitor.vehicle.type || "")}</div>
                      </div>
                    </div>
                  )}

                  {selectedVisitor.notes && (
                    <div className="pt-2 border-t">
                      <strong>Observaciones:</strong>
                      <div className="mt-1">{selectedVisitor.notes}</div>
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
