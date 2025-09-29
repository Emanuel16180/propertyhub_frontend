"use client"

import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ResidentsList } from "@/components/residents-list"
import { ResidentForm } from "@/components/resident-form"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { ApiResident } from "@/services/residentService"

export default function DashboardResidentesPage() {
  const searchParams = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [editingResident, setEditingResident] = useState<ApiResident | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "nuevo") {
      setShowForm(true)
    }
  }, [searchParams])

  const handleEditResident = (resident: ApiResident) => {
    setEditingResident(resident)
    setShowForm(true)
  }

  const handleNewResident = () => {
    setEditingResident(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingResident(null)
  }

  const handleResidentSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Registro de Residentes</h1>
              <p className="text-muted-foreground">Administrar propietarios y familiares del condominio</p>
            </div>
            <Button onClick={showForm ? handleCloseForm : handleNewResident} className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              {showForm ? "Ver Lista" : "Nuevo Residente"}
            </Button>
          </div>

          {showForm ? (
            <ResidentForm
              editingResident={editingResident}
              onClose={handleCloseForm}
              onSuccess={handleResidentSuccess}
            />
          ) : (
            <ResidentsList key={refreshKey} onEditResident={handleEditResident} />
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
