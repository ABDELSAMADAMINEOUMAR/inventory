/* =============================================
   AUTH.JS — Authentication Module
   Smart Import & Sales Management System
   ============================================= */

const Auth = (() => {
  const SESSION_KEY = 'sims_session';

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }

  function setSession(user) {
    const { passwordHash, ...safe } = user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(safe));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function currentUser() {
    return getSession();
  }

  async function login(email, password) {
    const users = DB.getAll('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) return { success: false, message: 'No account found with this email.' };

    const hash = await DB.hashPassword(password);
    if (hash !== user.passwordHash) return { success: false, message: 'Incorrect password.' };

    setSession(user);
    return { success: true, user };
  }

  async function register(name, business, email, password) {
    if (!name || !email || !password) {
      return { success: false, message: 'Please fill in all required fields.' };
    }
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    const users = DB.getAll('users');
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return { success: false, message: 'An account already exists with this email address.' };
    }

    const pwHash = await DB.hashPassword(password);
    const newUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: pwHash,
      role: 'admin',
      phone: '',
      business: business?.trim() || 'My Business',
      currency: 'FCFA',
      createdAt: new Date().toISOString()
    };

    const inserted = DB.insert('users', newUser);
    setSession(inserted);
    return { success: true, user: inserted };
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  async function changePassword(currentPwd, newPwd) {
    const user = getSession();
    if (!user) return { success: false, message: 'Not logged in.' };

    const fullUser = DB.getById('users', user.id);
    const currentHash = await DB.hashPassword(currentPwd);
    if (currentHash !== fullUser.passwordHash) return { success: false, message: 'Current password is incorrect.' };

    const newHash = await DB.hashPassword(newPwd);
    DB.update('users', user.id, { passwordHash: newHash });
    return { success: true };
  }

  async function updateProfile(data) {
    const user = getSession();
    if (!user) return { success: false, message: 'Not logged in.' };
    const updated = DB.update('users', user.id, data);
    setSession(updated);
    return { success: true, user: updated };
  }

  /** Guard — redirect to login if not authenticated */
  function requireAuth() {
    if (!isLoggedIn()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  return { login, register, logout, isLoggedIn, currentUser, requireAuth, changePassword, updateProfile };
})();
