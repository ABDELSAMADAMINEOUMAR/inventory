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

  function render(container) {
    const sales = DB.getAllEnrichedSales();
    const totalRevenue   = sales.reduce((a, s) => a + s.revenue, 0);
    const totalProfit    = sales.reduce((a, s) => a + s.profit, 0);
    const totalCost      = sales.reduce((a, s) => a + s.cost, 0);
    const avgMargin      = sales.length ? sales.reduce((a, s) => a + s.profitMargin, 0) / sales.length : 0;

    // Credit stats
    const creditSales    = sales.filter(s => s.paymentStatus === 'credit');
    const paidSales      = sales.filter(s => s.paymentStatus !== 'credit');
    const outstanding    = creditSales.reduce((a, s) => a + Math.max(0, (s.revenue || 0) - (s.amountPaid || 0)), 0);
    const overdueCount   = creditSales.filter(s => s.dueDate && s.dueDate < new Date().toISOString().split('T')[0]).length;

    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title"><h2>🛒 ${t('page_sales')}</h2><p>${sales.length} ${I18n.getLang() === 'ar' ? 'سجلات المبيعات' : 'sales records'}</p></div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Sales.openAdd()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${t('btn_record_sale')}
          </button>
        </div>
      </div>

      <div class="kpi-grid stagger-children">
        ${statCard('💰', t('th_revenue'), UI.fmtCurrency(totalRevenue), 'green')}
        ${statCard('📈', t('th_profit'),  UI.fmtCurrency(totalProfit),  'purple')}
        ${statCard('💸', t('th_cost'),    UI.fmtCurrency(totalCost),    'orange')}
        ${statCard('📊', t('th_margin'),    UI.fmtPct(avgMargin),         'blue')}
        ${statCard('🛒', t('nav_sales'),   sales.length,                  'teal')}
        ${statCard('💳', t('kpi_credit'),   UI.fmtCurrency(outstanding),  'red', creditSales.length + ' ' + (I18n.getLang() === 'ar' ? 'متبقية' : 'unpaid'))}
      </div>

      ${creditSales.length ? `
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:22px">💳</span>
          <div>
            <div style="font-weight:600;color:var(--danger)">
              ${creditSales.length} ${I18n.getLang() === 'ar' ? 'مبيعات آجلة غير مدفوعة' : 'unpaid credit sale(s)'}
              ${overdueCount ? `<span style="background:rgba(239,68,68,0.2);color:var(--danger);font-size:0.75rem;padding:2px 8px;border-radius:20px;margin-left:8px">⚠ ${overdueCount} ${I18n.getLang() === 'ar' ? 'متأخرة' : 'overdue'}</span>` : ''}
            </div>
            <div style="font-size:0.82rem;color:var(--text-secondary)">${I18n.getLang() === 'ar' ? 'إجمالي المتبقي للتحصيل:' : 'Total outstanding:'} <strong style="color:var(--danger)">${UI.fmtCurrency(outstanding)}</strong></div>
          </div>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="Sales.filterPayment('credit')">${I18n.getLang() === 'ar' ? 'عرض الديون فقط' : 'View Credits Only'}</button>
      </div>` : ''}

      <div class="filter-bar">
        <div class="filter-search">
          <svg class="filter-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="input filter-search" placeholder="${I18n.getLang() === 'ar' ? 'ابحث عن منتج أو عميل…' : 'Search by product or customer…'}" oninput="Sales.setSearch(this.value)">
        </div>
        <select class="select" onchange="Sales.setFilter('product', this.value)">
          <option value="">${I18n.getLang() === 'ar' ? 'جميع المنتجات' : 'All Products'}</option>
          ${DB.getAll('products').map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <select class="select" id="paymentFilter" onchange="Sales.setFilter('payment', this.value)">
          <option value="">${I18n.getLang() === 'ar' ? 'جميع المدفوعات' : 'All Payments'}</option>
          <option value="paid">${t('status_paid')}</option>
          <option value="credit">${t('status_credit')}</option>
          <option value="overdue">${t('status_overdue')}</option>
        </select>
        <input class="input" type="date" placeholder="From date" id="sDateFrom" onchange="Sales.renderTable()">
        <input class="input" type="date" placeholder="To date"   id="sDateTo"   onchange="Sales.renderTable()">
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
                <th>${t('th_profit')}</th>
                <th>${t('th_margin')}</th>
                <th>${t('th_customer')}</th>
                <th>${t('th_date')}</th>
                <th>${t('th_payment')}</th>
                <th>${I18n.getLang() === 'ar' ? 'المدفوع / المتبقي' : 'Paid / Remaining'}</th>
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

    let data = DB.getAllEnrichedSales();
    if (_search)        data = data.filter(s => s.productName?.toLowerCase().includes(_search) || s.customer?.toLowerCase().includes(_search));
    if (_filterProduct) data = data.filter(s => s.productId == _filterProduct);
    if (_filterPayment === 'paid')    data = data.filter(s => s.paymentStatus !== 'credit');
    if (_filterPayment === 'credit')  data = data.filter(s => s.paymentStatus === 'credit');
    if (_filterPayment === 'overdue') data = data.filter(s => s.paymentStatus === 'credit' && s.dueDate && s.dueDate < today);
    if (from) data = data.filter(s => s.saleDate >= from);
    if (to)   data = data.filter(s => s.saleDate <= to);

    if (!data.length) {
      body.innerHTML = `<tr><td colspan="12"><div class="empty-state"><div class="empty-icon">🛒</div><h3>${I18n.getLang() === 'ar' ? 'لم يتم العثور على مبيعات' : 'No sales found'}</h3><p>${I18n.getLang() === 'ar' ? 'سجل عملية البيع الأولى لبدء التتبع.' : 'Record your first sale to start tracking profit.'}</p><button class="btn btn-primary" onclick="Sales.openAdd()">${t('btn_record_sale')}</button></div></td></tr>`;
      return;
    }

    body.innerHTML = data.map(s => {
      const isCredit  = s.paymentStatus === 'credit';
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
        <td class="${s.profit >= 0 ? 'text-success' : 'text-danger'} fw-600">${UI.fmtCurrency(s.profit)}</td>
        <td>
          <span class="badge ${s.profitMargin >= 20 ? 'badge-success' : s.profitMargin >= 10 ? 'badge-warning' : 'badge-danger'}">
            ${UI.fmtPct(s.profitMargin)}
          </span>
        </td>
        <td style="font-weight:500">${s.customer || '—'}</td>
        <td class="td-muted">${UI.fmtDate(s.saleDate)}</td>
        <td>${paymentBadge(s.paymentStatus, isOverdue)}</td>
        <td>
          ${isCredit
            ? `<div style="line-height:1.35;white-space:nowrap">
                 <div style="font-size:0.78rem;color:var(--success);font-weight:600">✓ ${I18n.getLang() === 'ar' ? 'مدفوع:' : 'Paid:'} ${UI.fmtCurrency(s.amountPaid || 0)}</div>
                 <div style="font-size:0.82rem;color:var(--danger);font-weight:700">⏳ ${I18n.getLang() === 'ar' ? 'متبقي:' : 'Rem:'} ${UI.fmtCurrency(Math.max(0, (s.revenue || 0) - (s.amountPaid || 0)))}</div>
                 ${s.dueDate ? `<div style="font-size:0.7rem;color:${isOverdue?'var(--danger)':'var(--text-muted)'};margin-top:2px">📅 ${UI.fmtDate(s.dueDate)}</div>` : ''}
               </div>`
            : `<span class="badge badge-success" style="font-size:0.75rem;white-space:nowrap">${I18n.getLang() === 'ar' ? 'مدفوع كلياً' : 'Paid Full'}</span>`}
        </td>
        <td>
          <div class="actions">
            ${isCredit
              ? `<button class="act-btn" onclick="Sales.openPaymentModal(${s.id})" title="${I18n.getLang() === 'ar' ? 'إضافة دفعة / سداد' : 'Add Payment / Settle'}" style="background:rgba(16,185,129,0.15);color:var(--success);font-weight:700;padding:4px 8px;border-radius:6px;width:auto;display:inline-flex;align-items:center;gap:4px;font-size:0.75rem;">💵 ${I18n.getLang() === 'ar' ? 'سداد' : 'Pay'}</button>`
              : ''}
            <button class="act-btn edit" onclick="Sales.openEdit(${s.id})" title="Edit">✏️</button>
            <button class="act-btn del"  onclick="Sales.delete(${s.id})"   title="Delete">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function paymentBadge(status, overdue) {
    if (status === 'credit' && overdue) return `<span class="badge badge-danger">⚠ Overdue</span>`;
    if (status === 'credit')            return `<span class="badge badge-warning">💳 Credit</span>`;
    return `<span class="badge badge-success">✓ Paid</span>`;
  }

  // ── Sale Form ─────────────────────────────
  function saleForm(s = {}) {
    const products = DB.getAllEnrichedProducts().filter(p => p.currentStock > 0 || s.id);
    const isCredit = s.paymentStatus === 'credit';
    return `
    <div class="form-grid form-grid-2">
      <div class="field col-span-2">
        <label>${t('lbl_product')} <span class="req">*</span></label>
        <select class="select" id="sProduct" onchange="Sales.updateCalc()" required>
          <option value="">${I18n.getLang() === 'ar' ? 'اختر منتجاً للبيع' : 'Select product to sell'}</option>
          ${products.map(p => `<option value="${p.id}" data-cpu="${p.costPerUnit}" data-stock="${p.currentStock}" ${s.productId==p.id?'selected':''}>${p.name} (${p.code}) — Stock: ${p.currentStock}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>${t('lbl_qty_sold')} <span class="req">*</span></label>
        <input class="input" type="number" id="sQty" value="${s.quantity||''}" placeholder="e.g. 5" min="1" oninput="Sales.updateCalc()" required>
        <span class="field-hint" id="sStockHint">${t('available_stock')}: —</span>
      </div>
      <div class="field">
        <label>${t('lbl_sell_price')} <span class="req">*</span></label>
        <div class="input-prefix-wrap"><span class="input-prefix">F</span>
          <input class="input" type="number" id="sSellPrice" value="${s.sellingPrice||''}" placeholder="0" oninput="Sales.updateCalc()" required>
        </div>
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
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">
          <label id="payOptPaid" onclick="Sales.togglePayment('paid')" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;cursor:pointer;border:2px solid ${!isCredit?'var(--accent)':'var(--border-light)'};background:${!isCredit?'rgba(6,214,160,0.08)':'var(--bg-elevated)'};transition:var(--transition)">
            <input type="radio" name="payStatus" value="paid" ${!isCredit?'checked':''} style="display:none">
            <span style="width:20px;height:20px;border-radius:50%;background:${!isCredit?'var(--accent)':'var(--border-light)'};display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;flex-shrink:0" id="payDotPaid">${!isCredit?'✓':''}</span>
            <div>
              <div style="font-weight:600;font-size:0.875rem;color:${!isCredit?'var(--accent)':'var(--text-primary)'}">${t('pay_now')}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${t('pay_now_sub')}</div>
            </div>
          </label>
          <label id="payOptCredit" onclick="Sales.togglePayment('credit')" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;cursor:pointer;border:2px solid ${isCredit?'var(--warning)':'var(--border-light)'};background:${isCredit?'rgba(245,158,11,0.08)':'var(--bg-elevated)'};transition:var(--transition)">
            <input type="radio" name="payStatus" value="credit" ${isCredit?'checked':''} style="display:none">
            <span style="width:20px;height:20px;border-radius:50%;background:${isCredit?'var(--warning)':'var(--border-light)'};display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;flex-shrink:0" id="payDotCredit">${isCredit?'✓':''}</span>
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
      <div class="field" id="partialWrap" style="display:${isCredit?'flex':'none'};flex-direction:column;gap:6px">
        <label>${t('lbl_amount_paid')}</label>
        <div class="input-prefix-wrap"><span class="input-prefix">F</span>
          <input class="input" type="number" id="sAmountPaid" value="${s.amountPaid||0}" placeholder="0" oninput="Sales.updateCalc()">
        </div>
      </div>
      <div class="field col-span-2" id="remBalanceWrap" style="display:${isCredit?'block':'none'};margin-top:-2px;margin-bottom:4px">
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600;font-size:0.85rem;color:var(--danger)">⏳ ${I18n.getLang() === 'ar' ? 'المبلغ المتبقي على العميل لسداده:' : 'Remaining Amount to be Paid by Customer:'}</span>
          <span style="font-weight:800;font-size:1.05rem;color:var(--danger)" id="sRemainingDisplay">${UI.fmtCurrency(Math.max(0, (s.revenue || 0) - (s.amountPaid || 0)))}</span>
        </div>
      </div>

      <div class="field col-span-2">
        <label>${t('lbl_note')}</label>
        <input class="input" id="sNote" value="${s.note||''}" placeholder="${t('lbl_note')}">
      </div>
    </div>

    <!-- Live Profit Calculator -->
    <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:14px;padding:18px;margin-top:18px;box-shadow:var(--shadow)">
      <div style="font-size:0.9rem;font-weight:700;margin-bottom:14px;color:var(--text-primary);display:flex;align-items:center;gap:8px">
        <span>📊</span> ${t('profit_calc')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px">
        ${calcBox('sCalcRevenue', t('th_revenue'), 'var(--accent)')}
        ${calcBox('sCalcCost', t('th_cost'), 'var(--warning)')}
        ${calcBox('sCalcProfit', t('th_profit'), 'var(--success)')}
        ${calcBox('sCalcCPU', t('th_cpu'), 'var(--primary-light)')}
        ${calcBox('sCalcMargin', t('th_margin'), '#60A5FA')}
        ${calcBox('sCalcRemaining', I18n.getLang() === 'ar' ? 'المتبقي للسداد' : 'Remaining to Pay', 'var(--danger)')}
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
    if (dotPaid) { dotPaid.style.background = isPaid ? 'var(--accent)' : 'var(--border-light)'; dotPaid.textContent = isPaid ? '✓' : ''; }
    if (dotCredit) { dotCredit.style.background = !isPaid ? 'var(--warning)' : 'var(--border-light)'; dotCredit.textContent = !isPaid ? '✓' : ''; }

    // Show/hide credit fields
    const dueWrap     = document.getElementById('dueDateWrap');
    const partialWrap = document.getElementById('partialWrap');
    const remWrap     = document.getElementById('remBalanceWrap');
    if (dueWrap)     dueWrap.style.display     = isPaid ? 'none' : 'flex';
    if (partialWrap) partialWrap.style.display  = isPaid ? 'none' : 'flex';
    if (remWrap)     remWrap.style.display      = isPaid ? 'none' : 'block';
    updateCalc();
  }

  function calcBox(id, label, color) {
    return `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:12px 10px;text-align:center;box-shadow:var(--shadow);transition:var(--transition);position:relative;overflow:hidden">
      <div style="position:absolute;top:0;left:0;right:0;height:2.5px;background:${color}"></div>
      <div style="font-size:1.1rem;font-weight:800;color:${color};margin-bottom:3px" id="${id}">0 FCFA</div>
      <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">${label}</div>
    </div>`;
  }

  function updateCalc() {
    const sel   = document.getElementById('sProduct');
    const opt   = sel?.selectedOptions[0];
    const cpu   = parseFloat(opt?.dataset.cpu) || 0;
    const stock = parseInt(opt?.dataset.stock) || 0;
    const qty   = parseInt(document.getElementById('sQty')?.value) || 0;
    const price = parseFloat(document.getElementById('sSellPrice')?.value) || 0;

    const hint = document.getElementById('sStockHint');
    if (hint) hint.textContent = `Available stock: ${stock} units`;

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

    const paid = parseFloat(document.getElementById('sAmountPaid')?.value) || 0;
    const rem  = Math.max(0, revenue - paid);
    set('sCalcRemaining', UI.fmtCurrency(rem));
    const remDisp = document.getElementById('sRemainingDisplay');
    if (remDisp) remDisp.textContent = UI.fmtCurrency(rem);
  }

  function openAdd() {
    _editId = null;
    _paymentStatus = 'paid';
    UI.createModal('saleModal', '🛒 Record New Sale',
      saleForm(),
      `<button class="btn btn-ghost" onclick="UI.closeModal('saleModal')">Cancel</button>
       <button class="btn btn-primary" onclick="Sales.save()">💾 Save Sale</button>`,
      'modal-lg'
    );
    setTimeout(updateCalc, 100);
  }

  function openEdit(id) {
    _editId = id;
    const s = DB.getEnrichedSale(id);
    if (!s) return;
    _paymentStatus = s.paymentStatus || 'paid';
    UI.createModal('saleModal', '✏️ Edit Sale',
      saleForm(s),
      `<button class="btn btn-ghost" onclick="UI.closeModal('saleModal')">Cancel</button>
       <button class="btn btn-primary" onclick="Sales.save()">💾 Update Sale</button>`,
      'modal-lg'
    );
    setTimeout(updateCalc, 100);
  }

  function save() {
    const productId    = parseInt(document.getElementById('sProduct')?.value);
    const qty          = parseInt(document.getElementById('sQty')?.value);
    const sellingPrice = parseFloat(document.getElementById('sSellPrice')?.value);
    const saleDate     = document.getElementById('sSaleDate')?.value;
    const customer     = document.getElementById('sCustomer')?.value.trim();
    const customerPhone = document.getElementById('sCustomerPhone')?.value.trim();
    const note         = document.getElementById('sNote')?.value.trim();
    const paymentStatusRaw = _paymentStatus || 'paid';
    const dueDate      = paymentStatusRaw === 'credit' ? document.getElementById('sDueDate')?.value : null;
    let amountPaid     = paymentStatusRaw === 'credit' ? (parseFloat(document.getElementById('sAmountPaid')?.value) || 0) : null;
    let paymentStatus  = paymentStatusRaw;

    if (!productId || isNaN(qty) || qty < 1 || isNaN(sellingPrice) || sellingPrice <= 0) {
      UI.toast('error', 'Missing Fields', 'Please fill in all required fields.'); return;
    }

    const product = DB.getEnrichedProduct(productId);
    if (!product) { UI.toast('error', 'Product not found'); return; }

    const availableStock = _editId
      ? product.currentStock + (DB.getById('sales', _editId)?.quantity || 0)
      : product.currentStock;

    if (qty > availableStock) {
      UI.toast('error', 'Insufficient Stock', `Only ${availableStock} units available.`); return;
    }

    const cpu          = product.costPerUnit;
    const revenue      = sellingPrice * qty;
    const cost         = cpu * qty;
    const profit       = revenue - cost;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    if (paymentStatus === 'credit' && amountPaid >= revenue) {
      paymentStatus = 'paid';
      amountPaid = revenue;
    }

    const data = {
      productId, quantity: qty, sellingPrice,
      revenue, cost, profit, profitMargin,
      saleDate, customer, customerPhone, note,
      paymentStatus, dueDate, amountPaid,
      paidAt: paymentStatus === 'paid' ? (DB.getById('sales', _editId)?.paidAt || saleDate) : null,
    };

    if (_editId) DB.update('sales', _editId, data);
    else DB.insert('sales', data);

    UI.closeModal('saleModal');
    const extra = paymentStatus === 'credit'
      ? `⏳ Credit — due ${dueDate ? UI.fmtDate(dueDate) : 'TBD'}`
      : `Revenue: ${UI.fmtCurrency(revenue)} | Profit: ${UI.fmtCurrency(profit)}`;
    UI.toast('success', _editId ? 'Sale Updated' : 'Sale Recorded', extra);
    UI.navigate('sales');
  }

  // ── Mark Credit as Paid / Add Customer Payment ───────────────────
  function openPaymentModal(id) {
    const s = DB.getEnrichedSale(id);
    if (!s) return;
    const paid = s.amountPaid || 0;
    const rem  = Math.max(0, s.revenue - paid);
    const customer = s.customer || `Sale #${s.id}`;
    const isAr = I18n.getLang() === 'ar';

    const body = `
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:12px;padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;">
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">${isAr?'إجمالي الفاتورة':'Total Revenue'}</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-top:4px">${UI.fmtCurrency(s.revenue)}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">${isAr?'المدفوع مسبقاً':'Already Paid'}</div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--success);margin-top:4px">${UI.fmtCurrency(paid)}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;">${isAr?'المتبقي للسداد':'Remaining Balance'}</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--danger);margin-top:4px">${UI.fmtCurrency(rem)}</div>
        </div>
      </div>

      <div class="field">
        <label>${isAr?'المبلغ المراد سداده الآن':'Payment Amount Now'} <span class="req">*</span></label>
        <div class="input-prefix-wrap"><span class="input-prefix">F</span>
          <input class="input" type="number" id="payModalAmount" value="${rem}" min="1" max="${rem}" placeholder="0">
        </div>
        <span class="field-hint">${isAr?'أدخل المبلغ المدفوع جزئياً أو كلياً':'Enter partial or full payment amount being settled now.'}</span>
      </div>

      <div class="field">
        <label>${isAr?'تاريخ الدفع':'Payment Date'}</label>
        <input class="input" type="date" id="payModalDate" value="${new Date().toISOString().split('T')[0]}">
      </div>
    </div>`;

    UI.createModal('payModal', `💳 ${isAr?'سداد دفعة العميل':'Add Customer Payment'} — ${customer}`,
      body,
      `<button class="btn btn-ghost" onclick="UI.closeModal('payModal')">${isAr?'إلغاء':'Cancel'}</button>
       <button class="btn btn-primary" onclick="Sales.confirmPayment(${id})">💾 ${isAr?'حفظ الدفعة':'Save Payment'}</button>`,
      'modal-md'
    );
  }

  function confirmPayment(id) {
    const s = DB.getById('sales', id);
    if (!s) return;
    const addVal = parseFloat(document.getElementById('payModalAmount')?.value) || 0;
    const payDate = document.getElementById('payModalDate')?.value || new Date().toISOString().split('T')[0];
    if (isNaN(addVal) || addVal <= 0) {
      UI.toast('error', 'Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }
    const oldPaid = s.amountPaid || 0;
    const newPaid = oldPaid + addVal;
    const rem     = Math.max(0, s.revenue - newPaid);
    const isFull  = rem === 0;

    DB.update('sales', id, {
      amountPaid: Math.min(s.revenue, newPaid),
      paymentStatus: isFull ? 'paid' : 'credit',
      paidAt: isFull ? payDate : (s.paidAt || null)
    });

    UI.closeModal('payModal');
    const isAr = I18n.getLang() === 'ar';
    UI.toast('success', isAr ? 'تم تسجيل الدفعة' : 'Payment Recorded',
      `${s.customer || '#' + id}: ${isAr?'تم دفع':'paid'} ${UI.fmtCurrency(addVal)}. ${isAr?'المتبقي:':'Remaining:'} ${UI.fmtCurrency(rem)}`);
    renderTable();
  }

  async function markPaid(id) {
    openPaymentModal(id);
  }

  // ── Delete Sale ───────────────────────────
  async function del(id) {
    const s = DB.getEnrichedSale(id);
    if (!s) return;
    const ok = await UI.confirm('Delete Sale?', `Sale of "${s.productName}" (${s.quantity} units) will be permanently deleted.`);
    if (!ok) return;
    DB.remove('sales', id);
    UI.toast('success', 'Sale Deleted');
    renderTable();
  }

  return {
    render, setSearch, setFilter, filterPayment, renderTable,
    openAdd, openEdit, save, delete: del,
    updateCalc, togglePayment, markPaid, openPaymentModal, confirmPayment,
  };
})();
