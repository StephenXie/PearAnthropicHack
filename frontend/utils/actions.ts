"use server";

import { generateObject } from "ai";
import { requestSchema, responseSchema } from "./ai";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";

export async function respond(
  request: z.infer<typeof requestSchema>
): Promise<z.infer<typeof responseSchema>> {
  "use server";

  const { taskList, currentTaskIndex, imageFile, past15ImageSummaries } =
    request;

  const { object } = await generateObject({
    model: anthropic("claude-3-7-sonnet-20250219"),
    schema: responseSchema,
    /* ---------- Messages ---------- */
    messages: [
      {
        role: "system",
        content: `
You are a vision-enabled assistant that helps users finish a checklist.

Return ONLY valid JSON with this shape:
{
  promptToUser: string,
  ifFailure: boolean,
  newTaskIndex: number,
  imageSummary: string
}

Logic:
1. Inspect the image and decide whether taskList[currentTaskIndex] is complete.
2. If complete:
     ifFailure    = false
     newTaskIndex = min(currentTaskIndex + 1, taskList.length - 1)
     promptToUser = ""
3. If NOT complete:
     ifFailure    = true
     newTaskIndex = currentTaskIndex
     promptToUser = one concise next-step tip
4. Always provide imageSummary (≤2 sentences). This image summary should be in relation to the task that is going on. Don't focus on irrelevant details.
`,
      },
      {
        role: "user",
        content: [
          /* image separate from the single text “box” */
          { type: "image", image: imageFile },
          {
            type: "text",
            text: `
### TASK LIST
${JSON.stringify(taskList, null, 2)}

### CURRENT TASK INDEX
${currentTaskIndex}

### PAST 15 IMAGE SUMMARIES
${past15ImageSummaries
  .map((s, i) => `#${past15ImageSummaries.length - i}: ${s}`)
  .join("\n")}
`,
          },
        ],
      },
    ],
  });

  return object; // strongly typed, schema-validated JSON
}
