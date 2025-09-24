"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Plus, Trash2, Save, ArrowLeft } from "lucide-react"
import { DashboardNav } from "@/components/dashboard-nav"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface TestCase {
  input: string
  expectedOutput: string
  isPublic: boolean
}

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  points: number
  timeLimit: number
  startDate: string
  endDate: string
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  testCases: TestCase[]
}

export default function EditChallengePage() {
  const router = useRouter()
  const params = useParams()
  const challengeId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "",
    points: 100,
    timeLimit: 30,
    startDate: new Date(),
    endDate: new Date(),
  })
  
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "", expectedOutput: "", isPublic: true }
  ])

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await fetch(`/api/challenges/${challengeId}`)
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Challenge not found")
            router.push("/challenges/manage")
            return
          }
          if (response.status === 403) {
            toast.error("You don't have permission to edit this challenge")
            router.push("/challenges/manage")
            return
          }
          throw new Error("Failed to fetch challenge")
        }
        
        const data = await response.json()
        const challenge = data.challenge
        
        setChallenge(challenge)
        setFormData({
          title: challenge.title,
          description: challenge.description,
          difficulty: challenge.difficulty,
          points: challenge.points,
          timeLimit: challenge.timeLimit,
          startDate: new Date(challenge.startDate),
          endDate: new Date(challenge.endDate),
        })
        
        if (challenge.testCases && challenge.testCases.length > 0) {
          setTestCases(challenge.testCases)
        }
        
      } catch (error) {
        console.error("Error fetching challenge:", error)
        toast.error("Failed to load challenge")
        router.push("/challenges/manage")
      } finally {
        setLoading(false)
      }
    }

    if (challengeId) {
      fetchChallenge()
    }
  }, [challengeId, router])

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
      toast.error("Please enter a challenge title")
      return false
    }
    
    if (!formData.description.trim()) {
      toast.error("Please enter a challenge description")
      return false
    }
    
    if (!formData.difficulty) {
      toast.error("Please select a difficulty level")
      return false
    }
    
    if (formData.points <= 0) {
      toast.error("Points must be greater than 0")
      return false
    }
    
    if (formData.timeLimit <= 0) {
      toast.error("Time limit must be greater than 0")
      return false
    }
    
    if (formData.endDate <= formData.startDate) {
      toast.error("End date must be after start date")
      return false
    }
    
    // Validate test cases
    const validTestCases = testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim())
    if (validTestCases.length === 0) {
      toast.error("Please add at least one test case with input and expected output")
      return false
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setSaving(true)
    
    try {
      const validTestCases = testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim())
      
      const updateData = {
        ...formData,
        testCases: validTestCases
      }
      
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update challenge")
      }
      
      toast.success("Challenge updated successfully!")
      router.push("/challenges/manage")
      
    } catch (error) {
      console.error("Error updating challenge:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update challenge")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading challenge...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!challenge) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/challenges/manage" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manage Challenges
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Edit Challenge</h1>
                <p className="text-muted-foreground">Update your challenge details</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Update the basic details of your challenge</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Challenge Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Two Sum Problem"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the problem, constraints, and requirements..."
                      rows={8}
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select value={formData.difficulty} onValueChange={(value) => handleInputChange("difficulty", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        min="1"
                        value={formData.points}
                        onChange={(e) => handleInputChange("points", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
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
                      <CardTitle>Test Cases</CardTitle>
                      <CardDescription>Update input/output examples for your challenge</CardDescription>
                    </div>
                    <Button onClick={addTestCase} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Test Case
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {testCases.map((testCase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">Test Case {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={testCase.isPublic}
                              onChange={(e) => updateTestCase(index, "isPublic", e.target.checked)}
                              className="rounded"
                            />
                            Public (visible to participants)
                          </Label>
                          {testCases.length > 1 && (
                            <Button
                              onClick={() => removeTestCase(index)}
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Input</Label>
                          <Textarea
                            placeholder="Enter test input..."
                            rows={3}
                            value={testCase.input}
                            onChange={(e) => updateTestCase(index, "input", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Expected Output</Label>
                          <Textarea
                            placeholder="Enter expected output..."
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
              {/* Challenge Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Challenge Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={
                      challenge.status === "ACTIVE" ? "default" :
                      challenge.status === "DRAFT" ? "secondary" : "outline"
                    }>
                      {challenge.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Current status</span>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>Update when your challenge will be available</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Start Date</Label>
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
                          {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
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
                    <Label>End Date</Label>
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
                          {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
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
                  <CardTitle>Save Changes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  
                  <Button
                    onClick={() => router.push("/challenges/manage")}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel
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
