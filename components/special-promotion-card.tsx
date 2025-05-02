"use client"

import { formatTimeRange } from "@/lib/db"
import { useEffect, useState } from "react"

interface SpecialPromotionCardProps {
  title: string
  price: number
  description: string
  items: string[]
  startTime: string
  endTime: string
  darkMode?: boolean
  fullscreen?: boolean
}

export default function SpecialPromotionCard({
  title,
  price,
  description,
  items,
  startTime,
  endTime,
  darkMode = false,
  fullscreen = false,
}: SpecialPromotionCardProps) {
  const [formattedTimeRange, setFormattedTimeRange] = useState<string>("")
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const formatRange = async () => {
      const range = await formatTimeRange(startTime, endTime)
      setFormattedTimeRange(range)
    }

    formatRange()
  }, [startTime, endTime])

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

  // Define color schemes for light and dark modes
  const colorScheme = {
    cardHeaderBg: darkMode ? "bg-[#1e293b]" : "bg-[#2d455a]",
    cardHeaderText: "text-white",
    cardSubheaderBg: darkMode ? "bg-[#9333ea]" : "bg-[#9333ea]", // Purple for special promotion
    cardSubheaderText: "text-white",
    cardBackground: darkMode ? "bg-[#1e293b]" : "bg-white",
    priceText: darkMode ? "text-white" : "text-[#2d455a]",
    accentText: darkMode ? "text-[#d8b4fe]" : "text-[#9333ea]", // Purple accent
    itemText: darkMode ? "text-gray-300" : "text-gray-700",
    shadow: darkMode ? "shadow-lg shadow-black/20" : "shadow-lg",
    activeIndicator: darkMode ? "bg-emerald-800 text-emerald-200" : "bg-emerald-100 text-emerald-700",
  }

  return (
    <div className={`flex flex-col rounded-xl overflow-hidden ${colorScheme.shadow} h-full relative`}>
      <div
        className={`
          ${colorScheme.cardHeaderBg} 
          ${colorScheme.cardHeaderText} 
          text-center 
          ${fullscreen ? "py-6 text-3xl h-[90px]" : "py-5 text-2xl h-[72px]"} 
          font-bold 
          flex items-center justify-center
        `}
      >
        {formattedTimeRange}
      </div>
      <div
        className={`
          ${colorScheme.cardSubheaderBg} 
          ${colorScheme.cardSubheaderText} 
          text-center 
          ${fullscreen ? "py-6 text-4xl h-[100px]" : "py-5 text-3xl h-[84px]"} 
          font-bold 
          flex items-center justify-center
        `}
      >
        {title}
      </div>
      <div className={`flex-1 ${colorScheme.cardBackground} flex flex-col items-center justify-center p-6`}>
        {/* Reduced font size for price and adjusted container */}
        <div
          className={`
            ${colorScheme.priceText} 
            ${fullscreen ? "text-[120px] leading-none" : "text-7xl"} 
            font-bold 
            flex items-start
            w-full text-center justify-center
          `}
        >
          <span className={fullscreen ? "text-[60px] mt-6" : "text-4xl mt-2"}>$</span>
          {price.toFixed(2)}
        </div>
        <div
          className={`
            ${colorScheme.accentText} 
            ${fullscreen ? "text-3xl mt-3" : "text-xl mt-2"} 
            font-medium text-center
          `}
        >
          {description}
        </div>

        <div className="w-full mt-4">
          <h3 className={`${fullscreen ? "text-2xl" : "text-lg"} font-bold mb-2 text-center ${colorScheme.priceText}`}>
            INCLUDES:
          </h3>
          <ul className={`space-y-1 ${fullscreen ? "text-xl" : "text-base"}`}>
            {items.map((item, index) => (
              <li key={index} className={`flex items-center ${colorScheme.itemText}`}>
                <span className={`mr-2 ${colorScheme.accentText}`}>•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {isActive && (
          <div
            className={`
              mt-4 py-1 px-3 rounded-full font-medium
              ${colorScheme.activeIndicator}
              ${fullscreen ? "text-lg" : "text-sm"}
            `}
          >
            Available Now!
          </div>
        )}
      </div>
    </div>
  )
}
