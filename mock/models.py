


from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=255)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    dark_mode = models.BooleanField(default=False)
    plan = models.CharField(max_length=50, default='Free Plan')
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    profession = models.CharField(max_length=100, blank=True, null=True)
    experience = models.CharField(max_length=10, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    email_notifications = models.BooleanField(default=True)
    practice_reminders = models.BooleanField(default=False)
    score_updates = models.BooleanField(default=True)

    def __str__(self):
        return self.full_name

class UsedQuestion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    question = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'question']




class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    topic = models.CharField(max_length=100)
    message = models.TextField()
    privacy_agreed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.topic} ({self.created_at})"


        

# # for storing of score of feedback in database

# class InterviewSession(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     interview_type = models.CharField(max_length=100)
#     date = models.DateTimeField(auto_now_add=True)
#     overall_score = models.FloatField()
#     average_score = models.FloatField()
#     feedback_text = models.TextField()
#     # Optionally: store per-question breakdown as JSON
#     question_data = models.JSONField(default=list)  # Requires Django 3.1+
