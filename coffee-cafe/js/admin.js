// ============================================================
// ADMIN.JS — Staff Dashboard with Real-time Orders
// ============================================================
const ADMIN_EMAILS = ['your-staff@email.com', 'another-staff@email.com'];
const ADMIN_EMAILS = ['admin@brewhaus.com']; // Add your admin emails here
let unsubscribeOrders = null;
let audioEnabled = false;

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  initAdminControls();
  initAudio();
});

function checkAdminAuth() {
  auth.onAuthStateChanged(user => {
    const loader = document.getElementById('admin-auth-loader');
    const dashboard = document.getElementById('admin-dashboard');
    const loginPrompt = document.getElementById('admin-login-prompt');

    // For demo: allow any logged-in user. In production, check ADMIN_EMAILS
    if (user) {
      if (loader) loader.style.display = 'none';
      if (dashboard) dashboard.style.display = 'block';
      if (loginPrompt) loginPrompt.style.display = 'none';
      startListeningOrders();
      updateAdminHeader(user);
    } else {
      if (loader) loader.style.display = 'none';
      if (dashboard) dashboard.style.display = 'none';
      if (loginPrompt) loginPrompt.style.display = 'flex';
    }
  });
}

function updateAdminHeader(user) {
  const nameEl = document.getElementById('admin-user-name');
  if (nameEl) nameEl.textContent = user.displayName || user.email || 'Staff';
}

// ---- Real-time Order Listener ----
function startListeningOrders() {
  if (unsubscribeOrders) unsubscribeOrders();

  const statusFilter = document.getElementById('status-filter')?.value || 'all';
  let query = db.collection('orders').orderBy('timestamp', 'desc').limit(50);

  if (statusFilter !== 'all') {
    query = db.collection('orders')
      .where('status', '==', statusFilter)
      .orderBy('timestamp', 'desc')
      .limit(50);
  }

  unsubscribeOrders = query.onSnapshot(snapshot => {
    const orders = [];
    snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));

    // Detect new orders for notification
    if (!snapshot.metadata.hasPendingWrites) {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' && change.doc.data().status === 'pending') {
          const isNew = !change.doc.metadata.fromCache;
          if (isNew) {
            playNotificationSound();
            showToast(`🔔 New order from ${change.doc.data().customerName}!`, 'info', 5000);
            if (Notification.permission === 'granted') {
              new Notification('New Order at Brewhaus!', {
                body: `Order from ${change.doc.data().customerName}`,
                icon: '☕'
              });
            }
          }
        }
      });
    }

    renderOrders(orders);
    updateStats(orders);
  }, err => {
    console.error('Orders listener error:', err);
    showToast('Failed to load orders. Check connection.', 'error');
  });
}

// ---- Render Orders ----
function renderOrders(orders) {
  const grid = document.getElementById('orders-grid');
  const emptyState = document.getElementById('empty-orders');
  if (!grid) return;

  if (orders.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  grid.innerHTML = orders.map(order => {
    const time = order.timestamp?.toDate ? order.timestamp.toDate() : new Date();
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const statusConfig = {
      pending: { label: 'Pending', color: '#F59E0B', icon: '⏳' },
      accepted: { label: 'Accepted', color: '#3B82F6', icon: '✅' },
      preparing: { label: 'Preparing', color: '#8B5CF6', icon: '☕' },
      ready: { label: 'Ready', color: '#10B981', icon: '🔔' },
      completed: { label: 'Completed', color: '#6B7280', icon: '✓' }
    };
    const s = statusConfig[order.status] || statusConfig.pending;

    return `
    <div class="order-card order-${order.status}" id="order-${order.id}">
      <div class="order-card-header">
        <div class="order-header-left">
          <span class="order-number">#${order.orderNumber || order.id.slice(-6).toUpperCase()}</span>
          <span class="order-table">${order.tableOrPickup}</span>
        </div>
        <div class="order-header-right">
          <span class="order-status-badge" style="background:${s.color}20;color:${s.color};border:1px solid ${s.color}40">
            ${s.icon} ${s.label}
          </span>
        </div>
      </div>
      <div class="order-customer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ${order.customerName}
      </div>
      <div class="order-items">
        ${order.items.map(i => `
          <div class="order-item-row">
            <span>${i.emoji} ${i.name}</span>
            <span class="order-item-qty">×${i.quantity}</span>
            <span class="order-item-price">$${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
        ${order.note ? `<div class="order-note">📝 ${order.note}</div>` : ''}
      </div>
      <div class="order-card-footer">
        <div class="order-meta">
          <span class="order-time">${dateStr} ${timeStr}</span>
          <span class="order-total">$${order.totalPrice.toFixed(2)}</span>
        </div>
        <div class="order-actions">
          ${getOrderActions(order)}
        </div>
      </div>
    </div>`;
  }).join('');
}

function getOrderActions(order) {
  const actions = {
    pending: [
      { label: '✅ Accept', status: 'accepted', cls: 'btn-accept' },
      { label: '✕ Cancel', status: 'cancelled', cls: 'btn-cancel' }
    ],
    accepted: [
      { label: '☕ Start Preparing', status: 'preparing', cls: 'btn-prepare' }
    ],
    preparing: [
      { label: '🔔 Mark Ready', status: 'ready', cls: 'btn-ready' }
    ],
    ready: [
      { label: '✓ Complete', status: 'completed', cls: 'btn-complete' }
    ],
    completed: [],
    cancelled: []
  };
  return (actions[order.status] || []).map(a =>
    `<button class="order-btn ${a.cls}" onclick="updateOrderStatus('${order.id}', '${a.status}')">${a.label}</button>`
  ).join('');
}

// ---- Update Order Status ----
async function updateOrderStatus(orderId, newStatus) {
  try {
    await db.collection('orders').doc(orderId).update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    const labels = { accepted: 'Order Accepted ✅', preparing: 'Now Preparing ☕', ready: 'Order Ready 🔔', completed: 'Order Completed ✓', cancelled: 'Order Cancelled' };
    showToast(labels[newStatus] || 'Status updated', 'success', 2500);

    // Animate the card
    const card = document.getElementById(`order-${orderId}`);
    if (card) {
      card.style.transform = 'scale(0.98)';
      setTimeout(() => card.style.transform = '', 300);
    }
  } catch (err) {
    showToast('Failed to update order status', 'error');
    console.error(err);
  }
}

// ---- Stats ----
function updateStats(orders) {
  const today = new Date();
  today.setHours(0,0,0,0);

  const todayOrders = orders.filter(o => {
    const t = o.timestamp?.toDate ? o.timestamp.toDate() : new Date(0);
    return t >= today;
  });

  const pending = orders.filter(o => o.status === 'pending').length;
  const preparing = orders.filter(o => ['accepted','preparing'].includes(o.status)).length;
  const completed = todayOrders.filter(o => o.status === 'completed').length;
  const revenue = todayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalPrice, 0);

  setStatEl('stat-pending', pending);
  setStatEl('stat-preparing', preparing);
  setStatEl('stat-completed', completed);
  setStatEl('stat-revenue', '$' + revenue.toFixed(2));
}

function setStatEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ---- Controls ----
function initAdminControls() {
  const filter = document.getElementById('status-filter');
  if (filter) {
    filter.addEventListener('change', () => {
      if (auth.currentUser) startListeningOrders();
    });
  }

  const notifBtn = document.getElementById('request-notif-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      Notification.requestPermission().then(perm => {
        showToast(perm === 'granted' ? '🔔 Notifications enabled!' : 'Notifications blocked', perm === 'granted' ? 'success' : 'error');
      });
    });
  }

  // QR code generator
  const qrBtn = document.getElementById('generate-qr-btn');
  const qrTableInput = document.getElementById('qr-table-input');
  const qrDisplay = document.getElementById('qr-display');
  if (qrBtn && qrTableInput && qrDisplay) {
    qrBtn.addEventListener('click', () => {
      const table = qrTableInput.value.trim();
      if (!table) { showToast('Enter a table number', 'error'); return; }
      const url = generateQRCodeURL(table);
      qrDisplay.innerHTML = `
        <img src="${url}" alt="QR Code for Table ${table}" />
        <p>Table ${table} — Scan to order</p>
        <a href="${url}" download="table-${table}-qr.png" class="btn-download-qr">Download QR</a>
      `;
      qrDisplay.style.display = 'block';
    });
  }
}

// ---- Audio Notification ----
function initAudio() {
  const audioBtn = document.getElementById('audio-toggle');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      audioBtn.textContent = audioEnabled ? '🔔 Sound On' : '🔕 Sound Off';
      audioBtn.classList.toggle('active', audioEnabled);
    });
  }
}

function playNotificationSound() {
  if (!audioEnabled) return;
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } catch (e) {}
}

window.updateOrderStatus = updateOrderStatus;
