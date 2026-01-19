document.addEventListener('DOMContentLoaded', () => {

    const newProductsContainer = document.querySelector('.new-product-grid');
    const promotionsContainer = document.querySelector('.promotions-products-sidebar');
    const allProductsContainer = document.querySelector('.all-product-grid');

    // Function to generate a standard product card
    const createProductCard = (product) => {
        return `
            <div class="product-card" tabindex="0">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-overlay">
                        <p class="product-description">${product.description || ''}</p>
                    </div>
                </div>
                <h3>${product.name}</h3>
                <p class="price">${product.price} MAD</p>
                <button class="add-to-cart">Add to Cart</button>
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
                <button class="add-to-cart">Add to Cart</button>
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
});
