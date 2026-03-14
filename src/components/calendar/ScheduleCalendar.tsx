"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, X, Trash2, Edit, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  createScheduledSession, 
  updateScheduledSession, 
  deleteScheduledSession,
  getScheduledSessionsByDateRange 
} from "@/actions/scheduled-session"

type Frequency = "NONE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY"
type ScheduledStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

type ScheduledSession = {
  id: string
  siteId: string
  scheduledDate: Date
  duration: number
  frequency: Frequency
  status: ScheduledStatus
  assignedTo: string | null
  notes: string | null
  Site: {
    name: string
    address: string | null
    pinCode: string | null
  }
}

type Site = {
  id: string
  name: string
  address: string | null
}

interface ScheduleCalendarProps {
  sites: Site[]
  onSessionCreated?: () => void
}

const frequencyLabels: Record<Frequency, string> = {
  NONE: "Une seule fois",
  DAILY: "Tous les jours",
  WEEKLY: "Chaque semaine",
  BIWEEKLY: "Toutes les 2 semaines",
  MONTHLY: "Chaque mois"
}

const statusColors: Record<ScheduledStatus, string> = {
  PENDING: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-500"
}

const statusLabels: Record<ScheduledStatus, string> = {
  PENDING: "En attente",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé"
}

export function ScheduleCalendar({ sites, onSessionCreated }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [sessions, setSessions] = useState<ScheduledSession[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ScheduledSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    siteId: "",
    date: "",
    time: "09:00",
    duration: "60",
    frequency: "NONE" as Frequency,
    assignedTo: "",
    notes: ""
  })

  // Charger les sessions du mois
  const loadSessions = useCallback(async () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    
    // Ajouter une marge pour voir les sessions en dehors du mois visible
    const paddedStart = new Date(start)
    paddedStart.setDate(paddedStart.getDate() - 7)
    const paddedEnd = new Date(end)
    paddedEnd.setDate(paddedEnd.getDate() + 7)

    const data = await getScheduledSessionsByDateRange(paddedStart, paddedEnd)
    setSessions(data as ScheduledSession[])
  }, [currentMonth])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Générer les jours du mois
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Ajouter les jours du mois précédent/suivant pour compléter la grille
  const startDay = monthStart.getDay() || 7 // 0 = dimanche, on veut lundi = 1
  const paddedDays: Date[] = []
  
  for (let i = 1; i < startDay; i++) {
    const d = new Date(monthStart)
    d.setDate(d.getDate() - (startDay - i))
    paddedDays.push(d)
  }
  
  paddedDays.push(...days)
  
  // Compléter jusqu'à 42 jours (6 semaines)
  while (paddedDays.length < 42) {
    const d = new Date(monthEnd)
    d.setDate(d.getDate() + (paddedDays.length - days.length - (startDay - 1) + 1))
    paddedDays.push(d)
  }

  // Obtenir les sessions d'un jour
  const getSessionsForDay = (date: Date) => {
    return sessions.filter(s => isSameDay(new Date(s.scheduledDate), date))
  }

  // Navigation mois
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  // Ouvrir dialog création
  const openCreateDialog = (date: Date) => {
    setSelectedDate(date)
    setFormData({
      siteId: sites[0]?.id || "",
      date: format(date, "yyyy-MM-dd"),
      time: "09:00",
      duration: "60",
      frequency: "NONE",
      assignedTo: "",
      notes: ""
    })
    setIsCreateDialogOpen(true)
  }

  // Créer session
  const handleCreateSession = async () => {
    if (!formData.siteId || !formData.date || !formData.time) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setIsLoading(true)
    
    const scheduledDate = new Date(`${formData.date}T${formData.time}:00`)
    
    const result = await createScheduledSession({
      siteId: formData.siteId,
      scheduledDate,
      duration: parseInt(formData.duration),
      frequency: formData.frequency,
      assignedTo: formData.assignedTo || undefined,
      notes: formData.notes || undefined
    })

    setIsLoading(false)

    if (result.success) {
      toast.success("Session planifiée avec succès")
      setIsCreateDialogOpen(false)
      loadSessions()
      onSessionCreated?.()
    } else {
      toast.error(result.error || "Erreur lors de la création")
    }
  }

  // Voir/modifier session
  const openViewDialog = (session: ScheduledSession) => {
    setSelectedSession(session)
    setFormData({
      siteId: session.siteId,
      date: format(new Date(session.scheduledDate), "yyyy-MM-dd"),
      time: format(new Date(session.scheduledDate), "HH:mm"),
      duration: session.duration.toString(),
      frequency: session.frequency,
      assignedTo: session.assignedTo || "",
      notes: session.notes || ""
    })
    setIsViewDialogOpen(true)
  }

  // Modifier session
  const handleUpdateSession = async () => {
    if (!selectedSession) return

    setIsLoading(true)
    
    const scheduledDate = new Date(`${formData.date}T${formData.time}:00`)
    
    const result = await updateScheduledSession(selectedSession.id, {
      scheduledDate,
      duration: parseInt(formData.duration),
      frequency: formData.frequency,
      assignedTo: formData.assignedTo || undefined,
      notes: formData.notes || undefined
    })

    setIsLoading(false)

    if (result.success) {
      toast.success("Session modifiée avec succès")
      setIsViewDialogOpen(false)
      loadSessions()
      onSessionCreated?.()
    } else {
      toast.error(result.error || "Erreur lors de la modification")
    }
  }

  // Supprimer session
  const handleDeleteSession = async () => {
    if (!selectedSession) return

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette session ?")) return

    setIsLoading(true)
    
    const result = await deleteScheduledSession(selectedSession.id)

    setIsLoading(false)

    if (result.success) {
      toast.success("Session supprimée")
      setIsViewDialogOpen(false)
      loadSessions()
      onSessionCreated?.()
    } else {
      toast.error(result.error || "Erreur lors de la suppression")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-500" />
          Calendrier de Ménage
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center font-medium">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {paddedDays.map((day, index) => {
            const daySessions = getSessionsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-1 border rounded-lg cursor-pointer transition-colors
                  ${isCurrentMonth ? "bg-background" : "bg-muted/30"}
                  ${isSelected ? "ring-2 ring-blue-500" : ""}
                  ${isTodayDate ? "border-blue-500 border-2" : "border-border"}
                  hover:bg-accent hover:text-accent-foreground
                `}
                onClick={() => openCreateDialog(day)}
              >
                <div className={`text-sm font-medium mb-1 ${isTodayDate ? "text-blue-500" : ""}`}>
                  {format(day, "d")}
                </div>
                
                {/* Sessions du jour */}
                <div className="space-y-1">
                  {daySessions.slice(0, 3).map(session => (
                    <div
                      key={session.id}
                      className={`
                        text-xs p-1 rounded truncate cursor-pointer
                        ${statusColors[session.status]} text-white
                      `}
                      onClick={(e) => {
                        e.stopPropagation()
                        openViewDialog(session)
                      }}
                    >
                      {format(new Date(session.scheduledDate), "HH:mm")} - {session.Site.name}
                    </div>
                  ))}
                  {daySessions.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{daySessions.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">Légende:</span>
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${statusColors[status as ScheduledStatus]}`} />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Dialog Création */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planifier un ménage</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Site *</Label>
              <Select value={formData.siteId} onValueChange={v => setFormData({ ...formData, siteId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Heure *</Label>
                <Input 
                  type="time" 
                  value={formData.time}
                  onChange={e => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Durée (minutes)</Label>
                <Select value={formData.duration} onValueChange={v => setFormData({ ...formData, duration: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="90">1h30</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                    <SelectItem value="180">3 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Répétition</Label>
                <Select value={formData.frequency} onValueChange={v => setFormData({ ...formData, frequency: v as Frequency })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(frequencyLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Assigné à (optionnel)</Label>
              <Input 
                value={formData.assignedTo}
                onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Nom de l'intervenant"
              />
            </div>

            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea 
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Instructions particulières..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateSession} disabled={isLoading}>
              {isLoading ? "Création..." : "Planifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Vue/Modification */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la session</DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedSession.status]}>
                  {statusLabels[selectedSession.status]}
                </Badge>
                {selectedSession.frequency !== "NONE" && (
                  <Badge variant="outline">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {frequencyLabels[selectedSession.frequency]}
                  </Badge>
                )}
              </div>

              <div>
                <Label>Site</Label>
                <Select value={formData.siteId} onValueChange={v => setFormData({ ...formData, siteId: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Heure</Label>
                  <Input 
                    type="time" 
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Durée (minutes)</Label>
                  <Select value={formData.duration} onValueChange={v => setFormData({ ...formData, duration: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="90">1h30</SelectItem>
                      <SelectItem value="120">2 heures</SelectItem>
                      <SelectItem value="180">3 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Répétition</Label>
                  <Select value={formData.frequency} onValueChange={v => setFormData({ ...formData, frequency: v as Frequency })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(frequencyLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Assigné à</Label>
                <Input 
                  value={formData.assignedTo}
                  onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea 
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleDeleteSession} disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateSession} disabled={isLoading}>
                {isLoading ? "Modification..." : "Modifier"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
