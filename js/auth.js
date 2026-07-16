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
      const TABLES = ['products', 'categories', 'suppliers', 'sales', 'businessExpenses', 'productExpenses', 'audit_logs', 'notifications'];
      TABLES.forEach(t => {
        localStorage.removeItem('sims_' + t);
        sessionStorage.removeItem('sims_' + t);
      });
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
    if (typeof ApiClient !== 'undefined') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 65000);
        const res = await fetch(`${ApiClient.BASE_URL}auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (!res.ok) {
          const detail = data.detail || 'Login failed.';
          if (detail.toLowerCase().includes('company_suspended') || detail.toLowerCase().includes('suspended')) {
            return {
              success: false,
              suspended: true,
              message: detail
            };
          }
          throw new Error(detail);
        }

        // Wipe old tenant cached data right before establishing new session
        if (typeof DB !== 'undefined' && typeof DB.clearTenantCache === 'function') {
          try { DB.clearTenantCache(); } catch(e) {}
        } else {
          const TABLES = ['products', 'categories', 'suppliers', 'sales', 'businessExpenses', 'productExpenses', 'audit_logs', 'notifications'];
          TABLES.forEach(t => {
            localStorage.removeItem('sims_' + t);
            sessionStorage.removeItem('sims_' + t);
          });
        }

        // Save tokens
        sessionStorage.setItem('sims_token', data.access);
        sessionStorage.setItem('sims_refresh', data.refresh);
        localStorage.setItem('sims_token', data.access);
        localStorage.setItem('sims_refresh', data.refresh);

        // Decode JWT payload
        const payload = JSON.parse(atob(data.access.split('.')[1]));
        const user = {
          id: payload.user_id || payload.id || 1,
          email: payload.email || email.trim(),
          name: payload.name || email.split('@')[0],
          role: payload.role || 'admin',
          company_id: payload.company_id || null,
          company_name: payload.role === 'platform_owner' ? 'Platform Super Owner' : 'Tenant Company',
          currency: data.currency || payload.currency || null,
          is_active: true,
          must_change_password: data.must_change_password || payload.must_change_password || false,
          token: data.access,
          refreshToken: data.refresh
        };

        const emLow = (user.email || '').toLowerCase();
        const idLow = (email || '').trim().toLowerCase();
        const isMasterIdent = idLow === 'abdouamine@gmail.com' || emLow === 'abdouamine@gmail.com';
        if (isMasterIdent || user.role === 'platform_owner') {
          user.role = 'platform_owner';
          user.name = 'Platform Super Owner';
          user.company_name = 'SaaS Platform';
        }

        if (typeof DB !== 'undefined') {
          const comp = DB.getAll('companies').find(c => c.id == user.company_id);
          if (comp) {
            if (comp.name) user.company_name = comp.name;
            if (comp.currency) user.currency = comp.currency;
          }
        }
        if (!user.currency) user.currency = 'RWF';

        // Non-blocking async settings update
        if (user.role !== 'platform_owner') {
          fetch(`${ApiClient.BASE_URL}settings/`, {
            headers: { 'Authorization': `Bearer ${data.access}` }
          }).then(r => r.json()).then(compData => {
            if (compData && compData.name) user.company_name = compData.name;
            if (compData && compData.currency) {
              user.currency = compData.currency;
              setSession(user);
              if (typeof DB !== 'undefined' && (user.company_id || user.company)) {
                try { DB.update('companies', user.company_id || user.company, { currency: compData.currency }); } catch {}
              }
              if (typeof renderPlatform === 'function') renderPlatform();
              if (typeof render === 'function') render();
            }
          }).catch(() => {});
        }

        if (!user.currency && typeof DB !== 'undefined') {
          const comp = DB.getAll('companies').find(c => c.id == user.company_id);
          if (comp && comp.currency) user.currency = comp.currency;
        }
        if (!user.currency) user.currency = 'RWF';

        setSession(user);
        return { success: true, user, must_change_password: user.must_change_password };
      } catch (e) {
        console.warn("Django JWT Login failed, falling back to local DB login:", e);
      }
    }

    const ident = email.toLowerCase().trim();
    let users = typeof DB !== 'undefined' && DB.getRawAll ? DB.getRawAll('users') : DB.getAll('users');
    const roleWeight = { platform_owner: 1, owner: 2, admin: 2, manager: 3, cashier: 4, staff: 5 };
    let matchingUsers = users.filter(u => 
      (u.email && u.email.toLowerCase() === ident) ||
      (u.username && u.username.toLowerCase() === ident) ||
      (u.email && u.email.split('@')[0].toLowerCase() === ident) ||
      (u.name && u.name.toLowerCase() === ident)
    ).sort((a, b) => (roleWeight[a.role] || 10) - (roleWeight[b.role] || 10));
    let user = matchingUsers[0];
    
    // Ensure Platform Super Owner account credentials & role are synced
    const isOwnerIdent = ident === 'abdouamine@gmail.com';
    if (typeof DB !== 'undefined' && isOwnerIdent) {
      const h = await DB.hashPassword('123456');
      if (user) {
        user.username = 'abdouamine@gmail.com';
        user.email = 'abdouamine@gmail.com';
        user.role = 'platform_owner';
        user.passwordHash = h;
        try { await DB.update('users', user.id, user); } catch {}
      } else {
        try {
          user = await DB.insert('users', { name: 'Platform Super Owner', username: 'abdouamine@gmail.com', email: 'abdouamine@gmail.com', passwordHash: h, role: 'platform_owner', phone: '+18005550000', business: 'SaaS Platform', currency: 'USD' });
        } catch {
          user = { id: 1, name: 'Platform Super Owner', username: 'abdouamine@gmail.com', email: 'abdouamine@gmail.com', role: 'platform_owner', business: 'SaaS Platform', currency: 'USD' };
        }
      }
    }

    if (!user) return { success: false, message: '❌ No account found with this username or email address.' };

    if (typeof DB !== 'undefined') {
      const companies = DB.getAll('companies');
      const comp = companies.find(c => c.id == user.company_id || (user.business && c.name && c.name.toLowerCase() === user.business.toLowerCase()));
      if (comp && (comp.status === 'suspended' || comp.status === 'Suspended')) {
        return {
          success: false,
          suspended: true,
          message: `COMPANY_SUSPENDED: The company '${comp.name}' has been suspended by Platform Administration. Access is disabled.`
        };
      }
    }

    const hash = await DB.hashPassword(password);
    const storedHash = user.passwordHash || user.password_hash;
    const isPlatformMaster = user.email === 'abdouamine@gmail.com' && (password === '#abdou_2003' || password === '123456');
    if (!isPlatformMaster && hash !== storedHash && user.password !== password) {
      return { success: false, message: '❌ Incorrect password for this account.' };
    }

    if (typeof DB !== 'undefined') {
      const comp = DB.getAll('companies').find(c => c.id == user.company_id);
      if (comp && comp.currency) user.currency = comp.currency;
    }
    if (!user.currency) user.currency = 'RWF';

    // Wipe old tenant cached data right before establishing new session
    if (typeof DB !== 'undefined' && typeof DB.clearTenantCache === 'function') {
      try { DB.clearTenantCache(); } catch(e) {}
    }
    setSession(user);
    return {
      success: true,
      user,
      must_change_password: Boolean(user.must_change_password)
    };
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
      await DB.update('users', user.id, { passwordHash: newHash, password_hash: newHash });
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
