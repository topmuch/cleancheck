"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
  Plus, Users, Phone, Mail, Building, MoreVertical, Search, 
  Loader2, UserCheck, UserX, Euro, Calendar
} from "lucide-react"
import { toast } from "sonner"
import { getClients, createClient } from "@/actions/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Client {
  id: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  email: string | null
  phone: string
  status: string
  totalSpent: number
  lastServiceDate: Date | null
  _count?: { Sites: number; Invoices: number; Contracts: number }
}

const statusColors: Record<string, string> = {
  PROSPECT: "bg-blue-500",
  ACTIVE: "bg-green-500",
  INACTIVE: "bg-gray-500",
  LOST: "bg-red-500"
}

const statusLabels: Record<string, string> = {
  PROSPECT: "Prospect",
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  LOST: "Perdu"
}

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    phone2: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    source: ""
  })

  useEffect(() => {
    if (status === "authenticated" && session) {
      loadClients()
    }
  }, [status, session])

  const loadClients = async () => {
    setLoading(true)
    const data = await getClients({ status: statusFilter || undefined, search: search || undefined })
    setClients(data as Client[])
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "authenticated") {
        loadClients()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const result = await createClient({
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      companyName: formData.companyName || undefined,
      email: formData.email || undefined,
      phone: formData.phone,
      phone2: formData.phone2 || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      postalCode: formData.postalCode || undefined,
      notes: formData.notes || undefined,
      source: formData.source || undefined
    })

    setSubmitting(false)

    if (result.success) {
      toast.success("Client créé avec succès")
      setDialogOpen(false)
      setFormData({
        firstName: "", lastName: "", companyName: "", email: "", phone: "",
        phone2: "", address: "", city: "", postalCode: "", notes: "", source: ""
      })
      loadClients()
    } else {
      toast.error(result.error || "Erreur lors de la création")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR"
    }).format(amount)
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
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Gérez votre portefeuille clients
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateClient}>
              <DialogHeader>
                <DialogTitle>Ajouter un client</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle fiche client
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Raison sociale (si entreprise)</Label>
                  <Input
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Nom de l'entreprise"
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
                  <Label>Téléphone 2</Label>
                  <Input
                    value={formData.phone2}
                    onChange={e => setFormData({ ...formData, phone2: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={formData.source} onValueChange={v => setFormData({ ...formData, source: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Comment nous a-t-il connu ?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEBSITE">Site web</SelectItem>
                      <SelectItem value="REFERRAL">Bouche à oreille</SelectItem>
                      <SelectItem value="SOCIAL">Réseaux sociaux</SelectItem>
                      <SelectItem value="AD">Publicité</SelectItem>
                      <SelectItem value="OTHER">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Adresse</Label>
                  <Input
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code postal</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={e => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Informations importantes..."
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
            placeholder="Rechercher un client..."
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
            <SelectItem value="PROSPECT">Prospect</SelectItem>
            <SelectItem value="ACTIVE">Actif</SelectItem>
            <SelectItem value="INACTIVE">Inactif</SelectItem>
            <SelectItem value="LOST">Perdu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === "ACTIVE").length}</p>
                <p className="text-sm text-muted-foreground">Clients actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.filter(c => c.status === "PROSPECT").length}</p>
                <p className="text-sm text-muted-foreground">Prospects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Euro className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(clients.reduce((sum, c) => sum + c.totalSpent, 0))}</p>
                <p className="text-sm text-muted-foreground">CA Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Building className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clients.filter(c => c.companyName).length}</p>
                <p className="text-sm text-muted-foreground">Entreprises</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun client</h3>
            <p className="text-muted-foreground mb-6">
              Ajoutez votre premier client pour commencer
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card 
              key={client.id} 
              className="cursor-pointer hover:border-blue-200 transition-colors"
              onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {client.companyName ? (
                        <Building className="h-6 w-6 text-blue-600" />
                      ) : (
                        <span className="text-blue-600 font-bold">
                          {client.firstName?.[0] || ""}{client.lastName?.[0] || ""}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {client.companyName || `${client.firstName || ""} ${client.lastName || ""}`.trim()}
                        </h3>
                        <Badge className={`${statusColors[client.status]} text-white text-xs`}>
                          {statusLabels[client.status]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
                        {client.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-lg">{formatCurrency(client.totalSpent)}</p>
                      <p className="text-muted-foreground">CA</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">{client._count?.Sites || 0}</p>
                      <p className="text-muted-foreground">Sites</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">{client._count?.Contracts || 0}</p>
                      <p className="text-muted-foreground">Contrats</p>
                    </div>
                    {client.lastServiceDate && (
                      <div className="text-center hidden sm:block">
                        <p className="font-medium">{format(new Date(client.lastServiceDate), "d/MM/yy")}</p>
                        <p className="text-muted-foreground">Dernier service</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
