"use client"

import React, { useState } from 'react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, Settings, Trash2, AlertTriangle, Users
} from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: string
  points: number
  timeLimit: number
  startDate: Date
  endDate: Date
  status: string
  creatorId: string
  _count: {
    submissions: number
  }
}

interface ChallengeSettingsClientProps {
  challenge: Challenge
  translations: Record<string, any>
}

// Helper function for client-side translation
function translate(translations: Record<string, any>, key: string, params?: Record<string, any>): string {
  const keys = key.split('.')
  let value: any = translations
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  if (typeof value !== 'string') return key
  
  if (params) {
    return Object.entries(params).reduce(
      (str, [param, val]) => str.replace(new RegExp(`{{${param}}}`, 'g'), String(val)),
      value
    )
  }
  
  return value
}

export function ChallengeSettingsClient({
  challenge,
  translations
}: ChallengeSettingsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const t = (key: string, params?: Record<string, any>) => translate(translations, key, params)

  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [challengeStatus, setChallengeStatus] = useState(challenge.status)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'DRAFT': return 'secondary'  
      case 'COMPLETED': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusText = (status: string) => {
    return t(`challenges.status.${status.toLowerCase()}`)
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/challenges/${challenge.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      setChallengeStatus(newStatus)
      toast({
        title: t("settings.success.statusUpdated"),
        description: t("settings.success.statusUpdatedDesc"),
      })
      
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        variant: "destructive",
        title: t("settings.errors.statusUpdateFailed"),
        description: t("settings.errors.statusUpdateFailedDesc"),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChallenge = async () => {
    try {
      setDeleteLoading(true)
      
      const response = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete challenge')
      }

      toast({
        title: t("settings.success.deleted"),
        description: t("settings.success.deletedDesc"),
      })
      
      router.push('/challenges/manage')
    } catch (error) {
      console.error('Error deleting challenge:', error)
      toast({
        variant: "destructive",
        title: t("settings.errors.deleteFailed"),
        description: t("settings.errors.deleteFailedDesc"),
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href={`/challenges/${challenge.id}/edit`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("settings.backToEdit")}
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t("settings.title")}</h1>
                <p className="text-muted-foreground">
                  {t("settings.manageChallengeSettings")}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/challenges/${challenge.id}/submissions`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {t("settings.viewSubmissions")}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t("settings.statusManagement")}
                </CardTitle>
                <CardDescription>
                  {t("settings.statusManagementDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t("settings.currentStatus")}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("settings.currentStatusDesc")}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(challengeStatus)} className="text-sm">
                    {getStatusText(challengeStatus)}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="status-select">{t("settings.changeStatus")}</Label>
                  <Select
                    value={challengeStatus}
                    onValueChange={handleStatusChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">
                        {t("challenges.status.draft")}
                      </SelectItem>
                      <SelectItem value="ACTIVE">
                        {t("challenges.status.active")}
                      </SelectItem>
                      <SelectItem value="COMPLETED">
                        {t("challenges.status.completed")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.statusChangeDesc")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {t("settings.dangerZone")}
                </CardTitle>
                <CardDescription>
                  {t("settings.dangerZoneDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleteLoading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("settings.deleteChallenge")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("settings.deleteConfirmTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("settings.deleteConfirmDesc", { 
                          title: challenge.title,
                          submissions: challenge._count.submissions 
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteChallenge}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteLoading ? t("common.deleting") : t("settings.deleteConfirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
