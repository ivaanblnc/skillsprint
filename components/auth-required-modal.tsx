"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Code2, Users, Trophy } from "lucide-react"
import Link from "next/link"

interface AuthRequiredModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthRequiredModal({ isOpen, onClose }: AuthRequiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Code2 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-center">Join SkillSprint to Start Coding!</DialogTitle>
          <DialogDescription className="text-center">
            You need to be logged in to participate in coding challenges and track your progress.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <Code2 className="h-6 w-6 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Solve Challenges</p>
            </div>
            <div className="space-y-2">
              <Trophy className="h-6 w-6 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Earn Points</p>
            </div>
            <div className="space-y-2">
              <Users className="h-6 w-6 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">Compete</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full">
              Log In
            </Button>
          </Link>
          <Link href="/auth/register" className="w-full">
            <Button className="w-full">
              Sign Up
            </Button>
          </Link>
        </div>
        
        <p className="text-xs text-center text-muted-foreground mt-2">
          Already have an account? <Link href="/auth/login" className="text-primary hover:underline">Log in here</Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}
