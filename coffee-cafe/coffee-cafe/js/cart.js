// ============================================================
// CART.JS — Shopping Cart with LocalStorage
// ============================================================

const CART_KEY = 'brewhaus_cart';

// ---- Core Cart Functions ----
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  dispatchCartUpdate();
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
  showToast(`${item.emoji} ${item.name} added to cart!`, 'success', 2000);
  animateCartBadge();
}

function removeFromCart(itemId) {
  const cart = getCart().filter(i => i.id !== itemId);
  saveCart(cart);
}

function updateQuantity(itemId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === itemId);
  if (!item) return;
  item.quantity = Math.max(0, item.quantity + delta);
  if (item.quantity === 0) {
    saveCart(cart.filter(i => i.id !== itemId));
  } else {
    saveCart(cart);
  }
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  dispatchCartUpdate();
}

function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

// ---- UI Updates ----
function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = getCartCount();
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

function animateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(badge => {
    badge.classList.remove('bounce');
    void badge.offsetWidth;
    badge.classList.add('bounce');
  });
}

function dispatchCartUpdate() {
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: getCart() } }));
}

// ---- Checkout / Order Placement ----
async function placeOrder(customerName, tableOrPickup, note) {
  const user = auth.currentUser;
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return null;
  }

  const order = {
    userId: user ? user.uid : 'guest',
    customerName,
    userEmail: user ? (user.email || null) : null,
    tableOrPickup,
    note: note || '',
    items: cart.map(i => ({
      id: i.id,
      name: i.name,
      emoji: i.emoji,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.price * i.quantity
    })),
    totalPrice: parseFloat(getCartTotal().toFixed(2)),
    status: 'pending',
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    // QR/table tracking
    orderNumber: generateOrderNumber()
  };

  try {
    showLoadingToast('Placing your order...');
    const docRef = await db.collection('orders').add(order);
    hideLoadingToast();
    clearCart();
    showToast('🎉 Order placed! Your order #' + order.orderNumber, 'success', 5000);
    return { id: docRef.id, ...order };
  } catch (err) {
    hideLoadingToast();
    showToast('Failed to place order. Please try again.', 'error');
    console.error(err);
    return null;
  }
}

function generateOrderNumber() {
  const now = new Date();
  return `BH${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}-${Math.floor(Math.random()*900+100)}`;
}

// ---- QR Code Generation ----
function generateQRCodeURL(tableNumber) {
  const url = encodeURIComponent(`${window.location.origin}/menu.html?table=${tableNumber}`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${url}&color=2C1B12&bgcolor=F5F5F5`;
}

// Init on load
document.addEventListener('DOMContentLoaded', updateCartBadge);

window.getCart = getCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.getCartTotal = getCartTotal;
window.getCartCount = getCartCount;
window.placeOrder = placeOrder;
window.generateQRCodeURL = generateQRCodeURL;
window.generateOrderNumber = generateOrderNumber;
