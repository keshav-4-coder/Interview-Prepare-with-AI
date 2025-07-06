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

    const loginForm = document.getElementById('login-form');
    const emailInput = document.querySelector('#id_email');
    const passwordInput = document.querySelector('#id_password');
    const rememberMeInput = document.querySelector('#id_remember_me');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;

        const emailValue = emailInput.value.trim();
        if (!emailValue) {
            emailError.textContent = 'Email is required';
            isValid = false;
        } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(emailValue)) {
            emailError.textContent = 'Please enter a valid email address';
            isValid = false;
        } else {
            emailError.textContent = '';
        }

        const passwordValue = passwordInput.value.trim();
        if (!passwordValue) {
            passwordError.textContent = 'Password is required';
            isValid = false;
        } else if (passwordValue.length < 8) {
            passwordError.textContent = 'Password must be at least 8 characters';
            isValid = false;
        } else {
            passwordError.textContent = '';
        }

        if (isValid) {
            const formData = new FormData(loginForm);
            try {
                const response = await fetch('{% url "login" %}', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: formData
                });

                if (response.ok) {
                    showNotification('Login successful!');
                    setTimeout(() => {
                        window.location.href = '{% url "landing" %}';
                    }, 1000);
                } else {
                    const data = await response.json();
                    if (data.error) {
                        emailError.textContent = data.error;
                        passwordError.textContent = '';
                        showNotification(data.error, true);
                    } else {
                        emailError.textContent = data.email ? data.email : '';
                        passwordError.textContent = data.password ? data.password : '';
                        showNotification('Invalid email or password.', true);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                emailError.textContent = 'Server error, please try again later';
                showNotification('Server error, please try again later', true);
            }
        }
    });

    emailInput.addEventListener('input', () => {
        const emailValue = emailInput.value.trim();
        if (!emailValue) {
            emailError.textContent = 'Email is required';
        } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(emailValue)) {
            emailError.textContent = 'Please enter a valid email address';
        } else {
            emailError.textContent = '';
        }
    });

    passwordInput.addEventListener('input', () => {
        const passwordValue = passwordInput.value.trim();
        if (!passwordValue) {
            passwordError.textContent = 'Password is required';
        } else if (passwordValue.length < 8) {
            passwordError.textContent = 'Password must be at least 8 characters';
        } else {
            passwordError.textContent = '';
        }
    });

    const togglePassword = document.querySelector('.toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('.eye-icon').classList.toggle('visible');
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
});

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    notificationMessage.textContent = message;
    notification.classList.toggle('error', isError);
    notification.classList.add('visible');
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            notification.classList.remove('error');
            notificationMessage.textContent = '';
        }, 500);
    }, 3000);
}