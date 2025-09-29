"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { LocalStorageDB } from "@/lib/local-storage"
import { useToast } from "@/hooks/use-toast"
import { DollarSign, Receipt, CreditCard, Calendar, Home, FileText, Building2 } from "lucide-react"

interface PaymentFormProps {
  onPaymentAdded?: () => void
}

export function PaymentForm({ onPaymentAdded }: PaymentFormProps) {
  const { toast } = useToast()

  // Form data for cobros (charges)
  const [cobroData, setCobroData] = useState({
    amount: "",
    concept: "",
    description: "",
    house_number: "",
    category: "",
    due_date: "",
  })

  const [applyToAllHouses, setApplyToAllHouses] = useState(false)

  // Form data for pagos (payments)
  const [pagoData, setPagoData] = useState({
    amount: "",
    concept: "",
    description: "",
    category: "",
  })

  const cobroCategories = [
    "Cuota de Mantenimiento",
    "Multa",
    "Expensas Extraordinarias",
    "Servicios Adicionales",
    "Otros",
  ]

  const pagoCategories = [
    "Mantenimiento",
    "Sueldos",
    "Servicios Públicos",
    "Seguridad",
    "Limpieza",
    "Reparaciones",
    "Otros",
  ]

  const handleCobroInputChange = (field: string, value: string) => {
    setCobroData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePagoInputChange = (field: string, value: string) => {
    setPagoData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCobroSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cobroData.amount || !cobroData.concept || !cobroData.category) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    if (!applyToAllHouses && !cobroData.house_number) {
      toast({
        title: "Error",
        description: "Por favor selecciona una casa o marca 'Aplicar a todas las casas'",
        variant: "destructive",
      })
      return
    }

    try {
      if (applyToAllHouses) {
        const allHouseNumbers = LocalStorageDB.getAllHouseNumbers()
        const payments = allHouseNumbers.map((houseNumber) => ({
          type: "cobro" as const,
          amount: Number.parseFloat(cobroData.amount),
          concept: cobroData.concept,
          description: cobroData.description,
          house_number: houseNumber,
          category: cobroData.category,
          date: new Date().toISOString(),
          status: "pendiente" as const,
          due_date: cobroData.due_date || undefined,
        }))

        LocalStorageDB.saveMultiplePayments(payments)

        toast({
          title: "Cobros registrados",
          description: `Cobro de $${cobroData.amount} registrado para ${allHouseNumbers.length} casas`,
        })
      } else {
        LocalStorageDB.savePayment({
          type: "cobro",
          amount: Number.parseFloat(cobroData.amount),
          concept: cobroData.concept,
          description: cobroData.description,
          house_number: cobroData.house_number,
          category: cobroData.category,
          date: new Date().toISOString(),
          status: "pendiente",
          due_date: cobroData.due_date || undefined,
        })

        toast({
          title: "Cobro registrado",
          description: `Cobro de $${cobroData.amount} registrado para la casa ${cobroData.house_number}`,
        })
      }

      // Clear form
      setCobroData({
        amount: "",
        concept: "",
        description: "",
        house_number: "",
        category: "",
        due_date: "",
      })
      setApplyToAllHouses(false)

      onPaymentAdded?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el cobro",
        variant: "destructive",
      })
    }
  }

  const handlePagoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pagoData.amount || !pagoData.concept || !pagoData.category) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      LocalStorageDB.savePayment({
        type: "pago",
        amount: Number.parseFloat(pagoData.amount),
        concept: pagoData.concept,
        description: pagoData.description,
        category: pagoData.category,
        date: new Date().toISOString(),
        status: "pagado", // Payments are immediately processed
      })

      toast({
        title: "Pago registrado",
        description: `Pago de $${pagoData.amount} registrado exitosamente`,
      })

      // Clear form
      setPagoData({
        amount: "",
        concept: "",
        description: "",
        category: "",
      })

      onPaymentAdded?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Recaudación y Pagos
        </CardTitle>
        <CardDescription>Registra cobros a residentes o pagos del condominio</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cobro" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cobro" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Nuevo Cobro
            </TabsTrigger>
            <TabsTrigger value="pago" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Nuevo Pago
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cobro" className="space-y-4">
            <form onSubmit={handleCobroSubmit} className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Checkbox
                  id="apply-all-houses"
                  checked={applyToAllHouses}
                  onCheckedChange={(checked) => setApplyToAllHouses(checked as boolean)}
                />
                <Label htmlFor="apply-all-houses" className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Aplicar a todas las casas
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!applyToAllHouses && (
                  <div className="space-y-2">
                    <Label htmlFor="cobro-house">Casa *</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="cobro-house"
                        placeholder="Ej: 101"
                        value={cobroData.house_number}
                        onChange={(e) => handleCobroInputChange("house_number", e.target.value)}
                        className="pl-10"
                        required={!applyToAllHouses}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cobro-amount">Monto *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="cobro-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cobroData.amount}
                      onChange={(e) => handleCobroInputChange("amount", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {applyToAllHouses && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-2">Este cobro se aplicará a todas las casas:</p>
                  <div className="flex flex-wrap gap-1">
                    {LocalStorageDB.getAllHouseNumbers().map((houseNumber) => (
                      <span
                        key={houseNumber}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        Casa {houseNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cobro-category">Categoría *</Label>
                <Select
                  value={cobroData.category}
                  onValueChange={(value) => handleCobroInputChange("category", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {cobroCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cobro-concept">Concepto *</Label>
                <Input
                  id="cobro-concept"
                  placeholder="Ej: Cuota de mantenimiento enero 2024"
                  value={cobroData.concept}
                  onChange={(e) => handleCobroInputChange("concept", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cobro-due-date">Fecha de Vencimiento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="cobro-due-date"
                    type="date"
                    value={cobroData.due_date}
                    onChange={(e) => handleCobroInputChange("due_date", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cobro-description">Descripción</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                  <Textarea
                    id="cobro-description"
                    placeholder="Detalles adicionales..."
                    value={cobroData.description}
                    onChange={(e) => handleCobroInputChange("description", e.target.value)}
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Receipt className="w-4 h-4 mr-2" />
                {applyToAllHouses ? "Registrar Cobro Masivo" : "Registrar Cobro"}
              </Button>
            </form>
          </TabsContent>

          {/* ... existing pago tab content ... */}
          <TabsContent value="pago" className="space-y-4">
            <form onSubmit={handlePagoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pago-amount">Monto *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="pago-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={pagoData.amount}
                      onChange={(e) => handlePagoInputChange("amount", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pago-category">Categoría *</Label>
                  <Select
                    value={pagoData.category}
                    onValueChange={(value) => handlePagoInputChange("category", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {pagoCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pago-concept">Concepto *</Label>
                <Input
                  id="pago-concept"
                  placeholder="Ej: Sueldo conserje enero 2024"
                  value={pagoData.concept}
                  onChange={(e) => handlePagoInputChange("concept", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pago-description">Descripción</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                  <Textarea
                    id="pago-description"
                    placeholder="Detalles adicionales..."
                    value={pagoData.description}
                    onChange={(e) => handlePagoInputChange("description", e.target.value)}
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Registrar Pago
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
