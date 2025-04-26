"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Calendar, MapPin, Clock } from "lucide-react"
import Map from "./map"
import useMobile from "../hooks/use-mobile"
import { generateTaskFeedback } from "../lib/api"

export default function EventDetailsInput() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [locationName, setLocationName] = useState("")
  const [startDateTime, setStartDateTime] = useState("")
  const [endDateTime, setEndDateTime] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useMobile()

  // Update local state when context changes
  useEffect(() => {
    setName("")
    setDescription("")
    setLocationName("")
    setStartDateTime("")
    setEndDateTime("")
    setSelectedLocation(null)
  }, [])

  // Update event details in context and send to API
  const handleSave = async () => {
    setIsSubmitting(true)
    
    // Log the current values
    console.log("Saving quest details:", { name, description, locationName });
    
    // Validate that we have a description
    if (!description.trim()) {
      console.error("Description is empty");
      alert("Please enter a quest description before continuing");
      setIsSubmitting(false);
      return;
    }
    
    // Save to context


    try {
      // Send request to API
      const data = {
        task_description: description,
        address: locationName || '',
        additional_instructions: `Start time: ${startDateTime}, End time: ${endDateTime}`
      }
      
      console.log("Storing data for chat:", data);

      // Create the complete task data object
      const taskData = {
        name,
        description,
        locationName,
        initialRequest: data,
      };
      
      // Store the task data in localStorage - using both sync and async approaches for robustness
      try {
        // First, try the regular way
        localStorage.setItem('currentTaskData', JSON.stringify(taskData));
        
        // Verify the data was stored properly
        const verification = localStorage.getItem('currentTaskData');
        console.log("Verification of stored data:", verification);
        
        // If storage seems to have failed, try an alternative approach
        if (!verification) {
          console.warn("First localStorage attempt failed, trying alternative...");
          window.localStorage.setItem('currentTaskData', JSON.stringify(taskData));
        }
        
        // Set a session storage backup just in case
        sessionStorage.setItem('currentTaskData', JSON.stringify(taskData));
      } catch (storageError) {
        console.error("Error storing data:", storageError);
        // Last resort - store in a global variable
        (window as any).currentTaskData = taskData;
      }

      // Small delay to ensure storage completes before navigation
      setTimeout(() => {
        // Navigate to chat page
        router.push('/chat');
      }, 100);
    } catch (error) {
      console.error('Error submitting quest details:', error)
      setIsSubmitting(false)
    }
  }

  // Handle location selection from map
  const handleLocationSelect = (location: { lat: number; lng: number } | null) => {
    setSelectedLocation(location)
  }

  // Handle setting location name from map or search
  const handleLocationNameChange = (name: string) => {
    setLocationName(name)
  }

  return (
    <Card className="border-gray-200 shadow-sm mb-6">
      <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50">
        <CardTitle className="text-gray-800 flex items-center text-lg">
          <Calendar className="mr-2 h-5 w-5 text-purple-600" />
          Quest Details
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

            {/* DateTime Inputs */}
            <div className="space-y-4">
              <div>
                <label htmlFor="start-datetime" className="block text-sm font-bold text-black mb-1 flex items-center">
                  <Clock className="mr-1 h-4 w-4 text-purple-600" />
                  Start Date & Time
                </label>
                <Input
                  id="start-datetime"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="border-gray-300 focus:ring-purple-500 bg-white text-black"
                />
              </div>

              <div>
                <label htmlFor="end-datetime" className="block text-sm font-bold text-black mb-1 flex items-center">
                  <Clock className="mr-1 h-4 w-4 text-purple-600" />
                  End Date & Time
                </label>
                <Input
                  id="end-datetime"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="border-gray-300 focus:ring-purple-500 bg-white text-black"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
              <MapPin className="mr-1 h-4 w-4 text-purple-600" />
              Location
            </h3>

            <div className={isMobile ? "h-[300px]" : "h-[400px]"}>
              <Map 
                selectedLocation={selectedLocation} 
                setSelectedLocation={handleLocationSelect}
                setLocationName={handleLocationNameChange}
              />
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white w-full"
          >
            {isSubmitting ? 'Sending...' : 'Send Quest Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 