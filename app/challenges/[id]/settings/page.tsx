"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Trash2, Archive, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { DashboardNav } from "@/components/dashboard-nav"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Challenge {
  id: string
  title: string
  difficulty: string
  points: number
  timeLimit: number
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  createdAt: string
  _count: {
    submissions: number
    testCases: number
  }
}

export default function ChallengeSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const challengeId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [status, setStatus] = useState("")

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
            toast.error("You don't have permission to manage this challenge")
            router.push("/challenges/manage")
            return
          }
          throw new Error("Failed to fetch challenge")
        }
        
        const data = await response.json()
        const challenge = data.challenge
        
        setChallenge(challenge)
        setStatus(challenge.status)
        
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

  const handleUpdateStatus = async () => {
    if (!challenge || status === challenge.status) return
    
    setSaving(true)
    
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update challenge status")
      }
      
      setChallenge(prev => prev ? { ...prev, status: status as any } : null)
      toast.success("Challenge status updated successfully!")
      
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update status")
      // Revert status change
      setStatus(challenge.status)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChallenge = async () => {
    if (!challenge) return
    
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete challenge")
      }
      
      toast.success("Challenge deleted successfully!")
      router.push("/challenges/manage")
      
    } catch (error) {
      console.error("Error deleting challenge:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete challenge")
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
                <p className="text-muted-foreground">Loading challenge settings...</p>
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
            <div>
              <h1 className="text-3xl font-bold mb-2">Challenge Settings</h1>
              <div className="flex items-center gap-3">
                <p className="text-muted-foreground">{challenge.title}</p>
                <Badge variant={
                  challenge.difficulty === "EASY" ? "secondary" :
                  challenge.difficulty === "MEDIUM" ? "default" : "destructive"
                }>
                  {challenge.difficulty}
                </Badge>
                <Badge variant="outline">{challenge.points} points</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Challenge Information */}
            <Card>
              <CardHeader>
                <CardTitle>Challenge Information</CardTitle>
                <CardDescription>
                  Basic information about your challenge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Total Submissions:</span>
                    <p className="font-medium">{challenge._count.submissions}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Test Cases:</span>
                    <p className="font-medium">{challenge._count.testCases}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <p className="font-medium">{new Date(challenge.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Time Limit:</span>
                    <p className="font-medium">{challenge.timeLimit} minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
                <CardDescription>
                  Control the availability and visibility of your challenge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium mb-2 block">Current Status:</span>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant={
                      challenge.status === "ACTIVE" ? "default" :
                      challenge.status === "DRAFT" ? "secondary" :
                      challenge.status === "COMPLETED" ? "outline" : "destructive"
                    }>
                      {challenge.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {challenge.status === "ACTIVE" && "Challenge is live and accepting submissions"}
                      {challenge.status === "DRAFT" && "Challenge is in draft mode - not visible to participants"}
                      {challenge.status === "COMPLETED" && "Challenge has ended - no longer accepting submissions"}
                      {challenge.status === "CANCELLED" && "Challenge has been cancelled"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium mb-2 block">Change Status:</span>
                  <div className="flex items-center gap-3">
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleUpdateStatus}
                      disabled={saving || status === challenge.status}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Update Status"}
                    </Button>
                  </div>
                </div>

                {status !== challenge.status && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Status will be changed from <strong>{challenge.status}</strong> to <strong>{status}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common actions for managing your challenge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => router.push(`/challenges/${challengeId}/edit`)}
                  >
                    Edit Challenge Details
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => router.push(`/challenges/${challengeId}/submissions`)}
                  >
                    View Submissions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => router.push(`/challenges/${challengeId}/analytics`)}
                  >
                    View Analytics
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    disabled={challenge.status === "COMPLETED"}
                    onClick={() => handleUpdateStatus()}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Challenge
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that affect your challenge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Challenge
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the challenge
                        "{challenge.title}" and all associated data including submissions and test cases.
                        {challenge._count.submissions > 0 && challenge.status !== "DRAFT" && (
                          <span className="block mt-2 text-destructive font-medium">
                            Warning: This challenge has {challenge._count.submissions} submissions. 
                            Deletion may not be allowed.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteChallenge}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Challenge
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
