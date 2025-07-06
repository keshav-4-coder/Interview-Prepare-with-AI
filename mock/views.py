from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
import logging
import time
import re
from django.core.exceptions import ValidationError
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .forms import SignupForm, LoginForm
from .models import UserProfile
from .api import get_interview_question, evaluate_response
import dns.resolver
from django.core.files.storage import FileSystemStorage
import os
from .models import ContactMessage
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from social_django.views import complete  # Added for OAuth2 callback

# Set up logging
logger = logging.getLogger(__name__)

def landing(request):
    return render(request, 'landing.html')

def interview_form(request):
    if request.method == 'POST':
        request.session.pop('questions', None)
        request.session.pop('current_question_index', None)
        request.session.pop('feedback_data', None)
        request.session.pop('interview_data', None)

        job_role = request.POST.get('jobRole')
        industry = request.POST.get('industry')
        experience_level = request.POST.get('experienceLevel')
        interview_type = request.POST.get('interviewType')
        specific_skills = request.POST.get('specificSkills')
        user = request.user if request.user.is_authenticated else None
        request.session['interview_data'] = {
            'job_role': job_role,
            'industry': industry,
            'experience_level': experience_level,
            'interview_type': interview_type,
            'specific_skills': specific_skills
        }
        questions = set()
        max_attempts = 3
        target_questions = 10
        attempt_count = 0
        max_total_attempts = 30

        while len(questions) < target_questions and attempt_count < max_total_attempts:
            question_data = get_interview_question(job_role, industry, experience_level, interview_type, specific_skills, user=user)
            if 'question' in question_data and question_data['question']:
                questions.add(question_data['question'])
            attempt_count += 1
            if attempt_count >= max_total_attempts:
                logger.warning(f"Reached max attempts ({max_total_attempts}), filling with placeholder questions")
                break

        while len(questions) < target_questions:
            placeholder = f"Placeholder question {len(questions)+1}: Describe a relevant experience for {job_role}."
            questions.add(placeholder)
            logger.error(f"Added placeholder question due to insufficient unique questions")

        request.session['questions'] = list(questions)
        request.session['current_question_index'] = 0
        request.session['feedback_data'] = []
        return redirect('interview_start')
    return render(request, 'interview_form.html')

def interview_start(request):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    logger.info(f"Request method: {request.method}, Is AJAX: {is_ajax}, Session keys: {list(request.session.keys())}")

    if request.method == 'GET' and is_ajax:
        if 'interview_data' not in request.session or 'questions' not in request.session:
            logger.error(f"Missing session data: interview_data={('interview_data' in request.session)}, questions={('questions' in request.session)}")
            return JsonResponse({'error': 'No interview data or questions available'}, status=400)
        
        current_index = request.session.get('current_question_index', 0)
        questions = request.session['questions']

        if current_index == 0:
            current_hour = time.localtime().tm_hour
            if 5 <= current_hour < 12:
                greeting = "Good morning"
            elif 12 <= current_hour < 17:
                greeting = "Good afternoon"
            elif 17 <= current_hour < 22:
                greeting = "Good evening"
            else:
                greeting = "Good evening"
            greeting_message = f"{greeting}! Hello, I'm your AI Interviewer. I'll be conducting your interview today. To get started, please tell me a bit about yourself. Let's begin!"
            return JsonResponse({'question': greeting_message, 'current': current_index + 1, 'is_greeting': True})

        if current_index - 1 < len(questions):
            question = questions[current_index - 1]
            response_data = {
                'question': question,
                'current': current_index + 1,
                'is_greeting': False
            }
            return JsonResponse(response_data)
        else:
            return JsonResponse({'redirect': '/feedback/'})

    if request.method == 'POST' and is_ajax:
        user_response = request.POST.get('textAnswer', '').strip()
        audio_file = request.FILES.get('audioAnswer')
        is_timer_triggered = request.POST.get('isTimerTriggered', 'false').lower() == 'true'
        
        logger.info(f"Received user response: {user_response[:100]}..., Audio: {audio_file.name if audio_file else 'None'}, Timer triggered: {is_timer_triggered}")
        
        if not is_timer_triggered and not user_response and not audio_file:
            logger.info("Empty response on manual submission, returning error")
            return JsonResponse({'error': 'Please provide an answer'}, status=400)

        current_index = request.session.get('current_question_index', 0)
        questions = request.session.get('questions', [])
        if current_index >= len(questions) + 1:  # +1 for greeting
            logger.info("No more questions, redirecting to feedback")
            return JsonResponse({'redirect': '/feedback/'})

        question = questions[current_index - 1] if current_index > 0 else "Greeting"

        try:
            feedback = {'feedback': 'No response provided. Score: 0%. Please provide an answer next time.'}
            if user_response or audio_file:
                feedback = evaluate_response(question, user_response, audio_file)
            request.session.setdefault('feedback_data', []).append({
                'question': question,
                'response': user_response,
                'audio': audio_file.name if audio_file else None,
                'feedback': feedback['feedback']
            })
            request.session['current_question_index'] += 1
            logger.info(f"Incremented question index to {request.session['current_question_index']}")
            if request.session['current_question_index'] < 11:  # 10 questions + greeting
                next_question = questions[current_index] if current_index < len(questions) else "No more questions"
                logger.info(f"Returning next question: {next_question[:50]}...")
                return JsonResponse({
                    'question': next_question,
                    'current': request.session['current_question_index'] + 1,
                    'is_greeting': False
                })
            else:
                logger.info("All questions answered, redirecting to feedback")
                return JsonResponse({'redirect': '/feedback/'})
        except Exception as e:
            logger.error(f"Exception in evaluate_response: {str(e)}")
            request.session.setdefault('feedback_data', []).append({
                'question': question,
                'response': user_response,
                'audio': audio_file.name if audio_file else None,
                'feedback': 'Error processing response. Score: 0%. Please try again.'
            })
            request.session['current_question_index'] += 1
            if request.session['current_question_index'] < 11:
                next_question = questions[current_index] if current_index < len(questions) else "No more questions"
                logger.info(f"Returning next question after error: {next_question[:50]}...")
                return JsonResponse({
                    'question': next_question,
                    'current': request.session['current_question_index'] + 1,
                    'is_greeting': False
                })
            else:
                logger.info("All questions answered, redirecting to feedback after error")
                return JsonResponse({'redirect': '/feedback/'})

    return render(request, 'start_interview.html')

def logout_view(request):
    logout(request)
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True, 'redirect': '/landing/'})
    messages.success(request, 'Logged out successfully!')
    return redirect('landing')

def about(request):
    return render(request, 'about.html')

def blog(request):
    return render(request, 'blog.html')

def contact(request):
    return render(request, 'contact.html')

def faq(request):
    return render(request, 'faq.html')

def feedback(request):
    feedback_data = request.session.get('feedback_data', [])
    if not feedback_data:
        feedback_text = "No feedback available. It seems there was an issue during your interview."
    else:
        total_weighted_score = 0
        individual_sum = 0
        valid_scores = 0
        num_questions = len(feedback_data) - 1  # Exclude greeting if present

        for index, item in enumerate(feedback_data):
            if 'feedback' in item:
                score_match = re.search(r'Score:\s*(\d+\.?\d*)\s*%?', item['feedback'], re.IGNORECASE)
                if score_match:
                    score = float(score_match.group(1))
                    individual_sum += score  # For average calculation
                    if index == 0:  # Introduction (greeting)
                        weighted_score = (score / 100) * 5  # 5% weight
                    else:
                        # Redistribute the remaining 95% weight across attempted questions
                        weight_per_question = 95 / max(1, num_questions) if num_questions > 0 else 0
                        weighted_score = (score / 100) * weight_per_question
                    total_weighted_score += weighted_score
                    valid_scores += 1
        
        # Normalize overall score to 100%
        overall_score = round(total_weighted_score if valid_scores > 0 else 0, 1)  # No extra multiplication by 100

        # Calculate average score
        avg_score = round((individual_sum / len(feedback_data)) if feedback_data else 0, 1) if len(feedback_data) > 0 else 0

        feedback_text = f"Overall Performance Score: {overall_score}%\nAverage Question Score: {avg_score}%\n"
        for item in feedback_data:
            feedback_text += f"Question: {item['question']}\nYour Response: {item['response']}\nFeedback: {item['feedback']}\nAudio: {item['audio'] or 'None'}\n\n"
        logger.info(f"Feedback data: {feedback_text}")
    return render(request, 'feedback.html', {'feedback': feedback_text})

def guide(request):
    return render(request, 'guide.html')

def pricing(request):
    return render(request, 'pricing.html')

def privacy(request):
    return render(request, 'privacy.html')

def profile(request):
    return render(request, 'profile.html')

def terms(request):
    return render(request, 'terms.html')

def testimonials(request):
    return render(request, 'testimonials.html')

def signup_view(request):
    if request.user.is_authenticated:
        messages.info(request, 'You are already logged in.')
        return redirect('landing')

    form = SignupForm(request.POST or None)
    if request.method == 'POST':
        if form.is_valid():
            try:
                email = form.cleaned_data['email']
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=form.cleaned_data['password'],
                    first_name=form.cleaned_data['full_name'].split()[0],
                    last_name=' '.join(form.cleaned_data['full_name'].split()[1:]) if len(form.cleaned_data['full_name'].split()) > 1 else ''
                )
                UserProfile.objects.create(
                    user=user,
                    full_name=form.cleaned_data['full_name']
                )
                logger.info(f"User {email} signed up successfully.")
                messages.success(request, 'Signup successful! Please log in.')
                return redirect('login')
            except Exception as e:
                logger.error(f"Error during signup for {email}: {str(e)}")
                messages.error(request, 'An error occurred during signup. Please try again.')
        else:
            logger.debug(f"Signup form errors: {form.errors}")
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, error)
    return render(request, 'signup.html', {'form': form})

def login_view(request):
    if request.user.is_authenticated:
        messages.info(request, 'You are already logged in.')
        return redirect('landing')

    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            logger.info(f"Attempting to authenticate user with email: {email}")
            user = authenticate(request, username=email, email=email, password=password)
            if user is not None:
                login(request, user)
                if not form.cleaned_data['remember_me']:
                    request.session.set_expiry(0)
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    logger.info(f"User {email} logged in successfully via AJAX.")
                    return JsonResponse({'success': True, 'redirect': '/landing/'})
                messages.success(request, 'Login successful!')
                logger.info(f"Successful login for user: {email}")
                return redirect('landing')
            else:
                logger.error(f"Authentication failed for email: {email}")
                error_message = 'Invalid email or password.'
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'error': error_message}, status=400)
                messages.error(request, error_message)
        else:
            logger.debug(f"Form errors: {form.errors}")
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                errors = {field: errors[0].text for field, errors in form.errors.items()}
                return JsonResponse({'error': errors}, status=400)
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, error)
    else:
        form = LoginForm()

    return render(request, 'login.html', {'form': form})

@login_required
def profile_view(request):
    try:
        profile = UserProfile.objects.get(user=request.user)
        if request.method == 'GET':
            # Return initial profile data
            data = {
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'email': request.user.email,
                'phone': profile.phone or '',
                'location': profile.location or '',
                'profession': profile.profession or '',
                'experience': profile.experience or '0-1',
                'bio': profile.bio or '',
                'profile_picture': profile.profile_picture.url if profile.profile_picture else ''
            }
            return JsonResponse(data)

        if request.method == 'POST':
            full_name = request.POST.get('full_name')
            email = request.POST.get('email')
            phone = request.POST.get('phone')
            location = request.POST.get('location')
            profession = request.POST.get('profession')
            experience = request.POST.get('experience')
            bio = request.POST.get('bio')
            errors = {}

            if not full_name or len(full_name.strip()) < 2:
                errors['full_name'] = ['Full name must be at least 2 characters']
            if not email or not re.match(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$', email):
                errors['email'] = ['Please enter a valid email address']
            if User.objects.filter(email=email).exclude(id=request.user.id).exists():
                errors['email'] = ['This email is already in use']
            if phone and not re.match(r'^\+?1?\d{9,15}$', phone):
                errors['phone'] = ['Please enter a valid phone number']
            if experience not in ['0-1', '2-3', '4-5', '6-10', '10+']:
                errors['experience'] = ['Invalid experience level']

            if errors:
                return JsonResponse(errors, status=400)

            request.user.email = email
            request.user.username = email
            request.user.first_name = full_name.split()[0]
            request.user.last_name = ' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else ''
            request.user.save()

            profile.full_name = full_name
            profile.phone = phone
            profile.location = location
            profile.profession = profession
            profile.experience = experience
            profile.bio = bio
            if 'profile_picture' in request.FILES:
                profile_picture = request.FILES['profile_picture']
                fs = FileSystemStorage()
                filename = fs.save(f'profile_pics/{request.user.id}_{profile_picture.name}', profile_picture)
                profile.profile_picture = filename
            profile.save()

            return JsonResponse({'success': True})

        sessions = InterviewSession.objects.filter(user=request.user).order_by('-date')
        return render(request, 'profile.html', {
            'user': request.user,
            'profile': profile,
            'sessions': sessions,
            'errors': {}
        })
    except UserProfile.DoesNotExist:
        logger.error(f"Profile not found for user {request.user.username}")
        return JsonResponse({'error': 'Profile not found'}, status=400)

@login_required
def interview_form_view(request):
    return render(request, 'interview_form.html')

def logout_view(request):
    logout(request)
    if request.method == 'POST' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': True, 'redirect': '/landing/'})
    messages.success(request, 'Logged out successfully!')
    return redirect('landing')

def validate_email(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        try:
            if User.objects.filter(email__iexact=email).exists():
                return JsonResponse({'valid': False, 'error': 'This email has already been used.'})
            domain = email.split('@')[1]
            dns.resolver.resolve(domain, 'MX')
            return JsonResponse({'valid': True})
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            return JsonResponse({'valid': False, 'error': 'This email domain does not exist.'})
        except Exception as e:
            return JsonResponse({'valid': False, 'error': f'Unable to verify email: {str(e)}'})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def contact_form_submission(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            email = data.get('email')
            topic = data.get('topic')
            message = data.get('message')
            privacy = data.get('privacy')

            # Basic validation
            if not all([name, email, topic, message]):
                return JsonResponse({'success': False, 'error': 'All fields are required'}, status=400)
            
            # Optional: Link to authenticated user if available
            user = request.user if request.user.is_authenticated else None

            # Save to database
            contact_message = ContactMessage(
                name=name,
                email=email,
                topic=topic,
                message=message,
                privacy_agreed=privacy,
                user=user
            )
            contact_message.save()

            return JsonResponse({'success': True, 'message': 'Message sent successfully! We’ll get back to you soon.'})
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid data format'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@login_required
def settings_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            profile = UserProfile.objects.get(user=request.user)
            # Example: Store settings in UserProfile (add fields to model if needed)
            if 'notifications' in data:
                profile.email_notifications = data['notifications']
            if 'reminders' in data:
                profile.practice_reminders = data['reminders']
            if 'score-updates' in data:
                profile.score_updates = data['score-updates']
            if 'dark-mode' in data:
                profile.dark_mode = data['dark-mode']
            profile.save()
            return JsonResponse({'success': True})
        except Exception as e:
            logger.error(f"Error updating settings: {str(e)}")
            return JsonResponse({'error': 'Failed to update settings'}, status=400)
    return JsonResponse({'error': 'Invalid request'}, status=400)

# Google OAuth2 callback view
def google_callback(request):
    return complete(request, backend='google-oauth2')