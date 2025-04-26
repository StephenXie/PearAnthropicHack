"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

// Define the event details type
export interface EventDetails {
  name: string
  description: string
  location: { lat: number; lng: number } | null
}

interface MapConfigContextType {
  // Remove API key related properties
  isLoaded: boolean
  setIsLoaded: (loaded: boolean) => void
  // Add event details
  eventDetails: EventDetails
  setEventDetails: (details: EventDetails) => void
}

// Default event details
const defaultEventDetails: EventDetails = {
  name: "",
  description: "",
  location: null,
}

const MapConfigContext = createContext<MapConfigContextType | undefined>(undefined)

export function MapConfigProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [eventDetails, setEventDetails] = useState<EventDetails>(defaultEventDetails)

  // Load event details from localStorage on mount
  useEffect(() => {
    const savedEventDetails = localStorage.getItem("eventDetails")
    if (savedEventDetails) {
      try {
        setEventDetails(JSON.parse(savedEventDetails))
      } catch (e) {
        console.error("Failed to parse saved event details", e)
      }
    }
  }, [])

  // Save event details to localStorage when they change
  useEffect(() => {
    if (eventDetails.name || eventDetails.description || eventDetails.location) {
      localStorage.setItem("eventDetails", JSON.stringify(eventDetails))
    }
  }, [eventDetails])

  return (
    <MapConfigContext.Provider value={{ isLoaded, setIsLoaded, eventDetails, setEventDetails }}>
      {children}
    </MapConfigContext.Provider>
  )
}

export function useMapConfig() {
  const context = useContext(MapConfigContext)
  if (context === undefined) {
    throw new Error("useMapConfig must be used within a MapConfigProvider")
  }
  return context
} 