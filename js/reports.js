/* =============================================
   REPORTS.JS — Reports & Export Module
   Smart Import & Sales Management System
   ============================================= */

const Reports = (() => {
  let _period = 'monthly';

  function render(container) {
    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title" style="display:flex;align-items:center;gap:10px;"><h2>${t('page_reports')}</h2><p>${I18n.choose('Financial reports and business analytics', 'التقارير المالية والتحليلات التجارية', 'Rapports financiers et analyses commerciales')}</p></div>
        <div class="page-actions">
          <button class="btn btn-ghost" onclick="Reports.exportExcel()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            ${t('btn_export_excel')}
          </button>
          <button class="btn btn-primary" onclick="Reports.exportPDF()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ${t('btn_export_pdf')}
          </button>
          <button class="btn btn-ghost" onclick="window.print()">${t('btn_print')}</button>
        </div>
      </div>

      <!-- Period Tabs -->
      <div class="report-tabs">
        <button class="report-tab ${_period === 'daily' ? 'active' : ''}"   onclick="Reports.setPeriod('daily')">${t('rep_daily')}</button>
        <button class="report-tab ${_period === 'weekly' ? 'active' : ''}"  onclick="Reports.setPeriod('weekly')">${t('rep_weekly')}</button>
        <button class="report-tab ${_period === 'monthly' ? 'active' : ''}" onclick="Reports.setPeriod('monthly')">${t('rep_monthly')}</button>
        <button class="report-tab ${_period === 'annual' ? 'active' : ''}"  onclick="Reports.setPeriod('annual')">${t('rep_annual')}</button>
        <button class="report-tab ${_period === 'all' ? 'active' : ''}"     onclick="Reports.setPeriod('all')">${I18n.choose('All Time', 'كل الأوقات', 'De tous les temps')}</button>
      </div>

      <div id="reportContent"></div>
    </div>`;

    renderReport();
  }

  function setPeriod(p) {
    _period = p;
    document.querySelectorAll('.report-tab').forEach((el, i) => {
      const periods = ['daily', 'weekly', 'monthly', 'annual', 'all'];
      el.classList.toggle('active', periods[i] === p);
    });
    renderReport();
  }

  function getPeriodData(period) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];
    const thisMonth = now.toISOString().slice(0, 7);
    const thisYear = now.getFullYear().toString();

    const filterSales = (sales) => {
      switch (period) {
        case 'daily': return sales.filter(s => s.saleDate === today);
        case 'weekly': return sales.filter(s => s.saleDate >= thisWeekStartStr && s.saleDate <= today);
        case 'monthly': return sales.filter(s => s.saleDate?.startsWith(thisMonth));
        case 'annual': return sales.filter(s => s.saleDate?.startsWith(thisYear));
        default: return sales;
      }
    };

    const filterExp = (exps, field) => {
      switch (period) {
        case 'daily': return exps.filter(e => e[field] === today);
        case 'weekly': return exps.filter(e => e[field] >= thisWeekStartStr && e[field] <= today);
        case 'monthly': return exps.filter(e => e[field]?.startsWith(thisMonth));
        case 'annual': return exps.filter(e => e[field]?.startsWith(thisYear));
        default: return exps;
      }
    };

    const allSales = DB.getAllEnrichedSales();
    const sales = filterSales(allSales);
    const bizExp = filterExp(DB.getAll('businessExpenses'), 'expenseDate');
    const impExp = filterExp(DB.getAll('productExpenses'), 'date');

    const revenue = sales.reduce((a, s) => a + s.revenue, 0);
    const profit = sales.reduce((a, s) => a + s.profit, 0);
    const costOfGoods = sales.reduce((a, s) => a + s.cost, 0);
    const bizExpTotal = bizExp.reduce((a, e) => a + e.amount, 0);
    const impExpTotal = impExp.reduce((a, e) => a + e.amount, 0);
    const totalExp = bizExpTotal + impExpTotal;
    const netProfit = profit - bizExpTotal;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const unitsSold = sales.reduce((a, s) => a + s.quantity, 0);

    // Best selling products in period
    const prodSales = {};
    sales.forEach(s => {
      if (!prodSales[s.productId]) prodSales[s.productId] = { name: s.productName, qty: 0, revenue: 0, profit: 0 };
      prodSales[s.productId].qty += s.quantity;
      prodSales[s.productId].revenue += s.revenue;
      prodSales[s.productId].profit += s.profit;
    });
    const bestProducts = Object.values(prodSales).sort((a, b) => b.revenue - a.revenue);

    return { sales, bizExp, impExp, revenue, profit, costOfGoods, bizExpTotal, impExpTotal, totalExp, netProfit, margin, unitsSold, bestProducts };
  }

  function getPeriodLabel() {
    const labels = {
      daily: I18n.choose("Today's Report", 'تقرير اليوم', "Rapport d'aujourd'hui"),
      weekly: I18n.choose("This Week's Report", 'تقرير هذا الأسبوع', "Rapport de cette semaine"),
      monthly: I18n.choose("This Month's Report", 'تقرير هذا الشهر', "Rapport de ce mois"),
      annual: I18n.choose("Annual Report", 'التقرير السنوي', "Rapport annuel"),
      all: I18n.choose("All Time Report (Complete History)", 'تقرير كل الأوقات (شامل)', "Rapport global (Historique complet)")
    };
    return labels[_period] || I18n.choose('Report', 'تقرير', 'Rapport');
  }

  function renderReport() {
    const c = document.getElementById('reportContent');
    if (!c) return;
    const d = getPeriodData(_period);
    const products = DB.getAllEnrichedProducts();
    const inventoryValue = products.reduce((a, p) => a + p.costPerUnit * p.currentStock, 0);

    const ch = (en, ar, fr) => (typeof I18n !== 'undefined' && I18n.choose) ? I18n.choose(en, ar, fr) : (I18n.getLang() === 'ar' ? ar : en);

    c.innerHTML = `
    <div style="margin-bottom: 24px;">
      <!-- Key Metrics List -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin-bottom:16px;font-size:1.1rem;color:var(--text-dark);">${getPeriodLabel()} — <span style="font-size:0.85rem;color:var(--text-muted);font-weight:400">${ch('Generated:', 'تم التوليد في:', 'Généré :')} ${new Date().toLocaleString()}</span></h3>
        
        <!-- Revenue -->
        <div style="display:flex;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:15px;color:var(--text-muted);font-weight:500;">${ch('Total Revenue', 'إجمالي الإيرادات', 'Revenu total')}</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-main);font-family:monospace;text-align:right;padding-right:48px;">${UI.fmtCurrency(d.revenue)}</div>
          <div style="width:100px;text-align:right;font-size:13px;font-weight:500;color:var(--text-muted);font-family:monospace;">${d.sales.length} ${ch('sales', 'مبيعات', 'ventes')}</div>
        </div>

        <!-- Profit -->
        <div style="display:flex;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:15px;color:var(--text-muted);font-weight:500;">${ch('Total Profit', 'إجمالي الربح', 'Profit total')}</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-main);font-family:monospace;text-align:right;padding-right:48px;">${UI.fmtCurrency(d.profit)}</div>
          <div style="width:100px;text-align:right;font-size:13px;font-weight:500;color:var(--text-muted);font-family:monospace;">${UI.fmtPct(d.margin)} ${ch('margin', 'هامش', 'marge')}</div>
        </div>

        <!-- Net Profit -->
        <div style="display:flex;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:15px;color:var(--text-muted);font-weight:500;">${ch('Net Profit', 'صافي الربح', 'Bénéfice net')}</div>
          <div style="font-size:15px;font-weight:700;color:${d.netProfit >= 0 ? '#10b981' : '#ef4444'};font-family:monospace;text-align:right;padding-right:48px;">${UI.fmtCurrency(d.netProfit)}</div>
          <div style="width:100px;text-align:right;font-size:13px;font-weight:500;color:var(--text-muted);font-family:monospace;"></div>
        </div>

        <!-- Biz Expenses -->
        <div style="display:flex;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:15px;color:var(--text-muted);font-weight:500;">${ch('Business Expenses', 'مصاريف العمل', 'Dépenses commerciales')}</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-main);font-family:monospace;text-align:right;padding-right:48px;">${UI.fmtCurrency(d.bizExpTotal)}</div>
          <div style="width:100px;text-align:right;font-size:13px;font-weight:500;color:var(--text-muted);font-family:monospace;"></div>
        </div>

        <!-- Import Costs -->
        <div style="display:flex;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:15px;color:var(--text-muted);font-weight:500;">${ch('Import Costs', 'تكاليف الاستيراد', 'Coûts d\'importation')}</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-main);font-family:monospace;text-align:right;padding-right:48px;">${UI.fmtCurrency(d.impExpTotal)}</div>
          <div style="width:100px;text-align:right;font-size:13px;font-weight:500;color:var(--text-muted);font-family:monospace;"></div>
        </div>
      </div>

      <!-- Sales Breakdown Table -->
      <div style="margin-bottom:24px;">
        <div class="rpt-section-card">
          <div class="rpt-card-header">
            <div class="rpt-card-header-left">
              <span class="rpt-card-icon rpt-icon-blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </span>
              <span class="rpt-card-title">${ch('Sales Breakdown', 'تفاصيل المبيعات', 'Détails des ventes')}</span>
            </div>
            <span class="rpt-card-badge">${d.sales.length} ${ch('records','سجل','enreg.')}</span>
          </div>
          ${d.sales.length ? `
          <div class="rpt-table-scroll">
            <table class="rpt-table">
              <thead><tr>
                <th>${t('th_product')}</th>
                <th>${t('th_qty')}</th>
                <th>${t('th_unit_price')}</th>
                <th>${t('th_revenue')}</th>
                <th>${t('th_profit')}</th>
                <th>${t('th_margin')}</th>
                <th>${t('th_date')}</th>
              </tr></thead>
              <tbody>
                ${d.sales.slice(0, 50).map((s, idx) => `
                <tr class="${idx % 2 !== 0 ? 'rpt-row-alt' : ''}">
                  <td class="rpt-cell-product">${s.productName}</td>
                  <td><span class="rpt-qty-pill">${s.quantity}</span></td>
                  <td class="rpt-cell-muted">${UI.fmtCurrency(s.sellingPrice)}</td>
                  <td class="rpt-cell-revenue">${UI.fmtCurrency(s.revenue)}</td>
                  <td class="${s.profit >= 0 ? 'rpt-cell-profit' : 'rpt-cell-loss'}">${UI.fmtCurrency(s.profit)}</td>
                  <td><span class="badge ${s.profitMargin >= 20 ? 'badge-success' : s.profitMargin >= 10 ? 'badge-warning' : 'badge-danger'}">${UI.fmtPct(s.profitMargin)}</span></td>
                  <td class="rpt-cell-muted">${UI.fmtDate(s.saleDate)}</td>
                </tr>`).join('')}
              </tbody>
              <tfoot>
                <tr class="rpt-total-row">
                  <td colspan="3">${ch('TOTAL', 'الإجمالي', 'TOTAL')}</td>
                  <td class="rpt-cell-revenue">${UI.fmtCurrency(d.revenue)}</td>
                  <td class="${d.profit >= 0 ? 'rpt-cell-profit' : 'rpt-cell-loss'}">${UI.fmtCurrency(d.profit)}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>` : `<div class="rpt-empty">${ch('No sales in this period', 'لا توجد مبيعات في هذه الفترة', 'Aucune vente au cours de cette période')}</div>`}
        </div>
      </div>

      <!-- Top Selling Products Table -->
      ${d.bestProducts.length ? `
      <div style="margin-bottom:24px;">
        <div class="rpt-section-card">
          <div class="rpt-card-header">
            <div class="rpt-card-header-left">
              <span class="rpt-card-icon rpt-icon-gold">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
              </span>
              <span class="rpt-card-title">${t('chart_top_selling')}</span>
            </div>
            <span class="rpt-card-badge">${d.bestProducts.length} ${ch('products','منتج','produits')}</span>
          </div>
          <div class="rpt-table-scroll">
            <table class="rpt-table">
              <thead><tr>
                <th style="width:52px">#</th>
                <th>${t('th_product')}</th>
                <th>${ch('Units Sold','الوحدات المباعة','Unités vendues')}</th>
                <th>${t('th_revenue')}</th>
                <th>${t('th_profit')}</th>
              </tr></thead>
              <tbody>
                ${d.bestProducts.map((p, i) => `
                <tr class="${i % 2 !== 0 ? 'rpt-row-alt' : ''}">
                  <td><span class="rpt-rank rpt-rank-${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}">${i + 1}</span></td>
                  <td class="rpt-cell-product">`${UI.escapeHTML(p.name)}</td>
                  <td><span class="rpt-qty-pill">${p.qty}</span></td>
                  <td class="rpt-cell-revenue">${UI.fmtCurrency(p.revenue)}</td>
                  <td class="rpt-cell-profit">${UI.fmtCurrency(p.profit)}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>` : ''}

      <!-- Current Inventory Snapshot Table -->
      <div style="margin-bottom:24px;">
        <div class="rpt-section-card">
          <div class="rpt-card-header">
            <div class="rpt-card-header-left">
              <span class="rpt-card-icon rpt-icon-teal">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </span>
              <span class="rpt-card-title">${ch('Current Inventory Snapshot', 'نظرة على المخزون الحالي', 'Aperçu du stock actuel')}</span>
            </div>
            <span class="rpt-cell-revenue" style="font-weight:700;font-size:0.9rem;">${UI.fmtCurrency(inventoryValue)}</span>
          </div>
          <div class="rpt-table-scroll">
            <table class="rpt-table">
              <thead><tr>
                <th>${t('th_product')}</th>
                <th>${t('th_code')}</th>
                <th>${ch('In Stock','في المخزون','En stock')}</th>
                <th>${t('th_cpu')}</th>
                <th>${ch('Stock Value','قيمة المخزون','Valeur stock')}</th>
                <th>${t('th_status')}</th>
              </tr></thead>
              <tbody>
                ${products.map((p, idx) => `
                <tr class="${idx % 2 !== 0 ? 'rpt-row-alt' : ''}">
                  <td class="rpt-cell-product">`${UI.escapeHTML(p.name)}</td>
                  <td><span class="badge badge-purple" style="font-family:monospace;font-size:0.72rem">`${UI.escapeHTML(p.code)}</span></td>
                  <td><span class="rpt-qty-pill ${p.currentStock === 0 ? 'rpt-qty-out' : p.currentStock <= 5 ? 'rpt-qty-low' : 'rpt-qty-ok'}">${p.currentStock}</span></td>
                  <td class="rpt-cell-muted">${UI.fmtCurrency(p.costPerUnit)}</td>
                  <td class="rpt-cell-revenue">${UI.fmtCurrency(p.costPerUnit * p.currentStock)}</td>
                  <td>${stockBadge(p.stockStatus)}</td>
                </tr>`).join('')}
              </tbody>
              <tfoot>
                <tr class="rpt-total-row">
                  <td colspan="4">${ch('TOTAL INVENTORY VALUE','إجمالي قيمة المخزون','VALEUR TOTALE DU STOCK')}</td>
                  <td class="rpt-cell-revenue">${UI.fmtCurrency(inventoryValue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>`;
  }

  function stockBadge(s) {
    const m = { available: 'badge-success', low: 'badge-warning', out: 'badge-danger' };
    const labelKey = 'status_' + s;
    return `<span class="badge ${m[s] || 'badge-muted'}">${t(labelKey) || s}</span>`;
  }

  // ── PDF Export ────────────────────────────
  function exportPDF() {
    const jsPDF = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null);
    if (!jsPDF) { window.print(); return; }

    const doc = new jsPDF();
    const d = getPeriodData(_period);
    const label = getPeriodLabel();
    const now = new Date().toLocaleDateString();

    // Header
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('SmartIMS — ' + label, 14, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Generated: ' + now, 14, 22);

    // Summary
    let y = 42;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, y); y += 8;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');

    const metrics = [
      ['Revenue:', UI.fmtCurrency(d.revenue)],
      ['Gross Profit:', UI.fmtCurrency(d.profit)],
      ['Net Profit:', UI.fmtCurrency(d.netProfit)],
      ['Business Expenses:', UI.fmtCurrency(d.bizExpTotal)],
      ['Profit Margin:', UI.fmtPct(d.margin)],
      ['Units Sold:', String(d.unitsSold)],
      ['Sales Count:', String(d.sales.length)],
    ];
    metrics.forEach(([k, v]) => {
      doc.text(k, 14, y);
      doc.text(v, 80, y);
      y += 7;
    });

    // Sales Table
    if (d.sales.length) {
      y += 8;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Sales Breakdown', 14, y); y += 8;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');

      const headers = ['Product', 'Qty', 'Unit Price', 'Revenue', 'Profit', 'Date'];
      const colX = [14, 70, 90, 120, 150, 175];
      doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => doc.text(h, colX[i], y));
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.line(14, y - 2, 196, y - 2);

      d.sales.slice(0, 30).forEach(s => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.text(s.productName.slice(0, 22), colX[0], y);
        doc.text(String(s.quantity), colX[1], y);
        doc.text(UI.fmtCurrency(s.sellingPrice), colX[2], y);
        doc.text(UI.fmtCurrency(s.revenue), colX[3], y);
        doc.text(UI.fmtCurrency(s.profit), colX[4], y);
        doc.text(UI.fmtDate(s.saleDate), colX[5], y);
        y += 7;
      });
    }

    doc.save(`SmartIMS-${_period}-report-${now.replace(/\//g, '-')}.pdf`);
    UI.toast('success', I18n.choose('PDF Exported', 'تم تصدير PDF', 'PDF exporté'), I18n.choose('Report downloaded successfully.', 'تم تنزيل التقرير بنجاح.', 'Rapport téléchargé avec succès.'));
  }

  // ── Excel Export ──────────────────────────
  function exportExcel() {
    const d = getPeriodData(_period);
    const nowStr = new Date().toISOString().split('T')[0];
    const filename = `SmartIMS-${_period}-report-${nowStr}`;

    const salesRows = [
      ['Product', 'Code', 'Qty', 'Selling Price', 'Revenue', 'Cost', 'Profit', 'Margin %', 'Customer', 'Date']
    ];
    d.sales.forEach(s => salesRows.push([
      s.productName || '', s.productCode || '', s.quantity || 0,
      s.sellingPrice || 0, s.revenue || 0, s.cost || 0,
      s.profit || 0, parseFloat((s.profitMargin || 0).toFixed(2)),
      s.customer || '', s.saleDate || ''
    ]));

    if (window.XLSX) {
      try {
        const wb = XLSX.utils.book_new();
        const ws1 = XLSX.utils.aoa_to_sheet(salesRows);
        XLSX.utils.book_append_sheet(wb, ws1, 'Sales');

        if (d.bizExp.length) {
          const expRows = [['Title', 'Category', 'Amount', 'Date', 'Note']];
          d.bizExp.forEach(e => expRows.push([e.title, e.category || '', e.amount, e.expenseDate, e.note || '']));
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expRows), 'Business Expenses');
        }

        const products = DB.getAllEnrichedProducts();
        const invRows = [['Code', 'Product', 'Category', 'Supplier', 'Bought', 'In Stock', 'Cost/Unit', 'Stock Value', 'Status']];
        products.forEach(p => invRows.push([
          p.code, p.name, p.categoryName, p.supplierName,
          p.quantity, p.currentStock,
          parseFloat((p.costPerUnit || 0).toFixed(2)),
          parseFloat(((p.costPerUnit || 0) * (p.currentStock || 0)).toFixed(2)),
          p.stockStatus
        ]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(invRows), 'Inventory');

        const summary = [
          ['SmartIMS — ' + getPeriodLabel()],
          ['Generated', new Date().toLocaleString()],
          [],
          ['METRIC', 'VALUE'],
          ['Revenue', d.revenue],
          ['Gross Profit', d.profit],
          ['Net Profit', d.netProfit],
          ['Business Expenses', d.bizExpTotal],
          ['Import Expenses', d.impExpTotal],
          ['Profit Margin %', parseFloat((d.margin || 0).toFixed(2))],
          ['Units Sold', d.unitsSold],
          ['Sales Count', d.sales.length],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

        XLSX.writeFile(wb, `${filename}.xlsx`);
        UI.toast('success', t('btn_export_excel') || I18n.choose('Excel Exported', 'تم تصدير الإكسل', 'Excel exporté'), I18n.choose('Spreadsheet downloaded successfully.', 'تم تنزيل جدول البيانات بنجاح.', 'Tableau téléchargé avec succès.'));
        return;
      } catch (err) {
        console.warn('XLSX export failed, falling back to CSV:', err);
      }
    }

    // Direct Excel CSV fallback (UTF-8 BOM so Arabic & English open perfectly in Microsoft Excel)
    const escapeCSV = val => `"${String(val === null || val === undefined ? '' : val).replace(/"/g, '""')}"`;
    const csvContent = "\uFEFF" + salesRows.map(row => row.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.toast('success', t('btn_export_excel') || I18n.choose('Excel Exported', 'تم تصدير الإكسل', 'Excel exporté'), I18n.choose('Spreadsheet downloaded successfully.', 'تم تنزيل جدول البيانات بنجاح.', 'Tableau téléchargé avec succès.'));
  }

  return { render, setPeriod, exportPDF, exportExcel };
})();

