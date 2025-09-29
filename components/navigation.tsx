"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, UserPlus, Users, Camera, Home } from "lucide-react"

const navigationItems = [
  {
    href: "/",
    label: "Inicio",
    icon: Home,
    description: "Panel principal del sistema",
  },
  {
    href: "/registro",
    label: "Registro",
    icon: UserPlus,
    description: "Registrar nuevos residentes",
  },
  {
    href: "/reconocimiento",
    label: "Reconocimiento",
    icon: Camera,
    description: "Control de acceso facial",
  },
  {
    href: "/residentes",
    label: "Residentes",
    icon: Users,
    description: "Gestionar residentes",
  },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="w-full bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">Sistema Condominio</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Button key={item.href} asChild variant={isActive ? "default" : "ghost"} size="sm">
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-2">
      <div className="grid grid-cols-4 gap-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Button
              key={item.href}
              asChild
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className="flex flex-col h-auto py-2"
            >
              <Link href={item.href}>
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
