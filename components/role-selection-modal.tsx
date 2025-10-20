"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RoleSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (role: "CREATOR" | "PARTICIPANT") => void
  isLoading?: boolean
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = React.useState<"CREATOR" | "PARTICIPANT" | "">("")

  const handleConfirm = () => {
    if (selectedRole === "CREATOR" || selectedRole === "PARTICIPANT") {
      onConfirm(selectedRole)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selecciona tu rol</DialogTitle>
          <DialogDescription>
            Elige qué tipo de usuario deseas ser en SkillSprint
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Puedes cambiar tu rol más tarde desde tu perfil
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="role-select">Rol</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value as "CREATOR" | "PARTICIPANT" | "")
              }
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Selecciona un rol..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PARTICIPANT">
                  <div className="flex flex-col">
                    <span>Participante</span>
                    <span className="text-xs text-muted-foreground">
                      Resuelve desafíos y compite
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="CREATOR">
                  <div className="flex flex-col">
                    <span>Creador</span>
                    <span className="text-xs text-muted-foreground">
                      Crea y gestiona desafíos
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedRole || isLoading}
          >
            {isLoading ? "Iniciando..." : "Continuar con Google"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
