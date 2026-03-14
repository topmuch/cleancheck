"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts"
import { 
  Loader2, TrendingUp, TrendingDown, Euro, Users, Clock, 
  Star, CheckCircle, Download, Calendar
} from "lucide-react"
import { getDashboardStats, getRevenueReport, getEmployeePerformanceReport, getClientReport } from "@/actions/reporting"
import { format, subMonths } from "date-fns"
import { fr } from "date-fns/locale"

interface DashboardStats {
  employees: { total: number; active: number }
  clients: { total: number; active: number }
  sites: { total: number }
  sessions: { thisWeek: number; thisMonth: number; completed: number }
  revenue: { monthly: number }
  pendingTasks: number
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<"week" | "month" | "year">("month")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [clientData, setClientData] = useState<any>(null)

  useEffect(() => {
    if (status === "authenticated" && session) {
      loadData()
    }
  }, [status, session, period])

  const loadData = async () => {
    setLoading(true)
    const [statsData, revData, empData, cliData] = await Promise.all([
      getDashboardStats(),
      getRevenueReport(period),
      getEmployeePerformanceReport(),
      getClientReport()
    ])
    setStats(statsData)
    setRevenueData(revData)
    setEmployeeData(empData)
    setClientData(cliData)
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Prepare chart data
  const monthlyRevenueData = revenueData?.revenueByMonth 
    ? Object.entries(revenueData.revenueByMonth)
        .slice(-6)
        .map(([month, amount]) => ({
          month: format(new Date(month + "-01"), "MMM", { locale: fr }),
          revenus: amount
        }))
    : []

  const expenseByCategoryData = revenueData?.expensesByCategory
    ? Object.entries(revenueData.expensesByCategory).map(([category, amount], index) => ({
        name: category,
        value: amount,
        color: COLORS[index % COLORS.length]
      }))
    : []

  const employeePerformanceData = employeeData?.map((emp: any) => ({
    name: emp.name.split(" ")[0],
    missions: emp.totalSessions,
    qualite: emp.avgQuality * 20,
    completion: emp.completionRate
  })) || []

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
          <h1 className="text-3xl font-bold">Rapports</h1>
          <p className="text-muted-foreground">
            Analysez vos performances et statistiques
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                <p className="text-2xl font-bold">{formatCurrency(revenueData?.totalRevenue || 0)}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {period === "month" ? "Ce mois" : period === "year" ? "Cette année" : "Cette semaine"}
                </p>
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
                <p className="text-sm text-muted-foreground">Bénéfice net</p>
                <p className={`text-2xl font-bold ${(revenueData?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(revenueData?.profit || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Après dépenses
                </p>
              </div>
              <div className={`p-3 rounded-full ${(revenueData?.profit || 0) >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                {(revenueData?.profit || 0) >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Missions</p>
                <p className="text-2xl font-bold">{stats?.sessions.thisMonth || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.sessions.completed || 0} complétées
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de satisfaction</p>
                <p className="text-2xl font-bold">
                  {clientData?.stats?.retentionRate?.toFixed(0) || 0}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Rétention clients
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution du chiffre d'affaires</CardTitle>
            <CardDescription>Revenus mensuels sur les 6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), "Revenus"]}
                    labelStyle={{ color: "#333" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenus" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", strokeWidth: 2 }}
                    fill="url(#colorGradient)"
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des dépenses</CardTitle>
            <CardDescription>Par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {expenseByCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseByCategoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend 
                      formatter={(value) => <span className="text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune dépense enregistrée
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance des employés</CardTitle>
            <CardDescription>Missions et qualité par employé</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {employeePerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeePerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" stroke="#888" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="missions" fill="#3B82F6" name="Missions" />
                    <Bar dataKey="completion" fill="#10B981" name="Completion %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée d'employé
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques clients</CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">
                    {clientData?.stats?.active || 0}
                  </p>
                  <p className="text-sm text-green-700">Clients actifs</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">
                    {clientData?.stats?.prospects || 0}
                  </p>
                  <p className="text-sm text-blue-700">Prospects</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-600">
                    {clientData?.stats?.total || 0}
                  </p>
                  <p className="text-sm text-gray-700">Total clients</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">
                    {clientData?.stats?.retentionRate?.toFixed(0) || 0}%
                  </p>
                  <p className="text-sm text-purple-700">Taux de rétention</p>
                </div>
              </div>

              {/* Client List Preview */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Top clients</h4>
                <div className="space-y-2">
                  {clientData?.clients?.slice(0, 5).map((client: any) => (
                    <div key={client.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-sm text-muted-foreground">{formatCurrency(client.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
