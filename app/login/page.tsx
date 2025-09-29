"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff, ExternalLink, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/services/authService"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [showLocaltunnelHelp, setShowLocaltunnelHelp] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const result = await authService.testConnection()
      if (result.success) {
        toast({
          title: "Conexión exitosa",
          description: result.message || "El servidor está disponible",
        })
        setShowLocaltunnelHelp(false)
      } else {
        if (result.error === "localtunnel_authorization_required") {
          toast({
            title: "Autorización de localtunnel requerida",
            description: "Debes autorizar el dominio localtunnel. Haz clic en 'Abrir Servidor'.",
            variant: "destructive",
          })
        } else if (result.error === "localtunnel_connection_failed") {
          toast({
            title: "Error de conexión",
            description: "No se puede conectar con localtunnel. Verifica que esté ejecutándose.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error de conexión",
            description: result.error,
            variant: "destructive",
          })
        }
        setShowLocaltunnelHelp(true)
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo probar la conexión",
        variant: "destructive",
      })
      setShowLocaltunnelHelp(true)
    }
    setIsTestingConnection(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await authService.login({ username, password })

      if (result.success && result.data) {
        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido ${result.data.user.firstName} ${result.data.user.lastName}`,
        })

        router.push("/dashboard")
      } else {
        const errorMessage = result.error || "Usuario o contraseña incorrectos"

        if (errorMessage === "localtunnel_authorization_required") {
          toast({
            title: "Autorización de localtunnel requerida",
            description:
              "Debes autorizar el dominio localtunnel primero. Haz clic en 'Abrir Servidor' y autoriza el sitio.",
            variant: "destructive",
          })
          setShowLocaltunnelHelp(true)
        } else if (errorMessage === "localtunnel_connection_failed") {
          toast({
            title: "Error de conexión con localtunnel",
            description: "No se puede conectar con el servidor. Verifica que localtunnel esté ejecutándose.",
            variant: "destructive",
          })
          setShowLocaltunnelHelp(true)
        } else {
          toast({
            title: "Error de autenticación",
            description: errorMessage,
            variant: "destructive",
          })

          // Show localtunnel help if it's a connection error
          if (errorMessage.includes("localtunnel") || errorMessage.includes("conectar")) {
            setShowLocaltunnelHelp(true)
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive",
      })
      setShowLocaltunnelHelp(true)
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">PropertyHub</CardTitle>
          <CardDescription>Ingrese sus credenciales para acceder al sistema de administración</CardDescription>
        </CardHeader>
        <CardContent>
          {showLocaltunnelHelp && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Problema de conexión con localtunnel</p>
                  <p className="text-sm">Para resolver este problema:</p>
                  <ol className="text-sm list-decimal list-inside space-y-1">
                    <li>Haz clic en el botón "Abrir servidor" abajo</li>
                    <li>En la página que se abre, ingresa la contraseña del túnel si te la pide</li>
                    <li>Autoriza el dominio localtunnel cuando te lo solicite</li>
                    <li>Regresa aquí e intenta hacer login nuevamente</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    Nota: localtunnel requiere autorización del navegador para permitir requests desde aplicaciones web.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={testConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection ? "Probando..." : "Probar Conexión"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
                onClick={() => window.open("https://yellow-impalas-play.loca.lt/api/auth/login/", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir Servidor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
