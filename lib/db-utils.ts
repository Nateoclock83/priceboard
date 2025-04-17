"use server"

import { createClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side operations
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Function to check database connectivity and table existence
export async function checkDatabaseStatus() {
  try {
    const supabase = getSupabaseAdmin()

    // Check connection by querying the database version
    const { data: versionData, error: versionError } = await supabase.rpc("version")

    if (versionError) {
      return {
        connected: false,
        error: `Database connection error: ${versionError.message}`,
        tables: {},
      }
    }

    // Check if tables exist and count records
    const tables = ["day_prices", "promotions", "late_night_lanes"]
    const tableStatus: Record<string, { exists: boolean; count: number }> = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })

        tableStatus[table] = {
          exists: !error,
          count: count || 0,
        }
      } catch (error) {
        tableStatus[table] = {
          exists: false,
          count: 0,
        }
      }
    }

    return {
      connected: true,
      version: versionData,
      tables: tableStatus,
    }
  } catch (error) {
    return {
      connected: false,
      error: `Failed to check database status: ${error instanceof Error ? error.message : String(error)}`,
      tables: {},
    }
  }
}

// Function to reset database to default state
export async function resetDatabase() {
  try {
    const supabase = getSupabaseAdmin()

    // Delete all records from tables
    await supabase.from("day_prices").delete().neq("id", 0)
    await supabase.from("promotions").delete().neq("id", "")
    await supabase.from("late_night_lanes").delete().neq("id", 0)

    // Re-seed the database
    const { ensureTablesExist } = await import("./db")
    await ensureTablesExist()

    return {
      success: true,
      message: "Database reset successfully",
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to reset database: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
