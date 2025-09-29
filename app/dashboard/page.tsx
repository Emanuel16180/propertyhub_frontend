"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Home, Calendar, UserCheck, Shield } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
            <p className="text-muted-foreground">Bienvenido al sistema de administración PropertyHub</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Residentes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245</div>
                <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Casas Registradas</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">+3 nuevas este mes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accesos Hoy</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">+8% vs ayer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sistema</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Activo</div>
                <p className="text-xs text-muted-foreground">Funcionando correctamente</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Accesos Rápidos</CardTitle>
              <CardDescription>Funciones más utilizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/residentes?tab=nuevo">
                  <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm font-medium">Nuevo Residente</span>
                  </div>
                </Link>
                <Link href="/dashboard/acceso">
                  <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm font-medium">Control Acceso</span>
                  </div>
                </Link>
                <Link href="/dashboard/reservas">
                  <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <Calendar className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm font-medium">Reservaciones</span>
                  </div>
                </Link>
                <Link href="/dashboard/visitantes?action=nuevo">
                  <div className="flex flex-col items-center p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <UserCheck className="h-8 w-8 text-primary mb-2" />
                    <span className="text-sm font-medium">Nuevo Visitante</span>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
