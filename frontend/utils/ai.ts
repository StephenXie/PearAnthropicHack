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
//       "Pull the jacket off the remaining arm, ensuring the garment doesn’t fall or drag.",
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
  },
  {
    title: "Lift the Pull-Tab",
    taskDescription:
      "Pull the tab straight up until you hear the hiss of carbonation and the seal breaks.",
    value: 20,
  },
];

export const requestSchema = z.object({
  taskList: taskListSchema,
  currentTaskIndex: z.number(),
  imageFile: z.string(),
  past15ImageSummaries: z.array(z.string()),
});

export const responseSchema = z.object({
  promptToUser: z.string(),
  newTaskIndex: z.number(),
  imageSummary: z.string(),
});
