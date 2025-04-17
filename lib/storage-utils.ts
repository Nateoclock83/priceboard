"use client"

import { getSupabaseClient } from "./supabase-client"

// Generic function to fetch data from a table
export async function fetchData<T>(table: string, id?: string): Promise<T[]> {
  try {
    const supabase = getSupabaseClient()
    let query = supabase.from(table).select("*")

    if (id) {
      query = query.eq("id", id)
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching data from ${table}:`, error)
      throw error
    }

    return data as T[]
  } catch (error) {
    console.error(`Failed to fetch data from ${table}:`, error)
    throw error
  }
}

// Generic function to insert data into a table
export async function insertData<T>(table: string, data: T): Promise<T> {
  try {
    const supabase = getSupabaseClient()
    const { data: result, error } = await supabase.from(table).insert(data).select()

    if (error) {
      console.error(`Error inserting data into ${table}:`, error)
      throw error
    }

    return result[0] as T
  } catch (error) {
    console.error(`Failed to insert data into ${table}:`, error)
    throw error
  }
}

// Generic function to update data in a table
export async function updateData<T>(table: string, id: string, data: Partial<T>): Promise<T> {
  try {
    const supabase = getSupabaseClient()
    const { data: result, error } = await supabase.from(table).update(data).eq("id", id).select()

    if (error) {
      console.error(`Error updating data in ${table}:`, error)
      throw error
    }

    return result[0] as T
  } catch (error) {
    console.error(`Failed to update data in ${table}:`, error)
    throw error
  }
}

// Generic function to delete data from a table
export async function deleteData(table: string, id: string): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) {
      console.error(`Error deleting data from ${table}:`, error)
      throw error
    }
  } catch (error) {
    console.error(`Failed to delete data from ${table}:`, error)
    throw error
  }
}

// Function to subscribe to real-time changes in a table
export function subscribeToTable(table: string, callback: (payload: any) => void): () => void {
  try {
    const supabase = getSupabaseClient()
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        (payload) => {
          callback(payload)
        },
      )
      .subscribe()

    // Return a function to unsubscribe
    return () => {
      subscription.unsubscribe()
    }
  } catch (error) {
    console.error(`Failed to subscribe to ${table}:`, error)
    // Return a no-op function
    return () => {}
  }
}
