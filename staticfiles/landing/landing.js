document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
        mobileNav.classList.toggle('active');
    });

    // Scroll animations for cards and steps
    const elements = document.querySelectorAll('.feature-card, .interview-card, .step, .testimonial-card');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(element => observer.observe(element)); 


    // Show notifications from messages in popup

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