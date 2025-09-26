"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Code2, Trophy, Target, LogOut, Settings, Menu, X, Gavel, Plus, FolderOpen } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslations } from "@/lib/i18n"

export function DashboardNav() {
  const router = useRouter()
  const t = useTranslations()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<{name: string | null, email: string | null, role: string | null} | null>(null)
  const [loading, setLoading] = useState(true)


  // Dynamic navigation based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { name: t("nav.dashboard"), href: "/dashboard", icon: Target },
      { name: t("nav.challenges"), href: "/challenges", icon: Code2 },
      { name: t("nav.leaderboard"), href: "/leaderboard", icon: Trophy },
    ]
    
    // Add creator-specific navigation if user is a creator
    if (userInfo?.role === 'CREATOR') {
      baseNavigation.splice(2, 0, 
        { name: t("nav.createChallenge"), href: "/challenges/create", icon: Plus },
        { name: t("nav.myChallenges"), href: "/challenges/manage", icon: FolderOpen }
      )
    }
    
    return baseNavigation
  }

  const navigation = getNavigation()

  // Function to get display name from email
  const getDisplayName = () => {
    // If still loading, return loading state
    if (loading) {
      return "User"
    }
    
    // Use userInfo if available, otherwise fallback to user
    const name = userInfo?.name || user?.user_metadata?.name
    const email = userInfo?.email || user?.email
    
    // If we don't have email yet, return loading state
    if (!email) {
      return "User"
    }
    
    // If we have a name and it's different from email, use it
    if (name && name !== email) {
      return name
    }
    
    // If name is same as email or no name, generate from email
    const emailName = email.split('@')[0]
    // Replace dots and underscores with spaces and capitalize each word
    const displayName = emailName
      .replace(/[._]/g, ' ')
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    return displayName
  }



  // Initialize Supabase and get user
  useEffect(() => {
    const initializeAuth = async () => {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        
        // Fetch user info from database
        try {
          const response = await fetch('/api/user/profile')
          if (response.ok) {
            const userData = await response.json()
            setUserInfo(userData)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
      
      setLoading(false)
    }

    initializeAuth()
  }, [])

  return (
    <nav className="glass-nav-enhanced fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Enhanced Logo */}
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 liquid-border-lg blur-sm group-hover:blur-none transition-all duration-300"></div>
              <div className="relative bg-primary liquid-border-lg p-3 glass-elevated-lg group-hover:scale-105 transition-transform duration-300">
                <Code2 className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">SkillSprint</span>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">Code • Compete • Conquer</span>
            </div>
          </Link>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navigation.map((item, index) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group relative flex items-center gap-3 px-6 py-3 liquid-border-lg glass-nav-item transition-all duration-300 hover:glass-nav-item-hover"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 liquid-border-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Icon className="relative h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <span className="relative font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">{item.name}</span>
                  <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 liquid-border transition-all duration-300 group-hover:w-3/4 group-hover:-translate-x-1/2"></div>
                </Link>
              )
            })}
          </div>

          {/* Enhanced User Menu */}
          <div className="flex items-center gap-4">
            {/* Enhanced Language Switcher */}
            <div className="glass-nav-item liquid-border-lg p-2">
              <LanguageSwitcher />
            </div>

            {/* Enhanced Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden glass-nav-item liquid-border-lg p-3 hover:glass-nav-item-hover"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Enhanced User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative group">
                  <div className="flex items-center gap-3 glass-nav-item liquid-border-lg p-3 hover:glass-nav-item-hover transition-all duration-300">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-sm group-hover:blur-none transition-all duration-300"></div>
                      <Avatar className="relative h-10 w-10 liquid-border glass-elevated">
                        <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={userInfo?.name || userInfo?.email || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {getDisplayName().charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold text-foreground">{getDisplayName()}</p>
                      <p className="text-xs text-muted-foreground capitalize">{userInfo?.role?.toLowerCase() || 'Participant'}</p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 glass-dropdown liquid-border-lg p-2" align="end" forceMount>
                <DropdownMenuLabel className="glass-nav-item liquid-border p-4 mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 liquid-border glass-elevated">
                      <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={userInfo?.name || userInfo?.email || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                        {getDisplayName().charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-none mb-1 truncate">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-muted-foreground leading-none mb-1 break-all">{userInfo?.email || user?.email}</p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 liquid-border font-medium capitalize w-fit">
                        {userInfo?.role?.toLowerCase() || 'Participant'}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="glass-nav-item liquid-border p-3 mb-1 hover:glass-nav-item-hover">
                  <Link href="/dashboard" className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t("nav.dashboard")}</span>
                  </Link>
                </DropdownMenuItem>
                {userInfo?.role === 'CREATOR' && (
                  <>
                    <DropdownMenuItem asChild className="glass-nav-item liquid-border p-3 mb-1 hover:glass-nav-item-hover">
                      <Link href="/challenges/create" className="flex items-center gap-3">
                        <Plus className="h-4 w-4 text-primary" />
                        <span className="font-medium">{t("nav.createChallenge")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="glass-nav-item liquid-border p-3 mb-1 hover:glass-nav-item-hover">
                      <Link href="/challenges/manage" className="flex items-center gap-3">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <span className="font-medium">{t("nav.myChallenges")}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild className="glass-nav-item liquid-border p-3 mb-1 hover:glass-nav-item-hover">
                  <Link href="/profile" className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t("nav.profile")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  className="glass-nav-item liquid-border p-3 text-destructive hover:text-destructive-foreground hover:bg-destructive/90 transition-all duration-300"
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">{t("nav.signOut")}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-nav-item liquid-border-lg mt-4 p-4">
            <div className="space-y-3">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-4 p-4 glass-nav-item liquid-border hover:glass-nav-item-hover transition-all duration-300 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
