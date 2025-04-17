"use client"
import { useEffect, useState } from "react"
import type { DayPrices, Promotion, LateNightLanes } from "@/lib/types"
import PriceBoard from "@/components/price-board"

interface DisplayPageClientProps {
  initialPrices: DayPrices[]
  initialPromotions: Promotion[]
  initialLateNightLanes: LateNightLanes
  initialToday: string
  initialTimestamp: number
}

export default function DisplayPageClient({
  initialPrices,
  initialPromotions,
  initialLateNightLanes,
  initialToday,
  initialTimestamp,
}: DisplayPageClientProps) {
  const [prices, setPrices] = useState<DayPrices[]>(initialPrices)
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions)
  const [lateNightLanes, setLateNightLanes] = useState<LateNightLanes | null>(initialLateNightLanes)
  const [today, setToday] = useState(initialToday)
  const [timestamp, setTimestamp] = useState(initialTimestamp)
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString())
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLateNight, setIsLateNight] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setIsLoaded(true)

    // Check if Late Night Lanes is active
    function checkLateNightLanes() {
      if (!lateNightLanes || !lateNightLanes.isActive) {
        setIsLateNight(false)
        return false
      }

      const currentTime = getCurrentTime()
      const isActive =
        lateNightLanes.applicableDays.includes(today) &&
        currentTime >= lateNightLanes.startTime &&
        (lateNightLanes.endTime === "CLOSE" || currentTime < lateNightLanes.endTime)

      setIsLateNight(isActive)
      return isActive
    }

    // Get current time in HH:MM format
    function getCurrentTime() {
      const now = new Date()
      return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
    }

    // Function to show update indicator
    function showUpdateIndicator() {
      const indicator = document.getElementById("update-indicator")
      if (indicator) {
        indicator.classList.add("active")
        setTimeout(() => {
          indicator.classList.remove("active")
        }, 1000)
      }
    }

    // Function to check if the day has changed
    function checkDayChange() {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const now = new Date()
      const currentDay = days[now.getDay()]

      if (currentDay !== today) {
        console.log("Day changed from " + today + " to " + currentDay)
        setToday(currentDay)
        fetchFreshData()
      }
    }

    // Function to fetch fresh data from the API
    async function fetchFreshData() {
      try {
        const response = await fetch("/api/public-board-data?t=" + Date.now())
        if (!response.ok) {
          throw new Error("Network response was not ok")
        }

        const data = await response.json()

        // Check if data has changed
        const hasChanged =
          JSON.stringify(data.prices) !== JSON.stringify(prices) ||
          JSON.stringify(data.promotions) !== JSON.stringify(promotions) ||
          JSON.stringify(data.lateNightLanes) !== JSON.stringify(lateNightLanes)

        if (hasChanged) {
          console.log("Data changed, updating display")
          setPrices(data.prices)
          setPromotions(data.promotions)
          setLateNightLanes(data.lateNightLanes)
          setTimestamp(data.timestamp)
          setLastUpdate(new Date().toISOString())
          showUpdateIndicator()
        }
      } catch (error) {
        console.error("Error fetching fresh data:", error)
      }
    }

    // Function to check if dark mode should be enabled based on time
    function checkDarkMode() {
      const now = new Date()
      const hour = now.getHours()
      // Dark mode from 6PM (18) to 6AM (6)
      const shouldBeDark = hour >= 18 || hour < 6
      setDarkMode(shouldBeDark)
    }

    // Initial check for Late Night Lanes
    checkLateNightLanes()

    // Initial check for dark mode
    checkDarkMode()

    // Set up intervals for updates
    const timeInterval = setInterval(checkLateNightLanes, 60000) // Check every minute
    const dayInterval = setInterval(checkDayChange, 60000) // Check for day change every minute
    const dataInterval = setInterval(fetchFreshData, 15000) // Fetch fresh data every 15 seconds
    const darkModeInterval = setInterval(checkDarkMode, 60000) // Check every minute

    // Also check at midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const timeToMidnight = tomorrow.getTime() - now.getTime()

    // Set a timeout to update at midnight
    const midnightTimeout = setTimeout(() => {
      checkDayChange()
      fetchFreshData()
    }, timeToMidnight)

    // Clean up intervals and timeouts
    return () => {
      clearInterval(timeInterval)
      clearInterval(dayInterval)
      clearInterval(dataInterval)
      clearInterval(darkModeInterval)
      clearTimeout(midnightTimeout)
    }
  }, [today, prices, promotions, lateNightLanes])

  // If not loaded yet, show loading
  if (!isLoaded) {
    return <div className="w-full h-screen flex items-center justify-center">Loading...</div>
  }

  // Find the current day's prices
  const currentDayPrices = prices.find((p) => p.day === today) || prices[0]

  return (
    <div className="w-full h-screen">
      <PriceBoard
        prices={prices}
        promotions={promotions}
        lateNightLanes={lateNightLanes || undefined}
        selectedDay={today}
        fullscreen={true}
        darkMode={darkMode}
      />

      {/* Update indicator */}
      <div
        id="update-indicator"
        className="update-indicator fixed bottom-5 left-5 w-4 h-4 rounded-full bg-[#ff8210] opacity-0 transition-opacity duration-300"
      ></div>

      {/* Version info */}
      <div className="version-info fixed bottom-2 right-2 text-xs text-gray-400">
        Updated: {new Date(lastUpdate).toLocaleTimeString()}
      </div>
    </div>
  )
}
