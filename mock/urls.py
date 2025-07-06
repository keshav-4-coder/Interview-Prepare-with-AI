from django.urls import path
from . import views
# to serve media files during development in profile_views
from django.conf.urls.static import static
from django.conf import settings
from django.urls import include  # Added for social authentication

urlpatterns = [
    path('', views.landing, name='landing'),  # Root URL maps to landing
    path('landing/', views.landing, name='landing'),  # Explicit /landing/ URL
    path('faq/', views.faq, name='faq'),
    path('interview_start/', views.interview_start, name='interview_start'),
    path('interview_form/', views.interview_form, name='interview_form'),
    path('feedback/', views.feedback, name='feedback'),
    path('contact/', views.contact, name='contact'),
    path('guide/', views.guide, name='guide'),
    path('pricing/', views.pricing, name='pricing'),
    path('privacy/', views.privacy, name='privacy'),
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('terms/', views.terms, name='terms'),
    path('testimonials/', views.testimonials, name='testimonials'),
    path('about/', views.about, name='about'),
    path('blog/', views.blog, name='blog'),
    path('profile/', views.profile, name='profile'),
    path('validate-email/', views.validate_email, name='validate_email'),
    path('profile/settings/', views.settings_view, name='settings'),
    path('social/', include('social_django.urls', namespace='social')),  # Added for social authentication
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)