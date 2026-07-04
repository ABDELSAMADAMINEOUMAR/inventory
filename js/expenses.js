/* =============================================
   EXPENSES.JS — Import & Business Expenses Module
   Smart Import & Sales Management System
   ============================================= */

const Expenses = (() => {
  let _tab = 'import';
  let _editId = null;

  function render(container) {
    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title"><h2>💸 ${t('page_expenses')}</h2><p>${I18n.getLang() === 'ar' ? 'تتبع مصاريف العمل والاستيراد' : 'Track all business and import expenses'}</p></div>
        <div class="page-actions">
          <button class="btn btn-primary" id="addExpBtn" onclick="Expenses.openAdd()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${_tab === 'import' ? t('btn_add_expense') : t('btn_add') + ' ' + t('nav_expenses')}
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="kpi-grid stagger-children">
        ${summaryCard(t('lbl_import_exp'), DB.sum('productExpenses','amount'), 'orange', '📦')}
        ${summaryCard(I18n.getLang() === 'ar' ? 'مصاريف العمل' : 'Business Expenses', DB.sum('businessExpenses','amount'), 'red', '🏢')}
        ${summaryCard(t('kpi_expenses'), DB.sum('productExpenses','amount') + DB.sum('businessExpenses','amount'), 'purple', '💰')}
        ${summaryCard(I18n.getLang() === 'ar' ? 'الشهر الحالي' : 'This Month', monthlyExpenses(), 'blue', '📅')}
      </div>

      <!-- Tabs -->
      <div class="report-tabs">
        <button class="report-tab ${_tab==='import'?'active':''}" onclick="Expenses.switchTab('import')">📦 ${t('lbl_import_exp')}</button>
        <button class="report-tab ${_tab==='business'?'active':''}" onclick="Expenses.switchTab('business')">🏢 ${I18n.getLang() === 'ar' ? 'مصاريف العمل' : 'Business Expenses'}</button>
      </div>

      <div id="expTabContent"></div>
    </div>`;

    renderTab();
  }

  function monthlyExpenses() {
    const m = new Date().toISOString().slice(0, 7);
    return DB.sum('businessExpenses', 'amount', e => e.expenseDate?.startsWith(m));
  }

  function summaryCard(label, value, color, icon) {
    const colors = { orange:'rgba(245,158,11,0.1)', red:'rgba(239,68,68,0.1)', purple:'rgba(124,58,237,0.1)', blue:'rgba(59,130,246,0.1)' };
    const tc = { orange:'var(--warning)', red:'var(--danger)', purple:'var(--primary-light)', blue:'#60A5FA' };
    return `
    <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:18px;">
      <div style="font-size:24px;margin-bottom:8px">${icon}</div>
      <div style="font-size:1.3rem;font-weight:700;color:${tc[color]}">${UI.fmtCurrency(value)}</div>
      <div style="font-size:0.8rem;color:var(--text-muted)">${label}</div>
    </div>`;
  }

  function switchTab(tab) {
    _tab = tab;
    document.querySelectorAll('.report-tab').forEach((el, i) => el.classList.toggle('active', (i===0&&tab==='import')||(i===1&&tab==='business')));
    document.getElementById('addExpBtn').textContent = tab === 'import' ? '+' + t('lbl_import_exp') : '+' + (I18n.getLang() === 'ar' ? 'مصاريف العمل' : 'Business Expenses');
    renderTab();
  }

  function renderTab() {
    const c = document.getElementById('expTabContent');
    if (!c) return;
    if (_tab === 'import') renderImport(c);
    else renderBusiness(c);
  }

  function renderImport(c) {
    // Group by product
    const products = DB.getAll('products');
    const rows = products.map(p => {
      const exps = DB.query('productExpenses', e => e.productId === p.id);
      if (!exps.length) return null;
      const total = exps.reduce((a, e) => a + e.amount, 0);
      return { product: p, exps, total };
    }).filter(Boolean).sort((a,b) => b.total - a.total);

    if (!rows.length) {
      c.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-icon">📦</div><h3>${I18n.getLang() === 'ar' ? 'لا توجد مصاريف استيراد بعد' : 'No import expenses yet'}</h3><p>${I18n.getLang() === 'ar' ? 'تتم إضافة مصاريف الاستيراد عند إنشاء المنتجات.' : 'Import expenses are added when creating products.'}</p><button class="btn btn-primary" onclick="UI.navigate('products')">${I18n.getLang() === 'ar' ? 'اذهب للمنتجات' : 'Go to Products'}</button></div></div>`;
      return;
    }

    c.innerHTML = rows.map(r => `
    <div class="card" style="margin-bottom:14px">
      <div class="card-header">
        <div>
          <div style="font-weight:600">${r.product.name} <span class="badge badge-purple" style="font-family:monospace;margin-left:6px">${r.product.code}</span></div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${I18n.getLang() === 'ar' ? 'الإجمالي:' : 'Total:'} ${UI.fmtCurrency(r.total)} | ${r.product.quantity} ${I18n.getLang() === 'ar' ? 'وحدات' : 'units'} | ${I18n.getLang() === 'ar' ? 'التكلفة للوحدة:' : 'CPUnit:'} ${UI.fmtCurrency(r.total/r.product.quantity)}</div>
        </div>
        <span class="badge badge-warning">${UI.fmtCurrency(r.total)}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>${I18n.getLang() === 'ar' ? 'نوع المصروف' : 'Expense Type'}</th><th>${t('th_cost')}</th><th>${t('th_date')}</th><th>${t('lbl_note')}</th><th>${t('th_actions')}</th></tr></thead>
          <tbody>
            ${r.exps.map(e => `
            <tr>
              <td><span class="badge badge-muted">${e.expenseType}</span></td>
              <td class="text-accent fw-600">${UI.fmtCurrency(e.amount)}</td>
              <td class="td-muted">${UI.fmtDate(e.date)}</td>
              <td class="td-muted">${e.note||'—'}</td>
              <td><div class="actions">
                <button class="act-btn edit" onclick="Expenses.editImport(${e.id})" title="${t('btn_edit')}">✏️</button>
                <button class="act-btn del"  onclick="Expenses.deleteImport(${e.id})" title="${t('btn_delete')}">🗑️</button>
              </div></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`).join('');
  }

  function renderBusiness(c) {
    const exps = DB.getAll('businessExpenses').sort((a,b) => new Date(b.expenseDate) - new Date(a.expenseDate));
    if (!exps.length) {
      c.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-icon">🏢</div><h3>${I18n.getLang() === 'ar' ? 'لا توجد مصاريف عمل بعد' : 'No business expenses yet'}</h3><p>${I18n.getLang() === 'ar' ? 'تتبع الإيجار، الرواتب، الخدمات، وغيرها.' : 'Track rent, salaries, utilities and more.'}</p><button class="btn btn-primary" onclick="Expenses.openAdd()">${t('btn_add_expense')}</button></div></div>`;
      return;
    }
    c.innerHTML = `
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>${I18n.getLang() === 'ar' ? 'العنوان' : 'Title'}</th><th>${t('th_category')}</th><th>${t('th_cost')}</th><th>${t('th_date')}</th><th>${t('lbl_note')}</th><th>${t('th_actions')}</th></tr></thead>
      <tbody>
        ${exps.map(e => `
        <tr>
          <td style="font-weight:500">${e.title}</td>
          <td><span class="badge badge-info">${e.category||'—'}</span></td>
          <td class="text-accent fw-600">${UI.fmtCurrency(e.amount)}</td>
          <td class="td-muted">${UI.fmtDate(e.expenseDate)}</td>
          <td class="td-muted" style="max-width:200px">${e.note||'—'}</td>
          <td><div class="actions">
            <button class="act-btn edit" onclick="Expenses.editBusiness(${e.id})" title="${t('btn_edit')}">✏️</button>
            <button class="act-btn del"  onclick="Expenses.deleteBusiness(${e.id})" title="${t('btn_delete')}">🗑️</button>
          </div></td>
        </tr>`).join('')}
      </tbody>
    </table></div></div>`;
  }

  function openAdd() {
    _editId = null;
    if (_tab === 'import') openAddImport();
    else openAddBusiness();
  }

  // ── Import Expense ────────────────────────
  function importForm(e = {}, productId = '') {
    const products = DB.getAll('products');
    const expTypes = ['Purchase Cost','Shipping','Customs Duty','Transportation','Packaging','Insurance','Warehouse','Taxes','Other'];
    return `
    <div class="form-grid form-grid-2">
      <div class="field col-span-2">
        <label>Product <span class="req">*</span></label>
        <select class="select" id="ieProduct" required>
          <option value="">Select product</option>
          ${products.map(p => `<option value="${p.id}" ${(e.productId==p.id||productId==p.id)?'selected':''}>${p.name} (${p.code})</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Expense Type <span class="req">*</span></label>
        <select class="select" id="ieType">
          ${expTypes.map(t => `<option ${e.expenseType===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Amount (FCFA) <span class="req">*</span></label>
        <div class="input-prefix-wrap"><span class="input-prefix">F</span><input class="input" type="number" id="ieAmount" value="${e.amount||''}" placeholder="0" required></div>
      </div>
      <div class="field">
        <label>Date</label>
        <input class="input" type="date" id="ieDate" value="${e.date||new Date().toISOString().split('T')[0]}">
      </div>
      <div class="field">
        <label>Note</label>
        <input class="input" id="ieNote" value="${e.note||''}" placeholder="Optional note">
      </div>
    </div>`;
  }

  function openAddImport() {
    UI.createModal('ieModal', '📦 Add Import Expense', importForm(),
      `<button class="btn btn-ghost" onclick="UI.closeModal('ieModal')">Cancel</button>
       <button class="btn btn-primary" onclick="Expenses.saveImport()">💾 Save Expense</button>`
    );
  }

  function editImport(id) {
    _editId = id;
    const e = DB.getById('productExpenses', id);
    if (!e) return;
    UI.createModal('ieModal', '✏️ Edit Import Expense', importForm(e),
      `<button class="btn btn-ghost" onclick="UI.closeModal('ieModal')">Cancel</button>
       <button class="btn btn-primary" onclick="Expenses.saveImport()">💾 Update</button>`
    );
  }

  function saveImport() {
    const productId = parseInt(document.getElementById('ieProduct')?.value);
    const type   = document.getElementById('ieType')?.value;
    const amount = parseFloat(document.getElementById('ieAmount')?.value);
    const date   = document.getElementById('ieDate')?.value;
    const note   = document.getElementById('ieNote')?.value.trim();
    if (!productId || isNaN(amount) || amount <= 0) { UI.toast('error', 'Fill required fields'); return; }
    if (_editId) DB.update('productExpenses', _editId, { productId, expenseType: type, amount, date, note });
    else DB.insert('productExpenses', { productId, expenseType: type, amount, date, note });
    UI.closeModal('ieModal');
    UI.toast('success', _editId ? 'Expense Updated' : 'Expense Added');
    _tab = 'import'; _editId = null;
    UI.navigate('expenses');
  }

  async function deleteImport(id) {
    const ok = await UI.confirm('Delete Expense?', 'This import expense will be removed.');
    if (!ok) return;
    DB.remove('productExpenses', id);
    UI.toast('success', 'Expense Deleted');
    renderTab();
  }

  // ── Business Expense ──────────────────────
  function bizForm(e = {}) {
    const cats = ['Rent','Electricity','Internet','Fuel','Salary','Marketing','Office Supplies','Miscellaneous','Insurance','Maintenance','Other'];
    return `
    <div class="form-grid form-grid-2">
      <div class="field col-span-2">
        <label>Title <span class="req">*</span></label>
        <input class="input" id="beTitle" value="${e.title||''}" placeholder="e.g. Office Rent - July" required>
      </div>
      <div class="field">
        <label>Category</label>
        <select class="select" id="beCat">
          <option value="">Select category</option>
          ${cats.map(c => `<option ${e.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>Amount (FCFA) <span class="req">*</span></label>
        <div class="input-prefix-wrap"><span class="input-prefix">F</span><input class="input" type="number" id="beAmount" value="${e.amount||''}" placeholder="0" required></div>
      </div>
      <div class="field">
        <label>Date</label>
        <input class="input" type="date" id="beDate" value="${e.expenseDate||new Date().toISOString().split('T')[0]}">
      </div>
      <div class="field">
        <label>Note</label>
        <textarea class="textarea" id="beNote" placeholder="Optional note…">${e.note||''}</textarea>
      </div>
    </div>`;
  }

  function openAddBusiness() {
    UI.createModal('beModal', '🏢 Add Business Expense', bizForm(),
      `<button class="btn btn-ghost" onclick="UI.closeModal('beModal')">Cancel</button>
       <button class="btn btn-primary" onclick="Expenses.saveBusiness()">💾 Save Expense</button>`
    );
  }

  function editBusiness(id) {
    _editId = id;
    const e = DB.getById('businessExpenses', id);
    if (!e) return;
    UI.createModal('beModal', '✏️ Edit Business Expense', bizForm(e),
      `<button class="btn btn-ghost" onclick="UI.closeModal('beModal')">Cancel</button>
       <button class="btn btn-primary" onclick="Expenses.saveBusiness()">💾 Update</button>`
    );
  }

  function saveBusiness() {
    const title  = document.getElementById('beTitle')?.value.trim();
    const amount = parseFloat(document.getElementById('beAmount')?.value);
    const cat    = document.getElementById('beCat')?.value;
    const date   = document.getElementById('beDate')?.value;
    const note   = document.getElementById('beNote')?.value.trim();
    if (!title || isNaN(amount) || amount <= 0) { UI.toast('error', 'Fill required fields'); return; }
    if (_editId) DB.update('businessExpenses', _editId, { title, amount, category: cat, expenseDate: date, note });
    else DB.insert('businessExpenses', { title, amount, category: cat, expenseDate: date, note });
    UI.closeModal('beModal');
    UI.toast('success', _editId ? 'Expense Updated' : 'Expense Added');
    _tab = 'business'; _editId = null;
    UI.navigate('expenses');
  }

  async function deleteBusiness(id) {
    const ok = await UI.confirm('Delete Expense?', 'This business expense will be permanently removed.');
    if (!ok) return;
    DB.remove('businessExpenses', id);
    UI.toast('success', 'Expense Deleted');
    renderTab();
  }

  return { render, switchTab, openAdd, openAddImport, editImport, saveImport, deleteImport, openAddBusiness, editBusiness, saveBusiness, deleteBusiness };
})();
