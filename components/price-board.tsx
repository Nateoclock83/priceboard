"use client"

import { useState, useEffect } from "react"
import type { DayPrices, Promotion, TimeSlot, LateNightLanes } from "@/lib/types"
import { formatTimeRange } from "@/lib/db"
import { Clock } from "lucide-react"
import SpecialPromotionCard from "./special-promotion-card"

// Add this helper component at the top of the file, after imports but before the main component:

function TimeRangeDisplay({ startTime, endTime }: { startTime: string; endTime: string }) {
  const [formattedRange, setFormattedRange] = useState<string>("")

  useEffect(() => {
    const formatRange = async () => {
      const range = await formatTimeRange(startTime, endTime)
      setFormattedRange(range)
    }

    formatRange()
  }, [startTime, endTime])

  return <span>{formattedRange}</span>
}

// Helper function to get hours and minutes from total minutes
function getHoursAndMinutes(totalMinutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { hours, minutes }
}

interface PriceBoardProps {
  prices: DayPrices[]
  promotions: Promotion[]
  lateNightLanes?: LateNightLanes
  selectedDay?: string
  fullscreen?: boolean
  darkMode?: boolean
  forceShowLateNight?: boolean
}

export default function PriceBoard({
  prices,
  promotions,
  lateNightLanes,
  selectedDay,
  fullscreen = false,
  darkMode = false,
  forceShowLateNight = false,
}: PriceBoardProps) {
  const [currentDay, setCurrentDay] = useState<string>(selectedDay || "")
  const [currentPrices, setCurrentPrices] = useState<DayPrices | null>(null)
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([])
  const [currentTime, setCurrentTime] = useState<string>("")
  const [currentTimeHHMM, setCurrentTimeHHMM] = useState<string>("")
  const [isDarkMode, setIsDarkMode] = useState<boolean>(darkMode)
  const [isLateNight, setIsLateNight] = useState<boolean>(forceShowLateNight || false)
  const [isEditingDisclaimer, setIsEditingDisclaimer] = useState<boolean>(false)
  const defaultDisclaimerText =
    "Offers and prices are subject to change without notice. Some age, height, and other restrictions apply. Bonus gameplay amount has no cash value and is redeemable on non-redemption games only. No outside food or beverages are allowed. Game cards are required for most attractions and maybe an additional cost. No refunds or substitutions. Cannot be combined with any other offer or discount. See attendant for details."
  const [disclaimerText, setDisclaimerText] = useState<string>(defaultDisclaimerText)
  const [savedDisclaimerText, setSavedDisclaimerText] = useState<string>(defaultDisclaimerText)

  // Update dark mode when prop changes
  useEffect(() => {
    setIsDarkMode(darkMode)
  }, [darkMode])

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()

      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }))
      setCurrentTimeHHMM(
        `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      )
    }

    // Update immediately
    updateTime()

    // Set up interval for updates
    const timeInterval = setInterval(updateTime, 1000)

    return () => clearInterval(timeInterval)
  }, [])

  // Update current day and check for day change
  useEffect(() => {
    // Function to get the current day of the week
    const getCurrentDay = () => {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      return days[new Date().getDay()]
    }

    // Set the day immediately
    if (!selectedDay) {
      setCurrentDay(getCurrentDay())
    } else {
      setCurrentDay(selectedDay)
    }

    // Function to check and update the day if needed
    const checkAndUpdateDay = () => {
      if (!selectedDay) {
        const today = getCurrentDay()
        if (currentDay !== today) {
          console.log(`Day changed from ${currentDay} to ${today}`)
          setCurrentDay(today)
          // Force update of prices and promotions
          const dayPrices = prices.find((p) => p.day.toLowerCase() === today.toLowerCase())
          if (dayPrices) {
            setCurrentPrices(dayPrices)
          }
        }
      }
    }

    // Check for day change every minute
    const dayInterval = setInterval(checkAndUpdateDay, 60000)

    // Also check at midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const timeToMidnight = tomorrow.getTime() - now.getTime()

    // Set a timeout to update the day at midnight
    const midnightTimeout = setTimeout(() => {
      checkAndUpdateDay()
      // After midnight, continue checking every 24 hours
      const midnightInterval = setInterval(checkAndUpdateDay, 86400000)
      return () => clearInterval(midnightInterval)
    }, timeToMidnight)

    return () => {
      clearInterval(dayInterval)
      clearTimeout(midnightTimeout)
    }
  }, [selectedDay, currentDay, prices])

  // Update prices, promotions, and check for Late Night Lanes when day or time changes
  useEffect(() => {
    // Find the prices for the current day
    const dayPrices = prices.find((p) => p.day.toLowerCase() === currentDay.toLowerCase())
    if (dayPrices) {
      setCurrentPrices(dayPrices)
    } else if (prices.length > 0) {
      // Default to the first day if current day not found
      setCurrentPrices(prices[0])
      setCurrentDay(prices[0].day)
    }

    // Filter active promotions for the current day
    const currentDate = new Date()
    const filtered = promotions.filter((promo) => {
      // Check if promotion is active
      if (!promo.isActive) return false

      // Check date range
      const startDate = new Date(promo.startDate)
      const endDate = new Date(promo.endDate)
      if (currentDate < startDate || currentDate > endDate) return false

      // Check if applicable to the selected day
      return promo.applicableDays.includes(currentDay)
    })

    setActivePromotions(filtered)

    // Check if Late Night Lanes is active
    const checkLateNight = () => {
      if (forceShowLateNight) {
        setIsLateNight(true)
        return
      }

      if (
        lateNightLanes &&
        lateNightLanes.isActive &&
        lateNightLanes.applicableDays.includes(currentDay) &&
        currentTimeHHMM >= lateNightLanes.startTime &&
        (lateNightLanes.endTime === "CLOSE" || currentTimeHHMM < lateNightLanes.endTime)
      ) {
        setIsLateNight(true)
      } else {
        setIsLateNight(false)
      }
    }

    checkLateNight()

    // Set up interval to check for Late Night Lanes every minute
    const lateNightInterval = setInterval(checkLateNight, 60000)

    return () => clearInterval(lateNightInterval)
  }, [currentDay, currentTimeHHMM, prices, promotions, lateNightLanes, forceShowLateNight])

  // Load saved disclaimer text from localStorage on component mount
  useEffect(() => {
    // Only access localStorage in the browser environment
    if (typeof window !== "undefined") {
      const savedText = localStorage.getItem("disclaimerText")
      if (savedText) {
        setDisclaimerText(savedText)
        setSavedDisclaimerText(savedText)
      }
    }
  }, [])

  // Function to handle saving the disclaimer text
  const handleSaveDisclaimer = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("disclaimerText", disclaimerText)
    }
    setSavedDisclaimerText(disclaimerText)
    setIsEditingDisclaimer(false)
  }

  // Function to handle canceling edits
  const handleCancelEdit = () => {
    setDisclaimerText(savedDisclaimerText)
    setIsEditingDisclaimer(false)
  }

  if (!currentPrices && !isLateNight) return <div className="p-8 text-center">Loading prices...</div>

  // Check if an activity has a promotion
  const hasPromotion = (activity: string) => {
    // If it's Friday and the activity is bowling, don't show the promotion banner
    // in the regular bowling card since we're showing it as a separate card
    if (isFriday && activity === "bowling") {
      return false
    }
    return activePromotions.some((promo) => promo.applicableActivities.includes(activity))
  }

  // Get promotions for a specific activity
  const getPromotionsForActivity = (activity: string) => {
    return activePromotions.filter((promo) => promo.applicableActivities.includes(activity))
  }

  // Get current time slot for an activity
  const getCurrentTimeSlot = (timeSlots: TimeSlot[], isAvailable: boolean) => {
    // If the activity is marked as unavailable, return null
    if (!isAvailable) return null

    const slot = timeSlots.find((slot) => {
      if (slot.endTime === "CLOSE") {
        return currentTimeHHMM >= slot.startTime
      }
      return currentTimeHHMM >= slot.startTime && currentTimeHHMM < slot.endTime
    })

    // Return the found slot or null if no applicable time slot
    return slot || null
  }

  // Get current bowling time slot and price
  const currentBowlingSlot = currentPrices?.bowling
    ? getCurrentTimeSlot(currentPrices.bowling.timeSlots, currentPrices.bowling.isAvailable)
    : null
  const currentBowlingPrice = currentBowlingSlot?.price || 0

  // Get current darts time slot and price
  const currentDartsSlot = currentPrices?.darts
    ? getCurrentTimeSlot(currentPrices.darts.timeSlots, currentPrices.darts.isAvailable)
    : null
  const currentDartsPrice = currentDartsSlot?.price || 0

  // Get current laser tag time slot and price
  const currentLaserTagSlot = currentPrices?.laserTag
    ? getCurrentTimeSlot(currentPrices.laserTag.timeSlots, currentPrices.laserTag.isAvailable)
    : null
  const currentLaserTagPrice = currentLaserTagSlot?.price || 0

  // Define color schemes for light and dark modes based on the actual display
  const colorScheme = {
    background: isDarkMode ? "bg-[#0f172a]" : "bg-[#f5f5f5]",
    text: isDarkMode ? "text-white" : "text-[#2d455a]",
    cardBackground: isDarkMode ? "bg-[#1e293b]" : "bg-white",
    cardHeaderBg: isDarkMode ? "bg-[#1e293b]" : "bg-[#2d455a]",
    cardHeaderText: "text-white",
    cardSubheaderBg: isDarkMode ? "bg-[#e67e22]" : "bg-[#ff8210]",
    cardSubheaderText: "text-white",
    priceText: isDarkMode ? "text-white" : "text-[#2d455a]",
    accentText: isDarkMode ? "text-[#e67e22]" : "text-[#ff8210]",
    timeDisplayBg: isDarkMode ? "bg-[#1e293b]" : "bg-white",
    timeDisplayText: isDarkMode ? "text-[#e67e22]" : "text-[#ff8210]",
    timeDisplayBorder: isDarkMode ? "border border-[#e67e22]" : "",
    shadow: isDarkMode ? "shadow-lg shadow-black/20" : "shadow-lg",
    disclaimerText: isDarkMode ? "text-[#94a3b8]" : "text-gray-600",
    bannerBg: isDarkMode ? "bg-black/20" : "bg-black/20",
    waitTimeBg: isDarkMode ? "bg-[#1e293b]" : "bg-[#f8f9fa]",
    waitTimeText: isDarkMode ? "text-white" : "text-[#2d455a]",
    waitTimeAccent: isDarkMode ? "text-[#e67e22]" : "text-[#ff8210]",
  }

  // Check if it's Friday to show the special promotion
  const isFriday = currentDay === "Friday"

  // If Late Night Lanes is active, show the Late Night Lanes UI
  if (isLateNight && lateNightLanes && lateNightLanes.isActive) {
    // Late Night Lanes UI code (unchanged)
    // ...
    return (
      <div className={`w-full h-full bg-[#0f0f1a] text-white p-6 flex flex-col`}>
        {/* Header with time */}
        <div className="flex justify-end mb-8">
          <div
            className={`
            ${fullscreen ? "text-3xl" : "text-2xl"} 
            font-medium 
            text-[#a78bfa]
            bg-[#1e293b]
            border border-[#a78bfa]
            px-5 py-2 rounded-md shadow-lg
          `}
          >
            {currentTime}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Bowling special */}
          <div className="mb-12">
            <h1 className={`${fullscreen ? "text-7xl" : "text-6xl"} font-bold mb-4 text-center`}>LATE NIGHT LANES</h1>

            <div className={`text-[#a78bfa] ${fullscreen ? "text-4xl" : "text-3xl"} font-medium mb-6 text-center`}>
              {lateNightLanes.description}
            </div>

            <div className={`${fullscreen ? "text-4xl" : "text-3xl"} font-bold mb-6 text-center`}>
              {lateNightLanes.applicableDays.join(" - ")}
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className={`${fullscreen ? "text-8xl" : "text-7xl"} font-bold flex items-start mb-4`}>
                <span className={fullscreen ? "text-5xl mt-8" : "text-4xl mt-6"}>$</span>
                {lateNightLanes.price.toFixed(2)}
              </div>

              <div className={`${fullscreen ? "text-4xl" : "text-3xl"} mb-6`}>PER PERSON</div>

              <div className={`${fullscreen ? "text-4xl" : "text-3xl"} font-bold mb-8`}>{lateNightLanes.subtitle}</div>

              <div className={`text-[#a78bfa] ${fullscreen ? "text-xl" : "text-lg"} mb-8`}>
                {lateNightLanes.disclaimer}
              </div>
            </div>
          </div>

          {/* Other activities */}
          {currentPrices && (
            <div className="flex justify-center gap-16 w-full">
              {/* Darts */}
              <div className="bg-[#1e293b]/50 p-6 rounded-xl text-center w-[400px]">
                <h3 className={`${fullscreen ? "text-3xl" : "text-2xl"} font-bold mb-4`}>INTERACTIVE DARTS</h3>
                {currentDartsSlot ? (
                  <>
                    <div className={`text-[#a78bfa] ${fullscreen ? "text-xl" : "text-lg"} mb-4`}>
                      <TimeRangeDisplay startTime={currentDartsSlot.startTime} endTime={currentDartsSlot.endTime} />
                    </div>
                    <div className={`${fullscreen ? "text-5xl" : "text-4xl"} font-bold mb-2`}>${currentDartsPrice}</div>
                    <div className={`${fullscreen ? "text-2xl" : "text-xl"} text-gray-300`}>PER LANE, PER HOUR</div>
                  </>
                ) : (
                  <div className={`${fullscreen ? "text-2xl" : "text-xl"} text-[#a78bfa]`}>UNAVAILABLE</div>
                )}
              </div>

              {/* Laser Tag */}
              <div className="bg-[#1e293b]/50 p-6 rounded-xl text-center w-[400px]">
                <h3 className={`${fullscreen ? "text-3xl" : "text-2xl"} font-bold mb-4`}>LASER TAG</h3>
                {currentLaserTagSlot ? (
                  <>
                    <div className={`text-[#a78bfa] ${fullscreen ? "text-xl" : "text-lg"} mb-4`}>
                      <TimeRangeDisplay
                        startTime={currentLaserTagSlot.startTime}
                        endTime={currentLaserTagSlot.endTime}
                      />
                    </div>
                    <div className={`${fullscreen ? "text-5xl" : "text-4xl"} font-bold mb-2`}>
                      ${currentLaserTagPrice}
                    </div>
                    <div className={`${fullscreen ? "text-2xl" : "text-xl"} text-gray-300`}>
                      PER PERSON, PER SESSION
                    </div>
                    <div className={`text-[#a78bfa] ${fullscreen ? "text-lg" : "text-base"} mt-2`}>
                      44" HEIGHT REQUIREMENT
                    </div>
                  </>
                ) : (
                  <div className={`${fullscreen ? "text-2xl" : "text-xl"} text-[#a78bfa]`}>UNAVAILABLE</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className={`${fullscreen ? "text-3xl" : "text-2xl"} font-bold mb-4`}>
            <span className="text-[#a78bfa]">$4.50</span> BOWLING SHOES{" "}
            <span className="text-[#a78bfa]">FOR ALL BOWLERS</span>
          </div>
        </div>
      </div>
    )
  }

  // Regular price board UI
  return (
    <div
      className={`w-full h-full ${colorScheme.background} ${colorScheme.text} p-6 flex flex-col transition-colors duration-500`}
    >
      {/* Main header */}
      <div className="text-center mb-8">
        <div className="flex justify-between items-center w-full px-6">
          <div className="w-32"></div> {/* Empty div for balance */}
          <h1 className={`${fullscreen ? "text-6xl" : "text-5xl"} font-bold ${colorScheme.text}`}>
            {currentDay.toUpperCase()} PRICING
          </h1>
          <div
            className={`
              ${fullscreen ? "text-3xl" : "text-2xl"} 
              font-medium 
              ${colorScheme.timeDisplayText} 
              ${colorScheme.timeDisplayBg} 
              ${colorScheme.timeDisplayBorder}
              px-5 py-2 rounded-md ${colorScheme.shadow}
            `}
          >
            {currentTime}
          </div>
        </div>
        <div
          className={`
            ${fullscreen ? "mt-6 text-3xl" : "mt-4 text-2xl"} 
            font-medium 
            ${colorScheme.text}
          `}
        >
          HOURLY RATES LISTED <span className="underline font-semibold">PER LANE</span>, GROUPS OF{" "}
          <span className="underline font-semibold">1-6 PLAYERS PER LANE</span>.
        </div>
      </div>

      {/* Price cards */}
      <div
        className={
          isFriday
            ? fullscreen
              ? "flex-1 grid grid-cols-4 gap-8 my-6"
              : "flex-1 grid grid-cols-4 gap-6"
            : fullscreen
              ? "flex-1 grid grid-cols-3 gap-12 my-6"
              : "flex-1 grid grid-cols-3 gap-8"
        }
      >
        {/* Reorder the cards to ensure bowling cards are together */}
        {isFriday && (
          <>
            {/* Regular Bowling Card */}
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
                {currentBowlingSlot ? (
                  <TimeRangeDisplay startTime={currentBowlingSlot.startTime} endTime={currentBowlingSlot.endTime} />
                ) : (
                  "TODAY"
                )}
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
                BOWLING
              </div>
              <div className={`flex-1 ${colorScheme.cardBackground} flex flex-col items-center justify-center p-8`}>
                {currentBowlingSlot ? (
                  <>
                    <div
                      className={`
                    ${colorScheme.priceText} 
                    ${fullscreen ? "text-[180px] leading-none" : "text-8xl"} 
                    font-bold 
                    flex items-start
                  `}
                    >
                      <span className={fullscreen ? "text-[90px] mt-8" : "text-5xl mt-2"}>$</span>
                      {currentBowlingPrice}
                    </div>
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-3xl mt-6" : "text-xl mt-4"} 
                    font-medium text-center
                  `}
                    >
                      {currentPrices?.bowling.priceText || "PER LANE, PER HOUR"}
                    </div>

                    {/* Promotion banner at the bottom */}
                    {hasPromotion("bowling") && (
                      <div className="w-full mt-6">
                        <div
                          className={`
                        ${colorScheme.cardSubheaderBg} 
                        text-white 
                        ${fullscreen ? "py-3 px-5" : "py-2 px-4"} 
                        text-center rounded-md shadow-md
                      `}
                        >
                          <div className={fullscreen ? "text-2xl font-bold" : "text-lg font-bold"}>SPECIAL OFFER</div>
                          {getPromotionsForActivity("bowling").map((promo) => (
                            <div key={promo.id}>
                              <div className={fullscreen ? "text-xl font-medium" : "text-sm font-medium"}>
                                {promo.description}
                              </div>
                              {promo.terms && (
                                <div
                                  className={`${fullscreen ? "text-sm" : "text-xs"} mt-1 font-medium ${colorScheme.bannerBg} py-1 px-2 rounded`}
                                >
                                  {promo.terms}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : currentPrices?.bowling.showWaitTime ? (
                  // Show wait time when bowling is unavailable but wait time is enabled
                  <div
                    className={`
                  ${colorScheme.waitTimeBg}
                  p-6 rounded-lg text-center w-full
                `}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <Clock className={`${fullscreen ? "h-12 w-12" : "h-8 w-8"} ${colorScheme.waitTimeAccent} mr-3`} />
                      <div className={`${fullscreen ? "text-4xl" : "text-3xl"} font-bold ${colorScheme.waitTimeText}`}>
                        WAIT TIME
                      </div>
                    </div>

                    {/* Stacked wait time display */}
                    <div className="flex flex-col items-center">
                      {/* Get hours and minutes */}
                      {(() => {
                        const { hours, minutes } = getHoursAndMinutes(currentPrices?.bowling.waitTime || 30)
                        return (
                          <>
                            {hours > 0 && (
                              <div
                                className={`${fullscreen ? "text-7xl" : "text-6xl"} font-bold ${colorScheme.waitTimeAccent}`}
                              >
                                {hours} <span className={`${fullscreen ? "text-4xl" : "text-3xl"}`}>HR</span>
                              </div>
                            )}
                            <div
                              className={`
                            ${fullscreen ? "text-7xl" : "text-6xl"} 
                            font-bold 
                            ${colorScheme.waitTimeAccent}
                            ${hours > 0 ? "mt-2" : ""}
                          `}
                            >
                              {minutes} <span className={`${fullscreen ? "text-4xl" : "text-3xl"}`}>MIN</span>
                            </div>
                          </>
                        )
                      })()}
                    </div>

                    {/* Use the current time slot's price for wait time display */}
                    <div className={`${fullscreen ? "text-2xl" : "text-xl"} ${colorScheme.waitTimeText} mt-6`}>
                      CURRENT PRICE:{" "}
                      <span className={colorScheme.waitTimeAccent}>
                        $
                        {currentBowlingSlot
                          ? currentBowlingSlot.price
                          : currentPrices?.bowling.timeSlots[0]?.price || 0}
                      </span>
                    </div>
                    <div
                      className={`${fullscreen ? "text-xl" : "text-lg"} ${colorScheme.waitTimeText} mt-2 opacity-80`}
                    >
                      {currentPrices?.bowling.priceText || "PER LANE, PER HOUR"}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`
                  ${colorScheme.priceText} 
                  ${fullscreen ? "text-5xl" : "text-3xl"} 
                  font-bold text-center
                `}
                  >
                    UNAVAILABLE
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-2xl mt-4" : "text-xl mt-3"} 
                    font-medium text-center
                  `}
                    >
                      Please check back later
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Special Friday Promotion Card */}
            {isFriday && (
              <SpecialPromotionCard
                title="FRIDAY SPECIAL"
                price={19.99}
                description="PER PERSON"
                items={[
                  "1 Hour of Bowling",
                  "Shoe Rental",
                  "$5 Arcade Card",
                  "Soft Drink or Domestic Draft",
                  "Up to 6 People Per Lane",
                ]}
                startTime="17:00"
                endTime="22:00"
                darkMode={isDarkMode}
                fullscreen={fullscreen}
              />
            )}

            {/* Interactive Darts */}
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
                {currentDartsSlot ? (
                  <TimeRangeDisplay startTime={currentDartsSlot.startTime} endTime={currentDartsSlot.endTime} />
                ) : (
                  "TODAY"
                )}
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
                INTERACTIVE DARTS
              </div>
              <div className={`flex-1 ${colorScheme.cardBackground} flex flex-col items-center justify-center p-8`}>
                {currentDartsSlot ? (
                  <>
                    <div
                      className={`
                    ${colorScheme.priceText} 
                    ${fullscreen ? "text-[180px] leading-none" : "text-8xl"} 
                    font-bold 
                    flex items-start
                  `}
                    >
                      <span className={fullscreen ? "text-[90px] mt-8" : "text-5xl mt-2"}>$</span>
                      {currentDartsPrice}
                    </div>
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-3xl mt-6" : "text-xl mt-4"} 
                    font-medium text-center
                  `}
                    >
                      {currentPrices?.darts.priceText || "PER LANE, PER HOUR"}
                    </div>

                    {/* Promotion banner at the bottom */}
                    {hasPromotion("darts") && (
                      <div className="w-full mt-6">
                        <div
                          className={`
                        ${colorScheme.cardSubheaderBg} 
                        text-white 
                        ${fullscreen ? "py-3 px-5" : "py-2 px-4"} 
                        text-center rounded-md shadow-md
                      `}
                        >
                          <div className={fullscreen ? "text-2xl font-bold" : "text-lg font-bold"}>SPECIAL OFFER</div>
                          {getPromotionsForActivity("darts").map((promo) => (
                            <div key={promo.id}>
                              <div className={fullscreen ? "text-xl font-medium" : "text-sm font-medium"}>
                                {promo.description}
                              </div>
                              {promo.terms && (
                                <div
                                  className={`${fullscreen ? "text-sm" : "text-xs"} mt-1 font-medium ${colorScheme.bannerBg} py-1 px-2 rounded`}
                                >
                                  {promo.terms}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className={`
                  ${colorScheme.priceText} 
                  ${fullscreen ? "text-5xl" : "text-3xl"} 
                  font-bold text-center
                `}
                  >
                    UNAVAILABLE
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-2xl mt-4" : "text-xl mt-3"} 
                    font-medium text-center
                  `}
                    >
                      Please check back later
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Laser Tag */}
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
                {currentLaserTagSlot ? (
                  <TimeRangeDisplay startTime={currentLaserTagSlot.startTime} endTime={currentLaserTagSlot.endTime} />
                ) : (
                  "TODAY"
                )}
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
                LASER TAG
              </div>
              <div className={`flex-1 ${colorScheme.cardBackground} flex flex-col items-center justify-center p-8`}>
                {currentLaserTagSlot ? (
                  <>
                    <div
                      className={`
                    ${colorScheme.priceText} 
                    ${fullscreen ? "text-[180px] leading-none" : "text-8xl"} 
                    font-bold 
                    flex items-start
                  `}
                    >
                      <span className={fullscreen ? "text-[90px] mt-8" : "text-5xl mt-2"}>$</span>
                      {currentLaserTagPrice}
                    </div>
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-3xl mt-6" : "text-xl mt-4"} 
                    font-medium text-center
                  `}
                    >
                      {currentPrices?.laserTag.priceText || "PER PERSON, PER SESSION"}
                    </div>
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-2xl mt-3" : "text-sm mt-2"} 
                    text-center
                  `}
                    >
                      44" HEIGHT REQUIREMENT
                    </div>

                    {/* Promotion banner at the bottom */}
                    {hasPromotion("laserTag") && (
                      <div className="w-full mt-6">
                        <div
                          className={`
                        ${colorScheme.cardSubheaderBg} 
                        text-white 
                        ${fullscreen ? "py-3 px-5" : "py-2 px-4"} 
                        text-center rounded-md shadow-md
                      `}
                        >
                          <div className={fullscreen ? "text-2xl font-bold" : "text-lg font-bold"}>SPECIAL OFFER</div>
                          {getPromotionsForActivity("laserTag").map((promo) => (
                            <div key={promo.id}>
                              <div className={fullscreen ? "text-xl font-medium" : "text-sm font-medium"}>
                                {promo.description}
                              </div>
                              {promo.terms && (
                                <div
                                  className={`${fullscreen ? "text-sm" : "text-xs"} mt-1 font-medium ${colorScheme.bannerBg} py-1 px-2 rounded`}
                                >
                                  {promo.terms}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className={`
                  ${colorScheme.priceText} 
                  ${fullscreen ? "text-5xl" : "text-3xl"} 
                  font-bold text-center
                `}
                  >
                    UNAVAILABLE
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-2xl mt-4" : "text-xl mt-3"} 
                    font-medium text-center
                  `}
                    >
                      Please check back later
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!isFriday && (
          <>
            {/* Regular layout for non-Friday days */}
            {/* Bowling Card */}
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
                {currentBowlingSlot ? (
                  <TimeRangeDisplay startTime={currentBowlingSlot.startTime} endTime={currentBowlingSlot.endTime} />
                ) : (
                  "TODAY"
                )}
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
                BOWLING
              </div>
              <div className={`flex-1 ${colorScheme.cardBackground} flex flex-col items-center justify-center p-8`}>
                {currentBowlingSlot ? (
                  <>
                    <div
                      className={`
                    ${colorScheme.priceText} 
                    ${fullscreen ? "text-[180px] leading-none" : "text-8xl"} 
                    font-bold 
                    flex items-start
                  `}
                    >
                      <span className={fullscreen ? "text-[90px] mt-8" : "text-5xl mt-2"}>$</span>
                      {currentBowlingPrice}
                    </div>
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-3xl mt-6" : "text-xl mt-4"} 
                    font-medium text-center
                  `}
                    >
                      {currentPrices?.bowling.priceText || "PER LANE, PER HOUR"}
                    </div>

                    {/* Promotion banner at the bottom */}
                    {hasPromotion("bowling") && (
                      <div className="w-full mt-6">
                        <div
                          className={`
                        ${colorScheme.cardSubheaderBg} 
                        text-white 
                        ${fullscreen ? "py-3 px-5" : "py-2 px-4"} 
                        text-center rounded-md shadow-md
                      `}
                        >
                          <div className={fullscreen ? "text-2xl font-bold" : "text-lg font-bold"}>SPECIAL OFFER</div>
                          {getPromotionsForActivity("bowling").map((promo) => (
                            <div key={promo.id}>
                              <div className={fullscreen ? "text-xl font-medium" : "text-sm font-medium"}>
                                {promo.description}
                              </div>
                              {promo.terms && (
                                <div
                                  className={`${fullscreen ? "text-sm" : "text-xs"} mt-1 font-medium ${colorScheme.bannerBg} py-1 px-2 rounded`}
                                >
                                  {promo.terms}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : currentPrices?.bowling.showWaitTime ? (
                  // Show wait time when bowling is unavailable but wait time is enabled
                  <div
                    className={`
                  ${colorScheme.waitTimeBg}
                  p-6 rounded-lg text-center w-full
                `}
                  >
                    <div className="flex items-center justify-center mb-4">
                      <Clock className={`${fullscreen ? "h-12 w-12" : "h-8 w-8"} ${colorScheme.waitTimeAccent} mr-3`} />
                      <div className={`${fullscreen ? "text-4xl" : "text-3xl"} font-bold ${colorScheme.waitTimeText}`}>
                        WAIT TIME
                      </div>
                    </div>

                    {/* Stacked wait time display */}
                    <div className="flex flex-col items-center">
                      {/* Get hours and minutes */}
                      {(() => {
                        const { hours, minutes } = getHoursAndMinutes(currentPrices?.bowling.waitTime || 30)
                        return (
                          <>
                            {hours > 0 && (
                              <div
                                className={`${fullscreen ? "text-7xl" : "text-6xl"} font-bold ${colorScheme.waitTimeAccent}`}
                              >
                                {hours} <span className={`${fullscreen ? "text-4xl" : "text-3xl"}`}>HR</span>
                              </div>
                            )}
                            <div
                              className={`
                            ${fullscreen ? "text-7xl" : "text-6xl"} 
                            font-bold 
                            ${colorScheme.waitTimeAccent}
                            ${hours > 0 ? "mt-2" : ""}
                          `}
                            >
                              {minutes} <span className={`${fullscreen ? "text-4xl" : "text-3xl"}`}>MIN</span>
                            </div>
                          </>
                        )
                      })()}
                    </div>

                    {/* Use the current time slot's price for wait time display */}
                    <div className={`${fullscreen ? "text-2xl" : "text-xl"} ${colorScheme.waitTimeText} mt-6`}>
                      CURRENT PRICE:{" "}
                      <span className={colorScheme.waitTimeAccent}>
                        $
                        {currentBowlingSlot
                          ? currentBowlingSlot.price
                          : currentPrices?.bowling.timeSlots[0]?.price || 0}
                      </span>
                    </div>
                    <div
                      className={`${fullscreen ? "text-xl" : "text-lg"} ${colorScheme.waitTimeText} mt-2 opacity-80`}
                    >
                      {currentPrices?.bowling.priceText || "PER LANE, PER HOUR"}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`
                  ${colorScheme.priceText} 
                  ${fullscreen ? "text-5xl" : "text-3xl"} 
                  font-bold text-center
                `}
                  >
                    UNAVAILABLE
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-2xl mt-4" : "text-xl mt-3"} 
                    font-medium text-center
                  `}
                    >
                      Please check back later
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Darts */}
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
                {currentDartsSlot ? (
                  <TimeRangeDisplay startTime={currentDartsSlot.startTime} endTime={currentDartsSlot.endTime} />
                ) : (
                  "TODAY"
                )}
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
                INTERACTIVE DARTS
              </div>
              <div className={`flex-1 ${colorScheme.cardBackground} flex flex-col items-center justify-center p-8`}>
                {currentDartsSlot ? (
                  <>
                    <div
                      className={`
                    ${colorScheme.priceText} 
                    ${fullscreen ? "text-[180px] leading-none" : "text-8xl"} 
                    font-bold 
                    flex items-start
                  `}
                    >
                      <span className={fullscreen ? "text-[90px] mt-8" : "text-5xl mt-2"}>$</span>
                      {currentDartsPrice}
                    </div>
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-3xl mt-6" : "text-xl mt-4"} 
                    font-medium text-center
                  `}
                    >
                      {currentPrices?.darts.priceText || "PER LANE, PER HOUR"}
                    </div>

                    {/* Promotion banner at the bottom */}
                    {hasPromotion("darts") && (
                      <div className="w-full mt-6">
                        <div
                          className={`
                        ${colorScheme.cardSubheaderBg} 
                        text-white 
                        ${fullscreen ? "py-3 px-5" : "py-2 px-4"} 
                        text-center rounded-md shadow-md
                      `}
                        >
                          <div className={fullscreen ? "text-2xl font-bold" : "text-lg font-bold"}>SPECIAL OFFER</div>
                          {getPromotionsForActivity("darts").map((promo) => (
                            <div key={promo.id}>
                              <div className={fullscreen ? "text-xl font-medium" : "text-sm font-medium"}>
                                {promo.description}
                              </div>
                              {promo.terms && (
                                <div
                                  className={`${fullscreen ? "text-sm" : "text-xs"} mt-1 font-medium ${colorScheme.bannerBg} py-1 px-2 rounded`}
                                >
                                  {promo.terms}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className={`
                  ${colorScheme.priceText} 
                  ${fullscreen ? "text-5xl" : "text-3xl"} 
                  font-bold text-center
                `}
                  >
                    UNAVAILABLE
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-2xl mt-4" : "text-xl mt-3"} 
                    font-medium text-center
                  `}
                    >
                      Please check back later
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Laser Tag */}
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
                {currentLaserTagSlot ? (
                  <TimeRangeDisplay startTime={currentLaserTagSlot.startTime} endTime={currentLaserTagSlot.endTime} />
                ) : (
                  "TODAY"
                )}
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
                LASER TAG
              </div>
              <div className={`flex-1 ${colorScheme.cardBackground} flex flex-col items-center justify-center p-8`}>
                {currentLaserTagSlot ? (
                  <>
                    <div
                      className={`
                    ${colorScheme.priceText} 
                    ${fullscreen ? "text-[180px] leading-none" : "text-8xl"} 
                    font-bold 
                    flex items-start
                  `}
                    >
                      <span className={fullscreen ? "text-[90px] mt-8" : "text-5xl mt-2"}>$</span>
                      {currentLaserTagPrice}
                    </div>
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-3xl mt-6" : "text-xl mt-4"} 
                    font-medium text-center
                  `}
                    >
                      {currentPrices?.laserTag.priceText || "PER PERSON, PER SESSION"}
                    </div>
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-2xl mt-3" : "text-sm mt-2"} 
                    text-center
                  `}
                    >
                      44" HEIGHT REQUIREMENT
                    </div>

                    {/* Promotion banner at the bottom */}
                    {hasPromotion("laserTag") && (
                      <div className="w-full mt-6">
                        <div
                          className={`
                        ${colorScheme.cardSubheaderBg} 
                        text-white 
                        ${fullscreen ? "py-3 px-5" : "py-2 px-4"} 
                        text-center rounded-md shadow-md
                      `}
                        >
                          <div className={fullscreen ? "text-2xl font-bold" : "text-lg font-bold"}>SPECIAL OFFER</div>
                          {getPromotionsForActivity("laserTag").map((promo) => (
                            <div key={promo.id}>
                              <div className={fullscreen ? "text-xl font-medium" : "text-sm font-medium"}>
                                {promo.description}
                              </div>
                              {promo.terms && (
                                <div
                                  className={`${fullscreen ? "text-sm" : "text-xs"} mt-1 font-medium ${colorScheme.bannerBg} py-1 px-2 rounded`}
                                >
                                  {promo.terms}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className={`
                  ${colorScheme.priceText} 
                  ${fullscreen ? "text-5xl" : "text-3xl"} 
                  font-bold text-center
                `}
                  >
                    UNAVAILABLE
                    <div
                      className={`
                    ${colorScheme.accentText} 
                    ${fullscreen ? "text-2xl mt-4" : "text-xl mt-3"} 
                    font-medium text-center
                  `}
                    >
                      Please check back later
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className={fullscreen ? "mt-10 text-center" : "mt-8 text-center"}>
        <div className={`${fullscreen ? "text-4xl" : "text-3xl"} font-bold ${colorScheme.text} mb-4`}>
          <span className={colorScheme.accentText}>$4.50</span> BOWLING SHOES{" "}
          <span className={colorScheme.accentText}>FOR ALL BOWLERS</span>
        </div>
        {isEditingDisclaimer ? (
          <div className="relative w-full max-w-5xl mx-auto">
            <textarea
              value={disclaimerText}
              onChange={(e) => setDisclaimerText(e.target.value)}
              className={`
                w-full p-2 border rounded
                ${fullscreen ? "h-24 text-sm" : "h-20 text-xs"} 
                ${isDarkMode ? "bg-[#1e293b] text-gray-300 border-gray-700" : "bg-white text-gray-700 border-gray-300"} 
              `}
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={handleCancelEdit}
                className={`px-3 py-1 rounded text-xs ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDisclaimer}
                className={`px-3 py-1 rounded text-xs ${isDarkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`
              ${fullscreen ? "mt-5 text-sm" : "mt-4 text-xs"} 
              ${colorScheme.disclaimerText} 
              max-w-5xl mx-auto relative group
            `}
            onClick={() => setIsEditingDisclaimer(true)}
          >
            {savedDisclaimerText}
            <button
              className={`
                absolute right-0 top-0 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800"}
              `}
              onClick={(e) => {
                e.stopPropagation()
                setIsEditingDisclaimer(true)
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
