const createProductCard = (product) => {
    return `
        <div class="product-card" tabindex="0" data-codebar="${product.codeBar || ''}" data-id="${product.id || ''}">
            <div class="product-type-badge">${product.type}</div>
            <div class="product-image">
                <img src="../${product.image}" alt="${product.name}">
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

document.addEventListener('DOMContentLoaded', () => {
    const searchResultsContainer = document.querySelector('.search-results-grid');

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
        document.getElementById('search-query').textContent = searchQuery;
    } else {
        document.getElementById('search-query').textContent = searchQuery;
        searchResultsContainer.innerHTML = '<p class="result-text">Aucun produit trouvé pour votre recherche.</p>';
    }
});