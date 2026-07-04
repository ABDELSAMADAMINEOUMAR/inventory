/* =============================================
   APP.JS — Main Router & UI Controller
   Smart Import & Sales Management System
   ============================================= */

const UI = (() => {
  let _confirmResolve = null;
  let _currentPage = '';

  // ── Routing ──────────────────────────────
  const PAGES = {
    dashboard:  { title: 'Dashboard',   subtitle: 'Business overview & analytics', render: Dashboard.render },
    products:   { title: 'Products',    subtitle: 'Manage your imported products',  render: Products.render  },
    categories: { title: 'Categories',  subtitle: 'Organise product categories',    render: Categories.render },
    suppliers:  { title: 'Suppliers',   subtitle: 'Manage your product suppliers',  render: Suppliers.render  },
    expenses:   { title: 'Expenses',    subtitle: 'Import & business expenses',     render: Expenses.render   },
    sales:      { title: 'Sales',       subtitle: 'Record and track your sales',    render: Sales.render      },
    inventory:  { title: 'Inventory',   subtitle: 'Stock levels & alerts',          render: Inventory.render  },
    reports:    { title: 'Reports',     subtitle: 'Financial reports & exports',    render: Reports.render    },
    settings:   { title: 'Settings',    subtitle: 'Profile & system settings',      render: renderSettings    },
  };

  function navigate(page) {
    if (!PAGES[page]) page = 'dashboard';
    _currentPage = page;

    // Update header
    document.getElementById('headerTitle').textContent = t('page_' + page);
    document.getElementById('headerSubtitle').textContent = t('page_' + page + '_sub') || PAGES[page].subtitle;
    document.title = `SmartIMS — ${t('page_' + page)}`;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Close mobile sidebar
    closeSidebar();

    // Render page
    const content = document.getElementById('pageContent');
    content.innerHTML = '<div class="page-loader"><div class="spinner" style="width:36px;height:36px;border-color:rgba(124,58,237,0.2);border-top-color:var(--primary);"></div></div>';
    requestAnimationFrame(() => {
      try {
        PAGES[page].render(content);
        initTableScroller(content);
      } catch(e) {
        content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Page Error</h3><p>${e.message}</p></div>`;
        console.error(e);
      }
    });

    // Update stock alert badge
    updateStockBadge();
  }

  function initTableScroller(container) {
    if (!container) return;
    container.querySelectorAll('.table-wrap').forEach(wrap => {
      let isDown = false, startX, scrollLeft;
      wrap.addEventListener('mousedown', (e) => {
        if (['BUTTON', 'INPUT', 'SELECT', 'A'].includes(e.target.tagName) || e.target.closest('button, input, select, a')) return;
        isDown = true;
        wrap.style.cursor = 'grabbing';
        startX = e.pageX - wrap.offsetLeft;
        scrollLeft = wrap.scrollLeft;
      });
      wrap.addEventListener('mouseleave', () => { isDown = false; wrap.style.cursor = ''; });
      wrap.addEventListener('mouseup', () => { isDown = false; wrap.style.cursor = ''; });
      wrap.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - wrap.offsetLeft;
        wrap.scrollLeft = scrollLeft - (x - startX) * 1.5;
      });
      wrap.addEventListener('wheel', (e) => {
        if (wrap.scrollWidth > wrap.clientWidth && !e.shiftKey && Math.abs(e.deltaX) < 1) {
          if ((wrap.scrollLeft > 0 && e.deltaY < 0) || (wrap.scrollLeft < wrap.scrollWidth - wrap.clientWidth - 2 && e.deltaY > 0)) {
            e.preventDefault();
            wrap.scrollLeft += e.deltaY * 1.2;
          }
        }
      }, { passive: false });
    });
  }

  function getUnreadAlerts() {
    const products = DB.getAllEnrichedProducts();
    let readNotifs = {};
    try { readNotifs = JSON.parse(localStorage.getItem('sims_read_notifs') || '{}'); } catch(e) {}
    return products.filter(p => {
      if (p.stockStatus === 'available') return false;
      return readNotifs[p.id] === undefined || readNotifs[p.id] !== p.currentStock;
    });
  }

  function updateStockBadge() {
    const unread = getUnreadAlerts();
    const count = unread.length;
    const badge = document.getElementById('stockAlertBadge');
    if (badge) {
      badge.style.display = count > 0 ? '' : 'none';
      badge.textContent = count;
    }
    // Notification badge
    const notifBadge = document.getElementById('notifBadge');
    if (notifBadge) {
      notifBadge.style.display = count > 0 ? '' : 'none';
      notifBadge.textContent = count;
    }
  }

  // ── Sidebar ──────────────────────────────
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  }

  // ── Toast Notifications ───────────────
  function toast(type, title, message = '', duration = 3500) {
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <div class="toast-text">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-dismiss" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ── Confirm Dialog ────────────────────
  function confirm(title, message, okLabel = t('btn_delete'), iconType = 'danger') {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmOkBtn').textContent = okLabel === 'Delete' ? t('btn_delete') : okLabel;
    const btnClass = iconType === 'danger' ? 'btn-danger' : iconType === 'success' ? 'btn-accent' : 'btn-primary';
    document.getElementById('confirmOkBtn').className = `btn ${btnClass}`;
    document.getElementById('confirmIcon').className = `confirm-icon ${iconType === 'success' ? 'warning' : iconType}`;
    document.getElementById('confirmIcon').textContent = iconType === 'danger' ? '🗑️' : iconType === 'success' ? '✅' : '⚠️';
    document.getElementById('confirmModal').classList.add('show');
    return new Promise(resolve => { _confirmResolve = resolve; });
  }

  function closeConfirm(result) {
    document.getElementById('confirmModal').classList.remove('show');
    if (_confirmResolve) { _confirmResolve(result); _confirmResolve = null; }
  }

  // ── Modal Helpers ─────────────────────
  function openModal(id) { document.getElementById(id)?.classList.add('show'); }
  function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

  function createModal(id, title, bodyHtml, footerHtml = '', size = '') {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = id;
    modal.innerHTML = `
      <div class="modal ${size}">
        <div class="modal-header">
          <div class="modal-title">${title}</div>
          <button class="modal-close" onclick="UI.closeModal('${id}')">✕</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
      </div>`;
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('show'));
    // Close on overlay click
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(id); });
    return modal;
  }

  // ── Global Search ─────────────────────
  function handleSearch(q) {
    const dd = document.getElementById('searchDropdown');
    if (!q || q.length < 2) { dd.style.display = 'none'; return; }
    q = q.toLowerCase();

    const results = [];
    DB.getAll('products').forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q)) {
        results.push({ type: 'Product', name: p.name, sub: p.code, page: 'products' });
      }
    });
    DB.getAll('suppliers').forEach(s => {
      if (s.name.toLowerCase().includes(q)) {
        results.push({ type: 'Supplier', name: s.name, sub: s.country, page: 'suppliers' });
      }
    });
    DB.getAll('categories').forEach(c => {
      if (c.name.toLowerCase().includes(q)) {
        results.push({ type: 'Category', name: c.name, sub: c.description, page: 'categories' });
      }
    });

    if (!results.length) {
      dd.innerHTML = '<div class="search-result-item"><div class="search-result-sub">No results found</div></div>';
    } else {
      dd.innerHTML = results.slice(0, 8).map(r => `
        <div class="search-result-item" onclick="UI.navigate('${r.page}');document.getElementById('globalSearch').value='';UI.closeSearch();">
          <span class="search-result-type">${r.type}</span>
          <div>
            <div class="search-result-name">${r.name}</div>
            <div class="search-result-sub">${r.sub || ''}</div>
          </div>
        </div>`).join('');
    }
    dd.style.display = 'block';
  }

  function closeSearch() {
    document.getElementById('searchDropdown').style.display = 'none';
  }

  // ── Notifications Panel ───────────────
  function showNotifications() {
    const products = DB.getAllEnrichedProducts();
    const low = products.filter(p => p.stockStatus === 'low');
    const out = products.filter(p => p.stockStatus === 'out');

    let body = '';
    if (!low.length && !out.length) {
      body = '<div class="empty-state" style="padding:32px"><div class="empty-icon" style="font-size:32px">✅</div><p>No alerts at the moment</p></div>';
    }
    out.forEach(p => {
      body += `<div class="alert alert-danger" style="margin-bottom:8px">
        <span class="alert-icon">🚨</span>
        <div class="alert-content"><div class="alert-title">Out of Stock</div><div class="alert-body">${p.name} — 0 units remaining</div></div>
      </div>`;
    });
    low.forEach(p => {
      body += `<div class="alert alert-warning" style="margin-bottom:8px">
        <span class="alert-icon">⚠️</span>
        <div class="alert-content"><div class="alert-title">Low Stock</div><div class="alert-body">${p.name} — Only ${p.currentStock} units left</div></div>
      </div>`;
    });

    createModal('notifModal', `🔔 Notifications`, body, '', 'modal-sm');

    // Mark current alerts as read
    let readNotifs = {};
    try { readNotifs = JSON.parse(localStorage.getItem('sims_read_notifs') || '{}'); } catch(e) {}
    products.forEach(p => {
      if (p.stockStatus !== 'available') {
        readNotifs[p.id] = p.currentStock;
      }
    });
    localStorage.setItem('sims_read_notifs', JSON.stringify(readNotifs));
    updateStockBadge();
  }

  // ── Formatters ────────────────────────
  function fmt(n, decimals = 0) {
    const num = parseFloat(n) || 0;
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function fmtCurrency(n, symbol = ' FCFA') { return fmt(n, 0) + symbol; }
  function fmtDate(d) { if (!d) return '—'; try { return new Date(d).toLocaleDateString((typeof I18n !== 'undefined' && I18n.getLang() === 'ar' ? 'ar-EG' : 'en-GB'), { day:'2-digit', month:'short', year:'numeric' }); } catch { return d; } }
  function fmtPct(n) { return fmt(n, 1) + '%'; }

  // ── Initialise ────────────────────────
  function init() {
    I18n.init(); // Initialize language & direction first
    if (!Auth.requireAuth()) return;

    // Set user info
    const user = Auth.currentUser();
    if (user) {
      const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'A';
      const el = document.getElementById('userAvatarSidebar');
      const name = document.getElementById('userNameSidebar');
      if (el) el.textContent = initials;
      if (name) name.textContent = user.name || 'Admin';
    }

    // Default page from hash
    const page = window.location.hash.slice(1) || 'dashboard';
    navigate(page);

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      navigate(window.location.hash.slice(1) || 'dashboard');
    });

    // Prevent mouse wheel / trackpad scrolling from decrementing/incrementing <input type="number">
    window.addEventListener('wheel', (e) => {
      if (document.activeElement && document.activeElement.type === 'number') {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // ── Settings Page ─────────────────────
  function renderSettings(container) {
    const user = Auth.currentUser();
    const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'A';
    const s = DB.getDashboardStats();

    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title"><h2>${t('page_settings')}</h2><p>${I18n.getLang() === 'ar' ? 'إدارة ملفك الشخصي وتفضيلات النظام' : 'Manage your profile and system preferences'}</p></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <!-- Profile Card -->
        <div class="card">
          <div class="card-header"><div class="card-title">${t('set_profile')}</div></div>
          <div class="profile-avatar-wrap">
            <div class="profile-avatar-large">${initials}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${t('administrator')}</div>
          </div>
          <div class="card-body">
            <form id="profileForm" class="form-grid">
              <div class="field">
                <label>${I18n.getLang() === 'ar' ? 'الاسم الكامل' : 'Full Name'}</label>
                <input class="input" id="profName" value="${user?.name || ''}" placeholder="Your name">
              </div>
              <div class="field">
                <label>${t('login_email')}</label>
                <input class="input" id="profEmail" type="email" value="${user?.email || ''}" placeholder="your@email.com">
              </div>
              <div class="field">
                <label>${I18n.getLang() === 'ar' ? 'الهاتف' : 'Phone'}</label>
                <input class="input" id="profPhone" value="${user?.phone || ''}" placeholder="+250...">
              </div>
              <div class="field">
                <label>${I18n.getLang() === 'ar' ? 'اسم العمل التجاري' : 'Business Name'}</label>
                <input class="input" id="profBusiness" value="${user?.business || ''}" placeholder="My Import Business">
              </div>
              <div style="grid-column:1/-1">
                <button type="submit" class="btn btn-primary">💾 ${I18n.getLang() === 'ar' ? 'حفظ الملف الشخصي' : 'Save Profile'}</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Change Password -->
        <div class="card">
          <div class="card-header"><div class="card-title">${t('set_password')}</div></div>
          <div class="card-body">
            <form id="pwdForm" class="form-grid">
              <div class="field">
                <label>${I18n.getLang() === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}</label>
                <input class="input" type="password" id="currentPwd" placeholder="Current password">
              </div>
              <div class="field">
                <label>${I18n.getLang() === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}</label>
                <input class="input" type="password" id="newPwd" placeholder="New password (min 6 chars)">
              </div>
              <div class="field">
                <label>${I18n.getLang() === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</label>
                <input class="input" type="password" id="confirmPwd" placeholder="Repeat new password">
              </div>
              <div>
                <button type="submit" class="btn btn-primary">🔑 ${t('set_password')}</button>
              </div>
            </form>
          </div>
        </div>

        <!-- System Info -->
        <div class="card">
          <div class="card-header"><div class="card-title">${t('set_system')}</div></div>
          <div class="card-body">
            <div style="display:grid;gap:12px;">
              <div style="display:flex;justify-content:space-between;padding:12px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;">
                <span style="color:var(--text-secondary);font-weight:600">${t('kpi_products')}</span><strong style="font-size:1.05rem">${s.totalProducts}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;">
                <span style="color:var(--text-secondary);font-weight:600">${I18n.getLang() === 'ar' ? 'إجمالي المبيعات' : 'Total Sales Records'}</span><strong style="font-size:1.05rem">${DB.count('sales')}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;">
                <span style="color:var(--text-secondary);font-weight:600">${t('th_revenue')}</span><strong class="text-accent" style="font-size:1.05rem">${UI.fmtCurrency(s.totalRevenue)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:12px 14px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:10px;">
                <span style="color:var(--text-secondary);font-weight:600">${t('kpi_profit')}</span><strong class="text-success" style="font-size:1.05rem">${UI.fmtCurrency(s.totalProfit)}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card danger-zone-card">
          <div class="card-header danger-zone-header">
            <div class="danger-icon-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div class="card-title" style="color:var(--danger); font-size:1.15rem; font-weight:700;">${t('set_danger')}</div>
          </div>
          <div class="card-body danger-zone-body">
            <div class="danger-zone-text">
              <p>${I18n.getLang() === 'ar' ? 'هذه الإجراءات دائمة ولا يمكن التراجع عنها. سيؤدي هذا إلى محو جميع سجلات المخزون والمبيعات والموردين والمصروفات من النظام نهائياً. يرجى المتابعة بحذر شديد.' : 'These actions are permanent and irreversible. Proceeding will erase all inventory items, sales records, supplier profiles, and expense logs from your system.'}</p>
            </div>
            <button class="btn btn-danger reset-data-btn" onclick="Settings.resetData()">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <span>${t('set_reset')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>`;

    // Profile form
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await Auth.updateProfile({
        name: document.getElementById('profName').value,
        email: document.getElementById('profEmail').value,
        phone: document.getElementById('profPhone').value,
        business: document.getElementById('profBusiness').value,
      });
      UI.toast('success', 'Profile Updated', 'Your profile has been saved.');
      navigate('settings');
    });

    // Password form
    document.getElementById('pwdForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const np = document.getElementById('newPwd').value;
      const cp = document.getElementById('confirmPwd').value;
      if (np.length < 6) { UI.toast('error', 'Password too short', 'Minimum 6 characters.'); return; }
      if (np !== cp)     { UI.toast('error', 'Passwords do not match'); return; }
      const res = await Auth.changePassword(document.getElementById('currentPwd').value, np);
      if (res.success) { UI.toast('success', 'Password Changed'); document.getElementById('pwdForm').reset(); }
      else             { UI.toast('error', 'Error', res.message); }
    });
  }

  const Settings = {
    async resetData() {
      const ok = await UI.confirm('Reset All Data?', 'This will permanently delete ALL products, sales, expenses and reset to demo data.', 'Reset', 'danger');
      if (!ok) return;
      DB.clearAll();
      await DB.seed();
      UI.toast('success', 'Data Reset', 'System has been reset with demo data.');
      navigate('dashboard');
    }
  };

  return {
    navigate, toggleSidebar, closeSidebar,
    toast, confirm, closeConfirm,
    openModal, closeModal, createModal,
    handleSearch, closeSearch, showNotifications,
    fmt, fmtCurrency, fmtDate, fmtPct,
    init, Settings, getCurrentPage: () => _currentPage,
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => { UI.init(); });
