document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('interviewForm');
    const fileInput = document.getElementById('resume');
    const fileLabel = document.querySelector('.file-input-label span');
    const interviewTypeSelect = document.getElementById('interviewType');

    // Pre-fill interview type from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const interviewType = urlParams.get('interviewType');
    if (interviewType && interviewTypeSelect) {
        interviewTypeSelect.value = interviewType;
    }

    // Handle file input change
    fileInput.addEventListener('change', function () {
        fileLabel.textContent = this.files.length > 0 ? this.files[0].name : 'Choose file';
    });

    // Prevent default form submission and let Django handle it
    form.addEventListener('submit', function (e) {
        const jobRole = document.getElementById('jobRole').value.trim();
        const industry = document.getElementById('industry').value;
        const experienceLevel = document.getElementById('experienceLevel').value;
        const interviewType = document.getElementById('interviewType').value;

        if (!jobRole || !industry || !experienceLevel || !interviewType) {
            e.preventDefault();
            alert('Please fill in all required fields.');
            return;
        }
        // Let the form submit normally to the backend
    });

    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
});