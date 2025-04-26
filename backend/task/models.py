from django.db import models

# Create your models here.
class Task(models.Model):
    task_id = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    conversation_data = models.JSONField(null=True, blank=True)
    final_instruction = models.TextField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    additional_instructions = models.TextField(null=True, blank=True)
    subtasks = models.JSONField(null=True, blank=True)