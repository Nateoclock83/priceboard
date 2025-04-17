"use client"

import type React from "react"

import { useState } from "react"
import { insertData } from "@/lib/storage-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import type { Promotion } from "@/lib/types"

export default function AddPromotionForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [applicableDays, setApplicableDays] = useState<string[]>(["Monday"])
  const [applicableActivities, setApplicableActivities] = useState<string[]>(["bowling"])
  const [loading, setLoading] = useState(false)

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const activities = [
    { id: "bowling", label: "Bowling" },
    { id: "darts", label: "Interactive Darts" },
    { id: "laserTag", label: "Laser Tag" },
  ]

  const handleDayToggle = (day: string) => {
    if (applicableDays.includes(day)) {
      setApplicableDays(applicableDays.filter((d) => d !== day))
    } else {
      setApplicableDays([...applicableDays, day])
    }
  }

  const handleActivityToggle = (activity: string) => {
    if (applicableActivities.includes(activity)) {
      setApplicableActivities(applicableActivities.filter((a) => a !== activity))
    } else {
      setApplicableActivities([...applicableActivities, activity])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !description || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (applicableDays.length === 0 || applicableActivities.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one day and one activity",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const newPromotion: Omit<Promotion, "id"> = {
        title,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        applicableDays,
        applicableActivities,
        isActive,
      }

      await insertData("promotions", {
        ...newPromotion,
        id: `promo_${Date.now()}`,
      })

      toast({
        title: "Success",
        description: "Promotion added successfully",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setStartDate("")
      setEndDate("")
      setIsActive(true)
      setApplicableDays(["Monday"])
      setApplicableActivities(["bowling"])

      // Call the success callback
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add promotion",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Promotion</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer Special"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Get 20% off all bowling lanes"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div>
            <Label>Applicable Days</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {days.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={applicableDays.includes(day)}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <Label htmlFor={`day-${day}`} className="cursor-pointer">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Applicable Activities</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`activity-${activity.id}`}
                    checked={applicableActivities.includes(activity.id)}
                    onCheckedChange={() => handleActivityToggle(activity.id)}
                  />
                  <Label htmlFor={`activity-${activity.id}`} className="cursor-pointer">
                    {activity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(checked as boolean)} />
            <Label htmlFor="isActive" className="cursor-pointer">
              Promotion is active
            </Label>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Promotion"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
