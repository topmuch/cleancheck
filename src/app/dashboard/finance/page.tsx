"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Plus, FileText, Euro, Clock, CheckCircle, AlertCircle, 
  Loader2, TrendingUp, TrendingDown, Send, Eye
} from "lucide-react"
import { toast } from "sonner"
import { getInvoices, getQuotes, getFinanceStats, createInvoice, updateInvoiceStatus } from "@/actions/finance"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Invoice {
  id: string
  number: string
  status: string
  total: number
  dueDate: Date
  paidDate: Date | null
  createdAt: Date
  Client?: { firstName: string | null; lastName: string | null; companyName: string | null }
  Site?: { name: string }
}

interface Quote {
  id: string
  number: string
  status: string
  total: number
  validUntil: Date
  createdAt: Date
  Client?: { firstName: string | null; lastName: string | null; companyName: string | null }
  Site?: { name: string }
}

interface FinanceStats {
  totalRevenue: number
  monthlyRevenue: number
  lastMonthRevenue: number
  pendingInvoices: number
  overdueInvoices: number
  totalExpenses: number
  monthlyExpenses: number
  pendingQuotes: number
  profit: number
}

const invoiceStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SENT: "bg-blue-500",
  VIEWED: "bg-purple-500",
  PAID: "bg-green-500",
  OVERDUE: "bg-red-500",
  CANCELLED: "bg-gray-400"
}

const invoiceStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  VIEWED: "Vue",
  PAID: "Payée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée"
}

const quoteStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  VIEWED: "Vu",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré"
}

export default function FinancePage() {
  const { data: session, status } = useSession()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("overview")

  useEffect(() => {
    if (status === "authenticated" && session) {
      loadData()
    }
  }, [status, session])

  const loadData = async () => {
    setLoading(true)
    const [invData, quoteData, statsData] = await Promise.all([
      getInvoices(),
      getQuotes(),
      getFinanceStats()
    ])
    setInvoices(invData as Invoice[])
    setQuotes(quoteData as Quote[])
    setStats(statsData)
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR"
    }).format(amount)
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    const result = await updateInvoiceStatus(invoiceId, "PAID", "BANK_TRANSFER")
    if (result.success) {
      toast.success("Facture marquée comme payée")
      loadData()
    } else {
      toast.error(result.error || "Erreur")
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
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground">
            Gérez vos devis, factures et finances
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle facture
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA du mois</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                {stats && stats.lastMonthRevenue > 0 && (
                  <div className={`flex items-center gap-1 text-sm ${stats.monthlyRevenue >= stats.lastMonthRevenue ? "text-green-600" : "text-red-600"}`}>
                    {stats.monthlyRevenue >= stats.lastMonthRevenue ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>
                      {Math.abs(((stats.monthlyRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{formatCurrency(stats?.pendingInvoices || 0)}</p>
                <p className="text-sm text-muted-foreground">{invoices.filter(i => i.status === "SENT").length} factures</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En retard</p>
                <p className="text-2xl font-bold text-red-600">{stats?.overdueInvoices || 0}</p>
                <p className="text-sm text-muted-foreground">factures impayées</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bénéfice du mois</p>
                <p className={`text-2xl font-bold ${(stats?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(stats?.profit || 0)}
                </p>
                <p className="text-sm text-muted-foreground">après dépenses</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="invoices">Factures ({invoices.length})</TabsTrigger>
          <TabsTrigger value="quotes">Devis ({quotes.length})</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Factures récentes</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune facture</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map(invoice => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{invoice.number}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.Client?.companyName || `${invoice.Client?.firstName || ""} ${invoice.Client?.lastName || ""}`.trim()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(invoice.total)}</p>
                          <Badge className={`${invoiceStatusColors[invoice.status]} text-white text-xs`}>
                            {invoiceStatusLabels[invoice.status]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overdue Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Factures en retard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.filter(i => i.status === "SENT" && new Date(i.dueDate) < new Date()).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucune facture en retard 🎉</p>
                ) : (
                  <div className="space-y-3">
                    {invoices
                      .filter(i => i.status === "SENT" && new Date(i.dueDate) < new Date())
                      .slice(0, 5)
                      .map(invoice => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium">{invoice.number}</p>
                            <p className="text-sm text-red-600">
                              Échue le {format(new Date(invoice.dueDate), "d MMM yyyy", { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{formatCurrency(invoice.total)}</p>
                            <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(invoice.id)}>
                              Marquer payée
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Toutes les factures</CardTitle>
                  <CardDescription>Gérez vos factures clients</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle facture
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{invoice.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.Client?.companyName || `${invoice.Client?.firstName || ""} ${invoice.Client?.lastName || ""}`.trim() || "Client inconnu"}
                          {invoice.Site && ` • ${invoice.Site.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(invoice.total)}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={`${invoiceStatusColors[invoice.status]} text-white`}>
                            {invoiceStatusLabels[invoice.status]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(invoice.createdAt), "d/MM/yy")}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status === "SENT" && (
                          <Button size="sm" onClick={() => handleMarkAsPaid(invoice.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Payée
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tous les devis</CardTitle>
                  <CardDescription>Gérez vos devis et propositions</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau devis
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun devis</p>
              ) : (
                <div className="space-y-3">
                  {quotes.map(quote => (
                    <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 rounded">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{quote.number}</p>
                          <p className="text-sm text-muted-foreground">
                            {quote.Client?.companyName || `${quote.Client?.firstName || ""} ${quote.Client?.lastName || ""}`.trim() || "Client inconnu"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(quote.total)}</p>
                          <p className="text-sm text-muted-foreground">
                            Valide jusqu'au {format(new Date(quote.validUntil), "d/MM/yy")}
                          </p>
                        </div>
                        <Badge variant={quote.status === "ACCEPTED" ? "default" : "secondary"}>
                          {quoteStatusLabels[quote.status]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dépenses</CardTitle>
                  <CardDescription>Suivez vos dépenses d'entreprise</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle dépense
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Euro className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Module de dépenses</p>
                <p className="text-sm">Ajoutez et suivez vos dépenses ici</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
