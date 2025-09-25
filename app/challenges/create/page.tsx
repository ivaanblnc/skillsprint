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
import { CalendarIcon, Plus, Trash2, Save, Eye } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n"

interface TestCase {
  input: string
  expectedOutput: string
  isPublic: boolean
}

export default function CreateChallengePage() {
  const router = useRouter()
  const t = useTranslations()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "",
    points: 100,
    timeLimit: 30,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  })
  
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "", expectedOutput: "", isPublic: true }
  ])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTestCase = () => {
    setTestCases(prev => [...prev, { input: "", expectedOutput: "", isPublic: false }])
  }

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    setTestCases(prev => 
      prev.map((testCase, i) => 
        i === index ? { ...testCase, [field]: value } : testCase
      )
    )
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error(t("create.validationError"))
      return false
    }
    
    if (!formData.description.trim()) {
      toast.error(t("create.validationError"))
      return false
    }
    
    if (!formData.difficulty) {
      toast.error(t("create.validationError"))
      return false
    }
    
    if (formData.points <= 0) {
      toast.error(t("create.validationError"))
      return false
    }
    
    if (formData.timeLimit <= 0) {
      toast.error(t("create.validationError"))
      return false
    }
    
    if (formData.endDate <= formData.startDate) {
      toast.error(t("create.validationError"))
      return false
    }
    
    // Validate test cases
    const validTestCases = testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim())
    if (validTestCases.length === 0) {
      toast.error(t("create.mustHaveOneTestCase"))
      return false
    }
    
    return true
  }

  const handleSubmit = async (status: "DRAFT" | "ACTIVE") => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const validTestCases = testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim())
      
      const challengeData = {
        ...formData,
        status,
        testCases: validTestCases
      }
      
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(challengeData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create challenge")
      }
      
      const result = await response.json()
      
      toast.success(t("create.createSuccess"))
      router.push(`/challenges/manage`)
      
    } catch (error) {
      console.error("Error creating challenge:", error)
      toast.error(error instanceof Error ? error.message : t("create.createError"))
    } finally {
      setLoading(false)
    }
  }

  if (previewMode) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">{t("create.preview")}</h1>
              <Button onClick={() => setPreviewMode(false)} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                {t("create.editMode")}
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{formData.title || t("create.challengeTitle")}</CardTitle>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant={
                        formData.difficulty === "EASY" ? "secondary" :
                        formData.difficulty === "MEDIUM" ? "default" : "destructive"
                      }>
                        {formData.difficulty ? t(`challenges.difficulty.${formData.difficulty.toLowerCase()}`) : t("create.selectDifficulty")}
                      </Badge>
                      <Badge variant="outline">{formData.points} {t("create.points")}</Badge>
                      <Badge variant="outline">{formData.timeLimit} {t("create.minutes")}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">{t("create.description")}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {formData.description || t("create.descriptionPlaceholder")}
                    </p>
                  </div>
                  
                  {testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim()).length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">{t("create.testCasesTitle")}</h3>
                      <div className="space-y-4">
                        {testCases
                          .filter(tc => tc.input.trim() && tc.expectedOutput.trim())
                          .map((testCase, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{t("create.testCase")} {index + 1}</span>
                                {testCase.isPublic && <Badge variant="secondary">{t("create.public")}</Badge>}
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs">{t("create.input")}:</Label>
                                  <pre className="bg-muted p-3 rounded text-sm mt-1">
                                    <code>{testCase.input}</code>
                                  </pre>
                                </div>
                                <div>
                                  <Label className="text-xs">{t("create.expectedOutput")}:</Label>
                                  <pre className="bg-muted p-3 rounded text-sm mt-1">
                                    <code>{testCase.expectedOutput}</code>
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("create.newChallenge")}</h1>
              <p className="text-muted-foreground">{t("create.challengeDetails")}</p>
            </div>
            <Button onClick={() => setPreviewMode(true)} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              {t("create.preview")}
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("create.challengeDetails")}</CardTitle>
                  <CardDescription>{t("create.challengeDetailsDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">{t("create.challengeTitle")}</Label>
                    <Input
                      id="title"
                      placeholder={t("create.challengeTitlePlaceholder")}
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">{t("create.description")}</Label>
                    <Textarea
                      id="description"
                      placeholder={t("create.descriptionPlaceholder")}
                      rows={8}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="difficulty">{t("create.difficulty")}</Label>
                      <Select value={formData.difficulty} onValueChange={(value) => handleInputChange("difficulty", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("create.selectDifficulty")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">{t("challenges.difficulty.easy")}</SelectItem>
                          <SelectItem value="MEDIUM">{t("challenges.difficulty.medium")}</SelectItem>
                          <SelectItem value="HARD">{t("challenges.difficulty.hard")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="points">{t("create.points")}</Label>
                      <Input
                        id="points"
                        type="number"
                        min="1"
                        value={formData.points}
                        onChange={(e) => handleInputChange("points", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="timeLimit">{t("create.timeLimit")}</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        min="1"
                        value={formData.timeLimit}
                        onChange={(e) => handleInputChange("timeLimit", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Cases */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t("create.testCasesTitle")}</CardTitle>
                      <CardDescription>{t("create.testCasesDescription")}</CardDescription>
                    </div>
                    <Button onClick={addTestCase} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("create.addTestCase")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testCases.map((testCase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{t("create.testCase")} {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={testCase.isPublic}
                              onChange={(e) => updateTestCase(index, "isPublic", e.target.checked)}
                              className="rounded"
                            />
                            {t("create.publicDescription")}
                          </Label>
                          {testCases.length > 1 && (
                            <Button
                              onClick={() => removeTestCase(index)}
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              title={t("create.removeTestCase")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">{t("create.input")}</Label>
                          <Textarea
                            placeholder={t("create.inputPlaceholder")}
                            rows={3}
                            value={testCase.input}
                            onChange={(e) => updateTestCase(index, "input", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">{t("create.expectedOutput")}</Label>
                          <Textarea
                            placeholder={t("create.outputPlaceholder")}
                            rows={3}
                            value={testCase.expectedOutput}
                            onChange={(e) => updateTestCase(index, "expectedOutput", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("create.schedule")}</CardTitle>
                  <CardDescription>{t("create.scheduleDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{t("create.startDate")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, "PPP") : t("create.selectDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => date && handleInputChange("startDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label>{t("create.endDate")}</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, "PPP") : t("create.selectDate")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => date && handleInputChange("endDate", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>{t("create.publish")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handleSubmit("DRAFT")}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? t("common.loading") : t("create.save")}
                  </Button>
                  
                  <Button
                    onClick={() => handleSubmit("ACTIVE")}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? t("common.loading") : t("create.publish")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
