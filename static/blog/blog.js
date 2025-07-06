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

    // Blog posts data (for filtering)
    const allPosts = [
        {
            id: 'unexpected-questions',
            title: 'How AI Can Help You Prepare for Unexpected Interview Questions',
            excerpt: 'Strategies to handle curveball questions using InterviewAI’s adaptive mock interviews.',
            category: 'technical',
            image: 'images/blog-unexpected.jpg',
            date: 'May 17, 2025',
            readTime: '5 min read',
            featured: true
        },
        {
            id: 'mock-interviews',
            title: 'The Power of Practice: Why Mock Interviews Are a Game-Changer',
            excerpt: 'Explain how InterviewAI’s realistic simulations build confidence and skills.',
            category: 'behavioral',
            image: 'images/blog-practice.jpg',
            date: 'May 15, 2025',
            readTime: '6 min read'
        },
        {
            id: 'competitive-market',
            title: 'How to Stand Out in a Competitive Job Market with AI Tools',
            excerpt: 'Use InterviewAI to refine answers and showcase unique strengths.',
            category: 'career',
            image: 'images/blog-competitive.jpg',
            date: 'May 12, 2025',
            readTime: '5 min read'
        },
        {
            id: 'body-language',
            title: 'Using AI to Improve Your Interview Body Language',
            excerpt: 'How InterviewAI’s video feedback enhances non-verbal skills.',
            category: 'remote',
            image: 'images/blog-bodylanguage.jpg',
            date: 'April 15, 2025',
            readTime: '6 min read',
            featured: true
        }
    ];

    // Search functionality with debounce
    const searchInput = document.getElementById('blogSearch');
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    function filterPosts() {
        const query = searchInput.value.trim().toLowerCase();
        const selectedCategories = Array.from(document.querySelectorAll('.category-btn.active')).map(btn => btn.dataset.category);
        const cards = document.querySelectorAll('.blog-card');

        cards.forEach(card => {
            const title = card.querySelector('.blog-title').textContent.toLowerCase();
            const excerpt = card.querySelector('.blog-excerpt').textContent.toLowerCase();
            const category = card.dataset.category;
            const matchesSearch = !query || title.includes(query) || excerpt.includes(query);
            const matchesCategory = selectedCategories.includes('all') || selectedCategories.includes(category);

            card.classList.toggle('hidden', !(matchesSearch && matchesCategory));
            if (matchesSearch && query) {
                const titleElement = card.querySelector('.blog-title');
                const excerptElement = card.querySelector('.blog-excerpt');
                titleElement.innerHTML = highlightText(titleElement.textContent, query);
                excerptElement.innerHTML = highlightText(excerptElement.textContent, query);
            } else {
                card.querySelector('.blog-title').innerHTML = card.querySelector('.blog-title').textContent;
                card.querySelector('.blog-excerpt').innerHTML = card.querySelector('.blog-excerpt').textContent;
            }
        });
    }

    searchInput.addEventListener('input', debounce(filterPosts, 300));

    // Category filter
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            if (category === 'all') {
                categoryButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.category === 'all');
                    btn.setAttribute('aria-pressed', btn.dataset.category === 'all' ? 'true' : 'false');
                });
            } else {
                const allButton = document.querySelector('.category-btn[data-category="all"]');
                allButton.classList.remove('active');
                allButton.setAttribute('aria-pressed', 'false');
                button.classList.toggle('active');
                button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
                const activeCategories = Array.from(categoryButtons).filter(btn => btn.classList.contains('active')).map(btn => btn.dataset.category);
                if (activeCategories.length === 0) {
                    allButton.classList.add('active');
                    allButton.setAttribute('aria-pressed', 'true');
                }
            }
            filterPosts();
        });
    });

    // Scroll animations
    const cards = document.querySelectorAll('.blog-card');
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.2 }
    );
    cards.forEach(card => observer.observe(card));

    // Tooltip accessibility
    cards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('focus', () => card.classList.add('tooltip-active'));
        card.addEventListener('blur', () => card.classList.remove('tooltip-active'));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.querySelector('.btn-secondary').click();
            }
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Back to top button
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 300);
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
