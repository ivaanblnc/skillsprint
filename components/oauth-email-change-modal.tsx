/**
 * OAuth Email Change Modal
 * Prevents OAuth users from changing their email
 */

"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Lock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"

interface OAuthEmailChangeModalProps {
  isOpen: boolean
  onClose: () => void
  provider?: "google" | "github" | "microsoft"
}

export function OAuthEmailChangeModal({
  isOpen,
  onClose,
  provider = "google",
}: OAuthEmailChangeModalProps) {
  const { t } = useI18n()

  const getProviderName = () => {
    switch (provider) {
      case "github":
        return "GitHub"
      case "microsoft":
        return "Microsoft"
      default:
        return "Google"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-950 rounded-full">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <DialogTitle className="text-center">
            {t("auth.cannotChangeOAuthEmail")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("auth.cannotChangeOAuthEmailDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <p className="font-medium mb-1">
                Your account is linked to {getProviderName()}
              </p>
              <p>
                Email changes must be made directly through your {getProviderName()} account settings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t("common.understood") || "Got it"}
          </Button>
          <Link href="/auth/login" className="flex-1">
            <Button variant="outline" className="w-full">
              {t("common.signOut") || "Sign Out"}
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
