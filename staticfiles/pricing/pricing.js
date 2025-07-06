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

    // Pricing toggle
    const pricingToggle = document.getElementById('pricingToggle');
    const priceElements = document.querySelectorAll('.plan-price');

    pricingToggle.addEventListener('change', () => {
        priceElements.forEach(element => {
            const monthlyPrice = element.getAttribute('data-monthly');
            const annualPrice = element.getAttribute('data-annually');
            const priceValue = element.querySelector('.price-value');
            priceValue.style.opacity = 0;
            setTimeout(() => {
                priceValue.textContent = pricingToggle.checked ? annualPrice : monthlyPrice;
                priceValue.style.opacity = 1;
            }, 300);
        });
    });

    // Select plan buttons
    const selectButtons = document.querySelectorAll('.btn-select-plan');
    selectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const plan = button.getAttribute('data-plan');
            alert(`Selected ${plan} plan! (This is a simulation)`);
            // Replace with actual checkout redirect in production
        });
    });
});