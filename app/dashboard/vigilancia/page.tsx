"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SurveillanceRecognition } from "@/components/surveillance-recognition"

export default function DashboardVigilanciaPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vigilancia</h1>
            <p className="text-muted-foreground">Sistema de detección de intrusos mediante reconocimiento facial</p>
          </div>

          <SurveillanceRecognition />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
