/**
 * Cookie-based Cart
 * Stores a compact JSON array in "cart" cookie: [{id: "prod123", qty: 2}]
 * Keep payload small (<4KB). Only store id and qty.
 */

const CART_COOKIE = "cart";
const COOKIE_DAYS = 7;

/* Cookie utilities */
function setCookie(name, value, days = COOKIE_DAYS) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax`;
}
function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const target = encodeURIComponent(name) + "=";
  for (const c of cookies) {
    if (c.startsWith(target)) {
      return decodeURIComponent(c.substring(target.length));
    }
  }
  return null;
}
function deleteCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
}

/* Cart data ops */
function readCart() {
  try {
    const raw = getCookie(CART_COOKIE);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // sanitize
    return arr
      .filter(x => x && typeof x.id === "string" && Number.isFinite(+x.qty))
      .map(x => ({ id: x.id, qty: Math.max(1, Math.floor(+x.qty)) }));
  } catch {
    return [];
  }
}
function writeCart(cart) {
  // Deduplicate by id and keep only id/qty
  const map = new Map();
  for (const item of cart) {
    const id = String(item.id);
    const qty = Math.max(1, Math.floor(+item.qty || 1));
    map.set(id, (map.get(id) || 0) + qty);
  }
  const compact = Array.from(map, ([id, qty]) => ({ id, qty }));
  setCookie(CART_COOKIE, JSON.stringify(compact));
  return compact;
}
export function addToCart(id, qty = 1) {
  const cart = readCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ id, qty });
  return writeCart(cart);
}
export function setItemQty(id, qty) {
  qty = Math.max(0, Math.floor(+qty));
  let cart = readCart();
  if (qty === 0) cart = cart.filter(i => i.id !== id);
  else {
    const idx = cart.findIndex(i => i.id === id);
    if (idx >= 0) cart[idx].qty = qty;
    else cart.push({ id, qty });
  }
  return writeCart(cart);
}
export function removeFromCart(id) {
  const cart = readCart().filter(i => i.id !== id);
  return writeCart(cart);
}
export function clearCart() {
  deleteCookie(CART_COOKIE);
}
export function getCart() {
  return readCart();
}

/* Optional: UI binding
   Expect buttons with data-add-to-cart and data-product-id attributes.
   Example: <button data-add-to-cart data-product-id="prod123">Ajouter au panier</button>
*/
export function bindAddToCartButtons(container = document) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-to-cart]");
    if (!btn) return;
    const id = btn.getAttribute("data-product-id");
    const qtyAttr = btn.getAttribute("data-qty");
    const qty = qtyAttr ? Math.max(1, Math.floor(+qtyAttr)) : 1;
    if (!id) return;
    addToCart(id, qty);
    // Dispatch a custom event so other UI (badge, panel) can update
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart: getCart() } }));
  });
}

/* Optional: render a simple cart panel/list into a div#cart-panel
   You must supply a way to get product details (name, price, image) from an id.
   Provide a resolver function that returns metadata for ids.
*/
export async function renderCartList({ mount, resolveProduct }) {
  const container = typeof mount === "string" ? document.querySelector(mount) : mount;
  if (!container) return;
  const cart = getCart();

  // Resolve product details (could be sync or async)
  const items = await Promise.all(
    cart.map(async i => {
      const meta = await resolveProduct(i.id);
      return { ...i, meta };
    })
  );

  // Basic HTML
  container.innerHTML = items.length === 0
    ? '<p class="cart-empty">Votre panier est vide.</p>'
    : `<ul class="cart-list">
         ${items.map(i => `
           <li class="cart-item" data-id="${i.id}">
             <img class="cart-item__img" src="${i.meta?.image || ''}" alt="${i.meta?.name || ''}">
             <div class="cart-item__info">
               <div class="cart-item__name">${i.meta?.name || i.id}</div>
               <div class="cart-item__qty">
                 <button class="qty-dec" aria-label="Decrease">-</button>
                 <input type="number" min="1" value="${i.qty}">
                 <button class="qty-inc" aria-label="Increase">+</button>
                 <button class="remove-item" aria-label="Remove">Supprimer</button>
               </div>
             </div>
           </li>`).join("")}
       </ul>`;

  // Bind qty and remove
  container.addEventListener("click", (e) => {
    const li = e.target.closest(".cart-item");
    if (!li) return;
    const id = li.getAttribute("data-id");
    if (e.target.matches(".qty-inc")) {
      const curr = getCart().find(x => x.id === id)?.qty || 1;
      setItemQty(id, curr + 1);
      renderCartList({ mount: container, resolveProduct });
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart: getCart() } }));
    } else if (e.target.matches(".qty-dec")) {
      const curr = getCart().find(x => x.id === id)?.qty || 1;
      setItemQty(id, Math.max(1, curr - 1));
      renderCartList({ mount: container, resolveProduct });
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart: getCart() } }));
    } else if (e.target.matches(".remove-item")) {
      removeFromCart(id);
      renderCartList({ mount: container, resolveProduct });
      window.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart: getCart() } }));
    }
  });
}

/* Badge count helper for the header icon */
export function bindCartBadge({ selector = ".cart-badge" } = {}) {
  const el = document.querySelector(selector);
  if (!el) return;
  const update = () => {
    const count = getCart().reduce((sum, i) => sum + i.qty, 0);
    el.textContent = count > 0 ? String(count) : "";
  };
  update();
  window.addEventListener("cart:updated", update);
}
bindCartBadge();