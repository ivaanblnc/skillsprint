import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@/lib/supabase/client"
import { prisma } from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient()

  // Supabase devuelve access_token en query
  const { access_token } = req.query
  if (!access_token || typeof access_token !== "string") {
    return res.status(400).send("Missing access token")
  }

  // Recupera el usuario usando el token
  const { data, error } = await supabase.auth.getUser(access_token)
  if (error || !data.user) {
    return res.status(400).send("Invalid token or user not found")
  }

  const user = data.user
  const metadata = user.user_metadata || {}

  // Inserta o actualiza usuario en Prisma
  await prisma.user.upsert({
    where: { email: user.email! },
    update: {
      name: metadata.name || "",
      role: (metadata.role?.toUpperCase() as "CREATOR" | "PARTICIPANT" | "JUDGE") || "PARTICIPANT",
      updatedAt: new Date(),
    },
    create: {
      id: user.id,
      email: user.email!,
      name: metadata.name || "",
      role: (metadata.role?.toUpperCase() as "CREATOR" | "PARTICIPANT" | "JUDGE") || "PARTICIPANT",
      createdAt: new Date(),
      updatedAt: new Date(),
      points: 0,
    },
  })

  // Redirige a dashboard
  res.writeHead(302, { Location: "/dashboard" })
  res.end()
}
