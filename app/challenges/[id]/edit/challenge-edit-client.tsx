"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CalendarIcon, Save, ArrowLeft, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { DashboardNav } from "@/components/dashboard-nav"
import { toast } from "sonner"
import type { ChallengeDetail } from "@/lib/types"

interface ChallengeEditClientProps {
  challenge: ChallengeDetail
  userId: string
  translations: Record<string, any>
}

export function ChallengeEditClient({ challenge, userId, translations }: ChallengeEditClientProps) {
  const router = useRouter()
  
  // Helper function for client-side translation
  function translate(key: string, params?: Record<string, any>): string {
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

  const t = translate

  // Form state
  const [formData, setFormData] = useState({
    title: challenge.title || '',
    description: challenge.description || '',
    difficulty: challenge.difficulty || 'EASY',
    points: challenge.points || 100,
    timeLimit: challenge.timeLimit || 300,
    startDate: challenge.startDate ? new Date(challenge.startDate) : new Date(),
    endDate: challenge.endDate ? new Date(challenge.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form validation
  const isValid = formData.title.trim().length >= 3 && 
                   formData.description.trim().length >= 10 &&
                   formData.points >= 10 && formData.points <= 1000 &&
                   formData.timeLimit >= 1 && formData.timeLimit <= 3600 &&
                   formData.endDate > formData.startDate

  const handleSave = useCallback(async () => {
    if (!isValid) {
      setError(t("edit.validationError") || "Please fill all fields correctly")
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          difficulty: formData.difficulty,
          points: formData.points,
          timeLimit: formData.timeLimit,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString()
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update challenge')
      }

      setSuccess(t("edit.updateSuccess") || "Challenge updated successfully!")
      toast.success(t("edit.updateSuccess") || "Challenge updated successfully!")
      
      setTimeout(() => {
        router.push("/challenges/manage")
      }, 1500)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t("edit.updateError") || "Failed to update challenge"
      setError(errorMsg)
      toast.error(errorMsg)
      console.error("Error updating challenge:", err)
    } finally {
      setIsSaving(false)
    }
  }, [challenge.id, formData, isValid, router, t])

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />

      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link 
              href="/challenges/manage"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2 sm:mb-0 w-fit"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("settings.backToChallenges") || "Back to Your Challenges"}
            </Link>
            <Badge variant={challenge.status === 'DRAFT' ? 'secondary' : 'default'}>
              {challenge.status}
            </Badge>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{t("edit.title") || "Edit Challenge"}</h1>
            <p className="text-muted-foreground">{t("edit.description") || "Update your challenge details"}</p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Challenge Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("edit.basicInfo") || "Basic Information"}</CardTitle>
              <CardDescription>{t("edit.basicInfoDesc") || "Update the fundamental details about your challenge"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">{t("edit.title") || "Title"}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Fibonacci Sequence"
                  className="mt-2"
                  minLength={3}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.title.length}/200 {t("submit.characters") || "characters"}
                </p>
              </div>

              <div>
                <Label htmlFor="description">{t("edit.description") || "Description"}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the problem, what users need to do, and the expected output..."
                  className="mt-2 min-h-32 md:min-h-48 font-mono text-sm"
                  minLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.description.length} {t("submit.characters") || "characters"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>{t("edit.configuration") || "Configuration"}</CardTitle>
              <CardDescription>{t("edit.configDesc") || "Set difficulty, points, and time limit"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">{t("challenges.filters.difficulty") || "Difficulty"}</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value as any })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">{t("challenges.difficulty.easy") || "Easy"}</SelectItem>
                      <SelectItem value="MEDIUM">{t("challenges.difficulty.medium") || "Medium"}</SelectItem>
                      <SelectItem value="HARD">{t("challenges.difficulty.hard") || "Hard"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    min={10}
                    max={1000}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Min: 10, Max: 1000</p>
                </div>

                <div>
                  <Label htmlFor="timeLimit">{t("edit.timeLimit") || "Time Limit (seconds)"}</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                    min={1}
                    max={3600}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">1 second - 1 hour</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>{t("edit.dates") || "Challenge Dates"}</CardTitle>
              <CardDescription>{t("edit.datesDesc") || "When the challenge starts and ends"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t("edit.startDate") || "Start Date"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal mt-2", !formData.startDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : t("edit.pickDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData({ ...formData, startDate: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>{t("edit.endDate") || "End Date"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal mt-2", !formData.endDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : t("edit.pickDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData({ ...formData, endDate: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => router.push("/challenges/manage")}
              className="w-full sm:w-auto"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !isValid}
              className="w-full sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.saving") || "Saving..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("edit.saveChanges") || "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
