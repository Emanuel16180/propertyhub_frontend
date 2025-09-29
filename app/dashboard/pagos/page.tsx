"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PaymentForm } from "@/components/payment-form"
import { LocalStorageDB, type PaymentTransaction } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"

export default function DashboardPagosPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentTransaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "cobro" | "pago">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "pendiente" | "pagado" | "vencido">("all")
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, filterType, filterStatus])

  const loadPayments = () => {
    const allPayments = LocalStorageDB.getPayments()
    setPayments(allPayments)
  }

  const filterPayments = () => {
    let filtered = payments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (payment.house_number && payment.house_number.includes(searchTerm)) ||
          (payment.description && payment.description.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((payment) => payment.type === filterType)
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((payment) => payment.status === filterStatus)
    }

    setFilteredPayments(filtered)
  }

  const handlePaymentAdded = () => {
    loadPayments()
    setIsFormOpen(false)
  }

  const handleStatusChange = (paymentId: string, newStatus: "pendiente" | "pagado" | "vencido") => {
    LocalStorageDB.updatePaymentStatus(paymentId, newStatus)
    loadPayments()
    toast({
      title: "Estado actualizado",
      description: `El estado del pago ha sido actualizado a ${newStatus}`,
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pagado":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "pendiente":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "vencido":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pagado":
        return "bg-green-100 text-green-800"
      case "pendiente":
        return "bg-yellow-100 text-yellow-800"
      case "vencido":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalCobros = LocalStorageDB.getTotalCobros()
  const totalPagos = LocalStorageDB.getTotalPagos()
  const pendingCobros = LocalStorageDB.getPendingCobros()
  const balance = totalCobros - totalPagos

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Recaudación y Pagos</h1>
              <p className="text-muted-foreground">Administrar cobros y pagos del condominio</p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Movimiento</DialogTitle>
                </DialogHeader>
                <PaymentForm onPaymentAdded={handlePaymentAdded} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cobros</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${totalCobros.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Ingresos esperados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">${totalPagos.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Gastos realizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                <DollarSign className={`h-4 w-4 ${balance >= 0 ? "text-green-600" : "text-red-600"}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${balance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Diferencia neta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cobros Pendientes</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingCobros.length}</div>
                <p className="text-xs text-muted-foreground">Por cobrar</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por concepto, casa, categoría..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="cobro">Cobros</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments List */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
              <CardDescription>
                Últimos cobros y pagos registrados ({filteredPayments.length} de {payments.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No se encontraron movimientos</div>
                ) : (
                  filteredPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            payment.type === "cobro" ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {payment.type === "cobro" ? (
                            <Receipt
                              className={`w-5 h-5 ${payment.type === "cobro" ? "text-green-600" : "text-red-600"}`}
                            />
                          ) : (
                            <CreditCard className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {payment.concept}
                            {payment.house_number && ` - Casa ${payment.house_number}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.category} • {new Date(payment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-medium ${payment.type === "cobro" ? "text-green-600" : "text-red-600"}`}>
                            {payment.type === "cobro" ? "+" : "-"}${payment.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">{payment.type === "cobro" ? "Cobro" : "Pago"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}
                          >
                            {getStatusIcon(payment.status)}
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalles del {payment.type === "cobro" ? "Cobro" : "Pago"}</DialogTitle>
                              </DialogHeader>
                              {selectedPayment && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                                      <p className="font-medium">
                                        {selectedPayment.type === "cobro" ? "Cobro" : "Pago"}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">Monto</Label>
                                      <p
                                        className={`font-medium ${
                                          selectedPayment.type === "cobro" ? "text-green-600" : "text-red-600"
                                        }`}
                                      >
                                        ${selectedPayment.amount.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Concepto</Label>
                                    <p className="font-medium">{selectedPayment.concept}</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">Categoría</Label>
                                      <p>{selectedPayment.category}</p>
                                    </div>
                                    {selectedPayment.house_number && (
                                      <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Casa</Label>
                                        <p>{selectedPayment.house_number}</p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
                                      <p>{new Date(selectedPayment.date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(selectedPayment.status)}`}
                                        >
                                          {getStatusIcon(selectedPayment.status)}
                                          {selectedPayment.status.charAt(0).toUpperCase() +
                                            selectedPayment.status.slice(1)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {selectedPayment.due_date && (
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">
                                        Fecha de Vencimiento
                                      </Label>
                                      <p>{new Date(selectedPayment.due_date).toLocaleDateString()}</p>
                                    </div>
                                  )}

                                  {selectedPayment.description && (
                                    <div>
                                      <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                                      <p className="text-sm">{selectedPayment.description}</p>
                                    </div>
                                  )}

                                  {selectedPayment.type === "cobro" && selectedPayment.status !== "pagado" && (
                                    <div className="flex gap-2 pt-4 border-t">
                                      <Button
                                        size="sm"
                                        onClick={() => handleStatusChange(selectedPayment.id, "pagado")}
                                        className="flex-1"
                                      >
                                        Marcar como Pagado
                                      </Button>
                                      {selectedPayment.status !== "vencido" && (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleStatusChange(selectedPayment.id, "vencido")}
                                          className="flex-1"
                                        >
                                          Marcar como Vencido
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
