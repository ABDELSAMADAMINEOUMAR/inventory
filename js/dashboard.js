/* =============================================
   DASHBOARD.JS — Dashboard Module
   Smart Import & Sales Management System
   ============================================= */

const Dashboard = (() => {
  let _charts = {};

  function destroyCharts() {
    Object.values(_charts).forEach(c => { try { c.destroy(); } catch { } });
    _charts = {};
  }

  function render(container) {
    destroyCharts();
    const s = DB.getDashboardStats();
    const monthly = DB.getMonthlyData(6);
    const top = DB.getTopProducts(5);
    const allSalesRaw = DB.getAll('sales');
    const getPaidAmt  = s => (s.amountPaid !== undefined && s.amountPaid !== null && s.amountPaid !== '') ? Number(s.amountPaid) : Number(s.revenue || 0);
    const getRemAmt   = s => Math.max(0, Number(s.revenue || 0) - getPaidAmt(s));
    const creditSales = allSalesRaw.filter(s => getRemAmt(s) > 0.01);
    const outstanding = creditSales.reduce((a, s) => a + getRemAmt(s), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = creditSales.filter(s => s.dueDate && s.dueDate < todayStr).length;
    const showProfit = typeof UI !== 'undefined' && UI.canViewProfit ? UI.canViewProfit() : (typeof Auth !== 'undefined' && Auth.currentUser()?.role === 'admin');
    const unread = typeof UI !== 'undefined' && UI.getUnreadAlerts ? UI.getUnreadAlerts() : [];

    const profitMargin = (s.totalRevenue > 0) ? Math.round((s.totalProfit / s.totalRevenue) * 100) : 0;
    const ch = (en, ar, fr) => (typeof I18n !== 'undefined' && I18n.choose) ? I18n.choose(en, ar, fr) : (I18n.getLang() === 'ar' ? ar : en);

    container.innerHTML = `
    <div class="fade-in" style="padding: 10px 0 32px 0;">
      <!-- Alerts Section -->
      ${s.outOfStock > 0 && unread.some(p => p.stockStatus === 'out') && !isAlertDismissed('out_of_stock', s.outOfStock) ? `
      <div class="alert alert-danger alert-dismissible mb-16" style="display:flex;align-items:center;justify-content:space-between;border-radius:8px;padding:12px 16px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="alert-icon">${UI.icon('alert-triangle', '', 20)}</span>
          <div class="alert-content">
            <div class="alert-title" style="font-weight:700;font-size:14px;">${s.outOfStock} ${ch('product(s) are OUT OF STOCK', 'منتج نفد مخزونه', 'produit(s) EN RUPTURE DE STOCK')}</div>
            <div class="alert-body" style="font-size:13px;margin-top:2px;"><a href="#" onclick="UI.navigate('inventory');return false;" style="color:inherit;text-decoration:underline;">${ch('View Inventory →', 'عرض المخزون ←', 'Voir le stock →')}</a></div>
          </div>
        </div>
        <button onclick="Dashboard.dismissAlert('out_of_stock', ${s.outOfStock}, this)" style="background:none;border:none;cursor:pointer;font-size:18px;color:inherit;opacity:0.6;padding:4px;" title="Dismiss">✕</button>
      </div>` : ''}
      ${s.lowStock > 0 && unread.some(p => p.stockStatus === 'low') && !isAlertDismissed('low_stock', s.lowStock) ? `
      <div class="alert alert-warning alert-dismissible mb-16" style="display:flex;align-items:center;justify-content:space-between;border-radius:8px;padding:12px 16px;background:rgba(245,158,11,0.1);color:#f59e0b;border:1px solid rgba(245,158,11,0.2);">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="alert-icon">${UI.icon('alert-triangle', '', 20)}</span>
          <div class="alert-content">
            <div class="alert-title" style="font-weight:700;font-size:14px;">${s.lowStock} ${ch('product(s) are running LOW', 'منتج منخفض المخزون', 'produit(s) EN STOCK FAIBLE')}</div>
            <div class="alert-body" style="font-size:13px;margin-top:2px;"><a href="#" onclick="UI.navigate('inventory');return false;" style="color:inherit;text-decoration:underline;">${ch('View Inventory →', 'عرض المخزون ←', 'Voir le stock →')}</a></div>
          </div>
        </div>
        <button onclick="Dashboard.dismissAlert('low_stock', ${s.lowStock}, this)" style="background:none;border:none;cursor:pointer;font-size:18px;color:inherit;opacity:0.6;padding:4px;" title="Dismiss">✕</button>
      </div>` : ''}

      <!-- Main List View -->
      <div style="margin-bottom: 24px;">
        <!-- Gross Revenue -->
        <div style="display:flex;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:15px;color:var(--text-muted);font-weight:500;">${ch('Gross revenue', 'إجمالي الإيرادات', 'Revenu brut')}</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-main);font-family:monospace;text-align:right;padding-right:48px;">${UI.fmtCurrency(s.totalRevenue)}</div>
          <div style="width:100px;text-align:right;font-size:13px;font-weight:500;color:#10b981;font-family:monospace;">+18.4%</div>
        </div>

        <!-- Net Profit -->
        <div style="display:flex;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:15px;color:var(--text-muted);font-weight:500;">${ch('Net profit', 'صافي الربح', 'Profit net')}</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-main);font-family:monospace;text-align:right;padding-right:48px;">${showProfit ? UI.fmtCurrency(s.totalProfit) : '••••••••'}</div>
          <div style="width:100px;text-align:right;font-size:13px;font-weight:500;color:#9ca3af;font-family:monospace;">${showProfit ? (profitMargin + ch('% margin', '% هامش', '% marge')) : ch('Hidden', 'مخفي', 'Caché')}</div>
        </div>

        <!-- Monthly Sales -->
        <div style="display:flex;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:15px;color:var(--text-muted);font-weight:500;">${ch('Monthly sales', 'المبيعات الشهرية', 'Ventes mensuelles')}</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-main);font-family:monospace;text-align:right;padding-right:48px;">${UI.fmtCurrency(s.salesThisMonth)}</div>
          <div style="width:100px;text-align:right;font-size:13px;font-weight:500;color:#9ca3af;font-family:monospace;">${ch('today: ', 'اليوم: ', 'auj: ')}${UI.fmtCurrency(s.salesToday)}</div>
        </div>

        <!-- Credit Receivables -->
        <div style="display:flex;align-items:center;padding:16px 0;border-bottom:1px solid var(--border);">
          <div style="flex:1;font-size:15px;color:var(--text-muted);font-weight:500;">${ch('Credit receivables', 'مستحقات الآجل', 'Créances')}</div>
          <div style="font-size:15px;font-weight:700;color:var(--text-main);font-family:monospace;text-align:right;padding-right:48px;">${UI.fmtCurrency(outstanding)}</div>
          <div style="width:100px;text-align:right;font-size:13px;font-weight:500;color:#f59e0b;font-family:monospace;">${creditSales.length} ${ch('unpaid', 'غير مدفوع', 'non payé')}</div>
        </div>
      </div>

      <!-- Secondary Metrics -->
      <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:16px;padding:16px 0 32px 0;border-bottom:1px solid var(--border);margin-bottom:32px;">
        <div>
          <div style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${ch('Inventory Valuation', 'تقييم المخزون', 'Valorisation Stock')}</div>
          <div style="font-size:14px;font-weight:700;color:var(--text-main);font-family:monospace;">${UI.fmtCurrency(s.inventoryValue)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${ch('Total Expenses', 'إجمالي المصاريف', 'Total Dépenses')}</div>
          <div style="font-size:14px;font-weight:700;color:var(--text-main);font-family:monospace;">${UI.fmtCurrency(s.totalExpenses)}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${ch('Catalog Skus', 'أصناف الكتالوج', 'Références')}</div>
          <div style="font-size:14px;font-weight:700;color:var(--text-main);font-family:monospace;">${s.totalProducts} <span style="font-size:11px;color:#9ca3af;font-weight:500;">/ ${s.totalCategories} ${ch('categories', 'فئات', 'catégories')}</span></div>
        </div>
        <div>
          <div style="font-size:10px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${ch('Stock Health', 'صحة المخزون', 'Santé Stock')}</div>
          <div style="font-size:14px;font-weight:700;font-family:monospace;"><span style="color:#10b981;">${Math.max(0, s.totalProducts - s.outOfStock - s.lowStock)} ${ch('ok', 'جيد', 'ok')}</span> <span style="color:#9ca3af;margin:0 4px;">·</span> <span style="color:#ef4444;">${s.outOfStock} ${ch('out', 'نافد', 'rupture')}</span></div>
        </div>
      </div>

      <!-- Chart Section -->
      <div style="margin-bottom:40px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
          <h3 style="margin:0;font-size:15px;font-weight:700;color:var(--text-main);">${ch('Revenue and net profit by month', 'الإيرادات وصافي الربح الشهري', 'Revenus et profit net par mois')}</h3>
          <div style="display:flex;align-items:center;gap:16px;font-size:12px;font-weight:500;">
            <span style="display:flex;align-items:center;gap:6px;color:#10b981;"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;display:inline-block;"></span> ${ch('revenue', 'الإيرادات', 'revenu')}</span>
            ${showProfit ? `<span style="display:flex;align-items:center;gap:6px;color:#6366f1;"><span style="width:6px;height:6px;border-radius:50%;background:#6366f1;display:inline-block;"></span> ${ch('net profit', 'صافي الربح', 'profit net')}</span>` : ''}
          </div>
        </div>
        ${s.totalRevenue > 0 ? `<div style="height:280px;position:relative;"><canvas id="revenueChart"></canvas></div>` : `<div style="height:280px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:13px;">${ch('Record a sale to see trends here', 'سجل مبيعات لرؤية الاتجاهات هنا', 'Enregistrez une vente pour voir les tendances ici')}</div>`}
      </div>

      <!-- Tables -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:32px;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px;">
            <h3 style="margin:0;font-size:15px;font-weight:700;color:var(--text-main);">${t('recent_sales')}</h3>
            <button class="btn btn-sm" style="background:transparent;border:none;color:#6366f1;font-weight:500;padding:0;" onclick="UI.navigate('sales')">${t('btn_view_all')} →</button>
          </div>
          <div class="table-responsive">
            <table class="table" style="width:100%;border-collapse:collapse;">
              <tbody id="recentSalesTbody"></tbody>
            </table>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:12px;">
            <h3 style="margin:0;font-size:15px;font-weight:700;color:var(--text-main);">${t('recent_products')}</h3>
            <button class="btn btn-sm" style="background:transparent;border:none;color:#6366f1;font-weight:500;padding:0;" onclick="UI.navigate('products')">${t('btn_view_all')} →</button>
          </div>
          <div class="table-responsive">
            <table class="table" style="width:100%;border-collapse:collapse;">
              <tbody id="recentProductsTbody"></tbody>
            </table>
          </div>
        </div>
      </div>

    </div>`;

    // Populate recent sales
    const salesBody = document.getElementById('recentSalesTbody');
    const recentSales = DB.getAllEnrichedSales().slice(0, 7);
    if (!recentSales.length) {
      salesBody.innerHTML = `<tr><td colspan="2" style="padding:28px;text-align:center;color:var(--text-muted);">${t('no_recent_sales')}</td></tr>`;
    } else {
      salesBody.innerHTML = recentSales.map(s => `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:12px 0;">
            <div style="font-weight:500;color:var(--text-main);font-size:13.5px;">${s.productName}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${UI.fmtDate(s.saleDate)}</div>
          </td>
          <td style="padding:12px 0;text-align:right;">
            <div style="font-weight:600;color:#10b981;font-family:monospace;">${UI.fmtCurrency(s.revenue)}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${s.quantity} ${ch('items', 'عنصر', 'articles')}</div>
          </td>
        </tr>`).join('');
    }

    // Populate recent products
    const prodBody = document.getElementById('recentProductsTbody');
    const recentProds = DB.getAllEnrichedProducts().slice(0, 7);
    if (!recentProds.length) {
      prodBody.innerHTML = `<tr><td colspan="2" style="padding:28px;text-align:center;color:var(--text-muted);">${t('no_recent_products')}</td></tr>`;
    } else {
      prodBody.innerHTML = recentProds.map(p => `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:12px 0;">
            <div style="font-weight:500;color:var(--text-main);font-size:13.5px;">${p.name}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;font-family:monospace;">${p.code}</div>
          </td>
          <td style="padding:12px 0;text-align:right;">
            <div style="font-weight:600;color:var(--text-main);font-family:monospace;">${p.currentStock}</div>
            <div style="margin-top:4px;">${stockBadge(p.stockStatus)}</div>
          </td>
        </tr>`).join('');
    }

    // Charts (after DOM is ready)
    requestAnimationFrame(() => initCharts(monthly, top, s));
  }

  function initCharts(monthly, top, s) {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js library is not loaded.');
      document.querySelectorAll('.chart-card .card-body').forEach(el => {
        el.innerHTML = `<div class="empty-state" style="padding:40px 0;"><div class="empty-icon">${UI.icon('bar-chart', '', 32)}</div><h3>Chart Library Loading Error</h3><p>Please check your internet connection or refresh the page.</p></div>`;
      });
      return;
    }

    const showProfit = typeof UI !== 'undefined' && UI.canViewProfit ? UI.canViewProfit() : (typeof Auth !== 'undefined' && Auth.currentUser()?.role === 'admin');

    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94A3B8', font: { family: 'Inter', size: 12 }, boxWidth: 12 } }
      },
      scales: {
        x: { ticks: { color: '#475569' }, grid: { color: 'rgba(255,255,255,0.03)' } },
        y: { ticks: { color: '#475569' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    };

    // Revenue & Profit chart
    try {
      const rc = document.getElementById('revenueChart');
      if (rc) {
        _charts.revenue = new Chart(rc, {
          type: 'bar',
          data: {
            labels: monthly.map(m => m.label),
            datasets: [
              { label: t('th_revenue'), data: monthly.map(m => m.revenue), backgroundColor: '#10b981', hoverBackgroundColor: '#059669', borderRadius: 8 },
              ...(showProfit ? [{ label: t('th_profit'), data: monthly.map(m => m.profit), backgroundColor: '#6366f1', hoverBackgroundColor: '#4f46e5', borderRadius: 8 }] : []),
            ]
          },
          options: { ...chartDefaults }
        });
      }
    } catch (err) { console.error('Error initializing revenueChart:', err); }

    // Expenses chart (Removed to match minimal design)
    // Top products chart (Removed to match minimal design)
    // Revenue vs Expenses (Removed to match minimal design)
  }

  function kpiCard(color, icon, label, value, trend = '', sub = '') {
    return `
    <div class="kpi-card ${color} fade-in">
      <div class="kpi-header">
        <div class="kpi-icon-wrap">${icon}</div>
        ${trend ? `<span class="kpi-trend ${trend.startsWith('+') ? 'up' : trend.startsWith('-') ? 'down' : 'neu'}">${trend}</span>` : ''}
      </div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-label">${label}</div>
      ${sub ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px">${sub}</div>` : ''}
    </div>`;
  }

  function stockBadge(status) {
    const map = { available: 'badge-success', low: 'badge-warning', out: 'badge-danger' };
    const labelKey = 'status_' + status;
    return `<span class="badge ${map[status] || 'badge-muted'}">${t(labelKey) || status}</span>`;
  }

  function isAlertDismissed(key, currentVal) {
    try {
      const dismissed = JSON.parse(localStorage.getItem('sims_dismissed_alerts') || '{}');
      return dismissed[key] !== undefined && Number(dismissed[key]) === Number(currentVal);
    } catch(e) { return false; }
  }

  function dismissAlert(key, currentVal, btnEl) {
    try {
      const dismissed = JSON.parse(localStorage.getItem('sims_dismissed_alerts') || '{}');
      dismissed[key] = Number(currentVal);
      localStorage.setItem('sims_dismissed_alerts', JSON.stringify(dismissed));
    } catch(e) {}
    if (btnEl && btnEl.closest('.alert')) btnEl.closest('.alert').style.display = 'none';
  }

  return { render, dismissAlert };
})();
