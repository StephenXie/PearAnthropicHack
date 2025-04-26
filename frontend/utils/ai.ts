import { z } from "zod";

export const taskListSchema = z.array(
  z.object({
    title: z.string(),
    taskDescription: z.string(),
    value: z.number(),
  })
);

// export const exampleTaskList: z.infer<typeof taskListSchema> = [
//   {
//     title: "Grab the Yerba Mate",
//     taskDescription:
//       "Retrieve a chilled can of Yerba Mate from the fridge (or shelf) and place it on a stable surface.",
//     value: 10,
//   },
//   {
//     title: "Lift the Pull-Tab",
//     taskDescription:
//       "Pull the tab straight up until you hear the hiss of carbonation and the seal breaks.",
//     value: 20,
//   },
//   {
//     title: "Verify & Sip",
//     taskDescription:
//       "Check that the opening is clear, then take a small sip to confirm the can is fully open and enjoy your Yerba Mate.",
//     value: 10,
//   },
// ];

// export const exampleTaskList: z.infer<typeof taskListSchema> = [
//   {
//     title: "Take off your hoodie",
//     taskDescription:
//       "Undo the zipper, buttons, or snaps along the front of your jacket so it opens fully.",
//     value: 10,
//   },
//   {
//     title: "Remove First Sleeve",
//     taskDescription:
//       "Slide one arm out of its sleeve while holding the jacket steady with your other hand.",
//     value: 15,
//   },
//   {
//     title: "Remove Second Sleeve",
//     taskDescription:
//       "Pull the jacket off the remaining arm, ensuring the garment doesn't fall or drag.",
//     value: 15,
//   },
//   {
//     title: "Hang or Fold Hoodie",
//     taskDescription:
//       "Place the jacket on a hanger or neatly fold it to keep it wrinkle-free and ready for next use.",
//     value: 10,
//   },
// ];

export const exampleTaskList: z.infer<typeof taskListSchema> = [
  {
    title: "Show me a can of Yerba Mate",
    taskDescription:
      "Retrieve a chilled can of Yerba Mate from the fridge (or shelf) and place it on a stable surface.",
    value: 10,
  }, //,
  {
    title: "Open the can",
    taskDescription: "Show the can to the camera so I can see the opening.",
    value: 20,
  },
];

// Define schema for a single message content item (text or image)
const messageContentSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("image"), image: z.string() }), // base64 image
]);

// Define schema for a single message (user or assistant)
// Allow content to be string (for assistant) or array (for user with image)
export const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([z.string(), z.array(messageContentSchema)]),
  // Optional fields you might want later
  // timestamp: z.number().optional(),
  // imageSummary: z.string().optional(), // Could attach summary directly
});

// Define schema for the message history
export const messageHistorySchema = z.array(messageSchema);

// Updated request schema for the server action
export const requestSchema = z.object({
  taskList: taskListSchema,
  currentTaskIndex: z.number(),
  messageHistory: messageHistorySchema, // Pass the whole history
});

export const responseSchema = z.object({
  promptToUser: z.string().optional(),
  newTaskIndex: z.number(),
  imageSummary: z.string(),
});

export async function getExampleTaskList(): Promise<
  z.infer<typeof taskListSchema>
> {
  const res = await fetch(
    "https://stephen.ayush.digital/api/get_latest_task",
    // "https://deep-stable-gorilla.ngrok-free.app/api/get_latest_task",
    {
      // headers: {
      //   "ngrok-skip-browser-warning": "true",
      // },
    }
  );

  console.log(res);
  if (!res.ok) throw new Error("Failed to fetch latest task list");
  const data = await res.json();

  console.log("data", data);
  // Expecting data.subtasks to be an array of tasks
  return data.subtasks;

  return [
    {
      title: "Grab the Yerba Mate",
      taskDescription:
        "Retrieve a chilled can of Yerba Mate from the fridge (or shelf) and place it on a stable surface.",
      value: 10,
    },
    {
      title: "Lift the Pull-Tab",
      taskDescription:
        "Pull the tab straight up until you hear the hiss of carbonation and the seal breaks.",
      value: 20,
    },
    {
      title: "Verify & Sip",
      taskDescription:
        "Check that the opening is clear, then take a small sip to confirm the can is fully open and enjoy your Yerba Mate.",
      value: 10,
    },
  ];
}
