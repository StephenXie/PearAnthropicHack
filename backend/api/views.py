from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .api import generate_feedback_on_task_description
from uuid import uuid4
from task.models import Task
from task.serializers import TaskSerializer
from random import randint

"""
POST: api/generate_feedback_on_task_description
Input:
{
    "task_description": str,
    "task_id": str, (Optional on 1st call, Required on 2nd+ calls)
    "address": str, (Optional)
    "additional_instructions": str (Optional)
}
Output:
{
    "task_id": str,
    "response": str,
    "multiple_choice": list[str], (Optional)
    "final_instruction": str, (Returned on last call)
    "subtasks": list[dict] (Returned on last call)
}
"""
@api_view(['POST'])
@permission_classes([AllowAny])
def generate_feedback_on_task_description_view(request):
    if not request.data.get('task_description'):
        return Response({'error': 'Task description is required'}, status=400)
    if not request.data.get('task_id') or not Task.objects.filter(task_id=request.data.get('task_id')).exists():
        task_id = str(uuid4())
        Task.objects.create(task_id=task_id)
    else:
        task_id = request.data.get('task_id')
    task = Task.objects.get(task_id=task_id)
    if not task.additional_instructions or not task.additional_instructions.strip():
        task.additional_instructions = request.data.get('additional_instructions', "")
    if not task.address:
        task.address = request.data.get('address', "")
    task_description = request.data.get('task_description')
    result = generate_feedback_on_task_description(task_description, task.conversation_data, task.address, task.additional_instructions)
    task.conversation_data = result["updated_conversation"]
    task.final_instruction = result["final_instruction"]
    task.subtasks = result["subtasks"]
    task.save()
    multiple_choice = result["multiple_choice"]
    response = {}
    response["task_id"] = task_id
    response["response"] = result["updated_conversation"][-1]["content"][0]["text"].strip()
    response["multiple_choice"] = multiple_choice
    response["final_instruction"] = result["final_instruction"]
    response["subtasks"] = result["subtasks"]
    return Response(response)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_latest_task(request):
    tasks = Task.objects.all()
    latest_task = tasks.order_by('-created_at').first()
    serializer = TaskSerializer(latest_task)
    result = serializer.data
    for task in result["subtasks"]:
        task["value"] = randint(1, 100)
        task["taskDescription"] = task["description"]
        del task["description"]
    return Response(result)

