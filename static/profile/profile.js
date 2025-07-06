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
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            const tabId = this.getAttribute('data-tab') + '-tab';
            const tabContent = document.getElementById(tabId);
            if (tabContent) tabContent.classList.add('active');
        });
    });

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

    // Profile photo upload
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const profilePictureUpload = document.getElementById('profilePictureUpload');
    const profileAvatar = document.getElementById('profileAvatar');
    if (changePhotoBtn && profilePictureUpload && profileAvatar) {
        changePhotoBtn.addEventListener('click', function() {
            profilePictureUpload.click();
        });
        profilePictureUpload.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('profile_picture', file);
                try {
                    const response = await fetch('/profile/', {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken,
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: formData
                    });
                    const data = await response.json();
                    if (response.ok) {
                        profileAvatar.src = URL.createObjectURL(file); // Update avatar locally
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

    // Profile Form Save
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append('full_name', `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`);
            formData.append('email', document.getElementById('email').value.trim());
            formData.append('phone', document.getElementById('phone').value.trim());
            formData.append('location', document.getElementById('location').value.trim());
            formData.append('profession', document.getElementById('profession').value.trim());
            formData.append('experience', document.getElementById('experience').value);
            formData.append('bio', document.getElementById('bio').value.trim());

            try {
                const response = await fetch('/profile/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: formData
                });
                const data = await response.json();
                if (response.ok) {
                    // Update sidebar display
                    document.getElementById('profileDisplayName').textContent = `${document.getElementById('firstName').value.trim()} ${document.getElementById('lastName').value.trim()}`;
                    document.getElementById('profileDisplayRole').textContent = document.getElementById('profession').value.trim();
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

    // Profile Form Cancel
    const btnCancel = document.querySelector('.btn-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', function() {
            profileForm.reset();
            showNotification('Profile changes canceled.');
        });
    }

    // Settings toggles
    document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.addEventListener('click', async function() {
            this.classList.toggle('active');
            const setting = this.getAttribute('data-setting');
            try {
                const response = await fetch('/profile/settings/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ [setting]: this.classList.contains('active') })
                });
                if (!response.ok) {
                    this.classList.toggle('active'); // Revert toggle on error
                    showNotification('Failed to update setting.', true);
                }
            } catch (error) {
                console.error('Error:', error);
                this.classList.toggle('active'); // Revert toggle on error
                showNotification('Server error, please try again later.', true);
            }
        });
    });

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
        // Update metrics
        const totalInterviews = sessionsData.length;
        const avgScore = sessionsData.reduce((sum, s) => sum + s.average_score, 0) / totalInterviews || 0;
        document.getElementById('totalInterviews').textContent = totalInterviews;
        document.getElementById('avgScore').textContent = `${Math.round(avgScore)}%`;
        document.getElementById('sidebarTotalInterviews').textContent = totalInterviews;
        document.getElementById('sidebarAvgScore').textContent = `${Math.round(avgScore)}%`;
    }

    // Action buttons
    const manageSubscriptionBtn = document.getElementById('manageSubscriptionBtn');
    if (manageSubscriptionBtn) {
        manageSubscriptionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '{% url "pricing" %}'; // Redirect to pricing page
        });
    }
    const viewBillingBtn = document.getElementById('viewBillingBtn');
    if (viewBillingBtn) {
        viewBillingBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Billing history feature is coming soon!');
        });
    }
    const helpCenterBtn = document.getElementById('helpCenterBtn');
    if (helpCenterBtn) {
        helpCenterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '{% url "faq" %}'; // Redirect to FAQ page
        });
    }
    const contactSupportBtn = document.getElementById('contactSupportBtn');
    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '{% url "contact" %}'; // Redirect to contact page
        });
    }
    const logoutBtn2 = document.getElementById('logoutBtn2');
    if (logoutBtn2) {
        logoutBtn2.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                const response = await fetch('{% url "logout" %}', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                if (response.ok) {
                    window.location.href = '{% url "landing" %}';
                } else {
                    showNotification('Failed to log out.', true);
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Server error, please try again later.', true);
            }
        });
    }

    // Notification function (similar to login.js)
    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : ''} visible`;
        notification.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Initialize profile data
    async function loadProfileData() {
        try {
            const response = await fetch('/profile/', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
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
                document.getElementById('profileDisplayName').textContent = `${data.first_name} ${data.last_name}`.trim();
                document.getElementById('profileDisplayRole').textContent = data.profession || 'User';
                if (data.profile_picture) {
                    profileAvatar.src = data.profile_picture;
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
    loadProfileData();
});



// for notification

const logoutBtn2 = document.getElementById('logoutBtn2');
if (logoutBtn2) {
    logoutBtn2.addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const response = await fetch('/logout/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
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