"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { GoogleMap, Marker, useJsApiLoader, Libraries } from "@react-google-maps/api"
import { MapPin } from "lucide-react"
import { Button } from "./ui/button"
import { useMapConfig } from "./map-config"
import LocationSearch from "./location-search"

// Define libraries array outside component to prevent recreation on each render
const libraries: Libraries = ["places"]

interface MapProps {
  selectedLocation: { lat: number; lng: number } | null
  setSelectedLocation: (location: { lat: number; lng: number } | null) => void
  setLocationName?: (name: string) => void
}

// Map container style
const containerStyle = {
  width: "100%",
  height: "100%",
}

// Default center (New York)
const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
}

// Hardcoded API key - in a real application, this would be an environment variable
const GOOGLE_MAPS_API_KEY = "AIzaSyAbWrxUnlMnfv3seH6uDZ1HzTVYZNvDuCQ"

export default function Map({ selectedLocation, setSelectedLocation, setLocationName }: MapProps) {
  const { setIsLoaded } = useMapConfig()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const [google, setGoogle] = useState<any>(null)

  // Load the Google Maps script with hardcoded API key
  const { isLoaded: jsApiLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  })

  useEffect(() => {
    if (jsApiLoaded) {
      // Access google object here
      setGoogle(window.google)
    }
  }, [jsApiLoaded])

  // Update context loaded state when jsApiLoaded changes
  useEffect(() => {
    setIsLoaded(jsApiLoaded)
  }, [jsApiLoaded, setIsLoaded])

  // Callback when map is loaded
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    setMap(map)
  }, [])

  // Callback when map is unmounted
  const onUnmount = useCallback(() => {
    mapRef.current = null
    setMap(null)
  }, [])

  // Handle map click to set location
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        setSelectedLocation({ lat, lng })
        
        // Use reverse geocoding to get address from coordinates
        if (google && setLocationName) {
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode(
            { location: { lat, lng } },
            (
              results: google.maps.GeocoderResult[] | null,
              status: google.maps.GeocoderStatus
            ) => {
              if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                setLocationName(results[0].formatted_address)
              } else {
                setLocationName(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`)
              }
            }
          )
        }
      }
    },
    [setSelectedLocation, setLocationName, google],
  )

  // Pan to selected location when it changes
  useEffect(() => {
    if (map && selectedLocation) {
      map.panTo(selectedLocation)
    }
  }, [map, selectedLocation])

  // Handle getting user's current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setSelectedLocation(location)
          
          // Use reverse geocoding for current location too
          if (google && setLocationName) {
            const geocoder = new google.maps.Geocoder()
            geocoder.geocode(
              { location },
              (
                results: google.maps.GeocoderResult[] | null,
                status: google.maps.GeocoderStatus
              ) => {
                if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                  setLocationName(results[0].formatted_address)
                } else {
                  setLocationName(`Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`)
                }
              }
            )
          }
        },
        () => {
          alert("Unable to retrieve your location")
        },
      )
    } else {
      alert("Geolocation is not supported by your browser")
    }
  }

  // If the script is not loaded yet, show a loading message
  if (!jsApiLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading Google Maps...</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full rounded-md overflow-hidden border border-gray-200">
      {/* Location search component */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <LocationSearch setSelectedLocation={setSelectedLocation} setLocationName={setLocationName} />
      </div>

      {/* Google Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={selectedLocation || defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          styles: [
            {
              elementType: "geometry",
              stylers: [{ color: "#f5f5f5" }],
            },
            {
              elementType: "labels.text.fill",
              stylers: [{ color: "#616161" }],
            },
            {
              elementType: "labels.text.stroke",
              stylers: [{ color: "#f5f5f5" }],
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#c9c9c9" }],
            },
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#dadada" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#c9c9c9" }],
            },
            {
              featureType: "water",
              elementType: "labels.text.fill",
              stylers: [{ color: "#9e9e9e" }],
            },
          ],
        }}
      >
        {/* Marker for selected location */}
        {selectedLocation && google && (
          <Marker
            position={selectedLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#9333ea",
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 10,
            }}
          />
        )}
      </GoogleMap>

      {/* Current location button */}
      <div className="absolute bottom-4 right-4">
        <Button
          onClick={handleGetCurrentLocation}
          className="bg-white text-gray-700 hover:bg-gray-50 rounded-full shadow-md flex items-center"
        >
          <MapPin className="mr-2 h-4 w-4 text-purple-600" />
          Use my location
        </Button>
      </div>
    </div>
  )
} 