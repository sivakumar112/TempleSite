(function () {
  const API = '/api';
  let sessionId = localStorage.getItem('temple_session_id') || '';
  let username = localStorage.getItem('temple_username') || '';

  function showLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
  }

  function hideLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
  }

  function updateUI() {
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const userEl = document.getElementById('user-name');
    if (sessionId && username) {
      if (btnLogin) btnLogin.classList.add('hidden');
      if (btnLogout) btnLogout.classList.remove('hidden');
      if (userEl) { userEl.textContent = username; userEl.classList.remove('hidden'); }
    } else {
      if (btnLogin) btnLogin.classList.remove('hidden');
      if (btnLogout) btnLogout.classList.add('hidden');
      if (userEl) userEl.classList.add('hidden');
    }
  }

  function setSession(sid, user) {
    sessionId = sid;
    username = user;
    localStorage.setItem('temple_session_id', sid);
    localStorage.setItem('temple_username', user);
    updateUI();
  }

  function clearSession() {
    sessionId = '';
    username = '';
    localStorage.removeItem('temple_session_id');
    localStorage.removeItem('temple_username');
    updateUI();
  }

  // ─── Login form handler ─────────────────────────────────────────────────────
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      e.stopPropagation();

      const userInput = document.getElementById('login-username');
      const passInput = document.getElementById('login-password');
      const user = userInput ? userInput.value.trim() : '';
      const pass = passInput ? passInput.value : '';

      if (!user || !pass) {
        alert('Please enter both username and password.');
        return;
      }

      try {
        const res = await fetch(API + '/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        if (data.success) {
          setSession(data.sessionId, data.username);
          hideLoginModal();
          if (passInput) passInput.value = '';
        } else {
          alert(data.message || 'Login failed. Check username/password.');
        }
      } catch (err) {
        console.error('Login error:', err);
        alert('Login failed: ' + (err.message || 'Network error'));
      }
    });
  }

  // ─── Open/close modal ───────────────────────────────────────────────────────
  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) btnLogin.addEventListener('click', showLoginModal);

  const loginClose = document.getElementById('login-close');
  if (loginClose) loginClose.addEventListener('click', hideLoginModal);

  // Close modal when clicking outside
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    loginModal.addEventListener('click', function (e) {
      if (e.target === loginModal) hideLoginModal();
    });
  }

  // ─── Logout ─────────────────────────────────────────────────────────────────
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async function () {
      try {
        await fetch(API + '/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
      } catch (_) {}
      clearSession();
    });
  }

  // ─── Google Sign-In (wrapped in try-catch — GSI script may fail) ────────────
  try {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
        callback: function (response) {
          try {
            const idToken = response.credential;
            const payload = JSON.parse(atob(idToken.split('.')[1]));
            const name = payload.name || payload.email || 'Google User';
            const email = payload.email || '';
            fetch(API + '/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_token: idToken, name: name, email: email })
            })
              .then(r => r.json())
              .then(data => {
                if (data.success) { setSession(data.sessionId, data.username); hideLoginModal(); }
              })
              .catch(() => alert('Google sign-in failed'));
          } catch (e) {
            console.error('Google credential error:', e);
          }
        }
      });
      const gsiBtn = document.getElementById('google-signin-btn');
      if (gsiBtn && gsiBtn.children.length === 0) {
        google.accounts.id.renderButton(gsiBtn, { theme: 'filled_black', size: 'medium', type: 'standard', text: 'signin_with' });
      }
    } else {
      throw new Error('GSI not available');
    }
  } catch (_) {
    // Google Sign-In not available — show mock demo button
    const gsiBtn = document.getElementById('google-signin-btn');
    if (gsiBtn && gsiBtn.children.length === 0) {
      const mockBtn = document.createElement('button');
      mockBtn.type = 'button';
      mockBtn.className = 'btn btn-outline';
      mockBtn.innerHTML = '<i class="fab fa-google"></i> Sign in with Google (demo)';
      mockBtn.addEventListener('click', function () {
        fetch(API + '/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Google User', email: 'user@gmail.com' })
        })
          .then(r => r.json())
          .then(data => {
            if (data.success) { setSession(data.sessionId, data.username); hideLoginModal(); }
          })
          .catch(() => alert('Demo login failed'));
      });
      gsiBtn.appendChild(mockBtn);
    }
  }

  // ─── Check existing session on page load ────────────────────────────────────
  async function checkSession() {
    if (!sessionId) { updateUI(); return; }
    try {
      const res = await fetch(API + '/me?sessionId=' + encodeURIComponent(sessionId));
      const data = await res.json();
      if (!data.loggedIn) clearSession();
      else updateUI();
    } catch {
      updateUI();
    }
  }

  checkSession();
  updateUI();

  window.getSessionId = function () { return sessionId; };
  window.getUsername = function () { return username; };
  window.isLoggedIn = function () { return !!sessionId; };
})();
