"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/language-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Code2, Trophy, Target, LogOut, Settings, Menu, X, Plus, FolderOpen } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import React from "react"

// Modular nav item
interface NavItemProps {
  href: string
  icon?: React.ElementType
  children: React.ReactNode
  onClick?: () => void
}

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, children, onClick }) => (
  <Link
    href={href}
    className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors font-medium"
    onClick={onClick}
  >
    {Icon && <Icon className="h-5 w-5 text-primary" />}
    <span>{children}</span>
  </Link>
)

interface DashboardNavProps {
  userRole?: string | null
  userName?: string | null
  userEmail?: string | null
  userImage?: string | null
}

export function DashboardNav({ userRole: propUserRole, userName: propUserName, userEmail: propUserEmail, userImage: propUserImage }: DashboardNavProps) {
  const router = useRouter()
  const t = useTranslations()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Estados para datos del usuario
  const [userRole, setUserRole] = useState<string | null>(propUserRole || null)
  const [userName, setUserName] = useState<string | null>(propUserName || null)
  const [userEmail, setUserEmail] = useState<string | null>(propUserEmail || null)
  const [userImage, setUserImage] = useState<string | null>(propUserImage || null)
  const [loading, setLoading] = useState(!propUserRole) // Solo carga si no hay props

  // Si no se pasan props, obtén del servidor
  useEffect(() => {
    if (propUserRole && propUserEmail) {
      // Ya tenemos los datos, no cargar
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const userData = await response.json()
          setUserRole(userData.role)
          setUserName(userData.name)
          setUserEmail(userData.email)
          setUserImage(userData.image)
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [propUserRole, propUserEmail])

  // Navigation items by role - Renderiza inmediatamente con props del servidor
  const getNavigation = () => {
    const base = [
      { name: t("nav.dashboard"), href: "/dashboard", icon: Target },
      { name: t("nav.challenges"), href: "/challenges", icon: Code2 },
      { name: t("nav.leaderboard"), href: "/leaderboard", icon: Trophy },
    ]
    // Solo añade opciones de creador si el rol es CREATOR
    if (userRole === 'CREATOR') {
      base.splice(2, 0,
        { name: t("nav.createChallenge"), href: "/challenges/create", icon: Plus },
        { name: t("nav.myChallenges"), href: "/challenges/manage", icon: FolderOpen }
      )
    }
    return base
  }
  const navigation = getNavigation()

  // Display name - Usa props del servidor directamente
  const getDisplayName = () => {
    if (!userEmail) return "User"
    if (userName && userName !== userEmail) return userName
    return userEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Mobile sidebar
  function MobileSidebar() {
    return (
      <aside className="fixed inset-0 z-50 flex md:hidden">
        <div className="fixed inset-0 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} />
        <nav className="relative w-64 bg-background h-full shadow-xl flex flex-col animate-slide-in-left">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-bold text-lg">SkillSprint</span>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {navigation.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} onClick={() => setIsMobileMenuOpen(false)}>
                {item.name}
              </NavItem>
            ))}
          </div>
          <div className="p-4 border-t flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userImage || ""} alt={getDisplayName()} />
              <AvatarFallback>{getDisplayName().charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{getDisplayName()}</p>
              <p className="text-xs text-muted-foreground capitalize">{userRole?.toLowerCase() || 'Participant'}</p>
            </div>
          </div>
        </nav>
      </aside>
    )
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Code2 className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg tracking-tight">SkillSprint</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navigation.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon}>
                {item.name}
              </NavItem>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-1">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userImage || ""} alt={getDisplayName()} />
                    <AvatarFallback>{getDisplayName().charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold">{getDisplayName()}</span>
                    <span className="text-xs text-muted-foreground break-all">{userEmail}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded capitalize w-fit mt-1">{userRole?.toLowerCase() || 'Participant'}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <span>{t("nav.profile")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {/* Mobile sidebar */}
      {isMobileMenuOpen && <MobileSidebar />}
    </header>
  )
}
