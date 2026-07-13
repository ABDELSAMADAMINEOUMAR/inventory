/* =============================================
   PRODUCTS.JS — Product Management Module
   Smart Import & Sales Management System
   ============================================= */

const Products = (() => {
  let _editId = null;
  let _imgData = null;
  let _searchQ = '';
  let _filterCat = '';
  let _filterStatus = '';

  function render(container) {
    const products = DB.getAllEnrichedProducts();
    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title">
          <h2>📦 ${t('page_products')}</h2>
          <p>${products.length} ${I18n.getLang() === 'ar' ? 'منتجات في الكتالوج' : 'products in catalogue'}</p>
        </div>
        <div class="page-actions">
          ${UI.canEditProducts() ? `<button class="btn btn-primary" onclick="Products.openAdd()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${t('btn_add_product')}
          </button>` : ''}
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-search">
          <svg class="filter-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="input filter-search" id="prodSearch" placeholder="${I18n.getLang() === 'ar' ? 'ابحث عن اسم أو رمز…' : 'Search by name or code…'}" oninput="Products.setFilter('search', this.value)">
        </div>
        <select class="select" id="catFilter" onchange="Products.setFilter('cat', this.value)">
          <option value="">${I18n.getLang() === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
          ${DB.getAll('categories').map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        <select class="select" id="statusFilter" onchange="Products.setFilter('status', this.value)">
          <option value="">${I18n.getLang() === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
          <option value="available">${t('status_available')}</option>
          <option value="low">${t('status_low')}</option>
          <option value="out">${t('status_out')}</option>
        </select>
      </div>

      <!-- Products Table -->
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${t('th_image')}</th>
                <th>${t('th_code')}</th>
                <th>${t('th_product')}</th>
                <th>${t('th_category')}</th>
                <th>${t('th_supplier')}</th>
                <th>${t('th_bought')}</th>
                <th>${t('th_stock')}</th>
                <th>${t('th_cpu')}</th>
                <th>${t('th_status')}</th>
                <th>${t('th_actions')}</th>
              </tr>
            </thead>
            <tbody id="productsTbody"></tbody>
          </table>
        </div>
        <div class="pagination" id="productsPagination"></div>
      </div>
    </div>`;

    renderTable();
  }

  function filtered() {
    return DB.getAllEnrichedProducts().filter(p => {
      const q = _searchQ.toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q);
      const matchCat = !_filterCat || p.categoryId == _filterCat;
      const matchStatus = !_filterStatus || p.stockStatus === _filterStatus;
      return matchQ && matchCat && matchStatus;
    });
  }

  function setFilter(type, val) {
    if (type === 'search') _searchQ = val;
    if (type === 'cat')    _filterCat = val;
    if (type === 'status') _filterStatus = val;
    renderTable();
  }

  function renderTable() {
    const body = document.getElementById('productsTbody');
    if (!body) return;
    const data = filtered();

    if (!data.length) {
      body.innerHTML = `<tr><td colspan="10"><div class="empty-state"><div class="empty-icon">📦</div><h3>${I18n.getLang() === 'ar' ? 'لم يتم العثور على منتجات' : 'No products found'}</h3><p>${I18n.getLang() === 'ar' ? 'أضف منتجك الأول أو اضبط الفلاتر.' : 'Add your first product or adjust the filters.'}</p><button class="btn btn-primary" onclick="Products.openAdd()">${t('btn_add_product')}</button></div></td></tr>`;
      return;
    }

    body.innerHTML = data.map(p => `
      <tr>
        <td>
          ${p.image
            ? `<img src="${p.image}" class="product-thumb" alt="${p.name}">`
            : `<div class="product-thumb-placeholder">📦</div>`}
        </td>
        <td><span class="badge badge-purple" style="font-family:monospace">${p.code}</span></td>
        <td>
          <div style="font-weight:600;font-size:0.875rem">${p.name}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${p.description?.slice(0,40) || ''}</div>
        </td>
        <td class="td-muted">${p.categoryName}</td>
        <td class="td-muted">${p.supplierName}</td>
        <td class="text-center">${p.quantity}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-weight:600;min-width:24px">${p.currentStock}</span>
            <div class="progress-bar" style="width:60px">
              <div class="progress-fill" style="width:${p.quantity > 0 ? Math.min(100, p.currentStock/p.quantity*100) : 0}%"></div>
            </div>
          </div>
        </td>
        <td class="fw-600 text-accent">${UI.fmtCurrency(p.costPerUnit)}</td>
        <td>${stockBadge(p.stockStatus)}</td>
        <td>
          <div class="actions">
            <button class="act-btn view" onclick="Products.view(${p.id})" title="View Details">👁</button>
            ${UI.canEditProducts() ? `<button class="act-btn edit" onclick="Products.openEdit(${p.id})" title="Edit">✏️</button>
            <button class="act-btn del"  onclick="Products.delete(${p.id})" title="Delete">🗑️</button>` : ''}
          </div>
        </td>
      </tr>`).join('');
  }

  function stockBadge(s) {
    const m = { available:'badge-success', low:'badge-warning', out:'badge-danger' };
    const labelKey = 'status_' + s;
    return `<span class="badge ${m[s]||'badge-muted'}">${t(labelKey) || s}</span>`;
  }

  function buildForm(p = {}) {
    const cats = DB.getAll('categories');
    return `
    <div class="form-grid form-grid-2">
      <div class="field col-span-2">
        <label>${t('lbl_image')}</label>
        <div class="img-upload" id="imgUpload" onclick="document.getElementById('imgInput').click()">
          <input type="file" id="imgInput" accept="image/*" onchange="Products.handleImage(event)">
          <div id="imgPreviewWrap">
            ${p.image ? `<img src="${p.image}" class="img-preview" id="imgPreview">` : `<div class="img-upload-icon">📷</div><p>${I18n.getLang() === 'ar' ? 'انقر لرفع صورة المنتج' : 'Click to upload product image'}</p><small>${I18n.getLang() === 'ar' ? 'JPG، PNG، WebP — بحد أقصى 2 ميجابايت' : 'JPG, PNG, WebP — max 2MB'}</small>`}
          </div>
        </div>
      </div>
      <div class="field">
        <label>${t('lbl_code')}</label>
        <input class="input" id="fCode" value="${p.code || 'Auto-generated'}" readonly>
      </div>
      <div class="field">
        <label>${t('lbl_name')} <span class="req">*</span></label>
        <input class="input" id="fName" value="${p.name || ''}" placeholder="${t('ph_name')}" required>
      </div>
      <div class="field">
        <label>${t('lbl_category')} <span class="req">*</span></label>
        <input class="input" type="text" id="fCatSearch" placeholder="🔍 Search category..." oninput="Products.filterCategories()" style="margin-bottom:6px">
        <select class="select" id="fCat" required>
          <option value="">${I18n.getLang() === 'ar' ? 'اختر فئة' : 'Select category'}</option>
          ${cats.map(c => `<option value="${c.id}" data-search="${c.name.toLowerCase()}" ${p.categoryId==c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>${t('lbl_supplier')}</label>
        <input class="input" id="fSupp" value="${p.supplierName && p.supplierName !== 'N/A' ? p.supplierName : (p.supplierId ? '' : '')}" placeholder="${t('ph_supplier')}">
      </div>
      <div class="field">
        <label>${t('lbl_price')} (${UI.isRiyalMode() ? 'ريال' : UI.getCurrency()}) <span class="req">*</span></label>
        <input class="input" type="text" id="fPrice" value="${UI.toInputMoney(p.purchasePrice)}" placeholder="0" oninput="Products.calcPreview()" required>
        ${UI.isRiyalMode() ? '<div id="fPriceFCFAHint" style="font-size:0.75rem;color:var(--accent);font-weight:600;margin-top:2px"></div>' : ''}
      </div>
      <div class="field">
        <label>${t('lbl_qty')} <span class="req">*</span></label>
        <input class="input" type="number" id="fQty" value="${p.quantity||''}" placeholder="e.g. 100" required>
      </div>
      <div class="field">
        <label>${t('lbl_date')}</label>
        <input class="input" type="date" id="fDate" value="${p.purchaseDate||''}">
      </div>
      <div class="field col-span-2">
        <label>${t('lbl_desc')}</label>
        <textarea class="textarea" id="fDesc" placeholder="${I18n.getLang() === 'ar' ? 'وصف المنتج…' : 'Product description…'}">${p.description||''}</textarea>
      </div>
    </div>

    <!-- Import Expenses Section -->
    <div class="divider"></div>
    <div style="font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
      ${t('lbl_import_exp')}
      <button type="button" class="btn btn-sm btn-outline-primary" onclick="Products.addExpenseRow()">+ ${t('btn_add')}</button>
    </div>
    <div id="expensesList">
      ${buildExpenseRows(p.id)}
    </div>
    <div style="background:var(--bg-elevated);border-radius:10px;padding:12px 16px;margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="color:var(--text-secondary)">${t('lbl_cpu_preview')}:</span>
      <span style="font-size:1.1rem;font-weight:700;color:var(--accent)" id="costPerUnitPreview">0 ${UI.getCurrency()}</span>
    </div>`;
  }

  function buildExpenseRows(productId) {
    const expenses = productId ? DB.query('productExpenses', e => e.productId === productId) : [];
    if (!expenses.length) {
      return expenseRowHTML({ expenseType: 'Shipping', amount: '' });
    }
    return expenses.map(e => expenseRowHTML(e)).join('');
  }

  function expenseRowHTML(e = {}) {
    const types = ['Purchase Cost','Shipping','Customs Duty','Transportation','Packaging','Insurance','Warehouse','Taxes','Other'];
    return `
    <div class="expense-row" style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;margin-bottom:10px;align-items:center;">
      <select class="select" onchange="Products.calcPreview()">
        ${types.map(t => `<option ${e.expenseType===t?'selected':''}>${t}</option>`).join('')}
      </select>
      <input class="input expense-amount" type="number" value="${e.amount||''}" placeholder="Amount (${UI.getCurrency()})" oninput="Products.calcPreview()">
      <button type="button" onclick="this.closest('.expense-row').remove();Products.calcPreview()" title="Delete Cost Item" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;padding:8px 14px;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;transition:0.2s;">🗑️ Delete</button>
    </div>`;
  }

  function addExpenseRow() {
    const list = document.getElementById('expensesList');
    if (list) list.insertAdjacentHTML('beforeend', expenseRowHTML());
  }

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { UI.toast('error', 'Image too large', 'Max size is 2MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      _imgData = ev.target.result;
      const wrap = document.getElementById('imgPreviewWrap');
      if (wrap) wrap.innerHTML = `<img src="${_imgData}" class="img-preview" id="imgPreview">`;
    };
    reader.readAsDataURL(file);
  }

  function calcPreview() {
    const rawPrice = document.getElementById('fPrice')?.value;
    const price = UI.fromInputMoney(rawPrice) || 0;
    const hint = document.getElementById('fPriceFCFAHint');
    if (hint && UI.isRiyalMode()) {
      hint.textContent = rawPrice ? `= ${UI.fmt(price, 0)} FCFA` : '';
    }
    const qty   = parseInt(document.getElementById('fQty')?.value) || 1;
    const expAmounts = [...document.querySelectorAll('.expense-amount')].map(i => parseFloat(i.value) || 0);
    const totalExp = expAmounts.reduce((a, v) => a + v, 0);
    const total = price + totalExp;
    const cpu = qty > 0 ? total / qty : total;
    const el = document.getElementById('costPerUnitPreview');
    if (el) el.textContent = UI.fmtCurrency(cpu);
  }

  function openAdd() {
    if (!UI.canEditProducts()) { UI.toast('error', 'Not Allowed', 'You do not have permission to add products.'); return; }
    _editId = null;
    _imgData = null;
    UI.createModal('productModal', '📦 Add New Product',
      buildForm(),
      `<button class="btn btn-ghost" onclick="UI.closeModal('productModal')">Cancel</button>
       <button class="btn btn-primary" onclick="Products.save()">💾 Save Product</button>`,
      'modal-lg'
    );
    calcPreview();
  }

  function openEdit(id) {
    if (!UI.canEditProducts()) { UI.toast('error', 'Not Allowed', 'You do not have permission to edit products.'); return; }
    _editId = id;
    _imgData = null;
    const p = DB.getEnrichedProduct(id);
    if (!p) return;
    UI.createModal('productModal', '✏️ Edit Product',
      buildForm(p),
      `<button class="btn btn-ghost" onclick="UI.closeModal('productModal')">Cancel</button>
       <button class="btn btn-primary" onclick="Products.save()">💾 Update Product</button>`,
      'modal-lg'
    );
    calcPreview();
  }

  async function save() {
    const saveBtn = document.getElementById('productModal')?.querySelector('.btn-primary');
    if (saveBtn) {
      if (saveBtn.disabled) return;
      saveBtn.disabled = true;
      saveBtn.style.opacity = '0.65';
    }

    const code  = document.getElementById('fCode')?.value.trim();
    const name  = document.getElementById('fName')?.value.trim();
    const catId = document.getElementById('fCat')?.value;
    const supplierName = document.getElementById('fSupp')?.value.trim();
    const price = UI.fromInputMoney(document.getElementById('fPrice')?.value);
    const qty   = parseInt(document.getElementById('fQty')?.value);
    const currency = UI.getCurrency();
    const rate  = 1;
    const date  = document.getElementById('fDate')?.value;
    const desc  = document.getElementById('fDesc')?.value.trim();

    if (!name || !catId || isNaN(price) || isNaN(qty)) {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; }
      UI.toast('error', 'Missing Fields', 'Please fill in all required fields.'); return;
    }
    if (qty < 0 || price < 0) {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; }
      UI.toast('error', 'Invalid values'); return;
    }

    const data = {
      code, name, categoryId: parseInt(catId),
      supplierId: null, supplierName,
      purchasePrice: price, quantity: qty, currency, exchangeRate: rate,
      purchaseDate: date, description: desc,
      image: _imgData || (DB.getById('products', _editId)?.image || null),
    };

    let productId;
    try {
      if (_editId) {
        await DB.update('products', _editId, data);
        productId = _editId;
        // Remove old expenses then re-add
        const oldExps = DB.query('productExpenses', e => e.productId === _editId);
        for (const e of oldExps) { await DB.remove('productExpenses', e.id); }
      } else {
        const prod = await DB.insert('products', data);
        productId = prod?.id;
      }

      // Save expenses
      const rows = document.querySelectorAll('.expense-row');
      for (const row of rows) {
        const type = row.querySelector('select')?.value;
        const amount = parseFloat(row.querySelector('.expense-amount')?.value) || 0;
        if (amount > 0) {
          await DB.insert('productExpenses', { productId, expenseType: type, amount, note: '', date: date || new Date().toISOString().split('T')[0] });
        }
      }
    } catch (err) {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.style.opacity = '1'; }
      UI.toast('error', 'Not Allowed', err.message || 'The server rejected this action.');
      return;
    }

    UI.closeModal('productModal');
    UI.toast('success', _editId ? 'Product Updated' : 'Product Added', `"${name}" has been saved.`);
    UI.navigate('products');
  }

  async function del(id) {
    if (!UI.canEditProducts()) { UI.toast('error', 'Not Allowed', 'You do not have permission to delete products.'); return; }
    const p = DB.getById('products', id);
    if (!p) return;
    const ok = await UI.confirm('Delete Product?', `"${p.name}" will be permanently deleted along with all its expenses.`);
    if (!ok) return;
    try {
      const exps = DB.query('productExpenses', e => e.productId === id);
      for (const e of exps) { await DB.remove('productExpenses', e.id); }
      await DB.remove('products', id);
    } catch (err) {
      UI.toast('error', 'Not Allowed', err.message || 'The server rejected this action.');
      return;
    }
    UI.toast('success', 'Product Deleted');
    renderTable();
  }

  function view(id) {
    const p = DB.getEnrichedProduct(id);
    if (!p) return;
    const exps = DB.query('productExpenses', e => e.productId === id);
    const salesRecs = DB.query('sales', s => s.productId === id);
    const totalRevenue = salesRecs.reduce((a, s) => a + s.revenue, 0);
    const totalProfit  = salesRecs.reduce((a, s) => a + s.profit, 0);
    const soldQty = salesRecs.reduce((a, s) => a + s.quantity, 0);

    const body = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div>
        ${p.image ? `<img src="${p.image}" style="width:100%;border-radius:12px;object-fit:contain;max-height:200px;background:var(--bg-elevated)">` : `<div style="width:100%;height:180px;background:var(--bg-elevated);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:64px">📦</div>`}
        <div style="margin-top:12px;">
          <span class="badge badge-purple" style="font-family:monospace">${p.code}</span>
          ${stockBadge(p.stockStatus)}
        </div>
      </div>
      <div>
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:8px">${p.name}</h3>
        <div style="display:grid;gap:8px;font-size:0.875rem">
          ${row('Category', p.categoryName)}
          ${row('Supplier', p.supplierName)}
          ${row('Purchase Date', UI.fmtDate(p.purchaseDate))}
          ${row('Purchase Price', UI.fmtCurrency(p.purchasePrice))}
          ${row('Quantity Bought', p.quantity)}
          ${row('Current Stock', `<strong>${p.currentStock}</strong>`)}
        </div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="kpi-grid" style="margin-bottom:16px">
      ${statBox('Total Import Cost', UI.fmtCurrency(p.totalCost), 'orange')}
      ${statBox('Cost Per Unit', UI.fmtCurrency(p.costPerUnit), 'purple')}
      ${statBox('Total Expenses', UI.fmtCurrency(p.totalExpenses), 'red')}
      ${statBox('Units Sold', soldQty, 'blue')}
      ${statBox('Revenue Generated', UI.fmtCurrency(totalRevenue), 'green')}
      ${statBox('Profit Generated', UI.fmtCurrency(totalProfit), totalProfit>=0?'green':'red')}
    </div>
    ${exps.length ? `
    <div style="font-weight:600;margin-bottom:10px">💸 Import Expenses</div>
    <table style="font-size:0.85rem">
      <thead><tr><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
      <tbody>${exps.map(e => `<tr><td>${e.expenseType}</td><td class="text-accent">${UI.fmtCurrency(e.amount)}</td><td class="td-muted">${UI.fmtDate(e.date)}</td></tr>`).join('')}</tbody>
    </table>` : ''}
    ${p.description ? `<div class="divider"></div><p style="color:var(--text-secondary);font-size:0.875rem">${p.description}</p>` : ''}`;

    UI.createModal('viewProdModal', `📦 ${p.name}`, body,
      `<button class="btn btn-ghost" onclick="UI.closeModal('viewProdModal')">Close</button>
       <button class="btn btn-primary" onclick="UI.closeModal('viewProdModal');Products.openEdit(${p.id})">Edit</button>`,
      'modal-lg'
    );
  }

  function row(label, val) {
    return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-light)">
      <span style="color:var(--text-muted)">${label}</span><span>${val}</span></div>`;
  }
  function statBox(label, val, color) {
    const colors = { purple:'rgba(124,58,237,0.1)', green:'rgba(6,214,160,0.1)', orange:'rgba(245,158,11,0.1)', red:'rgba(239,68,68,0.1)', blue:'rgba(59,130,246,0.1)' };
    const tc = { purple:'var(--primary-light)', green:'var(--accent)', orange:'var(--warning)', red:'var(--danger)', blue:'#60A5FA' };
    return `<div style="background:${colors[color]||colors.purple};border-radius:10px;padding:12px;text-align:center">
      <div style="font-size:1rem;font-weight:700;color:${tc[color]||tc.purple}">${val}</div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${label}</div>
    </div>`;
  }

  function filterCategories() {
    const q = document.getElementById('fCatSearch')?.value.toLowerCase().trim() || '';
    const sel = document.getElementById('fCat');
    if (!sel) return;
    Array.from(sel.options).forEach(opt => {
      if (!opt.value) return;
      const searchStr = opt.dataset.search || opt.text.toLowerCase();
      opt.style.display = searchStr.includes(q) ? '' : 'none';
    });
    const visibleOpts = Array.from(sel.options).filter(opt => opt.value && opt.style.display !== 'none');
    if (visibleOpts.length === 1 && q.length >= 2) {
      sel.value = visibleOpts[0].value;
    }
  }

  return { render, setFilter, openAdd, openEdit, save, delete: del, view, addExpenseRow, handleImage, calcPreview, filterCategories };
})();
