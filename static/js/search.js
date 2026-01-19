document.addEventListener('DOMContentLoaded', () => {
    const searchResultsContainer = document.querySelector('.search-results-grid');
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

    const searchQuery = sessionStorage.getItem('searchQuery');
    let filteredProducts = [];

    if (allProductsDB && allProductsDB.allProducts && searchQuery) {
        filteredProducts = allProductsDB.allProducts.filter(product => {
            const query = searchQuery.toLowerCase();
            return product.name.toLowerCase().includes(query) ||
                   product.codeBar.toLowerCase().includes(query) ||
                   product.type.toLowerCase().includes(query);
        });
    }

    if (filteredProducts.length > 0) {
        filteredProducts.forEach(product => {
            searchResultsContainer.innerHTML += createProductCard(product);
        });
    } else {
        searchResultsContainer.innerHTML = '<p>No products found for your search.</p>';
    }
});