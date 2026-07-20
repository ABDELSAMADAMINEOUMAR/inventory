/* =============================================
   APP.JS — Main Router & UI Controller
   Smart Import & Sales Management System
   ============================================= */

const UI = (() => {
  let _confirmResolve = null;
  let _currentPage = '';

  // ── Vector Icon Registry ─────────────────
  const SVGS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    products: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    categories: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    suppliers: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    expenses: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    sales: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    inventory: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    reports: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    users: '<path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>',
    platform: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    del: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    view: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    trending_up: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    pie_chart: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
    shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
    pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-5H20"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    restore: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    trending_down: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    credit_card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    bar_chart: '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>'
  };

  function svg(name, size = 18, extraClass = '', strokeWidth = 2) {
    const content = SVGS[name] || SVGS.box;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="svg-icon ${extraClass}" style="display:inline-block;vertical-align:middle;flex-shrink:0;">${content}</svg>`;
  }

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
        content.innerHTML = `<div class="empty-state"><div class="empty-icon">${UI.svg('alert', 48, 'text-warning')}</div><h3>Page Error</h3><p>${e.message}</p></div>`;
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
    const icons = {
      success: svg('check', 18, 'text-success', 2.5),
      error: svg('alert', 18, 'text-danger', 2.2),
      warning: svg('alert', 18, 'text-warning', 2.2),
      info: svg('info', 18, 'text-info', 2.2)
    };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
      <span class="toast-icon" style="display:flex;align-items:center;justify-content:center;">${icons[type] || icons.info}</span>
      <div class="toast-text">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-dismiss" onclick="this.parentElement.remove()">&times;</button>
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
    document.getElementById('confirmIcon').innerHTML = iconType === 'danger' ? svg('del', 28) : iconType === 'success' ? svg('check', 28) : svg('alert', 28);
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
          <button class="modal-close" onclick="UI.closeModal('${id}')">&times;</button>
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
      body = `<div class="empty-state" style="padding:32px"><div class="empty-icon" style="color:var(--success)">${UI.svg('check', 32)}</div><p>No alerts at the moment</p></div>`;
    }
    out.forEach(p => {
      body += `<div class="alert alert-danger" style="margin-bottom:8px">
        <span class="alert-icon">${UI.svg('alert', 20, 'text-danger')}</span>
        <div class="alert-content"><div class="alert-title">Out of Stock</div><div class="alert-body">${p.name} — 0 units remaining</div></div>
      </div>`;
    });
    low.forEach(p => {
      body += `<div class="alert alert-warning" style="margin-bottom:8px">
        <span class="alert-icon">${UI.svg('alert', 20, 'text-warning')}</span>
        <div class="alert-content"><div class="alert-title">Low Stock</div><div class="alert-body">${p.name} — Only ${p.currentStock} units left</div></div>
      </div>`;
    });

    const footer = `<button class="btn btn-primary" style="width:100%;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:6px;" onclick="UI.closeModal('notifModal'); UI.updateStockBadge();">${UI.svg('check', 16)} ${I18n.choose('Mark as Read & Close', 'تم القراءة وإغلاق التنبيهات', 'Marquer comme lu & fermer')}</button>`;
    createModal('notifModal', `<span style="display:inline-flex;align-items:center;gap:8px;">${UI.svg('bell', 20)} ${I18n.choose('Notifications', 'التنبيهات', 'Notifications')}</span>`, body, footer, 'modal-sm');

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
    if (u && (u.company_id || u.company) && typeof DB !== 'undefined') {
      const comp = DB.getById('companies', u.company_id || u.company);
      if (comp && comp.currency) return comp.currency;
    }
    if (u && u.currency) return u.currency;
    if (typeof DB !== 'undefined') {
      const allComps = DB.getAll('companies');
      if (allComps.length > 0 && allComps[0].currency) return allComps[0].currency;
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
  function toMarketRiyal(fcfaVal) {
    const baseRiyal = Math.round(Number(fcfaVal || 0) / 5);
    if (baseRiyal < 200000) return baseRiyal;
    const millions = Math.floor(baseRiyal / 200000);
    const remainder = baseRiyal % 200000;
    return (millions * 1000000) + remainder;
  }
  function fromMarketRiyal(marketRiyal) {
    const num = Number(marketRiyal || 0);
    if (num < 1000000) return num * 5;
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    const baseRiyal = (millions * 200000) + remainder;
    return baseRiyal * 5;
  }
  function toInputMoney(fcfaVal) {
    if (fcfaVal === undefined || fcfaVal === null || fcfaVal === '') return '';
    const num = (typeof I18n !== 'undefined' && I18n.parseNum) ? I18n.parseNum(fcfaVal) : parseFloat(parseArabicDigits(fcfaVal));
    if (isNaN(num)) return '';
    return isRiyalMode() ? toMarketRiyal(num) : num;
  }
  function fromInputMoney(inputVal) {
    if (inputVal === undefined || inputVal === null || inputVal === '') return NaN;
    const num = (typeof I18n !== 'undefined' && I18n.parseNum) ? I18n.parseNum(inputVal) : parseFloat(parseArabicDigits(inputVal));
    if (isNaN(num)) return NaN;
    return isRiyalMode() ? fromMarketRiyal(num) : num;
  }
  function fmtCurrency(n, symbol = null) {
    if (!symbol) {
      const cur = getCurrency();
      const syms = { RWF: ' FRW', FCFA: ' FCFA', USD: ' $', EGP: ' E£', EUR: ' €', GBP: ' £' };
      symbol = syms[cur] || (' ' + cur);
    }
    if (isRiyalMode() && !String(symbol).includes('ريال')) {
      const riyal = toMarketRiyal(n);
      return fmt(riyal, 0) + ' ريال (FCFA ' + fmt(n, 0) + ')';
    }
    return fmt(n, 0) + symbol;
  }
  function fmtDate(d) { if (!d) return '—'; try { return new Date(d).toLocaleDateString((typeof I18n !== 'undefined' && I18n.getLang() === 'ar' ? 'ar-EG' : (typeof I18n !== 'undefined' && I18n.getLang() === 'fr' ? 'fr-FR' : 'en-GB')), { day:'2-digit', month:'short', year:'numeric' }); } catch { return d; } }
  function fmtPct(n) { return fmt(n, 1) + '%'; }

  // ── Initialise ────────────────────────
  function init() {
    I18n.init(); // Initialize language & direction first
    localStorage.removeItem('sims_theme');
    document.body.classList.remove('theme-nordic');
    if (!Auth.requireAuth()) return;

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

    const isMasterOwner = user && (user.role === 'platform_owner' || user.email?.toLowerCase() === 'abdouamine@gmail.com' || user.username?.toLowerCase() === 'abdouamine@gmail.com' || user.username?.toLowerCase() === 'abdouamine');
    const isLocalEmpty = typeof DB !== 'undefined' && DB.getAll('products').length === 0 && DB.getAll('sales').length === 0;
    const hasBackendToken = sessionStorage.getItem('sims_token') || localStorage.getItem('sims_token');
    if (typeof DB !== 'undefined' && DB.syncFromBackend && !isMasterOwner && hasBackendToken) {
      const cont = document.getElementById('mainContent');
      if (cont) {
        cont.innerHTML = `
          <div class="fade-in" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 65vh; text-align: center;">
            <div class="spinner" style="width: 54px; height: 54px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: simsSpin 0.8s linear infinite; margin-bottom: 22px;"></div>
            <h3 style="margin-bottom: 8px; font-size: 1.25rem; font-weight: 600; color: var(--text);">${I18n.choose('Syncing your workspace data...', 'جاري تحميل بيانات مساحة العمل...', 'Chargement des données de votre espace de travail...')}</h3>
            <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 420px; line-height: 1.5;">${I18n.choose('Please wait a moment while we securely fetch your latest inventory and sales analytics from the cloud.', 'يرجى الانتظار قليلاً بينما نقوم بجلب أحدث بيانات المخزون والمبيعات من السحابة.', 'Veuillez patienter un instant pendant la récupération de vos données de stock et de ventes depuis le cloud.')}</p>
          </div>
          <style>@keyframes simsSpin { 100% { transform: rotate(360deg); } }</style>
        `;
      }
      DB.syncFromBackend().finally(() => {
        if (Auth.isLoggedIn()) navigate(page);
      });
    } else {
      navigate(page);
    }

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
        <div class="page-title"><h2>${t('page_settings')}</h2><p>${I18n.choose('Manage your profile and system preferences', 'إدارة ملفك الشخصي وتفضيلات النظام', 'Gérer votre profil et vos préférences système')}</p></div>
      </div>

      <div class="settings-grid">
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
                <label>${I18n.choose('Full Name', 'الاسم الكامل', 'Nom complet')}</label>
                <input class="input" id="profName" value="${user?.name || ''}" placeholder="Your name">
              </div>
              <div class="field">
                <label>${t('login_email')}</label>
                <input class="input" id="profEmail" type="email" value="${user?.email || ''}" placeholder="your@email.com">
              </div>
              <div class="field">
                <label>${I18n.choose('Phone', 'الهاتف', 'Téléphone')}</label>
                <input class="input" id="profPhone" value="${user?.phone || ''}" placeholder="+250...">
              </div>
              <div class="field">
                <label>${I18n.choose('Business Name', 'اسم العمل التجاري', 'Nom de l\'entreprise')}</label>
                <input class="input" id="profBusiness" value="${user?.business || ''}" placeholder="My Import Business">
              </div>
              <div class="field">
                <label>${I18n.choose('Company Currency', 'عملة الشركة', 'Devise de l\'entreprise')}</label>
                <select class="select" id="profCurrency">
                  <option value="USD" ${(getCurrency()==='USD')?'selected':''}>USD ($) - US Dollar</option>
                  <option value="RWF" ${(getCurrency()==='RWF')?'selected':''}>RWF (FRW) - Rwandan Franc</option>
                  <option value="FCFA" ${(getCurrency()==='FCFA')?'selected':''}>FCFA (F) - Central/West African CFA</option>
                  <option value="EGP" ${(getCurrency()==='EGP')?'selected':''}>EGP (E£) - Egyptian Pound</option>
                  <option value="EUR" ${(getCurrency()==='EUR')?'selected':''}>EUR (€) - Euro</option>
                </select>
              </div>
              <div style="grid-column:1/-1">
                <button type="submit" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px;">${UI.svg('check', 16)} ${I18n.choose('Save Profile', 'حفظ الملف الشخصي', 'Enregistrer le profil')}</button>
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
                <label>${I18n.choose('Current Password', 'كلمة المرور الحالية', 'Mot de passe actuel')}</label>
                <input class="input" type="password" id="currentPwd" placeholder="Current password">
              </div>
              <div class="field">
                <label>${I18n.choose('New Password', 'كلمة المرور الجديدة', 'Nouveau mot de passe')}</label>
                <input class="input" type="password" id="newPwd" placeholder="New password (min 6 chars)">
              </div>
              <div class="field">
                <label>${I18n.choose('Confirm New Password', 'تأكيد كلمة المرور الجديدة', 'Confirmer le nouveau mot de passe')}</label>
                <input class="input" type="password" id="confirmPwd" placeholder="Repeat new password">
              </div>
              <div>
                <button type="submit" class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px;">${UI.svg('lock', 16)} ${t('set_password')}</button>
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
                <span style="color:var(--text-secondary);font-weight:600">${I18n.choose('Total Sales Records', 'إجمالي المبيعات', 'Total des ventes enregistrées')}</span><strong style="font-size:1.05rem">${DB.count('sales')}</strong>
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
                <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:4px;">${UI.svg('user', 14)} <span style="color:var(--primary);font-weight:600;">${c.admin_email || 'admin@' + c.name.toLowerCase().replace(/\s+/g, '') + '.com'}</span></div>
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
                  <button class="btn btn-sm btn-outline" style="padding:4px 8px;font-size:11.5px;display:inline-flex;align-items:center;gap:4px;" onclick="UI.promptPlanChange('${c.id}', '${c.subscription_plan}')">${svg('tag', 13)} Plan</button>
                  <button class="btn btn-sm btn-outline" style="padding:4px 8px;font-size:11.5px;display:inline-flex;align-items:center;gap:4px;" onclick="UI.toggleCompanyStatus('${c.id}', '${c.status === 'active' ? 'suspended' : 'active'}')">
                    ${c.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                  <button class="btn btn-sm btn-outline" style="padding:4px 8px;font-size:11.5px;color:#ef4444;border-color:rgba(239,68,68,0.3);display:inline-flex;align-items:center;gap:4px;" onclick="UI.deleteCompany('${c.id}', '${(c.name||'Company').replace(/'/g, "\\'")}')" title="Delete Company">${svg('del', 13)} Delete</button>
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
              <button class="btn btn-primary" style="display:flex;align-items:center;gap:6px;border-radius:10px;font-weight:700;box-shadow:0 4px 10px rgba(99,102,241,0.25);" onclick="UI.showCreateCompanyModal()">${svg('plus', 16)} Add New Tenant Company</button>
              <button class="btn btn-secondary" style="display:flex;align-items:center;gap:6px;border-radius:10px;font-weight:700;border:1px solid rgba(16,185,129,0.4);color:#10b981;" onclick="UI.showRecoverTenantsModal()">${svg('restore', 16)} Recover Tenants</button>
              <button class="btn btn-danger" style="display:flex;align-items:center;gap:6px;border-radius:10px;font-weight:700;" onclick="UI.removeAllCompanies()">${svg('del', 16)} Remove All Companies</button>
            </div>
          </div>

          <!-- 4 Executive NexaDash KPI Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-bottom:24px;">
            <!-- Card 1: MRR -->
            <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,0.12);display:flex;align-items:center;justify-content:center;color:#10b981;">${svg('dollar', 22)}</div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Monthly Recurring (MRR)</div>
                </div>
                <span class="badge" style="background:#10b981;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">+24.5%</span>
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
                  <div style="width:44px;height:44px;border-radius:12px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;color:#6366f1;">${svg('trending_up', 22)}</div>
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
                  <div style="width:44px;height:44px;border-radius:12px;background:rgba(139,92,246,0.12);display:flex;align-items:center;justify-content:center;color:#8b5cf6;">${svg('pie_chart', 22)}</div>
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
                  <div style="width:44px;height:44px;border-radius:12px;background:rgba(14,165,233,0.12);display:flex;align-items:center;justify-content:center;color:#0ea5e9;">${svg('building', 22)}</div>
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
      const allCompanies = DB.getAll('companies');
      const targetComp = allCompanies.find(c => c.id == id);
      if (targetComp) {
        const archived = getArchivedCompanies();
        if (!archived.some(c => c.id == id)) {
          archived.push(targetComp);
          localStorage.setItem('sims_archived_companies', JSON.stringify(archived));
        }
      }
      const allUsers = DB.getAll('users');
      const targetAdm = allUsers.find(u => u.company_id == id || u.company == id);
      if (targetAdm) {
        const archivedAdmins = getArchivedAdmins();
        if (!archivedAdmins.some(a => a.email && targetAdm.email && a.email.toLowerCase() === targetAdm.email.toLowerCase())) {
          archivedAdmins.push(targetAdm);
          localStorage.setItem('sims_archived_admins', JSON.stringify(archivedAdmins));
        }
      }

      const rows = allCompanies.filter(c => c.id != id);
      localStorage.setItem('sims_companies', JSON.stringify(rows));
      const users = allUsers.filter(u => u.company_id != id && u.company != id);
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
      createModal('recoverTenantsModal', 'Recover Deleted Tenant Companies',
        `<div style="text-align:center;padding:36px 20px;">
          <div style="width:56px;height:56px;border-radius:16px;background:rgba(100,116,139,0.1);color:var(--text-muted);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">${svg('box', 32)}</div>
          <h3 style="margin:0 0 8px;font-size:18px;color:var(--text-main);">Recovery Bin is Empty</h3>
          <p style="margin:0;color:var(--text-muted);font-size:13.5px;">There are no deleted tenant companies available to restore. Your system is clean.</p>
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
            <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;">${svg('mail', 14)} ${comp.admin_email} | Tier: <strong style="text-transform:uppercase;">${comp.subscription_plan}</strong></div>
          </div>
          <div>
            ${isRestored 
              ? `<span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;padding:6px 12px;border-radius:20px;font-weight:700;font-size:12px;">Restored</span>` 
              : `<button class="btn btn-sm btn-primary" style="padding:6px 14px;font-size:12px;font-weight:700;" onclick="UI.recoverSingleTenant(${comp.id})">+ Restore Tenant</button>`
            }
          </div>
        </div>
      `;
    }).join('');

    createModal('recoverTenantsModal', 'Recover Deleted Tenant Companies',
      `<p style="margin-top:0;margin-bottom:16px;color:var(--text-muted);font-size:13.5px;">
        Restore individual tenant companies or purge the recovery bin permanently.
      </p>
      <div>${rowsHtml}</div>`,
      `<button class="btn btn-danger" style="margin-right:auto;font-weight:700;display:inline-flex;align-items:center;gap:6px;" onclick="UI.clearRecoveryBin()">${svg('del', 15)} Purge Recovery Bin</button>
       <button class="btn btn-ghost" onclick="UI.closeModal('recoverTenantsModal')">Close</button>
       <button class="btn btn-secondary" style="border:1px solid rgba(16,185,129,0.4);color:#10b981;font-weight:700;display:inline-flex;align-items:center;gap:6px;" onclick="UI.recoverAllDeletedTenants()">${svg('restore', 15)} Restore All</button>`
    );
  }

  async function recoverSingleTenant(id) {
    const archived = getArchivedCompanies();
    const comp = archived.find(c => c.id === id);
    if (!comp) return;
    const archivedAdmins = getArchivedAdmins();
    let adm = archivedAdmins.find(a => a.company_id === id);

    if (typeof DB !== 'undefined') {
      const activeUsers = DB.getAll('users');
      if (activeUsers.some(u => u.email && comp.admin_email && u.email.toLowerCase() === comp.admin_email.toLowerCase())) {
        const newEmail = prompt(
          `Email "${comp.admin_email}" is currently already in use by another active company.\n\nPlease enter a NEW email address for restoring "${comp.name}" admin:`,
          `recovered_${comp.admin_email}`
        );
        if (!newEmail) {
          toast('warning', 'Recovery Cancelled', 'A unique email address is required to restore this company.');
          return;
        }
        comp.admin_email = newEmail.strip ? newEmail.strip() : newEmail.trim();
        if (adm) {
          adm.email = comp.admin_email;
          adm.username = comp.admin_email.split('@')[0];
        } else {
          adm = {
            name: `${comp.name} Admin`,
            username: comp.admin_email.split('@')[0],
            email: comp.admin_email,
            role: 'admin',
            company_id: id,
            business: comp.name,
            currency: comp.currency || 'FCFA',
            is_active: true
          };
        }
      }
    }

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
          DB.insert('users', { ...adm, passwordHash: pwHash, password_hash: pwHash, password: 'RecoveredPassword123!' });
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
       <button class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px;" onclick="UI.saveChangedPlan('${id}')">${UI.svg('check', 16)} Save Plan & Fee</button>`
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
    createModal('createCompanyModal', `<span style="display:inline-flex;align-items:center;gap:8px;">${UI.svg('home', 20)} Add New Tenant Company</span>`,
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
          <strong style="display: flex; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 4px; color: var(--primary);">${UI.svg('user', 16)} Initial Admin User Credentials</strong>
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
       <button class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px;" onclick="UI.saveNewCompany()">${UI.svg('plus', 16)} Create Tenant & Send Invite</button>`
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
    let backendComp = null;
    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        backendComp = await ApiClient.createCompany({
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

    if (typeof DB !== 'undefined') {
      const existingUser = DB.getAll('users').find(u => (u.email && u.email.toLowerCase() === adminEmail.toLowerCase()) || (u.username && u.username.toLowerCase() === adminUsername.toLowerCase()));
      const pwHash = await DB.hashPassword(adminPwd);
      let compId = backendComp && backendComp.id ? backendComp.id : undefined;
      if (!existingUser) {
        const newComp = DB.insert('companies', {
          id: compId,
          name,
          subscription_plan: plan,
          monthly_fee: monthly_fee,
          status: 'active',
          currency,
          admin_email: adminEmail,
          created_at: new Date().toISOString()
        });
        DB.insert('users', {
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
        existingUser.username = adminUsername;
        existingUser.password = adminPwd;
        existingUser.passwordHash = pwHash;
        existingUser.password_hash = pwHash;
        DB.update('users', existingUser.id, existingUser);
      }
    } else if (!created) {
      toast('error', 'Creation Failed', 'Neither Backend API nor Local Storage is available.');
      return;
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

        createModal('tenantCreatedModal', 'Tenant Created & Activation Invitation Ready!',
          `<div style="text-align:center;padding:10px 0;">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(16,185,129,0.15);color:#10b981;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">${svg('check', 32)}</div>
            <h3 style="margin:0 0 8px;font-size:18px;color:var(--text-main);">${name}</h3>
            <p style="margin:0 0 16px;color:var(--text-muted);font-size:13.5px;">Send the activation invitation directly to <strong>${adminEmail}</strong>:</p>
            
            <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:left;margin-bottom:16px;">
              <div style="font-size:11.5px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">DIRECT ACTIVATION & PASSWORD LINK</div>
              <div style="display:flex;gap:8px;margin-bottom:12px;">
                <input type="text" readonly class="input" value="${activationUrl}" style="font-size:12px;background:var(--surface);cursor:text;" onclick="this.select()">
                <button class="btn btn-secondary" style="white-space:nowrap;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;" onclick="navigator.clipboard.writeText('${activationUrl}'); UI.toast('success', 'Copied!', 'Activation link copied to clipboard.');">${svg('copy', 14)} Copy Link</button>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">TENANT ADMIN CREDENTIALS</div>
              <div style="font-size:13.5px;color:var(--text-main);margin-bottom:4px;"><strong>Username:</strong> ${adminUsername}</div>
              <div style="font-size:13.5px;color:var(--text-main);"><strong>Email:</strong> ${adminEmail}</div>
            </div>

            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
              <a href="${gmailComposeUrl}" target="_blank" class="btn btn-primary" style="font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">${svg('mail', 16)} Send via Gmail</a>
              <a href="${mailtoUrl}" class="btn btn-secondary" style="font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">${svg('mail', 16)} Send via Email App</a>
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

  function lockBtn(btnElement, loadingText = null) {
    if (!btnElement) return false;
    if (btnElement.disabled || btnElement.dataset.locked === '1') return true; // ALREADY LOCKED, ABORT SUBMIT
    btnElement.disabled = true;
    btnElement.dataset.locked = '1';
    btnElement.dataset.origHtml = btnElement.innerHTML;
    const loadingTextFr = (typeof I18n !== 'undefined' && I18n.choose) ? I18n.choose('Saving...', 'جاري الحفظ...', 'Enregistrement en cours...') : 'Saving...';
    btnElement.innerHTML = `<span class="spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span>` + (loadingText || loadingTextFr);
    btnElement.style.opacity = '0.65';
    btnElement.style.cursor = 'not-allowed';
    return false; // PROCEED WITH EXECUTION
  }

  function unlockBtn(btnElement) {
    if (!btnElement) return;
    btnElement.disabled = false;
    btnElement.dataset.locked = '0';
    if (btnElement.dataset.origHtml) btnElement.innerHTML = btnElement.dataset.origHtml;
    btnElement.style.opacity = '1';
    btnElement.style.cursor = 'pointer';
  }

  const Settings = {};

  return {
    navigate, toggleSidebar, closeSidebar,
    toast, confirm, closeConfirm,
    openModal, closeModal, createModal, lockBtn, unlockBtn,
    handleSearch, closeSearch, showNotifications,
    fmt, fmtCurrency, fmtDate, fmtPct, canViewProfit, canEditProducts, updateStockBadge, getUnreadAlerts, getCurrency, getCurrencySymbol,
    parseArabicDigits, isRiyalMode, toMarketRiyal, fromMarketRiyal, toInputMoney, fromInputMoney,
    init, Settings, getCurrentPage: () => _currentPage,
    toggleCompanyStatus, promptPlanChange, saveChangedPlan, showCreateCompanyModal, saveNewCompany, resetTenantUserPwd, deleteCompany, removeAllCompanies, showRecoverTenantsModal, recoverSingleTenant, recoverAllDeletedTenants,
    svg, SVGS
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => { UI.init(); });
