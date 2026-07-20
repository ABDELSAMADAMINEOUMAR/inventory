/* =============================================
   INVENTORY.JS — Inventory Management Module
   Smart Import & Sales Management System
   ============================================= */

const Inventory = (() => {
  let _filter = 'all';

  function render(container) {
    const products = DB.getAllEnrichedProducts();
    const available = products.filter(p => p.stockStatus === 'available');
    const low = products.filter(p => p.stockStatus === 'low');
    const out = products.filter(p => p.stockStatus === 'out');
    const totalValue = products.reduce((a, p) => a + p.costPerUnit * p.currentStock, 0);
    const unread = typeof UI !== 'undefined' && UI.getUnreadAlerts ? UI.getUnreadAlerts() : [];

    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title"><h2 style="display:flex;align-items:center;gap:10px;">${UI.svg('inventory', 26)} ${t('page_inventory')}</h2><p>${I18n.choose('Real-time stock levels and alerts', 'مستويات المخزون والتنبيهات الحية', 'Niveaux de stock en temps réel et alertes')}</p></div>
        <div class="page-actions">
          ${UI.canEditProducts() ? `<button class="btn btn-ghost" onclick="UI.navigate('products')" style="display:inline-flex;align-items:center;gap:6px;">
            ${UI.svg('plus', 16)}
            ${t('btn_add_product')}
          </button>` : ''}
        </div>
      </div>

      <!-- Stock Summary Cards -->
      <div class="inventory-summary">
        <div class="inv-summary-card all">
          <div class="val">${products.length}</div>
          <div class="lbl">${t('kpi_products')}</div>
        </div>
        <div class="inv-summary-card ok">
          <div class="val">${available.length}</div>
          <div class="lbl">${t('status_available')}</div>
        </div>
        <div class="inv-summary-card low">
          <div class="val">${low.length}</div>
          <div class="lbl">${t('kpi_low_stock')}</div>
        </div>
        <div class="inv-summary-card out">
          <div class="val">${out.length}</div>
          <div class="lbl">${t('kpi_out_stock')}</div>
        </div>
        <div class="inv-summary-card all" style="background:rgba(124,58,237,0.08)">
          <div class="val" style="color:var(--primary-light)">${UI.fmtCurrency(totalValue)}</div>
          <div class="lbl">${t('kpi_inv_value')}</div>
        </div>
      </div>

      <!-- Alerts -->
      ${out.length && unread.some(p => p.stockStatus === 'out') ? `
      <div class="alert alert-danger alert-dismissible mb-16" style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="alert-icon">${UI.svg('alert', 22, 'text-danger')}</span>
          <div class="alert-content">
            <div class="alert-title">${I18n.choose('Out of Stock — ' + out.length + ' product(s)', 'نفد من المخزون — ' + out.length + ' منتج(ات)', 'Rupture de stock — ' + out.length + ' produit(s)')}</div>
            <div class="alert-body">${out.map(p => p.name).join(', ')}</div>
          </div>
        </div>
        <button onclick="this.closest('.alert').style.display='none'" style="background:none;border:none;cursor:pointer;font-size:18px;color:inherit;opacity:0.6;padding:4px;" title="${I18n.choose('Dismiss', 'إخفاء', 'Masquer')}">&times;</button>
      </div>` : ''}
      ${low.length && unread.some(p => p.stockStatus === 'low') ? `
      <div class="alert alert-warning alert-dismissible mb-16" style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="alert-icon">${UI.svg('alert', 22, 'text-warning')}</span>
          <div class="alert-content">
            <div class="alert-title">${I18n.choose('Low Stock — ' + low.length + ' product(s)', 'مخزون منخفض — ' + low.length + ' منتج(ات)', 'Stock faible — ' + low.length + ' produit(s)')}</div>
            <div class="alert-body">${low.map(p => `${p.name} (${p.currentStock} ${I18n.choose('left', 'متبقي', 'restant(s)')})`).join(', ')}</div>
          </div>
        </div>
        <button onclick="this.closest('.alert').style.display='none'" style="background:none;border:none;cursor:pointer;font-size:18px;color:inherit;opacity:0.6;padding:4px;" title="${I18n.choose('Dismiss', 'إخفاء', 'Masquer')}">&times;</button>
      </div>` : ''}

      <!-- Filter Tabs -->
      <div class="report-tabs">
        <button class="report-tab ${_filter === 'all' ? 'active' : ''}" onclick="Inventory.setFilter('all')">${I18n.choose('All Products', 'جميع المنتجات', 'Tous les produits')} (${products.length})</button>
        <button class="report-tab ${_filter === 'available' ? 'active' : ''}" onclick="Inventory.setFilter('available')">${t('status_available')} (${available.length})</button>
        <button class="report-tab ${_filter === 'low' ? 'active' : ''}" onclick="Inventory.setFilter('low')">${t('status_low')} (${low.length})</button>
        <button class="report-tab ${_filter === 'out' ? 'active' : ''}" onclick="Inventory.setFilter('out')">${t('status_out')} (${out.length})</button>
      </div>

      <!-- Inventory Table -->
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${t('th_product')}</th>
                <th>${t('th_code')}</th>
                <th>${t('th_category')}</th>
                <th>${t('th_supplier')}</th>
                <th>${t('th_bought')}</th>
                <th>${t('th_sold')}</th>
                <th>${t('th_in_stock')}</th>
                <th>${t('th_stock_level')}</th>
                <th>${t('th_cpu')}</th>
                <th>${t('th_stock_value')}</th>
                <th>${t('th_status')}</th>
                <th>${t('th_actions')}</th>
              </tr>
            </thead>
            <tbody id="inventoryTbody"></tbody>
          </table>
        </div>
      </div>
    </div>`;
    renderTable();
  }

  function setFilter(f) {
    _filter = f;
    document.querySelectorAll('.report-tab').forEach((el, i) => {
      const filters = ['all', 'available', 'low', 'out'];
      el.classList.toggle('active', filters[i] === f);
    });
    renderTable();
  }

  function renderTable() {
    const body = document.getElementById('inventoryTbody');
    if (!body) return;
    let products = DB.getAllEnrichedProducts();
    if (_filter !== 'all') products = products.filter(p => p.stockStatus === _filter);

    if (!products.length) {
      body.innerHTML = `<tr><td colspan="12"><div class="empty-state"><div class="empty-icon">${UI.svg('inventory', 48)}</div><h3>${I18n.choose('No products in this filter', 'لا توجد منتجات في هذا الفلتر', 'Aucun produit dans ce filtre')}</h3></div></td></tr>`;
      return;
    }

    body.innerHTML = products.map(p => {
      const sold = p.quantity - p.currentStock;
      const pct = p.quantity > 0 ? (p.currentStock / p.quantity) * 100 : 0;
      const stockValue = p.costPerUnit * p.currentStock;
      const barColor = pct > 50 ? 'var(--accent)' : pct > 20 ? 'var(--warning)' : 'var(--danger)';

      return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            ${p.image ? `<img src="${p.image}" style="width:28px;height:28px;border-radius:6px;object-fit:cover;flex-shrink:0">` : `<div style="width:28px;height:28px;border-radius:6px;background:rgba(124,58,237,0.1);display:flex;align-items:center;justify-content:center;color:var(--primary-light);flex-shrink:0">${UI.svg('box', 16)}</div>`}
            <div style="font-weight:600;font-size:0.83rem;line-height:1.2;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${p.name}">${p.name}</div>
          </div>
        </td>
        <td><span class="badge badge-purple" style="font-family:monospace;font-size:0.70rem;padding:2px 6px">${p.code}</span></td>
        <td class="td-muted" style="max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${p.categoryName}">${p.categoryName}</td>
        <td class="td-muted" style="max-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${p.supplierName}">${p.supplierName}</td>
        <td class="text-center">${p.quantity}</td>
        <td class="text-center td-muted">${sold}</td>
        <td style="font-weight:700;font-size:0.95rem;text-align:center;color:${p.currentStock === 0 ? 'var(--danger)' : p.currentStock <= 5 ? 'var(--warning)' : 'var(--accent)'}">${p.currentStock}</td>
        <td style="min-width:70px;max-width:90px">
          <div style="display:flex;align-items:center;gap:6px">
            <div class="progress-bar" style="flex:1">
              <div class="progress-fill" style="width:${pct}%;background:${barColor}"></div>
            </div>
            <span style="font-size:0.72rem;color:var(--text-muted);white-space:nowrap">${Math.round(pct)}%</span>
          </div>
        </td>
        <td class="fw-600 text-accent" style="white-space:nowrap;font-size:0.80rem">${UI.fmtCurrency(p.costPerUnit)}</td>
        <td class="fw-600" style="white-space:nowrap;font-size:0.80rem">${UI.fmtCurrency(stockValue)}</td>
        <td style="white-space:nowrap">${stockBadge(p.stockStatus)}</td>
        <td style="white-space:nowrap">
          ${UI.canEditProducts() ? `<button class="btn btn-sm btn-outline-primary" style="padding:4px 10px;font-size:0.75rem;white-space:nowrap" onclick="Products.openEdit(${p.id})">${t('btn_restock')}</button>` : `<span class="td-muted" style="font-size:0.75rem">${I18n.choose('Read Only', 'للعرض فقط', 'Lecture seule')}</span>`}
        </td>
      </tr>`;
    }).join('');
  }

  function stockBadge(s) {
    const m = { available: 'badge-success', low: 'badge-warning', out: 'badge-danger' };
    const labelKey = 'status_' + s;
    return `<span class="badge ${m[s] || 'badge-muted'}">${t(labelKey) || s}</span>`;
  }

  return { render, setFilter };
})();
