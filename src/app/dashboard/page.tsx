"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, Building2, Calendar, CreditCard, TrendingUp, 
  Clock, CheckCircle, AlertCircle, ArrowRight, Plus,
  Euro, UserCheck, Activity
} from "lucide-react"
import Link from "next/link"
import { getDashboardStats } from "@/actions/reporting"

interface DashboardStats {
  employees: { total: number; active: number }
  clients: { total: number; active: number }
  sites: { total: number }
  sessions: { thisWeek: number; thisMonth: number; completed: number }
  revenue: { monthly: number }
  pendingTasks: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated" && session) {
      loadStats()
    }
  }, [status, session])

  const loadStats = async () => {
    const data = await getDashboardStats()
    setStats(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-16 bg-gray-100 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR"
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {session?.user?.name || session?.user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Planning
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/sites">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau site
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/clients")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients actifs</p>
                <p className="text-3xl font-bold">{stats?.clients.active || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  sur {stats?.clients.total || 0} total
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/employees")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employés</p>
                <p className="text-3xl font-bold">{stats?.employees.active || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  sur {stats?.employees.total || 0} total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/sites")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sites</p>
                <p className="text-3xl font-bold">{stats?.sites.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sites actifs
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/finance")}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CA du mois</p>
                <p className="text-3xl font-bold">{formatCurrency(stats?.revenue.monthly || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Factures payées
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <Euro className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sessions this week */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Activité de la semaine</CardTitle>
              <CardDescription>Sessions planifiées et complétées</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/calendar">
                Voir tout <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.sessions.thisWeek || 0}</p>
                  <p className="text-sm text-muted-foreground">Cette semaine</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.sessions.completed || 0}</p>
                  <p className="text-sm text-muted-foreground">Complétées</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-full">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.pendingTasks || 0}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taux de complétion</span>
                <span className="font-medium">
                  {stats?.sessions.thisWeek 
                    ? Math.round((stats.sessions.completed / stats.sessions.thisWeek) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ 
                    width: `${stats?.sessions.thisWeek 
                      ? Math.round((stats.sessions.completed / stats.sessions.thisWeek) * 100) 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Raccourcis vers les fonctions principales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/sites">
                <Building2 className="h-4 w-4 mr-2" />
                Gérer les sites
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/employees">
                <Users className="h-4 w-4 mr-2" />
                Gérer les employés
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/clients">
                <Users className="h-4 w-4 mr-2" />
                Gérer les clients
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/finance">
                <CreditCard className="h-4 w-4 mr-2" />
                Facturation
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/reports">
                <Activity className="h-4 w-4 mr-2" />
                Rapports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              À traiter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.pendingTasks ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm">Sessions en attente</span>
                    <Badge variant="secondary">{stats.pendingTasks}</Badge>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucun élément en attente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Conseils
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                💡 <strong>Conseil :</strong> Utilisez le calendrier pour planifier vos sessions récurrentes 
                et gagner du temps sur la gestion de votre planning.
              </p>
              <p>
                📊 <strong>Stats :</strong> Consultez les rapports pour suivre la performance de vos employés 
                et la satisfaction de vos clients.
              </p>
              <p>
                📱 <strong>QR Code :</strong> Imprimez les QR codes de vos sites pour permettre aux employés 
                de scanner facilement à leur arrivée.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
