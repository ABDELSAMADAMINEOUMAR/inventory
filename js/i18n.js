/* =============================================
   I18N.JS — Internationalization Module
   Languages: English (en) | Arabic (ar)
   Smart Import & Sales Management System
   ============================================= */

const I18n = (() => {
  const LANG_KEY = 'sims_lang';

  // ── Translation Dictionary ────────────────
  const translations = {
    en: {
      /* Navigation */
      nav_main: 'Main', nav_catalogue: 'Catalogue', nav_operations: 'Operations',
      nav_analytics: 'Analytics', nav_account: 'Account',
      nav_dashboard: 'Dashboard', nav_products: 'Products',
      nav_categories: 'Categories', nav_expenses: 'Expenses',
      nav_sales: 'Sales', nav_inventory: 'Inventory',
      nav_reports: 'Reports', nav_settings: 'Settings',

      /* Login Page */
      login_welcome: 'Welcome Back 👋', login_subtitle: 'Sign in to manage your business',
      login_email: 'Email Address', login_password: 'Password',
      login_btn: 'Sign In to Dashboard', login_signing_in: 'Signing in...',
      login_invalid: 'Invalid credentials', login_hint: 'Default',
      login_feat_1: 'Products & Inventory', login_feat_2: 'Sales Tracking',
      login_feat_3: 'Auto Profit Calc', login_feat_4: 'Reports & Export',

      /* Page Titles */
      page_dashboard: 'Dashboard', page_products: 'Products',
      page_categories: 'Categories', page_expenses: 'Expenses',
      page_sales: 'Sales', page_inventory: 'Inventory',
      page_reports: 'Reports', page_settings: 'Settings',
      page_dashboard_sub: 'Business overview & analytics',
      page_products_sub: 'Manage your imported products',
      page_categories_sub: 'Organise product categories',
      page_expenses_sub: 'Import & business expenses',
      page_sales_sub: 'Record and track your sales',
      page_inventory_sub: 'Stock levels & alerts',
      page_reports_sub: 'Financial reports & exports',
      page_settings_sub: 'Profile & system settings',

      /* Dashboard Extra */
      chart_monthly_rev: '📊 Monthly Revenue & Profit',
      chart_monthly_exp: '💸 Monthly Expenses',
      chart_top_selling: '🏆 Top Selling Products',
      chart_rev_vs_exp: '📈 Revenue vs Expenses',
      recent_sales: '🛒 Recent Sales',
      recent_products: '📦 Recent Products',
      no_recent_sales: 'No sales yet',
      no_recent_products: 'No products yet',

      /* Dashboard KPI */
      kpi_products: 'Total Products', kpi_categories: 'Categories',
      kpi_revenue: 'Total Revenue', kpi_profit: 'Total Profit',
      kpi_investment: 'Total Investment', kpi_inv_value: 'Inventory Value',
      kpi_expenses: 'Total Expenses', kpi_low_stock: 'Low Stock',
      kpi_out_stock: 'Out of Stock', kpi_sales_today: 'Sales Today',
      kpi_sales_month: 'Sales This Month', kpi_credit: 'Outstanding Credit',

      /* Common Buttons */
      btn_add: 'Add', btn_save: 'Save', btn_update: 'Update',
      btn_cancel: 'Cancel', btn_delete: 'Delete', btn_edit: 'Edit',
      btn_view: 'View', btn_close: 'Close', btn_print: 'Print',
      btn_export_pdf: 'Export PDF', btn_export_excel: 'Export Excel',
      btn_restock: 'Restock', btn_mark_paid: 'Mark as Paid',
      btn_add_product: 'Add Product', btn_add_category: 'Add Category',
      btn_add_expense: 'Add Expense', btn_record_sale: 'Record Sale',
      btn_view_all: 'View All',

      /* Status */
      status_available: '✓ In Stock', status_low: '⚠ Low Stock',
      status_out: '✕ Out of Stock', status_paid: '✓ Paid',
      status_credit: '💳 Credit', status_overdue: '⚠ Overdue',

      /* Product Form */
      lbl_code: 'Product Code', lbl_name: 'Product Name',
      lbl_category: 'Category', lbl_supplier: 'Supplier Name',
      lbl_price: 'Purchase Price', lbl_qty: 'Quantity Purchased',
      lbl_currency: 'Currency', lbl_rate: 'Exchange Rate',
      lbl_date: 'Purchase Date', lbl_desc: 'Description',
      lbl_image: 'Product Image', lbl_import_exp: 'Import Expenses',
      lbl_cpu_preview: 'Estimated Cost Per Unit',
      ph_code: 'Auto-generated', ph_name: 'e.g. Samsung TV 43"',
      ph_supplier: 'e.g. Cairo Electronics Co.',

      /* Sale Form */
      lbl_product: 'Product', lbl_qty_sold: 'Quantity Sold',
      lbl_sell_price: 'Selling Price (per unit)', lbl_sale_date: 'Sale Date',
      lbl_customer: 'Customer Name', lbl_phone: 'Customer Phone',
      lbl_payment: 'Payment Status', lbl_due_date: 'Payment Due Date',
      lbl_amount_paid: 'Amount Already Paid',
      lbl_note: 'Note', pay_now: '✓ Paid Now', pay_later: '💳 Credit (Pay Later)',
      pay_now_sub: 'Customer paid immediately', pay_later_sub: 'Customer will pay later',

      /* Table Headers */
      th_image: 'Image', th_code: 'Code', th_product: 'Product',
      th_category: 'Category', th_supplier: 'Supplier',
      th_bought: 'Qty Bought', th_stock: 'Stock', th_cpu: 'Cost/Unit',
      th_status: 'Status', th_actions: 'Actions', th_qty: 'Qty',
      th_unit_price: 'Unit Price', th_revenue: 'Revenue',
      th_cost: 'Cost', th_profit: 'Profit', th_margin: 'Margin',
      th_customer: 'Customer', th_date: 'Date',
      th_payment: 'Payment', th_due_date: 'Due Date',
      th_sold: 'Sold', th_in_stock: 'In Stock', th_stock_level: 'Stock Level',
      th_stock_value: 'Stock Value',

      /* Reports */
      rep_daily: '📅 Daily', rep_weekly: '📆 Weekly',
      rep_monthly: '📊 Monthly', rep_annual: '📈 Annual',

      /* Settings */
      set_profile: '👤 Profile Information', set_password: '🔒 Change Password',
      set_system: '📊 System Summary', set_danger: 'Danger Zone',
      set_reset: 'Reset All Data',

      /* Misc */
      administrator: 'Administrator',
      low_threshold: '5',
      search_ph: 'Search products, suppliers…',
      no_data: 'No data found',
      confirm_delete: 'Are you sure?', cannot_undo: 'This action cannot be undone.',
      profit_calc: '📊 Profit Calculator (Live Preview)',
      available_stock: 'Available stock',
      import_expenses: '💸 Import Expenses',

      /* Added Keys */
      brand_sub: 'Import & Sales',
      nav_suppliers: 'Suppliers',
      page_suppliers: 'Suppliers', page_suppliers_sub: 'Manage your product suppliers',
      login_pwd_ph: 'Enter your password', login_email_ph: 'admin@business.com',
      supp_registered: 'suppliers registered', btn_add_supp: 'Add Supplier',
      th_supp: 'Supplier', th_country: 'Country', th_phone: 'Phone', th_email: 'Email', th_notes: 'Notes',
      ph_supp_search: 'Search suppliers…', no_supp: 'No suppliers found', add_first_supp: 'Add your first supplier.',
      lbl_supp_name: 'Supplier Name', lbl_address: 'Address', ph_supp_addr: 'Street, City', ph_supp_notes: 'Additional notes about this supplier…',
      sel_country: 'Select country', edit_supp: 'Edit Supplier', del_supp_title: 'Delete Supplier?', supp_del_msg: 'will be permanently deleted.',
      products_count: 'products', product_count: 'product',
      ph_date_from: 'From date', ph_date_to: 'To date',
      th_revenue: 'Revenue', th_profit: 'Profit', th_expenses: 'Expenses',
    },

    ar: {
      /* Navigation */
      nav_main: 'الرئيسية', nav_catalogue: 'الكتالوج', nav_operations: 'العمليات',
      nav_analytics: 'التحليلات', nav_account: 'الحساب',
      nav_dashboard: 'لوحة التحكم', nav_products: 'المنتجات',
      nav_categories: 'الفئات', nav_expenses: 'المصاريف',
      nav_sales: 'المبيعات', nav_inventory: 'المخزون',
      nav_reports: 'التقارير', nav_settings: 'الإعدادات',

      /* Login Page */
      login_welcome: 'مرحباً بعودتك 👋', login_subtitle: 'سجل الدخول لإدارة عملك',
      login_email: 'البريد الإلكتروني', login_password: 'كلمة المرور',
      login_btn: 'تسجيل الدخول إلى لوحة التحكم', login_signing_in: 'جاري تسجيل الدخول...',
      login_invalid: 'بيانات الاعتماد غير صالحة', login_hint: 'الافتراضي',
      login_feat_1: 'المنتجات والمخزون', login_feat_2: 'تتبع المبيعات',
      login_feat_3: 'حاسبة الأرباح التلقائية', login_feat_4: 'التقارير والتصدير',

      /* Page Titles */
      page_dashboard: 'لوحة التحكم', page_products: 'المنتجات',
      page_categories: 'الفئات', page_expenses: 'المصاريف',
      page_sales: 'المبيعات', page_inventory: 'المخزون',
      page_reports: 'التقارير', page_settings: 'الإعدادات',
      page_dashboard_sub: 'نظرة عامة على العمل والتحليلات',
      page_products_sub: 'إدارة المنتجات المستوردة الخاصة بك',
      page_categories_sub: 'تنظيم فئات المنتجات',
      page_expenses_sub: 'مصاريف الاستيراد والعمل التجاري',
      page_sales_sub: 'سجل وتتبع المبيعات الخاصة بك',
      page_inventory_sub: 'مستويات المخزون والتنبيهات',
      page_reports_sub: 'التقارير المالية والتصدير',
      page_settings_sub: 'ملف التعريف وإعدادات النظام',

      /* Dashboard Extra */
      chart_monthly_rev: '📊 الإيرادات والأرباح الشهرية',
      chart_monthly_exp: '💸 المصاريف الشهرية',
      chart_top_selling: '🏆 المنتجات الأكثر مبيعاً',
      chart_rev_vs_exp: '📈 الإيرادات مقابل المصاريف',
      recent_sales: '🛒 المبيعات الأخيرة',
      recent_products: '📦 المنتجات الأخيرة',
      no_recent_sales: 'لا توجد مبيعات بعد',
      no_recent_products: 'لا توجد منتجات بعد',

      /* Dashboard KPI */
      kpi_products: 'إجمالي المنتجات', kpi_categories: 'الفئات',
      kpi_revenue: 'إجمالي الإيرادات', kpi_profit: 'إجمالي الأرباح',
      kpi_investment: 'إجمالي الاستثمار', kpi_inv_value: 'قيمة المخزون',
      kpi_expenses: 'إجمالي المصاريف', kpi_low_stock: 'مخزون منخفض',
      kpi_out_stock: 'نفد المخزون', kpi_sales_today: 'مبيعات اليوم',
      kpi_sales_month: 'مبيعات الشهر', kpi_credit: 'ديون معلقة',

      /* Common Buttons */
      btn_add: 'إضافة', btn_save: 'حفظ', btn_update: 'تحديث',
      btn_cancel: 'إلغاء', btn_delete: 'حذف', btn_edit: 'تعديل',
      btn_view: 'عرض', btn_close: 'إغلاق', btn_print: 'طباعة',
      btn_export_pdf: 'تصدير PDF', btn_export_excel: 'تصدير Excel',
      btn_restock: 'تجديد المخزون', btn_mark_paid: 'تحديد كمدفوع',
      btn_add_product: 'إضافة منتج', btn_add_category: 'إضافة فئة',
      btn_add_expense: 'إضافة مصروف', btn_record_sale: 'تسجيل بيع',
      btn_view_all: 'عرض الكل',

      /* Status */
      status_available: '✓ متوفر', status_low: '⚠ مخزون منخفض',
      status_out: '✕ نفد المخزون', status_paid: '✓ مدفوع',
      status_credit: '💳 آجل', status_overdue: '⚠ متأخر',

      /* Product Form */
      lbl_code: 'رمز المنتج', lbl_name: 'اسم المنتج',
      lbl_category: 'الفئة', lbl_supplier: 'اسم المورد',
      lbl_price: 'سعر الشراء', lbl_qty: 'الكمية المشتراة',
      lbl_currency: 'العملة', lbl_rate: 'سعر الصرف',
      lbl_date: 'تاريخ الشراء', lbl_desc: 'الوصف',
      lbl_image: 'صورة المنتج', lbl_import_exp: 'مصاريف الاستيراد',
      lbl_cpu_preview: 'التكلفة المتوقعة للوحدة',
      ph_code: 'يتم التوليد تلقائياً', ph_name: 'مثال: تلفزيون سامسونج 43"',
      ph_supplier: 'مثال: شركة القاهرة للإلكترونيات',

      /* Sale Form */
      lbl_product: 'المنتج', lbl_qty_sold: 'الكمية المباعة',
      lbl_sell_price: 'سعر البيع (للوحدة)', lbl_sale_date: 'تاريخ البيع',
      lbl_customer: 'اسم العميل', lbl_phone: 'هاتف العميل',
      lbl_payment: 'حالة الدفع', lbl_due_date: 'تاريخ استحقاق الدفع',
      lbl_amount_paid: 'المبلغ المدفوع مسبقاً',
      lbl_note: 'ملاحظة', pay_now: '✓ مدفوع الآن', pay_later: '💳 آجل (ادفع لاحقاً)',
      pay_now_sub: 'دفع العميل فوراً', pay_later_sub: 'سيدفع العميل لاحقاً',

      /* Table Headers */
      th_image: 'الصورة', th_code: 'الرمز', th_product: 'المنتج',
      th_category: 'الفئة', th_supplier: 'المورد',
      th_bought: 'الكمية المشتراة', th_stock: 'المخزون', th_cpu: 'التكلفة/وحدة',
      th_status: 'الحالة', th_actions: 'الإجراءات', th_qty: 'الكمية',
      th_unit_price: 'سعر الوحدة', th_revenue: 'الإيرادات',
      th_cost: 'التكلفة', th_profit: 'الأرباح', th_margin: 'الهامش',
      th_customer: 'العميل', th_date: 'التاريخ',
      th_payment: 'الدفع', th_due_date: 'الاستحقاق',
      th_sold: 'المباع', th_in_stock: 'المخزون الحالي',
      th_stock_level: 'مستوى المخزون', th_stock_value: 'قيمة المخزون',

      /* Reports */
      rep_daily: '📅 يومي', rep_weekly: '📆 أسبوعي',
      rep_monthly: '📊 شهري', rep_annual: '📈 سنوي',

      /* Settings */
      set_profile: '👤 معلومات الملف الشخصي', set_password: '🔒 تغيير كلمة المرور',
      set_system: '📊 ملخص النظام', set_danger: 'منطقة الخطر',
      set_reset: 'إعادة تعيين البيانات',

      /* Misc */
      administrator: 'مدير',
      low_threshold: '5',
      search_ph: 'ابحث عن منتجات، موردين…',
      no_data: 'لا توجد بيانات',
      confirm_delete: 'هل أنت متأكد؟', cannot_undo: 'لا يمكن التراجع عن هذا الإجراء.',
      profit_calc: '📊 حاسبة الأرباح (معاينة مباشرة)',
      available_stock: 'المخزون المتاح',
      import_expenses: '💸 مصاريف الاستيراد',

      /* Added Keys */
      brand_sub: 'نظام الاستيراد والمبيعات',
      nav_suppliers: 'الموردون',
      page_suppliers: 'الموردون', page_suppliers_sub: 'إدارة موردي المنتجات',
      login_pwd_ph: 'أدخل كلمة المرور', login_email_ph: 'admin@business.com',
      supp_registered: 'موردين مسجلين', btn_add_supp: 'إضافة مورد',
      th_supp: 'المورد', th_country: 'الدولة', th_phone: 'الهاتف', th_email: 'البريد الإلكتروني', th_notes: 'ملاحظات',
      ph_supp_search: 'ابحث عن موردين…', no_supp: 'لم يتم العثور على موردين', add_first_supp: 'أضف المورد الأول الخاص بك.',
      lbl_supp_name: 'اسم المورد', lbl_address: 'العنوان', ph_supp_addr: 'الشارع، المدينة', ph_supp_notes: 'ملاحظات إضافية حول هذا المورد…',
      sel_country: 'اختر الدولة', edit_supp: 'تعديل مورد', del_supp_title: 'حذف المورد؟', supp_del_msg: 'سيتم حذفه نهائياً.',
      products_count: 'منتجات', product_count: 'منتج',
      ph_date_from: 'من تاريخ', ph_date_to: 'إلى تاريخ',
      th_revenue: 'الإيرادات', th_profit: 'الأرباح', th_expenses: 'المصروفات',
    }
  };

  // ── Core Functions ────────────────────────

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    _applyDir(lang);
  }

  /** Translate a key */
  function t(key) {
    const lang = getLang();
    return translations[lang]?.[key] ?? translations.en[key] ?? key;
  }

  /** Apply direction + lang attribute */
  function _applyDir(lang) {
    const isAr = lang === 'ar';
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.body.classList.toggle('rtl', isAr);

    // Update language button label
    const btn = document.getElementById('langToggleBtn');
    if (btn) btn.textContent = isAr ? '🌐 EN' : '🌐 عربي';

    // Update placeholder in header search
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) searchInput.placeholder = t('search_ph');

    // Translate static nav items with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const trans = t(key);
      if (trans && trans !== key) el.textContent = trans;
    });
    // Translate placeholders with data-i18n-ph
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      const trans = t(key);
      if (trans && trans !== key) el.placeholder = trans;
    });
  }

  /** Toggle between en ↔ ar, then re-render current page */
  function toggle() {
    const newLang = getLang() === 'en' ? 'ar' : 'en';
    setLang(newLang);
    // Re-render current page so all dynamic content updates
    if (typeof UI !== 'undefined' && typeof UI.navigate === 'function' && typeof UI.getCurrentPage === 'function') {
      UI.navigate(UI.getCurrentPage());
    } else {
      window.location.reload();
    }
  }

  /** Called on app boot */
  function init() {
    _applyDir(getLang());
  }

  return { getLang, setLang, t, toggle, init };
})();

// Global shorthand — all modules can call  t('key')
window.t = I18n.t;
