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
    users:      { title: 'Users',       subtitle: 'Manage employee accounts & roles', render: Users.render    },
    platform:   { title: 'SaaS Platform Management', subtitle: 'Manage tenant companies, subscriptions & stats', render: renderPlatform },
  };

  const ROLE_PAGES = {
    platform_owner: ['platform', 'settings'],
    admin:   ['dashboard', 'products', 'categories', 'suppliers', 'expenses', 'sales', 'inventory', 'reports', 'users', 'settings'],
    manager: ['dashboard', 'products', 'categories', 'suppliers', 'expenses', 'sales', 'inventory'],
    cashier: ['sales'],
    staff:   ['products', 'categories', 'suppliers', 'inventory']
  };

  function canViewProfit() {
    const u = typeof Auth !== 'undefined' ? Auth.currentUser() : null;
    if (!u) return true;
    return (u.role || '').toLowerCase() === 'admin';
  }

  function canEditProducts() {
    const u = typeof Auth !== 'undefined' ? Auth.currentUser() : null;
    if (!u) return true;
    const role = (u.role || '').toLowerCase();
    return role === 'admin' || role === 'manager';
  }

  function navigate(page) {
    if (!PAGES[page]) page = 'dashboard';
    const u = typeof Auth !== 'undefined' ? Auth.currentUser() : null;
    if (u) {
      const userRole = (u.role || 'staff').toLowerCase();
      const allowedPages = ROLE_PAGES[userRole] || ROLE_PAGES.staff;
      if (!allowedPages.includes(page)) {
        toast('error', 'Access Denied', `Your account role (${userRole}) does not have permission to access ${page}.`);
        page = allowedPages[0] || 'dashboard';
        window.location.hash = page;
      }
    }
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
      return readNotifs[p.id] === undefined || Number(readNotifs[p.id]) !== Number(p.currentStock);
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
    if (count === 0) {
      document.querySelectorAll('.alert-dismissible').forEach(el => el.style.display = 'none');
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
    document.getElementById('confirmOkBtn').className = `btn ${btnClass} confirm-action-btn`;
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

    const footer = `<button class="btn btn-primary" style="width:100%;font-weight:600;" onclick="UI.closeModal('notifModal'); UI.updateStockBadge();">✅ ${I18n.getLang() === 'ar' ? 'تم القراءة وإغلاق التنبيهات' : 'Mark as Read & Close'}</button>`;
    createModal('notifModal', `🔔 ${I18n.getLang() === 'ar' ? 'التنبيهات' : 'Notifications'}`, body, footer, 'modal-sm');

    // Mark current alerts as read
    let readNotifs = {};
    try { readNotifs = JSON.parse(localStorage.getItem('sims_read_notifs') || '{}'); } catch(e) {}
    products.forEach(p => {
      if (p.stockStatus !== 'available') {
        readNotifs[p.id] = Number(p.currentStock);
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
  function getCurrency() {
    const u = typeof Auth !== 'undefined' && Auth.currentUser ? Auth.currentUser() : null;
    if (u && u.currency) return u.currency;
    if (u && u.company_id && typeof DB !== 'undefined') {
      const comp = DB.getById('companies', u.company_id);
      if (comp && comp.currency) return comp.currency;
    }
    return 'USD';
  }
  function getCurrencySymbol() {
    const c = getCurrency();
    const symbols = { RWF: 'FRW', FCFA: 'FCFA', USD: '$', EGP: 'E£', EUR: '€', GBP: '£' };
    return symbols[c] || c;
  }
  function parseArabicDigits(str) {
    if (typeof I18n !== 'undefined' && I18n.toWesternDigits) return I18n.toWesternDigits(str);
    if (str === null || str === undefined) return '';
    return String(str).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/٫/g, '.');
  }
  function isRiyalMode() {
    return typeof I18n !== 'undefined' && I18n.getLang() === 'ar' && getCurrency() === 'FCFA';
  }
  function toInputMoney(fcfaVal) {
    if (fcfaVal === undefined || fcfaVal === null || fcfaVal === '') return '';
    const num = (typeof I18n !== 'undefined' && I18n.parseNum) ? I18n.parseNum(fcfaVal) : parseFloat(parseArabicDigits(fcfaVal));
    if (isNaN(num)) return '';
    return isRiyalMode() ? Math.round(num / 5) : num;
  }
  function fromInputMoney(inputVal) {
    if (inputVal === undefined || inputVal === null || inputVal === '') return NaN;
    const num = (typeof I18n !== 'undefined' && I18n.parseNum) ? I18n.parseNum(inputVal) : parseFloat(parseArabicDigits(inputVal));
    if (isNaN(num)) return NaN;
    return isRiyalMode() ? num * 5 : num;
  }
  function fmtCurrency(n, symbol = null) {
    if (!symbol) {
      const cur = getCurrency();
      const syms = { RWF: ' FRW', FCFA: ' FCFA', USD: ' $', EGP: ' E£', EUR: ' €', GBP: ' £' };
      symbol = syms[cur] || (' ' + cur);
    }
    if (isRiyalMode() && !String(symbol).includes('ريال')) {
      const riyal = Math.round(Number(n || 0) / 5);
      return fmt(riyal, 0) + ' ريال (' + fmt(n, 0) + ' FCFA)';
    }
    return fmt(n, 0) + symbol;
  }
  function fmtDate(d) { if (!d) return '—'; try { return new Date(d).toLocaleDateString((typeof I18n !== 'undefined' && I18n.getLang() === 'ar' ? 'ar-EG' : 'en-GB'), { day:'2-digit', month:'short', year:'numeric' }); } catch { return d; } }
  function fmtPct(n) { return fmt(n, 1) + '%'; }

  // ── Initialise ────────────────────────
  function init() {
    I18n.init(); // Initialize language & direction first
    localStorage.removeItem('sims_theme');
    document.body.classList.remove('theme-nordic');
    if (!Auth.requireAuth()) return;

    if (typeof DB !== 'undefined' && DB.syncFromBackend) {
      DB.syncFromBackend().then(() => {
        if (_currentPage && Auth.isLoggedIn()) {
          navigate(_currentPage);
        }
      });
    }

    // Auto-upgrade only the master platform owner account (`abdouamine@gmail.com`)
    let user = Auth.currentUser();
    if (user && user.role !== 'platform_owner' && (user.email?.toLowerCase() === 'abdouamine@gmail.com' || user.username?.toLowerCase() === 'abdouamine')) {
      user.name = 'Platform Super Owner';
      user.username = 'abdouamine';
      user.email = 'abdouamine@gmail.com';
      user.role = 'platform_owner';
      user.company_name = 'SaaS Platform';
      sessionStorage.setItem('sims_session', JSON.stringify(user));
      localStorage.setItem('sims_session', JSON.stringify(user));
    }
    if (user) {
      const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) || 'A';
      const el = document.getElementById('userAvatarSidebar');
      const name = document.getElementById('userNameSidebar');
      if (el) el.textContent = initials;
      if (name) name.textContent = user.name || 'Admin';

      if (user.role === 'admin') {
        const usersBtn = document.getElementById('navUsersBtn');
        if (usersBtn) usersBtn.style.display = 'flex';
      }
      if (user.role === 'platform_owner') {
        const platformBtn = document.getElementById('navPlatformBtn');
        if (platformBtn) platformBtn.style.display = 'flex';
      }
      const tenantEl = document.getElementById('userTenantSidebar');
      if (tenantEl) {
        tenantEl.textContent = user.company_name || (user.role === 'platform_owner' ? 'Platform Super Owner' : 'Tenant Company');
      }
      const roleEl = document.getElementById('userRoleSidebar');
      if (roleEl) {
        const roleLabels = { platform_owner: 'Platform Owner', admin: 'Company Admin', manager: 'Manager', cashier: 'Cashier', staff: 'Staff' };
        roleEl.textContent = roleLabels[user.role] || user.role || 'Staff';
      }

      const userRole = (user.role || 'staff').toLowerCase();
      const allowedPages = ROLE_PAGES[userRole] || ROLE_PAGES.staff;
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(link => {
        const p = link.dataset.page;
        if (p && !allowedPages.includes(p)) {
          link.style.display = 'none';
        } else if (p) {
          link.style.display = 'flex';
        }
      });
    }

    // Default page from hash
    const uRole = (user && user.role ? user.role : 'admin').toLowerCase();
    const allowed = ROLE_PAGES[uRole] || ROLE_PAGES.staff;
    const defaultPage = allowed[0] || 'dashboard';
    const hashPage = window.location.hash.slice(1);
    const page = (hashPage && allowed.includes(hashPage)) ? hashPage : defaultPage;
    navigate(page);

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const u = typeof Auth !== 'undefined' ? Auth.currentUser() : null;
      const r = (u && u.role ? u.role : 'admin').toLowerCase();
      const allow = ROLE_PAGES[r] || ROLE_PAGES.staff;
      const def = allow[0] || 'dashboard';
      navigate(window.location.hash.slice(1) || def);
    });

    // Prevent mouse wheel / trackpad scrolling from decrementing/incrementing <input type="number">
    window.addEventListener('wheel', (e) => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    }, { passive: true });
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
              <div class="field">
                <label>${I18n.getLang() === 'ar' ? 'عملة الشركة' : 'Company Currency'}</label>
                <select class="select" id="profCurrency">
                  <option value="USD" ${(getCurrency()==='USD')?'selected':''}>USD ($) - US Dollar</option>
                  <option value="RWF" ${(getCurrency()==='RWF')?'selected':''}>RWF (FRW) - Rwandan Franc</option>
                  <option value="FCFA" ${(getCurrency()==='FCFA')?'selected':''}>FCFA (F) - Central/West African CFA</option>
                  <option value="EGP" ${(getCurrency()==='EGP')?'selected':''}>EGP (E£) - Egyptian Pound</option>
                  <option value="EUR" ${(getCurrency()==='EUR')?'selected':''}>EUR (€) - Euro</option>
                </select>
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

        ${(user?.role === 'platform_owner' || user?.role === 'owner' || (typeof Auth.isOwner === 'function' && Auth.isOwner())) ? '' : `
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
        </div>`}
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
        currency: document.getElementById('profCurrency')?.value || 'RWF'
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
      if (res.success) {
        UI.toast('success', 'Password Changed', 'Password changed. Please log in again.');
        document.getElementById('pwdForm').reset();
        setTimeout(() => {
          sessionStorage.clear();
          localStorage.removeItem('sims_user');
          window.location.href = 'index.html';
        }, 1500);
      }
      else { UI.toast('error', 'Error', res.message); }
    });
  }

  // ── Platform Owner SaaS Dashboard ─────────────────────────
  async function renderPlatform(container) {
    const el = container || document.getElementById('pageContent') || document.getElementById('mainContent');
    if (!el) return;
    el.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    let companies = typeof DB !== 'undefined' ? DB.getAll('companies') : [];
    const activeCount = companies.filter(c => c.status === 'active').length;
    let stats = { totalCompanies: companies.length, activeCompanies: activeCount, suspendedCompanies: companies.length - activeCount };

    if (typeof ApiClient !== 'undefined' && ApiClient.getCompanies) {
      ApiClient.getCompanies().then(res => {
        if (res && Array.isArray(res)) {
          const currentStr = JSON.stringify(companies);
          const newStr = JSON.stringify(res);
          if (currentStr !== newStr) {
            try {
              localStorage.setItem('sims_companies', JSON.stringify(res));
            } catch {}
            companies = res;
            if (typeof _currentPage !== 'undefined' && (_currentPage === 'platform' || container.isConnected)) {
              renderPlatform(container);
            }
          }
        }
      }).catch(() => {});
    }

    try {
      const planMap = {
        free: { monthly: 0, label: 'Free ($0/mo)', color: '#64748b' },
        basic: { monthly: 49, label: 'Basic Plan ($49/mo)', color: '#3b82f6' },
        pro: { monthly: 149, label: 'Pro Plan ($149/mo)', color: '#8b5cf6' },
        enterprise: { monthly: 399, label: 'Enterprise ($399/mo)', color: '#f59e0b' }
      };

      let totalMRR = 0;
      let totalCollected = 0;
      let compRows = '';

      if (companies && companies.length > 0) {
        compRows = companies.map(c => {
          const planKey = (c.subscription_plan || 'free').toLowerCase();
          let monthlyVal = 0;
          let planLabel = 'FREE ($0/MO)';
          let planColor = '#10b981';

          if (planKey === 'free' || (Number(c.monthly_fee) === 0 && planKey !== 'custom')) {
            monthlyVal = 0;
            planLabel = 'FREE ($0/MO)';
            planColor = '#10b981';
          } else if (c.monthly_fee !== undefined && c.monthly_fee !== null) {
            monthlyVal = Number(c.monthly_fee);
            planLabel = `CUSTOM ($${monthlyVal}/MO)`;
            planColor = '#3b82f6';
          } else {
            const oldMap = { basic: 49, pro: 149, enterprise: 399 };
            monthlyVal = oldMap[planKey] || 0;
            planLabel = monthlyVal > 0 ? `${planKey.toUpperCase()} ($${monthlyVal}/MO)` : 'FREE ($0/MO)';
            planColor = monthlyVal > 0 ? '#3b82f6' : '#10b981';
          }

          const monthlyFee = c.status === 'active' ? monthlyVal : 0;
          if (c.status === 'active') totalMRR += monthlyFee;

          // Estimate duration in months (min 1 month)
          const createdDate = new Date(c.created_at || Date.now());
          const monthsActive = Math.max(1, Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          const totalPaidTenant = monthsActive * monthlyVal;
          totalCollected += totalPaidTenant;

          return `
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:12px 10px;word-break:break-word;">
                <strong style="font-size:13.5px;color:var(--text-main);">${c.name}</strong>
                <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">👤 <span style="color:var(--primary);font-weight:600;">${c.admin_email || 'admin@' + c.name.toLowerCase().replace(/\s+/g, '') + '.com'}</span></div>
              </td>
              <td style="padding:12px 10px;">
                <span class="badge" style="background:${planColor};color:#fff;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;">
                  ${planLabel}
                </span>
              </td>
              <td style="padding:12px 10px;white-space:nowrap;">
                <div style="font-weight:700;color:#10b981;font-size:13.5px;">$${monthlyFee.toLocaleString()}.00 USD</div>
                <div style="font-size:11px;color:var(--text-muted);">Billed Monthly</div>
              </td>
              <td style="padding:12px 10px;white-space:nowrap;">
                <div style="font-weight:700;color:var(--text-main);font-size:13.5px;">$${totalPaidTenant.toLocaleString()}.00 USD</div>
                <div style="font-size:11px;color:var(--text-muted);">${monthsActive} Mo. Active</div>
              </td>
              <td style="padding:12px 10px;">
                <span class="badge" style="padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;background:${c.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};color:${c.status === 'active' ? '#10b981' : '#ef4444'};">
                  ${c.status === 'active' ? '● ACTIVE' : '● SUSPENDED'}
                </span>
              </td>
              <td style="padding:12px 10px;">
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button class="btn btn-sm btn-outline" style="padding:4px 8px;font-size:11.5px;" onclick="UI.promptPlanChange('${c.id}', '${c.subscription_plan}')">⭐ Plan</button>
                  <button class="btn btn-sm btn-outline" style="padding:4px 8px;font-size:11.5px;" onclick="UI.toggleCompanyStatus('${c.id}', '${c.status === 'active' ? 'suspended' : 'active'}')">
                    ${c.status === 'active' ? '⏸️ Suspend' : '▶️ Activate'}
                  </button>
                  <button class="btn btn-sm btn-outline" style="padding:4px 8px;font-size:11.5px;color:#ef4444;border-color:rgba(239,68,68,0.3);" onclick="UI.deleteCompany('${c.id}', '${(c.name||'Company').replace(/'/g, "\\'")}')" title="Delete Company">🗑️ Delete</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      } else {
        compRows = `<tr><td colspan="6" style="padding:32px;text-align:center;color:var(--text-muted);">No tenant companies found.</td></tr>`;
      }

      const totalARR = totalMRR * 12;

      el.innerHTML = `
        <div class="fade-in" style="padding-bottom:32px;">
          <!-- NexaDash Command Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px;background:var(--surface);padding:20px 24px;border-radius:16px;border:1px solid var(--border);box-shadow:0 4px 12px rgba(0,0,0,0.02);">
            <div>
              <div style="display:flex;align-items:center;gap:10px;">
                <h2 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:var(--text-main);">SaaS Subscription & Financial Dashboard</h2>
                <span class="badge" style="background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.3);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;">● MRR TELEMETRY</span>
              </div>
              <p style="margin:4px 0 0;font-size:13.5px;color:var(--text-muted);">Real-time subscription tiers, Monthly Recurring Revenue (MRR), and lifetime collections</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              <button class="btn btn-primary" style="display:flex;align-items:center;gap:6px;border-radius:10px;font-weight:700;box-shadow:0 4px 10px rgba(99,102,241,0.25);" onclick="UI.showCreateCompanyModal()">+ Add New Tenant Company</button>
              <button class="btn btn-secondary" style="display:flex;align-items:center;gap:6px;border-radius:10px;font-weight:700;border:1px solid rgba(16,185,129,0.4);color:#10b981;" onclick="UI.showRecoverTenantsModal()">♻️ Recover Tenants</button>
              <button class="btn btn-danger" style="display:flex;align-items:center;gap:6px;border-radius:10px;font-weight:700;" onclick="UI.removeAllCompanies()">🗑️ Remove All Companies</button>
            </div>
          </div>

          <!-- 4 Executive NexaDash KPI Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-bottom:24px;">
            <!-- Card 1: MRR -->
            <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;">💰</div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Monthly Recurring (MRR)</div>
                </div>
                <span class="badge" style="background:#10b981;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">+24.5% ↗</span>
              </div>
              <div style="font-size:28px;font-weight:800;color:var(--text-main);letter-spacing:-0.5px;">$${totalMRR.toLocaleString()}.00 <span style="font-size:14px;font-weight:600;color:var(--text-muted);">USD/mo</span></div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Active recurring monthly subscription fees</div>
              <div style="margin-top:14px;width:100%;background:var(--bg-main);height:6px;border-radius:4px;overflow:hidden;">
                <div style="width:82%;background:#10b981;height:100%;border-radius:4px;"></div>
              </div>
            </div>

            <!-- Card 2: ARR -->
            <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:44px;height:44px;border-radius:12px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;">🚀</div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Annualized Run Rate (ARR)</div>
                </div>
                <span class="badge" style="background:#6366f1;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">Yearly Projection</span>
              </div>
              <div style="font-size:28px;font-weight:800;color:var(--text-main);letter-spacing:-0.5px;">$${totalARR.toLocaleString()}.00 <span style="font-size:14px;font-weight:600;color:var(--text-muted);">USD/yr</span></div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Projected 12-month platform revenue run rate</div>
              <div style="margin-top:14px;width:100%;background:var(--bg-main);height:6px;border-radius:4px;overflow:hidden;">
                <div style="width:75%;background:#6366f1;height:100%;border-radius:4px;"></div>
              </div>
            </div>

            <!-- Card 3: Lifetime Collected -->
            <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;">💎</div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Lifetime Collections</div>
                </div>
                <span class="badge" style="background:#8b5cf6;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">Total Paid</span>
              </div>
              <div style="font-size:28px;font-weight:800;color:var(--text-main);letter-spacing:-0.5px;">$${totalCollected.toLocaleString()}.00 <span style="font-size:14px;font-weight:600;color:var(--text-muted);">USD</span></div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">Historical paid subscription collections</div>
              <div style="margin-top:14px;width:100%;background:var(--bg-main);height:6px;border-radius:4px;overflow:hidden;">
                <div style="width:90%;background:#8b5cf6;height:100%;border-radius:4px;"></div>
              </div>
            </div>

            <!-- Card 4: Active Tenants -->
            <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:44px;height:44px;border-radius:12px;background:rgba(14,165,233,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;">🏢</div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Active Tenants</div>
                </div>
                <span class="badge" style="background:#0ea5e9;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">${stats?.activeCompanies || 0} Active</span>
              </div>
              <div style="font-size:28px;font-weight:800;color:var(--text-main);letter-spacing:-0.5px;">${stats?.activeCompanies || 0} <span style="font-size:16px;font-weight:600;color:var(--text-muted);">/ ${stats?.totalCompanies || 0}</span></div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">${stats?.suspendedCompanies || 0} suspended company account(s)</div>
              <div style="margin-top:14px;width:100%;background:var(--bg-main);height:6px;border-radius:4px;overflow:hidden;">
                <div style="width:${Math.max(10, Math.min(100, ((stats?.activeCompanies || 1) / Math.max(1, stats?.totalCompanies || 1)) * 100))}%;background:#0ea5e9;height:100%;border-radius:4px;"></div>
              </div>
            </div>
          </div>

          <!-- Subscription Directory Table -->
          <div class="card" style="background:var(--surface);padding:24px;border-radius:12px;border:1px solid var(--border);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
              <div>
                <h3 style="margin:0;font-size:18px;font-weight:700;">Tenant Subscriptions & Revenue Directory</h3>
                <p style="margin:4px 0 0;font-size:13px;color:var(--text-muted);">Detailed breakdown of each company's plan, monthly subscription contribution, and total revenue paid</p>
              </div>
            </div>
            <div class="table-responsive" style="overflow-x: hidden; width: 100%;">
              <table class="table" style="width:100%;border-collapse:collapse;table-layout:auto;">
                <thead>
                  <tr style="text-align:left;border-bottom:2px solid var(--border);color:var(--text-muted);font-size:12px;text-transform:uppercase;">
                    <th style="padding:12px 10px;">Company & Contact</th>
                    <th style="padding:12px 10px;">Plan Tier</th>
                    <th style="padding:12px 10px;">Monthly Fee</th>
                    <th style="padding:12px 10px;">Total Paid</th>
                    <th style="padding:12px 10px;">Status</th>
                    <th style="padding:12px 10px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${compRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      el.innerHTML = `<div class="card"><p style="color:var(--danger)">Error rendering platform view: ${e.message}</p></div>`;
    }
  }

  async function toggleCompanyStatus(id, newStatus) {
    const ok = await confirm('Change Status?', `Are you sure you want to change this company's status to ${newStatus}?`, 'Yes, Change', newStatus === 'suspended' ? 'danger' : 'primary');
    if (!ok) return;

    // 1. Immediately update local database copy
    if (typeof DB !== 'undefined') {
      const comp = DB.getById('companies', id);
      if (comp) {
        comp.status = newStatus;
        DB.update('companies', id, comp);
      } else {
        DB.update('companies', id, { status: newStatus });
      }
    }

    // 2. Update Django backend if connected
    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        await ApiClient.changeCompanyStatus(id, newStatus);
      } catch (e) {
        console.warn('Backend status update warning:', e.message);
      }
    }

    toast('success', 'Status Updated', `Company is now ${newStatus}.`);
    renderPlatform();
  }

  async function deleteCompany(id, name) {
    const ok = await confirm('Delete Company?', `Are you sure you want to delete "${name || 'Company'}"? This cannot be undone.`, 'Delete', 'danger');
    if (!ok) return;

    if (typeof DB !== 'undefined') {
      const rows = DB.getAll('companies').filter(c => c.id != id);
      localStorage.setItem('sims_companies', JSON.stringify(rows));
      const users = DB.getAll('users').filter(u => u.company_id != id && u.company != id);
      localStorage.setItem('sims_users', JSON.stringify(users));
    }

    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        await ApiClient.deleteCompany(id);
      } catch (e) {
        console.warn('Backend delete warning:', e.message);
      }
    }

    toast('success', 'Company Deleted', `Deleted "${name}".`);
    renderPlatform();
  }

  async function removeAllCompanies() {
    const ok = await confirm('Remove All Companies?', 'Are you sure you want to permanently delete ALL tenant companies from your database and cloud?', 'Delete All', 'danger');
    if (!ok) return;

    if (typeof DB !== 'undefined') {
      localStorage.setItem('sims_companies', JSON.stringify([]));
      const users = DB.getAll('users').filter(u => u.role === 'platform_owner' || u.role === 'owner');
      localStorage.setItem('sims_users', JSON.stringify(users));
      ['categories', 'suppliers', 'products', 'productExpenses', 'sales', 'businessExpenses'].forEach(t => {
        localStorage.setItem('sims_' + t, JSON.stringify([]));
      });
    }
    localStorage.removeItem('sims_archived_companies');
    localStorage.removeItem('sims_archived_admins');

    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        await ApiClient.deleteAllCompanies();
      } catch (e) {
        console.warn('Backend delete_all warning:', e.message);
      }
    }

    toast('success', 'All Companies Removed', 'All tenant companies, users, and inventory data have been purged.');
    renderPlatform();
  }

  function getArchivedCompanies() {
    try {
      return JSON.parse(localStorage.getItem('sims_archived_companies') || '[]');
    } catch { return []; }
  }

  function getArchivedAdmins() {
    try {
      return JSON.parse(localStorage.getItem('sims_archived_admins') || '[]');
    } catch { return []; }
  }

  function clearRecoveryBin() {
    localStorage.removeItem('sims_archived_companies');
    localStorage.removeItem('sims_archived_admins');
    toast('success', 'Recovery Bin Cleared', 'All archived tenant companies have been permanently deleted.');
    closeModal('recoverTenantsModal');
    renderPlatform();
  }

  function showRecoverTenantsModal() {
    const archived = getArchivedCompanies();
    if (archived.length === 0) {
      createModal('recoverTenantsModal', '♻️ Recover Deleted Tenant Companies',
        `<div style="text-align:center;padding:36px 20px;">
          <div style="font-size:48px;margin-bottom:12px;">🗑️</div>
          <h3 style="margin:0 0 8px;font-size:18px;color:var(--text-main);">Recovery Bin is Empty</h3>
          <p style="margin:0;color:var(--text-muted);font-size:13.5px;">There are no deleted tenant companies available to restore. Your system is completely clean.</p>
        </div>`,
        `<button class="btn btn-ghost" onclick="UI.closeModal('recoverTenantsModal')">Close</button>`
      );
      return;
    }

    const existingIds = typeof DB !== 'undefined' ? DB.getAll('companies').map(c => Number(c.id)) : [];

    const rowsHtml = archived.map(comp => {
      const isRestored = existingIds.includes(Number(comp.id));
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px;background:var(--bg);border:1px solid var(--border);border-radius:12px;margin-bottom:10px;">
          <div>
            <div style="font-weight:700;font-size:14.5px;color:var(--text-main);">${comp.name}</div>
            <div style="font-size:12px;color:var(--text-muted);">📧 ${comp.admin_email} | Tier: <strong style="text-transform:uppercase;">${comp.subscription_plan}</strong></div>
          </div>
          <div>
            ${isRestored 
              ? `<span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;padding:6px 12px;border-radius:20px;font-weight:700;font-size:12px;">✓ Restored</span>` 
              : `<button class="btn btn-sm btn-primary" style="padding:6px 14px;font-size:12px;font-weight:700;" onclick="UI.recoverSingleTenant(${comp.id})">+ Restore Tenant</button>`
            }
          </div>
        </div>
      `;
    }).join('');

    createModal('recoverTenantsModal', '♻️ Recover Deleted Tenant Companies',
      `<p style="margin-top:0;margin-bottom:16px;color:var(--text-muted);font-size:13.5px;">
        Restore individual tenant companies or purge the recovery bin permanently.
      </p>
      <div>${rowsHtml}</div>`,
      `<button class="btn btn-danger" style="margin-right:auto;font-weight:700;" onclick="UI.clearRecoveryBin()">🗑️ Purge Recovery Bin</button>
       <button class="btn btn-ghost" onclick="UI.closeModal('recoverTenantsModal')">Close</button>
       <button class="btn btn-secondary" style="border:1px solid rgba(16,185,129,0.4);color:#10b981;font-weight:700;" onclick="UI.recoverAllDeletedTenants()">♻️ Restore All</button>`
    );
  }

  async function recoverSingleTenant(id) {
    const archived = getArchivedCompanies();
    const comp = archived.find(c => c.id === id);
    if (!comp) return;
    const archivedAdmins = getArchivedAdmins();
    const adm = archivedAdmins.find(a => a.company_id === id);

    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        await ApiClient.createCompany({
          name: comp.name,
          subscription_plan: comp.subscription_plan,
          status: 'active',
          currency: comp.currency || 'FCFA',
          admin_name: adm ? adm.name : `${comp.name} Admin`,
          admin_username: adm ? adm.username : comp.name.toLowerCase().replace(/\s+/g, '_'),
          admin_email: comp.admin_email,
          admin_password: 'RecoveredPassword123!'
        });
      } catch (e) {
        console.warn('Backend restore warning:', e.message);
      }
    }

    if (typeof DB !== 'undefined') {
      const rows = DB.getAll('companies');
      if (!rows.some(c => Number(c.id) === Number(id))) {
        rows.push(comp);
        localStorage.setItem('sims_companies', JSON.stringify(rows));
      }

      if (adm) {
        const pwHash = await DB.hashPassword('RecoveredPassword123!');
        const users = DB.getAll('users');
        if (!users.some(u => u.email && u.email.toLowerCase() === adm.email.toLowerCase())) {
          DB.insert('users', { ...adm, passwordHash: pwHash });
        }
      }
    }

    // Remove from archive
    const remaining = archived.filter(c => c.id !== id);
    localStorage.setItem('sims_archived_companies', JSON.stringify(remaining));

    toast('success', 'Tenant Restored', `Restored "${comp.name}" to database and cloud.`);
    renderPlatform();
    showRecoverTenantsModal();
  }

  async function recoverAllDeletedTenants() {
    const archived = getArchivedCompanies();
    const archivedAdmins = getArchivedAdmins();

    for (const comp of archived) {
      const adm = archivedAdmins.find(a => a.company_id === comp.id);
      if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
        try {
          await ApiClient.createCompany({
            name: comp.name,
            subscription_plan: comp.subscription_plan,
            status: 'active',
            currency: comp.currency || 'FCFA',
            admin_name: adm ? adm.name : `${comp.name} Admin`,
            admin_username: adm ? adm.username : comp.name.toLowerCase().replace(/\s+/g, '_'),
            admin_email: comp.admin_email,
            admin_password: 'RecoveredPassword123!'
          });
        } catch (e) {}
      }
    }

    if (typeof DB !== 'undefined') {
      const rows = DB.getAll('companies');
      archived.forEach(comp => {
        if (!rows.some(c => Number(c.id) === Number(comp.id))) {
          rows.push(comp);
        }
      });
      localStorage.setItem('sims_companies', JSON.stringify(rows));

      const pwHash = await DB.hashPassword('RecoveredPassword123!');
      const existingUsers = DB.getAll('users');
      for (const adm of archivedAdmins) {
        if (!existingUsers.some(u => u.email && u.email.toLowerCase() === adm.email.toLowerCase())) {
          DB.insert('users', { ...adm, passwordHash: pwHash });
        }
      }
    }

    localStorage.removeItem('sims_archived_companies');
    localStorage.removeItem('sims_archived_admins');

    toast('success', 'All Tenants Restored', 'Recovered all tenant companies to database and cloud.');
    renderPlatform();
    closeModal('recoverTenantsModal');
  }

  async function promptPlanChange(id, currentPlan) {
    const comp = typeof DB !== 'undefined' ? DB.getById('companies', id) : null;
    const curFee = comp && comp.monthly_fee !== undefined ? Number(comp.monthly_fee) : (
      currentPlan === 'basic' ? 49 :
      currentPlan === 'pro' ? 149 :
      currentPlan === 'enterprise' ? 399 : 0
    );

    createModal('changePlanModal', '⭐ Set Tenant Subscription Plan & Fee',
      `<div class="form-grid">
        <div class="field">
          <label>Subscription Option <span class="req">*</span></label>
          <select class="select" id="editCompPlan" onchange="const w = document.getElementById('editCompPriceWrap'); if(this.value === 'custom') { w.style.display = 'block'; } else { w.style.display = 'none'; }">
            <option value="free" ${curFee === 0 ? 'selected' : ''}>Free Plan ($0/mo)</option>
            <option value="custom" ${curFee > 0 ? 'selected' : ''}>Custom Paid Plan (Enter Price...)</option>
          </select>
        </div>
        <div class="field" id="editCompPriceWrap" style="display: ${curFee > 0 ? 'block' : 'none'};">
          <label>Custom Monthly Fee ($ / month) <span class="req">*</span></label>
          <input class="input" type="number" id="editCompPrice" value="${curFee > 0 ? curFee : ''}" placeholder="e.g. 25, 49, 100" min="0" step="1">
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal('changePlanModal')">Cancel</button>
       <button class="btn btn-primary" onclick="UI.saveChangedPlan('${id}')">💾 Save Plan & Fee</button>`
    );
  }

  async function saveChangedPlan(id) {
    const planSel = document.getElementById('editCompPlan')?.value || 'free';
    const customPriceVal = Number(document.getElementById('editCompPrice')?.value || 0);
    if (planSel === 'custom' && (!customPriceVal || customPriceVal <= 0)) {
      toast('error', 'Validation Error', 'Please enter a custom monthly fee amount greater than $0.');
      return;
    }
    const monthly_fee = planSel === 'free' ? 0 : customPriceVal;
    const newPlan = planSel === 'free' ? 'free' : 'custom';

    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        await ApiClient.changeCompanyPlan(id, newPlan);
      } catch (e) {}
    }
    if (typeof DB !== 'undefined') {
      const comp = DB.getById('companies', id);
      if (comp) {
        comp.subscription_plan = newPlan;
        comp.monthly_fee = monthly_fee;
        DB.update('companies', id, comp);
      }
    }
    closeModal('changePlanModal');
    toast('success', 'Plan Updated', planSel === 'free' ? 'Company set to Free Plan ($0/mo).' : `Company set to Custom Plan ($${monthly_fee}/mo).`);
    renderPlatform();
  }

  function showCreateCompanyModal() {
    createModal('createCompanyModal', '🏢 Add New Tenant Company',
      `<div class="form-grid">
        <div class="field">
          <label>Company / Tenant Name <span class="req">*</span></label>
          <input class="input" id="addCompName" placeholder="e.g. Atlas Logistics EG" required
            oninput="const val = this.value.trim(); const slug = val.toLowerCase().replace(/[^a-z0-9]/g, ''); if(val) { const nameEl = document.getElementById('addCompAdminName'); const userEl = document.getElementById('addCompAdminUsername'); if(nameEl) nameEl.value = val + ' Admin'; if(userEl) userEl.value = (slug || 'admin') + '_admin'; }">
        </div>
        <div class="field">
          <label>Subscription Option <span class="req">*</span></label>
          <select class="select" id="addCompPlan" onchange="const w = document.getElementById('addCompCustomPriceWrap'); if(this.value === 'custom') { w.style.display = 'block'; } else { w.style.display = 'none'; }">
            <option value="free" selected>Free Plan ($0/mo)</option>
            <option value="custom">Custom Paid Plan (Enter Price...)</option>
          </select>
        </div>
        <div class="field" id="addCompCustomPriceWrap" style="display: none;">
          <label>How much? Custom Monthly Fee ($ / month) <span class="req">*</span></label>
          <input class="input" type="number" id="addCompCustomPrice" placeholder="e.g. 25, 49, 100" min="0" step="1">
        </div>
        <div class="field">
          <label>Company Currency <span class="req">*</span></label>
          <select class="select" id="addCompCurrency">
            <option value="RWF" selected>RWF (FRW) - Rwandan Franc</option>
            <option value="USD">USD ($) - US Dollar</option>
            <option value="FCFA">FCFA (F) - Central/West African CFA</option>
            <option value="EGP">EGP (E£) - Egyptian Pound</option>
            <option value="EUR">EUR (€) - Euro</option>
          </select>
        </div>
        <div style="grid-column: 1 / -1; margin-top: 8px; padding: 10px; background: rgba(59, 130, 246, 0.08); border-left: 3px solid var(--primary); border-radius: 4px;">
          <strong style="display: block; font-size: 13px; margin-bottom: 4px; color: var(--primary);">👤 Initial Admin User Credentials</strong>
          <span style="font-size: 12px; color: var(--text-muted);">An activation link will be sent to the Admin Email to activate the account and set a password.</span>
        </div>
        <div class="field">
          <label>Admin Full Name <span class="req">*</span></label>
          <input class="input" id="addCompAdminName" placeholder="e.g. Omar Admin" required>
        </div>
        <div class="field">
          <label>Admin Username (Used for Login) <span class="req">*</span></label>
          <input class="input" type="text" id="addCompAdminUsername" placeholder="e.g. omar_admin" required>
        </div>
        <div class="field">
          <label>Admin Email <span class="req">*</span></label>
          <input class="input" type="email" id="addCompAdminEmail" placeholder="e.g. omar@gmail.com" required>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal('createCompanyModal')">Cancel</button>
       <button class="btn btn-primary" onclick="UI.saveNewCompany()">💾 Create Tenant & Send Invite</button>`
    );
  }

  function isValidRecoveryEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    const parts = clean.split('@');
    if (parts.length !== 2) return false;
    const [user, domain] = parts;
    if (!user || !domain || user.length < 2) return false;

    // Block common typos and fake domains
    const blockedDomains = [
      'gmai.com', 'gamil.com', 'gmial.com', 'gmail.co', 'gmaill.com',
      'yahooo.com', 'yaho.com', 'outlok.com', 'hotmial.com',
      'example.com', 'test.com', 'company.com', 'domain.com', 'asdasd.com'
    ];
    if (blockedDomains.includes(domain)) return false;

    // Check valid regex format
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) return false;

    const domainParts = domain.split('.');
    if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) return false;

    return true;
  }

  async function saveNewCompany() {
    const name = document.getElementById('addCompName')?.value.trim();
    const planSel = document.getElementById('addCompPlan')?.value || 'free';
    const customPriceVal = Number(document.getElementById('addCompCustomPrice')?.value || 0);
    if (planSel === 'custom' && (!customPriceVal || customPriceVal <= 0)) {
      toast('error', 'Validation Error', 'Please enter a custom monthly fee amount greater than $0.');
      return;
    }
    const monthly_fee = planSel === 'free' ? 0 : customPriceVal;
    const plan = planSel === 'free' ? 'free' : 'custom';
    const currency = document.getElementById('addCompCurrency')?.value || 'RWF';
    const adminName = document.getElementById('addCompAdminName')?.value.trim() || `${name} Admin`;
    const adminUsername = document.getElementById('addCompAdminUsername')?.value.trim() || adminName.toLowerCase().replace(/\s+/g, '_');
    const adminEmail = document.getElementById('addCompAdminEmail')?.value.trim().toLowerCase();
    const adminPwd = document.getElementById('addCompAdminPwd')?.value || '123456';

    if (!name || !adminUsername || !adminEmail) {
      toast('error', 'Validation Error', 'Please fill in company name, admin username, and admin email.');
      return;
    }

    if (!isValidRecoveryEmail(adminEmail)) {
      toast('error', 'Refused: Unrecognized Email', 'A recognized, valid recovery email address (e.g. @gmail.com) is required. Misspelled or dummy domains are rejected.');
      return;
    }

    if (typeof DB !== 'undefined') {
      const activeCompIds = DB.getAll('companies').map(c => Number(c.id));
      let users = DB.getAll('users').filter(u => 
        u.role === 'platform_owner' || u.role === 'owner' || activeCompIds.includes(Number(u.company_id || u.company))
      );
      localStorage.setItem('sims_users', JSON.stringify(users));

      if (users.some(u => u.email && u.email.toLowerCase() === adminEmail)) {
        toast('error', 'Creation Failed', 'this email has already an account');
        return;
      }
      if (users.some(u => u.username && u.username.toLowerCase() === adminUsername.toLowerCase())) {
        toast('error', 'Creation Failed', 'This username already exists.');
        return;
      }
    }

    let created = false;
    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        await ApiClient.createCompany({
          name,
          subscription_plan: plan,
          monthly_fee: monthly_fee,
          status: 'active',
          currency,
          admin_name: adminName,
          admin_username: adminUsername,
          admin_email: adminEmail,
          admin_password: adminPwd
        });
        created = true;
      } catch (e) {
        const lowerMsg = (e.message || '').toLowerCase();
        if (lowerMsg.includes('email') && lowerMsg.includes('already')) {
          toast('error', 'Creation Failed', 'this email has already an account');
          return;
        }
        console.warn('Backend createCompany failed, falling back to local DB:', e.message);
      }
    }

    if (!created) {
      if (typeof DB !== 'undefined') {
        const newComp = DB.insert('companies', {
          name,
          subscription_plan: plan,
          monthly_fee: monthly_fee,
          status: 'active',
          currency,
          admin_email: adminEmail,
          created_at: new Date().toISOString()
        });
        const pwHash = await DB.hashPassword(adminPwd);
        const newUser = DB.insert('users', {
          name: adminName,
          username: adminUsername,
          email: adminEmail,
          password: adminPwd,
          passwordHash: pwHash,
          password_hash: pwHash,
          role: 'admin',
          company_id: newComp.id,
          business: name,
          currency: currency,
          is_active: true,
          must_change_password: false,
          createdAt: new Date().toISOString()
        });
      } else {
        toast('error', 'Creation Failed', 'Neither Backend API nor Local Storage is available.');
        return;
      }
    }

    closeModal('createCompanyModal');
    toast('success', 'Tenant Created Successfully!', `Activation link sent to ${adminEmail}.`);
    renderPlatform();

    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    const activationUrl = `${baseUrl}/verify-email.html?uid=${encodeURIComponent(adminUsername)}&token=activate_token&email=${encodeURIComponent(adminEmail)}`;

        const emailSubject = encodeURIComponent('SmartIMS: Activate Your Tenant Account & Set Password');
        const emailBody = encodeURIComponent(`Hello ${name} Admin,\n\nYour tenant account has been created on SmartIMS.\n\nPlease click the secure activation link below to activate your account and choose your password:\n${activationUrl}\n\nUsername: ${adminUsername}\nEmail: ${adminEmail}\n\nThank you,\nSmartIMS Platform Team`);
        const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(adminEmail)}&su=${emailSubject}&body=${emailBody}`;
        const mailtoUrl = `mailto:${encodeURIComponent(adminEmail)}?subject=${emailSubject}&body=${emailBody}`;

        createModal('tenantCreatedModal', '📧 Tenant Created & Activation Invitation Ready!',
          `<div style="text-align:center;padding:10px 0;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(16,185,129,0.15);color:#10b981;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px;">✉️</div>
            <h3 style="margin:0 0 8px;font-size:18px;color:var(--text-main);">${name}</h3>
            <p style="margin:0 0 16px;color:var(--text-muted);font-size:13.5px;">Send the activation invitation directly to <strong>${adminEmail}</strong>:</p>
            
            <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:left;margin-bottom:16px;">
              <div style="font-size:11.5px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">DIRECT ACTIVATION & PASSWORD LINK</div>
              <div style="display:flex;gap:8px;margin-bottom:12px;">
                <input type="text" readonly class="input" value="${activationUrl}" style="font-size:12px;background:var(--surface);cursor:text;" onclick="this.select()">
                <button class="btn btn-secondary" style="white-space:nowrap;font-size:12px;font-weight:700;" onclick="navigator.clipboard.writeText('${activationUrl}'); UI.toast('success', 'Copied!', 'Activation link copied to clipboard.');">📋 Copy Link</button>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">TENANT ADMIN CREDENTIALS</div>
              <div style="font-size:13.5px;color:var(--text-main);margin-bottom:4px;"><strong>Username:</strong> ${adminUsername}</div>
              <div style="font-size:13.5px;color:var(--text-main);"><strong>Email:</strong> ${adminEmail}</div>
            </div>

            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
              <a href="${gmailComposeUrl}" target="_blank" class="btn btn-primary" style="font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">📧 Send via Gmail ↗</a>
              <a href="${mailtoUrl}" class="btn btn-secondary" style="font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">✉️ Send via Email App</a>
            </div>
          </div>`,
          `<button class="btn btn-ghost" style="width:100%;font-weight:700;" onclick="UI.closeModal('tenantCreatedModal')">Done</button>`
        );
  }

  async function resetTenantUserPwd(id, email) {
    const newPwd = prompt(`Enter new password for user ${email}:`, "resetpass123");
    if (!newPwd) return;
    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        await ApiClient.resetUserPassword(id, newPwd);
        toast('success', 'Password Reset', `Password for ${email} has been reset to: ${newPwd}`);
        return;
      } catch (e) {
        toast('error', 'Reset Failed', e.message);
        return;
      }
    }
    if (typeof DB !== 'undefined') {
      const users = DB.getAll('users');
      const u = users.find(user => user.email && user.email.toLowerCase() === email.toLowerCase());
      if (u) {
        const pwHash = await DB.hashPassword(newPwd);
        u.password = newPwd;
        u.passwordHash = pwHash;
        u.password_hash = pwHash;
        DB.update('users', u.id, u);
        toast('success', 'Password Reset', `Password for ${email} has been reset to: ${newPwd}`);
      } else {
        toast('error', 'Reset Failed', 'User not found locally.');
      }
    }
  }

  const Settings = {};

  return {
    navigate, toggleSidebar, closeSidebar,
    toast, confirm, closeConfirm,
    openModal, closeModal, createModal,
    handleSearch, closeSearch, showNotifications,
    fmt, fmtCurrency, fmtDate, fmtPct, canViewProfit, canEditProducts, updateStockBadge, getUnreadAlerts, getCurrency, getCurrencySymbol,
    parseArabicDigits, isRiyalMode, toInputMoney, fromInputMoney,
    init, Settings, getCurrentPage: () => _currentPage,
    toggleCompanyStatus, promptPlanChange, saveChangedPlan, showCreateCompanyModal, saveNewCompany, resetTenantUserPwd, deleteCompany, removeAllCompanies, showRecoverTenantsModal, recoverSingleTenant, recoverAllDeletedTenants,
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => { UI.init(); });
