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
    <nav className="glass-nav sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="bg-primary liquid-border p-2.5 glass-elevated">
              <Code2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SkillSprint</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300 px-3 py-2 liquid-border hover:bg-accent/20"
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={userInfo?.name || userInfo?.email || ""} />
                    <AvatarFallback>
                      {getDisplayName().charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{userInfo?.email || user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <Target className="mr-2 h-4 w-4" />
                    {t("nav.dashboard")}
                  </Link>
                </DropdownMenuItem>
                {userInfo?.role === 'CREATOR' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/challenges/create" className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("nav.createChallenge")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/challenges/manage" className="flex items-center">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {t("nav.myChallenges")}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
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
