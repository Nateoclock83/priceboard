"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import type { LateNightLanes } from "@/lib/types"
import { updateLateNightLanes } from "@/lib/db"
import PriceBoard from "./price-board"
import { Clock, Moon, Sun } from "lucide-react"

interface LateNightLanesAdminProps {
  initialLateNightLanes: LateNightLanes
}

export default function LateNightLanesAdmin({ initialLateNightLanes }: LateNightLanesAdminProps) {
  const [lateNightLanes, setLateNightLanes] = useState<LateNightLanes>(initialLateNightLanes)
  const [isLoading, setIsLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("dark")

  const togglePreviewMode = () => {
    setPreviewMode(previewMode === "light" ? "dark" : "light")
  }

  const handleChange = (field: keyof LateNightLanes, value: any) => {
    setLateNightLanes({
      ...lateNightLanes,
      [field]: value,
    })
  }

  const handleToggleDay = (day: string) => {
    const currentDays = lateNightLanes.applicableDays || []
    if (currentDays.includes(day)) {
      handleChange(
        "applicableDays",
        currentDays.filter((d) => d !== day),
      )
    } else {
      handleChange("applicableDays", [...currentDays, day])
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await updateLateNightLanes(lateNightLanes)
      toast({
        title: "Success",
        description: "Late Night Lanes settings updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update Late Night Lanes settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-[#2d455a]">Late Night Lanes Settings</h3>
          <p className="text-gray-500">Configure the Late Night Lanes special pricing</p>
        </div>
        <div>
          <Button onClick={handleSave} disabled={isLoading} className="bg-[#a78bfa] hover:bg-[#9061f9] text-white">
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="bg-[#f7f7f7]">
            <CardTitle className="text-[#2d455a]">Basic Settings</CardTitle>
            <CardDescription>Configure when Late Night Lanes is active</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="late-night-active"
                checked={lateNightLanes.isActive}
                onCheckedChange={(checked) => handleChange("isActive", checked)}
              />
              <Label htmlFor="late-night-active" className="cursor-pointer">
                Late Night Lanes is active
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Applicable Days</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day}`}
                      checked={(lateNightLanes.applicableDays || []).includes(day)}
                      onCheckedChange={() => handleToggleDay(day)}
                    />
                    <Label htmlFor={`day-${day}`} className="cursor-pointer">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-[#a78bfa]" />
                  <Select value={lateNightLanes.startTime} onValueChange={(value) => handleChange("startTime", value)}>
                    <SelectTrigger className="border-[#2d455a]/20 focus-visible:ring-[#a78bfa]">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 96 }).map((_, i) => {
                        const hour = Math.floor(i / 4)
                        const minuteIndex = i % 4
                        const minute =
                          minuteIndex === 0 ? "00" : minuteIndex === 1 ? "15" : minuteIndex === 2 ? "30" : "45"
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
                <Label htmlFor="end-time">End Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-[#a78bfa]" />
                  <Select value={lateNightLanes.endTime} onValueChange={(value) => handleChange("endTime", value)}>
                    <SelectTrigger className="border-[#2d455a]/20 focus-visible:ring-[#a78bfa]">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLOSE">CLOSE</SelectItem>
                      {Array.from({ length: 96 }).map((_, i) => {
                        const hour = Math.floor(i / 4)
                        const minuteIndex = i % 4
                        const minute =
                          minuteIndex === 0 ? "00" : minuteIndex === 1 ? "15" : minuteIndex === 2 ? "30" : "45"
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
              <Label htmlFor="price">Price per Person</Label>
              <div className="flex items-center">
                <span className="mr-2 text-[#a78bfa] font-bold">$</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={lateNightLanes.price}
                  onChange={(e) => handleChange("price", Number.parseFloat(e.target.value) || 0)}
                  className="border-[#2d455a]/20 focus-visible:ring-[#a78bfa]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-[#f7f7f7]">
            <CardTitle className="text-[#2d455a]">Display Settings</CardTitle>
            <CardDescription>Configure how Late Night Lanes appears on the price board</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={lateNightLanes.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="e.g., UNLIMITED BOWLING AFTER 8PM"
                className="border-[#2d455a]/20 focus-visible:ring-[#a78bfa]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle/Tagline</Label>
              <Input
                id="subtitle"
                value={lateNightLanes.subtitle}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                placeholder="e.g., STRIKE. SIP. SOCIAL."
                className="border-[#2d455a]/20 focus-visible:ring-[#a78bfa]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disclaimer">Disclaimer</Label>
              <Textarea
                id="disclaimer"
                value={lateNightLanes.disclaimer}
                onChange={(e) => handleChange("disclaimer", e.target.value)}
                placeholder="e.g., *SUBJECT TO LANE AVAILABILITY. SHOE RENTAL NOT INCLUDED"
                className="border-[#2d455a]/20 focus-visible:ring-[#a78bfa]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader className="bg-[#f7f7f7]">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-[#2d455a]">Preview</CardTitle>
              <CardDescription>
                This is how Late Night Lanes will look when active, with regular pricing for darts and laser tag
              </CardDescription>
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
            <PriceBoard
              prices={[]}
              promotions={[]}
              lateNightLanes={lateNightLanes}
              darkMode={previewMode === "dark"}
              forceShowLateNight={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
