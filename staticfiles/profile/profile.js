document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    const profilePictureInput = document.getElementById('profilePicture');
    const profileImage = document.getElementById('profileImage');
    const navProfileImage = document.getElementById('navProfileImage');
    const mobileNavProfileImage = document.getElementById('mobileNavProfileImage');
    const uploadPictureBtn = document.getElementById('uploadPictureBtn');
    const changePictureBtn = document.getElementById('changePictureBtn');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const currentYear = document.getElementById('current-year');
    const notificationsCheckbox = document.getElementById('notifications');
    const darkModeCheckbox = document.getElementById('darkMode');
    const currentPlanSpan = document.getElementById('current-plan');
    const logoutBtn = document.getElementById('logoutBtn');

    let isDefaultImage = true;

    // Set current year
    currentYear.textContent = new Date().getFullYear();

    // Check for JWT token
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
        window.location.href = '/login/';
    }

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
        mobileNav.classList.toggle('active');
    });

    // Fetch user data
    async function fetchUserData() {
        try {
            const response = await fetch('/api/profile/', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 401) {
                window.location.href = '/login/';
                return;
            }
            const data = await response.json();
            document.getElementById('name').value = data.full_name || '';
            document.getElementById('email').value = data.email || '';
            notificationsCheckbox.checked = data.notifications_enabled || false;
            darkModeCheckbox.checked = data.dark_mode || false;
            currentPlanSpan.textContent = data.plan || 'Free Plan';
            if (data.profile_picture) {
                const imageUrl = data.profile_picture;
                profileImage.src = imageUrl;
                navProfileImage.src = imageUrl;
                mobileNavProfileImage.src = imageUrl;
                isDefaultImage = false;
                uploadPictureBtn.style.display = 'none';
                changePictureBtn.style.display = 'inline-flex';
            }
            if (data.dark_mode) {
                document.body.classList.add('dark-mode');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            window.location.href = '/login/';
        }
    }

    fetchUserData();

    // Profile picture preview
    profilePictureInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target.result;
                profileImage.src = imageUrl;
                navProfileImage.src = imageUrl;
                mobileNavProfileImage.src = imageUrl;
                isDefaultImage = false;
                uploadPictureBtn.style.display = 'none';
                changePictureBtn.style.display = 'inline-flex';
            };
            reader.readAsDataURL(file);
        }
    });

    // Trigger file input
    profileImage.addEventListener('click', () => {
        profilePictureInput.click();
    });

    uploadPictureBtn.addEventListener('click', () => {
        profilePictureInput.click();
    });

    changePictureBtn.addEventListener('click', () => {
        profilePictureInput.click();
    });

    // Form submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const nameError = document.getElementById('name-error');
        const emailError = document.getElementById('email-error');

        let isValid = true;

        // Client-side validation
        const fullName = nameInput.value.trim();
        if (!fullName) {
            nameError.textContent = 'Full name is required';
            isValid = false;
        } else if (fullName.length < 2) {
            nameError.textContent = 'Full name must be at least 2 characters';
            isValid = false;
        } else {
            nameError.textContent = '';
        }

        const email = emailInput.value.trim();
        if (!email) {
            emailError.textContent = 'Email is required';
            isValid = false;
        } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            emailError.textContent = 'Please enter a valid email address';
            isValid = false;
        } else {
            emailError.textContent = '';
        }

        if (isValid) {
            const formData = new FormData();
            formData.append('full_name', fullName);
            formData.append('email', email);
            if (profilePictureInput.files[0]) {
                formData.append('profile_picture', profilePictureInput.files[0]);
            }

            try {
                const response = await fetch('/api/profile/', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: formData
                });

                if (response.status === 401) {
                    window.location.href = '/login/';
                    return;
                }

                const data = await response.json();
                if (response.ok) {
                    alert('Profile updated successfully!');
                    profilePictureInput.value = ''; // Clear file input
                    fetchUserData(); // Refresh data
                } else {
                    if (data.full_name) nameError.textContent = data.full_name[0];
                    if (data.email) emailError.textContent = data.email[0];
                    if (data.profile_picture) alert('Profile picture error: ' + data.profile_picture[0]);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Server error, please try again later');
            }
        }
    });

    // Settings handlers
    notificationsCheckbox.addEventListener('change', async () => {
        try {
            const response = await fetch('/api/profile/settings/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify({ notifications_enabled: notificationsCheckbox.checked })
            });
            if (response.status === 401) {
                window.location.href = '/login/';
            } else if (!response.ok) {
                console.error('Error updating notifications');
                notificationsCheckbox.checked = !notificationsCheckbox.checked;
            }
        } catch (error) {
            console.error('Error:', error);
            notificationsCheckbox.checked = !notificationsCheckbox.checked;
        }
    });

    darkModeCheckbox.addEventListener('change', async () => {
        document.body.classList.toggle('dark-mode');
        try {
            const response = await fetch('/api/profile/settings/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify({ dark_mode: darkModeCheckbox.checked })
            });
            if (response.status === 401) {
                window.location.href = '/login/';
            } else if (!response.ok) {
                console.error('Error updating dark mode');
                document.body.classList.toggle('dark-mode');
                darkModeCheckbox.checked = !darkModeCheckbox.checked;
            }
        } catch (error) {
            console.error('Error:', error);
            document.body.classList.toggle('dark-mode');
            darkModeCheckbox.checked = !darkModeCheckbox.checked;
        }
    });

    // Logout handler
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/logout/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('refresh_token');
        window.location.href = '/login/';
    });
});