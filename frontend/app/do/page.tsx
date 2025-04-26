"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Send, Settings, RefreshCcw, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useMobile } from "@/hooks/use-mobile";
import {
  taskListSchema,
  exampleTaskList,
  responseSchema,
  requestSchema,
} from "@/utils/ai";
import { respond } from "@/utils/actions";
import { z } from "zod";
import Confetti from "react-confetti";

export default function RemoteInstructor() {
  const [cameraActive, setCameraActive] = useState(true);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useMobile();

  // State for task list and current index
  const [taskList, setTaskList] = useState<z.infer<typeof taskListSchema>>(
    exampleTaskList // Initialize with example data
  );
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // State for AI interaction
  const [aiResponse, setAiResponse] = useState<z.infer<
    typeof responseSchema
  > | null>(null);
  const [pastImageSummaries, setPastImageSummaries] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoopPaused, setIsLoopPaused] = useState(false);

  const completionSoundRef = useRef<HTMLAudioElement | null>(null);

  // Derived current task
  const currentTask = taskList.length > 0 ? taskList[currentTaskIndex] : null;

  // Mock data for instructor messages (will be replaced/updated by AI)
  const [instructorMessages, setInstructorMessages] = useState<
    {
      id: number;
      text: string;
      time: number;
    }[]
  >([
    {
      id: 1,
      text: "Let's get started! Show me your workspace.",
      time: Date.now(),
    },
  ]);

  // Function to capture frame and call AI
  const processCameraFrame = async () => {
    if (!cameraActive || !videoRef.current || isProcessing) {
      return; // Don't process if camera off, video not ready, or already processing
    }

    setIsProcessing(true);
    setError(null);

    let imageFile = "";
    try {
      // 1. Capture frame
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      imageFile = canvas.toDataURL("image/jpeg"); // Get base64 representation

      // 2. Prepare request
      const request: z.infer<typeof requestSchema> = {
        taskList,
        currentTaskIndex,
        imageFile,
        past15ImageSummaries: pastImageSummaries.slice(-15), // Send only the last 15
      };

      // 3. Call AI
      const response = await respond(request);

      // Check if task index increased (task completed)
      const previousTaskIndex = currentTaskIndex;
      // 4. Update state with response
      setAiResponse(response);
      setCurrentTaskIndex(response.newTaskIndex);
      setPastImageSummaries((prev) =>
        [...prev, response.imageSummary].slice(-30)
      ); // Keep last 30 summaries in state

      // Trigger confetti if a task was just completed
      if (response.newTaskIndex > previousTaskIndex) {
        setShowConfetti(true);
        completionSoundRef.current
          ?.play()
          .catch((err) => console.error("Error playing sound:", err));
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);
      }

      // Add AI prompt to messages if it's not empty
      if (response.promptToUser) {
        const newMessage = {
          id: Date.now(), // Use timestamp as ID
          text: response.promptToUser,
          time: Date.now(),
        };
        setInstructorMessages((prev) => [...prev, newMessage]);

        // Read the new message aloud
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(response.promptToUser);
          window.speechSynthesis.speak(utterance);
        } else {
          console.warn("Browser does not support Speech Synthesis.");
        }
      }
    } catch (err) {
      console.error("Error processing frame or calling AI:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      // Optionally add error message to instructor feed
      setInstructorMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: `Error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
          time: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect to run AI processing periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!isLoopPaused) {
        processCameraFrame();
        console.log(pastImageSummaries);
      }
    }, 3000); // Run every 3 seconds

    // Cleanup function to clear interval
    return () => clearInterval(intervalId);

    // Dependencies: Re-run if camera state changes or critical state updates
    // Note: Adding processCameraFrame directly causes infinite loops if state updates within it
    // We rely on the interval and the checks within processCameraFrame
  }, [
    cameraActive,
    isLoopPaused,
    taskList,
    currentTaskIndex,
    pastImageSummaries,
    isProcessing,
  ]);

  // Effect to get camera devices and initialize stream
  useEffect(() => {
    const getDevicesAndStream = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const availableVideoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setVideoDevices(availableVideoDevices);

        if (availableVideoDevices.length > 0) {
          // Try to find a back camera first
          let initialDeviceId =
            availableVideoDevices.find((device) =>
              device.label.toLowerCase().includes("back")
            )?.deviceId ?? availableVideoDevices[0].deviceId; // Default to first if no "back" found

          setCurrentDeviceId(initialDeviceId);

          if (cameraActive && videoRef.current) {
            // Stop any existing stream before starting a new one
            const currentStream = videoRef.current.srcObject as MediaStream;
            if (currentStream) {
              currentStream.getTracks().forEach((track) => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: initialDeviceId } },
            });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }
        } else {
          console.log("No video input devices found.");
          setCameraActive(false); // No cameras, turn off camera state
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setCameraActive(false);
      }
    };

    getDevicesAndStream();

    // Cleanup function to stop stream when component unmounts or camera turns off/changes
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraActive, currentDeviceId]); // <-- Re-run effect if cameraActive or currentDeviceId changes

  // Set mounted state after initial render
  useEffect(() => {
    setHasMounted(true);
    // Initialize the audio object
    completionSoundRef.current = new Audio("/sounds/task-complete.mp3");
    completionSoundRef.current.load(); // Preload the sound
  }, []);

  const handleSubmitQuestion = () => {
    if (question.trim()) {
      // In a real app, you would send this to your backend
      console.log("Question submitted:", question);
      setQuestion("");
      setShowQuestionForm(false);
    }
  };

  // Function to flip camera
  const flipCamera = () => {
    if (videoDevices.length > 1 && currentDeviceId) {
      const currentIndex = videoDevices.findIndex(
        (device) => device.deviceId === currentDeviceId
      );
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      setCurrentDeviceId(videoDevices[nextIndex].deviceId);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white overflow-hidden">
      {showConfetti && (
        <Confetti className="w-full h-full absolute top-0 left-0 z-50" />
      )}
      {/* Header */}
      <header className="bg-white border-b py-3 px-4 flex justify-between items-center shrink-0">
        <h1 className="text-lg font-semibold text-slate-800">
          Remote Task Instructor
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant={cameraActive ? "default" : "outline"}
            size="icon"
            onClick={() => setCameraActive(!cameraActive)}
            aria-label="Toggle camera"
          >
            <Camera className="h-4 w-4" />
          </Button>
          {videoDevices.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              onClick={flipCamera}
              aria-label="Flip camera"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsLoopPaused(!isLoopPaused)}
            aria-label={isLoopPaused ? "Resume processing" : "Pause processing"}
          >
            {isLoopPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Camera Stream - Fixed height on mobile, flex on desktop */}
        <div
          className={`relative bg-gray-100 ${
            hasMounted && isMobile ? "h-[40vh]" : "flex-1"
          } w-full overflow-hidden`}
        >
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-slate-500">
              <Camera className="h-16 w-16 opacity-50" />
              <p className="text-lg opacity-70">Camera is turned off</p>
              <Button onClick={() => setCameraActive(true)}>
                Enable Camera
              </Button>
            </div>
          )}
        </div>

        {/* Task and Feedback Panel - Scrollable on mobile */}
        {hasMounted && (
          <div
            className={`${
              isMobile
                ? "h-[60vh] overflow-y-auto"
                : "flex-1 overflow-hidden flex"
            } bg-slate-50`}
          >
            <div
              className={`${
                isMobile
                  ? "p-4 space-y-4"
                  : "flex-1 p-4 overflow-auto flex flex-col md:flex-row gap-4 max-w-7xl mx-auto w-full"
              }`}
            >
              {/* Current Task Card */}
              <Card
                className={`${
                  isMobile ? "w-full" : "w-full md:w-96"
                } shadow-sm`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      Task {currentTask ? currentTaskIndex + 1 : "N/A"} of{" "}
                      {taskList.length}
                    </CardTitle>
                    {currentTask && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        In Progress
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {currentTask ? currentTask.title : "No tasks available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">
                    {currentTask
                      ? currentTask.taskDescription
                      : "Add tasks to begin."}
                  </p>
                </CardContent>
              </Card>

              {/* Instructor Feedback */}
              <Card
                className={`${
                  isMobile ? "w-full" : "w-full md:w-96"
                } shadow-sm`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Instructor Feedback</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[200px] px-6 py-2">
                    {/* Timeline structure - Removed space-y-4, spacing handled by pb-4 on content */}
                    <div className="relative">
                      {[...instructorMessages]
                        .reverse()
                        .map((message, index, arr) => (
                          // Use items-start and self-stretch for the column
                          <div
                            key={message.id}
                            className="flex items-start gap-3"
                          >
                            {/* Timeline Dot and Line Column */}
                            <div className="flex flex-col items-center self-stretch">
                              {/* Dot - Use flex-shrink-0 */}
                              <div className="flex-shrink-0">
                                {index === 0 ? (
                                  <div className="relative h-3 w-3">
                                    <div className="absolute h-3 w-3 rounded-full bg-green-500"></div>
                                  </div>
                                ) : (
                                  <div className="h-3 w-3 rounded-full bg-slate-300"></div>
                                )}
                              </div>
                              {/* Connecting Line - Use flex-grow */}
                              {index < arr.length - 1 && (
                                <div className="w-px bg-slate-300 flex-grow"></div>
                              )}
                            </div>

                            {/* Message Content - Added pb-4 for spacing */}
                            <div className="pb-4 flex-1">
                              <p className="text-sm text-slate-700">
                                {message.text}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {(() => {
                                  const now = Date.now();
                                  const secondsAgo = Math.round(
                                    (now - message.time) / 1000
                                  );
                                  if (secondsAgo < 1) return "Just now";
                                  if (secondsAgo < 60)
                                    return `${secondsAgo} sec ago`;
                                  const minutesAgo = Math.floor(
                                    secondsAgo / 60
                                  );
                                  if (minutesAgo < 60)
                                    return `${minutesAgo} min ago`;
                                  const hoursAgo = Math.floor(minutesAgo / 60);
                                  // Add more conditions for days etc. if needed
                                  return `${hoursAgo} hr ago`;
                                })()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="pt-2 flex flex-col">
                  {showQuestionForm ? (
                    <div className="w-full space-y-2">
                      <Textarea
                        placeholder="Type your question here..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowQuestionForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSubmitQuestion}>
                          <Send className="h-4 w-4 mr-2" /> Send
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowQuestionForm(true)}
                    >
                      Ask a follow-up question
                    </Button>
                  )}
                  {error && (
                    <p className="text-xs text-red-500 mt-2">Error: {error}</p>
                  )}
                  {isProcessing && (
                    <p className="text-xs text-blue-500 mt-2">
                      AI Processing...
                    </p>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
        {!hasMounted && (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <p>Loading UI...</p>
          </div>
        )}
      </main>
    </div>
  );
}
