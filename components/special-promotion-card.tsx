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

  useEffect(() => {
    const formatRange = async () => {
      const range = await formatTimeRange(startTime, endTime)
      setFormattedTimeRange(range)
    }

    formatRange()
  }, [startTime, endTime])

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
      <div className={`flex-1 ${colorScheme.cardBackground} flex flex-col items-center justify-center p-8`}>
        <div
          className={`
            ${colorScheme.priceText} 
            ${fullscreen ? "text-[180px] leading-none" : "text-8xl"} 
            font-bold 
            flex items-start
          `}
        >
          <span className={fullscreen ? "text-[90px] mt-8" : "text-5xl mt-2"}>$</span>
          {price.toFixed(2)}
        </div>
        <div
          className={`
            ${colorScheme.accentText} 
            ${fullscreen ? "text-3xl mt-6" : "text-xl mt-4"} 
            font-medium text-center
          `}
        >
          {description}
        </div>

        <div className="w-full mt-6">
          <ul className={`space-y-2 ${fullscreen ? "text-xl" : "text-base"}`}>
            {items.map((item, index) => (
              <li key={index} className={`flex items-center ${colorScheme.itemText}`}>
                <span className={`mr-2 ${colorScheme.accentText}`}>•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
