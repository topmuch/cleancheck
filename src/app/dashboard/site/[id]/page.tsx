"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Site, Task, CleaningSession } from "@/types/database"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  QrCode,
  Clock,
  CheckCircle,
  Loader2,
  MapPin,
} from "lucide-react"

interface SessionWithTasks extends CleaningSession {
  sessionTasks: {
    taskId: string
    completed: boolean
  }[]
}

interface SiteWithDetails extends Site {
  tasks: Task[]
  sessions: SessionWithTasks[]
}

export default function SiteDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { status } = useSession()
  const [site, setSite] = useState<SiteWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  // Formulaire nouvelle tâche
  const [taskForm, setTaskForm] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && id) {
      fetchSite()
    }
  }, [status, id])

  const fetchSite = async () => {
    try {
      const response = await fetch(`/api/sites/${id}`)
      const data = await response.json()

      if (response.ok) {
        setSite(data.site as SiteWithDetails)
      } else {
        toast.error("Site non trouvé")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskForm.name.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: id,
          name: taskForm.name,
          description: taskForm.description || null,
        }),
      })

      if (response.ok) {
        toast.success("Tâche ajoutée")
        setTaskForm({ name: "", description: "" })
        setDialogOpen(false)
        fetchSite()
      } else {
        const data = await response.json()
        toast.error(data.error || "Erreur lors de l'ajout")
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return

    try {
      const response = await fetch(`/api/tasks?id=${deleteTaskId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Tâche supprimée")
        setDeleteTaskId(null)
        fetchSite()
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handlePrintQR = () => {
    if (!qrRef.current) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const qrContent = qrRef.current.innerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${site?.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #3B82F6;
              border-radius: 16px;
              padding: 32px;
              max-width: 400px;
            }
            h1 {
              margin: 0 0 8px 0;
              font-size: 24px;
              color: #1F2937;
            }
            .address {
              color: #6B7280;
              margin-bottom: 24px;
              font-size: 14px;
            }
            .qr-container {
              margin: 16px 0;
            }
            .instructions {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #E5E7EB;
              color: #374151;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${site?.name}</h1>
            ${site?.address ? `<p class="address">${site.address}</p>` : ""}
            <div class="qr-container">
              ${qrContent}
            </div>
            <p class="instructions">
              Scannez ce QR Code pour démarrer une intervention de ménage
            </p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}min`
  }

  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!site) return null

  const qrUrl = `${window.location.origin}/mission/${site.qrToken}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{site.name}</h1>
            {site.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {site.address}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="tasks">Tâches</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          {/* Onglet Tâches */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Liste des tâches</h2>
                <p className="text-muted-foreground">
                  Définissez les tâches à effectuer lors de chaque intervention
                </p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une tâche
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateTask}>
                    <DialogHeader>
                      <DialogTitle>Nouvelle tâche</DialogTitle>
                      <DialogDescription>
                        Ajoutez une tâche à effectuer pour ce site
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="taskName">Nom de la tâche *</Label>
                        <Input
                          id="taskName"
                          placeholder="Ex: Nettoyage des sols"
                          value={taskForm.name}
                          onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taskDesc">Description</Label>
                        <Textarea
                          id="taskDesc"
                          placeholder="Instructions détaillées..."
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" className="bg-blue-500 hover:bg-blue-600" disabled={submitting}>
                        {submitting ? "Ajout..." : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {site.tasks.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucune tâche définie</h3>
                  <p className="text-muted-foreground mb-6">
                    Définissez les tâches à effectuer pour ce site.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une tâche
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {site.tasks.map((task, index) => (
                  <Card key={task.id} className="hover:border-blue-200 transition-colors">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="text-muted-foreground font-medium w-8">
                        {index + 1}.
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{task.name}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTaskId(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Onglet QR Code */}
          <TabsContent value="qrcode" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code du site
                </CardTitle>
                <CardDescription>
                  Affichez ce QR Code à l'entrée du site pour que les intervenants puissent le scanner
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <div ref={qrRef} className="p-6 bg-white border-2 rounded-xl">
                  <QRCodeSVG
                    value={qrUrl}
                    size={256}
                    level="H"
                    includeMargin
                    fgColor="#1F2937"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    URL: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{qrUrl}</code>
                  </p>
                  <Button onClick={handlePrintQR} variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Imprimer le QR Code
                  </Button>
                </div>
                {site.pinCode && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <p className="text-sm text-yellow-800">
                      <strong>PIN de sécurité:</strong> {site.pinCode}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Ce code sera demandé aux intervenants lors du check-in
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="history" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Historique des interventions</h2>
              <p className="text-muted-foreground">
                Consultez l'historique des interventions passées
              </p>
            </div>

            {site.sessions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucune intervention</h3>
                  <p className="text-muted-foreground">
                    Les interventions apparaîtront ici après le premier scan du QR Code
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {site.sessions.map((session) => (
                  <Card key={session.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{session.workerName}</span>
                            <Badge variant={session.status === "COMPLETED" ? "default" : "secondary"}>
                              {session.status === "COMPLETED" ? "Terminé" : "En cours"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.startTime)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDuration(session.durationSeconds)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.sessionTasks.filter(t => t.completed).length}/{session.sessionTasks.length} tâches
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La tâche sera supprimée de la liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
