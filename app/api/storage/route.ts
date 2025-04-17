import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Disable Next.js caching for this route
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url)
    const table = url.searchParams.get("table")
    const id = url.searchParams.get("id")

    if (!table) {
      return NextResponse.json({ error: "Table parameter is required" }, { status: 400 })
    }

    let query = supabase.from(table).select("*")

    // If ID is provided, filter by ID
    if (id) {
      query = query.eq("id", id)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching data from ${table}:`, error)
      return NextResponse.json({ error: `Failed to fetch data from ${table}` }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in storage API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { table, data } = await request.json()

    if (!table || !data) {
      return NextResponse.json({ error: "Table and data parameters are required" }, { status: 400 })
    }

    const { data: result, error } = await supabase.from(table).insert(data).select()

    if (error) {
      console.error(`Error inserting data into ${table}:`, error)
      return NextResponse.json({ error: `Failed to insert data into ${table}` }, { status: 500 })
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error("Error in storage API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { table, id, data } = await request.json()

    if (!table || !id || !data) {
      return NextResponse.json({ error: "Table, id, and data parameters are required" }, { status: 400 })
    }

    const { data: result, error } = await supabase.from(table).update(data).eq("id", id).select()

    if (error) {
      console.error(`Error updating data in ${table}:`, error)
      return NextResponse.json({ error: `Failed to update data in ${table}` }, { status: 500 })
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error("Error in storage API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url)
    const table = url.searchParams.get("table")
    const id = url.searchParams.get("id")

    if (!table || !id) {
      return NextResponse.json({ error: "Table and id parameters are required" }, { status: 400 })
    }

    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) {
      console.error(`Error deleting data from ${table}:`, error)
      return NextResponse.json({ error: `Failed to delete data from ${table}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in storage API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
