import { getDayPrices, getPromotions } from "@/lib/db"

// Disable Next.js caching for this route
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

interface TimeSlot {
  startTime: string
  endTime: string
  price: number
}

// Update the getCurrentTimeSlot function to be more robust
const getCurrentTimeSlot = (timeSlots: TimeSlot[], isAvailable: boolean) => {
  // If the activity is marked as unavailable or has no time slots, return null
  if (!isAvailable || !timeSlots || timeSlots.length === 0) return null

  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

  // Try to find a matching time slot
  const slot = timeSlots.find((slot) => {
    if (slot.endTime === "CLOSE") {
      return currentTime >= slot.startTime
    }
    return currentTime >= slot.startTime && currentTime < slot.endTime
  })

  // Return the found slot or the first slot as fallback
  return slot || timeSlots[0]
}

const formatTimeRange = (startTime: string, endTime: string) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const date = new Date()
    date.setHours(hours)
    date.setMinutes(minutes)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true })
  }

  const formattedStartTime = formatTime(startTime)
  const formattedEndTime = endTime === "CLOSE" ? "Close" : formatTime(endTime)

  return `${formattedStartTime} - ${formattedEndTime}`
}

export default async function DirectBoardPage() {
  // Add cache-busting timestamp
  const timestamp = Date.now()

  const prices = await getDayPrices()
  const promotions = await getPromotions()

  // Get the current day of the week
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const today = days[new Date().getDay()]

  // Find today's prices
  const todayPrices = prices.find((p) => p.day === today) || prices[0]

  // Get current time slots and prices
  const currentBowlingSlot = getCurrentTimeSlot(todayPrices.bowling.timeSlots, todayPrices.bowling.isAvailable)
  const currentBowlingPrice = currentBowlingSlot?.price || 0
  const currentBowlingTimeRange = currentBowlingSlot
    ? formatTimeRange(currentBowlingSlot.startTime, currentBowlingSlot.endTime)
    : "TODAY"

  const currentDartsSlot = getCurrentTimeSlot(todayPrices.darts.timeSlots, todayPrices.darts.isAvailable)
  const currentDartsPrice = currentDartsSlot?.price || 0
  const currentDartsTimeRange = currentDartsSlot
    ? formatTimeRange(currentDartsSlot.startTime, currentDartsSlot.endTime)
    : "TODAY"

  const currentLaserTagSlot = getCurrentTimeSlot(todayPrices.laserTag.timeSlots, todayPrices.laserTag.isAvailable)
  const currentLaserTagPrice = currentLaserTagSlot?.price || 0
  const currentLaserTagTimeRange = currentLaserTagSlot
    ? formatTimeRange(currentLaserTagSlot.startTime, currentLaserTagSlot.endTime)
    : "TODAY"

  // Add debug logging for promotions
  console.log(`Direct board rendering for ${today}`)
  console.log(
    `Laser Tag available: ${todayPrices.laserTag.isAvailable}, time slots: ${todayPrices.laserTag.timeSlots.length}`,
  )

  // Add this new logging for promotions
  const activePromotions = promotions.filter(
    (promo) =>
      promo.isActive &&
      promo.applicableDays.includes(today) &&
      new Date(promo.startDate) <= new Date() &&
      new Date(promo.endDate) >= new Date(),
  )
  console.log(`Active promotions for ${today}: ${activePromotions.length}`)
  if (activePromotions.length > 0) {
    console.log("Active promotion details:", JSON.stringify(activePromotions))
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Reduce refresh time to 15 seconds */}
        <meta httpEquiv="refresh" content="15" />
        {/* Add cache control headers */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <title>Direct Price Board ({timestamp})</title>
        {/* Add this to the HTML head section */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Store the current day for comparison
            const currentDay = "${today}";
            
            // Function to check if the day has changed
            function checkDayChange() {
              const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              const now = new Date();
              const today = days[now.getDay()];
              
              // If the day has changed, reload the page
              if (today !== currentDay) {
                console.log('Day changed from ' + currentDay + ' to ' + today + ', reloading...');
                window.location.reload();
              }
            }
            
            // Check for day change every minute
            setInterval(checkDayChange, 60000);
            
            // Also check at midnight
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const timeToMidnight = tomorrow.getTime() - now.getTime();
            
            // Set a timeout to refresh the page at midnight
            setTimeout(() => {
              window.location.reload();
            }, timeToMidnight);
            
            // Force a full page reload every 5 minutes to ensure fresh data
            setInterval(() => {
              window.location.reload();
            }, 300000);
          `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* Add these styles for unavailable activities */
          .unavailable {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .unavailable-text {
            color: #2d455a;
            font-size: 64px;
            font-weight: bold;
            text-align: center;
          }
          .unavailable-note {
            color: #ff8210;
            font-size: 30px;
            margin-top: 20px;
            font-weight: 500;
            text-align: center;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }
          html, body {
            width: 1920px;
            height: 1080px;
            overflow: hidden;
            background-color: #f5f5f5;
            color: #2d455a;
          }
          .price-board {
            width: 100%;
            height: 100%;
            padding: 40px 60px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header-section {
            margin-bottom: 40px;
          }
          .header {
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 30px;
            margin-bottom: 30px;
          }
          .day-title {
            font-size: 64px;
            font-weight: bold;
            color: #2d455a;
            text-transform: uppercase;
          }
          .time-display {
            font-size: 36px;
            font-weight: 500;
            color: #ff8210;
            background-color: white;
            padding: 8px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .subtitle {
            font-size: 36px;
            font-weight: 500;
            color: #2d455a;
            text-align: center;
          }
          .underline {
            text-decoration: underline;
            font-weight: 600;
          }
          .cards-section {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 20px 0;
          }
          .cards-container {
            display: flex;
            justify-content: space-between;
            width: 100%;
            gap: 60px;
            height: 600px;
          }
          .price-card {
            flex: 1;
            display: flex;
            flex-direction: column;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            position: relative;
            max-width: 600px;
          }
          .card-header {
            background-color: #2d455a;
            color: white;
            text-align: center;
            font-size: 36px;
            font-weight: bold;
            height: 90px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card-subheader {
            background-color: #ff8210;
            color: white;
            text-align: center;
            font-size: 42px;
            font-weight: bold;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card-body {
            flex: 1;
            background-color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
          }
          .price {
            color: #2d455a;
            font-size: 180px;
            font-weight: bold;
            display: flex;
            align-items: flex-start;
            line-height: 1;
          }
          .dollar {
            font-size: 90px;
            margin-top: 30px;
          }
          .price-note {
            color: #ff8210;
            font-size: 30px;
            margin-top: 30px;
            font-weight: 500;
            text-align: center;
            width: 100%;
          }
          .height-req {
            color: #ff8210;
            font-size: 24px;
            margin-top: 15px;
            text-align: center;
            width: 100%;
          }
          .footer-section {
            margin-top: 40px;
          }
          .footer {
            text-align: center;
          }
          .shoe-price {
            font-size: 42px;
            font-weight: bold;
            color: #2d455a;
            margin-bottom: 20px;
          }
          .orange-text {
            color: #ff8210;
          }
          .disclaimer {
            font-size: 16px;
            color: #666;
            max-width: 1600px;
            margin: 0 auto;
          }
          .promotion-banner {
            width: 100%;
            background-color: #ff8210;
            color: white;
            padding: 15px;
            text-align: center;
            margin-top: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          .banner-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .banner-description {
            font-size: 24px;
          }
          .debug-info {
            position: fixed;
            bottom: 5px;
            right: 5px;
            font-size: 12px;
            color: rgba(0,0,0,0.3);
            text-align: right;
          }
          .update-indicator {
            position: fixed;
            bottom: 5px;
            left: 5px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: #ff8210;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .update-indicator.active {
            opacity: 1;
          }
          .banner-terms {
            font-size: 16px;
            background-color: rgba(0,0,0,0.2);
            padding: 4px 8px;
            border-radius: 4px;
            margin-top: 4px;
          }
        `,
          }}
        />
      </head>
      <body>
        <div className="price-board">
          <div className="header-section">
            <div className="header">
              <div style={{ width: "32px" }}></div> {/* Empty div for balance */}
              <h1 className="day-title" id="day-title">
                {todayPrices.day.toUpperCase()} PRICING
              </h1>
              <div className="time-display" id="time-display">
                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            <div className="subtitle">
              HOURLY RATES LISTED <span className="underline">PER LANE</span>, GROUPS OF{" "}
              <span className="underline">1-6 PLAYERS PER LANE</span>.
            </div>
          </div>

          <div className="cards-section">
            <div className="cards-container">
              {/* Bowling Card */}
              <div className="price-card">
                <div className="card-header" id="bowling-header">
                  {currentBowlingTimeRange}
                </div>
                <div className="card-subheader">BOWLING</div>
                <div className="card-body">
                  {currentBowlingSlot ? (
                    <>
                      <div className="price">
                        <span className="dollar">$</span>
                        {currentBowlingPrice}
                      </div>
                      <div className="price-note">PER LANE, PER HOUR</div>
                      {/* Promotion banner */}
                      {promotions.some(
                        (p) =>
                          p.isActive &&
                          p.applicableDays.includes(todayPrices.day) &&
                          p.applicableActivities.includes("bowling") &&
                          new Date() >= new Date(p.startDate) &&
                          new Date() <= new Date(p.endDate),
                      ) && (
                        <div className="promotion-banner">
                          <div className="banner-title">SPECIAL OFFER</div>
                          <div className="banner-description">
                            {
                              promotions.find(
                                (p) =>
                                  p.isActive &&
                                  p.applicableDays.includes(todayPrices.day) &&
                                  p.applicableActivities.includes("bowling") &&
                                  new Date() >= new Date(p.startDate) &&
                                  new Date() <= new Date(p.endDate),
                              )?.description
                            }
                          </div>
                          {promotions.find(
                            (p) =>
                              p.isActive &&
                              p.applicableDays.includes(todayPrices.day) &&
                              p.applicableActivities.includes("bowling") &&
                              new Date() >= new Date(p.startDate) &&
                              new Date() <= new Date(p.endDate),
                          )?.terms && (
                            <div className="banner-terms">
                              {
                                promotions.find(
                                  (p) =>
                                    p.isActive &&
                                    p.applicableDays.includes(todayPrices.day) &&
                                    p.applicableActivities.includes("bowling") &&
                                    new Date() >= new Date(p.startDate) &&
                                    new Date() <= new Date(p.endDate),
                                )?.terms
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="unavailable">
                      <div className="unavailable-text">UNAVAILABLE</div>
                      <div className="unavailable-note">Please check back later</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Darts Card */}
              <div className="price-card">
                <div className="card-header" id="darts-header">
                  {currentDartsTimeRange}
                </div>
                <div className="card-subheader">INTERACTIVE DARTS</div>
                <div className="card-body">
                  {currentDartsSlot ? (
                    <>
                      <div className="price">
                        <span className="dollar">$</span>
                        {currentDartsPrice}
                      </div>
                      <div className="price-note">PER LANE, PER HOUR</div>
                      {/* Promotion banner */}
                      {promotions.some(
                        (p) =>
                          p.isActive &&
                          p.applicableDays.includes(todayPrices.day) &&
                          p.applicableActivities.includes("darts") &&
                          new Date() >= new Date(p.startDate) &&
                          new Date() <= new Date(p.endDate),
                      ) && (
                        <div className="promotion-banner">
                          <div className="banner-title">SPECIAL OFFER</div>
                          <div className="banner-description">
                            {
                              promotions.find(
                                (p) =>
                                  p.isActive &&
                                  p.applicableDays.includes(todayPrices.day) &&
                                  p.applicableActivities.includes("darts") &&
                                  new Date() >= new Date(p.startDate) &&
                                  new Date() <= new Date(p.endDate),
                              )?.description
                            }
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="unavailable">
                      <div className="unavailable-text">UNAVAILABLE</div>
                      <div className="unavailable-note">Please check back later</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Laser Tag Card */}
              <div className="price-card">
                <div className="card-header" id="laserTag-header">
                  {currentLaserTagTimeRange}
                </div>
                <div className="card-subheader">LASER TAG</div>
                <div className="card-body">
                  {currentLaserTagSlot ? (
                    <>
                      <div className="price">
                        <span className="dollar">$</span>
                        {currentLaserTagPrice}
                      </div>
                      <div className="price-note">PER PERSON, PER SESSION</div>
                      <div className="height-req">44" HEIGHT REQUIREMENT</div>
                      {/* Promotion banner */}
                      {promotions.some(
                        (p) =>
                          p.isActive &&
                          p.applicableDays.includes(todayPrices.day) &&
                          p.applicableActivities.includes("laserTag") &&
                          new Date() >= new Date(p.startDate) &&
                          new Date() <= new Date(p.endDate),
                      ) && (
                        <div className="promotion-banner">
                          <div className="banner-title">SPECIAL OFFER</div>
                          <div className="banner-description">
                            {
                              promotions.find(
                                (p) =>
                                  p.isActive &&
                                  p.applicableDays.includes(todayPrices.day) &&
                                  p.applicableActivities.includes("laserTag") &&
                                  new Date() >= new Date(p.startDate) &&
                                  new Date() <= new Date(p.endDate),
                              )?.description
                            }
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="unavailable">
                      <div className="unavailable-text">UNAVAILABLE</div>
                      <div className="unavailable-note">Please check back later</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="footer-section">
            <div className="footer">
              <div className="shoe-price">
                <span className="orange-text">$4.50</span> BOWLING SHOES{" "}
                <span className="orange-text">FOR ALL BOWLERS</span>
              </div>
              <div className="disclaimer">
                Offers and prices are subject to change without notice. Some age, height, and other restrictions apply.
                Bonus gameplay amount has no cash value and is redeemable on non-redemption games only. No outside food
                or beverages are allowed. Game cards are required for most attractions and maybe an additional cost. No
                refunds or substitutions. Cannot be combined with any other offer or discount. See attendant for
                details.
              </div>
            </div>
          </div>
        </div>

        {/* Update indicator */}
        <div id="update-indicator" className="update-indicator"></div>

        {/* Debug info with timestamp and data */}
        <div className="debug-info">
          Generated: {new Date().toLocaleString()}
          <br />
          Version: {timestamp}
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Update time display every second
            setInterval(() => {
              const timeDisplay = document.getElementById('time-display');
              if (timeDisplay) {
                timeDisplay.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              }
            }, 1000);
            
            // Show update indicator when page refreshes
            const indicator = document.getElementById('update-indicator');
            if (indicator) {
              indicator.classList.add('active');
              setTimeout(() => {
                indicator.classList.remove('active');
              }, 1000);
            }
          `,
          }}
        />
      </body>
    </html>
  )
}
