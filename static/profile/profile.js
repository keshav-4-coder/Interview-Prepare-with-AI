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
        });
    }

    // Get CSRF token
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
    const csrftoken = getCookie('csrftoken');

    // Sidebar tab switching
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            const tabId = item.getAttribute('data-tab') + '-tab';
            const tabContent = document.getElementById(tabId);
            if (tabContent) tabContent.classList.add('active');
        });
    });

    // Profile photo upload
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const profilePictureUpload = document.getElementById('profilePictureUpload');
    const profileAvatar = document.getElementById('profileAvatar');
    if (changePhotoBtn && profilePictureUpload && profileAvatar) {
        changePhotoBtn.addEventListener('click', () => {
            profilePictureUpload.click();
        });
        profilePictureUpload.addEventListener('change', async e => {
            const file = e.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('profile_picture', file);
                try {
                    const response = await fetch('/profile/', {
                        method: 'POST',
                        headers: { 'X-CSRFToken': csrftoken, 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData
                    });
                    const data = await response.json();
                    if (response.ok) {
                        profileAvatar.src = URL.createObjectURL(file);
                        showNotification('Profile picture updated successfully!');
                    } else {
                        showNotification(data.error || 'Failed to update profile picture.', true);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showNotification('Server error, please try again later.', true);
                }
            }
        });
    }

    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async e => {
            e.preventDefault();
            document.querySelectorAll('.error-message').forEach(span => span.remove());
            const formData = new FormData();
            formData.append('first_name', document.getElementById('firstName').value.trim());
            formData.append('last_name', document.getElementById('lastName').value.trim());
            formData.append('email', document.getElementById('email').value.trim());
            formData.append('phone', document.getElementById('phone').value.trim());
            formData.append('location', document.getElementById('location').value.trim());
            formData.append('profession', document.getElementById('profession').value.trim());
            formData.append('experience', document.getElementById('experience').value);
            formData.append('bio', document.getElementById('bio').value.trim());

            try {
                const response = await fetch('/profile/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken, 'X-Requested-With': 'XMLHttpRequest' },
                    body: formData
                });
                const data = await response.json();
                if (response.ok) {
                    document.getElementById('profileDisplayName').textContent = `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`.trim();
                    document.getElementById('profileDisplayRole').textContent = document.getElementById('profession').value.trim() || 'User';
                    showNotification('Profile updated successfully!');
                } else {
                    Object.keys(data).forEach(field => {
                        const input = document.getElementById(field);
                        if (input) {
                            const errorSpan = document.createElement('span');
                            errorSpan.className = 'error-message';
                            errorSpan.textContent = data[field][0];
                            input.parentElement.appendChild(errorSpan);
                            setTimeout(() => errorSpan.remove(), 3000);
                        }
                    });
                    showNotification('Please correct the errors in the form.', true);
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Server error, please try again later.', true);
            }
        });
    }

    // Profile form cancel
    const btnCancel = document.querySelector('.btn-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            profileForm.reset();
            loadProfileData();
            showNotification('Profile changes canceled.');
        });
    }

    // Settings toggles
    document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.addEventListener('click', async () => {
            const isActive = toggle.classList.contains('active');
            toggle.classList.toggle('active');
            const setting = toggle.getAttribute('data-setting');
            try {
                const response = await fetch('/profile/settings/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ [setting]: toggle.classList.contains('active') })
                });
                if (!response.ok) {
                    toggle.classList.toggle('active');
                    showNotification('Failed to update setting.', true);
                }
            } catch (error) {
                console.error('Error:', error);
                toggle.classList.toggle('active');
                showNotification('Server error, please try again later.', true);
            }
        });
    });

    // Language and timezone settings
    const languageSelect = document.getElementById('language');
    const timezoneSelect = document.getElementById('timezone');
    if (languageSelect) {
        languageSelect.addEventListener('change', async () => {
            try {
                const response = await fetch('/profile/settings/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ language: languageSelect.value })
                });
                if (response.ok) {
                    showNotification('Language updated successfully!');
                } else {
                    showNotification('Failed to update language.', true);
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Server error, please try again later.', true);
            }
        });
    }
    if (timezoneSelect) {
        timezoneSelect.addEventListener('change', async () => {
            try {
                const response = await fetch('/profile/settings/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ timezone: timezoneSelect.value })
                });
                if (response.ok) {
                    showNotification('Timezone updated successfully!');
                } else {
                    showNotification('Failed to update timezone.', true);
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Server error, please try again later.', true);
            }
        });
    }

    // Dynamic scores list
    const sessionsData = window.sessionsData || [];
    function getGradeClass(score) {
        if (score >= 80) return 'grade-excellent';
        if (score >= 70) return 'grade-good';
        if (score >= 60) return 'grade-average';
        return 'grade-poor';
    }
    const scoresList = document.getElementById('scoresList');
    if (scoresList && sessionsData.length) {
        scoresList.innerHTML = '';
        sessionsData.forEach(s => {
            const div = document.createElement('div');
            div.className = 'score-item';
            div.innerHTML = `
                <div class="score-info">
                    <div class="score-type">${s.interview_type}</div>
                    <div class="score-meta">${s.date}</div>
                </div>
                <div class="score-result">
                    <div class="score-value">${s.overall_score}%</div>
                    <div class="score-grade ${getGradeClass(s.overall_score)}">${s.overall_score >= 80 ? 'Excellent' : s.overall_score >= 70 ? 'Good' : s.overall_score >= 60 ? 'Average' : 'Poor'}</div>
                </div>
            `;
            scoresList.appendChild(div);
        });
        const totalInterviews = sessionsData.length;
        const avgScore = sessionsData.reduce((sum, s) => sum + (s.overall_score || 0), 0) / totalInterviews || 0;
        document.getElementById('totalInterviews').textContent = totalInterviews;
        document.getElementById('avgScore').textContent = `${Math.round(avgScore)}%`;
        document.getElementById('sidebarTotalInterviews').textContent = totalInterviews;
        document.getElementById('sidebarAvgScore').textContent = `${Math.round(avgScore)}%`;
        document.getElementById('progressValue').textContent = `${Math.round(avgScore)}% Improvement`;
        document.getElementById('progressFill').style.width = `${Math.round(avgScore)}%`;
    }

    // Action buttons
    const manageSubscriptionBtn = document.querySelector('.settings-group a[href*="/pricing/"]');
    if (manageSubscriptionBtn) {
        manageSubscriptionBtn.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = '/pricing/';
        });
    }
    const viewBillingBtn = document.querySelector('.settings-group a[href="#"]');
    if (viewBillingBtn) {
        viewBillingBtn.addEventListener('click', e => {
            e.preventDefault();
            showNotification('Billing history feature is coming soon!');
        });
    }
    const helpCenterBtn = document.querySelector('.settings-group a[href*="/faq/"]');
    if (helpCenterBtn) {
        helpCenterBtn.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = '/faq/';
        });
    }
    const contactSupportBtn = document.querySelector('.settings-group a[href*="/contact/"]');
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = '/contact/';
        });
    }
    const logoutBtn = document.querySelector('.settings-group a[href*="/logout/"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async e => {
            e.preventDefault();
            try {
                const response = await fetch('/logout/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken, 'X-Requested-With': 'XMLHttpRequest' }
                });
                if (response.ok) {
                    showNotification('Logged out successfully!');
                    setTimeout(() => {
                        window.location.href = '/landing/';
                    }, 1000);
                } else {
                    showNotification('Failed to log out.', true);
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Server error, please try again later.', true);
            }
        });
    }

    // Notification function from landing page
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
            }, 300);
        }, 3000);
    }

    // Handle Django messages
    const messages = document.querySelectorAll('.messages .alert');
    if (messages.length > 0) {
        messages.forEach(message => {
            const messageText = message.textContent.trim();
            const isError = message.classList.contains('alert-error');
            showNotification(messageText, isError);
            message.remove();
        });
    }

    // Initialize profile data
    async function loadProfileData() {
        try {
            const response = await fetch('/profile/', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (response.ok) {
                const data = await response.json();
                document.getElementById('firstName').value = data.first_name || '';
                document.getElementById('lastName').value = data.last_name || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('phone').value = data.phone || '';
                document.getElementById('location').value = data.location || '';
                document.getElementById('profession').value = data.profession || '';
                document.getElementById('experience').value = data.experience || '0-1';
                document.getElementById('bio').value = data.bio || '';
                document.getElementById('profileDisplayName').textContent = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User';
                document.getElementById('profileDisplayRole').textContent = data.profession || 'User';
                document.getElementById('currentPlan').textContent = data.plan || 'Free Plan';
                if (data.profile_picture) {
                    profileAvatar.src = data.profile_picture;
                }
                if (data.settings) {
                    document.querySelectorAll('.toggle').forEach(toggle => {
                        const setting = toggle.getAttribute('data-setting');
                        if (data.settings[setting]) {
                            toggle.classList.add('active');
                        } else {
                            toggle.classList.remove('active');
                        }
                    });
                    if (data.settings.language) {
                        document.getElementById('language').value = data.settings.language;
                    }
                    if (data.settings.timezone) {
                        document.getElementById('timezone').value = data.settings.timezone;
                    }
                }
            } else {
                showNotification('Failed to load profile data.', true);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showNotification('Server error, please try again later.', true);
        }
    }
    loadProfileData();
});
