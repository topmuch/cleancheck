"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Plus, MapPin, QrCode, Settings, MoreVertical, Trash2, 
  Loader2, Building2
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Site {
  id: string
  name: string
  address: string | null
  pinCode: string | null
  qrToken: string
  isActive: boolean
  _count?: {
    tasks: number
    sessions: number
  }
}

export default function SitesPage() {
  const { data: session, status } = useSession()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    pinCode: "",
  })

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
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-muted-foreground">
            Gérez vos sites et générez leurs QR codes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                <Button type="submit" disabled={submitting}>
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
      </div>

      {/* Sites Grid */}
      {sites.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun site configuré</h3>
            <p className="text-muted-foreground mb-6">
              Commencez par créer votre premier site pour générer un QR Code.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
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
    </div>
  )
}
