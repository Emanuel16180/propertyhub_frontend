export interface Resident {
  id: string
  name: string
  type: "propietario" | "familiar"
  age: number
  email: string
  phone?: string
  apartment_number: string
  face_encoding: string
  face_image_url: string
  is_active: boolean
  created_at: string
}

export interface AccessLog {
  id: string
  resident_id?: string
  access_time: string
  access_type: string
  confidence_score: number
  status: "granted" | "denied"
  notes: string
  resident?: {
    name: string
    apartment_number: string
    type: string
  }
}

export interface PaymentTransaction {
  id: string
  type: "cobro" | "pago" // cobro = charge to residents, pago = payment from funds
  amount: number
  concept: string
  description?: string
  house_number?: string // For cobros (charges to specific houses)
  category: string // For categorizing different types of payments
  date: string
  status: "pendiente" | "pagado" | "vencido" // For cobros
  created_at: string
  due_date?: string // For cobros
}

export interface House {
  number: string
  owner: string
  status: string
  residents: number
}

export interface Reservation {
  id: string
  area: string
  resident_name: string
  house_number: string
  date: string // YYYY-MM-DD format
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  status: "confirmada" | "pendiente" | "cancelada"
  notes?: string
  created_at: string
}

export interface Visitor {
  id: string
  name: string
  id_number: string // CI/Cédula
  house_number: string
  host_name: string
  visit_purpose: "visita_familia" | "delivery" | "trabajo" | "servicio" | "otro"
  entry_time: string
  exit_time?: string
  status: "dentro" | "salio"
  vehicle?: {
    has_vehicle: boolean
    license_plate?: string
    color?: string
    model?: string
    type?: "motocicleta" | "vehiculo_liviano" | "vehiculo_pesado"
  }
  notes?: string
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  message: string
  type: "urgente" | "anuncio" | "mantenimiento" | "evento"
  priority: "alta" | "media" | "baja"
  target_audience: "todos" | "propietarios" | "inquilinos"
  is_active: boolean
  created_by: string
  created_at: string
  expires_at?: string
  read_by: string[] // Array of user IDs who have read the announcement
}

export interface Vehicle {
  plate: string
  owner: string
  model: string
  year: string
  house: string
  type: string
}

export interface CommonArea {
  id: number
  name: string
  description: string
  capacity: number
  schedule: string
  location: string
}

export class LocalStorageDB {
  private static RESIDENTS_KEY = "condominium_residents"
  private static ACCESS_LOGS_KEY = "condominium_access_logs"
  private static PAYMENTS_KEY = "condominium_payments"
  private static HOUSES_KEY = "condominium_houses"
  private static RESERVATIONS_KEY = "condominium_reservations"
  private static VISITORS_KEY = "condominium_visitors"
  private static ANNOUNCEMENTS_KEY = "condominium_announcements"
  private static VEHICLES_KEY = "condominium_vehicles"
  private static COMMON_AREAS_KEY = "condominium_common_areas"

  static getResidents(): Resident[] {
    try {
      const data = localStorage.getItem(this.RESIDENTS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  static saveResident(resident: Omit<Resident, "id" | "created_at">): Resident {
    const residents = this.getResidents()
    const newResident: Resident = {
      ...resident,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }

    residents.push(newResident)
    localStorage.setItem(this.RESIDENTS_KEY, JSON.stringify(residents))
    return newResident
  }

  static getAccessLogs(): AccessLog[] {
    try {
      const data = localStorage.getItem(this.ACCESS_LOGS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  static saveAccessLog(log: Omit<AccessLog, "id">): AccessLog {
    const logs = this.getAccessLogs()
    const residents = this.getResidents()

    const newLog: AccessLog = {
      ...log,
      id: Date.now().toString(),
    }

    // Agregar información del residente si existe
    if (log.resident_id) {
      const resident = residents.find((r) => r.id === log.resident_id)
      if (resident) {
        newLog.resident = {
          name: resident.name,
          apartment_number: resident.apartment_number,
          type: resident.type,
        }
      }
    }

    logs.unshift(newLog) // Agregar al inicio
    // Mantener solo los últimos 50 logs
    if (logs.length > 50) {
      logs.splice(50)
    }

    localStorage.setItem(this.ACCESS_LOGS_KEY, JSON.stringify(logs))
    return newLog
  }

  static getActiveResidents(): Resident[] {
    return this.getResidents().filter((r) => r.is_active)
  }

  static findResidentById(id: string): Resident | null {
    const residents = this.getResidents()
    return residents.find((r) => r.id === id) || null
  }

  static getPayments(): PaymentTransaction[] {
    try {
      const data = localStorage.getItem(this.PAYMENTS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  static savePayment(payment: Omit<PaymentTransaction, "id" | "created_at">): PaymentTransaction {
    const payments = this.getPayments()
    const newPayment: PaymentTransaction = {
      ...payment,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }

    payments.unshift(newPayment) // Add to beginning
    localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments))
    return newPayment
  }

  static updatePaymentStatus(id: string, status: "pendiente" | "pagado" | "vencido"): void {
    const payments = this.getPayments()
    const paymentIndex = payments.findIndex((p) => p.id === id)

    if (paymentIndex !== -1) {
      payments[paymentIndex].status = status
      localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(payments))
    }
  }

  static getCobros(): PaymentTransaction[] {
    return this.getPayments().filter((p) => p.type === "cobro")
  }

  static getPagos(): PaymentTransaction[] {
    return this.getPayments().filter((p) => p.type === "pago")
  }

  static getPaymentsByHouse(houseNumber: string): PaymentTransaction[] {
    return this.getCobros().filter((p) => p.house_number === houseNumber)
  }

  static getTotalCobros(): number {
    return this.getCobros().reduce((total, cobro) => total + cobro.amount, 0)
  }

  static getTotalPagos(): number {
    return this.getPagos().reduce((total, pago) => total + pago.amount, 0)
  }

  static getPendingCobros(): PaymentTransaction[] {
    return this.getCobros().filter((p) => p.status === "pendiente" || p.status === "vencido")
  }

  static getHouses(): House[] {
    try {
      const data = localStorage.getItem(this.HOUSES_KEY)
      if (data) {
        return JSON.parse(data)
      } else {
        // Initialize with default houses if none exist
        const defaultHouses = [
          { number: "101", owner: "María González", status: "Ocupada", residents: 3 },
          { number: "102", owner: "Carlos Ruiz", status: "Ocupada", residents: 2 },
          { number: "103", owner: "Ana López", status: "Vacía", residents: 0 },
          { number: "104", owner: "Pedro Martín", status: "Ocupada", residents: 4 },
          { number: "105", owner: "Laura Sánchez", status: "Ocupada", residents: 2 },
          { number: "106", owner: "Sin asignar", status: "Vacía", residents: 0 },
        ]
        localStorage.setItem(this.HOUSES_KEY, JSON.stringify(defaultHouses))
        return defaultHouses
      }
    } catch {
      return []
    }
  }

  static getAllHouseNumbers(): string[] {
    return this.getHouses().map((house) => house.number)
  }

  static saveMultiplePayments(payments: Omit<PaymentTransaction, "id" | "created_at">[]): PaymentTransaction[] {
    const existingPayments = this.getPayments()
    const newPayments: PaymentTransaction[] = payments.map((payment) => ({
      ...payment,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    }))

    const allPayments = [...newPayments, ...existingPayments]
    localStorage.setItem(this.PAYMENTS_KEY, JSON.stringify(allPayments))
    return newPayments
  }

  static deleteHouse(houseNumber: string): void {
    const houses = this.getHouses().filter((h) => h.number !== houseNumber)
    localStorage.setItem(this.HOUSES_KEY, JSON.stringify(houses))
  }

  // Reservation management functions
  static getReservations(): Reservation[] {
    try {
      const data = localStorage.getItem(this.RESERVATIONS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  static saveReservation(reservation: Omit<Reservation, "id" | "created_at">): Reservation {
    const reservations = this.getReservations()
    const newReservation: Reservation = {
      ...reservation,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }

    reservations.unshift(newReservation) // Add to beginning
    localStorage.setItem(this.RESERVATIONS_KEY, JSON.stringify(reservations))
    return newReservation
  }

  static getReservationsByDate(date: string): Reservation[] {
    return this.getReservations().filter((r) => r.date === date && r.status !== "cancelada")
  }

  static getReservationsByArea(area: string): Reservation[] {
    return this.getReservations().filter((r) => r.area === area && r.status !== "cancelada")
  }

  static getReservationsByAreaAndDate(area: string, date: string): Reservation[] {
    return this.getReservations().filter((r) => r.area === area && r.date === date && r.status !== "cancelada")
  }

  static isTimeSlotAvailable(area: string, date: string, startTime: string, endTime: string): boolean {
    const existingReservations = this.getReservationsByAreaAndDate(area, date)

    for (const reservation of existingReservations) {
      // Check if times overlap
      if (this.timesOverlap(startTime, endTime, reservation.start_time, reservation.end_time)) {
        return false
      }
    }
    return true
  }

  private static timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const start1Minutes = this.timeToMinutes(start1)
    const end1Minutes = this.timeToMinutes(end1)
    const start2Minutes = this.timeToMinutes(start2)
    const end2Minutes = this.timeToMinutes(end2)

    return start1Minutes < end2Minutes && end1Minutes > start2Minutes
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  static getAvailableTimeSlots(area: string, date: string): { start: string; end: string; available: boolean }[] {
    const timeSlots = []
    const startHour = 7 // 7 AM
    const endHour = 22 // 10 PM
    const slotDuration = 1 // 1 hour slots

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, "0")}:00`
      const endTime = `${(hour + slotDuration).toString().padStart(2, "0")}:00`

      timeSlots.push({
        start: startTime,
        end: endTime,
        available: this.isTimeSlotAvailable(area, date, startTime, endTime),
      })
    }

    return timeSlots
  }

  static getCommonAreas(): string[] {
    return [
      "Salón de Eventos",
      "Cancha de Tenis",
      "Piscina",
      "Salón de Juegos",
      "Terraza BBQ",
      "Gimnasio",
      "Salón de Reuniones",
      "Área de Parrillas",
    ]
  }

  static updateReservationStatus(id: string, status: "confirmada" | "pendiente" | "cancelada"): void {
    const reservations = this.getReservations()
    const reservationIndex = reservations.findIndex((r) => r.id === id)

    if (reservationIndex !== -1) {
      reservations[reservationIndex].status = status
      localStorage.setItem(this.RESERVATIONS_KEY, JSON.stringify(reservations))
    }
  }

  static deleteReservation(id: string): void {
    const reservations = this.getReservations().filter((r) => r.id !== id)
    localStorage.setItem(this.RESERVATIONS_KEY, JSON.stringify(reservations))
  }

  // Visitor management functions
  static getVisitors(): Visitor[] {
    try {
      const data = localStorage.getItem(this.VISITORS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  static saveVisitor(visitor: Omit<Visitor, "id" | "created_at">): Visitor {
    const visitors = this.getVisitors()
    const newVisitor: Visitor = {
      ...visitor,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    }

    visitors.unshift(newVisitor) // Add to beginning
    localStorage.setItem(this.VISITORS_KEY, JSON.stringify(visitors))
    return newVisitor
  }

  static updateVisitorExit(id: string): void {
    const visitors = this.getVisitors()
    const visitorIndex = visitors.findIndex((v) => v.id === id)

    if (visitorIndex !== -1) {
      visitors[visitorIndex].exit_time = new Date().toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
      visitors[visitorIndex].status = "salio"
      localStorage.setItem(this.VISITORS_KEY, JSON.stringify(visitors))
    }
  }

  static getActiveVisitors(): Visitor[] {
    return this.getVisitors().filter((v) => v.status === "dentro")
  }

  static getVisitorsByHouse(houseNumber: string): Visitor[] {
    return this.getVisitors().filter((v) => v.house_number === houseNumber)
  }

  static getVisitorsByDate(date: string): Visitor[] {
    return this.getVisitors().filter((v) => v.created_at.startsWith(date))
  }

  static searchVisitors(query: string): Visitor[] {
    const visitors = this.getVisitors()
    const searchTerm = query.toLowerCase()

    return visitors.filter(
      (visitor) =>
        visitor.name.toLowerCase().includes(searchTerm) ||
        visitor.id_number.includes(searchTerm) ||
        visitor.house_number.includes(searchTerm) ||
        visitor.host_name.toLowerCase().includes(searchTerm) ||
        (visitor.vehicle?.license_plate && visitor.vehicle.license_plate.toLowerCase().includes(searchTerm)),
    )
  }

  static getVisitPurposes(): { value: string; label: string }[] {
    return [
      { value: "visita_familia", label: "Visita Familiar" },
      { value: "delivery", label: "Delivery" },
      { value: "trabajo", label: "Trabajo/Servicio" },
      { value: "servicio", label: "Servicio Técnico" },
      { value: "otro", label: "Otro" },
    ]
  }

  static getVehicleTypes(): { value: string; label: string }[] {
    return [
      { value: "motocicleta", label: "Motocicleta" },
      { value: "vehiculo_liviano", label: "Vehículo Liviano" },
      { value: "vehiculo_pesado", label: "Vehículo Pesado" },
    ]
  }

  static getVehicles(): Vehicle[] {
    try {
      const data = localStorage.getItem(this.VEHICLES_KEY)
      if (data) {
        return JSON.parse(data)
      } else {
        // Initialize with default vehicles if none exist
        const defaultVehicles = [
          {
            plate: "ABC-123",
            owner: "María González",
            model: "Toyota Corolla",
            year: "2020",
            house: "101",
            type: "Auto",
          },
          {
            plate: "DEF-456",
            owner: "Carlos Ruiz",
            model: "Honda Civic",
            year: "2019",
            house: "102",
            type: "Auto",
          },
          {
            plate: "GHI-789",
            owner: "Ana López",
            model: "Nissan Sentra",
            year: "2021",
            house: "103",
            type: "Auto",
          },
          {
            plate: "JKL-012",
            owner: "Pedro Martín",
            model: "Chevrolet Spark",
            year: "2018",
            house: "104",
            type: "Auto",
          },
          {
            plate: "MNO-345",
            owner: "Laura Sánchez",
            model: "Ford Fiesta",
            year: "2022",
            house: "105",
            type: "Auto",
          },
          {
            plate: "PQR-678",
            owner: "Carlos Ruiz",
            model: "Yamaha YZF",
            year: "2020",
            house: "102",
            type: "Motocicleta",
          },
        ]
        localStorage.setItem(this.VEHICLES_KEY, JSON.stringify(defaultVehicles))
        return defaultVehicles
      }
    } catch {
      return []
    }
  }

  static deleteVehicle(plate: string): void {
    const vehicles = this.getVehicles().filter((v) => v.plate !== plate)
    localStorage.setItem(this.VEHICLES_KEY, JSON.stringify(vehicles))
  }

  // Announcement management functions
  static getAnnouncements(): Announcement[] {
    try {
      const data = localStorage.getItem(this.ANNOUNCEMENTS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  static saveAnnouncement(announcement: Omit<Announcement, "id" | "created_at" | "read_by">): Announcement {
    const announcements = this.getAnnouncements()
    const newAnnouncement: Announcement = {
      ...announcement,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      read_by: [],
    }

    announcements.unshift(newAnnouncement) // Add to beginning
    localStorage.setItem(this.ANNOUNCEMENTS_KEY, JSON.stringify(announcements))
    return newAnnouncement
  }

  static getActiveAnnouncements(): Announcement[] {
    const now = new Date()
    return this.getAnnouncements().filter((announcement) => {
      if (!announcement.is_active) return false
      if (announcement.expires_at) {
        return new Date(announcement.expires_at) > now
      }
      return true
    })
  }

  static getAnnouncementsByType(type: Announcement["type"]): Announcement[] {
    return this.getAnnouncements().filter((announcement) => announcement.type === type)
  }

  static updateAnnouncementStatus(id: string, is_active: boolean): void {
    const announcements = this.getAnnouncements()
    const announcementIndex = announcements.findIndex((a) => a.id === id)

    if (announcementIndex !== -1) {
      announcements[announcementIndex].is_active = is_active
      localStorage.setItem(this.ANNOUNCEMENTS_KEY, JSON.stringify(announcements))
    }
  }

  static markAnnouncementAsRead(announcementId: string, userId: string): void {
    const announcements = this.getAnnouncements()
    const announcementIndex = announcements.findIndex((a) => a.id === announcementId)

    if (announcementIndex !== -1) {
      const announcement = announcements[announcementIndex]
      if (!announcement.read_by.includes(userId)) {
        announcement.read_by.push(userId)
        localStorage.setItem(this.ANNOUNCEMENTS_KEY, JSON.stringify(announcements))
      }
    }
  }

  static deleteAnnouncement(id: string): void {
    const announcements = this.getAnnouncements().filter((a) => a.id !== id)
    localStorage.setItem(this.ANNOUNCEMENTS_KEY, JSON.stringify(announcements))
  }

  static getAnnouncementTypes(): { value: Announcement["type"]; label: string; color: string }[] {
    return [
      { value: "urgente", label: "Urgente", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" },
      {
        value: "anuncio",
        label: "Anuncio General",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      },
      {
        value: "mantenimiento",
        label: "Mantenimiento",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      },
      {
        value: "evento",
        label: "Evento",
        color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      },
    ]
  }

  static getPriorityTypes(): { value: Announcement["priority"]; label: string }[] {
    return [
      { value: "alta", label: "Alta" },
      { value: "media", label: "Media" },
      { value: "baja", label: "Baja" },
    ]
  }

  static getTargetAudiences(): { value: Announcement["target_audience"]; label: string }[] {
    return [
      { value: "todos", label: "Todos los Residentes" },
      { value: "propietarios", label: "Solo Propietarios" },
      { value: "inquilinos", label: "Solo Inquilinos" },
    ]
  }

  static updateAnnouncement(id: string, updates: Partial<Omit<Announcement, "id" | "created_at" | "read_by">>): void {
    const announcements = this.getAnnouncements()
    const announcementIndex = announcements.findIndex((a) => a.id === id)

    if (announcementIndex !== -1) {
      announcements[announcementIndex] = {
        ...announcements[announcementIndex],
        ...updates,
      }
      localStorage.setItem(this.ANNOUNCEMENTS_KEY, JSON.stringify(announcements))
    }
  }

  static getCommonAreasData(): CommonArea[] {
    try {
      const data = localStorage.getItem(this.COMMON_AREAS_KEY)
      if (data) {
        return JSON.parse(data)
      } else {
        // Initialize with default common areas if none exist
        const defaultAreas = [
          {
            id: 1,
            name: "Piscina Principal",
            description: "Área de piscina con zona de descanso",
            capacity: 50,
            schedule: "6:00 AM - 10:00 PM",
            location: "Zona Central",
          },
          {
            id: 2,
            name: "Gimnasio",
            description: "Equipamiento completo de ejercicio",
            capacity: 20,
            schedule: "5:00 AM - 11:00 PM",
            location: "Planta Baja",
          },
          {
            id: 3,
            name: "Salón de Eventos",
            description: "Espacio para celebraciones y reuniones",
            capacity: 100,
            schedule: "24 horas",
            location: "Segundo Piso",
          },
          {
            id: 4,
            name: "Cancha de Tenis",
            description: "Cancha profesional de tenis",
            capacity: 4,
            schedule: "6:00 AM - 9:00 PM",
            location: "Área Deportiva",
          },
        ]
        localStorage.setItem(this.COMMON_AREAS_KEY, JSON.stringify(defaultAreas))
        return defaultAreas
      }
    } catch {
      return []
    }
  }

  static deleteCommonArea(id: number): void {
    const areas = this.getCommonAreasData().filter((a) => a.id !== id)
    localStorage.setItem(this.COMMON_AREAS_KEY, JSON.stringify(areas))
  }
}
