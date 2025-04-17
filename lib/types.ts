export interface TimeSlot {
  startTime: string
  endTime: string
  price: number
}

export interface ActivityPrice {
  timeSlots: TimeSlot[]
  note?: string
  isAvailable: boolean
  showWaitTime?: boolean
  waitTime?: number
}

export interface DayPrices {
  day: string
  bowling: ActivityPrice
  darts: ActivityPrice
  laserTag: ActivityPrice
  id?: number // Optional ID for database records
}

export interface Promotion {
  id: string
  title: string
  description: string
  terms?: string
  startDate: string
  endDate: string
  applicableDays: string[]
  applicableActivities: string[]
  isActive: boolean
}

// New interface for Late Night Lanes
export interface LateNightLanes {
  id?: string
  isActive: boolean
  applicableDays: string[]
  startTime: string
  endTime: string
  price: number
  description: string
  subtitle: string
  disclaimer: string
}
