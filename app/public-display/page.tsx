import { getDayPrices, getPromotions } from "@/lib/db"

// Force dynamic rendering with no caching
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export default async function PublicDisplayPage() {
  // Get the current timestamp and ensure it's fresh
  const timestamp = Date.now()

  // Fetch fresh data directly from the database
  const prices = await getDayPrices()
  const promotions = await getPromotions()

  // Get the current day of the week
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const today = days[new Date().getDay()]

  // Find today's prices
  const todayPrices = prices.find((p) => p.day === today) || prices[0]

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Outta Boundz Price Board</title>
        {/* Add cache control headers */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <style>{`
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
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }
          .day-title {
            font-size: 64px;
            font-weight: bold;
            color: #2d455a;
            text-transform: uppercase;
            flex-grow: 1;
            text-align: center;
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
            font-size: 10px;
            color: #666;
            max-width: 1000px;
            margin: 0 auto;
            text-align: center;
            line-height: 1.3;
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
          .version-info {
            position: fixed;
            bottom: 5px;
            right: 5px;
            font-size: 10px;
            color: rgba(0,0,0,0.2);
          }
        `}</style>
      </head>
      <body>
        <div className="price-board">
          <div className="header-section">
            <div className="header">
              <div style={{ width: "32px" }}></div>
              <h1 className="day-title" id="day-title">
                {today.toUpperCase()} PRICING
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
                  {todayPrices.bowling.isAvailable && todayPrices.bowling.timeSlots.length > 0
                    ? `${formatTimeDisplay(todayPrices.bowling.timeSlots[0].startTime)} - ${formatTimeDisplay(todayPrices.bowling.timeSlots[0].endTime)}`
                    : "TODAY"}
                </div>
                <div className="card-subheader">BOWLING</div>
                <div className="card-body">
                  {todayPrices.bowling.isAvailable && todayPrices.bowling.timeSlots.length > 0 ? (
                    <>
                      <div className="price">
                        <span className="dollar">$</span>
                        {todayPrices.bowling.timeSlots[0].price}
                      </div>
                      <div className="price-note">PER LANE, PER HOUR</div>

                      {hasActivePromotion(promotions, today, "bowling") && (
                        <div className="promotion-banner">
                          <div className="banner-title">SPECIAL OFFER</div>
                          <div className="banner-description">
                            {getActivePromotion(promotions, today, "bowling")?.description}
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

              {/* Interactive Darts Card */}
              <div className="price-card">
                <div className="card-header" id="darts-header">
                  {todayPrices.darts.isAvailable && todayPrices.darts.timeSlots.length > 0
                    ? `${formatTimeDisplay(todayPrices.darts.timeSlots[0].startTime)} - ${formatTimeDisplay(todayPrices.darts.timeSlots[0].endTime)}`
                    : "TODAY"}
                </div>
                <div className="card-subheader">INTERACTIVE DARTS</div>
                <div className="card-body">
                  {todayPrices.darts.isAvailable && todayPrices.darts.timeSlots.length > 0 ? (
                    <>
                      <div className="price">
                        <span className="dollar">$</span>
                        {todayPrices.darts.timeSlots[0].price}
                      </div>
                      <div className="price-note">PER LANE, PER HOUR</div>

                      {hasActivePromotion(promotions, today, "darts") && (
                        <div className="promotion-banner">
                          <div className="banner-title">SPECIAL OFFER</div>
                          <div className="banner-description">
                            {getActivePromotion(promotions, today, "darts")?.description}
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
                  {todayPrices.laserTag.isAvailable && todayPrices.laserTag.timeSlots.length > 0
                    ? `${formatTimeDisplay(todayPrices.laserTag.timeSlots[0].startTime)} - ${formatTimeDisplay(todayPrices.laserTag.timeSlots[0].endTime)}`
                    : "TODAY"}
                </div>
                <div className="card-subheader">LASER TAG</div>
                <div className="card-body">
                  {todayPrices.laserTag.isAvailable && todayPrices.laserTag.timeSlots.length > 0 ? (
                    <>
                      <div className="price">
                        <span className="dollar">$</span>
                        {todayPrices.laserTag.timeSlots[0].price}
                      </div>
                      <div className="price-note">PER PERSON, PER SESSION</div>
                      <div className="height-req">44" HEIGHT REQUIREMENT</div>

                      {hasActivePromotion(promotions, today, "laserTag") && (
                        <div className="promotion-banner">
                          <div className="banner-title">SPECIAL OFFER</div>
                          <div className="banner-description">
                            {getActivePromotion(promotions, today, "laserTag")?.description}
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

        <div id="update-indicator" className="update-indicator"></div>
        <div className="version-info">Updated: {new Date().toLocaleString()}</div>

        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Initialize variables
            const currentDay = "${today}";
            const timestamp = ${timestamp};
            
            // Update the time display every second
            function updateTimeDisplay() {
              const timeDisplay = document.getElementById('time-display');
              if (timeDisplay) {
                timeDisplay.textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              }
            }
            
            // Check if the day has changed
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
            
            // Set up intervals for updates
            setInterval(updateTimeDisplay, 1000); // Update time every second
            setInterval(checkDayChange, 60000); // Check for day change every minute
            
            // Force a full page reload every 5 minutes to ensure fresh data
            setInterval(() => {
              window.location.reload();
            }, 300000);
            
            // Also check at midnight for day change
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const timeToMidnight = tomorrow - now;
            
            setTimeout(() => {
              window.location.reload(); // Force reload at midnight
            }, timeToMidnight);
            
            // Connect to Supabase for real-time updates if available
            try {
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
              script.onload = function() {
                const supabaseUrl = "${process.env.NEXT_PUBLIC_SUPABASE_URL}";
                const supabaseAnonKey = "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}";
                
                if (supabaseUrl && supabaseAnonKey) {
                  const supabase = supabaseJs.createClient(supabaseUrl, supabaseAnonKey);
                  
                  // Subscribe to changes in the day_prices table
                  supabase
                    .channel('day_prices_changes')
                    .on('postgres_changes', { 
                      event: '*', 
                      schema: 'public', 
                      table: 'day_prices' 
                    }, (payload) => {
                      console.log('Day prices changed, reloading...');
                      window.location.reload();
                    })
                    .subscribe();
                  
                  // Subscribe to changes in the promotions table
                  supabase
                    .channel('promotions_changes')
                    .on('postgres_changes', { 
                      event: '*', 
                      schema: 'public', 
                      table: 'promotions' 
                    }, (payload) => {
                      console.log('Promotions changed, reloading...');
                      window.location.reload();
                    })
                    .subscribe();
                }
              };
              document.head.appendChild(script);
            } catch (error) {
              console.error('Failed to set up Supabase real-time:', error);
            }
          `,
          }}
        />
      </body>
    </html>
  )
}

// Helper function to format time for display
function formatTimeDisplay(time: string): string {
  if (time === "CLOSE") return "CLOSE"

  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : ""} ${period}`
}

// Helper function to check if there's an active promotion for an activity
function hasActivePromotion(promotions: any[], day: string, activity: string): boolean {
  const currentDate = new Date()
  return promotions.some(
    (promo) =>
      promo.isActive &&
      promo.applicableDays.includes(day) &&
      promo.applicableActivities.includes(activity) &&
      new Date(promo.startDate) <= currentDate &&
      new Date(promo.endDate) >= currentDate,
  )
}

// Helper function to get active promotion for an activity
function getActivePromotion(promotions: any[], day: string, activity: string): any {
  const currentDate = new Date()
  return promotions.find(
    (promo) =>
      promo.isActive &&
      promo.applicableDays.includes(day) &&
      promo.applicableActivities.includes(activity) &&
      new Date(promo.startDate) <= currentDate &&
      new Date(promo.endDate) >= currentDate,
  )
}
