document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            mobileNav.classList.toggle('active');
            mobileMenuBtn.setAttribute('aria-label', isExpanded ? 'Open menu' : 'Close menu');
        });
    }

    // Scroll animations for contact methods and FAQ items
    const elements = document.querySelectorAll('.contact-method, .faq-item');
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.2 }
    );
    elements.forEach((element) => observer.observe(element));

    // FAQ accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach((question) => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isExpanded = faqItem.getAttribute('aria-expanded') === 'true';

            // Close other open FAQs
            faqQuestions.forEach((otherQuestion) => {
                const otherItem = otherQuestion.parentElement;
                if (otherItem !== faqItem && otherItem.getAttribute('aria-expanded') === 'true') {
                    otherItem.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current FAQ
            faqItem.setAttribute('aria-expanded', !isExpanded);
        });
    });

    // Form validation and submission
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let isValid = true;

            // Reset error messages
            document.querySelectorAll('.form-group').forEach((group) => {
                group.classList.remove('error');
            });
            document.querySelectorAll('.error-message').forEach((msg) => {
                msg.textContent = '';
            });

            // Validate name
            const name = document.getElementById('name');
            if (!name.value.trim()) {
                isValid = false;
                name.parentElement.classList.add('error');
                document.getElementById('name-error').textContent = 'Name is required';
            }

            // Validate email
            const email = document.getElementById('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.value.trim()) {
                isValid = false;
                email.parentElement.classList.add('error');
                document.getElementById('email-error').textContent = 'Email is required';
            } else if (!emailRegex.test(email.value)) {
                isValid = false;
                email.parentElement.classList.add('error');
                document.getElementById('email-error').textContent = 'Please enter a valid email';
            }

            // Validate topic
            const topic = document.getElementById('topic');
            if (!topic.value) {
                isValid = false;
                topic.parentElement.classList.add('error');
                document.getElementById('topic-error').textContent = 'Please select a topic';
            }

            // Validate message
            const message = document.getElementById('message');
            if (!message.value.trim()) {
                isValid = false;
                message.parentElement.classList.add('error');
                document.getElementById('message-error').textContent = 'Message is required';
            }

            // Validate privacy checkbox
            const privacy = document.getElementById('privacy');
            if (!privacy.checked) {
                isValid = false;
                privacy.parentElement.classList.add('error');
                document.getElementById('privacy-error').textContent = 'You must agree to the Privacy Policy';
            }

            if (isValid) {
                try {
                    const response = await fetch('/contact/submit/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCookie('csrftoken') // Function to get CSRF token
                        },
                        body: JSON.stringify({
                            name: name.value.trim(),
                            email: email.value.trim(),
                            topic: topic.value,
                            message: message.value.trim(),
                            privacy: privacy.checked
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        formStatus.classList.add('success');
                        formStatus.textContent = result.message;
                        contactForm.reset();
                        setTimeout(() => {
                            formStatus.textContent = '';
                            formStatus.classList.remove('success');
                        }, 5000);
                    } else {
                        formStatus.classList.add('error');
                        formStatus.textContent = result.error || 'An error occurred. Please try again.';
                    }
                } catch (error) {
                    formStatus.classList.add('error');
                    formStatus.textContent = 'An error occurred. Please try again.';
                }
            } else {
                formStatus.classList.add('error');
                formStatus.textContent = 'Please fix the errors above and try again.';
            }
        });
    }

    // Function to get CSRF token from cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});