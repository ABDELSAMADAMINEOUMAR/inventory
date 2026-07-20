/* =============================================
   SALES.JS — Sales Management Module
   Smart Import & Sales Management System
   Includes: Credit / Pay-Later Tracking
   ============================================= */

const Sales = (() => {
  let _editId = null;
  let _search = '';
  let _filterProduct = '';
  let _filterPayment = '';

  function canViewProfit() {
    if (typeof UI !== 'undefined' && UI.canViewProfit) return UI.canViewProfit();
    const u = typeof Auth !== 'undefined' ? Auth.currentUser() : null;
    if (!u) return true;
    return (u.role || '').toLowerCase() === 'admin';
  }

  function render(container) {
    const sales = DB.getAllEnrichedSales();
    const showProfit = canViewProfit();
    const totalRevenue   = sales.reduce((a, s) => a + s.revenue, 0);
    const totalProfit    = sales.reduce((a, s) => a + s.profit, 0);
    const totalCost      = sales.reduce((a, s) => a + s.cost, 0);
    const avgMargin      = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Credit stats (only count sales that have an actual unpaid remaining balance)
    const getPaidAmt = s => (s.amountPaid !== undefined && s.amountPaid !== null && s.amountPaid !== '') ? Number(s.amountPaid) : Number(s.revenue || 0);
    const getRemAmt  = s => Math.max(0, Number(s.revenue || 0) - getPaidAmt(s));

    const creditSales    = sales.filter(s => getRemAmt(s) > 0.01);
    const paidSales      = sales.filter(s => getRemAmt(s) <= 0.01);
    const outstanding    = creditSales.reduce((a, s) => a + getRemAmt(s), 0);
    const overdueCount   = creditSales.filter(s => s.dueDate && s.dueDate < new Date().toISOString().split('T')[0]).length;

    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title"><h2 style="display:flex;align-items:center;gap:10px;">${UI.svg('cart', 26)} ${t('page_sales')}</h2><p>${sales.length} ${I18n.choose('sales records', 'سجلات المبيعات', 'enregistrements de vente')}</p></div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Sales.openAdd()" style="display:inline-flex;align-items:center;gap:6px;">
            ${UI.svg('plus', 16)}
            ${t('btn_record_sale')}
          </button>
        </div>
      </div>

      <div class="kpi-grid stagger-children">
        ${statCard(UI.svg('trending_up', 22), t('th_revenue'), UI.fmtCurrency(totalRevenue), 'green')}
        ${showProfit ? statCard(UI.svg('trending_up', 22), t('th_profit'), UI.fmtCurrency(totalProfit), 'purple') : ''}
        ${showProfit ? statCard(UI.svg('trending_down', 22), t('th_cost'), UI.fmtCurrency(totalCost), 'orange') : ''}
        ${showProfit ? statCard(UI.svg('bar_chart', 22), t('th_margin'), UI.fmtPct(avgMargin), 'blue') : ''}
        ${statCard(UI.svg('cart', 22), t('nav_sales'), sales.length, 'teal')}
        ${statCard(UI.svg('credit_card', 22), t('kpi_credit'), UI.fmtCurrency(outstanding), 'red', creditSales.length + ' ' + I18n.choose('unpaid', 'متبقية', 'impayé(s)'))}
      </div>

      ${creditSales.length ? `
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="color:var(--danger);">${UI.svg('credit_card', 24)}</span>
          <div>
            <div style="font-weight:600;color:var(--danger);display:flex;align-items:center;gap:8px;">
              ${creditSales.length} ${I18n.choose('unpaid credit sale(s)', 'مبيعات آجلة غير مدفوعة', 'vente(s) à crédit impayée(s)')}
              ${overdueCount ? `<span style="background:rgba(239,68,68,0.2);color:var(--danger);font-size:0.75rem;padding:2px 8px;border-radius:20px;display:inline-flex;align-items:center;gap:4px;">${UI.svg('alert', 12)} ${overdueCount} ${I18n.choose('overdue', 'متأخرة', 'en retard')}</span>` : ''}
            </div>
            <div style="font-size:0.82rem;color:var(--text-secondary)">${I18n.choose('Total outstanding:', 'إجمالي المتبقي للتحصيل:', 'Total restant dû :')} <strong style="color:var(--danger)">${UI.fmtCurrency(outstanding)}</strong></div>
          </div>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="Sales.filterPayment('credit')">${I18n.choose('View Credits Only', 'عرض الديون فقط', 'Afficher uniquement les crédits')}</button>
      </div>` : ''}

      <div class="filter-bar">
        <div class="filter-search">
          <svg class="filter-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="input filter-search" placeholder="${I18n.choose('Search by product or customer…', 'ابحث عن منتج أو عميل…', 'Rechercher par produit ou client…')}" oninput="Sales.setSearch(this.value)">
        </div>
        <select class="select" onchange="Sales.setFilter('product', this.value)">
          <option value="">${I18n.choose('All Products', 'جميع المنتجات', 'Tous les produits')}</option>
          ${DB.getAll('products').map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <select class="select" id="paymentFilter" onchange="Sales.setFilter('payment', this.value)">
          <option value="">${I18n.choose('All Payments', 'جميع المدفوعات', 'Tous les paiements')}</option>
          <option value="paid">${t('status_paid')}</option>
          <option value="credit">${t('status_credit')}</option>
          <option value="overdue">${t('status_overdue')}</option>
        </select>
        <input class="input" type="date" placeholder="${I18n.choose('From date', 'من تاريخ', 'Date de début')}" id="sDateFrom" onchange="Sales.renderTable()">
        <input class="input" type="date" placeholder="${I18n.choose('To date', 'إلى تاريخ', 'Date de fin')}"   id="sDateTo"   onchange="Sales.renderTable()">
      </div>

      <!-- Sales Table -->
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${t('th_product')}</th>
                <th>${t('th_qty')}</th>
                <th>${t('th_unit_price')}</th>
                <th>${t('th_revenue')}</th>
                ${showProfit ? `<th>${t('th_profit')}</th><th>${t('th_margin')}</th>` : ''}
                <th>${t('th_customer')}</th>
                <th>${t('th_date')}</th>
                <th>${t('th_payment')}</th>
                <th>${I18n.choose('Paid / Remaining', 'المدفوع / المتبقي', 'Payé / Restant')}</th>
                <th>${t('th_actions')}</th>
              </tr>
            </thead>
            <tbody id="salesTbody"></tbody>
          </table>
        </div>
      </div>
    </div>`;
    renderTable();
  }

  function statCard(icon, label, value, color, sub = '') {
    const tc = { green:'var(--accent)', purple:'var(--primary-light)', orange:'var(--warning)', blue:'#60A5FA', teal:'#2DD4BF', red:'var(--danger)' };
    return `
    <div style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:18px;">
      <div style="font-size:20px;margin-bottom:6px">${icon}</div>
      <div style="font-size:1.2rem;font-weight:700;color:${tc[color]}">${value}</div>
      <div style="font-size:0.78rem;color:var(--text-muted)">${label}</div>
      ${sub ? `<div style="font-size:0.72rem;color:var(--danger);margin-top:3px">${sub}</div>` : ''}
    </div>`;
  }

  function setSearch(q) { _search = q.toLowerCase(); renderTable(); }
  function setFilter(type, val) {
    if (type === 'product') _filterProduct = val;
    if (type === 'payment') _filterPayment = val;
    renderTable();
  }
  function filterPayment(val) {
    _filterPayment = val;
    const sel = document.getElementById('paymentFilter');
    if (sel) sel.value = val;
    renderTable();
  }

  function renderTable() {
    const body = document.getElementById('salesTbody');
    if (!body) return;
    const from = document.getElementById('sDateFrom')?.value;
    const to   = document.getElementById('sDateTo')?.value;
    const today = new Date().toISOString().split('T')[0];
    const showProfit = canViewProfit();

    let data = DB.getAllEnrichedSales();
    if (_search)        data = data.filter(s => s.productName?.toLowerCase().includes(_search) || s.customer?.toLowerCase().includes(_search));
    if (_filterProduct) data = data.filter(s => s.productId == _filterProduct);
    const getPaid = s => (s.amountPaid !== undefined && s.amountPaid !== null && s.amountPaid !== '') ? Number(s.amountPaid) : Number(s.revenue || 0);
    const getRem  = s => Math.max(0, Number(s.revenue || 0) - getPaid(s));

    if (_filterPayment === 'paid')    data = data.filter(s => getRem(s) <= 0.01);
    if (_filterPayment === 'credit')  data = data.filter(s => getRem(s) > 0.01);
    if (_filterPayment === 'overdue') data = data.filter(s => getRem(s) > 0.01 && s.dueDate && s.dueDate < today);
    if (from) data = data.filter(s => s.saleDate >= from);
    if (to)   data = data.filter(s => s.saleDate <= to);

    if (!data.length) {
      body.innerHTML = `<tr><td colspan="${showProfit ? 12 : 10}"><div class="empty-state"><div class="empty-icon">${UI.svg('cart', 48)}</div><h3>${I18n.choose('No sales found', 'لم يتم العثور على مبيعات', 'Aucune vente trouvée')}</h3><p>${I18n.choose('Record your first sale to start tracking profit.', 'سجل عملية البيع الأولى لبدء التتبع.', 'Enregistrez votre première vente pour suivre les bénéfices.')}</p><button class="btn btn-primary" onclick="Sales.openAdd()">${t('btn_record_sale')}</button></div></td></tr>`;
      return;
    }

    body.innerHTML = data.map(s => {
      const paidAmt   = getPaid(s);
      const remAmt    = getRem(s);
      const isCredit  = remAmt > 0.01;
      const isOverdue = isCredit && s.dueDate && s.dueDate < today;
      const rowStyle  = isOverdue ? 'background:rgba(239,68,68,0.04);' : isCredit ? 'background:rgba(245,158,11,0.03);' : '';

      return `
      <tr style="${rowStyle}">
        <td class="td-muted" style="font-size:0.8rem">#${s.id}</td>
        <td>
          <div style="font-weight:600;font-size:0.875rem">${s.productName}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">${s.productCode}</div>
        </td>
        <td class="text-center">${s.quantity}</td>
        <td>${UI.fmtCurrency(s.sellingPrice)}</td>
        <td class="text-accent fw-600">${UI.fmtCurrency(s.revenue)}</td>
        ${showProfit ? `
        <td class="${s.profit >= 0 ? 'text-success' : 'text-danger'} fw-600">${UI.fmtCurrency(s.profit)}</td>
        <td>
          <span class="badge ${s.profitMargin >= 20 ? 'badge-success' : s.profitMargin >= 10 ? 'badge-warning' : 'badge-danger'}">
            ${UI.fmtPct(s.profitMargin)}
          </span>
        </td>` : ''}
        <td style="font-weight:500">${s.customer || '—'}</td>
        <td class="td-muted">${UI.fmtDate(s.saleDate)}</td>
        <td>${paymentBadge(isCredit ? 'credit' : 'paid', isOverdue)}</td>
        <td>
          ${isCredit
            ? `<div style="line-height:1.35;white-space:nowrap">
                 <div style="font-size:0.78rem;color:var(--success);font-weight:600;display:flex;align-items:center;gap:4px;">${UI.svg('check', 13)} ${I18n.choose('Paid:', 'مدفوع:', 'Payé :')} ${UI.fmtCurrency(paidAmt)}</div>
                 <div style="font-size:0.82rem;color:var(--danger);font-weight:700;display:flex;align-items:center;gap:4px;">${UI.svg('alert', 13)} ${I18n.choose('Rem:', 'متبقي:', 'Restant :')} ${UI.fmtCurrency(Math.max(0, Number(s.revenue || 0) - paidAmt))}</div>
                 ${s.dueDate ? `<div style="font-size:0.7rem;color:${isOverdue?'var(--danger)':'var(--text-muted)'};margin-top:2px;display:flex;align-items:center;gap:4px;">${UI.svg('calendar', 12)} ${UI.fmtDate(s.dueDate)}</div>` : ''}
               </div>`
            : `<span class="badge badge-success" style="font-size:0.75rem;white-space:nowrap">${I18n.choose('Paid Full', 'مدفوع كلياً', 'Payé en totalité')}</span>`}
        </td>
        <td>
          <div class="actions">
            ${isCredit
              ? `<button class="act-btn" onclick="Sales.openPaymentModal(${s.id})" title="${I18n.choose('Add Payment / Settle', 'إضافة دفعة / سداد', 'Ajouter un paiement / Régler')}" style="background:rgba(16,185,129,0.15);color:var(--success);font-weight:700;padding:4px 8px;border-radius:6px;width:auto;display:inline-flex;align-items:center;gap:4px;font-size:0.75rem;">${UI.svg('dollar', 14)} ${I18n.choose('Pay', 'سداد', 'Régler')}</button>`
              : ''}
            <button class="act-btn edit" onclick="Sales.openEdit(${s.id})" title="${t('btn_edit') || 'Edit'}">${UI.svg('edit', 14)}</button>
            <button class="act-btn del"  onclick="Sales.delete(${s.id})"   title="${t('btn_delete') || 'Delete'}">${UI.svg('del', 14)}</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function paymentBadge(status, overdue) {
    if (status === 'credit' && overdue) return `<span class="badge badge-danger" style="display:inline-flex;align-items:center;gap:4px;">${UI.svg('alert', 12)} ${I18n.choose('Overdue', 'متأخر', 'En retard')}</span>`;
    if (status === 'credit')            return `<span class="badge badge-warning" style="display:inline-flex;align-items:center;gap:4px;">${UI.svg('credit_card', 12)} ${I18n.choose('Credit', 'آجل', 'Crédit')}</span>`;
    return `<span class="badge badge-success" style="display:inline-flex;align-items:center;gap:4px;">${UI.svg('check', 12)} ${I18n.choose('Paid', 'مدفوع', 'Payé')}</span>`;
  }

  // ── Sale Form ─────────────────────────────
  function saleForm(s = {}) {
    const products = DB.getAllEnrichedProducts().filter(p => p.currentStock > 0 || s.id);
    const isCredit = s.paymentStatus === 'credit';
    return `
    <div class="form-grid form-grid-2">
      <div class="field col-span-2">
        <label>${t('lbl_product')} <span class="req">*</span></label>
        <input class="input" type="text" id="sProductSearch" placeholder="${I18n.choose('Search product by name or code...', 'ابحث عن منتج بالاسم أو الرمز...', 'Rechercher un produit par nom ou code...')}" oninput="Sales.filterProducts()" style="margin-bottom:8px">
        <select class="select" id="sProduct" onchange="Sales.updateCalc()" required>
          <option value="">${I18n.choose('Select product to sell', 'اختر منتجاً للبيع', 'Sélectionner un produit à vendre')}</option>
          ${products.map(p => `<option value="${p.id}" data-search="${p.name.toLowerCase()} ${p.code.toLowerCase()}" data-cpu="${p.costPerUnit}" data-stock="${p.currentStock}" ${s.productId==p.id?'selected':''}>${p.name} (${p.code}) — ${I18n.choose('Stock:', 'المخزون:', 'Stock :')} ${p.currentStock}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>${t('lbl_qty_sold')} <span class="req">*</span></label>
        <input class="input" type="text" inputmode="numeric" id="sQty" value="${s.quantity||''}" placeholder="e.g. 5" oninput="Sales.updateCalc()" required>
        <span class="field-hint" id="sStockHint">${t('available_stock')}: —</span>
      </div>
      <div class="field">
        <label>${UI.isRiyalMode() ? 'سعر الوحدة (ريال)' : t('lbl_sell_price')} <span class="req">*</span></label>
        <div class="input-prefix-wrap"><span class="input-prefix">${UI.isRiyalMode() ? 'ريال' : 'F'}</span>
          <input class="input" type="text" id="sSellPrice" value="${UI.toInputMoney(s.sellingPrice)}" placeholder="0" oninput="Sales.updateCalc()" required>
        </div>
        ${UI.isRiyalMode() ? '<div id="sSellPriceFCFAHint" style="font-size:0.75rem;color:var(--accent);font-weight:600;margin-top:2px"></div>' : ''}
      </div>
      <div class="field">
        <label>${t('lbl_sale_date')}</label>
        <input class="input" type="date" id="sSaleDate" value="${s.saleDate||new Date().toISOString().split('T')[0]}">
      </div>
      <div class="field">
        <label>${t('lbl_customer')}</label>
        <input class="input" id="sCustomer" value="${s.customer||''}" placeholder="${t('lbl_customer')}">
      </div>
      <div class="field">
        <label>${t('lbl_phone')}</label>
        <input class="input" id="sCustomerPhone" value="${s.customerPhone||''}" placeholder="+250 ...">
      </div>

      <!-- ── Payment Section ── -->
      <div class="field col-span-2">
        <label>${t('lbl_payment')} <span class="req">*</span></label>
        <div class="pay-toggle-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">
          <label id="payOptPaid" onclick="Sales.togglePayment('paid')" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;cursor:pointer;border:2px solid ${!isCredit?'var(--accent)':'var(--border-light)'};background:${!isCredit?'rgba(6,214,160,0.08)':'var(--bg-elevated)'};transition:var(--transition)">
            <input type="radio" name="payStatus" value="paid" ${!isCredit?'checked':''} style="display:none">
            <span style="width:20px;height:20px;border-radius:50%;background:${!isCredit?'var(--accent)':'var(--border-light)'};display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;flex-shrink:0" id="payDotPaid">${!isCredit?UI.svg('check', 12, 'text-white'):''}</span>
            <div>
              <div style="font-weight:600;font-size:0.875rem;color:${!isCredit?'var(--accent)':'var(--text-primary)'}">${t('pay_now')}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${t('pay_now_sub')}</div>
            </div>
          </label>
          <label id="payOptCredit" onclick="Sales.togglePayment('credit')" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;cursor:pointer;border:2px solid ${isCredit?'var(--warning)':'var(--border-light)'};background:${isCredit?'rgba(245,158,11,0.08)':'var(--bg-elevated)'};transition:var(--transition)">
            <input type="radio" name="payStatus" value="credit" ${isCredit?'checked':''} style="display:none">
            <span style="width:20px;height:20px;border-radius:50%;background:${isCredit?'var(--warning)':'var(--border-light)'};display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;flex-shrink:0" id="payDotCredit">${isCredit?UI.svg('check', 12, 'text-white'):''}</span>
            <div>
              <div style="font-weight:600;font-size:0.875rem;color:${isCredit?'var(--warning)':'var(--text-primary)'}">${t('pay_later')}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${t('pay_later_sub')}</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Due date (shown only for credit) -->
      <div class="field" id="dueDateWrap" style="display:${isCredit?'flex':'none'};flex-direction:column;gap:6px">
        <label>${t('lbl_due_date')}</label>
        <input class="input" type="date" id="sDueDate" value="${s.dueDate||''}">
      </div>
      <div class="field" id="partialWrap" style="display:flex;flex-direction:column;gap:6px">
        <label>${UI.isRiyalMode() ? 'المبلغ المدفوع مقدماً (ريال)' : I18n.choose('Amount Paid Upfront (FCFA)', 'المبلغ المدفوع مقدماً (FCFA)', 'Montant payé d\'avance (FCFA)')}</label>
        <div class="input-prefix-wrap"><span class="input-prefix">${UI.isRiyalMode() ? 'ريال' : 'F'}</span>
          <input class="input" type="text" id="sAmountPaid" value="${(s.amountPaid !== undefined && s.amountPaid !== null && s.amountPaid !== '') ? UI.toInputMoney(s.amountPaid) : ''}" placeholder="${UI.isRiyalMode() ? 'اتركه فارغاً إذا تم الدفع كلياً' : I18n.choose('Leave empty if fully paid', 'اتركه فارغاً إذا تم الدفع كلياً', 'Laisser vide si payé en totalité')}" oninput="Sales.updateCalc()">
        </div>
        ${UI.isRiyalMode() ? '<div id="sAmountPaidFCFAHint" style="font-size:0.75rem;color:var(--accent);font-weight:600;margin-top:2px"></div>' : ''}
      </div>
      <div class="field col-span-2" id="remBalanceWrap" style="display:block;margin-top:-2px;margin-bottom:4px">
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600;font-size:0.85rem;color:var(--danger)">⏳ ${I18n.choose('Remaining Amount to be Paid by Customer:', 'المبلغ المتبقي على العميل لسداده:', 'Montant restant à payer par le client :')}</span>
          <span style="font-weight:800;font-size:1.05rem;color:var(--danger)" id="sRemainingDisplay">${UI.fmtCurrency(Math.max(0, (s.revenue || 0) - ((s.amountPaid !== undefined && s.amountPaid !== null) ? s.amountPaid : (s.revenue || 0))))}</span>
        </div>
      </div>

      <div class="field col-span-2">
        <label>${t('lbl_note')}</label>
        <input class="input" id="sNote" value="${s.note||''}" placeholder="${t('lbl_note')}">
      </div>
    </div>

    <!-- Live Calculator -->
    <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:14px;padding:18px;margin-top:18px;box-shadow:var(--shadow)">
      <div style="font-size:0.9rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);display:flex;align-items:center;gap:8px">
        ${UI.svg('bar_chart', 18, 'text-primary')} ${canViewProfit() ? t('profit_calc') : I18n.choose('Sale Summary', 'ملخص البيع', 'Résumé de la vente')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px">
        ${calcBox('sCalcRevenue', t('th_revenue'), 'var(--accent)')}
        ${canViewProfit() ? calcBox('sCalcCost', t('th_cost'), 'var(--warning)') : ''}
        ${canViewProfit() ? calcBox('sCalcProfit', t('th_profit'), 'var(--success)') : ''}
        ${canViewProfit() ? calcBox('sCalcCPU', t('th_cpu'), 'var(--primary-light)') : ''}
        ${canViewProfit() ? calcBox('sCalcMargin', t('th_margin'), '#60A5FA') : ''}
        ${calcBox('sCalcRemaining', I18n.choose('Remaining to Pay', 'المتبقي للسداد', 'Restant à payer'), 'var(--danger)')}
      </div>
    </div>`;
  }

  let _paymentStatus = 'paid';

  function togglePayment(val) {
    _paymentStatus = val;
    const isPaid = val === 'paid';

    // Update paid option UI
    const paidOpt = document.getElementById('payOptPaid');
    const dotPaid = document.getElementById('payDotPaid');
    if (paidOpt) {
      paidOpt.style.borderColor = isPaid ? 'var(--accent)' : 'var(--border-light)';
      paidOpt.style.background  = isPaid ? 'rgba(6,214,160,0.08)' : 'var(--bg-elevated)';
    }
    const creditOpt = document.getElementById('payOptCredit');
    const dotCredit = document.getElementById('payDotCredit');
    if (creditOpt) {
      creditOpt.style.borderColor = !isPaid ? 'var(--warning)' : 'var(--border-light)';
      creditOpt.style.background  = !isPaid ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)';
    }
    if (dotPaid) { dotPaid.style.background = isPaid ? 'var(--accent)' : 'var(--border-light)'; dotPaid.innerHTML = isPaid ? UI.svg('check', 12, 'text-white') : ''; }
    if (dotCredit) { dotCredit.style.background = !isPaid ? 'var(--warning)' : 'var(--border-light)'; dotCredit.innerHTML = !isPaid ? UI.svg('check', 12, 'text-white') : ''; }

    // Show/hide due date field
    const dueWrap = document.getElementById('dueDateWrap');
    if (dueWrap) dueWrap.style.display = isPaid ? 'none' : 'flex';
    updateCalc();
  }

  function calcBox(id, label, color) {
    return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 10px;text-align:center;box-shadow:var(--shadow);transition:var(--transition);position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:2.5px;background:${color}"></div>
      <div style="font-size:1.1rem;font-weight:800;color:${color};margin-bottom:3px" id="${id}">0 ${UI.getCurrency()}</div>
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">${label}</div>
    </div>`;
  }

  function updateCalc() {
    const sel   = document.getElementById('sProduct');
    const opt   = sel?.selectedOptions[0];
    const cpu   = parseFloat(opt?.dataset.cpu) || 0;
    const stock = parseNum(opt?.dataset.stock) || 0;
    const qty   = parseNum(document.getElementById('sQty')?.value) || 0;
    const rawPrice = document.getElementById('sSellPrice')?.value;
    const price    = UI.fromInputMoney(rawPrice) || 0;

    const hint = document.getElementById('sStockHint');
    if (hint) hint.textContent = `${t('available_stock')}: ${stock} ${I18n.choose('units', 'وحدة', 'unités')}`;

    const priceHint = document.getElementById('sSellPriceFCFAHint');
    if (priceHint && UI.isRiyalMode()) {
      priceHint.textContent = rawPrice ? `= ${UI.fmt(price, 0)} FCFA` : '';
    }

    const revenue = price * qty;
    const cost    = cpu * qty;
    const profit  = revenue - cost;
    const margin  = revenue > 0 ? (profit / revenue) * 100 : 0;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('sCalcRevenue', UI.fmtCurrency(revenue));
    set('sCalcCost',    UI.fmtCurrency(cost));
    set('sCalcProfit',  UI.fmtCurrency(profit));
    set('sCalcCPU',     UI.fmtCurrency(cpu));
    set('sCalcMargin',  UI.fmtPct(margin));

    const paidInput = document.getElementById('sAmountPaid')?.value;
    let paid;
    if (paidInput !== undefined && paidInput !== '' && !isNaN(UI.fromInputMoney(paidInput))) {
      paid = UI.fromInputMoney(paidInput);
    } else {
      paid = (_paymentStatus === 'credit' ? 0 : revenue);
    }
    const paidHint = document.getElementById('sAmountPaidFCFAHint');
    if (paidHint && UI.isRiyalMode()) {
      paidHint.textContent = paidInput ? `= ${UI.fmt(paid, 0)} FCFA` : '';
    }

    const rem = Math.max(0, revenue - paid);
    set('sCalcRemaining', UI.fmtCurrency(rem));
    const remDisp = document.getElementById('sRemainingDisplay');
    if (remDisp) remDisp.textContent = UI.fmtCurrency(rem);
  }

  function openAdd() {
    _editId = null;
    _paymentStatus = 'paid';
    UI.createModal('saleModal', `${UI.svg('cart', 20)} ${I18n.choose('Record New Sale', 'تسجيل بيع جديد', 'Enregistrer une nouvelle vente')}`,
      saleForm(),
      `<button class="btn btn-ghost" onclick="UI.closeModal('saleModal')">${t('btn_cancel')}</button>
       <button class="btn btn-primary" onclick="Sales.save()">${I18n.choose('Save Sale', 'حفظ البيع', 'Enregistrer la vente')}</button>`,
      'modal-lg'
    );
    setTimeout(updateCalc, 100);
  }

  function openEdit(id) {
    _editId = id;
    const s = DB.getEnrichedSale(id);
    if (!s) return;
    _paymentStatus = s.paymentStatus || 'paid';
    UI.createModal('saleModal', `${UI.svg('edit', 20)} ${I18n.choose('Edit Sale', 'تعديل البيع', 'Modifier la vente')}`,
      saleForm(s),
      `<button class="btn btn-ghost" onclick="UI.closeModal('saleModal')">${t('btn_cancel')}</button>
       <button class="btn btn-primary" onclick="Sales.save()">${I18n.choose('Update Sale', 'تحديث البيع', 'Mettre à jour la vente')}</button>`,
      'modal-lg'
    );
    setTimeout(updateCalc, 100);
  }

  async function save() {
    const btn = document.querySelector('#saleModal .btn-primary');
    if (UI.lockBtn(btn)) return;
    try {
      const productId    = parseInt(document.getElementById('sProduct')?.value);
      const qty          = parseNum(document.getElementById('sQty')?.value);
      const sellingPrice = UI.fromInputMoney(document.getElementById('sSellPrice')?.value);
      const saleDate     = document.getElementById('sSaleDate')?.value;
      const customer     = document.getElementById('sCustomer')?.value.trim();
      const customerPhone = document.getElementById('sCustomerPhone')?.value.trim();
      const note         = document.getElementById('sNote')?.value.trim();

      if (!productId || isNaN(qty) || qty < 1 || isNaN(sellingPrice) || sellingPrice <= 0) {
        UI.toast('error', I18n.choose('Missing Fields', 'حقول ناقصة', 'Champs manquants'), I18n.choose('Please fill in all required fields.', 'يرجى ملء جميع الحقول المطلوبة.', 'Veuillez remplir tous les champs requis.')); return;
      }

      const product = DB.getEnrichedProduct(productId);
      if (!product) { UI.toast('error', I18n.choose('Product not found', 'المنتج غير موجود', 'Produit non trouvé')); return; }

      const availableStock = _editId
        ? product.currentStock + (DB.getById('sales', _editId)?.quantity || 0)
        : product.currentStock;

      if (qty > availableStock) {
        UI.toast('error', I18n.choose('Insufficient Stock', 'مخزون غير كافٍ', 'Stock insuffisant'), I18n.choose(`Only ${availableStock} units available.`, `يتوفر فقط ${availableStock} وحدة.`, `Seulement ${availableStock} unité(s) disponible(s).`)); return;
      }

      const cpu          = product.costPerUnit;
      const revenue      = sellingPrice * qty;
      const cost         = cpu * qty;
      const profit       = revenue - cost;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      const paidInputVal = document.getElementById('sAmountPaid')?.value;
      let amountPaid;
      if (paidInputVal !== undefined && paidInputVal !== '' && !isNaN(UI.fromInputMoney(paidInputVal))) {
        amountPaid = UI.fromInputMoney(paidInputVal);
      } else {
        amountPaid = (_paymentStatus === 'credit') ? 0 : revenue;
      }
      let paymentStatus = (amountPaid < revenue - 0.01) ? 'credit' : 'paid';
      const dueDate = paymentStatus === 'credit' ? (document.getElementById('sDueDate')?.value || null) : null;

      const data = {
        productId, quantity: qty, sellingPrice,
        revenue, cost, profit, profitMargin,
        saleDate, customer, customerPhone, note,
        paymentStatus, dueDate, amountPaid,
        paidAt: paymentStatus === 'paid' ? (DB.getById('sales', _editId)?.paidAt || saleDate) : null,
      };

      try {
        if (_editId) await DB.update('sales', _editId, data);
        else await DB.insert('sales', data);
      } catch (err) {
        UI.toast('error', I18n.choose('Not Allowed', 'غير مسموح', 'Non autorisé'), err.message || I18n.choose('The server rejected this action.', 'رفض الخادم هذا الإجراء.', 'Le serveur a rejeté cette action.'));
        return;
      }

      UI.closeModal('saleModal');
      const showProfit = canViewProfit();
      const extra = paymentStatus === 'credit'
        ? (I18n.choose('⏳ Credit — due ', '⏳ آجل — الاستحقاق ', '⏳ Crédit — échéance ') + (dueDate ? UI.fmtDate(dueDate) : I18n.choose('TBD', 'غير محدد', 'À définir')))
        : (I18n.choose('Revenue: ', 'الإيراد: ', 'Revenu : ') + UI.fmtCurrency(revenue) + (showProfit ? (I18n.choose(' | Profit: ', ' | الربح: ', ' | Bénéfice : ') + UI.fmtCurrency(profit)) : ''));
      UI.toast('success', _editId ? I18n.choose('Sale Updated', 'تم تحديث البيع', 'Vente mise à jour') : I18n.choose('Sale Recorded', 'تم تسجيل البيع', 'Vente enregistrée'), extra);
      UI.navigate('sales');
    } finally {
      UI.unlockBtn(btn);
    }
  }

  // ── Mark Credit as Paid / Add Customer Payment ───────────────────
  function openPaymentModal(id) {
    const s = DB.getEnrichedSale(id);
    if (!s) return;
    const paid = s.amountPaid || 0;
    const rem  = Math.max(0, s.revenue - paid);
    const customer = s.customer || `Sale #${s.id}`;

    const body = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:12px;padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;">
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">${I18n.choose('Total Revenue', 'إجمالي الفاتورة', 'Revenu total')}</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-top:4px">${UI.fmtCurrency(s.revenue)}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">${I18n.choose('Already Paid', 'المدفوع مسبقاً', 'Déjà payé')}</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--success);margin-top:4px">${UI.fmtCurrency(paid)}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">${I18n.choose('Remaining Balance', 'المتبقي للسداد', 'Solde restant')}</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--danger);margin-top:4px">${UI.fmtCurrency(rem)}</div>
        </div>
      </div>

      <div class="field">
        <label>${I18n.choose('Payment Amount Now', 'المبلغ المراد سداده الآن', 'Montant du paiement maintenant')} (${UI.isRiyalMode()?'ريال':UI.getCurrency()}) <span class="req">*</span></label>
        <div class="input-prefix-wrap"><span class="input-prefix">${UI.isRiyalMode()?'ريال':'F'}</span>
          <input class="input" type="text" id="payModalAmount" value="${UI.toInputMoney(rem)}" placeholder="0" oninput="Sales.updatePayModalHint()">
        </div>
        ${UI.isRiyalMode()?'<div id="payModalHint" style="font-size:0.75rem;color:var(--accent);font-weight:600;margin-top:4px"></div>':''}
        <span class="field-hint">${I18n.choose('Enter partial or full payment amount being settled now.', 'أدخل المبلغ المدفوع جزئياً أو كلياً', 'Saisissez le montant du paiement partiel ou total réglé maintenant.')}</span>
      </div>

      <div class="field">
        <label>${I18n.choose('Payment Date', 'تاريخ الدفع', 'Date de paiement')}</label>
        <input class="input" type="date" id="payModalDate" value="${new Date().toISOString().split('T')[0]}">
      </div>
    </div>`;

    UI.createModal('payModal', `${UI.svg('credit_card', 20)} ${I18n.choose('Add Customer Payment', 'سداد دفعة العميل', 'Ajouter un paiement client')} — ${customer}`,
      body,
      `<button class="btn btn-ghost" onclick="UI.closeModal('payModal')">${t('btn_cancel')}</button>
       <button class="btn btn-primary" onclick="Sales.confirmPayment(${id})">${I18n.choose('Save Payment', 'حفظ الدفعة', 'Enregistrer le paiement')}</button>`,
      'modal-md'
    );
  }

  function updatePayModalHint() {
    const hint = document.getElementById('payModalHint');
    if (!hint || !UI.isRiyalMode()) return;
    const raw = document.getElementById('payModalAmount')?.value;
    const fcfa = UI.fromInputMoney(raw) || 0;
    hint.textContent = raw ? `= ${UI.fmt(fcfa, 0)} FCFA` : '';
  }

  async function confirmPayment(id) {
    const btn = document.querySelector('#payModal .btn-primary');
    if (UI.lockBtn(btn)) return;
    try {
      const s = DB.getById('sales', id);
      if (!s) return;
      const addVal = UI.fromInputMoney(document.getElementById('payModalAmount')?.value) || 0;
      const payDate = document.getElementById('payModalDate')?.value || new Date().toISOString().split('T')[0];
      if (isNaN(addVal) || addVal <= 0) {
        UI.toast('error', I18n.choose('Invalid Amount', 'مبلغ غير صالح', 'Montant invalide'), I18n.choose('Please enter a valid payment amount.', 'يرجى إدخال مبلغ صحيح.', 'Veuillez saisir un montant de paiement valide.'));
        return;
      }
      const oldPaid = s.amountPaid || 0;
      const newPaid = oldPaid + addVal;
      const rem     = Math.max(0, s.revenue - newPaid);
      const isFull  = rem === 0;

      try {
        await DB.update('sales', id, {
          amountPaid: Math.min(s.revenue, newPaid),
          paymentStatus: isFull ? 'paid' : 'credit',
          paidAt: isFull ? payDate : (s.paidAt || null)
        });
      } catch (err) {
        UI.toast('error', I18n.choose('Not Allowed', 'غير مسموح', 'Non autorisé'), err.message || I18n.choose('The server rejected this action.', 'رفض الخادم هذا الإجراء.', 'Le serveur a rejeté cette action.'));
        return;
      }

      UI.closeModal('payModal');
      UI.toast('success', I18n.choose('Payment Recorded', 'تم تسجيل الدفعة', 'Paiement enregistré'),
        `${s.customer || '#' + id}: ${I18n.choose('paid', 'تم دفع', 'payé')} ${UI.fmtCurrency(addVal)}. ${I18n.choose('Remaining:', 'المتبقي:', 'Restant :')} ${UI.fmtCurrency(rem)}`);
      renderTable();
    } finally {
      UI.unlockBtn(btn);
    }
  }

  async function markPaid(id) {
    openPaymentModal(id);
  }

  // ── Delete Sale ───────────────────────────
  async function del(id) {
    const s = DB.getEnrichedSale(id);
    if (!s) return;
    const ok = await UI.confirm(I18n.choose('Delete Sale?', 'حذف عملية البيع؟', 'Supprimer la vente ?'), I18n.choose(`Sale of "${s.productName}" (${s.quantity} units) will be permanently deleted.`, `سيتم حذف عملية بيع "${s.productName}" (${s.quantity} وحدة) نهائياً.`, `La vente de "${s.productName}" (${s.quantity} unité(s)) sera définitivement supprimée.`));
    if (!ok) return;
    try {
      await DB.remove('sales', id);
    } catch (err) {
      UI.toast('error', I18n.choose('Not Allowed', 'غير مسموح', 'Non autorisé'), err.message || I18n.choose('The server rejected this action.', 'رفض الخادم هذا الإجراء.', 'Le serveur a rejeté cette action.'));
      return;
    }
    UI.toast('success', I18n.choose('Sale Deleted', 'تم حذف عملية البيع', 'Vente supprimée'));
    renderTable();
  }

  function filterProducts() {
    const q = (document.getElementById('sProductSearch')?.value || '').toLowerCase().trim();
    const sel = document.getElementById('sProduct');
    if (!sel) return;
    const opts = Array.from(sel.options);
    opts.forEach((opt, idx) => {
      if (idx === 0) return; // Keep default placeholder option
      const searchStr = (opt.dataset.search || opt.text || '').toLowerCase();
      const match = !q || searchStr.includes(q);
      opt.hidden = !match;
      opt.style.display = match ? '' : 'none';
    });
    if (q) {
      const firstVisible = opts.find((opt, idx) => idx > 0 && !opt.hidden);
      if (firstVisible) {
        sel.value = firstVisible.value;
        updateCalc();
      }
    }
  }

  return {
    render, setSearch, setFilter, filterPayment, renderTable,
    openAdd, openEdit, save, delete: del,
    updateCalc, togglePayment, markPaid, openPaymentModal, confirmPayment, updatePayModalHint, filterProducts,
  };
})();
