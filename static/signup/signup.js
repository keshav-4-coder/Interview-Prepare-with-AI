document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('current-year').textContent = new Date().getFullYear();

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            mobileNav.classList.toggle('active');
        });
    }

    const signupForm = document.getElementById('signup-form');
    const fullNameInput = document.querySelector('#id_full_name');
    const emailInput = document.querySelector('#id_email');
    const passwordInput = document.querySelector('#id_password');
    const agreeToTermsInput = document.querySelector('#id_agree_to_terms');
    const signupButton = document.getElementById('signupButton');
    const fullNameError = document.getElementById('fullName-error');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const termsError = document.getElementById('terms-error');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');

    const calculatePasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score += 25;
        if (/[A-Z]/.test(password)) score += 25;
        if (/[0-9]/.test(password)) score += 25;
        if (/[^A-Za-z0-9]/.test(password)) score += 25;

        if (score <= 25) {
            strengthFill.style.width = '25%';
            strengthFill.style.backgroundColor = '#ef4444';
            strengthText.textContent = 'Password strength: Too weak';
            return 'weak';
        } else if (score <= 50) {
            strengthFill.style.width = '50%';
            strengthFill.style.backgroundColor = '#f59e0b';
            strengthText.textContent = 'Password strength: Weak';
            return 'weak';
        } else if (score <= 75) {
            strengthFill.style.width = '75%';
            strengthFill.style.backgroundColor = '#f59e0b';
            strengthText.textContent = 'Password strength: Medium';
            return 'medium';
        } else {
            strengthFill.style.width = '100%';
            strengthFill.style.backgroundColor = '#10b981';
            strengthText.textContent = 'Password strength: Strong';
            return 'strong';
        }
    };

    const updateSignupButton = async () => {
        const fullNameValid = fullNameInput.value.trim().length >= 2;
        const emailValue = emailInput.value.trim();
        let emailValid = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(emailValue);
        
        if (emailValid) {
            try {
                const response = await fetch('/validate-email/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: `email=${encodeURIComponent(emailValue)}`
                });
                const data = await response.json();
                emailValid = data.valid;
                if (!data.valid) {
                    emailError.textContent = data.error || 'This email has already been used.';
                } else {
                    emailError.textContent = '';
                }
            } catch (error) {
                console.error('Error checking email:', error);
                emailValid = false;
                emailError.textContent = 'Unable to verify email availability.';
            }
        }

        const passwordStrength = calculatePasswordStrength(passwordInput.value);
        const termsChecked = agreeToTermsInput.checked;

        signupButton.disabled = !(fullNameValid && emailValid && passwordStrength !== 'weak' && termsChecked);
    };

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;

        const fullNameValue = fullNameInput.value.trim();
        if (!fullNameValue) {
            fullNameError.textContent = 'Full name is required';
            isValid = false;
        } else if (fullNameValue.length < 2) {
            fullNameError.textContent = 'Full name must be at least 2 characters';
            isValid = false;
        } else {
            fullNameError.textContent = '';
        }

        const emailValue = emailInput.value.trim();
        if (!emailValue) {
            emailError.textContent = 'Email is required';
            isValid = false;
        } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(emailValue)) {
            emailError.textContent = 'Please enter a valid email address';
            isValid = false;
        } else {
            try {
                const response = await fetch('/validate-email/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: `email=${encodeURIComponent(emailValue)}`
                });
                const data = await response.json();
                if (!data.valid) {
                    emailError.textContent = data.error || 'This email has already been used.';
                    isValid = false;
                } else {
                    emailError.textContent = '';
                }
            } catch (error) {
                console.error('Error validating email:', error);
                emailError.textContent = 'Unable to verify email availability.';
                isValid = false;
            }
        }

        const passwordValue = passwordInput.value.trim();
        if (!passwordValue) {
            passwordError.textContent = 'Password is required';
            isValid = false;
        } else if (passwordValue.length < 8) {
            passwordError.textContent = 'Password must be at least 8 characters';
            isValid = false;
        } else if (calculatePasswordStrength(passwordValue) === 'weak') {
            passwordError.textContent = 'Password is too weak';
            isValid = false;
        } else {
            passwordError.textContent = '';
        }

        if (!agreeToTermsInput.checked) {
            termsError.textContent = 'You must agree to the terms';
            isValid = false;
        } else {
            termsError.textContent = '';
        }

        if (isValid) {
            const formData = new FormData(signupForm);
            try {
                const response = await fetch('/signup/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: formData
                });

                if (response.ok) {
                    showNotification('Signup successful! Redirecting to login...');
                    setTimeout(() => {
                        window.location.href = '/login/';
                    }, 1000);
                } else {
                    const data = await response.json();
                    if (data.errors) {
                        if (data.errors.full_name) fullNameError.textContent = data.errors.full_name[0];
                        if (data.errors.email) emailError.textContent = data.errors.email[0];
                        if (data.errors.password) passwordError.textContent = data.errors.password[0];
                        if (data.errors.agree_to_terms) termsError.textContent = data.errors.agree_to_terms[0];
                        showNotification('Please correct the errors in the form.', true);
                    } else {
                        emailError.textContent = 'An error occurred during signup.';
                        showNotification('An error occurred during signup.', true);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                emailError.textContent = 'Server error, please try again later';
                showNotification('Server error, please try again later', true);
            }
        }
    });

    fullNameInput.addEventListener('input', () => {
        const fullNameValue = fullNameInput.value.trim();
        if (!fullNameValue) {
            fullNameError.textContent = 'Full name is required';
        } else if (fullNameValue.length < 2) {
            fullNameError.textContent = 'Full name must be at least 2 characters';
        } else {
            fullNameError.textContent = '';
        }
        updateSignupButton();
    });

    emailInput.addEventListener('input', async () => {
        const emailValue = emailInput.value.trim();
        if (!emailValue) {
            emailError.textContent = 'Email is required';
        } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(emailValue)) {
            emailError.textContent = 'Please enter a valid email address';
        } else {
            try {
                const response = await fetch('/validate-email/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: `email=${encodeURIComponent(emailValue)}`
                });
                const data = await response.json();
                if (data.valid) {
                    emailError.textContent = '';
                } else {
                    emailError.textContent = data.error || 'This email has already been used.';
                }
            } catch (error) {
                console.error('Error validating email:', error);
                emailError.textContent = 'Unable to verify email availability.';
            }
        }
        updateSignupButton();
    });

    passwordInput.addEventListener('input', () => {
        const passwordValue = passwordInput.value.trim();
        if (!passwordValue) {
            passwordError.textContent = 'Password is required';
        } else if (passwordValue.length < 8) {
            passwordError.textContent = 'Password must be at least 8 characters';
        } else {
            calculatePasswordStrength(passwordValue);
            passwordError.textContent = '';
        }
        updateSignupButton();
    });

    agreeToTermsInput.addEventListener('change', () => {
        if (!agreeToTermsInput.checked) {
            termsError.textContent = 'You must agree to the terms';
        } else {
            termsError.textContent = '';
        }
        updateSignupButton();
    });

    const togglePassword = document.querySelector('.toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const eyeIcon = togglePassword.querySelector('.eye-icon');
            if (eyeIcon) {
                eyeIcon.classList.toggle('visible');
            }
        });
    }

    const messages = document.querySelectorAll('.messages .alert');
    if (messages.length > 0) {
        messages.forEach(message => {
            const messageText = message.textContent.trim();
            const isError = message.classList.contains('alert-error');
            showNotification(messageText, isError);
            message.remove();
        });
    }



    }
});

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    if (!notification || !notificationMessage) return;

    notificationMessage.textContent = message;
    notification.classList.toggle('error', isError);
    notification.classList.remove('hidden');
    notification.classList.add('visible');
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            notification.classList.add('hidden');
            notification.classList.remove('error');
            notificationMessage.textContent = '';
        }, 300); // Match CSS transition duration
    }, 3000);
}