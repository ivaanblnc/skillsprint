"use client"

import { useState } from "react"
import { AuthRequiredModal } from "@/components/auth-required-modal"

interface AuthRequiredTriggerProps {
  children: React.ReactNode
}

export function AuthRequiredTrigger({ children }: AuthRequiredTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div onClick={() => setIsModalOpen(true)}>
        {children}
      </div>
      <AuthRequiredModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
