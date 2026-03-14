"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, Phone, Mail, MapPin, Building, Plus, 
  Loader2, Edit, Euro, Calendar, FileText, Users
} from "lucide-react"
import { getClient } from "@/actions/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ClientData {
  id: string
  firstName: string | null
  lastName: string | null
  companyName: string | null
  email: string | null
  phone: string
  phone2: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  status: string
  totalSpent: number
  lastServiceDate: Date | null
  createdAt: Date
  Notes: { id: string; type: string; content: string; createdAt: Date }[]
  Contracts: { id: string; name: string; type: string; price: number; status: string; startDate: Date }[]
  Sites: { id: string; name: string; address: string | null }[]
  Invoices: { id: string; number: string; total: number; status: string; dueDate: Date }[]
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

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { status } = useSession()
  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated" && id) {
      loadClient()
    }
  }, [status, id])

  const loadClient = async () => {
    setLoading(true)
    const data = await getClient(id as string)
    setClient(data as ClientData)
    setLoading(false)
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

  if (!client) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Client non trouvé</h3>
        <Button variant="outline" onClick={() => router.push("/dashboard/clients")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const clientName = client.companyName || `${client.firstName || ""} ${client.lastName || ""}`.trim()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              {client.companyName ? (
                <Building className="h-8 w-8 text-purple-600" />
              ) : (
                <span className="text-purple-600 font-bold text-xl">
                  {client.firstName?.[0] || ""}{client.lastName?.[0] || ""}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{clientName}</h1>
                <Badge className={`${statusColors[client.status]} text-white`}>
                  {statusLabels[client.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
                {client.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{client.phone}</span>
                </div>
                {client.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{client.address}, {client.postalCode} {client.city}</span>
                  </div>
                )}
              </div>
            </div>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatCurrency(client.totalSpent)}</p>
              <p className="text-sm text-muted-foreground">Total facturé</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{client.Sites?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Sites</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{client.Contracts?.filter(c => c.status === "ACTIVE").length || 0}</p>
              <p className="text-sm text-muted-foreground">Contrats actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{client.Invoices?.filter(i => i.status === "PAID").length || 0}</p>
              <p className="text-sm text-muted-foreground">Factures payées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="contracts">Contrats</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations de contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone principal</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                  {client.phone2 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone secondaire</p>
                      <p className="font-medium">{client.phone2}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{client.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client depuis</p>
                    <p className="font-medium">{format(new Date(client.createdAt), "d MMMM yyyy", { locale: fr })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dernière activité</CardTitle>
              </CardHeader>
              <CardContent>
                {client.lastServiceDate ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-700">Dernier service</p>
                      <p className="text-sm text-green-600">
                        {format(new Date(client.lastServiceDate), "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Aucun service effectué</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sites */}
        <TabsContent value="sites">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sites du client</CardTitle>
                  <CardDescription>Lieux de nettoyage</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un site
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {client.Sites?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun site</p>
              ) : (
                <div className="space-y-3">
                  {client.Sites?.map(site => (
                    <div key={site.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{site.name}</p>
                          {site.address && <p className="text-sm text-muted-foreground">{site.address}</p>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Voir</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contrats</CardTitle>
                  <CardDescription>Accords de service avec ce client</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau contrat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {client.Contracts?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun contrat</p>
              ) : (
                <div className="space-y-3">
                  {client.Contracts?.map(contract => (
                    <div key={contract.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{contract.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.type} • Depuis {format(new Date(contract.startDate), "d/MM/yy")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(contract.price)}</p>
                        <Badge variant={contract.status === "ACTIVE" ? "default" : "secondary"}>
                          {contract.status === "ACTIVE" ? "Actif" : contract.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Factures</CardTitle>
            </CardHeader>
            <CardContent>
              {client.Invoices?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune facture</p>
              ) : (
                <div className="space-y-3">
                  {client.Invoices?.map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          <p className="text-sm text-muted-foreground">
                            Échéance: {format(new Date(invoice.dueDate), "d/MM/yy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(invoice.total)}</p>
                        <Badge variant={invoice.status === "PAID" ? "default" : "secondary"}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notes</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {client.Notes?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucune note</p>
              ) : (
                <div className="space-y-3">
                  {client.Notes?.map(note => (
                    <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{note.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.createdAt), "d/MM/yy HH:mm")}
                        </span>
                      </div>
                      <p>{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
