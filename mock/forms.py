from django import forms
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import UserProfile
import re

# for email domain validation
import dns.resolver




class SignupForm(forms.Form):
    full_name = forms.CharField(
        max_length=255,
        required=True,
        widget=forms.TextInput(attrs={
            'placeholder': 'John Doe',
            'class': 'input-with-icon',
        }),
    )
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'placeholder': 'you@example.com',
            'class': 'input-with-icon',
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder': '••••••••',
            'class': 'input-with-icon'
        }),
        required=True
    )
    agree_to_terms = forms.BooleanField(
        required=True,
        error_messages={'required': 'You must agree to the Terms of Service and Privacy Policy.'}
    )

    def clean_full_name(self):
        full_name = self.cleaned_data.get('full_name').strip()
        if len(full_name) < 2:
            raise ValidationError("Full name must be at least 2 characters.")
        return full_name

    def clean_email(self):
        email = self.cleaned_data.get('email').strip()
        if User.objects.filter(email__iexact=email).exists():
            raise ValidationError("This email has already been used. Please use a different email or log in.")
        try:
            domain = email.split('@')[1]
            dns.resolver.resolve(domain, 'MX')
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            raise ValidationError("This email domain does not exist. Please use a valid email address.")
        except Exception:
            raise ValidationError("Unable to verify email domain. Please try again later.")
        return email

    def clean_password(self):
        password = self.cleaned_data.get('password')
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[0-9]', password):
            raise ValidationError("Password must contain at least one number.")
        if not re.search(r'[^A-Za-z0-9]', password):
            raise ValidationError("Password must contain at least one special character.")
        return password
    

class LoginForm(forms.Form):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={'placeholder': 'you@example.com', 'class': 'input-with-icon'})
    )
    password = forms.CharField(
        required=True,
        widget=forms.PasswordInput(attrs={'placeholder': '••••••••', 'class': 'input-with-icon'})
    )
    remember_me = forms.BooleanField(
        required=False,
        widget=forms.CheckboxInput()
    )

    def clean_email(self):
        email = self.cleaned_data.get('email').strip()
        if not User.objects.filter(email__iexact=email).exists():
            raise ValidationError("This email does not exist. Please sign up or use a different email.")
        return email
    