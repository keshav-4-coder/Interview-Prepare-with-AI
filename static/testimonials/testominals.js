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

    // Scroll animations for testimonial cards
    const cards = document.querySelectorAll('.testimonial-card');
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
    cards.forEach((card) => observer.observe(card));

    // Testimonial carousel
    const carouselTrack = document.querySelector('.carousel-track');
    const cardsList = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    let currentIndex = 0;
    const totalCards = cardsList.length;
    let autoRotate = setInterval(nextSlide, 5000);

    function updateCarousel() {
        const offset = -currentIndex * 100;
        carouselTrack.style.transform = `translateX(${offset}%)`;
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalCards;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalCards) % totalCards;
        updateCarousel();
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoRotate();
        });

        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoRotate();
        });

        // Pause auto-rotation on hover
        carouselTrack.addEventListener('mouseenter', () => {
            clearInterval(autoRotate);
        });

        carouselTrack.addEventListener('mouseleave', () => {
            autoRotate = setInterval(nextSlide, 5000);
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                nextSlide();
                resetAutoRotate();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
                resetAutoRotate();
            }
        });
    }

    function resetAutoRotate() {
        clearInterval(autoRotate);
        autoRotate = setInterval(nextSlide, 5000);
    }
});