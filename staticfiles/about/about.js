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

    // Stats counter animation
    const stats = document.querySelectorAll('.stat-number');
    const animateStats = () => {
        stats.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            let current = 0;
            const increment = target / 100;
            const updateCount = () => {
                current += increment;
                stat.textContent = Math.ceil(current);
                if (current < target) {
                    requestAnimationFrame(updateCount);
                } else {
                    stat.textContent = target.toLocaleString();
                    if (target === 85) stat.textContent += '%';
                }
            };
            updateCount();
        });
    };

    // Scroll animations for sections
    const sections = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.setAttribute('data-animate', 'visible');
                if (entry.target.classList.contains('stats-section')) {
                    animateStats();
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    sections.forEach(section => observer.observe(section));

    // Accordion functionality for project section
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const accordionItem = header.parentElement;
            const accordionContent = header.nextElementSibling;
            const isActive = accordionContent.classList.contains('active');

            // Close all other accordion items
            document.querySelectorAll('.accordion-content').forEach(content => {
                content.classList.remove('active');
                content.previousElementSibling.classList.remove('active');
            });

            // Toggle current accordion item
            if (!isActive) {
                accordionContent.classList.add('active');
                header.classList.add('active');
            }
        });
    });
});