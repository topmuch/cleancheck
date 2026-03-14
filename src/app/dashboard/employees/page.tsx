"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, Users, Phone, Mail, MoreVertical, Search, 
  Loader2, UserCheck, UserX, Clock, Star
} from "lucide-react"
import { toast } from "sonner"
import { getEmployees, createEmployee } from "@/actions/employee"

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string
  status: string
  hourlyRate: number | null
  _count?: { Sessions: number }
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500",
  ON_LEAVE: "bg-yellow-500",
  TERMINATED: "bg-red-500"
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  ON_LEAVE: "En congé",
  TERMINATED: "Terminé"
}

export default function EmployeesPage() {
  const { data: session, status } = useSession()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    hourlyRate: "",
    skills: "",
    languages: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: ""
  })

  useEffect(() => {
    if (status === "authenticated" && session) {
      loadEmployees()
    }
  }, [status, session])

  const loadEmployees = async () => {
    setLoading(true)
    const data = await getEmployees({ status: statusFilter || undefined, search: search || undefined })
    setEmployees(data as Employee[])
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "authenticated") {
        loadEmployees()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const result = await createEmployee({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || undefined,
      phone: formData.phone,
      address: formData.address || undefined,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      skills: formData.skills ? formData.skills.split(",").map(s => s.trim()) : undefined,
      languages: formData.languages ? formData.languages.split(",").map(l => l.trim()) : undefined,
      emergencyContact: formData.emergencyContact || undefined,
      emergencyPhone: formData.emergencyPhone || undefined
    })

    setSubmitting(false)

    if (result.success) {
      toast.success("Employé créé avec succès")
      setDialogOpen(false)
      setFormData({
        firstName: "", lastName: "", email: "", phone: "",
        hourlyRate: "", skills: "", languages: "", address: "",
        emergencyContact: "", emergencyPhone: ""
      })
      loadEmployees()
    } else {
      toast.error(result.error || "Erreur lors de la création")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employés</h1>
          <p className="text-muted-foreground">
            Gérez votre équipe de nettoyage
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel employé
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateEmployee}>
              <DialogHeader>
                <DialogTitle>Ajouter un employé</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du nouvel employé
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prénom *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone *</Label>
                  <Input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taux horaire (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={e => setFormData({ ...formData, hourlyRate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Compétences (séparées par virgule)</Label>
                  <Input
                    placeholder="Ménage, Repassage, Bureaux..."
                    value={formData.skills}
                    onChange={e => setFormData({ ...formData, skills: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Langues (séparées par virgule)</Label>
                  <Input
                    placeholder="Français, Anglais..."
                    value={formData.languages}
                    onChange={e => setFormData({ ...formData, languages: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact d'urgence</Label>
                  <Input
                    value={formData.emergencyContact}
                    onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tél. d'urgence</Label>
                  <Input
                    value={formData.emergencyPhone}
                    onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</> : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employé..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            <SelectItem value="ACTIVE">Actif</SelectItem>
            <SelectItem value="ON_LEAVE">En congé</SelectItem>
            <SelectItem value="TERMINATED">Terminé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employees.filter(e => e.status === "ACTIVE").length}</p>
                <p className="text-sm text-muted-foreground">Employés actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employees.filter(e => e.status === "ON_LEAVE").length}</p>
                <p className="text-sm text-muted-foreground">En congé</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees List */}
      {employees.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun employé</h3>
            <p className="text-muted-foreground mb-6">
              Ajoutez votre premier employé pour commencer
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un employé
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <Card 
              key={employee.id} 
              className="cursor-pointer hover:border-blue-200 transition-colors"
              onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {employee.firstName} {employee.lastName}
                      </CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={`${statusColors[employee.status]} text-white text-xs mt-1`}
                      >
                        {statusLabels[employee.status]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={e => {
                        e.stopPropagation()
                        router.push(`/dashboard/employees/${employee.id}`)
                      }}>
                        Voir le profil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {employee.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{employee.phone}</span>
                  </div>
                  {employee.hourlyRate && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {employee.hourlyRate}€/h
                      </span>
                    </div>
                  )}
                  {employee._count && (
                    <div className="pt-2 border-t mt-2">
                      <span className="text-xs">{employee._count.Sessions} missions</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
