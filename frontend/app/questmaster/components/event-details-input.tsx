"use client"

import { useState, useEffect } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { useMapConfig } from "./map-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Calendar, MapPin } from "lucide-react"
import Map from "./map"
import useMobile from "../hooks/use-mobile"

export default function EventDetailsInput() {
  const { eventDetails, setEventDetails } = useMapConfig()
  const [name, setName] = useState(eventDetails.name)
  const [description, setDescription] = useState(eventDetails.description)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(eventDetails.location)
  const isMobile = useMobile()

  // Update local state when context changes
  useEffect(() => {
    setName(eventDetails.name)
    setDescription(eventDetails.description)
    setSelectedLocation(eventDetails.location)
  }, [eventDetails])

  // Update event details in context
  const handleSave = () => {
    setEventDetails({
      ...eventDetails,
      name,
      description,
      location: selectedLocation,
    })
  }

  // Handle location selection from map
  const handleLocationSelect = (location: { lat: number; lng: number } | null) => {
    setSelectedLocation(location)
    setEventDetails({
      ...eventDetails,
      location,
    })
  }

  return (
    <Card className="border-gray-200 shadow-sm mb-6">
      <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50">
        <CardTitle className="text-gray-800 flex items-center text-lg">
          <Calendar className="mr-2 h-5 w-5 text-purple-600" />
          Event Details
        </CardTitle>
        <CardDescription className="text-gray-500">Enter the details and location for your quest</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        <div className="space-y-6">
          {/* Event Name and Description */}
          <div className="space-y-4">
            <div>
              <label htmlFor="event-name" className="block text-sm font-bold text-black mb-1">
                Event Name
              </label>
              <Input
                id="event-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter event name"
                className="border-gray-300 focus:ring-purple-500 bg-white text-black"
              />
            </div>

            <div>
              <label htmlFor="event-description" className="block text-sm font-bold text-black mb-1">
                Quest Description
              </label>
              <Textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter the quest description"
                className="border-gray-300 focus:ring-purple-500 min-h-[80px] bg-white text-black"
              />
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
              <MapPin className="mr-1 h-4 w-4 text-purple-600" />
              Location
            </h3>

            <div className={isMobile ? "h-[300px]" : "h-[400px]"}>
              <Map selectedLocation={selectedLocation} setSelectedLocation={handleLocationSelect} />
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white w-full">
            Save Event Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 