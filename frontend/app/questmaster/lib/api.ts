// API endpoint configuration
const API_BASE_URL = 'https://deep-stable-gorilla.ngrok-free.app';

interface GenerateTaskFeedbackRequest {
  task_description: string;  // The quest description entered by the user
  task_id?: string;          // Used for subsequent requests in the conversation
  address?: string;          // The human-readable location address
  additional_instructions?: string;
}

interface GenerateTaskFeedbackResponse {
  task_id: string;
  response: string;  // This is the API response text (renamed from 'response')
  multiple_choice?: string[];
  final_instruction?: string;
  subtasks?: any[];
}

/**
 * Send task description to get feedback from the LLM
 */
export async function generateTaskFeedback(data: GenerateTaskFeedbackRequest): Promise<GenerateTaskFeedbackResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate_feedback_on_task_description`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to generate task feedback:', error);
    throw error;
  }
} 