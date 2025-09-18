import { auth, db, setDoc, doc, getDoc, updateUserProfile, cartItems, cartCounter, updateCartCounterValue, updateCartCounter } from './firebase.js';

// Initialize Cart System
function initializeCartSystem() {
    updateCartCounter();
    updateCartDisplay();
}

// Initialize Cart Event Handlers
function initializeCartEventHandlers() {
    // Cart Toggle with State Management
    document.querySelectorAll('.cart-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const cartSection = document.getElementById('cart-section');
            cartSection.classList.toggle('active');
            
            // Force UI refresh when opening cart
            if (cartSection.classList.contains('active')) {
                updateCartDisplay();
            }
        });
    });

    // Cart Close
    document.getElementById('cart-close').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('cart-section').classList.remove('active');
    });

    // Dynamic Item Removal
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove')) {
            const itemId = parseInt(e.target.dataset.id);
            cartItems.splice(cartItems.findIndex(item => item.id === itemId), 1); 
            persistCartState();
            updateCartDisplay();
            
            // Auto-close cart if last item removed
            if (cartItems.length === 0) {
                document.getElementById('cart-section').classList.remove('active');
            }
        }
    });

    // Proceed to Checkout
    document.querySelector('.btn-proceed').addEventListener('click', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;

        if (user) {
            try {
                let updatedCartItems = JSON.parse(localStorage.getItem('cart')) || [];

                // Default values for admin dashboard fields
                await setDoc(doc(db, "users", user.uid), {
                    cart: updatedCartItems,
                    trackDesignActive: true,
                    designProgress: 'Pending',
                    paymentStatus: 'Not Paid',
                    designDuration: 'Pending',
                    lastUpdated: new Date().toISOString()
                }, { merge: true });

                showAuth();
                await updateUserProfile(user);
                alert('Cart saved successfully!');
            } catch (error) {
                console.error('Error saving cart:', error.message);
                alert('Failed to save cart. Please try again.');
            }
        } else {
            showAuth();
        }
    });

    // Continue Shopping Button
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.btn-continue-shopping')) {
            document.getElementById('cart-section').classList.remove('active');
        }
    });
}

// Updated addToCart function (drop-in replacement)
function addToCart(itemDetails) {
    // Accept both "R200" and 200
    let priceValue;
    if (typeof itemDetails.price === 'number') {
        priceValue = itemDetails.price;
    } else if (typeof itemDetails.price === 'string') {
        priceValue = parseFloat(itemDetails.price.replace(/[R,\s]/g, '')) || 0;
    } else {
        priceValue = 0;
    }

    const sectionOption = itemDetails.sections || 1;

    const newItem = {
        id: Date.now(),
        title: itemDetails.title,
        price: priceValue,
        basePrice: (typeof itemDetails.basePrice === 'number')
            ? itemDetails.basePrice
            : (itemDetails.basePrice ? parseFloat(String(itemDetails.basePrice).replace(/[R,\s]/g, '')) : priceValue),
        description: itemDetails.description || '',
        imageUrl: itemDetails.imageUrl || '',
        tier: itemDetails.tier || '',
        addons: itemDetails.addons || [],
        serviceType: itemDetails.serviceType || '',
        sections: sectionOption,                
        sectionFeatures: itemDetails.sectionFeatures || [],
        info: itemDetails.info || ''
    };

    cartItems.push(newItem);
    persistCartState();
    updateCartDisplay();
    document.getElementById('cart-section').classList.add('active');
    showPaymentPopup();
}


// Persist Cart State to Local Storage
function persistCartState() {
    updateCartCounterValue(cartItems.length); 
    localStorage.setItem('cart', JSON.stringify(cartItems));
    updateCartCounter();
}

// Update Cart Display
function updateCartDisplay() {
    const cartBody = document.querySelector('.cart-body');
    const totalElement = document.querySelector('.total-value');
    const inputFields = document.querySelector('.input-fields');
    const costInfo = document.querySelector('.cost-info');
    const proceedContainer = document.querySelector('.proceed-container');
    const designsCount = document.getElementById('designs-count');

    // Always reset these elements when updating
    const additionalSections = [inputFields, costInfo, proceedContainer];

    if (cartItems.length === 0) {
        cartBody.innerHTML = `
            <div class="empty-cart" style="text-align: center;">
            <div class="cart-empty"><img src="assets/icons/basket.png" alt="Logo" class="logo"></div>
                <p>Your cart is empty</p>
                <button style="border-radius: 60px;" class="btn-continue-shopping">Continue Shopping</button>
            </div>
        `;
        // Hide additional cart sections
        additionalSections.forEach(section => section.style.display = 'none');
        designsCount.textContent = '0';
        totalElement.textContent = 'R0.00';
    } else {
        // Show additional cart sections
        additionalSections.forEach(section => section.style.display = 'block');
        designsCount.textContent = cartItems.length;
        
        // Clear existing items
        cartBody.innerHTML = '';
        
        // Populate cart items
            cartItems.forEach(item => {
             cartBody.innerHTML += `
                <div class="cart-item" data-id="${item.id}">
                  <div class="item-details">
                    <h3 class="item-title">${item.title}</h3>

                <div class="item-meta">
                    <span class="item-price">R${item.price.toFixed(2)}</span>
                </div>

                ${item.serviceType === 'website-design' && item.sections ? `
                    <div class="item-row"><strong>Sections:</strong> ${item.sections}</div>` : ''}

                ${item.serviceType === 'website-design' && item.sectionFeatures?.length > 0 ? `
                    <div class="item-row">
                        <strong>Section Features:</strong>
                        ${item.sectionFeatures.map(f => `<span class="tag">${f}</span>`).join(' ')}
                    </div>` : ''}

                ${item.addons?.length > 0 ? `
                    <div class="item-row">
                        <strong>Addons:</strong>
                        ${item.addons.map(a => `<span class="tag">${a}</span>`).join(' ')}
                    </div>` : ''}

                ${item.info ? `
                    <div class="item-row">
                        <strong></strong>
                        ${item.info.split('\n').map(f => `<span class="tag">${f}</span>`).join(' ')}
                    </div>` : ''}

                <button class="btn-remove" data-id="${item.id}">Remove</button>
            </div>
        </div>
    `;
});

        // Calculate total
        const total = cartItems.reduce((sum, item) => sum + item.price, 0);
        totalElement.textContent = `R${total.toFixed(2)}`;
    }
}

// Handle Design Service Buttons
document.body.addEventListener('click', (e) => {
    // Handle design service buttons
    const button = e.target.closest('.design-btn');
    if (button && !button.classList.contains('design-btn-outline')) {
        const serviceCard = button.closest('.design-service-card');
        const tierDetails = button.closest('.design-tier-details');

        if (!serviceCard || !tierDetails) {
            console.error('Could not find service card or tier details');
            return;
        }

        // Title / tier
        const serviceTitle = serviceCard.querySelector('.design-service-title, [class*="service-title"]')?.textContent?.trim() || 'Design Service';
        const tierName = tierDetails.dataset.tier || '';

        // Website-design addons
        let addons = [];
        if (serviceCard.dataset.service === 'website-design') {
            const addonItems = tierDetails.querySelectorAll('.design-addon-item, [class*="addon-item"]');
            addonItems.forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    const labelEl = item.querySelector('.design-addon-label, [class*="addon-label"]');
                    const labelText = labelEl?.textContent || '';
                    const cleanLabel = typeof labelText === 'string'
                        ? labelText.replace(/\(\+R[0-9,]+\)/, '').trim()
                        : '';
                    addons.push(cleanLabel);
                }
            });
        }

        // Features list (if present)
        let features = [];
        const featuresList = tierDetails.querySelector('.design-features-list, [class*="features-list"]');
        if (featuresList) {
            features = Array.from(featuresList.children).map(li => li.textContent.trim());
        }

        // Flexible pricing
        let selectedPages = 1;
        let finalPrice = 0;
        const pricingMode = serviceCard.dataset.pricing; 

        if (pricingMode === 'per-page') {
            const pageSelect = tierDetails.querySelector('.design-page-count, #design-pages-certificate, #design-sections-cerificate, .design-section-count');
            selectedPages = pageSelect ? parseInt(pageSelect.value, 10) : 1;

            const basePrice = parseFloat(serviceCard.dataset.base || '0');
            const extraPerPage = parseFloat(serviceCard.dataset.extra || '0');

            finalPrice = basePrice + Math.max(0, selectedPages - 1) * extraPerPage;
        } else {
            const priceElement = tierDetails.querySelector('.design-total-price, .design-service-price, [class*="total-price"], [class*="service-price"], .price, .amount, .value');
            const priceText = priceElement?.textContent || '0';
            const firstNumber = priceText.match(/(\d[\d,]*)/);
            finalPrice = firstNumber ? parseFloat(firstNumber[1].replace(/,/g, '')) : 0;
        }

        // Website design "sections" + features by sections
        const sectionSelect = tierDetails.querySelector('.design-section-count');
        const selectedSections = sectionSelect ? parseInt(sectionSelect.value, 10) : 1;
        const sectionFeatureDiv = tierDetails.querySelector(`.design-section-features > div[data-sections="${selectedSections}"]`);
        let sectionFeatures = [];
        if (sectionFeatureDiv) {
            sectionFeatures = Array.from(sectionFeatureDiv.querySelectorAll('li')).map(li => li.textContent.trim());
        }

        const description = tierDetails.querySelector('.design-service-description, [class*="service-description"]')?.textContent || '';

        // Add to cart
        addToCart({
            title: `${serviceTitle} - ${tierName}`,
            price: finalPrice, 
            basePrice: pricingMode === 'per-page' ? parseFloat(serviceCard.dataset.base || finalPrice) : finalPrice,
            description: description,
            info: features.join('\n'),
            tier: tierName,
            addons: addons,
            serviceType: serviceCard.dataset.service || '',
            sections: (pricingMode === 'per-page') ? selectedPages : selectedSections,
            sectionFeatures: sectionFeatures
        });
    }

    // Handle Advert Buttons (keep as-is)
    if (e.target.closest('.advert-button')) {
        const button = e.target.closest('.advert-button');
        addToCart({
            title: button.dataset.title,
            price: button.dataset.price,
            info: button.dataset.info
        });
    }
});


// Handle Glide Slider Cart Icons
document.body.addEventListener('click', (e) => {
    if (e.target.closest('.cart-icon')) {
        const cartIcon = e.target.closest('.cart-icon');
        addToCart({
            title: cartIcon.dataset.title,
            price: cartIcon.dataset.price,
            info: cartIcon.dataset.info,
            additionalInfo: cartIcon.dataset.additionalInfo
        });
    }
});

// Page Load Overlay
function showPageLoadOverlay() {
    const overlay = document.getElementById('page-load-overlay');
    overlay.style.display = 'flex';
}

function hidePageLoadOverlay() {
    const overlay = document.getElementById('page-load-overlay');
    overlay.style.display = 'none';
}

// Function to wait for all images to load
function waitForAllImagesToLoad() {
    const images = document.querySelectorAll('img');
    const imagePromises = [];

    images.forEach(img => {
        if (!img.complete) {
            const promise = new Promise((resolve) => {
                img.addEventListener('load', resolve);
                img.addEventListener('error', resolve); 
            });
            imagePromises.push(promise);
        }
    });

    return Promise.all(imagePromises);
}

window.addEventListener('load', () => {
    showPageLoadOverlay();

    // Wait for all images to load
    waitForAllImagesToLoad().then(() => {
        hidePageLoadOverlay();
    });
});

// Upload Sketch Overlay
function showUploadOverlay() {
    const overlay = document.getElementById('upload-overlay');
    overlay.style.display = 'flex';
}

function hideUploadOverlay() {
    const overlay = document.getElementById('upload-overlay');
    overlay.style.display = 'none';
}

document.getElementById('sketch-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showUploadOverlay();

    try {
        const imageUrl = await uploadToCloudinary(file);
        if (imageUrl) {
            let cartItems = JSON.parse(localStorage.getItem('cart')) || [];
            if (cartItems.length > 0) {
                cartItems[cartItems.length - 1].imageUrl = imageUrl;
                localStorage.setItem('cart', JSON.stringify(cartItems));
                updateCartDisplay();
                showUploadAlert('Sketch uploaded successfully!', 'success');
            }
        } else {
            showUploadAlert('Upload failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Upload failed:', error);
        showUploadAlert(`Upload failed: ${error.message}`, 'error');
    } finally {
        hideUploadOverlay();
    }
});

// Show Upload Alert
function showUploadAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `upload-alert alert-${type}`;
    alertDiv.textContent = message;
    
    document.body.appendChild(alertDiv);
    
    // Force reflow to enable transition
    void alertDiv.offsetWidth;
    
    alertDiv.classList.add('show');
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            alertDiv.remove();
        }, 500);
    }, 3000);
}

// Update the Description Handler
document.getElementById('design-description').addEventListener('input', function() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    if (cartItems.length > 0) {
        cartItems[cartItems.length - 1].description = this.value;
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }
});

// Upload to Cloudinary
async function uploadToCloudinary(file) {
    const cloudName = 'ddaeq2zfn';
    const uploadPreset = 'design_sketch'; 

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: formData }
        );
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return null;
    }
}

// Initialize Cart System on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initializeCartSystem();
    initializeCartEventHandlers();
});

// Payment Method Popup
function showPaymentPopup() {
    setTimeout(() => {
        const paymentPopup = document.getElementById('paymentPopup');
        if (cartItems.length > 0) {
            paymentPopup.style.display = 'flex';
        }
    }, 5000); // 5 seconds delay
}

// TRACK DESIGN SECTION
window.fetchDesignProgress = async function () {
    const user = auth.currentUser;

    if (user) {
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();

                // Update progress bar
                const progressFill = document.getElementById('progressFill');
                const progressStages = ['Pending', 'Designing', 'Finalizing', 'Finished'];
                const progressIndex = progressStages.indexOf(data.designProgress || 'Pending');
                const progressPercentage = ((progressIndex + 1) / progressStages.length) * 100;
                progressFill.style.width = `${progressPercentage}%`;

                // Update stages with checkmarks and green styling
                const stages = document.querySelectorAll('.progress-stages .stage');
                
                stages.forEach((stage, index) => {
                    if (index <= progressIndex) {
                        stage.classList.add('active');
                        if (index < progressIndex) {
                            stage.classList.add('completed');
                        }
                    } else {
                        stage.classList.remove('active', 'completed');
                    }
                });

                // Update payment status and design duration
                document.getElementById('paymentStatus').textContent = data.paymentStatus || 'Not Paid';
                document.getElementById('designDuration').textContent = data.designDuration || 'Pending';
            }
        } catch (error) {
            console.error('Error fetching design progress:', error);
        }
    }
};

function showTrackDesign() {
    const trackDesignSection = document.getElementById('trackDesignSection');
    trackDesignSection.style.display = 'block';

    // Populate user info
    document.getElementById('trackUsername').textContent = document.getElementById('username').textContent;
    document.getElementById('trackEmail').textContent = document.getElementById('userEmail').textContent;

    // Fetch and update progress from Firestore
    fetchDesignProgress();
}

// Hide Track Design Section
function hideTrackDesign() {
    document.getElementById('trackDesignSection').style.display = 'none';
}

// Show Track Design Section
window.showTrackDesign = function () {
    const trackDesignSection = document.getElementById('trackDesignSection');
    trackDesignSection.style.display = 'block';

    // Populate user info
    document.getElementById('trackUsername').textContent = document.getElementById('username').textContent;
    document.getElementById('trackEmail').textContent = document.getElementById('userEmail').textContent;

    // Fetch and update progress from Firestore
    fetchDesignProgress();
};







// Function to close entire profile page section
window.closeProfilePage = function() {
    // Hide the entire profile page section
    document.getElementById('profilePage').style.display = 'none';
    
    // Reset the auth forms 
    document.getElementById('authContainer').style.display = 'none';
    document.querySelector('.profile-page-overlay').style.display = 'none';
    
    // Reset all forms to initial state
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('passwordResetForm').style.display = 'none';
    
    // Clear all form fields
    const clearFields = [
        'loginEmail', 'loginPassword', 
        'registerName', 'registerEmail', 'registerPassword',
        'resetEmail'
    ];
    clearFields.forEach(id => {
        if (document.getElementById(id)) {
            document.getElementById(id).value = '';
        }
    });
    
    // Clear any error messages
    const clearErrors = ['loginError', 'registerError', 'resetError'];
    clearErrors.forEach(id => {
        if (document.getElementById(id)) {
            document.getElementById(id).textContent = '';
        }
    });
};