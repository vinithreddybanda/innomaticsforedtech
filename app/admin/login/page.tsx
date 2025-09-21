"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Check for hardcoded admin credentials
    if (email === "admin" && password === "admin") {
      try {
        // Create a dummy session for admin
        localStorage.setItem("admin_session", "true")
        router.push("/admin/dashboard")
      } catch (error: unknown) {
        setError("Login failed")
      }
    } else {
      setError("Invalid credentials. Use admin/admin")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              <button 
                onClick={() => router.push('/')}
                className="hover:text-zinc-300 hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                Innomatics Research Labs
              </button>
            </CardTitle>
            <CardDescription className="text-zinc-400">Admin Login</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white">
                    Username
                  </Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="admin"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="admin"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
