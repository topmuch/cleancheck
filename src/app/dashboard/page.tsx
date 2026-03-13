"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Site } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Loader2, Plus, MapPin, QrCode, LogOut, User, Settings, MoreVertical, Trash2, 
  Calendar, Users, Building2, Bell, Clock
} from "lucide-react"
import { toast } from "sonner"
import { signOut } from "next-auth/react"
import { ScheduleCalendar } from "@/components/calendar/ScheduleCalendar"

interface SiteWithCount extends Site {
  _count?: {
    tasks: number
    sessions: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [sites, setSites] = useState<SiteWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("sites")
  const router = useRouter()

  // Formulaire nouveau site
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    pinCode: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchSites()
    }
  }, [status, session])

  const fetchSites = async () => {
    try {
      const response = await fetch("/api/sites")
      const data = await response.json()

      if (response.ok) {
        setSites(data.sites || [])
      } else {
        toast.error("Erreur lors du chargement des sites")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement des sites")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address || null,
          pinCode: formData.pinCode || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Site créé avec succès")
        setDialogOpen(false)
        setFormData({ name: "", address: "", pinCode: "" })
        fetchSites()
      } else {
        toast.error(data.error || "Erreur lors de la création du site")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la création du site")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce site ?")) return

    try {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Site supprimé")
        fetchSites()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // Afficher un loader pendant le chargement
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Rediriger si non authentifié
  if (status === "unauthenticated" || !session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">C</span>
            </div>
            <span className="text-xl font-bold">CleanCheck</span>
            {session.user?.role && (
              <Badge variant="outline" className="ml-2">
                {session.user.role === "AGENCY" ? "Agence" : 
                 session.user.role === "EMPLOYEE" ? "Employé" : "Propriétaire"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau site
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateSite}>
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouveau site</DialogTitle>
                    <DialogDescription>
                      Créez un site pour générer son QR Code unique.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du site *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Bureau Paris Centre"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        placeholder="Ex: 123 Rue de la Paix, 75001 Paris"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pinCode">Code PIN (optionnel)</Label>
                      <Input
                        id="pinCode"
                        placeholder="Ex: 1234"
                        maxLength={4}
                        value={formData.pinCode}
                        onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, "") })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Un code à 4 chiffres pour sécuriser l'accès des intervenants
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-blue-500 hover:bg-blue-600" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Création...
                        </>
                      ) : (
                        "Créer le site"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {session.user?.name || session.user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Gérez vos sites, planifiez vos interventions et suivez l'activité
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sites.length}</p>
                  <p className="text-xs text-muted-foreground">Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <QrCode className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sites.filter(s => s.pinCode).length}</p>
                  <p className="text-xs text-muted-foreground">Sécurisés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Planifiés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Cette semaine</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="sites" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Sites
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendrier
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Équipe
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Sites Tab */}
          <TabsContent value="sites">
            {sites.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucun site configuré</h3>
                  <p className="text-muted-foreground mb-6">
                    Commencez par créer votre premier site pour générer un QR Code.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer mon premier site
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sites.map((site) => (
                  <Card 
                    key={site.id} 
                    className="cursor-pointer hover:border-blue-200 transition-colors group"
                    onClick={() => router.push(`/dashboard/site/${site.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-blue-500" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{site.name}</CardTitle>
                            {site.address && (
                              <CardDescription className="line-clamp-1">
                                {site.address}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteSite(site.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {site.pinCode && (
                          <div className="flex items-center gap-1">
                            <Settings className="h-4 w-4" />
                            <span>PIN: ****</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <QrCode className="h-4 w-4" />
                          <span>QR Code prêt</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <ScheduleCalendar 
              sites={sites.map(s => ({ id: s.id, name: s.name, address: s.address }))} 
            />
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Équipe</CardTitle>
                    <CardDescription>
                      Gérez les membres de votre équipe de nettoyage
                    </CardDescription>
                  </div>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un membre
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Créez une agence pour gérer votre équipe</p>
                  <Button variant="outline" className="mt-4">
                    <Building2 className="h-4 w-4 mr-2" />
                    Créer mon agence
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configuration des notifications</CardTitle>
                <CardDescription>
                  Paramétrez les rappels automatiques pour vos interventions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bell className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Rappels par email</p>
                        <p className="text-sm text-muted-foreground">
                          Recevez un rappel 24h et 1h avant chaque intervention
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Bientôt disponible</Badge>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Configuration requise :</strong> Pour activer les notifications email, 
                      ajoutez votre clé API Resend dans les variables d'environnement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
