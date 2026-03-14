import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // L'utilisateur est authentifié, continuer
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Routes publiques (pas besoin d'authentification)
        const publicPaths = [
          "/",
          "/login",
          "/signup",
          "/mission",
          "/work",
          "/checkout",
          "/api/auth",
          "/api/mission",
          "/api/sessions",
          "/api/session-tasks",
          "/api/register"
        ]
        
        const isPublicPath = publicPaths.some(path => 
          pathname === path || 
          pathname.startsWith(`${path}/`)
        )

        // Permettre l'accès aux routes publiques
        if (isPublicPath) {
          return true
        }

        // Pour les routes protégées, vérifier le token
        return !!token
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
