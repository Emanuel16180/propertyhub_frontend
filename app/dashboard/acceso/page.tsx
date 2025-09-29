"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FaceRecognition } from "@/components/face-recognition"

export default function DashboardAccesoPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Control de Acceso</h1>
            <p className="text-muted-foreground">Sistema de reconocimiento facial para autorizar el ingreso</p>
          </div>

          <FaceRecognition />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
