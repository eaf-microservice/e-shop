const CartService = {
  key: 'eaf_shop_cart',

  getCart() {
    const cart = localStorage.getItem(this.key);
    return cart ? JSON.parse(cart) : [];
  },

  saveCart(cart) {
    localStorage.setItem(this.key, JSON.stringify(cart));
    this.updateCartCount();
  },

  addToCart(product, quantity) {
    const cart = this.getCart();
    const existingItemIndex = cart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }

    this.saveCart(cart);
    alert('Produit ajouté au panier !');
  },

  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.id !== productId);
    this.saveCart(cart);
  },

  updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
      item.quantity = quantity;
      if (item.quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        this.saveCart(cart);
      }
    }
  },

  clearCart() {
    localStorage.removeItem(this.key);
    this.updateCartCount();
  },

  calculateTotal() {
    const cart = this.getCart();
    return cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
  },

  updateCartCount() {
    const cart = this.getCart();
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.innerText = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
  }
};