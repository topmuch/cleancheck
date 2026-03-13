"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  Loader2, LogOut, User, Menu, 
  Home, Users, Building2, CreditCard, Calendar, 
  FileText, BarChart3, Settings, Bell, QrCode
} from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: Home },
  { name: "Sites", href: "/dashboard/sites", icon: Building2 },
  { name: "Calendrier", href: "/dashboard/calendar", icon: Calendar },
  { name: "Employés", href: "/dashboard/employees", icon: Users },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Finance", href: "/dashboard/finance", icon: CreditCard },
  { name: "Rapports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated" || !session) {
    return null
  }

  const roleLabels: Record<string, string> = {
    SUPERADMIN: "Super Admin",
    AGENCY: "Agence",
    MANAGER: "Manager",
    EMPLOYEE: "Employé",
    OWNER: "Propriétaire"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r pt-5 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 mb-5">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">C</span>
            </div>
            <span className="text-xl font-bold">CleanCheck</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.user?.name || session.user?.email}
                </p>
                {session.user?.role && (
                  <Badge variant="secondary" className="text-xs">
                    {roleLabels[session.user.role] || session.user.role}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 p-4 border-b">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl font-bold">C</span>
                  </div>
                  <span className="text-xl font-bold">CleanCheck</span>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== "/dashboard" && pathname.startsWith(item.href))
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
                <div className="p-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="font-bold">CleanCheck</span>
          </div>

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
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
