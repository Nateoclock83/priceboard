"use server"

import type { DayPrices, Promotion, ActivityPrice, LateNightLanes } from "./types"
import { revalidatePath } from "next/cache"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side operations with proper error handling
let supabase: ReturnType<typeof createClient> | null = null

try {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Only create the client if both URL and key are available
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log("Supabase client initialized successfully")
  } else {
    console.warn("Supabase credentials missing, using fallback data")
  }
} catch (error) {
  console.error("Failed to initialize Supabase client:", error)
}

// Track the last update timestamp
let lastUpdateTimestamp = Date.now()

// Default data for seeding the database
const defaultPrices: DayPrices[] = [
  {
    day: "Monday",
    bowling: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 20 },
        { startTime: "14:00", endTime: "16:00", price: 30 },
        { startTime: "16:00", endTime: "CLOSE", price: 40 },
      ],
      note: "1-6 guests per lane",
      isAvailable: true,
      showWaitTime: false,
      waitTime: 30,
    },
    darts: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 12 },
        { startTime: "14:00", endTime: "16:00", price: 15 },
        { startTime: "16:00", endTime: "CLOSE", price: 18 },
      ],
      note: "per hour",
      isAvailable: true,
    },
    laserTag: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 5 },
        { startTime: "14:00", endTime: "16:00", price: 6 },
        { startTime: "16:00", endTime: "CLOSE", price: 8 },
      ],
      note: "per person, per session",
      isAvailable: true,
    },
  },
  {
    day: "Tuesday",
    bowling: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 20 },
        { startTime: "14:00", endTime: "16:00", price: 30 },
        { startTime: "16:00", endTime: "CLOSE", price: 40 },
      ],
      note: "1-6 guests per lane",
      isAvailable: true,
      showWaitTime: false,
      waitTime: 30,
    },
    darts: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 12 },
        { startTime: "14:00", endTime: "16:00", price: 15 },
        { startTime: "16:00", endTime: "CLOSE", price: 18 },
      ],
      note: "per hour",
      isAvailable: true,
    },
    laserTag: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 5 },
        { startTime: "14:00", endTime: "16:00", price: 6 },
        { startTime: "16:00", endTime: "CLOSE", price: 8 },
      ],
      note: "per person, per session",
      isAvailable: true,
    },
  },
  {
    day: "Wednesday",
    bowling: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 20 },
        { startTime: "14:00", endTime: "16:00", price: 30 },
        { startTime: "16:00", endTime: "CLOSE", price: 40 },
      ],
      note: "1-6 guests per lane",
      isAvailable: true,
      showWaitTime: false,
      waitTime: 30,
    },
    darts: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 12 },
        { startTime: "14:00", endTime: "16:00", price: 15 },
        { startTime: "16:00", endTime: "CLOSE", price: 18 },
      ],
      note: "per hour",
      isAvailable: true,
    },
    laserTag: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 5 },
        { startTime: "14:00", endTime: "16:00", price: 6 },
        { startTime: "16:00", endTime: "CLOSE", price: 8 },
      ],
      note: "per person, per session",
      isAvailable: true,
    },
  },
  {
    day: "Thursday",
    bowling: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 20 },
        { startTime: "14:00", endTime: "16:00", price: 32 },
        { startTime: "16:00", endTime: "CLOSE", price: 42 },
      ],
      note: "1-6 guests per lane",
      isAvailable: true,
      showWaitTime: false,
      waitTime: 30,
    },
    darts: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 12 },
        { startTime: "14:00", endTime: "16:00", price: 15 },
        { startTime: "16:00", endTime: "CLOSE", price: 18 },
      ],
      note: "per hour",
      isAvailable: true,
    },
    laserTag: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 5 },
        { startTime: "14:00", endTime: "16:00", price: 6 },
        { startTime: "16:00", endTime: "CLOSE", price: 8 },
      ],
      note: "per person, per session",
      isAvailable: true,
    },
  },
  {
    day: "Friday",
    bowling: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 25 },
        { startTime: "14:00", endTime: "16:00", price: 35 },
        { startTime: "16:00", endTime: "CLOSE", price: 42 },
      ],
      note: "1-6 guests per lane",
      isAvailable: true,
      showWaitTime: false,
      waitTime: 30,
    },
    darts: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 15 },
        { startTime: "14:00", endTime: "16:00", price: 18 },
        { startTime: "16:00", endTime: "CLOSE", price: 22 },
      ],
      note: "per hour",
      isAvailable: true,
    },
    laserTag: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 6 },
        { startTime: "14:00", endTime: "16:00", price: 8 },
        { startTime: "16:00", endTime: "CLOSE", price: 10 },
      ],
      note: "per person, per session",
      isAvailable: true,
    },
  },
  {
    day: "Saturday",
    bowling: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 28 },
        { startTime: "14:00", endTime: "16:00", price: 33 },
        { startTime: "16:00", endTime: "CLOSE", price: 38 },
      ],
      note: "1-6 guests per lane",
      isAvailable: true,
      showWaitTime: false,
      waitTime: 30,
    },
    darts: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 12 },
        { startTime: "14:00", endTime: "16:00", price: 15 },
        { startTime: "16:00", endTime: "CLOSE", price: 18 },
      ],
      note: "per hour",
      isAvailable: true,
    },
    laserTag: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 8 },
        { startTime: "14:00", endTime: "16:00", price: 11 },
        { startTime: "16:00", endTime: "CLOSE", price: 14 },
      ],
      note: "per person, per session",
      isAvailable: true,
    },
  },
  {
    day: "Sunday",
    bowling: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 30 },
        { startTime: "14:00", endTime: "16:00", price: 40 },
        { startTime: "16:00", endTime: "CLOSE", price: 55 },
      ],
      note: "1-6 guests per lane",
      isAvailable: true,
      showWaitTime: false,
      waitTime: 30,
    },
    darts: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 18 },
        { startTime: "14:00", endTime: "16:00", price: 22 },
        { startTime: "16:00", endTime: "CLOSE", price: 24 },
      ],
      note: "per hour",
      isAvailable: true,
    },
    laserTag: {
      timeSlots: [
        { startTime: "10:00", endTime: "14:00", price: 12 },
        { startTime: "14:00", endTime: "16:00", price: 15 },
        { startTime: "16:00", endTime: "CLOSE", price: 17 },
      ],
      note: "per person, per session",
      isAvailable: true,
    },
  },
]

const defaultPromotions: Promotion[] = [
  {
    id: "promo_1",
    title: "April Thursday Special",
    description: "Purchase one hour, get 30 minutes free",
    startDate: "2025-04-01T00:00:00Z",
    endDate: "2025-04-30T23:59:59Z",
    applicableDays: ["Thursday"],
    applicableActivities: ["bowling"],
    isActive: true,
  },
]

// Default Late Night Lanes configuration
const defaultLateNightLanes: LateNightLanes = {
  isActive: true,
  applicableDays: ["Friday", "Saturday"],
  startTime: "20:00",
  endTime: "22:00",
  price: 14.99,
  description: "UNLIMITED BOWLING AFTER 8PM",
  subtitle: "STRIKE. SIP. SOCIAL.",
  disclaimer: "*SUBJECT TO LANE AVAILABILITY. SHOE RENTAL NOT INCLUDED",
}

// Function to check if a table exists using information schema
async function tableExists(tableName: string): Promise<boolean> {
  if (!supabase) return false

  try {
    // Try to select a single row from the table
    // If the table doesn't exist, this will throw an error
    const { error } = await supabase.from(tableName).select("*").limit(1)

    // If there's no error, the table exists
    return !error
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

// Function to create the day_prices table
async function createDayPricesTable(): Promise<boolean> {
  if (!supabase) return false

  try {
    console.log("Creating day_prices table...")

    // Since we can't directly execute SQL, we'll try to insert a record with the correct structure
    // and let Supabase auto-create the table with the right schema
    const { error } = await supabase.from("day_prices").insert([
      {
        day: "Template",
        bowling: {
          timeSlots: [{ startTime: "00:00", endTime: "00:00", price: 0 }],
          note: "Template",
          isAvailable: false,
          showWaitTime: false,
          waitTime: 0,
        },
        darts: {
          timeSlots: [{ startTime: "00:00", endTime: "00:00", price: 0 }],
          note: "Template",
          isAvailable: false,
        },
        laserTag: {
          timeSlots: [{ startTime: "00:00", endTime: "00:00", price: 0 }],
          note: "Template",
          isAvailable: false,
        },
      },
    ])

    if (error) {
      console.error("Error creating day_prices table:", error)

      // If the table doesn't exist, we'll get a specific error
      if (error.message.includes("does not exist") || error.code === "42P01") {
        console.log("Table doesn't exist. Attempting to create it via REST API...")

        try {
          // Try using the REST API directly
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/day_prices`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.SUPABASE_ANON_KEY || "",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              day: "Template",
              bowling: {
                timeSlots: [{ startTime: "00:00", endTime: "00:00", price: 0 }],
                note: "Template",
                isAvailable: false,
                showWaitTime: false,
                waitTime: 0,
              },
              darts: {
                timeSlots: [{ startTime: "00:00", endTime: "00:00", price: 0 }],
                note: "Template",
                isAvailable: false,
              },
              laserTag: {
                timeSlots: [{ startTime: "00:00", endTime: "00:00", price: 0 }],
                note: "Template",
                isAvailable: false,
              },
            }),
          })

          if (response.ok) {
            console.log("day_prices table created successfully via REST API")
            return true
          } else {
            const errorText = await response.text()
            console.error(`REST API failed with status: ${response.status}, error: ${errorText}`)
            return false
          }
        } catch (restError) {
          console.error("Failed to create day_prices table via REST API:", restError)
          return false
        }
      }

      return false
    }

    console.log("day_prices table created successfully")

    // Clean up the template record
    await supabase.from("day_prices").delete().eq("day", "Template")

    return true
  } catch (error) {
    console.error("Failed to create day_prices table:", error)
    return false
  }
}

// Function to create the promotions table
async function createPromotionsTable(): Promise<boolean> {
  if (!supabase) return false

  try {
    console.log("Creating promotions table...")

    // Try to insert a template record to auto-create the table
    const { error } = await supabase.from("promotions").insert([
      {
        id: "template",
        title: "Template",
        description: "Template",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        applicableDays: ["Monday"],
        applicableActivities: ["bowling"],
        isActive: false,
      },
    ])

    if (error) {
      console.error("Error creating promotions table:", error)

      // If the table doesn't exist, we'll get a specific error
      if (error.message.includes("does not exist") || error.code === "42P01") {
        console.log("Table doesn't exist. Attempting to create it via REST API...")

        try {
          // Try using the REST API directly
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/promotions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.SUPABASE_ANON_KEY || "",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              id: "template",
              title: "Template",
              description: "Template",
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString(),
              applicableDays: ["Monday"],
              applicableActivities: ["bowling"],
              isActive: false,
            }),
          })

          if (response.ok) {
            console.log("promotions table created successfully via REST API")
            return true
          } else {
            const errorText = await response.text()
            console.error(`REST API failed with status: ${response.status}, error: ${errorText}`)
            return false
          }
        } catch (restError) {
          console.error("Failed to create promotions table via REST API:", restError)
          return false
        }
      }

      return false
    }

    console.log("promotions table created successfully")

    // Clean up the template record
    await supabase.from("promotions").delete().eq("id", "template")

    return true
  } catch (error) {
    console.error("Failed to create promotions table:", error)
    return false
  }
}

// Function to create the late_night_lanes table
async function createLateNightLanesTable(): Promise<boolean> {
  if (!supabase) return false

  try {
    console.log("Creating late_night_lanes table...")

    // Try to insert a template record to auto-create the table
    const { error } = await supabase.from("late_night_lanes").insert([
      {
        is_active: false,
        applicable_days: ["Monday"],
        start_time: "00:00",
        end_time: "00:00",
        price: 0,
        description: "Template",
        subtitle: "Template",
        disclaimer: "Template",
      },
    ])

    if (error) {
      console.error("Error creating late_night_lanes table:", error)

      // If the table doesn't exist, we'll get a specific error
      if (error.message.includes("does not exist") || error.code === "42P01") {
        console.log("Table doesn't exist. Attempting to create it via REST API...")

        try {
          // Try using the REST API directly
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/late_night_lanes`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.SUPABASE_ANON_KEY || "",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              is_active: false,
              applicable_days: ["Monday"],
              start_time: "00:00",
              end_time: "00:00",
              price: 0,
              description: "Template",
              subtitle: "Template",
              disclaimer: "Template",
            }),
          })

          if (response.ok) {
            console.log("late_night_lanes table created successfully via REST API")
            return true
          } else {
            const errorText = await response.text()
            console.error(`REST API failed with status: ${response.status}, error: ${errorText}`)
            return false
          }
        } catch (restError) {
          console.error("Failed to create late_night_lanes table via REST API:", restError)
          return false
        }
      }

      return false
    }

    console.log("late_night_lanes table created successfully")

    // Clean up the template record (assuming it has an ID of 1)
    await supabase.from("late_night_lanes").delete().eq("id", 1)

    return true
  } catch (error) {
    console.error("Failed to create late_night_lanes table:", error)
    return false
  }
}

// Function to check if tables exist and seed them if they don't
export async function ensureTablesExist(): Promise<void> {
  try {
    // If Supabase client is not available, return early
    if (!supabase) {
      console.log("Supabase client not available, skipping table check")
      return
    }

    console.log("Checking if tables exist in Supabase...")

    // Check if each table exists
    const dayPricesExists = await tableExists("day_prices")
    const promotionsExists = await tableExists("promotions")
    const lateNightLanesExists = await tableExists("late_night_lanes")

    console.log(
      `Tables exist check: day_prices=${dayPricesExists}, promotions=${promotionsExists}, late_night_lanes=${lateNightLanesExists}`,
    )

    // Create and seed tables if they don't exist
    if (!dayPricesExists) {
      const created = await createDayPricesTable()
      if (created) {
        await seedDayPrices()
      }
    }

    if (!promotionsExists) {
      const created = await createPromotionsTable()
      if (created) {
        await seedPromotions()
      }
    }

    if (!lateNightLanesExists) {
      const created = await createLateNightLanesTable()
      if (created) {
        await seedLateNightLanes()
      }
    }

    console.log("Tables checked and created/seeded if necessary")
  } catch (error) {
    console.error("Error ensuring tables exist:", error)
    console.log("Using fallback data instead")
  }
}

// Function to seed the day_prices table
async function seedDayPrices(): Promise<void> {
  try {
    if (!supabase) {
      console.warn("Supabase client not available, skipping day prices seeding")
      return
    }

    console.log("Seeding day_prices table with default data...")
    const { error } = await supabase.from("day_prices").insert(defaultPrices)

    if (error) {
      console.error("Error seeding day_prices table:", error)
      // Don't throw, just log the error and continue
    } else {
      console.log("Day prices seeded successfully")
    }
  } catch (error) {
    console.error("Failed to seed day prices:", error)
    // Don't throw, just log the error and continue
  }
}

// Function to seed the promotions table
async function seedPromotions(): Promise<void> {
  try {
    if (!supabase) {
      console.warn("Supabase client not available, skipping promotions seeding")
      return
    }

    console.log("Seeding promotions table with default data...")
    const { error } = await supabase.from("promotions").insert(defaultPromotions)

    if (error) {
      console.error("Error seeding promotions table:", error)
      // Don't throw, just log the error and continue
    } else {
      console.log("Promotions seeded successfully")
    }
  } catch (error) {
    console.error("Failed to seed promotions:", error)
    // Don't throw, just log the error and continue
  }
}

// Function to seed the late_night_lanes table
async function seedLateNightLanes(): Promise<void> {
  try {
    if (!supabase) {
      console.warn("Supabase client not available, skipping late night lanes seeding")
      return
    }

    console.log("Seeding late_night_lanes table with default data...")
    const { error } = await supabase.from("late_night_lanes").insert([
      {
        is_active: defaultLateNightLanes.isActive,
        applicable_days: defaultLateNightLanes.applicableDays,
        start_time: defaultLateNightLanes.startTime,
        end_time: defaultLateNightLanes.endTime,
        price: defaultLateNightLanes.price,
        description: defaultLateNightLanes.description,
        subtitle: defaultLateNightLanes.subtitle,
        disclaimer: defaultLateNightLanes.disclaimer,
      },
    ])

    if (error) {
      console.error("Error seeding late_night_lanes table:", error)
      // Don't throw, just log the error and continue
    } else {
      console.log("Late Night Lanes seeded successfully")
    }
  } catch (error) {
    console.error("Failed to seed Late Night Lanes:", error)
    // Don't throw, just log the error and continue
  }
}

export async function getDayPrices(): Promise<DayPrices[]> {
  try {
    // Ensure tables exist and are seeded
    await ensureTablesExist()

    // If Supabase client is not available, return default data
    if (!supabase) {
      console.warn("Supabase client not available, returning default day prices")
      return defaultPrices
    }

    // Try to get data from the table
    const { data, error } = await supabase.from("day_prices").select("*").order("day")

    if (error) {
      console.error("Error fetching day prices:", error)
      // Return default prices as fallback
      return defaultPrices
    }

    // If we got data, return it; otherwise, return default prices
    return data && data.length > 0 ? data : defaultPrices
  } catch (error) {
    console.error("Failed to fetch day prices:", error)
    // Return default prices as fallback
    return defaultPrices
  }
}

export async function updateDayPrices(prices: DayPrices[]): Promise<void> {
  try {
    // Ensure tables exist and are seeded
    await ensureTablesExist()

    // If Supabase client is not available, just update timestamp and revalidate paths
    if (!supabase) {
      console.warn("Supabase client not available, skipping database update")
      lastUpdateTimestamp = Date.now()
      revalidatePaths()
      return
    }

    // First, delete all existing prices
    const { error: deleteError } = await supabase.from("day_prices").delete().neq("day", "")

    if (deleteError) {
      console.error("Error deleting existing prices:", deleteError)
      throw deleteError
    }

    // Then insert the new prices
    const { error: insertError } = await supabase.from("day_prices").insert(prices)

    if (insertError) {
      console.error("Error inserting new prices:", insertError)
      throw insertError
    }

    // Update the timestamp
    lastUpdateTimestamp = Date.now()

    // Force revalidation of all paths
    revalidatePaths()

    return Promise.resolve()
  } catch (error) {
    console.error("Failed to update day prices:", error)
    throw error
  }
}

export async function getPromotions(): Promise<Promotion[]> {
  try {
    // Ensure tables exist and are seeded
    await ensureTablesExist()

    // If Supabase client is not available, return default data
    if (!supabase) {
      console.warn("Supabase client not available, returning default promotions")
      return defaultPromotions
    }

    const { data, error } = await supabase.from("promotions").select("*")

    if (error) {
      console.error("Error fetching promotions:", error)
      // Return default promotions as fallback
      return defaultPromotions
    }

    return data || defaultPromotions
  } catch (error) {
    console.error("Failed to fetch promotions:", error)
    // Return default promotions as fallback
    return defaultPromotions
  }
}

// Update the updatePromotions function to remove the terms field if it's not in the schema
export async function updatePromotions(promotions: Promotion[]): Promise<void> {
  try {
    // Ensure tables exist and are seeded
    await ensureTablesExist()

    // If Supabase client is not available, just update timestamp and revalidate paths
    if (!supabase) {
      console.warn("Supabase client not available, skipping database update")
      lastUpdateTimestamp = Date.now()
      revalidatePaths()
      return
    }

    // First, delete all existing promotions
    const { error: deleteError } = await supabase.from("promotions").delete().neq("id", "")

    if (deleteError) {
      console.error("Error deleting existing promotions:", deleteError)
      throw deleteError
    }

    // Create safe copies of the promotions without the terms field
    // This prevents errors if the column doesn't exist in the database
    const safePromotions = promotions.map(({ terms, ...promo }) => promo)

    // Then insert the new promotions
    const { error: insertError } = await supabase.from("promotions").insert(safePromotions)

    if (insertError) {
      console.error("Error inserting new promotions:", insertError)
      throw insertError
    }

    // Update the timestamp
    lastUpdateTimestamp = Date.now()

    // Force revalidation of all paths
    revalidatePaths()

    return Promise.resolve()
  } catch (error) {
    console.error("Failed to update promotions:", error)
    throw error
  }
}

// Update the addPromotion function to remove the terms field if it's not in the schema
export async function addPromotion(promotion: Promotion): Promise<void> {
  try {
    // Ensure tables exist and are seeded
    await ensureTablesExist()

    // If Supabase client is not available, just update timestamp and revalidate paths
    if (!supabase) {
      console.warn("Supabase client not available, skipping database update")
      lastUpdateTimestamp = Date.now()
      revalidatePaths()
      return
    }

    // Create a safe copy of the promotion without the terms field
    // This prevents errors if the column doesn't exist in the database
    const { terms, ...safePromotion } = promotion

    const { error } = await supabase.from("promotions").insert([safePromotion])

    if (error) {
      console.error("Error adding promotion:", error)
      throw error
    }

    // Update the timestamp
    lastUpdateTimestamp = Date.now()

    // Force revalidation of all paths
    revalidatePaths()

    return Promise.resolve()
  } catch (error) {
    console.error("Failed to add promotion:", error)
    throw error
  }
}

export async function deletePromotion(id: string): Promise<void> {
  try {
    // Ensure tables exist and are seeded
    await ensureTablesExist()

    // If Supabase client is not available, just update timestamp and revalidate paths
    if (!supabase) {
      console.warn("Supabase client not available, skipping database update")
      lastUpdateTimestamp = Date.now()
      revalidatePaths()
      return
    }

    const { error } = await supabase.from("promotions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting promotion:", error)
      throw error
    }

    // Update the timestamp
    lastUpdateTimestamp = Date.now()

    // Force revalidation of all paths
    revalidatePaths()

    return Promise.resolve()
  } catch (error) {
    console.error("Failed to delete promotion:", error)
    throw error
  }
}

// New functions for Late Night Lanes

export async function getLateNightLanes(): Promise<LateNightLanes> {
  try {
    // Ensure tables exist and are seeded
    await ensureTablesExist()

    // If Supabase client is not available, return default data
    if (!supabase) {
      console.warn("Supabase client not available, returning default late night lanes")
      return defaultLateNightLanes
    }

    const { data, error } = await supabase.from("late_night_lanes").select("*").limit(1).single()

    if (error) {
      console.error("Error fetching late night lanes:", error)
      // Return default Late Night Lanes as fallback
      return defaultLateNightLanes
    }

    // Convert from snake_case to camelCase
    return {
      id: data.id,
      isActive: data.is_active,
      applicableDays: data.applicable_days,
      startTime: data.start_time,
      endTime: data.end_time,
      price: data.price,
      description: data.description,
      subtitle: data.subtitle,
      disclaimer: data.disclaimer,
    }
  } catch (error) {
    console.error("Failed to fetch Late Night Lanes:", error)
    // Return default Late Night Lanes as fallback
    return defaultLateNightLanes
  }
}

export async function updateLateNightLanes(lateNightLanes: LateNightLanes): Promise<void> {
  try {
    // Ensure tables exist and are seeded
    await ensureTablesExist()

    // If Supabase client is not available, just update timestamp and revalidate paths
    if (!supabase) {
      console.warn("Supabase client not available, skipping database update")
      lastUpdateTimestamp = Date.now()
      revalidatePaths()
      return
    }

    // Convert from camelCase to snake_case for the database
    const { error } = await supabase
      .from("late_night_lanes")
      .update({
        is_active: lateNightLanes.isActive,
        applicable_days: lateNightLanes.applicableDays,
        start_time: lateNightLanes.startTime,
        end_time: lateNightLanes.endTime,
        price: lateNightLanes.price,
        description: lateNightLanes.description,
        subtitle: lateNightLanes.subtitle,
        disclaimer: lateNightLanes.disclaimer,
      })
      .eq("id", lateNightLanes.id || 1)

    if (error) {
      console.error("Error updating late night lanes:", error)
      throw error
    }

    // Update the timestamp
    lastUpdateTimestamp = Date.now()

    // Force revalidation of all paths
    revalidatePaths()

    return Promise.resolve()
  } catch (error) {
    console.error("Failed to update Late Night Lanes:", error)
    throw error
  }
}

// Helper function to check if Late Night Lanes is active for the current time and day
export async function isLateNightLanesActive(day: string, time: string): Promise<boolean> {
  try {
    const lateNightLanes = await getLateNightLanes()

    if (!lateNightLanes.isActive) return false
    if (!lateNightLanes.applicableDays.includes(day)) return false

    // Check if current time is within the Late Night Lanes time range
    return time >= lateNightLanes.startTime && time < lateNightLanes.endTime
  } catch (error) {
    console.error("Error checking if Late Night Lanes is active:", error)
    return false
  }
}

// Helper function to get the current price based on time
export async function getCurrentPrice(activity: ActivityPrice): Promise<number> {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

  // Find the applicable time slot
  const currentSlot = activity.timeSlots.find((slot) => {
    if (slot.endTime === "CLOSE") {
      return currentTime >= slot.startTime
    }
    return currentTime >= slot.startTime && currentTime < slot.endTime
  })

  return currentSlot ? currentSlot.price : activity.timeSlots[0]?.price || 0
}

// Helper function to format time for display
export async function formatTimeRange(startTime: string, endTime: string): Promise<string> {
  // Convert 24-hour format to 12-hour format with AM/PM
  const formatTime = (time: string): string => {
    if (time === "CLOSE") return "CLOSE"

    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : ""} ${period}`
  }

  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

// Get the last update timestamp
export async function getLastUpdateTimestamp(): Promise<number> {
  return lastUpdateTimestamp
}

export async function exportHtml(
  prices: DayPrices[],
  promotions: Promotion[],
  lateNightLanes?: LateNightLanes,
): Promise<string> {
  // Generate standalone HTML for BrightSign player
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="300">
<title>Outta Boundz Price Board</title>
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
.version-info {
  position: fixed;
  bottom: 5px;
  right: 5px;
  font-size: 10px;
  color: rgba(0,0,0,0.2);
}
/* Late Night Lanes specific styles - only for bowling card */
.late-night-card {
  background-color: #0f0f1a;
  color: white;
}
.late-night-header {
  background-color: #0f0f1a;
  color: white;
  text-align: center;
  font-size: 36px;
  font-weight: bold;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.late-night-subheader {
  background-color: #0f0f1a;
  color: white;
  text-align: center;
  font-size: 42px;
  font-weight: bold;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.late-night-body {
  flex: 1;
  background-color: #0f0f1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.late-night-description {
  color: #a78bfa;
  font-size: 24px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 20px;
}
.late-night-days {
  color: white;
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
}
.late-night-price {
  color: white;
  font-size: 180px;
  font-weight: bold;
  display: flex;
  align-items: flex-start;
  line-height: 1;
}
.late-night-subtitle {
  color: white;
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-top: 20px;
}
.late-night-disclaimer {
  color: #a78bfa;
  font-size: 14px;
  text-align: center;
  margin-top: 30px;
}
/* Late Night Lanes full board mode */
.late-night-board {
  background-color: #0f0f1a;
  color: white;
  width: 100%;
  height: 100%;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.late-night-title {
  font-size: 80px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}
.late-night-subtitle-text {
  font-size: 48px;
  color: #a78bfa;
  text-align: center;
  margin-bottom: 40px;
}
.late-night-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}
.late-night-days-text {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 30px;
}
.late-night-price-text {
  font-size: 120px;
  font-weight: bold;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
}
.late-night-dollar {
  font-size: 80px;
  margin-top: 20px;
}
.late-night-per-person {
  font-size: 48px;
  margin-bottom: 30px;
}
.late-night-tagline {
  font-size: 48px;
  margin-bottom: 40px;
}
.late-night-disclaimer-text {
  font-size: 24px;
  color: #a78bfa;
  margin-bottom: 40px;
}
.late-night-other-activities {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-top: 40px;
}
.late-night-activity {
  text-align: center;
  padding: 20px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  width: 400px;
}
.late-night-activity-title {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
}
.late-night-activity-time {
  font-size: 24px;
  color: #a78bfa;
  margin-bottom: 10px;
}
.late-night-activity-price {
  font-size: 36px;
  font-weight: bold;
}
.late-night-activity-note {
  font-size: 16px;
  color: #a78bfa;
  margin-top: 5px;
}
</style>
</head>
<body>
<div class="price-board" id="price-board">
  <div class="header-section">
    <div class="header">
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
        <div class="card-body">
          <div class="price"><span class="dollar">$</span><span id="bowling-price">--</span></div>
          <div class="price-note">PER LANE, PER HOUR</div>
          <!-- Promotion banner will be added here if applicable -->
          <div id="bowling-promo" class="promotion-banner" style="display: none;">
            <div class="banner-title">SPECIAL OFFER</div>
            <div id="bowling-promo-desc" class="banner-description"></div>
          </div>
        </div>
      </div>

      <!-- Interactive Darts Card -->
      <div class="price-card" id="darts-card">
        <div class="card-header" id="darts-header">OPEN - CLOSE</div>
        <div class="card-subheader">INTERACTIVE DARTS</div>
        <div class="card-body">
          <div class="price"><span class="dollar">$</span><span id="darts-price">--</span></div>
          <div class="price-note">PER LANE, PER HOUR</div>
          <!-- Promotion banner will be added here if applicable -->
          <div id="darts-promo" class="promotion-banner" style="display: none;">
            <div class="banner-title">SPECIAL OFFER</div>
            <div id="darts-promo-desc" class="banner-description"></div>
          </div>
        </div>
      </div>

      <!-- Laser Tag Card -->
      <div class="price-card" id="laserTag-card">
        <div class="card-header" id="laserTag-header">OPEN - CLOSE</div>
        <div class="card-subheader">LASER TAG</div>
        <div class="card-body">
          <div class="price"><span class="dollar">$</span><span id="laser-price">--</span></div>
          <div class="price-note">PER PERSON, PER SESSION</div>
          <div class="height-req">44" HEIGHT REQUIREMENT</div>
          <!-- Promotion banner will be added here if applicable -->
          <div id="laserTag-promo" class="promotion-banner" style="display: none;">
            <div class="banner-title">SPECIAL OFFER</div>
            <div id="laserTag-promo-desc" class="banner-description"></div>
          </div>
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

<!-- Late Night Lanes Board (hidden by default) -->
<div class="late-night-board" id="late-night-board" style="display: none;">
  <div class="header">
    <div class="time-display" id="late-night-time-display">--:--</div>
  </div>
  
  <div class="late-night-main">
    <h1 class="late-night-title">LATE NIGHT LANES</h1>
    <div class="late-night-subtitle-text" id="late-night-description">UNLIMITED BOWLING AFTER 8PM</div>
    
    <div class="late-night-days-text" id="late-night-days">FRIDAY - SATURDAY</div>
    <div class="late-night-price-text">
      <span class="late-night-dollar">$</span>
      <span id="late-night-price">14.99</span>
    </div>
    <div class="late-night-per-person">PER PERSON</div>
    <div class="late-night-tagline" id="late-night-tagline">STRIKE. SIP. SOCIAL.</div>
    <div class="late-night-disclaimer-text" id="late-night-disclaimer">*SUBJECT TO LANE AVAILABILITY. SHOE RENTAL NOT INCLUDED</div>
    
    <div class="late-night-other-activities">
      <!-- Interactive Darts Card -->
      <div class="late-night-activity">
        <div class="late-night-activity-title">INTERACTIVE DARTS</div>
        <div class="late-night-activity-time" id="late-night-darts-time">8 PM - CLOSE</div>
        <div class="late-night-activity-price">$<span id="late-night-darts-price">18</span> PER LANE</div>
      </div>
      
      <!-- Laser Tag Card -->
      <div class="late-night-activity">
        <div class="late-night-activity-title">LASER TAG</div>
        <div class="late-night-activity-time" id="late-night-laser-time">8 PM - CLOSE</div>
        <div class="late-night-activity-price">$<span id="late-night-laser-price">10</span> PER PERSON</div>
        <div class="late-night-activity-note">44" HEIGHT REQUIREMENT</div>
      </div>
    </div>
  </div>
  
  <div class="footer-section">
    <div class="footer">
      <div class="shoe-price" style="color: white;">
        <span style="color: #a78bfa;">$4.50</span> BOWLING SHOES <span style="color: #a78bfa;">FOR ALL BOWLERS</span>
      </div>
    </div>
  </div>
</div>

<!-- Version info with timestamp to verify updates -->
<div class="version-info">Updated: ${new Date().toLocaleString()}</div>

<script>
// Embedded price and promotion data - updated on each page load
const priceData = ${JSON.stringify(prices)};
const promotionsData = ${JSON.stringify(promotions)};
const lateNightLanesData = ${JSON.stringify(lateNightLanes || defaultLateNightLanes)};

// Format time for display (24h to 12h with AM/PM)
function formatTime(time) {
  if (time === "CLOSE") return "CLOSE";

  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return displayHours + (minutes > 0 ? ':' + minutes.toString().padStart(2, '0') : '') + ' ' + period;
}

// Format time range for display
function formatTimeRange(startTime, endTime) {
  return formatTime(startTime) + ' - ' + formatTime(endTime);
}

// Check if a time is within a time slot
function isTimeInSlot(currentTime, startTime, endTime) {
  if (endTime === "CLOSE") {
    return currentTime >= startTime
  }
  return currentTime >= startTime && currentTime < endTime
}

// Get current time in HH:MM format
function getCurrentTime() {
  const now = new Date();
  return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

// Update time function
function updateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('time-display').textContent = timeString;
  document.getElementById('late-night-time-display').textContent = timeString;
}

// Check if Late Night Lanes is active
function isLateNightActive() {
  if (!lateNightLanesData.isActive) return false;
  
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  
  if (!lateNightLanesData.applicableDays.includes(today)) return false;
  
  const currentTime = getCurrentTime();
  return currentTime >= lateNightLanesData.startTime && currentTime < lateNightLanesData.endTime;
}

// Update day and prices function
function updateDayAndPrices() {
  // Get the current day of the week
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = days[new Date().getDay()];
  const currentDate = new Date();
  const currentTime = getCurrentTime();
  
  // Find today's prices
  const todayPrices = priceData.find(p => p.day === today) || priceData[0];
  
  // Check if Late Night Lanes is active
  const isLateNight = isLateNightActive();
  
  // Show/hide appropriate board
  document.getElementById('price-board').style.display = isLateNight ? 'none' : 'flex';
  document.getElementById('late-night-board').style.display = isLateNight ? 'flex' : 'none';
  
  if (isLateNight) {
    // Update Late Night Lanes board
    document.getElementById('late-night-description').textContent = lateNightLanesData.description;
    document.getElementById('late-night-days').textContent = lateNightLanesData.applicableDays.join(' - ');
    document.getElementById('late-night-price').textContent = lateNightLanesData.price.toFixed(2);
    document.getElementById('late-night-tagline').textContent = lateNightLanesData.subtitle;
    document.getElementById('late-night-disclaimer').textContent = lateNightLanesData.disclaimer;
    
    // Update darts and laser tag prices on the Late Night board
    const currentDartsSlot = getCurrentTimeSlot(todayPrices.darts.timeSlots, todayPrices.darts.isAvailable);
    const currentLaserSlot = getCurrentTimeSlot(todayPrices.laserTag.timeSlots, todayPrices.laserTag.isAvailable);
    
    if (currentDartsSlot) {
      document.getElementById('late-night-darts-time').textContent = formatTimeRange(currentDartsSlot.startTime, currentDartsSlot.endTime);
      document.getElementById('late-night-darts-price').textContent = currentDartsSlot.price;
    }
    
    if (currentLaserSlot) {
      document.getElementById('late-night-laser-time').textContent = formatTimeRange(currentLaserSlot.startTime, currentLaserSlot.endTime);
      document.getElementById('late-night-laser-price').textContent = currentLaserSlot.price;
    }
  } else {
    // Update the UI with today's prices for regular board
    document.getElementById('day-title').textContent = todayPrices.day.toUpperCase() + ' PRICING';
    
    // Update bowling prices and time slots
    updateActivityDisplay('bowling', todayPrices.bowling, currentTime);
    
    // Update darts prices and time slots
    updateActivityDisplay('darts', todayPrices.darts, currentTime);
    
    // Update laser tag prices and time slots  todayPrices.darts, currentTime);
    
    // Update laser tag prices and time slots
    updateActivityDisplay('laserTag', todayPrices.laserTag, currentTime);
    
    // Process promotions
    const activePromotions = promotionsData.filter(promo => {
      // Check if promotion is active
      if (!promo.isActive) return false;
      
      // Check date range
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);
      if (currentDate < startDate || currentDate > endDate) return false;
      
      // Check if applicable to today
      return promo.applicableDays.includes(today);
    });
    
    // If we have active promotions, display them on the cards
    if (activePromotions.length > 0) {
      // Add promotion banners to applicable activity cards
      activePromotions.forEach(promo => {
        promo.applicableActivities.forEach(activity => {
          const promoBanner = document.getElementById(activity + '-promo');
          const promoDesc = document.getElementById(activity + '-promo-desc');
          
          if (promoBanner && promoDesc) {
            promoBanner.style.display = 'block';
            promoDesc.textContent = promo.description;
          }
        });
      });
    }
  }
}

// Get current time slot for an activity
function getCurrentTimeSlot(timeSlots, isAvailable) {
  // If the activity is marked as unavailable, return null
  if (!isAvailable) return null;
  
  // If there are no time slots, return null
  if (!timeSlots || timeSlots.length === 0) return null;
  
  const currentTime = getCurrentTime();
  
  // Try to find a matching time slot
  const slot = timeSlots.find(slot => 
    isTimeInSlot(currentTime, slot.startTime, slot.endTime)
  );
  
  // Return the found slot or the first slot as a fallback
  return slot || timeSlots[0];
}

// Update activity display with current price and time slots
function updateActivityDisplay(activityId, activityData, currentTime) {
  // Find the current time slot
  const currentSlot = getCurrentTimeSlot(activityData.timeSlots, activityData.isAvailable);
  
  if (currentSlot) {
    // Update price
    document.getElementById((activityId === "laserTag" ? "laser" : activityId) + '-price').textContent = currentSlot.price;
    
    // Update header to show current time slot
    document.getElementById(activityId + '-header').textContent = 
      formatTimeRange(currentSlot.startTime, currentSlot.endTime);
  } else {
    // Activity is unavailable
    document.getElementById(activityId + '-header').textContent = "UNAVAILABLE";
    document.getElementById((activityId === "laserTag" ? "laser" : activityId) + '-price').textContent = "--";
  }
}

// Initial updates
updateTime();
updateDayAndPrices();

// Set up intervals for updates
setInterval(updateTime, 1000); // Update time every second
setInterval(updateDayAndPrices, 60000); // Check for day change every minute

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
</script>
</body>
</html>
`

  // In a real app, you would save this to a file or blob storage
  // For demo purposes, we're creating a data URL
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)

  return url
}

// Helper function to revalidate all paths
function revalidatePaths() {
  console.log("Revalidating paths after update")
  revalidatePath("/", "layout")
  revalidatePath("/admin", "layout")
  revalidatePath("/board", "layout")
  revalidatePath("/direct-board", "layout")
  revalidatePath("/display", "layout")
  revalidatePath("/public-display", "layout")
  revalidatePath("/api/standalone-board")
  revalidatePath("/api/data")
  revalidatePath("/api/board-data")
  revalidatePath("/api/public-board-data")
}
