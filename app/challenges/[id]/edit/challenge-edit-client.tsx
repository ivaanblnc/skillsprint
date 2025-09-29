"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Plus, Trash2, Save, ArrowLeft, FileText, BarChart3, Settings, Eye } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n"
import { toast } from "sonner"
import { Challenge, TestCase } from "@/lib/types"
import { useChallengeForm, useTestCases, useChallengeActions } from "@/lib/hooks"

interface ChallengeEditClientProps {
  challenge: Challenge
  testCases: TestCase[]
  translations: Record<string, any>
}

export function ChallengeEditClient({ challenge, testCases, translations }: ChallengeEditClientProps) {
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
  const { loading: actionsLoading, updateChallengeStatus } = useChallengeActions()

  // Initialize form with challenge data
  const challengeForm = useChallengeForm({
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty,
    points: challenge.points,
    timeLimit: challenge.timeLimit,
    startDate: challenge.startDate ? new Date(challenge.startDate) : new Date(),
    endDate: challenge.endDate ? new Date(challenge.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  const testCaseManager = useTestCases(testCases.map(tc => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    isPublic: tc.isPublic
  })))

  const [saving, setSaving] = useState(false)

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case "EASY": return "secondary"
      case "MEDIUM": return "default"
      case "HARD": return "destructive"
      default: return "default"
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "DRAFT": return "secondary"
      case "ACTIVE": return "default"
      case "COMPLETED": return "outline"
      case "CANCELLED": return "destructive"
      default: return "default"
    }
  }

  const handleSave = async () => {
    if (!challengeForm.validate()) {
      toast.error(t("edit.validationError"))
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/challenges/${challenge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...challengeForm.values,
          testCases: testCaseManager.testCases
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update challenge')
      }

      toast.success(t("edit.updateSuccess"))
      router.push("/challenges/manage")
    } catch (error) {
      console.error("Error updating challenge:", error)
      toast.error(error instanceof Error ? error.message : t("edit.updateError"))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateChallengeStatus(challenge.id, newStatus)
      toast.success(t("edit.statusUpdateSuccess"))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("edit.statusUpdateError"))
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/challenges/manage" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("edit.backToManage")}
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("edit.title")}</h1>
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground">{t("edit.updateDetails")}</p>
            <Badge variant={getDifficultyVariant(challenge.difficulty)}>
              {t(`challenges.difficulty.${challenge.difficulty.toLowerCase()}`)}
            </Badge>
            <Badge variant={getStatusVariant(challenge.status)}>
              {t(`challenges.status.${challenge.status.toLowerCase()}`)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Challenge Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Link href={`/challenges/${challenge.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                {t("edit.viewChallenge")}
              </Button>
            </Link>
            <Link href={`/challenges/${challenge.id}/submissions`}>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                {t("edit.viewSubmissions")}
                {challenge._count?.submissions && challenge._count.submissions > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs">
                    {challenge._count.submissions}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href={`/challenges/${challenge.id}/analytics`}>
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                {t("edit.viewAnalytics")}
              </Button>
            </Link>
            <Link href={`/challenges/${challenge.id}/settings`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                {t("edit.settings")}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("edit.basicInfo")}</CardTitle>
            <CardDescription>{t("edit.updateBasicDetails")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">{t("edit.challengeTitle")}</Label>
              <Input
                id="title"
                value={challengeForm.values.title}
                onChange={(e) => challengeForm.setValue("title", e.target.value)}
                onBlur={() => challengeForm.markTouched("title")}
                placeholder={t("edit.titlePlaceholder")}
                className={challengeForm.errors.title && challengeForm.touched.title ? "border-destructive" : ""}
              />
              {challengeForm.errors.title && challengeForm.touched.title && (
                <p className="text-sm text-destructive mt-1">{challengeForm.errors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">{t("edit.description")}</Label>
              <Textarea
                id="description"
                value={challengeForm.values.description}
                onChange={(e) => challengeForm.setValue("description", e.target.value)}
                onBlur={() => challengeForm.markTouched("description")}
                placeholder={t("edit.descriptionPlaceholder")}
                className={`min-h-[100px] ${challengeForm.errors.description && challengeForm.touched.description ? "border-destructive" : ""}`}
              />
              {challengeForm.errors.description && challengeForm.touched.description && (
                <p className="text-sm text-destructive mt-1">{challengeForm.errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="difficulty">{t("edit.difficulty")}</Label>
                <Select
                  value={challengeForm.values.difficulty}
                  onValueChange={(value) => challengeForm.setValue("difficulty", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("edit.selectDifficulty")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">{t("edit.easy")}</SelectItem>
                    <SelectItem value="MEDIUM">{t("edit.medium")}</SelectItem>
                    <SelectItem value="HARD">{t("edit.hard")}</SelectItem>
                  </SelectContent>
                </Select>
                {challengeForm.errors.difficulty && challengeForm.touched.difficulty && (
                  <p className="text-sm text-destructive mt-1">{challengeForm.errors.difficulty}</p>
                )}
              </div>

              <div>
                <Label htmlFor="points">{t("edit.points")}</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={challengeForm.values.points}
                  onChange={(e) => challengeForm.setValue("points", parseInt(e.target.value) || 0)}
                  onBlur={() => challengeForm.markTouched("points")}
                  className={challengeForm.errors.points && challengeForm.touched.points ? "border-destructive" : ""}
                />
                {challengeForm.errors.points && challengeForm.touched.points && (
                  <p className="text-sm text-destructive mt-1">{challengeForm.errors.points}</p>
                )}
              </div>

              <div>
                <Label htmlFor="timeLimit">{t("edit.timeLimit")}</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  value={challengeForm.values.timeLimit}
                  onChange={(e) => challengeForm.setValue("timeLimit", parseInt(e.target.value) || 0)}
                  onBlur={() => challengeForm.markTouched("timeLimit")}
                  className={challengeForm.errors.timeLimit && challengeForm.touched.timeLimit ? "border-destructive" : ""}
                />
                {challengeForm.errors.timeLimit && challengeForm.touched.timeLimit && (
                  <p className="text-sm text-destructive mt-1">{challengeForm.errors.timeLimit}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Cases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("edit.testCases")}</CardTitle>
                <CardDescription>{t("edit.updateTestCases")}</CardDescription>
              </div>
              <Button onClick={testCaseManager.addTestCase} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("edit.addTestCase")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {testCaseManager.testCases.map((testCase, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t("edit.testCase")} {index + 1}</h4>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={testCase.isPublic}
                        onChange={(e) => testCaseManager.updateTestCase(index, 'isPublic', e.target.checked)}
                        className="rounded"
                      />
                      {t("edit.publicTest")}
                    </label>
                    {testCaseManager.testCases.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => testCaseManager.removeTestCase(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("edit.input")}</Label>
                    <Textarea
                      value={testCase.input}
                      onChange={(e) => testCaseManager.updateTestCase(index, 'input', e.target.value)}
                      placeholder={t("edit.enterTestInput")}
                      className="min-h-[80px] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label>{t("edit.expectedOutput")}</Label>
                    <Textarea
                      value={testCase.expectedOutput}
                      onChange={(e) => testCaseManager.updateTestCase(index, 'expectedOutput', e.target.value)}
                      placeholder={t("edit.enterExpectedOutput")}
                      className="min-h-[80px] font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            {challengeForm.errors.testCases && (
              <p className="text-sm text-destructive">{challengeForm.errors.testCases}</p>
            )}
          </CardContent>
        </Card>

        {/* Challenge Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t("edit.challengeStatus")}</CardTitle>
            <CardDescription>{t("edit.currentStatus")}: <Badge variant={getStatusVariant(challenge.status)}>{t(`challenges.status.${challenge.status.toLowerCase()}`)}</Badge></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {challenge.status === 'DRAFT' && (
                <Button onClick={() => handleStatusChange('ACTIVE')} disabled={actionsLoading}>
                  {t("challenges.status.activate")}
                </Button>
              )}
              {challenge.status === 'ACTIVE' && (
                <>
                  <Button onClick={() => handleStatusChange('COMPLETED')} disabled={actionsLoading}>
                    {t("challenges.status.complete")}
                  </Button>
                  <Button onClick={() => handleStatusChange('CANCELLED')} variant="destructive" disabled={actionsLoading}>
                    {t("challenges.status.cancel")}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>{t("edit.schedule")}</CardTitle>
            <CardDescription>{t("edit.updateSchedule")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{t("edit.startDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !challengeForm.values.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {challengeForm.values.startDate ? format(challengeForm.values.startDate, "PPP") : t("edit.pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={challengeForm.values.startDate}
                      onSelect={(date) => challengeForm.setValue("startDate", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>{t("edit.endDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !challengeForm.values.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {challengeForm.values.endDate ? format(challengeForm.values.endDate, "PPP") : t("edit.pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={challengeForm.values.endDate}
                      onSelect={(date) => challengeForm.setValue("endDate", date || new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push("/challenges/manage")}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || !challengeForm.isValid}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? t("common.saving") : t("edit.saveChanges")}
          </Button>
        </div>
      </div>
    </div>
  )
}
