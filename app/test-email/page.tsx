"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function TestEmailPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testEmail = async () => {
    if (!email) return
    
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/auth/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to test email', details: error })
    } finally {
      setIsLoading(false)
    }
  }

  const testEmails = [
    "test@example.com",
    "user@gmail.com", 
    "ivan.delllano.blanco2004@gmail.com",
    "ivan@gmail.com",
    "test123@outlook.com",
    "simple@test.co"
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Validation Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email to test</Label>
              <div className="flex gap-2">
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to test"
                />
                <Button onClick={testEmail} disabled={isLoading || !email}>
                  {isLoading ? "Testing..." : "Test"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quick test emails:</Label>
              <div className="flex flex-wrap gap-2">
                {testEmails.map((testEmail) => (
                  <Button
                    key={testEmail}
                    variant="outline"
                    size="sm"
                    onClick={() => setEmail(testEmail)}
                  >
                    {testEmail}
                  </Button>
                ))}
              </div>
            </div>

            {result && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Test Result:</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
