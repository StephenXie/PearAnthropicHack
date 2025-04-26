"use client"

import { useEffect } from "react"
import EventDetailsInput from "./event-details-input"
import { useMapConfig } from "./map-config"

export default function MapSearch() {
  const { eventDetails } = useMapConfig()

  // Log event details when they change (for demonstration purposes)
  useEffect(() => {
    console.log("Event details updated:", eventDetails)
  }, [eventDetails])

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      {/* Event Details Input Component (now includes the map) */}
      <EventDetailsInput />
    </div>
  )
} 