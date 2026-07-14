/* =============================================
   API_CLIENT.JS — Django REST API Client Layer
   Smart Import & Sales Management System
   ============================================= */

const ApiClient = (() => {
  const BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:')
    ? 'http://127.0.0.1:8000/api/'
    : 'https://inventory-ts07.onrender.com/api/';

  // Helper to get JWT token from storage
  function _getToken() {
    try {
      let token = sessionStorage.getItem('sims_token');
      if (token && token !== 'undefined' && token !== 'null') return token;

      try {
        const sess = JSON.parse(sessionStorage.getItem('sims_session') || 'null');
        token = sess ? (sess.token || sess.access) : null;
        if (token && token !== 'undefined' && token !== 'null') return token;
      } catch {}

      if (typeof Auth !== 'undefined' && Auth.currentUser()) {
        const u = Auth.currentUser();
        token = u.token || u.access;
        if (token && token !== 'undefined' && token !== 'null') return token;
      }

      token = localStorage.getItem('sims_token');
      if (token && token !== 'undefined' && token !== 'null') return token;

      try {
        const lsess = JSON.parse(localStorage.getItem('sims_auth_session') || 'null');
        token = lsess ? (lsess.token || lsess.access) : null;
        if (token && token !== 'undefined' && token !== 'null') return token;
      } catch {}

      return null;
    } catch { return null; }
  }

  let _isRefreshing = false;
  let _refreshPromise = null;

  async function _refreshToken() {
    if (_isRefreshing && _refreshPromise) {
      return await _refreshPromise;
    }
    const refreshToken = sessionStorage.getItem('sims_refresh') || localStorage.getItem('sims_refresh');
    if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
      return null;
    }
    _isRefreshing = true;
    _refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        });
        if (!res.ok) {
          return null;
        }
        const data = await res.json();
        if (data && data.access) {
          sessionStorage.setItem('sims_token', data.access);
          localStorage.setItem('sims_token', data.access);
          if (data.refresh) {
            sessionStorage.setItem('sims_refresh', data.refresh);
            localStorage.setItem('sims_refresh', data.refresh);
          }
          return data.access;
        }
        return null;
      } catch {
        return null;
      } finally {
        _isRefreshing = false;
        _refreshPromise = null;
      }
    })();
    return await _refreshPromise;
  }

  // Helper for HTTP requests
  async function _request(endpoint, method = 'GET', data = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = _getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    config.signal = controller.signal;

    try {
      let response = await fetch(`${BASE_URL}${endpoint}/`, config);
      clearTimeout(timeoutId);

      if (response.status === 401 && _getToken()) {
        const newToken = await _refreshToken();
        if (newToken) {
          config.headers['Authorization'] = `Bearer ${newToken}`;
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 15000);
          config.signal = retryController.signal;
          response = await fetch(`${BASE_URL}${endpoint}/`, config);
          clearTimeout(retryTimeoutId);
        } else {
          if (typeof Auth !== 'undefined' && Auth.handleExpiredSession) {
            Auth.handleExpiredSession();
          } else if (typeof Auth !== 'undefined' && Auth.logout) {
            Auth.logout();
          } else {
            sessionStorage.clear();
            localStorage.removeItem('sims_session');
            localStorage.removeItem('sims_token');
            localStorage.removeItem('sims_refresh');
            if (window.location.pathname.endsWith('app.html')) {
              window.location.href = 'index.html';
            }
          }
          throw new Error('Session expired. Please sign in again.');
        }
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let errMsg = errData.detail;
        if (!errMsg && typeof errData === 'object' && errData !== null) {
          const vals = Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
          if (vals.length > 0) errMsg = vals.join(' | ');
        }
        throw new Error(errMsg || `HTTP Error ${response.status}`);
      }
      if (response.status === 204) return true; // No content (e.g. DELETE)
      return await response.json();
    } catch (error) {
      console.error(`API Request Failed [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  function _getTenantQuery() {
    // In our multi-tenant SaaS backend, tenant isolation is enforced statelessly
    // via the JWT Bearer token claims, so no user_id query params are needed.
    return '';
  }

  // ── Public API (Async Equivalents of db.js) ────────────────

  /** Get all rows from an endpoint (e.g., 'products', 'categories', 'sales') */
  async function getAll(endpoint) {
    return await _request(endpoint, 'GET');
  }

  /** Get a single item by id */
  async function getById(endpoint, id) {
    return await _request(`${endpoint}/${id}`, 'GET');
  }

  /** Insert a new row */
  async function insert(endpoint, data) {
    return await _request(endpoint, 'POST', data);
  }

  /** Update an item by id */
  async function update(endpoint, id, data) {
    return await _request(`${endpoint}/${id}`, 'PATCH', data);
  }

  /** Remove an item by id */
  async function remove(endpoint, id) {
    return await _request(`${endpoint}/${id}`, 'DELETE');
  }

  /** Get aggregated dashboard stats from Django backend */
  async function getDashboardStats() {
    try {
      return await _request('dashboard', 'GET');
    } catch (error) {
      console.error("Failed to fetch dashboard stats from Django API:", error);
      return null;
    }
  }

  let _lastHealthCheck = 0;
  let _lastHealthResult = false;

  /** Check if backend API is reachable with 10s caching and 500ms timeout */
  async function checkHealth(force = false) {
    const now = Date.now();
    if (!force && (now - _lastHealthCheck < 30000)) {
      return _lastHealthResult;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${BASE_URL}dashboard/`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.status === 401 && _getToken()) {
        const newToken = await _refreshToken();
        if (newToken) {
          _lastHealthResult = true;
          _lastHealthCheck = Date.now();
          return true;
        } else {
          if (typeof Auth !== 'undefined' && Auth.handleExpiredSession) {
            Auth.handleExpiredSession();
          }
        }
      }
      _lastHealthResult = res.status === 200 || res.status === 401 || res.status === 403;
      _lastHealthCheck = Date.now();
      return _lastHealthResult;
    } catch {
      _lastHealthResult = false;
      _lastHealthCheck = Date.now();
      return false;
    }
  }

  // ── Platform Owner API Methods ─────────────────────────────
  async function getPlatformStats() {
    return await _request('platform/stats', 'GET');
  }

  async function getCompanies() {
    return await _request('platform/companies', 'GET');
  }

  async function createCompany(data) {
    return await _request('platform/companies', 'POST', data);
  }

  async function changeCompanyStatus(id, status) {
    const action = status === 'suspended' ? 'suspend' : 'activate';
    try {
      return await _request(`platform/companies/${id}/${action}`, 'POST');
    } catch (e) {
      return await _request(`platform/companies/${id}/status`, 'PATCH', { status });
    }
  }

  async function changeCompanyPlan(id, subscription_plan) {
    return await _request(`platform/companies/${id}/subscription`, 'PATCH', { subscription_plan });
  }

  async function resetUserPassword(id, password) {
    return await _request(`platform/users/${id}/reset-password`, 'POST', { password });
  }

  async function deleteCompany(id) {
    return await _request(`platform/companies/${id}`, 'DELETE');
  }

  async function deleteAllCompanies() {
    return await _request('platform/companies/delete_all', 'DELETE');
  }

  return {
    getAll,
    getById,
    insert,
    update,
    remove,
    getDashboardStats,
    checkHealth,
    getPlatformStats,
    getCompanies,
    createCompany,
    deleteCompany,
    deleteAllCompanies,
    changeCompanyStatus,
    changeCompanyPlan,
    resetUserPassword,
    BASE_URL
  };
})();

// Export if in module environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
}
