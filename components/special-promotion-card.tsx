"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface SpecialPromotionCardProps {
  title: string
  price: number
  description?: string
  terms?: string
  isFullscreen?: boolean
}

export default function SpecialPromotionCard({
  title,
  price,
  description = "Friday Special Bundle",
  terms = "Available from 5PM to 10PM on Fridays",
  isFullscreen = false,
}: SpecialPromotionCardProps) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    // Check if it's currently between 5PM and 10PM
    const checkTimeRange = () => {
      const now = new Date()
      const currentHour = now.getHours()
      // Active between 5PM (17) and 10PM (22)
      setIsActive(currentHour >= 17 && currentHour < 22)
    }

    // Check immediately
    checkTimeRange()

    // Check every minute
    const interval = setInterval(checkTimeRange, 60000)
    return () => clearInterval(interval)
  }, [])

  // Split terms into bullet points if it contains commas
  const termsList = terms.split(",").map((term) => term.trim())

  return (
    <Card
      className={`${
        isFullscreen ? "w-full h-full" : "w-full"
      } overflow-hidden border-0 shadow-lg relative ${isActive ? "bg-green-50" : ""}`}
    >
      <CardHeader
        className={`${
          isFullscreen ? "py-6" : "py-4"
        } bg-orange-500 text-white text-center font-bold ${isFullscreen ? "text-4xl" : "text-2xl"}`}
      >
        {title}
      </CardHeader>
      <CardContent className={`${isFullscreen ? "p-8" : "p-6"} flex flex-col items-center justify-center bg-white`}>
        <div
          className={`${isFullscreen ? "text-[140px] mb-4" : "text-7xl mb-2"} font-bold text-gray-800 flex items-start`}
        >
          <span className={`${isFullscreen ? "text-6xl mt-8" : "text-4xl mt-2"}`}>$</span>
          {price.toFixed(2)}
        </div>
        <div className={`${isFullscreen ? "text-3xl mb-6" : "text-xl mb-3"} text-orange-500 font-medium text-center`}>
          {description}
        </div>
        <ul className={`${isFullscreen ? "space-y-2 text-xl" : "space-y-1 text-sm"} w-full`}>
          {termsList.map((term, index) => (
            <li key={index} className="flex items-start">
              <span className="text-orange-500 mr-2">•</span>
              <span>{term}</span>
            </li>
          ))}
        </ul>
        {isActive && (
          <div className={`${isFullscreen ? "text-2xl mt-6" : "text-lg mt-4"} font-semibold text-green-600`}>
            Available Now!
          </div>
        )}
      </CardContent>
      <CardFooter
        className={`${
          isFullscreen ? "py-4 px-8" : "py-2 px-4"
        } bg-gray-100 text-center text-gray-600 ${isFullscreen ? "text-lg" : "text-xs"}`}
      >
        Limited time offer. Cannot be combined with other promotions.
      </CardFooter>
    </Card>
  )
}
