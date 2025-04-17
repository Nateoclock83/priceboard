"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function DbStatusPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetResult, setResetResult] = useState<any>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/db-status")
      const data = await response.json()

      setStatus(data)
    } catch (err) {
      setError("Failed to fetch database status")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (
      !window.confirm("Are you sure you want to reset the database? This will delete all data and restore defaults.")
    ) {
      return
    }

    setResetLoading(true)
    setResetResult(null)

    try {
      // In a real app, you would securely store and retrieve this key
      // This is just for demonstration purposes
      const adminKey = prompt("Enter admin API key")

      if (!adminKey) {
        setResetResult({ error: "Admin key required" })
        return
      }

      const response = await fetch(`/api/db-reset?key=${adminKey}`, {
        method: "POST",
      })

      const data = await response.json()
      setResetResult(data)

      if (response.ok) {
        // Refresh status after reset
        fetchStatus()
      }
    } catch (err) {
      setResetResult({ error: "Failed to reset database" })
      console.error(err)
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#2d455a]">Database Status</h1>
          <div className="space-x-2">
            <Link href="/admin" className="bg-[#2d455a] hover:bg-[#1c2e3c] text-white px-4 py-2 rounded-md">
              Back to Admin
            </Link>
            <Button onClick={fetchStatus} className="bg-[#ff8210] hover:bg-[#e67200] text-white" disabled={loading}>
              Refresh Status
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-[#2d455a] text-white">
            <h2 className="text-xl font-semibold">Database Connection Status</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">Loading database status...</div>
            ) : error ? (
              <div className="text-red-500 text-center py-8">{error}</div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Connection Status</CardTitle>
                    <CardDescription>
                      {status?.connected ? "✅ Connected to database" : "❌ Not connected to database"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {status?.error && <div className="text-red-500 mb-4">{status.error}</div>}
                    {status?.version && (
                      <div className="text-sm text-gray-500">PostgreSQL version: {status.version}</div>
                    )}
                  </CardContent>
                </Card>

                {status?.connected && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tables Status</CardTitle>
                      <CardDescription>Information about database tables</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(status.tables).map(([table, info]: [string, any]) => (
                          <Card key={table}>
                            <CardHeader className="py-4">
                              <CardTitle className="text-lg">{table}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Exists:</span>
                                  <span>{info.exists ? "✅" : "❌"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Record count:</span>
                                  <span>{info.count}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Database Reset</CardTitle>
                    <CardDescription>
                      Reset the database to its default state. This will delete all data!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button variant="destructive" onClick={handleReset} disabled={resetLoading}>
                        {resetLoading ? "Resetting..." : "Reset Database"}
                      </Button>

                      {resetResult && (
                        <div
                          className={`mt-4 p-4 rounded ${resetResult.error ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                        >
                          {resetResult.error || resetResult.message}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
