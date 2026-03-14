"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, Phone, Mail, MapPin, Clock, Star, 
  CheckCircle, Calendar, FileText, TrendingUp,
  Loader2, Edit, User, Award
} from "lucide-react"
import { getEmployee, getEmployeePerformance } from "@/actions/employee"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface EmployeeData {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string
  address: string | null
  hourlyRate: number | null
  status: string
  hireDate: Date | null
  skills: string | null
  languages: string | null
  notes: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  Availabilities: { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }[]
  Documents: { id: string; type: string; name: string; fileUrl: string; expiryDate: Date | null; isVerified: boolean }[]
  Leaves: { id: string; type: string; startDate: Date; endDate: Date; status: string }[]
  Sessions: { id: string; status: string; qualityScore: number | null; Site: { name: string } }[]
  TimeEntries: { id: string; date: Date; clockIn: Date; clockOut: Date | null; totalMinutes: number | null }[]
  _count: { Sessions: number; TimeEntries: number }
}

interface Performance {
  totalSessions: number
  completedSessions: number
  completionRate: number
  avgQuality: number
  avgRating: number
  avgDuration: number
  punctualityRate: number
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

const dayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

export default function EmployeeDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { status } = useSession()
  const [employee, setEmployee] = useState<EmployeeData | null>(null)
  const [performance, setPerformance] = useState<Performance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated" && id) {
      loadData()
    }
  }, [status, id])

  const loadData = async () => {
    setLoading(true)
    const [empData, perfData] = await Promise.all([
      getEmployee(id as string),
      getEmployeePerformance(id as string)
    ])
    setEmployee(empData as EmployeeData)
    setPerformance(perfData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Employé non trouvé</h3>
        <Button variant="outline" onClick={() => router.push("/dashboard/employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/employees")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-2xl">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{employee.firstName} {employee.lastName}</h1>
                <Badge className={`${statusColors[employee.status]} text-white`}>
                  {statusLabels[employee.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
                {employee.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    <span>{employee.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phone}</span>
                </div>
                {employee.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{employee.address}</span>
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
              <p className="text-3xl font-bold">{performance?.totalSessions || 0}</p>
              <p className="text-sm text-muted-foreground">Missions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {Math.round(performance?.completionRate || 0)}%
              </p>
              <p className="text-sm text-muted-foreground">Taux de complétion</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {performance?.avgQuality.toFixed(1) || "-"}
              </p>
              <p className="text-sm text-muted-foreground">Note qualité</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {Math.round(performance?.punctualityRate || 0)}%
              </p>
              <p className="text-sm text-muted-foreground">Ponctualité</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="availability">Disponibilités</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Indicateurs de performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Taux de complétion</span>
                    <span className="text-sm text-muted-foreground">{Math.round(performance?.completionRate || 0)}%</span>
                  </div>
                  <Progress value={performance?.completionRate || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Ponctualité</span>
                    <span className="text-sm text-muted-foreground">{Math.round(performance?.punctualityRate || 0)}%</span>
                  </div>
                  <Progress value={performance?.punctualityRate || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Qualité moyenne</span>
                    <span className="text-sm text-muted-foreground">{performance?.avgQuality.toFixed(1) || 0}/5</span>
                  </div>
                  <Progress value={(performance?.avgQuality || 0) * 20} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Note client moyenne</span>
                    <span className="text-sm text-muted-foreground">{performance?.avgRating.toFixed(1) || 0}/5</span>
                  </div>
                  <Progress value={(performance?.avgRating || 0) * 20} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compétences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Compétences</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.skills ? (
                        JSON.parse(employee.skills).map((skill: string, i: number) => (
                          <Badge key={i} variant="secondary">{skill}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Non renseignées</span>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Langues parlées</h4>
                    <div className="flex flex-wrap gap-2">
                      {employee.languages ? (
                        JSON.parse(employee.languages).map((lang: string, i: number) => (
                          <Badge key={i} variant="outline">{lang}</Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Non renseignées</span>
                      )}
                    </div>
                  </div>
                  {employee.hourlyRate && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Taux horaire</span>
                        <span className="text-lg font-bold">{employee.hourlyRate}€/h</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Disponibilités hebdomadaires</CardTitle>
              <CardDescription>Jours et horaires de travail</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {dayLabels.slice(1).concat(dayLabels[0]).map((day, index) => {
                  const dayNum = index === 6 ? 0 : index + 1
                  const avail = employee.Availabilities.find(a => a.dayOfWeek === dayNum)
                  return (
                    <div key={dayNum} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium w-12">{day}</span>
                      {avail?.isAvailable ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {avail.startTime} - {avail.endTime}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                          Non disponible
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>

              {employee.Leaves && employee.Leaves.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <h4 className="font-medium mb-4">Congés planifiés</h4>
                  <div className="space-y-2">
                    {employee.Leaves.map(leave => (
                      <div key={leave.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div>
                          <span className="font-medium">{leave.type}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {format(new Date(leave.startDate), "d MMM", { locale: fr })} - {format(new Date(leave.endDate), "d MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                        <Badge variant={leave.status === "APPROVED" ? "default" : "secondary"}>
                          {leave.status === "APPROVED" ? "Approuvé" : leave.status === "PENDING" ? "En attente" : "Refusé"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Contrats, certifications et autres documents</CardDescription>
                </div>
                <Button size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {employee.Documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun document
                </div>
              ) : (
                <div className="space-y-2">
                  {employee.Documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.expiryDate && (
                          <span className="text-sm text-muted-foreground">
                            Exp: {format(new Date(doc.expiryDate), "d/MM/yy")}
                          </span>
                        )}
                        <Badge variant={doc.isVerified ? "default" : "secondary"}>
                          {doc.isVerified ? "Vérifié" : "Non vérifié"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Missions récentes</CardTitle>
              </CardHeader>
              <CardContent>
                {employee.Sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune mission
                  </div>
                ) : (
                  <div className="space-y-2">
                    {employee.Sessions.slice(0, 10).map(session => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{session.Site?.name || "Site inconnu"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">{session.status}</Badge>
                            {session.qualityScore && (
                              <span className="text-sm text-muted-foreground">
                                <Star className="h-3 w-3 inline mr-1" />
                                {session.qualityScore}/5
                              </span>
                            )}
                          </div>
                        </div>
                        <CheckCircle className={`h-5 w-5 ${session.status === "COMPLETED" ? "text-green-500" : "text-gray-300"}`} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pointages récents</CardTitle>
              </CardHeader>
              <CardContent>
                {employee.TimeEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun pointage
                  </div>
                ) : (
                  <div className="space-y-2">
                    {employee.TimeEntries.slice(0, 10).map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{format(new Date(entry.date), "EEEE d MMMM", { locale: fr })}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(entry.clockIn), "HH:mm")}
                            {entry.clockOut && ` - ${format(new Date(entry.clockOut), "HH:mm")}`}
                          </p>
                        </div>
                        {entry.totalMinutes && (
                          <span className="text-lg font-bold">
                            {Math.floor(entry.totalMinutes / 60)}h{entry.totalMinutes % 60}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
