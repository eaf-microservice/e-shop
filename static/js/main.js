document.addEventListener('DOMContentLoaded', () => {
    const newProductsContainer = document.querySelector('.new-product-grid');
    const promotionsContainer = document.querySelector('.promotions-products-sidebar');
    const allProductsContainer = document.querySelector('.all-product-grid');

    // Function to generate a standard product card
    const createProductCard = (product) => {
        return `
            <div class="product-card" tabindex="0">
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
            <div class="product-card promotion" tabindex="0">
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
    if (newProductsDB && newProductsDB.newProducts) {
        newProductsDB.newProducts.forEach(product => {
            newProductsContainer.innerHTML += createProductCard(product);
        });
    }

    // Populate Promotions
    if (promoProductsDB && promoProductsDB.promotions) {
        promoProductsDB.promotions.forEach(product => {
            promotionsContainer.innerHTML += createPromotionCard(product);
        });
    }

    // Populate All Products
    if (allProductsDB && allProductsDB.allProducts) {
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

            // Extract product data from card
            // Note: In a real app, we'd use data-id to fetch from DB, but here we can scrape or find in DB arrays
            // Let's try to find the product object from our global DBs based on name or image, 
            // OR better, let's attach data-id to the card when creating it.
            // Since I didn't add data-id in the previous step, I'll assume I need to do it now or scrape.
            // Let's scrape for now as it's easier without modifying the create functions again immediately.

            const name = card.querySelector('h3').innerText;
            const priceText = card.querySelector('.price').innerText;
            // Clean price string (remove ' MAD' and 'original price' if present)
            // If promotion, price text might contain original price. 
            // The current HTML structure for promotion is: <p class="price"><span class="original">...</span> ACTUAL MAD</p>
            // innerText will get both.

            let price;
            // Check if it's a promotion card to get the correct price
            if (card.classList.contains('promotion')) {
                // The price is the text node after the span, or we can just parse the whole text and take the last number
                // A safer way is to look at the HTML structure again.
                // <p class="price"><span class="original-price">...</span> ${product.price} MAD</p>
                // We can get the text content of the parent and remove the text content of the span.
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

            // Generate a pseudo-ID if not available, or use name as ID for now
            const id = name.replace(/\s+/g, '-').toLowerCase();

            const product = {
                id: id,
                name: name,
                price: price,
                image: image
            };

            CartService.addToCart(product, quantity);
        }
    });

    // Cart Modal Logic
    const cartIcon = document.getElementById('cart-icon');
    const cartModalOverlay = document.getElementById('cart-modal-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');

    const openCart = () => {
        renderCart();
        cartModalOverlay.classList.add('open');
    };

    const closeCart = () => {
        cartModalOverlay.classList.remove('open');
    };

    const renderCart = () => {
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

    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim(); // Use trim to handle whitespace only input
        if (query === '') {
            alert('Aucun terme de recherche fourni.'); // Simple alert for error message
            return; // Do nothing further
        }
        sessionStorage.setItem('searchQuery', query.toLowerCase());
        window.location.href = '../pages/search.html';
    });
});
