document.addEventListener('DOMContentLoaded', () => {
    const newProductsContainer = document.querySelector('.new-product-grid');
    const promotionsContainer = document.querySelector('.promotions-products-sidebar');
    const allProductsContainer = document.querySelector('.all-product-grid');

    // Function to generate a standard product card
    const createProductCard = (product) => {
        return `
            <div class="product-card" tabindex="0" data-codebar="${product.codeBar || ''}" data-id="${product.id || ''}">
                <div class="product-type-badge">${product.type}</div>
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-overlay">
                        <p class="product-description">${product.description || ''}</p>
                    </div>
                </div>
                <h3>${product.name}</h3>
                <p class="price">${product.price} MAD</p>
                <div class="quantity-control">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="quantity-input" value="1" min="1">
                    <button class="quantity-btn plus">+</button>
                </div>
                <button class="add-to-cart">Ajouter au panier</button>
            </div>
        `;
    };

    // Function to generate a promotion product card
    const createPromotionCard = (product) => {
        return `
            <div class="product-card promotion" tabindex="0" data-codebar="${product.codeBar || ''}" data-id="${product.id || ''}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-overlay">
                        <p class="product-description">${product.description || ''}</p>
                    </div>
                </div>
                <h3>${product.name}</h3>
                <p class="price">
                    <span class="original-price">${product.original_price} MAD</span>
                    ${product.price} MAD
                </p>
                <div class="quantity-control">
                    <button class="quantity-btn minus">-</button>
                    <input type="number" class="quantity-input" value="1" min="1">
                    <button class="quantity-btn plus">+</button>
                </div>
                <button class="add-to-cart">Ajouter au panier</button>
            </div>
        `;
    };

    // Populate New Products
    if (newProductsContainer && newProductsDB && newProductsDB.newProducts) {
        newProductsDB.newProducts.forEach(product => {
            newProductsContainer.innerHTML += createProductCard(product);
        });
    }

    // Populate Promotions
    if (promotionsContainer && promoProductsDB && promoProductsDB.promotions) {
        promoProductsDB.promotions.forEach(product => {
            promotionsContainer.innerHTML += createPromotionCard(product);
        });
    }

    // Populate All Products
    if (allProductsContainer && allProductsDB && allProductsDB.allProducts) {
        allProductsDB.allProducts.forEach(product => {
            allProductsContainer.innerHTML += createProductCard(product);
        });
    }

    // Event delegation for quantity buttons and Add to Cart
    document.addEventListener('click', (e) => {
        // Quantity Buttons
        if (e.target.classList.contains('quantity-btn')) {
            const button = e.target;
            const input = button.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);

            if (button.classList.contains('plus')) {
                value++;
            } else if (button.classList.contains('minus')) {
                if (value > 1) {
                    value--;
                }
            }
            input.value = value;
        }

        // Add to Cart Button
        if (e.target.classList.contains('add-to-cart')) {
            const card = e.target.closest('.product-card');
            const quantityInput = card.querySelector('.quantity-input');
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

            // Try to find product from database using data-id
            const productId = card.dataset.id;
            let product = null;

            // Search in all product databases
            if (productId) {
                if (allProductsDB && allProductsDB.allProducts) {
                    product = allProductsDB.allProducts.find(p => p.id === productId);
                }
                if (!product && newProductsDB && newProductsDB.newProducts) {
                    product = newProductsDB.newProducts.find(p => p.id === productId);
                }
                if (!product && promoProductsDB && promoProductsDB.promotions) {
                    product = promoProductsDB.promotions.find(p => p.id === productId);
                }
            }

            // If product found in DB, use it; otherwise extract from card
            if (product) {
                // Use the product from database, but adjust image path if needed
                const imageSrc = card.querySelector('img').src;
                CartService.addToCart({
                    ...product,
                    image: imageSrc // Use the actual displayed image path
                }, quantity);
            } else {
                // Fallback: Extract product data from card (for backwards compatibility)
                const name = card.querySelector('h3').innerText;
                const priceText = card.querySelector('.price').innerText;
                
                let price;
                if (card.classList.contains('promotion')) {
                    const priceEl = card.querySelector('.price');
                    const originalPriceEl = priceEl.querySelector('.original-price');
                    let priceString = priceEl.innerText;
                    if (originalPriceEl) {
                        priceString = priceString.replace(originalPriceEl.innerText, '');
                    }
                    price = parseFloat(priceString.replace('MAD', '').trim());
                } else {
                    price = parseFloat(priceText.replace('MAD', '').trim());
                }

                const image = card.querySelector('img').src;
                const codeBar = card.dataset.codebar || 'N/A';
                const id = productId || name.replace(/\s+/g, '-').toLowerCase();

                CartService.addToCart({
                    id: id,
                    name: name,
                    price: price,
                    image: image,
                    codeBar: codeBar
                }, quantity);
            }
        }
    });

    // Cart Modal Logic
    const cartIcon = document.getElementById('cart-icon');
    const cartModalOverlay = document.getElementById('cart-modal-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');

    const openCart = () => {
        if (!cartModalOverlay || !cartItemsContainer || !cartTotalPrice) {
            console.error('Cart modal elements not found');
            return;
        }
        renderCart();
        cartModalOverlay.classList.add('open');
    };

    const closeCart = () => {
        if (cartModalOverlay) {
            cartModalOverlay.classList.remove('open');
        }
    };

    const renderCart = () => {
        if (!cartItemsContainer || !cartTotalPrice) {
            return;
        }
        const cart = CartService.getCart();
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Votre panier est vide.</p>';
            cartTotalPrice.innerText = '0.00 MAD';
            return;
        }

        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">${item.price} MAD</div>
                    <div class="cart-item-controls">
                        <div class="quantity-control" style="margin:0">
                            <button class="quantity-btn minus small" data-id="${item.id}">-</button>
                            <input type="number" class="quantity-input small" value="${item.quantity}" readonly style="width:30px; padding:2px">
                            <button class="quantity-btn plus small" data-id="${item.id}">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}">Supprimer</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        cartTotalPrice.innerText = CartService.calculateTotal() + ' MAD';

        // Add event listeners for cart item controls
        const removeButtons = cartItemsContainer.querySelectorAll('.remove-item');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                CartService.removeFromCart(e.target.dataset.id);
                renderCart();
            });
        });

        const quantityButtons = cartItemsContainer.querySelectorAll('.quantity-btn');
        quantityButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const item = cart.find(i => i.id === id);
                if (item) {
                    let newQty = item.quantity;
                    if (e.target.classList.contains('plus')) {
                        newQty++;
                    } else if (e.target.classList.contains('minus')) {
                        newQty--;
                    }
                    CartService.updateQuantity(id, newQty);
                    renderCart();
                }
            });
        });
    };

    if (cartIcon) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    }

    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCart);
    }

    // Checkout Logic
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cart = CartService.getCart();
            if (cart.length === 0) {
                alert('Votre panier est vide.');
                return;
            }

            const name = document.getElementById('buyer-name').value.trim();
            const address = document.getElementById('buyer-address').value.trim();
            const phone = document.getElementById('buyer-phone').value.trim();

            if (!name || !address || !phone) {
                alert('Veuillez remplir toutes les informations de livraison (Nom, Adresse, Téléphone).');
                return;
            }

            let message = `*Nouvelle Commande*\n\n`;
            message += `*Client:* ${name}\n`;
            message += `*Adresse:* ${address}\n`;
            message += `*Téléphone:* ${phone}\n\n`;
            message += `*Commande:*\n`;

            cart.forEach(item => {
                message += `- ${item.quantity} x ${item.name} (Ref: ${item.codeBar || 'N/A'}) (${item.price} MAD)\n`;
            });

            message += `\n*Total:* ${CartService.calculateTotal()} MAD`;

            const encodedMessage = encodeURIComponent(message);
            // Replace with actual business number
            const phoneNumber = '212645994904';
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');
        });
    }

    // Close modal when clicking outside
    if (cartModalOverlay) {
        cartModalOverlay.addEventListener('click', (e) => {
            if (e.target === cartModalOverlay) {
                closeCart();
            }
        });
    }

    // Initialize cart count
    CartService.updateCartCount();

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim(); // Use trim to handle whitespace only input
            if (query === '') {
                alert('Aucun terme de recherche fourni.'); // Simple alert for error message
                return; // Do nothing further
            }
            sessionStorage.setItem('searchQuery', query.toLowerCase());
            window.location.href = 'pages/search.html';
        });
    }
});

// Update footer year
document.addEventListener('DOMContentLoaded', () => {
    const yearSpan = document.getElementById('current-year');
    const currentYear = new Date().getFullYear();
    yearSpan.textContent = currentYear;
});