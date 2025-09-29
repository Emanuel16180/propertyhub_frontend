"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wrench, Plus, Search, Filter, Clock, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function DashboardOrdenesPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Órdenes de Trabajo</h1>
              <p className="text-muted-foreground">Gestionar solicitudes de mantenimiento y reparaciones</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Orden
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Órdenes por atender</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Trabajos en curso</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Buscar por descripción, área, solicitante..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Work Orders List */}
          <div className="space-y-4">
            {[
              {
                id: "ORD-001",
                title: "Reparación de tubería",
                area: "Área común",
                requestedBy: "Administración",
                priority: "Urgente",
                status: "Pendiente",
                date: "2024-01-15",
              },
              {
                id: "ORD-002",
                title: "Mantenimiento ascensor",
                area: "Torre A",
                requestedBy: "María González",
                priority: "Alta",
                status: "En Proceso",
                date: "2024-01-14",
              },
              {
                id: "ORD-003",
                title: "Limpieza de piscina",
                area: "Área recreativa",
                requestedBy: "Administración",
                priority: "Media",
                status: "Pendiente",
                date: "2024-01-13",
              },
              {
                id: "ORD-004",
                title: "Reparación de portón",
                area: "Entrada principal",
                requestedBy: "Carlos Ruiz",
                priority: "Urgente",
                status: "En Proceso",
                date: "2024-01-12",
              },
              {
                id: "ORD-005",
                title: "Cambio de bombillas",
                area: "Estacionamiento",
                requestedBy: "Ana López",
                priority: "Baja",
                status: "Completada",
                date: "2024-01-10",
              },
            ].map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{order.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          #{order.id} - {order.area}
                        </p>
                        <p className="text-sm text-muted-foreground">Solicitado por: {order.requestedBy}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">Prioridad</p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.priority === "Urgente"
                              ? "bg-red-100 text-red-800"
                              : order.priority === "Alta"
                                ? "bg-orange-100 text-orange-800"
                                : order.priority === "Media"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.priority}
                        </span>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium">Estado</p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === "Completada"
                              ? "bg-green-100 text-green-800"
                              : order.status === "En Proceso"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium">Fecha</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                      </div>

                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
