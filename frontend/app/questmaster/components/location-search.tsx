"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete"
import { Search } from "lucide-react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useMapConfig } from "./map-config"

// Suppress console warnings for the deprecated AutocompleteService
const originalConsoleWarn = console.warn
console.warn = function filterWarnings(msg, ...args) {
  // Filter out specific Google Maps API deprecation warnings
  if (typeof msg === "string" && msg.includes("AutocompleteService is not available to new customers")) {
    return
  }
  originalConsoleWarn.apply(console, [msg, ...args])
}

interface LocationSearchProps {
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void
}

export default function LocationSearch({ setSelectedLocation }: LocationSearchProps) {
  const { isLoaded } = useMapConfig()
  const [isSearching, setIsSearching] = useState(false)
  const mounted = useRef(false)

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here */
    },
    debounce: 300,
    cache: 86400,
  })

  // Set mounted ref on component mount
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Reset the search value when the component mounts
  useEffect(() => {
    if (mounted.current) {
      setValue("")
    }
  }, [setValue])

  // Handle input change
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  // Handle selection of a suggestion
  const handleSelect = async (description: string) => {
    setIsSearching(true)

    // When user selects a place, get the details of that place
    setValue(description, false)
    clearSuggestions()

    try {
      const results = await getGeocode({ address: description })
      const { lat, lng } = await getLatLng(results[0])
      setSelectedLocation({ lat, lng })
    } catch (error) {
      console.error("Error: ", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle manual search
  const handleSearch = async () => {
    if (!value.trim()) return

    setIsSearching(true)

    try {
      const results = await getGeocode({ address: value })
      const { lat, lng } = await getLatLng(results[0])
      setSelectedLocation({ lat, lng })
      clearSuggestions()
    } catch (error) {
      console.error("Error: ", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex gap-2 bg-white p-2 rounded-md shadow-md">
        <Input
          value={value}
          onChange={handleInput}
          disabled={!ready || !isLoaded}
          placeholder="Search for a location..."
          className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 bg-white text-black"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearch()
            }
          }}
        />
        <Button
          onClick={handleSearch}
          disabled={!ready || !isLoaded || !value || isSearching}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSearching ? (
            <span className="flex items-center">
              <Search className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </span>
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {status === "OK" && (
        <div className="mt-2 bg-white rounded-md shadow-md max-h-60 overflow-y-auto">
          <ul className="divide-y divide-gray-100">
            {data.map(({ place_id, description }) => (
              <li
                key={place_id}
                className="p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelect(description)}
              >
                <p className="font-medium text-gray-800">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 