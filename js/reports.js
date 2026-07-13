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
        <div class="page-title"><h2>📊 ${t('page_reports')}</h2><p>${I18n.getLang() === 'ar' ? 'التقارير المالية والتحليلات التجارية' : 'Financial reports and business analytics'}</p></div>
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
        <button class="report-tab ${_period === 'all' ? 'active' : ''}"     onclick="Reports.setPeriod('all')">${I18n.getLang() === 'ar' ? 'كل الأوقات' : 'All Time'}</button>
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
    const isAr = typeof I18n !== 'undefined' && I18n.getLang() === 'ar';
    const labels = {
      daily: isAr ? 'تقرير اليوم' : "Today's Report",
      weekly: isAr ? 'تقرير هذا الأسبوع' : "This Week's Report",
      monthly: isAr ? 'تقرير هذا الشهر' : "This Month's Report",
      annual: isAr ? 'التقرير السنوي' : "Annual Report",
      all: isAr ? 'تقرير كل الأوقات (شامل)' : "All Time Report (Complete History)"
    };
    return labels[_period] || (isAr ? 'تقرير' : 'Report');
  }

  function renderReport() {
    const c = document.getElementById('reportContent');
    if (!c) return;
    const d = getPeriodData(_period);
    const products = DB.getAllEnrichedProducts();
    const inventoryValue = products.reduce((a, p) => a + p.costPerUnit * p.currentStock, 0);

    c.innerHTML = `
    <!-- Key Metrics -->
    <div class="report-section">
      <div class="report-section-header">
        <div class="report-section-icon" style="background:rgba(6,214,160,0.1);color:var(--accent)">📊</div>
        <div>
          <div style="font-weight:600">${getPeriodLabel()}</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">${I18n.getLang() === 'ar' ? 'تم التوليد في:' : 'Generated:'} ${new Date().toLocaleString()}</div>
        </div>
      </div>
      <div class="kpi-grid" style="padding:20px;margin-bottom:0">
        ${metricBox('💰', t('th_revenue'), UI.fmtCurrency(d.revenue), 'green')}
        ${metricBox('📈', t('kpi_profit'), UI.fmtCurrency(d.profit), 'purple')}
        ${metricBox('🔄', I18n.getLang() === 'ar' ? 'صافي الربح' : 'Net Profit', UI.fmtCurrency(d.netProfit), d.netProfit >= 0 ? 'green' : 'red')}
        ${metricBox('💸', I18n.getLang() === 'ar' ? 'مصاريف العمل' : 'Biz Expenses', UI.fmtCurrency(d.bizExpTotal), 'orange')}
        ${metricBox('📦', I18n.getLang() === 'ar' ? 'تكاليف الاستيراد' : 'Import Costs', UI.fmtCurrency(d.impExpTotal), 'orange')}
        ${metricBox('📊', t('th_margin'), UI.fmtPct(d.margin), 'blue')}
        ${metricBox('🛒', I18n.getLang() === 'ar' ? 'عمليات البيع' : 'Sales Made', d.sales.length, 'teal')}
        ${metricBox('📦', I18n.getLang() === 'ar' ? 'الوحدات المباعة' : 'Units Sold', d.unitsSold, 'indigo')}
      </div>
    </div>

    <!-- Sales Breakdown -->
    <div class="report-section">
      <div class="report-section-header">
        <div class="report-section-icon" style="background:rgba(124,58,237,0.1);color:var(--primary-light)">🛒</div>
        <div style="font-weight:600">${I18n.getLang() === 'ar' ? 'تفاصيل المبيعات' : 'Sales Breakdown'}</div>
      </div>
      ${d.sales.length ? `
      <div style="overflow-x:auto"><table>
        <thead><tr><th>${t('th_product')}</th><th>${t('th_qty')}</th><th>${t('th_unit_price')}</th><th>${t('th_revenue')}</th><th>${t('th_cost')}</th><th>${t('th_profit')}</th><th>${t('th_margin')}</th><th>${t('th_customer')}</th><th>${t('th_date')}</th></tr></thead>
        <tbody>
          ${d.sales.slice(0, 50).map(s => `
          <tr>
            <td style="font-weight:500">${s.productName}</td>
            <td>${s.quantity}</td>
            <td>${UI.fmtCurrency(s.sellingPrice)}</td>
            <td class="text-accent fw-600">${UI.fmtCurrency(s.revenue)}</td>
            <td class="td-muted">${UI.fmtCurrency(s.cost)}</td>
            <td class="${s.profit >= 0 ? 'text-success' : 'text-danger'} fw-600">${UI.fmtCurrency(s.profit)}</td>
            <td><span class="badge ${s.profitMargin >= 20 ? 'badge-success' : s.profitMargin >= 10 ? 'badge-warning' : 'badge-danger'}">${UI.fmtPct(s.profitMargin)}</span></td>
            <td class="td-muted">${s.customer || '—'}</td>
            <td class="td-muted">${UI.fmtDate(s.saleDate)}</td>
          </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr style="background:var(--bg-elevated)">
            <td colspan="3" style="font-weight:700;padding:12px 14px">${I18n.getLang() === 'ar' ? 'الإجمالي' : 'TOTAL'}</td>
            <td class="text-accent fw-600" style="padding:12px 14px">${UI.fmtCurrency(d.revenue)}</td>
            <td class="td-muted" style="padding:12px 14px">${UI.fmtCurrency(d.costOfGoods)}</td>
            <td class="${d.profit >= 0 ? 'text-success' : 'text-danger'} fw-600" style="padding:12px 14px">${UI.fmtCurrency(d.profit)}</td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table></div>` : `<div class="empty-state" style="padding:40px"><div class="empty-icon">🛒</div><h3>${I18n.getLang() === 'ar' ? 'لا توجد مبيعات في هذه الفترة' : 'No sales in this period'}</h3></div>`}
    </div>

    <!-- Best Selling Products -->
    ${d.bestProducts.length ? `
    <div class="report-section">
      <div class="report-section-header">
        <div class="report-section-icon" style="background:rgba(245,158,11,0.1);color:var(--warning)">🏆</div>
        <div style="font-weight:600">${t('chart_top_selling')}</div>
      </div>
      <div style="padding:16px 20px">
        ${d.bestProducts.map((p, i) => `
        <div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border-light)">
          <div style="width:28px;height:28px;border-radius:50%;background:${i === 0 ? 'rgba(245,158,11,0.2)' : i === 1 ? 'rgba(148,163,184,0.1)' : i === 2 ? 'rgba(180,120,60,0.1)' : 'rgba(124,58,237,0.08)'};display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:700;color:${i === 0 ? 'var(--warning)' : i === 1 ? '#94A3B8' : 'var(--text-muted)'}">${i + 1}</div>
          <div style="flex:1">
            <div style="font-weight:600">${p.name}</div>
            <div style="font-size:0.78rem;color:var(--text-muted)">${p.qty} ${I18n.getLang() === 'ar' ? 'وحدات مباعة' : 'units sold'}</div>
          </div>
          <div style="text-align:right">
            <div class="text-accent fw-600">${UI.fmtCurrency(p.revenue)}</div>
            <div style="font-size:0.78rem;color:var(--success)">${UI.fmtCurrency(p.profit)} ${I18n.getLang() === 'ar' ? 'أرباح' : 'profit'}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- Business Expenses -->
    ${d.bizExp.length ? `
    <div class="report-section">
      <div class="report-section-header">
        <div class="report-section-icon" style="background:rgba(239,68,68,0.1);color:var(--danger)">🏢</div>
        <div style="font-weight:600">${I18n.getLang() === 'ar' ? 'مصاريف العمل' : 'Business Expenses'} — ${UI.fmtCurrency(d.bizExpTotal)}</div>
      </div>
      <div style="overflow-x:auto"><table>
        <thead><tr><th>${I18n.getLang() === 'ar' ? 'العنوان' : 'Title'}</th><th>${t('th_category')}</th><th>${t('th_cost')}</th><th>${t('th_date')}</th><th>${t('lbl_note')}</th></tr></thead>
        <tbody>
          ${d.bizExp.map(e => `
          <tr>
            <td style="font-weight:500">${e.title}</td>
            <td><span class="badge badge-info">${e.category || '—'}</span></td>
            <td class="text-danger fw-600">${UI.fmtCurrency(e.amount)}</td>
            <td class="td-muted">${UI.fmtDate(e.expenseDate)}</td>
            <td class="td-muted">${e.note || '—'}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>` : ''}

    <!-- Inventory Snapshot -->
    <div class="report-section">
      <div class="report-section-header">
        <div class="report-section-icon" style="background:rgba(59,130,246,0.1);color:#60A5FA">🏪</div>
        <div style="font-weight:600">${I18n.getLang() === 'ar' ? 'لقطة للمخزون الحالي — القيمة:' : 'Current Inventory Snapshot — Value:'} ${UI.fmtCurrency(inventoryValue)}</div>
      </div>
      <div style="overflow-x:auto"><table>
        <thead><tr><th>${t('th_product')}</th><th>${t('th_code')}</th><th>${t('th_in_stock')}</th><th>${t('th_cpu')}</th><th>${t('th_stock_value')}</th><th>${t('th_status')}</th></tr></thead>
        <tbody>
          ${products.map(p => `
          <tr>
            <td style="font-weight:500">${p.name}</td>
            <td class="td-muted" style="font-family:monospace">${p.code}</td>
            <td style="font-weight:700;color:${p.currentStock === 0 ? 'var(--danger)' : p.currentStock <= 5 ? 'var(--warning)' : 'var(--accent)'}">${p.currentStock}</td>
            <td>${UI.fmtCurrency(p.costPerUnit)}</td>
            <td class="fw-600">${UI.fmtCurrency(p.costPerUnit * p.currentStock)}</td>
            <td>${stockBadge(p.stockStatus)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
  }

  function metricBox(icon, label, val, color) {
    const tc = { green: 'var(--accent)', purple: 'var(--primary-light)', orange: 'var(--warning)', red: 'var(--danger)', blue: '#60A5FA', teal: '#2DD4BF', indigo: '#818CF8' };
    return `
    <div style="background:var(--bg-elevated);border-radius:10px;padding:14px">
      <div style="font-size:20px;margin-bottom:6px">${icon}</div>
      <div style="font-size:1.1rem;font-weight:700;color:${tc[color] || 'var(--text-primary)'}">${val}</div>
      <div style="font-size:0.75rem;color:var(--text-muted)">${label}</div>
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
    UI.toast('success', 'PDF Exported', 'Report downloaded successfully.');
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
        UI.toast('success', t('btn_export_excel') || 'Excel Exported', 'Spreadsheet downloaded successfully.');
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
    UI.toast('success', t('btn_export_excel') || 'Excel Exported', 'Spreadsheet downloaded successfully.');
  }

  return { render, setPeriod, exportPDF, exportExcel };
})();
