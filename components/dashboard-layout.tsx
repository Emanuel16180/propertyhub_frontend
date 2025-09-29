"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Users,
  Car,
  Building,
  CreditCard,
  Calendar,
  UserCheck,
  Shield,
  Menu,
  LogOut,
  Settings,
  TreePine,
  Megaphone,
  Eye,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/services/authService"

const sidebarItems = [
  {
    title: "REGISTROS",
    items: [
      {
        title: "Casas",
        href: "/dashboard/casas",
        icon: Building,
      },
      {
        title: "Residentes",
        href: "/dashboard/residentes",
        icon: Users,
      },
      {
        title: "Autos",
        href: "/dashboard/autos",
        icon: Car,
      },
      {
        title: "Áreas Comunes",
        href: "/dashboard/areas-comunes",
        icon: TreePine,
      },
    ],
  },
  {
    title: "FINANZAS",
    items: [
      {
        title: "Recaudación y Pagos",
        href: "/dashboard/pagos",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "OPERACIONES",
    items: [
      {
        title: "Comunicados",
        href: "/dashboard/comunicados",
        icon: Megaphone,
      },
      {
        title: "Reservaciones",
        href: "/dashboard/reservas",
        icon: Calendar,
      },
      {
        title: "Control de Visitantes",
        href: "/dashboard/visitantes",
        icon: UserCheck,
      },
      {
        title: "Control de Acceso",
        href: "/dashboard/acceso",
        icon: Shield,
      },
    ],
  },
  {
    title: "SEGURIDAD",
    items: [
      {
        title: "Vigilancia",
        href: "/dashboard/vigilancia",
        icon: Eye,
      },
    ],
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      const result = await authService.logout()

      if (result.success) {
        toast({
          title: "Sesión cerrada",
          description: "Ha cerrado sesión exitosamente",
        })
      } else {
        toast({
          title: "Sesión cerrada",
          description: "Sesión cerrada localmente",
        })
      }
    } catch (error) {
      toast({
        title: "Sesión cerrada",
        description: "Sesión cerrada localmente",
      })
    }

    router.push("/login")
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-lg">PropertyHub</h2>
          <p className="text-sm text-muted-foreground">Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-6">
          {sidebarItems.map((section) => (
            <div key={section.title}>
              <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start h-auto py-2 px-2"
                    >
                      <Link href={item.href} onClick={() => setSidebarOpen(false)}>
                        <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <Settings className="w-4 h-4 mr-3" />
          Configuración
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-card border-r">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Top Bar */}
        <header className="bg-card border-b px-4 py-3 flex items-center justify-between lg:justify-end">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
