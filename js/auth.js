/* =============================================
   AUTH.JS — Authentication Module
   Smart Import & Sales Management System
   ============================================= */

const Auth = (() => {
  const SESSION_KEY = 'sims_session';

  function getSession() {
    try {
      const s = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    }
    catch { return null; }
  }

  function setSession(user) {
    const { passwordHash, ...safe } = user;
    const str = JSON.stringify(safe);
    sessionStorage.setItem(SESSION_KEY, str);
    localStorage.setItem(SESSION_KEY, str);
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('sims_token');
    sessionStorage.removeItem('sims_refresh');
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('sims_token');
    localStorage.removeItem('sims_refresh');
    // Wipe all cached tenant data tables immediately upon session termination
    if (typeof DB !== 'undefined' && typeof DB.clearTenantCache === 'function') {
      try { DB.clearTenantCache(); } catch(e) {}
    } else {
      // Fallback: prefix-based nuclear wipe if DB module isn't loaded yet
      const PREFIX = 'sims_';
      const KEEP = new Set([PREFIX + 'lang']);
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX) && !KEEP.has(k)) keysToRemove.push(k);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      const ssKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(PREFIX) && !KEEP.has(k)) ssKeys.push(k);
      }
      ssKeys.forEach(k => sessionStorage.removeItem(k));
    }
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function currentUser() {
    return getSession();
  }

  function getTenantId() {
    return typeof DB !== 'undefined' && DB.getTenantId ? DB.getTenantId() : null;
  }
  async function login(email, password) {
    const ident = (email || '').toLowerCase().trim();

    // ── Path 1: Server-verified JWT login (REQUIRED when API is reachable) ──
    if (typeof ApiClient !== 'undefined') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(`${ApiClient.BASE_URL}auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          sessionStorage.setItem('sims_token', data.access);
          sessionStorage.setItem('sims_refresh', data.refresh);
          localStorage.setItem('sims_token', data.access);
          localStorage.setItem('sims_refresh', data.refresh);

          const payload = JSON.parse(atob(data.access.split('.')[1]));
          const user = {
            id: payload.user_id || payload.id || 1,
            email: payload.email || email.trim(),
            name: payload.name || email.split('@')[0],
            role: payload.role || 'admin',
            company_id: payload.company_id || null,
            company_name: payload.role === 'platform_owner' ? 'Platform Super Owner' : 'Tenant Company',
            currency: data.currency || payload.currency || 'FCFA',
            is_active: true,
            must_change_password: data.must_change_password || payload.must_change_password || false,
            token: data.access,
            refreshToken: data.refresh
          };
          if (user.role === 'platform_owner' || user.email === 'abdouamine@gmail.com') {
            user.role = 'platform_owner';
            user.name = 'Platform Super Owner';
            user.company_name = 'SaaS Platform';
          }
          setSession(user);
          return { success: true, user, must_change_password: user.must_change_password };
        } else {
          // Server explicitly rejected the credentials — hard-fail, never fall through
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData.detail || 'Invalid email or password.' };
        }
      } catch (e) {
        // Only allow fallback to offline auth for genuine network failures.
        // AbortError = timeout, TypeError "Failed to fetch" = network unreachable.
        // Anything else (e.g. malformed response) is treated as a hard failure.
        const isNetworkError = (
          e.name === 'AbortError' ||
          (e instanceof TypeError && /failed to fetch|network/i.test(e.message))
        );
        if (!isNetworkError) {
          console.error('Login failed with unexpected error:', e);
          return { success: false, message: 'Login failed. Please try again.' };
        }
        console.warn('API unreachable (network error or timeout). No offline login available.');
        return { success: false, message: 'Cannot reach the server. Please check your internet connection and try again.' };
      }
    }

    // If ApiClient module isn't even loaded, the app is misconfigured
    return { success: false, message: 'Application error: authentication module not loaded. Please refresh the page.' };
  }

  async function register(name, business, email, password) {
    if (!name || !email || !password) {
      return { success: false, message: 'Please fill in all required fields.' };
    }
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    let users = [];
    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try { users = await ApiClient.getAll('users'); } catch { users = typeof DB !== 'undefined' && DB.getRawAll ? DB.getRawAll('users') : DB.getAll('users'); }
    } else {
      users = typeof DB !== 'undefined' && DB.getRawAll ? DB.getRawAll('users') : DB.getAll('users');
    }
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return { success: false, message: 'this email has already an account' };
    }

    const pwHash = await DB.hashPassword(password);
    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: pwHash,
      password_hash: pwHash,
      role: 'admin',
      phone: '',
      business: business?.trim() || 'My Business',
      currency: 'RWF',
      createdAt: new Date().toISOString()
    };

    let inserted = null;
    try {
      inserted = await DB.insert('users', newUser);
    } catch (e) {
      return { success: false, message: e.message || 'Registration failed.' };
    }

    setSession(inserted || newUser);
    return { success: true, user: inserted || newUser };
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  let _expiredHandled = false;
  function handleExpiredSession() {
    if (_expiredHandled) return;
    const sess = getSession();
    if (sess && (sess.role === 'platform_owner' || sess.email?.toLowerCase() === 'abdouamine@gmail.com' || sess.username?.toLowerCase() === 'abdouamine@gmail.com' || sess.username?.toLowerCase() === 'abdouamine')) return;
    _expiredHandled = true;
    clearSession();
    try {
      localStorage.setItem('sims_session_expired_notice', '1');
    } catch {}
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('reset-password.html') && !window.location.pathname.endsWith('verify-email.html')) {
      window.location.href = 'index.html';
    } else if (typeof window !== 'undefined' && window.location.pathname.endsWith('index.html')) {
      window.location.reload();
    }
  }

  async function changePassword(currentPwd, newPwd) {
    const user = getSession();
    if (!user) return { success: false, message: 'Not logged in.' };

    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        const token = sessionStorage.getItem('sims_token');
        if (token) {
          const apiRes = await fetch(`${ApiClient.BASE_URL}auth/change-password/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ old_password: currentPwd, new_password: newPwd })
          });
          if (!apiRes.ok) {
            const errData = await apiRes.json();
            return { success: false, message: errData.detail || 'Failed to update password.' };
          }
          try {
            if (typeof DB !== 'undefined') {
              const newHash = await DB.hashPassword(newPwd);
              await DB.update('users', user.id, { passwordHash: newHash, password_hash: newHash, password: null });
            }
          } catch (err) {
            console.error('Failed to update local password hash after API success', err);
          }
          return { success: true };
        }
      } catch (e) {}
    }

    let fullUser = DB.getById('users', user.id) || user;
    const currentHash = await DB.hashPassword(currentPwd);
    const storedHash = fullUser.passwordHash || fullUser.password_hash;
    if (currentHash !== storedHash) return { success: false, message: 'Current password is incorrect.' };

    const newHash = await DB.hashPassword(newPwd);
    try {
      await DB.update('users', user.id, { passwordHash: newHash, password_hash: newHash, password: null });
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update password.' };
    }
    return { success: true };
  }

  async function updateProfile(data) {
    const user = getSession();
    if (!user) return { success: false, message: 'Not logged in.' };
    let updated;
    try {
      updated = await DB.update('users', user.id, data);
      if (data.currency && (user.company_id || user.company)) {
        try { DB.update('companies', user.company_id || user.company, { currency: data.currency }); } catch {}
        if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth() && user.role !== 'platform_owner') {
          const token = sessionStorage.getItem('sims_token');
          if (token) {
            fetch(`${ApiClient.BASE_URL}settings/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ currency: data.currency, name: data.business || user.company_name || user.business })
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      return { success: false, message: e.message || 'Failed to update profile.' };
    }
    setSession(updated);
    return { success: true, user: updated };
  }

  /** Guard — redirect to login or activation if not authenticated/verified */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    const user = currentUser();
    const isUnverified = user && user.is_active === false;
    if (isUnverified) {
      clearSession();
      window.location.href = 'index.html';
      return false;
    }
    const isMaster = user && (user.role === 'platform_owner' || user.email === 'abdouamine@gmail.com');
    const needsChange = !isMaster && user && user.must_change_password === true;
    if (needsChange) {
      window.location.href = `verify-email.html?uid=${user.id || 1}&token=force_change&email=${encodeURIComponent(user.email)}`;
      return false;
    }
    return true;
  }

  function isOwner() {
    const user = currentUser();
    return user && (user.role === 'platform_owner' || user.role === 'owner');
  }

  return { login, register, logout, handleExpiredSession, isLoggedIn, currentUser, isOwner, getTenantId, requireAuth, changePassword, updateProfile };
})();


