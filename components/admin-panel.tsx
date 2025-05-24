"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import type { DayPrices, Promotion, ActivityPrice } from "@/lib/types"
import { updateDayPrices, updatePromotions, exportHtml, addPromotion, deletePromotion, formatTimeRange } from "@/lib/db"
import { toast } from "@/hooks/use-toast"
import PriceBoard from "./price-board"
import { CalendarIcon, PlusCircle, Trash2, Clock, Plus, X, PencilIcon, Moon, Sun, Clock3 } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// Add this component at the top of the file, after the imports but before the AdminPanel component:

function TimeRangeDisplay({ startTime, endTime }: { startTime: string; endTime: string }) {
  const [formattedRange, setFormattedRange] = useState<string>("")

  useEffect(() => {
    const formatRange = async () => {
      const range = await formatTimeRange(startTime, endTime)
      setFormattedRange(range)
    }

    formatRange()
  }, [startTime, endTime])

  return <span>{formattedRange}</span>
}

interface AdminPanelProps {
  initialPrices: DayPrices[]
  initialPromotions: Promotion[]
}

export default function AdminPanel({ initialPrices, initialPromotions }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("prices")
  const [prices, setPrices] = useState<DayPrices[]>(initialPrices)
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions)
  const [selectedDay, setSelectedDay] = useState<string>(initialPrices[0]?.day || "Thursday")
  const [isLoading, setIsLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // New promotion state
  const [newPromotion, setNewPromotion] = useState<Partial<Promotion>>({
    title: "",
    description: "",
    terms: "", // Add this line
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    applicableDays: ["Thursday"],
    applicableActivities: ["bowling"],
    isActive: true,
  })

  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)

  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light")

  const togglePreviewMode = () => {
    setPreviewMode(previewMode === "light" ? "dark" : "light")
  }

  // Function to handle toggling activity availability
  const handleActivityAvailabilityChange = (day: string, activity: string, isAvailable: boolean) => {
    setPrices(
      prices.map((dayPrice) => {
        if (dayPrice.day === day) {
          return {
            ...dayPrice,
            [activity]: {
              ...(dayPrice[activity as keyof DayPrices] as ActivityPrice),
              isAvailable,
            },
          }
        }
        return dayPrice
      }),
    )
  }

  // Function to handle toggling wait time display
  const handleWaitTimeToggle = (day: string, activity: string, showWaitTime: boolean) => {
    setPrices(
      prices.map((dayPrice) => {
        if (dayPrice.day === day) {
          return {
            ...dayPrice,
            [activity]: {
              ...(dayPrice[activity as keyof DayPrices] as ActivityPrice),
              showWaitTime,
              // Initialize wait time if it doesn't exist
              waitTime: (dayPrice[activity as keyof DayPrices] as ActivityPrice).waitTime || 30,
            },
          }
        }
        return dayPrice
      }),
    )
  }

  // Function to handle changing wait time
  const handleWaitTimeChange = (day: string, activity: string, waitTime: number) => {
    setPrices(
      prices.map((dayPrice) => {
        if (dayPrice.day === day) {
          return {
            ...dayPrice,
            [activity]: {
              ...(dayPrice[activity as keyof DayPrices] as ActivityPrice),
              waitTime,
            },
          }
        }
        return dayPrice
      }),
    )
  }

  // Function to handle adding a new time slot to an activity
  const handleAddTimeSlot = (day: string, activity: string) => {
    setPrices(
      prices.map((dayPrice) => {
        if (dayPrice.day === day) {
          const activityData = dayPrice[activity as keyof DayPrices] as ActivityPrice
          const lastSlot = activityData.timeSlots[activityData.timeSlots.length - 1]

          // Default end time for the new slot
          const defaultEndTime = "CLOSE"

          // If the last slot ends with "CLOSE", set its end time to a specific time
          // and make the new slot end with "CLOSE"
          if (lastSlot && lastSlot.endTime === "CLOSE") {
            // Create a copy of the time slots
            const updatedTimeSlots = [...activityData.timeSlots]

            // Set the last slot's end time to a specific time (2 hours after start)
            const lastSlotStartHour = Number.parseInt(lastSlot.startTime.split(":")[0])
            const newEndTime = `${(lastSlotStartHour + 2).toString().padStart(2, "0")}:00`
            updatedTimeSlots[updatedTimeSlots.length - 1] = {
              ...lastSlot,
              endTime: newEndTime,
            }

            // Add the new slot starting from the previous slot's end time
            updatedTimeSlots.push({
              startTime: newEndTime,
              endTime: "CLOSE",
              price: lastSlot.price,
            })

            return {
              ...dayPrice,
              [activity]: {
                ...activityData,
                timeSlots: updatedTimeSlots,
              },
            }
          } else {
            // If there are no slots or the last slot doesn't end with "CLOSE"
            const defaultStartTime = lastSlot ? lastSlot.endTime : "10:00"

            return {
              ...dayPrice,
              [activity]: {
                ...activityData,
                timeSlots: [
                  ...activityData.timeSlots,
                  {
                    startTime: defaultStartTime,
                    endTime: "CLOSE",
                    price: lastSlot ? lastSlot.price : 0,
                  },
                ],
              },
            }
          }
        }
        return dayPrice
      }),
    )
  }

  // Function to handle removing a time slot
  const handleRemoveTimeSlot = (day: string, activity: string, index: number) => {
    setPrices(
      prices.map((dayPrice) => {
        if (dayPrice.day === day) {
          const activityData = dayPrice[activity as keyof DayPrices] as ActivityPrice

          // If this is the last time slot, don't remove it
          if (activityData.timeSlots.length <= 1) {
            toast({
              title: "Cannot Remove",
              description: "Each activity must have at least one time slot",
              variant: "destructive",
            })
            return dayPrice
          }

          // Create a copy of the time slots without the one at the specified index
          const updatedTimeSlots = activityData.timeSlots.filter((_, i) => i !== index)

          // If we removed a slot that wasn't the last one, we need to update the next slot's start time
          if (index < activityData.timeSlots.length - 1) {
            // If we removed a slot that wasn't the first one, set the next slot's start time to the previous slot's start time
            if (index > 0) {
              updatedTimeSlots[index - 1] = {
                ...updatedTimeSlots[index - 1],
                endTime: activityData.timeSlots[index + 1].startTime,
              }
            }
          }

          // If we removed the last slot and the new last slot doesn't end with "CLOSE",
          // update it to end with "CLOSE"
          if (index === activityData.timeSlots.length - 1 && updatedTimeSlots.length > 0) {
            updatedTimeSlots[updatedTimeSlots.length - 1] = {
              ...updatedTimeSlots[updatedTimeSlots.length - 1],
              endTime: "CLOSE",
            }
          }

          return {
            ...dayPrice,
            [activity]: {
              ...activityData,
              timeSlots: updatedTimeSlots,
            },
          }
        }
        return dayPrice
      }),
    )
  }

  // Function to handle changes to a time slot
  const handleTimeSlotChange = (day: string, activity: string, index: number, field: string, value: string) => {
    setPrices(
      prices.map((dayPrice) => {
        if (dayPrice.day === day) {
          const activityData = dayPrice[activity as keyof DayPrices] as ActivityPrice
          const updatedTimeSlots = [...activityData.timeSlots]

          updatedTimeSlots[index] = {
            ...updatedTimeSlots[index],
            [field]: field === "price" ? Number(value) || 0 : value,
          }

          return {
            ...dayPrice,
            [activity]: {
              ...activityData,
              timeSlots: updatedTimeSlots,
            },
          }
        }
        return dayPrice
      }),
    )
  }

  // Function to handle changes to an activity note
  const handleActivityNoteChange = (day: string, activity: string, value: string) => {
    setPrices(
      prices.map((dayPrice) => {
        if (dayPrice.day === day) {
          return {
            ...dayPrice,
            [activity]: {
              ...(dayPrice[activity as keyof DayPrices] as ActivityPrice),
              note: value,
            },
          }
        }
        return dayPrice
      }),
    )
  }

  const handleActivityPriceTextChange = (day: string, activity: string, value: string) => {
    setPrices(
      prices.map((dayPrice) => {
        if (dayPrice.day === day) {
          return {
            ...dayPrice,
            [activity]: {
              ...(dayPrice[activity as keyof DayPrices] as ActivityPrice),
              priceText: value,
            },
          }
        }
        return dayPrice
      }),
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await updateDayPrices(prices)
      await updatePromotions(promotions)
      toast({
        title: "Success",
        description: "Prices and promotions updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const htmlUrl = await exportHtml(prices, promotions)
      toast({
        title: "HTML Exported",
        description: "Your HTML file is ready to download",
      })
      // Create a download link
      const a = document.createElement("a")
      a.href = htmlUrl
      a.download = "price-board.html"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export HTML",
        variant: "destructive",
      })
    } finally {
      setExportLoading(false)
    }
  }

  const handleNewPromotionChange = (field: keyof Promotion, value: any) => {
    setNewPromotion({
      ...newPromotion,
      [field]: value,
    })
  }

  const handleToggleDay = (day: string) => {
    const currentDays = newPromotion.applicableDays || []
    if (currentDays.includes(day)) {
      handleNewPromotionChange(
        "applicableDays",
        currentDays.filter((d) => d !== day),
      )
    } else {
      handleNewPromotionChange("applicableDays", [...currentDays, day])
    }
  }

  const handleToggleActivity = (activity: string) => {
    const currentActivities = newPromotion.applicableActivities || []
    if (currentActivities.includes(activity)) {
      handleNewPromotionChange(
        "applicableActivities",
        currentActivities.filter((a) => a !== activity),
      )
    } else {
      handleNewPromotionChange("applicableActivities", [...currentActivities, activity])
    }
  }

  // Update the handleAddPromotion function to store terms in local state only
  const handleAddPromotion = async () => {
    if (!newPromotion.title || !newPromotion.description) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive",
      })
      return
    }

    try {
      // Store the terms in a local variable
      const terms = newPromotion.terms || ""

      const promotionToAdd: Promotion = {
        id: `promo_${Date.now()}`,
        title: newPromotion.title || "",
        description: newPromotion.description || "",
        terms: terms, // Keep this for the UI
        startDate: newPromotion.startDate || new Date().toISOString(),
        endDate: newPromotion.endDate || new Date().toISOString(),
        applicableDays: newPromotion.applicableDays || ["Thursday"],
        applicableActivities: newPromotion.applicableActivities || ["bowling"],
        isActive: newPromotion.isActive !== undefined ? newPromotion.isActive : true,
      }

      await addPromotion(promotionToAdd)

      // Add to local state with terms
      setPromotions([...promotions, promotionToAdd])

      // Reset form
      setNewPromotion({
        title: "",
        description: "",
        terms: "",
        startDate: new Date().toISOString(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        applicableDays: ["Thursday"],
        applicableActivities: ["bowling"],
        isActive: true,
      })

      toast({
        title: "Success",
        description: "Promotion added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add promotion",
        variant: "destructive",
      })
    }
  }

  // Update the handleEditPromotion function to handle terms in local state only
  const handleEditPromotion = async () => {
    if (!editingPromotion) return

    setIsLoading(true)
    try {
      // Store the terms locally
      const terms = editingPromotion.terms || ""

      // Update the database (db.ts will handle removing terms)
      await updatePromotions(promotions.map((p) => (p.id === editingPromotion.id ? editingPromotion : p)))

      // Update the local state with terms preserved
      setPromotions(
        promotions.map((p) => {
          if (p.id === editingPromotion.id) {
            return {
              ...editingPromotion,
              terms: terms, // Ensure terms is preserved in UI
            }
          }
          return p
        }),
      )

      toast({
        title: "Success",
        description: "Promotion updated successfully",
      })

      // Close the edit dialog
      setEditingPromotion(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update promotion",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePromotion = async (promotionId: string) => {
    try {
      await deletePromotion(promotionId)
      setPromotions(promotions.filter((p) => p.id !== promotionId))
      toast({
        title: "Success",
        description: "Promotion deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete promotion",
        variant: "destructive",
      })
    }
  }

  const currentDayPrices = prices.find((p) => p.day === selectedDay) || prices[0]

  // Helper function to format time for display in the admin panel
  const formatTimeForDisplay = (time: string) => {
    if (time === "CLOSE") return time

    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : ""} ${period}`
  }

  // Helper function to get hours and minutes from total minutes
  const getHoursAndMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return { hours, minutes }
  }

  // Helper function to convert hours and minutes to total minutes
  const getTotalMinutes = (hours: number, minutes: number) => {
    return hours * 60 + minutes
  }

  return (
    <div className="admin-panel space-y-8">
      <div className="flex justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-[#2d455a]">Manage Prices & Promotions</h3>
          <p className="text-gray-500">Update pricing and special offers</p>
        </div>
        <div className="space-x-2">
          <Button onClick={handleSave} disabled={isLoading} className="bg-[#2d455a] hover:bg-[#1c2e3c] text-white">
            {isLoading ? "Saving..." : "Save All Changes"}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportLoading}
            className="border-[#ff8210] text-[#ff8210] hover:bg-[#fff8f0]"
          >
            {exportLoading ? "Exporting..." : "Export HTML"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="prices" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="prices" className="data-[state=active]:bg-[#2d455a] data-[state=active]:text-white">
            Pricing
          </TabsTrigger>
          <TabsTrigger value="promotions" className="data-[state=active]:bg-[#ff8210] data-[state=active]:text-white">
            Promotions
          </TabsTrigger>
        </TabsList>

        {/* Pricing Tab */}
        <TabsContent value="prices" className="space-y-6">
          <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay}>
            <TabsList className="grid grid-cols-7 mb-6">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <TabsTrigger
                  key={day}
                  value={day}
                  className="data-[state=active]:bg-[#ff8210] data-[state=active]:text-white"
                >
                  {day}
                </TabsTrigger>
              ))}
            </TabsList>

            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
              // Find the pricing data for this day
              const dayPrice = prices.find((p) => p.day === day)

              // If we don't have data for this day, skip it (this shouldn't happen now that we've added all days)
              if (!dayPrice) return null

              // Get hours and minutes for wait time display
              const waitTime = dayPrice.bowling.waitTime || 30
              const { hours: waitHours, minutes: waitMinutes } = getHoursAndMinutes(waitTime)

              return (
                <TabsContent key={day} value={day} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Bowling Card */}
                    <Card>
                      <CardHeader className="bg-[#f7f7f7]">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-[#2d455a]">Bowling</CardTitle>
                            <CardDescription>Set pricing for bowling lanes</CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`bowling-available-${dayPrice.day}`} className="text-sm text-gray-500">
                              {dayPrice.bowling.isAvailable ? "Available" : "Unavailable"}
                            </Label>
                            <Switch
                              id={`bowling-available-${dayPrice.day}`}
                              checked={dayPrice.bowling.isAvailable}
                              onCheckedChange={(checked) =>
                                handleActivityAvailabilityChange(dayPrice.day, "bowling", checked)
                              }
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Wait Time Section */}
                          {!dayPrice.bowling.isAvailable && (
                            <div className="p-4 border rounded-md bg-gray-50">
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center">
                                  <Clock3 className="mr-2 h-4 w-4 text-[#ff8210]" />
                                  <Label htmlFor={`bowling-wait-${dayPrice.day}`} className="font-medium">
                                    Show Wait Time
                                  </Label>
                                </div>
                                <Switch
                                  id={`bowling-wait-${dayPrice.day}`}
                                  checked={dayPrice.bowling.showWaitTime || false}
                                  onCheckedChange={(checked) => handleWaitTimeToggle(dayPrice.day, "bowling", checked)}
                                />
                              </div>

                              {dayPrice.bowling.showWaitTime && (
                                <div className="space-y-4">
                                  <Label className="block font-medium">Wait Time</Label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`bowling-wait-hours-${dayPrice.day}`}>Hours</Label>
                                      <Input
                                        id={`bowling-wait-hours-${dayPrice.day}`}
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={waitHours}
                                        onChange={(e) => {
                                          const hours = Number.parseInt(e.target.value) || 0
                                          const newTotalMinutes = getTotalMinutes(hours, waitMinutes)
                                          handleWaitTimeChange(dayPrice.day, "bowling", newTotalMinutes)
                                        }}
                                        className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`bowling-wait-minutes-${dayPrice.day}`}>Minutes</Label>
                                      <Input
                                        id={`bowling-wait-minutes-${dayPrice.day}`}
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={waitMinutes}
                                        onChange={(e) => {
                                          const minutes = Number.parseInt(e.target.value) || 0
                                          const newTotalMinutes = getTotalMinutes(waitHours, minutes)
                                          handleWaitTimeChange(dayPrice.day, "bowling", newTotalMinutes)
                                        }}
                                        className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                                      />
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-2">
                                    Total wait time:{" "}
                                    {waitHours > 0 ? `${waitHours} hour${waitHours !== 1 ? "s" : ""}` : ""}
                                    {waitHours > 0 && waitMinutes > 0 ? " and " : ""}
                                    {waitMinutes > 0
                                      ? `${waitMinutes} minute${waitMinutes !== 1 ? "s" : ""}`
                                      : waitHours === 0
                                        ? "0 minutes"
                                        : ""}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Time slots */}
                          {dayPrice.bowling.timeSlots.map((slot, index) => (
                            <div key={index} className="p-4 border rounded-md relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                                onClick={() => handleRemoveTimeSlot(dayPrice.day, "bowling", index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`bowling-start-${index}`}>Start Time</Label>
                                  <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4 text-[#ff8210]" />
                                    <Select
                                      value={slot.startTime}
                                      onValueChange={(value) =>
                                        handleTimeSlotChange(dayPrice.day, "bowling", index, "startTime", value)
                                      }
                                    >
                                      <SelectTrigger className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]">
                                        <SelectValue placeholder="Select start time" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 96 }).map((_, i) => {
                                          const hour = Math.floor(i / 4)
                                          const minuteIndex = i % 4
                                          const minute =
                                            minuteIndex === 0
                                              ? "00"
                                              : minuteIndex === 1
                                                ? "15"
                                                : minuteIndex === 2
                                                  ? "30"
                                                  : "45"
                                          const time = `${hour.toString().padStart(2, "0")}:${minute}`
                                          const period = hour >= 12 ? "PM" : "AM"
                                          const displayHour = hour % 12 || 12
                                          const displayTime = `${displayHour}:${minute} ${period}`
                                          return (
                                            <SelectItem key={i} value={time}>
                                              {displayTime}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`bowling-end-${index}`}>End Time</Label>
                                  <div className="flex items-center">
                                    <Select
                                      value={slot.endTime}
                                      onValueChange={(value) =>
                                        handleTimeSlotChange(dayPrice.day, "bowling", index, "endTime", value)
                                      }
                                    >
                                      <SelectTrigger className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]">
                                        <SelectValue placeholder="Select end time" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="CLOSE">CLOSE</SelectItem>
                                        {Array.from({ length: 96 }).map((_, i) => {
                                          const hour = Math.floor(i / 4)
                                          const minuteIndex = i % 4
                                          const minute =
                                            minuteIndex === 0
                                              ? "00"
                                              : minuteIndex === 1
                                                ? "15"
                                                : minuteIndex === 2
                                                  ? "30"
                                                  : "45"
                                          const time = `${hour.toString().padStart(2, "0")}:${minute}`
                                          const period = hour >= 12 ? "PM" : "AM"
                                          const displayHour = hour % 12 || 12
                                          const displayTime = `${displayHour}:${minute} ${period}`
                                          return (
                                            <SelectItem key={i} value={time}>
                                              {displayTime}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`bowling-price-${index}`}>Price per hour</Label>
                                <div className="flex items-center">
                                  <span className="mr-2 text-[#ff8210] font-bold">$</span>
                                  <Input
                                    id={`bowling-price-${index}`}
                                    type="number"
                                    value={slot.price}
                                    onChange={(e) =>
                                      handleTimeSlotChange(dayPrice.day, "bowling", index, "price", e.target.value)
                                    }
                                    className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                                  />
                                </div>
                              </div>

                              <div className="mt-2 text-sm text-gray-500">
                                <TimeRangeDisplay startTime={slot.startTime} endTime={slot.endTime} />
                              </div>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            className="w-full mt-2 border-dashed border-[#2d455a]/30 text-[#2d455a]/70"
                            onClick={() => handleAddTimeSlot(dayPrice.day, "bowling")}
                            disabled={!dayPrice.bowling.isAvailable}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Time Slot
                          </Button>

                          <div className="space-y-2 mt-4">
                            <Label htmlFor={`bowling-note-${dayPrice.day}`}>Additional Note</Label>
                            <Input
                              id={`bowling-note-${dayPrice.day}`}
                              value={dayPrice.bowling.note || ""}
                              onChange={(e) => handleActivityNoteChange(dayPrice.day, "bowling", e.target.value)}
                              placeholder="e.g., 1-6 guests per lane"
                              className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                              disabled={!dayPrice.bowling.isAvailable}
                            />
                          </div>

                          <div className="space-y-2 mt-4">
                            <Label htmlFor={`bowling-price-text-${dayPrice.day}`}>Price Text</Label>
                            <Input
                              id={`bowling-price-text-${dayPrice.day}`}
                              value={dayPrice.bowling.priceText || ""}
                              onChange={(e) => handleActivityPriceTextChange(dayPrice.day, "bowling", e.target.value)}
                              placeholder="e.g., PER LANE, PER HOUR"
                              className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                              disabled={!dayPrice.bowling.isAvailable}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Darts Card */}
                    <Card>
                      <CardHeader className="bg-[#f7f7f7]">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-[#2d455a]">Interactive Darts</CardTitle>
                            <CardDescription>Set pricing for dart lanes</CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`darts-available-${dayPrice.day}`} className="text-sm text-gray-500">
                              {dayPrice.darts.isAvailable ? "Available" : "Unavailable"}
                            </Label>
                            <Switch
                              id={`darts-available-${dayPrice.day}`}
                              checked={dayPrice.darts.isAvailable}
                              onCheckedChange={(checked) =>
                                handleActivityAvailabilityChange(dayPrice.day, "darts", checked)
                              }
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Time slots */}
                          {dayPrice.darts.timeSlots.map((slot, index) => (
                            <div key={index} className="p-4 border rounded-md relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                                onClick={() => handleRemoveTimeSlot(dayPrice.day, "darts", index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`darts-start-${index}`}>Start Time</Label>
                                  <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4 text-[#ff8210]" />
                                    <Select
                                      value={slot.startTime}
                                      onValueChange={(value) =>
                                        handleTimeSlotChange(dayPrice.day, "darts", index, "startTime", value)
                                      }
                                    >
                                      <SelectTrigger className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]">
                                        <SelectValue placeholder="Select start time" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 96 }).map((_, i) => {
                                          const hour = Math.floor(i / 4)
                                          const minuteIndex = i % 4
                                          const minute =
                                            minuteIndex === 0
                                              ? "00"
                                              : minuteIndex === 1
                                                ? "15"
                                                : minuteIndex === 2
                                                  ? "30"
                                                  : "45"
                                          const time = `${hour.toString().padStart(2, "0")}:${minute}`
                                          const period = hour >= 12 ? "PM" : "AM"
                                          const displayHour = hour % 12 || 12
                                          const displayTime = `${displayHour}:${minute} ${period}`
                                          return (
                                            <SelectItem key={i} value={time}>
                                              {displayTime}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`darts-end-${index}`}>End Time</Label>
                                  <div className="flex items-center">
                                    <Select
                                      value={slot.endTime}
                                      onValueChange={(value) =>
                                        handleTimeSlotChange(dayPrice.day, "darts", index, "endTime", value)
                                      }
                                    >
                                      <SelectTrigger className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]">
                                        <SelectValue placeholder="Select end time" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="CLOSE">CLOSE</SelectItem>
                                        {Array.from({ length: 96 }).map((_, i) => {
                                          const hour = Math.floor(i / 4)
                                          const minuteIndex = i % 4
                                          const minute =
                                            minuteIndex === 0
                                              ? "00"
                                              : minuteIndex === 1
                                                ? "15"
                                                : minuteIndex === 2
                                                  ? "30"
                                                  : "45"
                                          const time = `${hour.toString().padStart(2, "0")}:${minute}`
                                          const period = hour >= 12 ? "PM" : "AM"
                                          const displayHour = hour % 12 || 12
                                          const displayTime = `${displayHour}:${minute} ${period}`
                                          return (
                                            <SelectItem key={i} value={time}>
                                              {displayTime}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`darts-price-${index}`}>Price per hour</Label>
                                <div className="flex items-center">
                                  <span className="mr-2 text-[#ff8210] font-bold">$</span>
                                  <Input
                                    id={`darts-price-${index}`}
                                    type="number"
                                    value={slot.price}
                                    onChange={(e) =>
                                      handleTimeSlotChange(dayPrice.day, "darts", index, "price", e.target.value)
                                    }
                                    className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                                  />
                                </div>
                              </div>

                              <div className="mt-2 text-sm text-gray-500">
                                <TimeRangeDisplay startTime={slot.startTime} endTime={slot.endTime} />
                              </div>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            className="w-full mt-2 border-dashed border-[#2d455a]/30 text-[#2d455a]/70"
                            onClick={() => handleAddTimeSlot(dayPrice.day, "darts")}
                            disabled={!dayPrice.darts.isAvailable}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Time Slot
                          </Button>

                          <div className="space-y-2 mt-4">
                            <Label htmlFor={`darts-note-${dayPrice.day}`}>Additional Note</Label>
                            <Input
                              id={`darts-note-${dayPrice.day}`}
                              value={dayPrice.darts.note || ""}
                              onChange={(e) => handleActivityNoteChange(dayPrice.day, "darts", e.target.value)}
                              placeholder="e.g., per lane"
                              className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                              disabled={!dayPrice.darts.isAvailable}
                            />
                          </div>

                          <div className="space-y-2 mt-4">
                            <Label htmlFor={`darts-price-text-${dayPrice.day}`}>Price Text</Label>
                            <Input
                              id={`darts-price-text-${dayPrice.day}`}
                              value={dayPrice.darts.priceText || ""}
                              onChange={(e) => handleActivityPriceTextChange(dayPrice.day, "darts", e.target.value)}
                              placeholder="e.g., PER LANE, PER HOUR"
                              className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                              disabled={!dayPrice.darts.isAvailable}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Laser Tag Card */}
                    <Card>
                      <CardHeader className="bg-[#f7f7f7]">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-[#2d455a]">Laser Tag</CardTitle>
                            <CardDescription>Set pricing for laser tag sessions</CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`laserTag-available-${dayPrice.day}`} className="text-sm text-gray-500">
                              {dayPrice.laserTag.isAvailable ? "Available" : "Unavailable"}
                            </Label>
                            <Switch
                              id={`laserTag-available-${dayPrice.day}`}
                              checked={dayPrice.laserTag.isAvailable}
                              onCheckedChange={(checked) =>
                                handleActivityAvailabilityChange(dayPrice.day, "laserTag", checked)
                              }
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Time slots */}
                          {dayPrice.laserTag.timeSlots.map((slot, index) => (
                            <div key={index} className="p-4 border rounded-md relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                                onClick={() => handleRemoveTimeSlot(dayPrice.day, "laserTag", index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`laserTag-start-${index}`}>Start Time</Label>
                                  <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4 text-[#ff8210]" />
                                    <Select
                                      value={slot.startTime}
                                      onValueChange={(value) =>
                                        handleTimeSlotChange(dayPrice.day, "laserTag", index, "startTime", value)
                                      }
                                    >
                                      <SelectTrigger className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]">
                                        <SelectValue placeholder="Select start time" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 96 }).map((_, i) => {
                                          const hour = Math.floor(i / 4)
                                          const minuteIndex = i % 4
                                          const minute =
                                            minuteIndex === 0
                                              ? "00"
                                              : minuteIndex === 1
                                                ? "15"
                                                : minuteIndex === 2
                                                  ? "30"
                                                  : "45"
                                          const time = `${hour.toString().padStart(2, "0")}:${minute}`
                                          const period = hour >= 12 ? "PM" : "AM"
                                          const displayHour = hour % 12 || 12
                                          const displayTime = `${displayHour}:${minute} ${period}`
                                          return (
                                            <SelectItem key={i} value={time}>
                                              {displayTime}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`laserTag-end-${index}`}>End Time</Label>
                                  <div className="flex items-center">
                                    <Select
                                      value={slot.endTime}
                                      onValueChange={(value) =>
                                        handleTimeSlotChange(dayPrice.day, "laserTag", index, "endTime", value)
                                      }
                                    >
                                      <SelectTrigger className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]">
                                        <SelectValue placeholder="Select end time" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="CLOSE">CLOSE</SelectItem>
                                        {Array.from({ length: 96 }).map((_, i) => {
                                          const hour = Math.floor(i / 4)
                                          const minuteIndex = i % 4
                                          const minute =
                                            minuteIndex === 0
                                              ? "00"
                                              : minuteIndex === 1
                                                ? "15"
                                                : minuteIndex === 2
                                                  ? "30"
                                                  : "45"
                                          const time = `${hour.toString().padStart(2, "0")}:${minute}`
                                          const period = hour >= 12 ? "PM" : "AM"
                                          const displayHour = hour % 12 || 12
                                          const displayTime = `${displayHour}:${minute} ${period}`
                                          return (
                                            <SelectItem key={i} value={time}>
                                              {displayTime}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`laserTag-price-${index}`}>Price per session</Label>
                                <div className="flex items-center">
                                  <span className="mr-2 text-[#ff8210] font-bold">$</span>
                                  <Input
                                    id={`laserTag-price-${index}`}
                                    type="number"
                                    value={slot.price}
                                    onChange={(e) =>
                                      handleTimeSlotChange(dayPrice.day, "laserTag", index, "price", e.target.value)
                                    }
                                    className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                                  />
                                </div>
                              </div>

                              <div className="mt-2 text-sm text-gray-500">
                                <TimeRangeDisplay startTime={slot.startTime} endTime={slot.endTime} />
                              </div>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            className="w-full mt-2 border-dashed border-[#2d455a]/30 text-[#2d455a]/70"
                            onClick={() => handleAddTimeSlot(dayPrice.day, "laserTag")}
                            disabled={!dayPrice.laserTag.isAvailable}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Time Slot
                          </Button>

                          <div className="space-y-2 mt-4">
                            <Label htmlFor={`laserTag-note-${dayPrice.day}`}>Additional Note</Label>
                            <Input
                              id={`laserTag-note-${dayPrice.day}`}
                              value={dayPrice.laserTag.note || ""}
                              onChange={(e) => handleActivityNoteChange(dayPrice.day, "laserTag", e.target.value)}
                              placeholder="e.g., per person, per session"
                              className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                              disabled={!dayPrice.laserTag.isAvailable}
                            />
                          </div>

                          <div className="space-y-2 mt-4">
                            <Label htmlFor={`laserTag-price-text-${dayPrice.day}`}>Price Text</Label>
                            <Input
                              id={`laserTag-price-text-${dayPrice.day}`}
                              value={dayPrice.laserTag.priceText || ""}
                              onChange={(e) => handleActivityPriceTextChange(dayPrice.day, "laserTag", e.target.value)}
                              placeholder="e.g., PER PERSON, PER SESSION"
                              className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                              disabled={!dayPrice.laserTag.isAvailable}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Preview for the current day */}
                  <Card>
                    <CardHeader className="bg-[#f7f7f7]">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-[#2d455a]">Preview for {dayPrice.day}</CardTitle>
                          <CardDescription>This is how the price board will look on {dayPrice.day}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={togglePreviewMode}
                          >
                            {previewMode === "light" ? (
                              <>
                                <Moon className="h-4 w-4" />
                                <span>Dark Mode</span>
                              </>
                            ) : (
                              <>
                                <Sun className="h-4 w-4" />
                                <span>Light Mode</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className={`w-full aspect-[16/9] border border-gray-200 overflow-hidden`}>
                        <PriceBoard
                          prices={prices}
                          promotions={promotions}
                          selectedDay={dayPrice.day}
                          darkMode={previewMode === "dark"}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-6">
          <Card>
            <CardHeader className="bg-[#f7f7f7]">
              <CardTitle className="text-[#2d455a]">Add New Promotion</CardTitle>
              <CardDescription>Create special offers for your customers</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="promo-title">Promotion Title</Label>
                  <Input
                    id="promo-title"
                    value={newPromotion.title || ""}
                    onChange={(e) => handleNewPromotionChange("title", e.target.value)}
                    placeholder="e.g., April Thursday Special"
                    className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo-desc">Promotion Description</Label>
                  <Input
                    id="promo-desc"
                    value={newPromotion.description || ""}
                    onChange={(e) => handleNewPromotionChange("description", e.target.value)}
                    placeholder="e.g., Purchase one hour, get 30 minutes free"
                    className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo-terms">Terms & Conditions</Label>
                  <Input
                    id="promo-terms"
                    value={newPromotion.terms || ""}
                    onChange={(e) => handleNewPromotionChange("terms", e.target.value)}
                    placeholder="e.g., Must be redeemed before 6:30 PM"
                    className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                  />
                  <p className="text-xs text-gray-500">Specify any restrictions or conditions for this promotion</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newPromotion.startDate ? format(new Date(newPromotion.startDate), "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newPromotion.startDate ? new Date(newPromotion.startDate) : undefined}
                          onSelect={(date) => handleNewPromotionChange("startDate", date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newPromotion.endDate ? format(new Date(newPromotion.endDate), "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newPromotion.endDate ? new Date(newPromotion.endDate) : undefined}
                          onSelect={(date) => handleNewPromotionChange("endDate", date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Applicable Days</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={(newPromotion.applicableDays || []).includes(day)}
                          onCheckedChange={() => handleToggleDay(day)}
                        />
                        <Label htmlFor={`day-${day}`} className="cursor-pointer">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Applicable Activities</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[
                      { id: "bowling", label: "Bowling" },
                      { id: "darts", label: "Interactive Darts" },
                      { id: "laserTag", label: "Laser Tag" },
                    ].map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`activity-${activity.id}`}
                          checked={(newPromotion.applicableActivities || []).includes(activity.id)}
                          onCheckedChange={() => handleToggleActivity(activity.id)}
                        />
                        <Label htmlFor={`activity-${activity.id}`} className="cursor-pointer">
                          {activity.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="promo-active"
                    checked={newPromotion.isActive !== undefined ? newPromotion.isActive : true}
                    onCheckedChange={(checked) => handleNewPromotionChange("isActive", checked)}
                  />
                  <Label htmlFor="promo-active" className="cursor-pointer">
                    Promotion is active
                  </Label>
                </div>

                <Button onClick={handleAddPromotion} className="bg-[#ff8210] hover:bg-[#e67200] text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Promotion
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-[#f7f7f7]">
              <CardTitle className="text-[#2d455a]">Current Promotions</CardTitle>
              <CardDescription>Manage your existing promotions</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {promotions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No promotions yet. Add your first promotion above.</div>
              ) : (
                <div className="space-y-4">
                  {promotions.map((promo) => (
                    <div key={promo.id} className="border rounded-lg p-4 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#2d455a]">{promo.title}</h4>
                          {promo.isActive ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Inactive</span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{promo.description}</p>
                        {promo.terms && (
                          <p className="text-amber-600 mt-1 text-sm font-medium">
                            <span className="font-bold">Terms:</span> {promo.terms}
                          </p>
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Dates:</span> {format(new Date(promo.startDate), "PP")} to{" "}
                            {format(new Date(promo.endDate), "PP")}
                          </div>
                          <div>
                            <span className="font-medium">Days:</span> {promo.applicableDays.join(", ")}
                          </div>
                          <div>
                            <span className="font-medium">Activities:</span>{" "}
                            {promo.applicableActivities
                              .map((a) =>
                                a === "bowling" ? "Bowling" : a === "darts" ? "Interactive Darts" : "Laser Tag",
                              )
                              .join(", ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingPromotion(promo)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePromotion(promo.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview with promotions */}
          <Card>
            <CardHeader className="bg-[#f7f7f7]">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-[#2d455a]">Preview with Promotions</CardTitle>
                  <CardDescription>See how your price board looks with active promotions</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={togglePreviewMode}>
                    {previewMode === "light" ? (
                      <>
                        <Moon className="h-4 w-4" />
                        <span>Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <Sun className="h-4 w-4" />
                        <span>Light Mode</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className={`w-full aspect-[16/9] border border-gray-200 overflow-hidden`}>
                <PriceBoard prices={prices} promotions={promotions} darkMode={previewMode === "dark"} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Promotion Dialog */}
      <Dialog open={!!editingPromotion} onOpenChange={(open) => !open && setEditingPromotion(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Promotion</DialogTitle>
          </DialogHeader>

          {editingPromotion && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingPromotion.title}
                  onChange={(e) => setEditingPromotion({ ...editingPromotion, title: e.target.value })}
                  className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingPromotion.description}
                  onChange={(e) => setEditingPromotion({ ...editingPromotion, description: e.target.value })}
                  className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-terms">Terms & Conditions</Label>
                <Input
                  id="edit-terms"
                  value={editingPromotion.terms || ""}
                  onChange={(e) => setEditingPromotion({ ...editingPromotion, terms: e.target.value })}
                  className="border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                  placeholder="e.g., Must be redeemed before 6:30 PM"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingPromotion.startDate
                          ? format(new Date(editingPromotion.startDate), "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingPromotion.startDate ? new Date(editingPromotion.startDate) : undefined}
                        onSelect={(date) =>
                          setEditingPromotion({ ...editingPromotion, startDate: date?.toISOString() || "" })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal border-[#2d455a]/20 focus-visible:ring-[#ff8210]"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingPromotion.endDate ? format(new Date(editingPromotion.endDate), "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingPromotion.endDate ? new Date(editingPromotion.endDate) : undefined}
                        onSelect={(date) =>
                          setEditingPromotion({ ...editingPromotion, endDate: date?.toISOString() || "" })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applicable Days</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-day-${day}`}
                        checked={(editingPromotion.applicableDays || []).includes(day)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditingPromotion({
                              ...editingPromotion,
                              applicableDays: [...editingPromotion.applicableDays, day],
                            })
                          } else {
                            setEditingPromotion({
                              ...editingPromotion,
                              applicableDays: editingPromotion.applicableDays.filter((d) => d !== day),
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`edit-day-${day}`} className="cursor-pointer">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applicable Activities</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { id: "bowling", label: "Bowling" },
                    { id: "darts", label: "Interactive Darts" },
                    { id: "laserTag", label: "Laser Tag" },
                  ].map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-activity-${activity.id}`}
                        checked={(editingPromotion.applicableActivities || []).includes(activity.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditingPromotion({
                              ...editingPromotion,
                              applicableActivities: [...editingPromotion.applicableActivities, activity.id],
                            })
                          } else {
                            setEditingPromotion({
                              ...editingPromotion,
                              applicableActivities: editingPromotion.applicableActivities.filter(
                                (a) => a !== activity.id,
                              ),
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`edit-activity-${activity.id}`} className="cursor-pointer">
                        {activity.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-active"
                  checked={editingPromotion.isActive}
                  onCheckedChange={(checked) => setEditingPromotion({ ...editingPromotion, isActive: !!checked })}
                />
                <Label htmlFor="edit-active" className="cursor-pointer">
                  Promotion is active
                </Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPromotion(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditPromotion}
              disabled={isLoading}
              className="bg-[#ff8210] hover:bg-[#e67200] text-white"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
