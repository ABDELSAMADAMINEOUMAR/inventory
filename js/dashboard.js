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
    const allSalesRaw = DB.getAll('sales');
    const creditSales = allSalesRaw.filter(s => s.paymentStatus === 'credit');
    const outstanding = creditSales.reduce((a, s) => a + Math.max(0, (s.revenue || 0) - (s.amountPaid || 0)), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = creditSales.filter(s => s.dueDate && s.dueDate < todayStr).length;
    const top = DB.getTopProducts(5);

    container.innerHTML = `
    <div class="fade-in">
      <!-- KPI Cards -->
      <div class="kpi-grid stagger-children" id="kpiGrid">
        ${kpiCard('purple', '📦', t('kpi_products'), s.totalProducts, '', t('kpi_products'))}
        ${kpiCard('blue', '🏷️', t('kpi_categories'), s.totalCategories, '', t('kpi_categories'))}
        ${kpiCard('green', '💰', t('kpi_revenue'), UI.fmtCurrency(s.totalRevenue), '', t('kpi_revenue'))}
        ${kpiCard('indigo', '📈', t('kpi_profit'), UI.fmtCurrency(s.totalProfit), '', t('kpi_profit'))}
        ${kpiCard('orange', '💼', t('kpi_investment'), UI.fmtCurrency(s.totalInvestment), '', t('kpi_investment'))}
        ${kpiCard('pink', '🏪', t('kpi_inv_value'), UI.fmtCurrency(s.inventoryValue), '', t('kpi_inv_value'))}
        ${kpiCard('orange', '💸', t('kpi_expenses'), UI.fmtCurrency(s.totalExpenses), '', t('kpi_expenses'))}
        ${kpiCard('red', '⚠️', t('kpi_low_stock'), s.lowStock, '', t('kpi_low_stock'))}
        ${kpiCard('red', '🚨', t('kpi_out_stock'), s.outOfStock, '', t('kpi_out_stock'))}
        ${kpiCard('green', '🛒', t('kpi_sales_today'), UI.fmtCurrency(s.salesToday), '', t('kpi_sales_today'))}
        ${kpiCard('indigo', '📅', t('kpi_sales_month'), UI.fmtCurrency(s.salesThisMonth), '', t('kpi_sales_month'))}
        ${kpiCard('red', '💳', t('kpi_credit'), UI.fmtCurrency(outstanding), '', creditSales.length + ' ' + (I18n.getLang() === 'ar' ? 'مبيعات غير مدفوعة' : 'unpaid sales'))}
      </div>

      <!-- Alerts -->
      ${s.outOfStock > 0 ? `
      <div class="alert alert-danger mb-16">
        <span class="alert-icon">🚨</span>
        <div class="alert-content">
          <div class="alert-title">${s.outOfStock} ${I18n.getLang() === 'ar' ? 'منتج نفد مخزونه' : 'product(s) are OUT OF STOCK'}</div>
          <div class="alert-body"><a href="#" onclick="UI.navigate('inventory');return false;" style="color:inherit;text-decoration:underline;">${I18n.getLang() === 'ar' ? 'عرض المخزون ←' : 'View Inventory →'}</a></div>
        </div>
      </div>` : ''}
      ${s.lowStock > 0 ? `
      <div class="alert alert-warning mb-16">
        <span class="alert-icon">⚠️</span>
        <div class="alert-content">
          <div class="alert-title">${s.lowStock} ${I18n.getLang() === 'ar' ? 'منتج منخفض المخزون' : 'product(s) are running LOW'}</div>
          <div class="alert-body"><a href="#" onclick="UI.navigate('inventory');return false;" style="color:inherit;text-decoration:underline;">${I18n.getLang() === 'ar' ? 'عرض المخزون ←' : 'View Inventory →'}</a></div>
        </div>
      </div>` : ''}
      ${outstanding > 0 ? `
      <div class="alert alert-info mb-16" style="background:rgba(245,158,11,0.06);border-color:rgba(245,158,11,0.2);color:var(--warning);">
        <span class="alert-icon">💳</span>
        <div class="alert-content">
          <div class="alert-title">${creditSales.length} ${I18n.getLang() === 'ar' ? 'مبيعات آجلة غير مدفوعة' : 'unpaid credit sale(s)'} — ${UI.fmtCurrency(outstanding)} ${I18n.getLang() === 'ar' ? 'ديون معلقة' : 'outstanding'}</div>
          <div class="alert-body"><a href="#" onclick="UI.navigate('sales');Sales.filterPayment('credit');return false;" style="color:inherit;text-decoration:underline;">${I18n.getLang() === 'ar' ? 'عرض الديون ←' : 'View Credits →'}</a></div>
        </div>
      </div>` : ''}

      <!-- Charts -->
      <div class="charts-grid">
        <div class="card chart-card">
          <div class="card-header">
            <div class="card-title">${t('chart_monthly_rev')}</div>
          </div>
          <div class="card-body"><canvas id="revenueChart"></canvas></div>
        </div>
        <div class="card chart-card">
          <div class="card-header">
            <div class="card-title">${t('chart_monthly_exp')}</div>
          </div>
          <div class="card-body"><canvas id="expenseChart"></canvas></div>
        </div>
        <div class="card chart-card">
          <div class="card-header">
            <div class="card-title">${t('chart_top_selling')}</div>
          </div>
          <div class="card-body"><canvas id="topProductsChart"></canvas></div>
        </div>
        <div class="card chart-card">
          <div class="card-header">
            <div class="card-title">${t('chart_rev_vs_exp')}</div>
          </div>
          <div class="card-body"><canvas id="revExpChart"></canvas></div>
        </div>
      </div>

      <!-- Recent Data Tables -->
      <div class="recent-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">${t('recent_sales')}</div>
            <button class="btn btn-sm btn-outline-primary" onclick="UI.navigate('sales')">${t('btn_view_all')}</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>${t('th_product')}</th><th>${t('th_qty')}</th><th>${t('th_revenue')}</th><th>${t('th_profit')}</th><th>${t('th_date')}</th></tr></thead>
              <tbody id="recentSalesTbody"></tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">${t('recent_products')}</div>
            <button class="btn btn-sm btn-outline-primary" onclick="UI.navigate('products')">${t('btn_view_all')}</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>${t('th_code')}</th><th>${t('th_product')}</th><th>${t('th_stock')}</th><th>${t('th_status')}</th></tr></thead>
              <tbody id="recentProductsTbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;

    // Populate recent sales
    const salesBody = document.getElementById('recentSalesTbody');
    const recentSales = DB.getAllEnrichedSales().slice(0, 8);
    if (!recentSales.length) {
      salesBody.innerHTML = `<tr><td colspan="5" class="text-center td-muted" style="padding:24px">${t('no_recent_sales')}</td></tr>`;
    } else {
      salesBody.innerHTML = recentSales.map(s => `
        <tr>
          <td><div style="font-weight:500;font-size:0.85rem">${s.productName}</div></td>
          <td>${s.quantity}</td>
          <td class="text-accent fw-600">${UI.fmtCurrency(s.revenue)}</td>
          <td class="${s.profit >= 0 ? 'text-success' : 'text-danger'} fw-600">${UI.fmtCurrency(s.profit)}</td>
          <td class="td-muted">${UI.fmtDate(s.saleDate)}</td>
        </tr>`).join('');
    }

    // Populate recent products
    const prodBody = document.getElementById('recentProductsTbody');
    const recentProds = DB.getAllEnrichedProducts().slice(0, 8);
    if (!recentProds.length) {
      prodBody.innerHTML = `<tr><td colspan="4" class="text-center td-muted" style="padding:24px">${t('no_recent_products')}</td></tr>`;
    } else {
      prodBody.innerHTML = recentProds.map(p => `
        <tr>
          <td class="td-muted" style="font-size:0.8rem">${p.code}</td>
          <td style="font-weight:500">${p.name}</td>
          <td>${p.currentStock}</td>
          <td>${stockBadge(p.stockStatus)}</td>
        </tr>`).join('');
    }

    // Charts (after DOM is ready)
    requestAnimationFrame(() => initCharts(monthly, top, s));
  }

  function initCharts(monthly, top, s) {
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
    const rc = document.getElementById('revenueChart');
    if (rc) {
      _charts.revenue = new Chart(rc, {
        type: 'bar',
        data: {
          labels: monthly.map(m => m.label),
          datasets: [
            { label: t('th_revenue'), data: monthly.map(m => m.revenue), backgroundColor: 'rgba(6,214,160,0.7)', borderRadius: 6 },
            { label: t('th_profit'), data: monthly.map(m => m.profit), backgroundColor: 'rgba(124,58,237,0.7)', borderRadius: 6 },
          ]
        },
        options: { ...chartDefaults }
      });
    }

    // Expenses chart
    const ec = document.getElementById('expenseChart');
    if (ec) {
      _charts.expense = new Chart(ec, {
        type: 'line',
        data: {
          labels: monthly.map(m => m.label),
          datasets: [{
            label: I18n.getLang() === 'ar' ? 'مصاريف العمل' : 'Business Expenses',
            data: monthly.map(m => m.expenses),
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245,158,11,0.1)',
            fill: true, tension: 0.4,
            pointBackgroundColor: '#F59E0B', pointRadius: 4,
          }]
        },
        options: { ...chartDefaults }
      });
    }

    // Top products chart
    const tpc = document.getElementById('topProductsChart');
    if (tpc) {
      const colors = ['rgba(124,58,237,0.8)', 'rgba(6,214,160,0.8)', 'rgba(59,130,246,0.8)', 'rgba(245,158,11,0.8)', 'rgba(236,72,153,0.8)'];
      _charts.topProducts = new Chart(tpc, {
        type: 'doughnut',
        data: {
          labels: top.map(p => p.name.slice(0, 20)),
          datasets: [{ data: top.map(p => p.totalQty), backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 }, boxWidth: 10 } }
          },
          cutout: '65%',
        }
      });
    }

    // Revenue vs Expenses
    const rvc = document.getElementById('revExpChart');
    if (rvc) {
      _charts.revExp = new Chart(rvc, {
        type: 'line',
        data: {
          labels: monthly.map(m => m.label),
          datasets: [
            {
              label: t('th_revenue'), data: monthly.map(m => m.revenue),
              borderColor: '#06D6A0', backgroundColor: 'rgba(6,214,160,0.08)',
              fill: true, tension: 0.4, pointBackgroundColor: '#06D6A0', pointRadius: 4,
            },
            {
              label: t('th_expenses'), data: monthly.map(m => m.expenses),
              borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)',
              fill: true, tension: 0.4, pointBackgroundColor: '#EF4444', pointRadius: 4,
            }
          ]
        },
        options: { ...chartDefaults }
      });
    }
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

  return { render };
})();
