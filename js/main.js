document.addEventListener('DOMContentLoaded', () => {
    initializeAllComponents();
});

function initializeAllComponents() {
    // ... other initializations
    initializeSketchCheckbox();
    // Core UI Components
    initializeCounters();
    initializeGlideCarousel();
    initializePortfolioAnimations();
    
    // Service Components
    initializeWebsiteDesignNavigation();
    initializeServiceGridInteractions();
    initializeServiceButtons();
    
    // Third-party Integrations
    initializeJuxtaposeSliders();

    // Initialize Logo Navigation
    initializeLogoNavigation(); 
}

function initializeLogoNavigation() {
    // Get references to the sections and buttons
    const logoDesignSection = document.getElementById('logo-design');
    const logoRedesignSection = document.getElementById('logo-redesign');
    const nextButton = logoDesignSection.querySelector('.next-button');
    const backButton = logoRedesignSection.querySelector('.back-button');

    // Show Logo Redesign on Next Button Click
    nextButton.addEventListener('click', () => {
        logoDesignSection.style.display = 'none';
        logoRedesignSection.style.display = 'block'; 
    });

    // Show Logo Design on Back Button Click
    backButton.addEventListener('click', () => {
        logoRedesignSection.style.display = 'none'; 
        logoDesignSection.style.display = 'block'; 
    });
}

function initializeCounters() {
    const counters = document.querySelectorAll('.count');
    const counterSection = document.querySelector('.counter');
    
    if (!counterSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumberCounters(counters);
                observer.unobserve(counterSection);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(counterSection);
}

function animateNumberCounters(counters) {
    counters.forEach(counter => {
        const target = +counter.dataset.target;
        const duration = 2000; // Animation duration in milliseconds
        let current = 0;
        const increment = target / (duration / 16); 

        const update = () => {
            current += increment;

            // Stop the animation when the target is reached
            if (current < target) {
                counter.textContent = Math.ceil(current);
                requestAnimationFrame(update);
            } else {
                counter.textContent = getSuffix(target); 
            }
        };

        update();
    });
}

function getSuffix(target) {
    const suffixes = {
        100: '5k',
        99: '80k',
        97: '100k',
        90: '200k',
    };

    // Return the suffix based on the target value
    return suffixes[target] || `${target}k+`; 
}

// Initialize the counters when the page loads
document.addEventListener('DOMContentLoaded', initializeCounters);
function initializeGlideCarousel() {
    loadGlideDependencies().then(() => {
        new Glide('.glide', {
            type: 'carousel',
            startAt: 0,
            perView: 4,
            gap: 20,
            autoplay: 3000,
            breakpoints: {
                768: { perView: 2 },
                992: { perView: 3 },
                1200: { perView: 4 }
            }
        }).mount();
    });
}

function loadGlideDependencies() {
    return new Promise((resolve) => {
        const glideCSS = document.createElement('link');
        glideCSS.rel = 'stylesheet';
        glideCSS.href = 'https://cdn.jsdelivr.net/npm/@glidejs/glide@3.4.1/dist/css/glide.core.min.css';
        document.head.appendChild(glideCSS);

        const glideJS = document.createElement('script');
        glideJS.src = 'https://cdn.jsdelivr.net/npm/@glidejs/glide@3.4.1/dist/glide.min.js';
        glideJS.onload = resolve;
        document.body.appendChild(glideJS);
    });
}

function initializeWebsiteDesignNavigation() {
    const designSection = document.querySelector('.grid-item[style*="background-color: #6610f2;"]');
    if (!designSection) return;

    const pages = designSection.querySelectorAll('.website-page');
    const [nextBtn, backBtn] = ['next-button', 'back-button'].map(s => designSection.querySelector(`.${s}`));
    const pageIndicator = designSection.querySelector('.page-indicator');

    let currentPage = 0;
    const totalPages = pages.length;

    const updateNavigation = () => {
        currentPage = (currentPage + totalPages) % totalPages; 
        pages.forEach((page, i) => page.style.display = i === currentPage ? 'block' : 'none');
        pageIndicator.textContent = `${currentPage + 1}/${totalPages}`;
    };

    nextBtn.addEventListener('click', () => { currentPage++; updateNavigation() });
    backBtn.addEventListener('click', () => { currentPage--; updateNavigation() });
    updateNavigation();
}

function initializeServiceGridInteractions() {
    document.querySelectorAll('.grid-item:not(.image-block)').forEach(item => {
        item.addEventListener('click', function() {
            // Close all other expanded items
            document.querySelectorAll('.grid-item.expanded').forEach(expandedItem => {
                if (expandedItem !== this) {
                    expandedItem.classList.remove('expanded');
                    const infoPanel = expandedItem.querySelector('.additional-info');
                    if (infoPanel) infoPanel.style.display = 'none';
                }
            });
            
            // Toggle current item
            this.classList.toggle('expanded');
            const infoPanel = this.querySelector('.additional-info');
            if (infoPanel) {
                infoPanel.style.display = this.classList.contains('expanded') ? 'block' : 'none';
            }
        });
    });
}

function initializeServiceButtons() {
    const serviceButtons = document.querySelectorAll('.service-buttons button');
    const serviceCards = document.querySelectorAll('.card-container');

    // Show first card by default
    if (serviceCards.length > 0) {
        serviceCards[0].style.display = 'block';
        serviceCards[0].style.opacity = '1';
    }

    serviceButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetService = button.dataset.service;
            serviceCards.forEach(card => {
                card.style.display = card.id === targetService ? 'block' : 'none';
                setTimeout(() => card.style.opacity = card.id === targetService ? 1 : 0, 10);
            });
        });
    });
}

function initializePortfolioAnimations() {
    const portfolioSection = document.querySelector('.portfolio');
    if (!portfolioSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animatePortfolioElements();
                observer.unobserve(portfolioSection);
            }
        });
    }, { threshold: 0.5 });

    observer.observe(portfolioSection);
}

function animatePortfolioElements() {
    const elements = {
        title: { selector: '.portfolio-title', delay: 0 },
        subtitle: { selector: '.portfolio-subtitle', delay: 0.5 },
        text: { selector: '.portfolio-text', delay: 1 },
        button: { selector: '.portfolio .btn-primary', delay: 1.5 }
    };

    Object.values(elements).forEach(({ selector, delay }) => {
        const el = document.querySelector(selector);
        if (el) setTimeout(() => el.style.animation = `fadeInUp ${1}s ease forwards`, delay * 1000);
    });
}

function initializeJuxtaposeSliders() {
    const sliders = document.querySelectorAll('.juxtapose');
    if (!sliders.length) return;

    loadJuxtaposeDependencies().then(() => {
        sliders.forEach(slider => new juxtapose.JXSlider(slider));
    });
}

function loadJuxtaposeDependencies() {
    return new Promise((resolve) => {
        if (window.juxtapose) return resolve();

        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdn.knightlab.com/libs/juxtapose/latest/css/juxtapose.css';
        
        const js = document.createElement('script');
        js.src = 'https://cdn.knightlab.com/libs/juxtapose/latest/js/juxtapose.min.js';
        js.onload = resolve;

        document.head.append(css, js);
    });
}

function initializeSketchCheckbox() {
    const checkbox = document.querySelector('.sketch-checkbox');
    const priceElement = document.querySelector('.service-price');
    const infoElement = document.querySelector('.service-info');

    if (checkbox && priceElement && infoElement) {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                priceElement.textContent = 'R200';
                infoElement.textContent = 'one design concept';
            } else {
                priceElement.textContent = 'R300';
                infoElement.textContent = 'two to three concept design';
            }
        });
    }
}




// Show the page load overlay
function showPageLoadOverlay() {
    const overlay = document.getElementById('page-load-overlay');
    overlay.style.display = 'flex';
}

// Hide the page load overlay
function hidePageLoadOverlay() {
    const overlay = document.getElementById('page-load-overlay');
    overlay.style.display = 'none';
}

// Show overlay on page load
window.addEventListener('load', () => {
    showPageLoadOverlay();
    // Simulate a delay (e.g., fetching data or other resources)
    setTimeout(() => {
        hidePageLoadOverlay();
    }, 2000); 
});

document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('.lazy-image');

    // Intersection Observer callback
    const lazyLoad = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');

                img.src = src;

                img.removeAttribute('data-src');

                observer.unobserve(img);

                img.classList.add('loaded');
            }
        });
    };

    // Set up Intersection Observer
    const observer = new IntersectionObserver(lazyLoad, {
        rootMargin: '0px',
        threshold: 0.1,
    });

    // Observe each lazy image
    lazyImages.forEach(img => {
        observer.observe(img);
    });
});



// Search Functionality
document.getElementById('searchButton').addEventListener('click', function () {
    const searchInputEl = document.getElementById('searchInput');
    const searchValue = searchInputEl.value.toLowerCase();
    const loadingAnimation = document.getElementById('loadingAnimation');
    const noMatchMessage = document.getElementById('noMatchMessage');

    // Show loading
    loadingAnimation.style.display = 'flex';
    noMatchMessage.style.display = 'none';
    searchInputEl.placeholder = 'Loading...';
    searchInputEl.disabled = true;

    setTimeout(() => {
        loadingAnimation.style.display = 'none';
        searchInputEl.disabled = false; 

        const graphicDesignTerms = [
            "graphic", "graphics", "design", "designs", "graphic design", "graphic designs", "graphic", "graphics", "design", "designs", "graphic design", "graphic designs",
            "logo design", "poster design", "flyer design", "brochure design", "banner design",
            "business card design", "product advert design", "calendar design", "letterhead design",
            "menu design", "cd art cover design", "sign design", "book cover design", "board design",
            "invitation card design", "membership card design", "product design", "sticker design",
            "product label design", "sticker/product label design", "vehicle magnet branding",
            "event ticket design", "billboard design", "brand identity pack", "t-shirt design",
            "event backdrop design", "certificate design", "door vinyl branding", "window vinyl branding",
            "door/window vinyl branding", "presentation slide", "menu board slide design",
            "company profile design", "website design", "user system essentials", "contact form",
            "advanced login", "enterprice db", "user system essentials",
            "user system essentials", "user system essentials"
        ];

        const computerRepairTerms = [
            "computer", "fix", "repair", "computer repair", "computer fix", "pc repair", "pc fix",
            "software", "software installation", "windows installation", "antivirus installation",
            "microsoft office installation", "adobe reader installation", "installation"
        ];

        const isGraphicDesign = graphicDesignTerms.some(term => searchValue.includes(term));
        const isComputerRepair = computerRepairTerms.some(term => searchValue.includes(term));

        if (isGraphicDesign) {
            window.location.href = "services.html";
        } else if (isComputerRepair) {
            window.location.href = "http://onclick.96studios.co.za";
        } else {
            noMatchMessage.style.display = 'block';
            searchInputEl.placeholder = 'No match found';
            searchInputEl.value = '';

            // After 2 seconds, reset placeholder
            setTimeout(() => {
                searchInputEl.placeholder = 'Search...';
                noMatchMessage.style.display = 'none';
            }, 2000);
        }
    }, 1000);
});


document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar.fixed-top');
    let lastScroll = window.scrollY;
    
    // Make sure header starts visible
    navbar.style.transform = 'none';
    
    // Smooth transition
    navbar.style.transition = 'transform 0.3s ease';
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.scrollY;
        
        // Scroll down - hide header
        if (currentScroll > lastScroll && currentScroll > 10) {
            navbar.style.transform = 'translateY(-200%)';
        } 
        // Scroll up - show header
        else if (currentScroll < lastScroll) {
            navbar.style.transform = 'none';
        }
        
        lastScroll = currentScroll;
    });
});





