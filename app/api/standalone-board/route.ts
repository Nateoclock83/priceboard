import { NextResponse } from "next/server"
import { getDayPrices, getPromotions } from "@/lib/db"

// Disable Next.js caching for this route
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

export async function GET(request: Request) {
  try {
    // Get the current timestamp to prevent caching
    const timestamp = new Date().getTime()

    // Fetch fresh data directly with cache-busting query parameter
    const prices = await getDayPrices()
    const promotions = await getPromotions()

    console.log(`[${timestamp}] Standalone board requested - serving fresh data`)

    // Generate standalone HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Removed meta refresh to prevent screen flashing -->
<title>Outta Boundz Price Board (${timestamp})</title>
<style>
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
    height: 600px; /* Fixed height for cards */
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
</style>
</head>
<body>
<div class="price-board">
  <div class="header-section">
    <div class="header">
      <div style="width: 32px;"></div> <!-- Empty div for balance -->
      <h1 class="day-title" id="day-title">LOADING...</h1>
      <div class="time-display" id="time-display">--:--</div>
    </div>
    
    <div class="subtitle">
      HOURLY RATES LISTED <span class="underline">PER LANE</span>, GROUPS OF <span class="underline">1-6 PLAYERS PER LANE</span>.
    </div>
  </div>

  <div class="cards-section">
    <div class="cards-container">
      <!-- Bowling Card -->
      <div class="price-card" id="bowling-card">
        <div class="card-header" id="bowling-header">OPEN - CLOSE</div>
        <div class="card-subheader">BOWLING</div>
        <div class="card-body" id="bowling-card-body">
          <!-- This will be populated by JavaScript -->
        </div>
      </div>

      <!-- Interactive Darts Card -->
      <div class="price-card" id="darts-card">
        <div class="card-header" id="darts-header">OPEN - CLOSE</div>
        <div class="card-subheader">INTERACTIVE DARTS</div>
        <div class="card-body" id="darts-card-body">
          <!-- This will be populated by JavaScript -->
        </div>
      </div>

      <!-- Laser Tag Card -->
      <div class="price-card" id="laserTag-card">
        <div class="card-header" id="laserTag-header">OPEN - CLOSE</div>
        <div class="card-subheader">LASER TAG</div>
        <div class="card-body" id="laserTag-card-body">
          <!-- This will be populated by JavaScript -->
        </div>
      </div>
    </div>
  </div>

  <div class="footer-section">
    <div class="footer">
      <div class="shoe-price">
        <span class="orange-text">$4.50</span> BOWLING SHOES <span class="orange-text">FOR ALL BOWLERS</span>
      </div>
      <div class="disclaimer">
        Offers and prices are subject to change without notice. Some age, height, and other restrictions apply. Bonus gameplay amount has no cash value and is redeemable on non-redemption games only. No outside food or beverages are allowed. Game cards are required for most attractions and maybe an additional cost. No refunds or substitutions. Cannot be combined with any other offer or discount. See attendant for details.
      </div>
    </div>
  </div>
</div>

<!-- Update indicator (subtle visual cue when data updates) -->
<div id="update-indicator" class="update-indicator"></div>

<!-- Debug info with timestamp and data -->
<div class="debug-info">
  Generated: ${new Date().toLocaleString()}<br>
  Data Version: ${timestamp}<br>
  Last Update: <span id="last-update-time">Initial load</span>
</div>

<script>
// Add a cache-busting fetch function for data
async function fetchFreshData() {
  try {
    const response = await fetch('/api/data?t=' + Date.now());
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return {
      priceData: data.prices,
      promotionsData: data.promotions
    };
  } catch (error) {
    console.error('Error fetching fresh data:', error);
    // Fall back to embedded data if fetch fails
    return {
      priceData: ${JSON.stringify(prices)},
      promotionsData: ${JSON.stringify(promotions)}
    };
  }
}

// Embedded price and promotion data - used as fallback
let priceData = ${JSON.stringify(prices)};
let promotionsData = ${JSON.stringify(promotions)};

// Helper function to format time as HH:MM AM/PM
function formatTime(time) {
  const [hour, minute] = time.split(':');
  let ampm = 'AM';
  let formattedHour = parseInt(hour, 10);
  
  if (formattedHour >= 12) {
    ampm = 'PM';
    if (formattedHour > 12) {
      formattedHour -= 12;
    }
  }
  if (formattedHour === 0) {
    formattedHour = 12;
  }
  
  return formattedHour + ':' + minute + ' ' + ampm;
}

// Helper function to format a time range
function formatTimeRange(startTime, endTime) {
  if (endTime === "CLOSE") {
    return formatTime(startTime) + " - CLOSE";
  }
  return formatTime(startTime) + " - " + formatTime(endTime);
}

// Helper function to get current time in HH:MM format
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return hours + ':' + minutes;
}

// Check if a time is within a time slot
function isTimeInSlot(currentTime, startTime, endTime) {
  if (endTime === "CLOSE") {
    return currentTime >= startTime;
  }
  return currentTime >= startTime && currentTime < endTime;
}

// Get current time slot for an activity
function getCurrentTimeSlot(timeSlots, isAvailable) {
  // If the activity is marked as unavailable, return null
  if (!isAvailable) return null;

  const currentTime = getCurrentTime();

  const slot = timeSlots.find(slot => 
    isTimeInSlot(currentTime, slot.startTime, slot.endTime)
  );

  // Return the found slot or null if no applicable time slot
  return slot || null;
}

// Render activity content based on availability and current time slot
function renderActivityContent(activityId, activityData) {
  const cardBody = document.getElementById(\`\${activityId}-card-body\`);
  const currentSlot = getCurrentTimeSlot(activityData.timeSlots, activityData.isAvailable);
  
  if (currentSlot) {
    // Activity is available with a current time slot
    let content = \`
      <div class="price"><span class="dollar">$</span>\${currentSlot.price}</div>
      <div class="price-note">\${activityId === 'laserTag' ? 'PER PERSON, PER SESSION' : 'PER LANE, PER HOUR'}</div>
    \`;
    
    // Add height requirement for laser tag
    if (activityId === 'laserTag') {
      content += \`<div class="height-req">44" HEIGHT REQUIREMENT</div>\`;
    }
    
    // Check for promotions
    const activePromo = getActivePromotion(activityId);
    if (activePromo) {
      content += \`
        <div class="promotion-banner">
          <div class="banner-title">SPECIAL OFFER</div>
          <div class="banner-description">\${activePromo.description}</div>
        </div>
      \`;
    }
    
    cardBody.innerHTML = content;
  } else {
    // Activity is unavailable
    cardBody.innerHTML = \`
      <div class="unavailable">
        <div class="unavailable-text">UNAVAILABLE</div>
        <div class="unavailable-note">Please check back later</div>
      </div>
    \`;
  }
}

// Get active promotion for an activity
function getActivePromotion(activityId) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const currentDate = new Date();
  
  return promotionsData.find(promo => 
    promo.isActive && 
    promo.applicableDays.includes(today) && 
    promo.applicableActivities.includes(activityId) &&
    new Date(promo.startDate) <= currentDate &&
    new Date(promo.endDate) >= currentDate
  );
}

// Update time function
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('time-display').textContent = timeString;
}

// Show update indicator
function showUpdateIndicator() {
  const indicator = document.getElementById('update-indicator');
  indicator.classList.add('active');
  setTimeout(() => {
    indicator.classList.remove('active');
  }, 1000);
}

// Update day and prices function
async function updateDayAndPrices() {
  // Try to fetch fresh data
  try {
    const freshData = await fetchFreshData();
    
    // Check if data has changed
    const dataChanged = JSON.stringify(priceData) !== JSON.stringify(freshData.priceData) || 
                        JSON.stringify(promotionsData) !== JSON.stringify(freshData.promotionsData);
    
    // Update data
    priceData = freshData.priceData;
    promotionsData = freshData.promotionsData;
    
    // Update last update time if data changed
    if (dataChanged) {
      const now = new Date();
      document.getElementById('last-update-time').textContent = now.toLocaleTimeString();
      showUpdateIndicator();
      console.log('Data updated at', now.toLocaleString());
    }
  } catch (error) {
    console.error('Error updating data:', error);
  }

  // Get the current day of the week
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const currentTime = getCurrentTime();
  
  // Find today's prices
  const todayPrices = priceData.find(p => p.day === today) || priceData[0];
  
  // Update the UI with today's prices
  document.getElementById('day-title').textContent = todayPrices.day.toUpperCase() + ' PRICING';
  
  // Update activity headers with time ranges
  const activities = ['bowling', 'darts', 'laserTag'];
  activities.forEach(activity => {
    const activityData = todayPrices[activity];
    const headerElement = document.getElementById(\`\${activity}-header\`);
    
    const currentSlot = getCurrentTimeSlot(activityData.timeSlots, activityData.isAvailable);
    if (currentSlot) {
      headerElement.textContent = formatTimeRange(currentSlot.startTime, currentSlot.endTime);
    } else {
      headerElement.textContent = "TODAY";
    }
    
    // Render the activity content
    renderActivityContent(activity, activityData);
  });
}

// Initial updates
updateTime();
updateDayAndPrices();

// Set up intervals for updates
setInterval(updateTime, 1000); // Update time every second
setInterval(updateDayAndPrices, 15000); // Check for price changes every 15 seconds

// Also check at midnight
const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);
const timeToMidnight = tomorrow - now;

setTimeout(() => {
  updateDayAndPrices();
  // After midnight, continue checking every 24 hours
  setInterval(updateDayAndPrices, 86400000);
}, timeToMidnight);

// Add a fallback full page reload once per hour to ensure freshness
// This is a safety measure in case the JavaScript updates fail
setInterval(() => {
  window.location.reload();
}, 3600000); // Reload once per hour
</script>
</body>
</html>
  `

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generating standalone board:", error)
    return NextResponse.json({ error: "Failed to generate standalone board", details: String(error) }, { status: 500 })
  }
}
