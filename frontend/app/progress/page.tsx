"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../questmaster/components/ui/card"
import { CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProgressPage() {
  const router = useRouter()
  const [confetti, setConfetti] = useState<React.ReactNode[]>([])
  
  useEffect(() => {
    // Create confetti pieces
    const pieces = []
    for (let i = 0; i < 100; i++) {
      const style = {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
      }
      pieces.push(
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={style}
        />
      )
    }
    setConfetti(pieces)
    
    // Redirect to home after some time if no final instructions
    const finalInstructions = localStorage.getItem("finalInstructions")
    if (!finalInstructions) {
      const timer = setTimeout(() => {
        router.push("/questmaster")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [router])
  
  return (
    <div className="h-full relative overflow-hidden">
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none">
        {confetti}
      </div>
      
      <Card className="max-w-md mx-auto mt-16 shadow-lg relative z-10">
        <CardHeader className="pb-3 bg-purple-600 text-white text-center">
          <CardTitle className="flex justify-center items-center text-xl">
            <CheckCircle className="mr-2 h-6 w-6" />
            Success!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Woohoo!</h2>
          <p className="text-gray-600 mb-4">Your quest has been posted successfully.</p>
          <p className="text-sm text-gray-500">
            The participants will be notified and you'll receive updates as they progress.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 