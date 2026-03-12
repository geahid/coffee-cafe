// ============================================================
// AUTH.JS — Firebase Authentication Handler
// ============================================================

// ---- State ----
let recaptchaVerifier = null;
let confirmationResult = null;

// ---- Auth State Observer ----
auth.onAuthStateChanged((user) => {
  updateNavUI(user);
  if (user) {
    saveUserToFirestore(user);
  }
});

function updateNavUI(user) {
  const loginLinks = document.querySelectorAll('.nav-login-link');
  const profileLinks = document.querySelectorAll('.nav-profile-link');
  const userDisplays = document.querySelectorAll('.user-display-name');
  const userAvatars = document.querySelectorAll('.user-avatar');

  if (user) {
    loginLinks.forEach(el => el.style.display = 'none');
    profileLinks.forEach(el => el.style.display = 'flex');
    userDisplays.forEach(el => el.textContent = user.displayName || user.email || 'User');
    userAvatars.forEach(el => {
      if (user.photoURL) {
        el.src = user.photoURL;
        el.style.display = 'block';
      }
    });
  } else {
    loginLinks.forEach(el => el.style.display = 'flex');
    profileLinks.forEach(el => el.style.display = 'none');
  }
}

async function saveUserToFirestore(user) {
  try {
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      phoneNumber: user.phoneNumber || null,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('Error saving user:', e);
  }
}

// ---- Google Sign In ----
async function signInWithGoogle() {
  try {
    showLoadingToast('Signing in with Google...');
    const result = await auth.signInWithPopup(googleProvider);
    showToast('Welcome, ' + (result.user.displayName || 'User') + '! ☕', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  } catch (err) {
    showToast(getAuthError(err.code), 'error');
  }
}

// ---- Email/Password Sign Up ----
async function signUpWithEmail(email, password, displayName) {
  try {
    showLoadingToast('Creating your account...');
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName });
    showToast('Account created! Welcome to Brewhaus ☕', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  } catch (err) {
    showToast(getAuthError(err.code), 'error');
  }
}

// ---- Email/Password Sign In ----
async function signInWithEmail(email, password) {
  try {
    showLoadingToast('Signing you in...');
    const result = await auth.signInWithEmailAndPassword(email, password);
    showToast('Welcome back! ☕', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  } catch (err) {
    showToast(getAuthError(err.code), 'error');
  }
}

// ---- Phone OTP ----
function initRecaptcha(containerId) {
  if (recaptchaVerifier) recaptchaVerifier.clear();
  recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
    size: 'invisible',
    callback: () => {}
  });
}

async function sendOTP(phoneNumber) {
  try {
    showLoadingToast('Sending verification code...');
    if (!recaptchaVerifier) initRecaptcha('recaptcha-container');
    confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
    showToast('OTP sent to ' + phoneNumber + '!', 'success');
    return true;
  } catch (err) {
    showToast(getAuthError(err.code) || 'Failed to send OTP', 'error');
    if (recaptchaVerifier) { recaptchaVerifier.clear(); recaptchaVerifier = null; }
    return false;
  }
}

async function verifyOTP(code) {
  try {
    showLoadingToast('Verifying code...');
    const result = await confirmationResult.confirm(code);
    showToast('Phone verified! Welcome ☕', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  } catch (err) {
    showToast('Invalid code. Please try again.', 'error');
  }
}

// ---- Sign Out ----
async function signOut() {
  try {
    await auth.signOut();
    showToast('Signed out. See you next time! ☕', 'info');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
  } catch (err) {
    showToast('Error signing out', 'error');
  }
}

// ---- Error Messages ----
function getAuthError(code) {
  const errors = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/invalid-phone-number': 'Invalid phone number format. Use +[country][number].',
    'auth/quota-exceeded': 'SMS quota exceeded. Try email login.',
  };
  return errors[code] || 'Authentication error. Please try again.';
}

// ---- Toast Notifications ----
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', loading: '⟳' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  if (type !== 'loading') {
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
  return toast;
}

function showLoadingToast(message) {
  const existing = document.querySelector('.toast-loading');
  if (existing) existing.remove();
  return showToast(message, 'loading');
}

function hideLoadingToast() {
  const loading = document.querySelector('.toast-loading');
  if (loading) {
    loading.classList.remove('show');
    setTimeout(() => loading.remove(), 400);
  }
}

window.signInWithGoogle = signInWithGoogle;
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.signOut = signOut;
window.showToast = showToast;
window.showLoadingToast = showLoadingToast;
window.hideLoadingToast = hideLoadingToast;
