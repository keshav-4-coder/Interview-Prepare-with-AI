document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            tabPanels.forEach(panel => panel.classList.remove('active'));

            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            const panelId = button.getAttribute('aria-controls');
            document.getElementById(panelId).classList.add('active');
        });
    });

    // FAQ accordion
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';
            question.setAttribute('aria-expanded', !isExpanded);
            const answer = question.nextElementSibling;
            answer.classList.toggle('active');
        });
    });

    // Video modal
    const modal = document.getElementById('video-modal');
    const closeModal = document.getElementById('close-modal');
    const youtubeEmbed = document.getElementById('youtube-embed');

    function openModal(videoId) {
        youtubeEmbed.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModalFunc() {
        modal.classList.remove('active');
        youtubeEmbed.src = '';
        document.body.style.overflow = '';
    }

    closeModal.addEventListener('click', closeModalFunc);
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModalFunc();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModalFunc();
    });

    // Example: Add video trigger (replace with actual video links in HTML)
    // document.querySelectorAll('.video-trigger').forEach(trigger => {
    //     trigger.addEventListener('click', () => openModal(trigger.dataset.videoId));
    // });

    // Scroll animations for guide steps
    const steps = document.querySelectorAll('.guide-step');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    steps.forEach(step => observer.observe(step));

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
        mobileNav.classList.toggle('active');
    });
});