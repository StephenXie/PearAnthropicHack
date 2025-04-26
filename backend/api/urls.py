from django.urls import path
from . import views

urlpatterns = [
    path("api/generate_feedback_on_task_description", views.generate_feedback_on_task_description_view),
]