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
    
    // Accordion functionality
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const isExpanded = header.getAttribute('aria-expanded') === 'true';
            const content = header.nextElementSibling;
            
            // Close all other accordions
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== header) {
                    otherHeader.setAttribute('aria-expanded', 'false');
                    const otherContent = otherHeader.nextElementSibling;
                    otherContent.style.maxHeight = null;
                    otherContent.style.paddingTop = '0';
                    otherContent.style.paddingBottom = '0';
                }
            });
            
            // Toggle current accordion
            header.setAttribute('aria-expanded', !isExpanded);
            
            if (!isExpanded) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.paddingTop = '1rem';
                content.style.paddingBottom = '1rem';
            } else {
                content.style.maxHeight = null;
                content.style.paddingTop = '0';
                content.style.paddingBottom = '0';
            }
        });
    });
    
    // FAQ filter functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    // Initialize all items as visible
    accordionItems.forEach(item => {
        item.classList.add('visible');
        item.classList.remove('hidden');
    });
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter').toLowerCase();
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Reset all accordions to closed state
            accordionHeaders.forEach(header => {
                header.setAttribute('aria-expanded', 'false');
                const content = header.nextElementSibling;
                content.style.maxHeight = null;
                content.style.paddingTop = '0';
                content.style.paddingBottom = '0';
            });
            
            // Filter FAQs with animation
            accordionItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category').toLowerCase();
                
                if (filter === 'all' || itemCategory === filter) {
                    item.classList.remove('hidden');
                    // Use setTimeout to ensure CSS transitions work properly
                    setTimeout(() => {
                        item.classList.add('visible');
                    }, 10);
                } else {
                    item.classList.remove('visible');
                    // Wait for the fade-out animation to complete before hiding
                    setTimeout(() => {
                        item.classList.add('hidden');
                    }, 500); // Match this with your CSS transition duration
                }
            });
        });
    });
    
    // Apply initial animations with slight delay for each item
    accordionItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('visible');
        }, index * 100); // Stagger the animations
    });
});