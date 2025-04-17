"use client"

import { useState, useEffect } from "react"
import { fetchData, updateData, deleteData } from "@/lib/storage-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import type { DayPrices, Promotion } from "@/lib/types"
import AddPromotionForm from "./add-promotion"

export default function StorageAdminPage() {
  const [activeTab, setActiveTab] = useState<string>("day_prices")
  const [dayPrices, setDayPrices] = useState<DayPrices[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddPromotion, setShowAddPromotion] = useState<boolean>(false)

  // Fetch data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        const [dayPricesData, promotionsData] = await Promise.all([
          fetchData<DayPrices>("day_prices"),
          fetchData<Promotion>("promotions"),
        ])

        setDayPrices(dayPricesData)
        setPromotions(promotionsData)
        setError(null)
      } catch (err) {
        setError("Failed to fetch data. Please try again.")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  // Function to handle deleting a promotion
  const handleDeletePromotion = async (id: string) => {
    try {
      await deleteData("promotions", id)
      setPromotions(promotions.filter((promo) => promo.id !== id))
      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete promotion",
        variant: "destructive",
      })
    }
  }

  // Function to handle updating a day price
  const handleUpdateDayPrice = async (dayPrice: DayPrices) => {
    try {
      // In a real app, you would have a form to edit the day price
      // For simplicity, we're just updating the existing data
      await updateData("day_prices", dayPrice.id.toString(), dayPrice)

      // Update the local state
      setDayPrices(dayPrices.map((dp) => (dp.id === dayPrice.id ? dayPrice : dp)))

      toast({
        title: "Success",
        description: `${dayPrice.day} prices updated successfully`,
      })
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to update ${dayPrice.day} prices`,
        variant: "destructive",
      })
    }
  }

  // Function to refresh data after adding a promotion
  const handlePromotionAdded = async () => {
    setShowAddPromotion(false)
    setLoading(true)
    try {
      const promotionsData = await fetchData<Promotion>("promotions")
      setPromotions(promotionsData)
    } catch (err) {
      console.error("Error fetching promotions:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Storage Admin</h1>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="day_prices">Day Prices</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
        </TabsList>

        <TabsContent value="day_prices">
          <Card>
            <CardHeader>
              <CardTitle>Day Prices</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading day prices...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : dayPrices.length === 0 ? (
                <p>No day prices found.</p>
              ) : (
                <div className="space-y-4">
                  {dayPrices.map((dayPrice) => (
                    <Card key={dayPrice.id}>
                      <CardHeader>
                        <CardTitle>{dayPrice.day}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <h3 className="font-semibold mb-2">Bowling</h3>
                            <p>Available: {dayPrice.bowling.isAvailable ? "Yes" : "No"}</p>
                            <p>Time Slots: {dayPrice.bowling.timeSlots.length}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Darts</h3>
                            <p>Available: {dayPrice.darts.isAvailable ? "Yes" : "No"}</p>
                            <p>Time Slots: {dayPrice.darts.timeSlots.length}</p>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Laser Tag</h3>
                            <p>Available: {dayPrice.laserTag.isAvailable ? "Yes" : "No"}</p>
                            <p>Time Slots: {dayPrice.laserTag.timeSlots.length}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button onClick={() => handleUpdateDayPrice(dayPrice)} className="mr-2">
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              // In a real app, you would have a form to view the JSON
                              console.log(JSON.stringify(dayPrice, null, 2))
                              toast({
                                title: "Info",
                                description: "Day price details logged to console",
                              })
                            }}
                          >
                            View JSON
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions">
          <div className="mb-4">
            <Button onClick={() => setShowAddPromotion(!showAddPromotion)}>
              {showAddPromotion ? "Cancel" : "Add New Promotion"}
            </Button>
          </div>

          {showAddPromotion && (
            <div className="mb-6">
              <AddPromotionForm onSuccess={handlePromotionAdded} />
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Promotions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Loading promotions...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : promotions.length === 0 ? (
                <p>No promotions found.</p>
              ) : (
                <div className="space-y-4">
                  {promotions.map((promotion) => (
                    <Card key={promotion.id}>
                      <CardHeader>
                        <CardTitle>{promotion.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="mb-2">{promotion.description}</p>
                        <p className="text-sm text-gray-500">
                          Active: {promotion.isActive ? "Yes" : "No"} | Days: {promotion.applicableDays.join(", ")} |
                          Activities: {promotion.applicableActivities.join(", ")}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(promotion.startDate).toLocaleDateString()} -{" "}
                          {new Date(promotion.endDate).toLocaleDateString()}
                        </p>
                        <div className="mt-4">
                          <Button
                            onClick={() => {
                              // In a real app, you would have a form to edit the promotion
                              toast({
                                title: "Info",
                                description: "Edit functionality would be implemented here",
                              })
                            }}
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button variant="destructive" onClick={() => handleDeletePromotion(promotion.id)}>
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
