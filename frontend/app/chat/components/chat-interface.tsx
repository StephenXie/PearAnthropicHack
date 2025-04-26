"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../questmaster/components/ui/card"
import { Button } from "../../questmaster/components/ui/button"
import { Input } from "../../questmaster/components/ui/input"
import { MessageSquare, Send, ChevronLeft } from "lucide-react"
import { generateTaskFeedback } from "../../questmaster/lib/api"

interface Message {
  id: string
  sender: "user" | "assistant"
  content: string
}

export default function ChatInterface() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [initialResponse, setInitialResponse] = useState<string>("")
  const [taskStarted, setTaskStarted] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([])
  const [showCustomInput, setShowCustomInput] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [initialRequestSent, setInitialRequestSent] = useState(false)
  // Use ref to track if initial request has been sent (more reliable than state)
  const initialRequestRef = useRef(false)
  
  // Load the initial task from localStorage
  useEffect(() => {
    // Skip if initial request already sent
    if (initialRequestSent) return;
    
    let taskData;
    
    // Try to get data from localStorage
    const storedTask = localStorage.getItem("currentTaskData");
    console.log("Stored task data from localStorage:", storedTask);
    
    // If not in localStorage, try sessionStorage
    if (!storedTask) {
      const sessionTask = sessionStorage.getItem("currentTaskData");
      console.log("Stored task data from sessionStorage:", sessionTask);
      
      if (sessionTask) {
        taskData = JSON.parse(sessionTask);
      }
    } else {
      taskData = JSON.parse(storedTask);
    }
    
    // Last resort - check global variable
    if (!taskData && (window as any).currentTaskData) {
      console.log("Using data from global variable");
      taskData = (window as any).currentTaskData;
    }
    
    // If we still don't have data, redirect back
    if (!taskData) {
      console.error("No task data found in any storage");
      router.push("/questmaster");
      return;
    }
    
    console.log("Final parsed task data:", taskData);
    
    // Add the initial user message
    setMessages([
      {
        id: "initial-message",
        sender: "user",
        content: taskData.description || "No description provided",
      },
    ]);
    
    // Immediately mark as sent to prevent double requests
    setInitialRequestSent(true);
    
    // Send initial request to API only if not already sent
    if (taskData.initialRequest && taskData.initialRequest.task_description) {
      handleInitialRequest(taskData.initialRequest);
    } else if (taskData.description) {
      // If initialRequest is missing but we have description, create it
      handleInitialRequest({
        task_description: taskData.description,
        address: taskData.locationName || '',
      });
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          sender: "assistant",
          content: "Error: No task description found. Please go back and enter details.",
        },
      ]);
      setIsLoading(false);
    }
  }, [router]); // Remove initialRequestSent from deps
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])
  
  // Handle the initial API request
  const handleInitialRequest = async (initialData: any) => {
    // Strong guard using ref to prevent duplicate calls
    if (initialRequestRef.current) {
      console.log("Initial request already sent (ref), preventing duplicate call");
      return;
    }
    
    // Set ref immediately to prevent any possibility of duplicate calls
    initialRequestRef.current = true;
    
    // Additional guard using task ID
    if (currentTaskId) {
      console.log("Initial request already sent (taskId), skipping duplicate");
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await generateTaskFeedback(initialData)
      setCurrentTaskId(response.task_id)
      setInitialResponse(response.response)
      setTaskStarted(true);
      // Add assistant message - handle both response field names
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          content: response.response || "No response received",
        },
      ])
      
      // Set multiple choice options if available
      if (response.multiple_choice && response.multiple_choice.length > 0) {
        setMultipleChoiceOptions(response.multiple_choice)
      }
      
      // Check if we have final instructions
      if (response.final_instruction) {
        // Store final instructions and redirect to progress page
        localStorage.setItem("finalInstructions", JSON.stringify({
          instruction: response.final_instruction,
          subtasks: response.subtasks || [],
        }))
        router.push("/progress")
      }
    } catch (error) {
      console.error("Error sending initial request:", error)
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          sender: "assistant",
          content: "Sorry, there was an error processing your request. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !currentTaskId) return
    
    // Add user message
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      content,
    }
    
    setMessages(prev => [...prev, newUserMessage])
    setInput("")
    setShowCustomInput(false)
    setMultipleChoiceOptions([])
    setIsLoading(true)
    
    try {
      // Declare response variable outside the conditionals
      let response: any;
      
      // Send to API
      if (taskStarted) {
        console.log("Sending to API with taskStarted true")
        response = await generateTaskFeedback({
          task_description: content,
          task_id: currentTaskId,
        })
      } else {
        response = {
          response: initialResponse,
          task_id: currentTaskId,
          multiple_choice: [],
          final_instruction: "",
          subtasks: [],
        }
        setTaskStarted(true);
      }
      
      // Add assistant response
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          content: response.response || "No response received",
        },
      ])
      
      // Set multiple choice options if available
      if (response.multiple_choice && response.multiple_choice.length > 0) {
        setMultipleChoiceOptions(response.multiple_choice)
      }
      
      // Check if we have final instructions
      if (response.final_instruction) {
        // Store final instructions and redirect to progress page
        localStorage.setItem("finalInstructions", JSON.stringify({
          instruction: response.final_instruction,
          subtasks: response.subtasks || [],
        }))
        
        // Short delay before redirecting
        setTimeout(() => {
          router.push("/progress")
        }, 1000)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          sender: "assistant",
          content: "Sorry, there was an error processing your message. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle multiple choice selection
  const handleChoiceSelect = (choice: string) => {
    if (choice === "Other...") {
      setShowCustomInput(true)
    } else {
      handleSendMessage(choice)
    }
  }
  
  return (
    <Card className="shadow-md h-[80vh] flex flex-col">
      <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50">
        <CardTitle className="text-gray-800 flex items-center text-lg">
          <MessageSquare className="mr-2 h-5 w-5 text-purple-600" />
          Quest Refinement Chat
        </CardTitle>
        <CardDescription className="text-gray-500">
          Chat with the AI to refine your quest details
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${
                message.sender === "user" ? "flex justify-end" : "flex justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 p-3 rounded-lg text-gray-800">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "600ms" }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Ref for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Multiple choice or input area */}
        <div className="border-t border-gray-200 p-4">
          {multipleChoiceOptions.length > 0 && !showCustomInput ? (
            <div className="mb-4">
              <div className="overflow-x-auto">
                <div className="flex space-x-2 pb-2">
                  {multipleChoiceOptions.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => handleChoiceSelect(option)}
                      className="whitespace-nowrap bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-full"
                      variant="outline"
                    >
                      {option}
                    </Button>
                  ))}
                  <Button
                    onClick={() => handleChoiceSelect("Other...")}
                    className="whitespace-nowrap bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-full"
                    variant="outline"
                  >
                    Other...
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              {showCustomInput && (
                <Button
                  onClick={() => {
                    setShowCustomInput(false)
                    setMultipleChoiceOptions(multipleChoiceOptions)
                  }}
                  className="mr-2"
                  size="icon"
                  variant="ghost"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(input)
                  }
                }}
                placeholder="Type your response..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSendMessage(input)}
                className="ml-2 bg-purple-600 hover:bg-purple-700 text-white"
                size="icon"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 