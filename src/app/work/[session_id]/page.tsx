"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Task, SessionTask } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, Clock, CheckCircle, MapPin, ArrowRight } from "lucide-react"
import { toast } from "sonner"

interface TaskWithSessionTask extends Task {
  sessionTaskId: string
  completed: boolean
}

interface SessionData {
  id: string
  siteId: string
  workerName: string
  startTime: Date | string
  status: string
  site: {
    name: string
    address: string | null
  }
  sessionTasks: {
    id: string
    taskId: string
    completed: boolean
    task: Task | null
  }[]
}

export default function WorkPage() {
  const { session_id } = useParams()
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [tasks, setTasks] = useState<TaskWithSessionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Timer
  useEffect(() => {
    if (!session) return

    const startTime = new Date(session.startTime).getTime()

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    fetchSession()
  }, [session_id])

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${session_id}`)
      const data = await response.json()

      if (response.ok) {
        if (data.session.status === "COMPLETED") {
          router.push(`/checkout/${session_id}`)
          return
        }

        setSession(data.session)

        const formattedTasks: TaskWithSessionTask[] = (data.session.sessionTasks || [])
          .filter((st: any) => st.task)
          .map((st: any) => ({
            id: st.task.id,
            name: st.task.name,
            description: st.task.description,
            orderIndex: st.task.orderIndex,
            siteId: data.session.siteId,
            isActive: true,
            createdAt: st.task.createdAt,
            updatedAt: st.task.updatedAt,
            sessionTaskId: st.id,
            completed: st.completed,
          }))

        setTasks(formattedTasks)
      } else {
        toast.error("Session non trouvée")
        router.push("/")
      }
    } catch (err) {
      console.error("Erreur:", err)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (taskId: string, sessionTaskId: string, currentCompleted: boolean) => {
    try {
      const response = await fetch(`/api/session-tasks/${sessionTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentCompleted }),
      })

      if (response.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, completed: !currentCompleted } : t
          )
        )
      } else {
        toast.error("Erreur lors de la mise à jour")
      }
    } catch (err) {
      console.error("Erreur:", err)
      toast.error("Erreur lors de la mise à jour")
    }
  }

  const handleFinish = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/sessions/${session_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      })

      if (response.ok) {
        router.push(`/checkout/${session_id}`)
      } else {
        toast.error("Erreur lors de la finalisation")
      }
    } catch (err) {
      console.error("Erreur:", err)
      toast.error("Erreur lors de la finalisation")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header Timer */}
      <div className="bg-blue-500 text-white py-6 px-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">{session.site.name}</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Clock className="h-6 w-6" />
            <span className="text-4xl font-mono font-bold">{formatTime(elapsedTime)}</span>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            Intervenant: {session.workerName}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 h-2">
        <div
          className="bg-green-500 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tasks List */}
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tâches à effectuer</h2>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{tasks.length} terminées
          </span>
        </div>

        {tasks.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Aucune tâche définie pour ce site.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className={`transition-all ${
                  task.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white"
                }`}
              >
                <CardContent className="flex items-start gap-3 py-4">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() =>
                      handleToggleTask(task.id, task.sessionTaskId, task.completed)
                    }
                    className="mt-1 h-6 w-6"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={`task-${task.id}`}
                      className={`text-base font-medium cursor-pointer ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.name}
                    </Label>
                    {task.description && (
                      <p className={`text-sm mt-1 ${
                        task.completed ? "text-muted-foreground" : "text-muted-foreground"
                      }`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  {task.completed && (
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Finish Button */}
        <div className="mt-8 pb-8">
          <Button
            onClick={handleFinish}
            className="w-full h-14 text-lg bg-green-500 hover:bg-green-600"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Finalisation...
              </>
            ) : (
              <>
                Terminer la mission
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
