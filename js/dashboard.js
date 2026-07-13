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
    const isAr = (typeof I18n !== 'undefined' && I18n.getLang() === 'ar');

    container.innerHTML = `
    <div class="fade-in" style="padding-bottom:32px;">
      <!-- NexaDash Command Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:24px;background:var(--surface);padding:20px 24px;border-radius:16px;border:1px solid var(--border);box-shadow:0 4px 12px rgba(0,0,0,0.02);">
        <div>
          <div style="display:flex;align-items:center;gap:10px;">
            <h2 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;color:var(--text-main);">${isAr ? 'تحليلات المبيعات ولوحة الإيرادات' : 'Sales Analytics & Revenue Dashboard'}</h2>
            <span class="badge" style="background:rgba(16,185,129,0.12);color:#10b981;border:1px solid rgba(16,185,129,0.3);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;">${isAr ? '● بث مباشر للإحصائيات' : '● LIVE TELEMETRY'}</span>
          </div>
          <p style="margin:4px 0 0;font-size:13.5px;color:var(--text-muted);">${isAr ? 'نظرة لحظية على الإيرادات والأرباح وتقييم أصول المخزون وسرعة العمليات' : 'Real-time gross revenue, profit margins, inventory asset valuation, and transaction velocity'}</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;background:var(--bg-main);border:1px solid var(--border);border-radius:10px;padding:3px;gap:2px;">
            <button class="btn btn-sm" style="background:var(--primary);color:#fff;border:none;border-radius:8px;font-size:12px;padding:6px 14px;font-weight:600;">${isAr ? '٣٠ يوماً' : '30 Days'}</button>
            <button class="btn btn-sm btn-ghost" style="font-size:12px;padding:6px 14px;color:var(--text-muted);font-weight:600;" onclick="UI.navigate('sales')">${isAr ? 'كل الأوقات' : 'All Time'}</button>
          </div>
          <button class="btn btn-primary" style="display:flex;align-items:center;gap:6px;border-radius:10px;font-weight:700;box-shadow:0 4px 10px rgba(99,102,241,0.25);" onclick="UI.navigate('sales')">${isAr ? '+ تسجيل بيع' : '+ Record Sale'}</button>
        </div>
      </div>

      <!-- Alerts Section -->
      ${s.outOfStock > 0 && unread.some(p => p.stockStatus === 'out') && !isAlertDismissed('out_of_stock', s.outOfStock) ? `
      <div class="alert alert-danger alert-dismissible mb-16" style="display:flex;align-items:center;justify-content:space-between;border-radius:14px;padding:14px 20px;">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="alert-icon" style="font-size:22px;">🚨</span>
          <div class="alert-content">
            <div class="alert-title" style="font-weight:700;">${s.outOfStock} ${isAr ? 'منتج نفد مخزونه' : 'product(s) are OUT OF STOCK'}</div>
            <div class="alert-body"><a href="#" onclick="UI.navigate('inventory');return false;" style="color:inherit;text-decoration:underline;">${isAr ? 'عرض المخزون ←' : 'View Inventory →'}</a></div>
          </div>
        </div>
        <button onclick="Dashboard.dismissAlert('out_of_stock', ${s.outOfStock}, this)" style="background:none;border:none;cursor:pointer;font-size:18px;color:inherit;opacity:0.6;padding:4px;" title="Dismiss">✕</button>
      </div>` : ''}
      ${s.lowStock > 0 && unread.some(p => p.stockStatus === 'low') && !isAlertDismissed('low_stock', s.lowStock) ? `
      <div class="alert alert-warning alert-dismissible mb-16" style="display:flex;align-items:center;justify-content:space-between;border-radius:14px;padding:14px 20px;">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="alert-icon" style="font-size:22px;">⚠️</span>
          <div class="alert-content">
            <div class="alert-title" style="font-weight:700;">${s.lowStock} ${isAr ? 'منتج منخفض المخزون' : 'product(s) are running LOW'}</div>
            <div class="alert-body"><a href="#" onclick="UI.navigate('inventory');return false;" style="color:inherit;text-decoration:underline;">${isAr ? 'عرض المخزون ←' : 'View Inventory →'}</a></div>
          </div>
        </div>
        <button onclick="Dashboard.dismissAlert('low_stock', ${s.lowStock}, this)" style="background:none;border:none;cursor:pointer;font-size:18px;color:inherit;opacity:0.6;padding:4px;" title="Dismiss">✕</button>
      </div>` : ''}

      <!-- Top Row: 4 Signature Executive Metric Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px;margin-bottom:20px;">
        <!-- Card 1: Gross Revenue -->
        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;">💰</div>
              <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">${isAr ? 'إجمالي الإيرادات' : 'Gross Revenue'}</div>
            </div>
            <span class="badge" style="background:#10b981;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">+18.4% ↗</span>
          </div>
          <div style="font-size:28px;font-weight:800;color:var(--text-main);letter-spacing:-0.5px;">${UI.fmtCurrency(s.totalRevenue)}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">${isAr ? 'الإيرادات التراكمية المحصلة من جميع المبيعات' : 'Cumulative revenue collected across sales'}</div>
          <div style="margin-top:14px;width:100%;background:var(--bg-main);height:6px;border-radius:4px;overflow:hidden;">
            <div style="width:78%;background:#10b981;height:100%;border-radius:4px;"></div>
          </div>
        </div>

        <!-- Card 2: Net Profit Margin -->
        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;">📈</div>
              <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">${isAr ? 'صافي الربح' : 'Net Profit'}</div>
            </div>
            <span class="badge" style="background:#6366f1;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">${showProfit ? (isAr ? profitMargin + '% هامش' : profitMargin + '% Margin') : (isAr ? 'سري' : 'Confidential')}</span>
          </div>
          <div style="font-size:28px;font-weight:800;color:var(--text-main);letter-spacing:-0.5px;">${showProfit ? UI.fmtCurrency(s.totalProfit) : '••••••••'}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">${isAr ? 'الأرباح بعد خصم تكاليف شراء المنتجات' : 'Earnings after product purchase investment'}</div>
          <div style="margin-top:14px;width:100%;background:var(--bg-main);height:6px;border-radius:4px;overflow:hidden;">
            <div style="width:${Math.max(10, Math.min(100, profitMargin * 2))}%;background:#6366f1;height:100%;border-radius:4px;"></div>
          </div>
        </div>

        <!-- Card 3: Monthly Sales Volume -->
        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(14,165,233,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;">📅</div>
              <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">${isAr ? 'المبيعات الشهرية' : 'Monthly Sales'}</div>
            </div>
            <span class="badge" style="background:#0ea5e9;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">${isAr ? 'اليوم: ' : 'Today: '}${UI.fmtCurrency(s.salesToday)}</span>
          </div>
          <div style="font-size:28px;font-weight:800;color:var(--text-main);letter-spacing:-0.5px;">${UI.fmtCurrency(s.salesThisMonth)}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">${isAr ? 'حجم مبيعات فترة الـ ٣٠ يوماً الحالية' : 'Current 30-day billing period sales volume'}</div>
          <div style="margin-top:14px;width:100%;background:var(--bg-main);height:6px;border-radius:4px;overflow:hidden;">
            <div style="width:64%;background:#0ea5e9;height:100%;border-radius:4px;"></div>
          </div>
        </div>

        <!-- Card 4: Outstanding Credit Receivables -->
        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px;position:relative;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;font-size:20px;">💳</div>
              <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">${isAr ? 'مستحقات الآجل' : 'Credit Receivables'}</div>
            </div>
            <span class="badge" style="background:#f59e0b;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">${creditSales.length} ${isAr ? 'غير مدفوع' : 'Unpaid'}</span>
          </div>
          <div style="font-size:28px;font-weight:800;color:var(--text-main);letter-spacing:-0.5px;">${UI.fmtCurrency(outstanding)}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px;">${isAr ? 'فواتير العملاء المعلقة للتحصيل' : 'Customer invoices pending debt collection'}</div>
          <div style="margin-top:14px;width:100%;background:var(--bg-main);height:6px;border-radius:4px;overflow:hidden;">
            <div style="width:${Math.min(100, creditSales.length * 20)}%;background:#f59e0b;height:100%;border-radius:4px;"></div>
          </div>
        </div>
      </div>

      <!-- Secondary Operations & Asset Summary Strip -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin-bottom:24px;">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(16,185,129,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;">🏪</div>
          <div>
            <div style="font-size:11.5px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">${isAr ? 'تقييم المخزون' : 'Inventory Valuation'}</div>
            <div style="font-size:17px;font-weight:800;color:var(--text-main);">${UI.fmtCurrency(s.inventoryValue)}</div>
          </div>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(239,68,68,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;">💸</div>
          <div>
            <div style="font-size:11.5px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">${isAr ? 'إجمالي المصاريف' : 'Total Expenses'}</div>
            <div style="font-size:17px;font-weight:800;color:var(--text-main);">${UI.fmtCurrency(s.totalExpenses)}</div>
          </div>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(99,102,241,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;">📦</div>
          <div>
            <div style="font-size:11.5px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">${isAr ? 'أصناف الكتالوج' : 'Catalog Skus'}</div>
            <div style="font-size:17px;font-weight:800;color:var(--text-main);">${s.totalProducts} <span style="font-size:12px;color:var(--text-muted);font-weight:500;">(${s.totalCategories} ${isAr ? 'فئات' : 'Categories'})</span></div>
          </div>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:14px;">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center;font-size:18px;">⚠️</div>
          <div>
            <div style="font-size:11.5px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">${isAr ? 'تنبيه صحة المخزون' : 'Stock Health Alert'}</div>
            <div style="font-size:17px;font-weight:800;color:${s.outOfStock > 0 ? '#ef4444' : s.lowStock > 0 ? '#f59e0b' : '#10b981'};">${s.lowStock} ${isAr ? 'منخفض' : 'Low'} · ${s.outOfStock} ${isAr ? 'نافد' : 'Out'}</div>
          </div>
        </div>
      </div>

      <!-- Row 2: Analytics Grid -->
      <div style="display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:18px;margin-bottom:24px;">
        <!-- Left: Monthly Revenue & Net Profit Analytics -->
        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text-main);">${isAr ? 'تحليلات الإيرادات وصافي الربح الشهري' : 'Monthly Revenue & Net Profit Analytics'}</h3>
              <p style="margin:3px 0 0;font-size:12.5px;color:var(--text-muted);">${isAr ? 'مقارنة الأداء الشهري عبر دورات العمليات النشطة' : 'Comparative monthly performance across active billing cycles'}</p>
            </div>
            <div style="display:flex;align-items:center;gap:14px;font-size:12px;font-weight:600;">
              <span style="display:flex;align-items:center;gap:6px;color:#10b981;"><span style="width:10px;height:10px;border-radius:50%;background:#10b981;display:inline-block;"></span> ${isAr ? 'إجمالي الإيرادات' : 'Gross Revenue'}</span>
              ${showProfit ? `<span style="display:flex;align-items:center;gap:6px;color:#6366f1;"><span style="width:10px;height:10px;border-radius:50%;background:#6366f1;display:inline-block;"></span> ${isAr ? 'صافي الربح' : 'Net Profit'}</span>` : ''}
            </div>
          </div>
          <div style="height:310px;position:relative;"><canvas id="revenueChart"></canvas></div>
        </div>

        <!-- Right: Sales Share by Top Selling Products -->
        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:0 4px 14px rgba(0,0,0,0.03);display:flex;flex-direction:column;">
          <div style="margin-bottom:18px;">
            <h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text-main);">${isAr ? 'توزيع المبيعات وأفضل الأصناف' : 'Sales Distribution & Top SKUs'}</h3>
            <p style="margin:3px 0 0;font-size:12.5px;color:var(--text-muted);">${isAr ? 'حصة المبيعات حسب الأصناف الأكثر مبيعاً' : 'Volume share by top selling product inventory'}</p>
          </div>
          <div style="height:230px;position:relative;margin-bottom:14px;"><canvas id="topProductsChart"></canvas></div>
        </div>
      </div>

      <!-- Row 3: Financial Flow Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px;margin-bottom:24px;">
        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text-main);">${isAr ? 'اتجاه الإيرادات مقابل المصاريف' : 'Revenue vs. Expense Trend'}</h3>
              <p style="margin:3px 0 0;font-size:12.5px;color:var(--text-muted);">${isAr ? 'صافي التدفقات النقدية مقابل المصاريف التشغيلية' : 'Net cash inflow vs operational business expenditure'}</p>
            </div>
          </div>
          <div style="height:260px;position:relative;"><canvas id="revExpChart"></canvas></div>
        </div>

        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text-main);">${isAr ? 'المصاريف التشغيلية الشهرية' : 'Monthly Operating Expenses'}</h3>
              <p style="margin:3px 0 0;font-size:12.5px;color:var(--text-muted);">${isAr ? 'المصاريف العامة وتكاليف الاستيراد المسجلة' : 'Recorded overhead and import expenses'}</p>
            </div>
          </div>
          <div style="height:260px;position:relative;"><canvas id="expenseChart"></canvas></div>
        </div>
      </div>

      <!-- Row 4: Recent Transactions & Inventory Activity -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px;">
        <!-- Recent Sales Table -->
        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text-main);">${t('recent_sales')}</h3>
              <p style="margin:3px 0 0;font-size:12.5px;color:var(--text-muted);">${isAr ? 'أحدث المعاملات المكتملة مع العملاء' : 'Latest completed customer transactions'}</p>
            </div>
            <button class="btn btn-sm btn-outline" style="border-radius:8px;font-weight:600;" onclick="UI.navigate('sales')">${t('btn_view_all')} →</button>
          </div>
          <div class="table-responsive">
            <table class="table" style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="text-align:left;border-bottom:2px solid var(--border);color:var(--text-muted);font-size:12px;text-transform:uppercase;">
                  <th style="padding:12px 10px;">${isAr ? 'الصنف' : 'Product Item'}</th>
                  <th style="padding:12px 10px;">${isAr ? 'الكمية' : 'Qty'}</th>
                  <th style="padding:12px 10px;">${isAr ? 'الإيرادات' : 'Revenue'}</th>
                  ${showProfit ? `<th style="padding:12px 10px;">${isAr ? 'الربح' : 'Profit'}</th>` : ''}
                  <th style="padding:12px 10px;">${isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody id="recentSalesTbody"></tbody>
            </table>
          </div>
        </div>

        <!-- Recent Products Table -->
        <div class="card" style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:800;color:var(--text-main);">${t('recent_products')}</h3>
              <p style="margin:3px 0 0;font-size:12.5px;color:var(--text-muted);">${isAr ? 'حالة المخزون للأصناف المضافة حديثاً' : 'Stock status across newly updated inventory'}</p>
            </div>
            <button class="btn btn-sm btn-outline" style="border-radius:8px;font-weight:600;" onclick="UI.navigate('products')">${t('btn_view_all')} →</button>
          </div>
          <div class="table-responsive">
            <table class="table" style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="text-align:left;border-bottom:2px solid var(--border);color:var(--text-muted);font-size:12px;text-transform:uppercase;">
                  <th style="padding:12px 10px;">${isAr ? 'الكود' : 'Code'}</th>
                  <th style="padding:12px 10px;">${isAr ? 'اسم المنتج' : 'Product Name'}</th>
                  <th style="padding:12px 10px;">${isAr ? 'المخزون' : 'Stock'}</th>
                  <th style="padding:12px 10px;">${isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
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
      salesBody.innerHTML = `<tr><td colspan="5" style="padding:28px;text-align:center;color:var(--text-muted);">${t('no_recent_sales')}</td></tr>`;
    } else {
      salesBody.innerHTML = recentSales.map(s => `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:14px 10px;">
            <div style="font-weight:600;color:var(--text-main);font-size:13.5px;">${s.productName}</div>
          </td>
          <td style="padding:14px 10px;font-weight:600;">${s.quantity}</td>
          <td style="padding:14px 10px;font-weight:700;color:#10b981;">${UI.fmtCurrency(s.revenue)}</td>
          ${ showProfit ? `<td style="padding:14px 10px;font-weight:700;color:${s.profit >= 0 ? '#6366f1' : '#ef4444'};">${UI.fmtCurrency(s.profit)}</td>` : '' }
          <td style="padding:14px 10px;color:var(--text-muted);font-size:12.5px;">${UI.fmtDate(s.saleDate)}</td>
        </tr>`).join('');
    }

    // Populate recent products
    const prodBody = document.getElementById('recentProductsTbody');
    const recentProds = DB.getAllEnrichedProducts().slice(0, 7);
    if (!recentProds.length) {
      prodBody.innerHTML = `<tr><td colspan="4" style="padding:28px;text-align:center;color:var(--text-muted);">${t('no_recent_products')}</td></tr>`;
    } else {
      prodBody.innerHTML = recentProds.map(p => `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:14px 10px;color:var(--text-muted);font-size:12px;font-family:monospace;">${p.code}</td>
          <td style="padding:14px 10px;font-weight:600;color:var(--text-main);">${p.name}</td>
          <td style="padding:14px 10px;font-weight:700;">${p.currentStock}</td>
          <td style="padding:14px 10px;">${stockBadge(p.stockStatus)}</td>
        </tr>`).join('');
    }

    // Charts (after DOM is ready)
    requestAnimationFrame(() => initCharts(monthly, top, s));
  }

  function initCharts(monthly, top, s) {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js library is not loaded.');
      document.querySelectorAll('.chart-card .card-body').forEach(el => {
        el.innerHTML = `<div class="empty-state" style="padding:40px 0;"><div class="empty-icon">📈</div><h3>Chart Library Loading Error</h3><p>Please check your internet connection or refresh the page.</p></div>`;
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

    // Expenses chart
    try {
      const ec = document.getElementById('expenseChart');
      if (ec) {
        _charts.expense = new Chart(ec, {
          type: 'line',
          data: {
            labels: monthly.map(m => m.label),
            datasets: [{
              label: I18n.getLang() === 'ar' ? 'مصاريف العمل' : 'Business Expenses',
              data: monthly.map(m => m.expenses),
              borderColor: '#F43F5E',
              backgroundColor: 'rgba(244, 63, 94, 0.16)',
              fill: true, tension: 0.45,
              pointBackgroundColor: '#F43F5E', pointRadius: 4,
            }]
          },
          options: { ...chartDefaults }
        });
      }
    } catch (err) { console.error('Error initializing expenseChart:', err); }

    // Top products chart
    try {
      const tpc = document.getElementById('topProductsChart');
      if (tpc) {
        const colors = ['#8B5CF6', '#10B981', '#0EA5E9', '#F59E0B', '#F43F5E'];
        const displayList = (top && top.length > 0) ? top : DB.getAll('products').slice(0, 5);
        if (displayList.length === 0) {
          tpc.parentElement.innerHTML = `<div class="empty-state" style="padding:30px 0;"><div class="empty-icon">🏆</div><p style="color:#94A3B8;font-size:0.85rem;">${I18n.getLang() === 'ar' ? 'لا توجد منتجات بعد' : 'No products yet'}</p></div>`;
        } else {
          const labels = displayList.map(p => (p.name || 'Product').slice(0, 20));
          const hasSales = displayList.some(p => (p.totalQty || 0) > 0);
          const dataVals = hasSales ? displayList.map(p => p.totalQty || 0) : displayList.map(p => Math.max(1, p.currentStock || 1));
          _charts.topProducts = new Chart(tpc, {
            type: 'doughnut',
            data: {
              labels: labels,
              datasets: [{ data: dataVals, backgroundColor: colors, borderWidth: 2, borderColor: '#0B0F19', hoverOffset: 6 }]
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 }, boxWidth: 10 } }
              },
              cutout: '70%',
            }
          });
        }
      }
    } catch (err) { console.error('Error initializing topProductsChart:', err); }

    // Revenue vs Expenses
    try {
      const rvc = document.getElementById('revExpChart');
      if (rvc) {
        _charts.revExp = new Chart(rvc, {
          type: 'line',
          data: {
            labels: monthly.map(m => m.label),
            datasets: [
              {
                label: t('th_revenue'), data: monthly.map(m => m.revenue),
                borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.14)',
                fill: true, tension: 0.45, pointBackgroundColor: '#10B981', pointRadius: 4,
              },
              {
                label: t('th_expenses'), data: monthly.map(m => m.expenses),
                borderColor: '#F43F5E', backgroundColor: 'rgba(244, 63, 94, 0.14)',
                fill: true, tension: 0.45, pointBackgroundColor: '#F43F5E', pointRadius: 4,
              }
            ]
          },
          options: { ...chartDefaults }
        });
      }
    } catch (err) { console.error('Error initializing revExpChart:', err); }
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
