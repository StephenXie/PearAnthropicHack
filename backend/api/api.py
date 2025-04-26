from dotenv import load_dotenv
import os
import time
from uuid import uuid4
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field

load_dotenv()


class TaskDescriptionFeedbackModel(BaseModel):
    state: bool = Field(description="Is the task description detailed enough?")
    question: str = Field(description="If the task description lacks detail, ask a single, specific clarifying question that addresses the most important missing information. Be concise and direct.")
    multiple_choice: list[str] = Field(description="If the question can be answered with a single, specific answer, provide a list of possible answers to choose from. If it's better to have the user answer in their own words, leave this empty.")
class FinalInstructionModel(BaseModel):
    final_instruction: str = Field(description="Final, detailed instruction for the task.")
class SubtaskModel(BaseModel):
    subtasks: list[dict] = Field(description="List of specific, actionable subtasks that break down the main task into manageable steps. Each subtask should have a 'title' (brief name) and 'description' (detailed instructions) field.")
def generate_feedback_on_task_description(task_description, conversation_data, address, additional_instructions):
    llm = ChatAnthropic(
        model="claude-3-7-sonnet-20250219",
        temperature=0.9,
        max_tokens=1024,
        timeout=None,
        max_retries=2,
    )
    system_prompt = f"""
    You are a task description assistant helping users write detailed specifications for freelance tasks.
    {(("Address: " + address) if address else "")}
    {(("Additional instructions: " + additional_instructions) if additional_instructions else "")}
    Your goal is to ensure the task description contains all necessary details for a freelancer to understand and complete the work accurately.
    
    If the task description lacks critical information:
    1. Ask ONE specific clarifying question addressing the most important missing detail
    2. Be concise and direct
    3. Focus on practical information a freelancer would need
    
    Only ask for clarification when genuinely needed. If the description already contains sufficient detail, acknowledge it and move forward.
    
    Examples:
    User: "I need a website built"
    Assistant: "What specific functionality or purpose will this website serve?"
    
    User: "I need to put up a poster"
    Assistant: "Where exactly do you need this poster installed or displayed?"
    
    """
    if not conversation_data:
        conversation_data = [{
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": system_prompt
                }
            ]
        }]
    conversation_data.append({
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": task_description
            }
        ]
    })
    structured_llm = llm.with_structured_output(TaskDescriptionFeedbackModel)
    result = structured_llm.invoke(conversation_data)
    updated_conversation = conversation_data + [{
        "role": "assistant",
        "content": [
            {
                "type": "text",
                "text": result.question
            }
        ]
    }]
    if result.state:
        final_instruction = generate_final_instruction(updated_conversation)
        subtasks = generate_subtasks(final_instruction)
    else:
        final_instruction = None
        subtasks = []
    return {"final_instruction": final_instruction, "updated_conversation": updated_conversation, "subtasks": subtasks, "multiple_choice": result.multiple_choice}

def generate_final_instruction(conversation_data):
    llm = ChatAnthropic(
        model="claude-3-7-sonnet-20250219",
        temperature=0.5,
        max_tokens=1024,
        timeout=None,
        max_retries=2,
    )
    prompt = f"""
    You are a task description final instruction generator. The user is looking for freelancer to complete a task and you are helping them write a detailed task description. 
    Based on the conversation, generate a final instruction for the task.
    {conversation_data}
    """
    structured_llm = llm.with_structured_output(FinalInstructionModel)
    result = structured_llm.invoke(prompt)
    return result.final_instruction

def generate_subtasks(final_instruction):
    llm = ChatAnthropic(
        model="claude-3-7-sonnet-20250219",
        temperature=0.2,
        max_tokens=1024,
        timeout=None,
        max_retries=2,
    )
    prompt = f"""
    You are a subtask generator for physical tasks. Break down a complex task into 4-8 concrete steps that:
    1. Are specific and actionable ("Install shelf at eye-level" not "Set up storage")
    2. Can be verified with a photo (avoid "Research" or "Plan" steps)
    3. Progress logically from start to completion
    4. Have clear visual outcomes (e.g., "Attach drawer pulls with screws" shows completed drawer hardware)
    Make sure each subtask is clear and concise. 
    The user doesn't need to "take a photo", they will be monitored via a continuous video stream.
    {final_instruction}
    """
    structured_llm = llm.with_structured_output(SubtaskModel)
    result = structured_llm.invoke(prompt)
    return result.subtasks

def format_llm_output(output):
    res = {}
    for pair in output:
        res[pair[0]] = pair[1]
    return res