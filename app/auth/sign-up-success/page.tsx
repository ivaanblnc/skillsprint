import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code2 } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Code2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Thank you for signing up!</CardTitle>
            <CardDescription className="text-center">Check your email to confirm your account</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              You've successfully signed up for SkillSprint. Please check your email to confirm your account before
              signing in.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
