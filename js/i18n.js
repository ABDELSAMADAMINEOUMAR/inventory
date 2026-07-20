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
      app_subtitle: 'Import & Sales System',
      login_welcome: 'Welcome Back', login_subtitle: 'Sign in to manage your business',
      login_email: 'Username or Email', login_password: 'Password',
      login_btn: 'Sign In to Dashboard', login_signing_in: 'Signing in...',
      login_invalid: 'Invalid credentials', login_hint: 'Default',
      login_feat_1: 'Products & Inventory', login_feat_2: 'Sales Tracking',
      login_feat_3: 'Auto Profit Calc', login_feat_4: 'Reports & Export',
      forgot_pwd_link: 'Forgot Password?',
      forgot_modal_title: 'Reset Your Password',
      forgot_modal_desc: 'Enter your registered email address and we will send you instructions to reset your password.',
      forgot_email_lbl: 'Email Address',
      forgot_send_btn: 'Send Reset Link',
      nav_platform: 'SaaS Platform',
      nav_suppliers: 'Suppliers',
      activate_title: 'Activate Account',
      activate_sub: 'Your company account has been created. Verify your email and choose your permanent password.',
      activate_email: 'Account Email',
      activate_create_pwd: 'Create Permanent Password',
      activate_confirm_pwd: 'Confirm Password',
      activate_btn: 'Verify Email & Activate Account →',
      activate_ph_min: 'At least 6 characters',
      activate_ph_confirm: 'Re-enter permanent password',
      activate_back: '← Back to Sign In',
      activate_err_match: 'Passwords do not match.',
      activate_err_link: 'Invalid verification link. Missing uid or token in URL.',
      activate_verifying: 'Verifying Account...',
      activate_err_expired: 'Account not found or verification link expired.',
      activate_success_title: '✓ Email verified & password set successfully!',
      activate_success_sub: 'Redirecting to sign-in screen...',

      /* Page Titles */
      page_dashboard: 'Dashboard', page_products: 'Products',
      page_categories: 'Categories', page_expenses: 'Expenses',
      page_sales: 'Sales', page_inventory: 'Inventory',
      page_reports: 'Reports', page_settings: 'Settings', page_users: 'Users (Admin)', page_platform: 'SaaS Platform Management', page_suppliers: 'Suppliers',
      page_dashboard_sub: 'Business overview & analytics',
      page_products_sub: 'Manage your imported products',
      page_categories_sub: 'Organise product categories',
      page_suppliers_sub: 'Manage your product suppliers',
      page_expenses_sub: 'Import & business expenses',
      page_sales_sub: 'Record and track your sales',
      page_inventory_sub: 'Stock levels & alerts',
      page_reports_sub: 'Financial reports & exports',
      page_settings_sub: 'Profile & system settings',
      page_users_sub: 'Manage employee accounts & roles',
      page_platform_sub: 'Manage tenant companies, subscriptions & stats',
      nav_users: 'Users (Admin)',

      /* Dashboard Extra */
      chart_monthly_rev: 'Monthly Revenue & Profit',
      chart_monthly_exp: 'Monthly Expenses',
      chart_top_selling: 'Top Selling Products',
      chart_rev_vs_exp: 'Revenue vs Expenses',
      recent_sales: 'Recent Sales',
      recent_products: 'Recent Products',
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
      status_available: 'In Stock', status_low: 'Low Stock',
      status_out: 'Out of Stock', status_paid: 'Paid',
      status_credit: 'Credit', status_overdue: 'Overdue',

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
      lbl_note: 'Note', pay_now: 'Paid Now', pay_later: 'Credit (Pay Later)',
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
      rep_daily: 'Daily', rep_weekly: 'Weekly',
      rep_monthly: 'Monthly', rep_annual: 'Annual',

      /* Settings */
      set_profile: 'Profile Information', set_password: 'Change Password',
      set_system: 'System Summary', set_danger: 'Danger Zone',
      set_reset: 'Reset All Data',

      /* Misc */
      administrator: 'Administrator',
      low_threshold: '5',
      search_ph: 'Search products, suppliers…',
      no_data: 'No data found',
      confirm_delete: 'Are you sure?', cannot_undo: 'This action cannot be undone.',
      profit_calc: 'Profit Calculator (Live Preview)',
      available_stock: 'Available stock',
      import_expenses: 'Import Expenses',

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
      exp_Purchase_Cost: 'Purchase Cost', exp_Shipping: 'Shipping', exp_Customs_Duty: 'Customs Duty',
      exp_Transportation: 'Transportation', exp_Packaging: 'Packaging', exp_Insurance: 'Insurance',
      exp_Warehouse: 'Warehouse', exp_Taxes: 'Taxes', exp_Other: 'Other',
      lbl_total_import_cost: 'Total Import Cost', lbl_cost_per_unit: 'Cost Per Unit',
      lbl_total_expenses: 'Total Expenses', lbl_units_sold: 'Units Sold',
      lbl_revenue_gen: 'Revenue Generated', lbl_profit_gen: 'Profit Generated',
      lbl_type: 'Type', lbl_amount: 'Amount',
      signout: 'Logout', btn_logout: 'Logout',
      showcase_revenue_title: 'Gross Revenue Overview',
      day_mon: 'Mon', day_tue: 'Tue', day_wed: 'Wed', day_thu: 'Thu', day_fri: 'Fri', day_sat: 'Sat', day_sun: 'Sun',
      showcase_sync_title: 'Multi-Warehouse Sync', showcase_sync_desc: 'Real-Time Stock Automated Tracking',
      showcase_sync_status: 'Active', showcase_sync_item: 'Import Container #492 (Electronics)', showcase_sync_done: 'Synced ✓',
      showcase_quote_text: '"SmartIMS automated our entire import supply chain and gave us instant clarity on FX conversion & net profit margins."',
      showcase_quote_role: 'Managing Director, Global Imports',
      session_expired_title: 'Session Expired', session_expired_desc: 'Your session expired after inactivity. Please sign in again.',
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
      app_subtitle: 'نظام الاستيراد والمبيعات الذكي',
      login_welcome: 'مرحباً بعودتك', login_subtitle: 'سجل الدخول لإدارة عملك ومساحتك',
      login_email: 'اسم المستخدم أو البريد الإلكتروني', login_password: 'كلمة المرور',
      login_btn: 'تسجيل الدخول إلى لوحة التحكم', login_signing_in: 'جاري تسجيل الدخول...',
      login_invalid: 'بيانات الاعتماد غير صالحة', login_hint: 'الافتراضي',
      login_feat_1: 'المنتجات والمخزون', login_feat_2: 'تتبع المبيعات',
      login_feat_3: 'حاسبة الأرباح التلقائية', login_feat_4: 'التقارير والتصدير',
      forgot_pwd_link: 'نسيت كلمة المرور؟',
      forgot_modal_title: 'إعادة تعيين كلمة المرور',
      forgot_modal_desc: 'أدخل عنوان بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.',
      forgot_email_lbl: 'البريد الإلكتروني',
      forgot_send_btn: 'إرسال رابط الإعادة',
      nav_platform: 'إدارة المنصة (SaaS)',
      nav_suppliers: 'الموردون',
      activate_title: 'تفعيل الحساب وتعيين كلمة المرور',
      activate_sub: 'تم إنشاء حساب شركتك. يرجى تأكيد بريدك الإلكتروني واختيار كلمة مرور دائمة لحسابك.',
      activate_email: 'البريد الإلكتروني للحساب',
      activate_create_pwd: 'إنشاء كلمة المرور الجديدة',
      activate_confirm_pwd: 'تأكيد كلمة المرور',
      activate_btn: 'تفعيل الحساب وتعيين كلمة المرور ←',
      activate_ph_min: 'على الأقل 6 أحرف',
      activate_ph_confirm: 'أعد إدخال كلمة المرور الدائمة',
      activate_back: '← العودة إلى تسجيل الدخول',
      activate_err_match: 'كلمتا المرور غير متطابقتين.',
      activate_err_link: 'رابط التفعيل غير صالح. مفقود uid أو token في الرابط.',
      activate_verifying: 'جاري تفعيل الحساب...',
      activate_err_expired: 'الحساب غير موجود أو رابط التفعيل منتهي الصلاحية.',
      activate_success_title: '✓ تم تأكيد البريد وتعيين كلمة المرور بنجاح!',
      activate_success_sub: 'جاري التوجيه إلى شاشة تسجيل الدخول...',

      /* Page Titles */
      page_dashboard: 'لوحة التحكم', page_products: 'المنتجات',
      page_categories: 'الفئات', page_expenses: 'المصاريف',
      page_sales: 'المبيعات', page_inventory: 'المخزون',
      page_reports: 'التقارير', page_settings: 'الإعدادات', page_users: 'المستخدمون (إدارة)', page_platform: 'إدارة منصة SaaS', page_suppliers: 'الموردون',
      page_dashboard_sub: 'نظرة عامة على العمل والتحليلات',
      page_products_sub: 'إدارة المنتجات المستوردة الخاصة بك',
      page_categories_sub: 'تنظيم فئات المنتجات',
      page_suppliers_sub: 'إدارة موردي المنتجات',
      page_expenses_sub: 'مصاريف الاستيراد والعمل التجاري',
      page_sales_sub: 'سجل وتتبع المبيعات الخاصة بك',
      page_inventory_sub: 'مستويات المخزون والتنبيهات',
      page_reports_sub: 'التقارير المالية والتصدير',
      page_settings_sub: 'ملف التعريف وإعدادات النظام',
      page_users_sub: 'إدارة حسابات الموظفين والصلاحيات',
      page_platform_sub: 'إدارة الشركات المستأجرة، الباقات والإحصائيات',
      nav_users: 'المستخدمون (إدارة)',

      /* Dashboard Extra */
      chart_monthly_rev: 'الإيرادات والأرباح الشهرية',
      chart_monthly_exp: 'المصاريف الشهرية',
      chart_top_selling: 'المنتجات الأكثر مبيعاً',
      chart_rev_vs_exp: 'الإيرادات مقابل المصاريف',
      recent_sales: 'المبيعات الأخيرة',
      recent_products: 'المنتجات الأخيرة',
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
      status_available: 'متوفر', status_low: 'مخزون منخفض',
      status_out: 'نفد المخزون', status_paid: 'مدفوع',
      status_credit: 'آجل', status_overdue: 'متأخر',

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
      lbl_note: 'ملاحظة', pay_now: 'مدفوع الآن', pay_later: 'آجل (ادفع لاحقاً)',
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
      rep_daily: 'يومي', rep_weekly: 'أسبوعي',
      rep_monthly: 'شهري', rep_annual: 'سنوي',

      /* Settings */
      set_profile: 'معلومات الملف الشخصي', set_password: 'تغيير كلمة المرور',
      set_system: 'ملخص النظام', set_danger: 'منطقة الخطر',
      set_reset: 'إعادة تعيين البيانات',

      /* Misc */
      administrator: 'مدير',
      low_threshold: '5',
      search_ph: 'ابحث عن منتجات، موردين…',
      no_data: 'لا توجد بيانات',
      confirm_delete: 'هل أنت متأكد؟', cannot_undo: 'لا يمكن التراجع عن هذا الإجراء.',
      profit_calc: 'حاسبة الأرباح (معاينة مباشرة)',
      available_stock: 'المخزون المتاح',
      import_expenses: 'مصاريف الاستيراد',

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
      exp_Purchase_Cost: 'تكلفة الشراء', exp_Shipping: 'الشحن', exp_Customs_Duty: 'الرسوم الجمركية',
      exp_Transportation: 'النقل', exp_Packaging: 'التغليف', exp_Insurance: 'التأمين',
      exp_Warehouse: 'التخزين / المستودع', exp_Taxes: 'الضرائب', exp_Other: 'أخرى',
      lbl_total_import_cost: 'إجمالي تكلفة الاستيراد', lbl_cost_per_unit: 'التكلفة لكل وحدة',
      lbl_total_expenses: 'إجمالي المصاريف', lbl_units_sold: 'الكمية المباعة',
      lbl_revenue_gen: 'الإيرادات المحققة', lbl_profit_gen: 'الأرباح المحققة',
      lbl_type: 'النوع', lbl_amount: 'المبلغ',
      signout: 'تسجيل الخروج', btn_logout: 'تسجيل الخروج',
      showcase_revenue_title: 'نظرة عامة على الإيرادات الإجمالية',
      day_mon: 'إثن', day_tue: 'ثلا', day_wed: 'أرب', day_thu: 'خمي', day_fri: 'جمعة', day_sat: 'سبت', day_sun: 'أحد',
      showcase_sync_title: 'مزامنة المخازن المتعددة', showcase_sync_desc: 'تتبع آلي وفوري للمخزون',
      showcase_sync_status: 'نشط', showcase_sync_item: 'حاوية استيراد #492 (إلكترونيات)', showcase_sync_done: 'تمت المزامنة ✓',
      showcase_quote_text: '"نظام SmartIMS أتمت سلسلة توريد الاستيراد بأكملها ومنحنا وضوحاً فورياً حول تحويل العملات وهوامش الربح الصافي."',
      showcase_quote_role: 'المدير العام، الاستيراد العالمي',
      session_expired_title: 'انتهت الجلسة', session_expired_desc: 'انتهت صلاحية جلستك بسبب عدم النشاط. يرجى تسجيل الدخول مرة أخرى.',
    },

    fr: {
      /* Navigation */
      nav_main: 'Principal', nav_catalogue: 'Catalogue', nav_operations: 'Opérations',
      nav_analytics: 'Analyses', nav_account: 'Compte',
      nav_dashboard: 'Tableau de bord', nav_products: 'Produits',
      nav_categories: 'Catégories', nav_expenses: 'Dépenses',
      nav_sales: 'Ventes', nav_inventory: 'Inventaire',
      nav_reports: 'Rapports', nav_settings: 'Paramètres',

      /* Login Page */
      app_subtitle: 'Système d\'Importation et de Ventes',
      login_welcome: 'Bon retour', login_subtitle: 'Connectez-vous pour gérer votre activité',
      login_email: 'Nom d\'utilisateur ou E-mail', login_password: 'Mot de passe',
      login_btn: 'Se connecter au tableau de bord', login_signing_in: 'Connexion en cours...',
      login_invalid: 'Identifiants invalides', login_hint: 'Par défaut',
      login_feat_1: 'Produits et Inventaire', login_feat_2: 'Suivi des Ventes',
      login_feat_3: 'Calculateur de Profit Auto', login_feat_4: 'Rapports et Export',
      forgot_pwd_link: 'Mot de passe oublié ?',
      forgot_modal_title: 'Réinitialiser votre mot de passe',
      forgot_modal_desc: 'Entrez votre adresse e-mail enregistrée et nous vous enverrons les instructions pour réinitialiser votre mot de passe.',
      forgot_email_lbl: 'Adresse e-mail',
      forgot_send_btn: 'Envoyer le lien',
      nav_platform: 'Plateforme SaaS',
      nav_suppliers: 'Fournisseurs',
      activate_title: 'Activer le compte',
      activate_sub: 'Le compte de votre entreprise a été créé. Vérifiez votre e-mail et choisissez votre mot de passe permanent.',
      activate_email: 'E-mail du compte',
      activate_create_pwd: 'Créer un mot de passe permanent',
      activate_confirm_pwd: 'Confirmer le mot de passe',
      activate_btn: 'Vérifier l\'e-mail et activer le compte →',
      activate_ph_min: 'Au moins 6 caractères',
      activate_ph_confirm: 'Saisissez à nouveau le mot de passe permanent',
      activate_back: '← Retour à la connexion',
      activate_err_match: 'Les mots de passe ne correspondent pas.',
      activate_err_link: 'Lien de vérification invalide. uid ou token manquant.',
      activate_verifying: 'Vérification du compte en cours...',
      activate_err_expired: 'Compte introuvable ou lien de vérification expiré.',
      activate_success_title: '✓ E-mail vérifié et mot de passe configuré avec succès !',
      activate_success_sub: 'Redirection vers l\'écran de connexion...',

      /* Page Titles */
      page_dashboard: 'Tableau de bord', page_products: 'Produits',
      page_categories: 'Catégories', page_expenses: 'Dépenses',
      page_sales: 'Ventes', page_inventory: 'Inventaire',
      page_reports: 'Rapports', page_settings: 'Paramètres', page_users: 'Utilisateurs (Admin)', page_platform: 'Gestion Plateforme SaaS', page_suppliers: 'Fournisseurs',
      page_dashboard_sub: 'Aperçu des activités et analyses',
      page_products_sub: 'Gérer vos produits importés',
      page_categories_sub: 'Organiser les catégories de produits',
      page_suppliers_sub: 'Gérer vos fournisseurs de produits',
      page_expenses_sub: 'Dépenses d\'importation et commerciales',
      page_sales_sub: 'Enregistrer et suivre vos ventes',
      page_inventory_sub: 'Niveaux de stock et alertes',
      page_reports_sub: 'Rapports financiers et exportations',
      page_settings_sub: 'Profil et paramètres du système',
      page_users_sub: 'Gérer les comptes et rôles des employés',
      page_platform_sub: 'Gérer les entreprises, abonnements et statistiques',
      nav_users: 'Utilisateurs (Admin)',

      /* Dashboard Extra */
      chart_monthly_rev: 'Revenus et Profits Mensuels',
      chart_monthly_exp: 'Dépenses Mensuelles',
      chart_top_selling: 'Produits les plus vendus',
      chart_rev_vs_exp: 'Revenus vs Dépenses',
      recent_sales: 'Ventes Récentes',
      recent_products: 'Produits Récents',
      no_recent_sales: 'Aucune vente récente',
      no_recent_products: 'Aucun produit récent',

      /* Dashboard KPI */
      kpi_products: 'Total Produits', kpi_categories: 'Catégories',
      kpi_revenue: 'Revenu Total', kpi_profit: 'Profit Total',
      kpi_investment: 'Investissement Total', kpi_inv_value: 'Valeur du Stock',
      kpi_expenses: 'Total Dépenses', kpi_low_stock: 'Stock Faible',
      kpi_out_stock: 'Rupture de Stock', kpi_sales_today: 'Ventes du Jour',
      kpi_sales_month: 'Ventes du Mois', kpi_credit: 'Crédits en Cours',

      /* Common Buttons */
      btn_add: 'Ajouter', btn_save: 'Enregistrer', btn_update: 'Mettre à jour',
      btn_cancel: 'Annuler', btn_delete: 'Supprimer', btn_edit: 'Modifier',
      btn_view: 'Voir', btn_close: 'Fermer', btn_print: 'Imprimer',
      btn_export_pdf: 'Exporter PDF', btn_export_excel: 'Exporter Excel',
      btn_restock: 'Réapprovisionner', btn_mark_paid: 'Marquer Payé',
      btn_add_product: 'Ajouter Produit', btn_add_category: 'Ajouter Catégorie',
      btn_add_expense: 'Ajouter Dépense', btn_record_sale: 'Enregistrer Vente',
      btn_view_all: 'Voir Tout',

      /* Status */
      status_available: 'En Stock', status_low: 'Stock Faible',
      status_out: 'Rupture de Stock', status_paid: 'Payé',
      status_credit: 'Crédit', status_overdue: 'En Retard',

      /* Product Form */
      lbl_code: 'Code Produit', lbl_name: 'Nom du Produit',
      lbl_category: 'Catégorie', lbl_supplier: 'Nom du Fournisseur',
      lbl_price: 'Prix d\'Achat', lbl_qty: 'Quantité Achetée',
      lbl_currency: 'Devise', lbl_rate: 'Taux de Change',
      lbl_date: 'Date d\'Achat', lbl_desc: 'Description',
      lbl_image: 'Image du Produit', lbl_import_exp: 'Dépenses d\'Importation',
      lbl_cpu_preview: 'Coût Unitaire Estimé',
      ph_code: 'Généré automatiquement', ph_name: 'ex: Téléviseur Samsung 43"',
      ph_supplier: 'ex: Cairo Electronics Co.',

      /* Sale Form */
      lbl_product: 'Produit', lbl_qty_sold: 'Quantité Vendue',
      lbl_sell_price: 'Prix de Vente (unitaire)', lbl_sale_date: 'Date de Vente',
      lbl_customer: 'Nom du Client', lbl_phone: 'Téléphone du Client',
      lbl_payment: 'Statut du Paiement', lbl_due_date: 'Date d\'Échéance',
      lbl_amount_paid: 'Montant Déjà Payé',
      lbl_note: 'Note', pay_now: 'Payé Immédiatement', pay_later: 'Crédit (Payer plus tard)',
      pay_now_sub: 'Le client a payé immédiatement', pay_later_sub: 'Le client paiera plus tard',

      /* Table Headers */
      th_image: 'Image', th_code: 'Code', th_product: 'Produit',
      th_category: 'Catégorie', th_supplier: 'Fournisseur',
      th_bought: 'Qté Achetée', th_stock: 'Stock', th_cpu: 'Coût/Unité',
      th_status: 'Statut', th_actions: 'Actions', th_qty: 'Qté',
      th_unit_price: 'Prix Unitaire', th_revenue: 'Revenu',
      th_cost: 'Coût', th_profit: 'Profit', th_margin: 'Marge',
      th_customer: 'Client', th_date: 'Date',
      th_payment: 'Paiement', th_due_date: 'Échéance',
      th_sold: 'Vendu', th_in_stock: 'En Stock', th_stock_level: 'Niveau de Stock',
      th_stock_value: 'Valeur du Stock',

      /* Reports */
      rep_daily: 'Quotidien', rep_weekly: 'Hebdomadaire',
      rep_monthly: 'Mensuel', rep_annual: 'Annuel',

      /* Settings */
      set_profile: 'Informations du Profil', set_password: 'Changer le Mot de Passe',
      set_system: 'Résumé du Système', set_danger: 'Zone de Danger',
      set_reset: 'Réinitialiser Toutes les Données',

      /* Misc */
      administrator: 'Administrateur',
      low_threshold: '5',
      search_ph: 'Rechercher produits, fournisseurs…',
      no_data: 'Aucune donnée trouvée',
      confirm_delete: 'Êtes-vous sûr ?', cannot_undo: 'Cette action ne peut pas être annulée.',
      profit_calc: 'Calculateur de Profit (Aperçu en direct)',
      available_stock: 'Stock disponible',
      import_expenses: 'Dépenses d\'Importation',

      /* Added Keys */
      brand_sub: 'Importation et Ventes',
      nav_suppliers: 'Fournisseurs',
      page_suppliers: 'Fournisseurs', page_suppliers_sub: 'Gérer vos fournisseurs de produits',
      login_pwd_ph: 'Entrez votre mot de passe', login_email_ph: 'admin@business.com',
      supp_registered: 'fournisseurs enregistrés', btn_add_supp: 'Ajouter Fournisseur',
      th_supp: 'Fournisseur', th_country: 'Pays', th_phone: 'Téléphone', th_email: 'E-mail', th_notes: 'Notes',
      ph_supp_search: 'Rechercher des fournisseurs…', no_supp: 'Aucun fournisseur trouvé', add_first_supp: 'Ajoutez votre premier fournisseur.',
      lbl_supp_name: 'Nom du Fournisseur', lbl_address: 'Adresse', ph_supp_addr: 'Rue, Ville', ph_supp_notes: 'Notes supplémentaires sur ce fournisseur…',
      sel_country: 'Sélectionner le pays', edit_supp: 'Modifier le Fournisseur', del_supp_title: 'Supprimer le Fournisseur ?', supp_del_msg: 'sera définitivement supprimé.',
      products_count: 'produits', product_count: 'produit',
      ph_date_from: 'Date de début', ph_date_to: 'Date de fin',
      th_revenue: 'Revenu', th_profit: 'Profit', th_expenses: 'Dépenses',
      exp_Purchase_Cost: 'Coût d\'Achat', exp_Shipping: 'Expédition', exp_Customs_Duty: 'Frais de Douane',
      exp_Transportation: 'Transport', exp_Packaging: 'Emballage', exp_Insurance: 'Assurance',
      exp_Warehouse: 'Entrepôt / Stockage', exp_Taxes: 'Taxes', exp_Other: 'Autre',
      lbl_total_import_cost: 'Coût Total d\'Importation', lbl_cost_per_unit: 'Coût par Unité',
      lbl_total_expenses: 'Total des Dépenses', lbl_units_sold: 'Unités Vendues',
      lbl_revenue_gen: 'Revenu Généré', lbl_profit_gen: 'Profit Généré',
      lbl_type: 'Type', lbl_amount: 'Montant',
      signout: 'Déconnexion', btn_logout: 'Déconnexion',
      showcase_revenue_title: 'Aperçu des revenus bruts',
      day_mon: 'Lun', day_tue: 'Mar', day_wed: 'Mer', day_thu: 'Jeu', day_fri: 'Ven', day_sat: 'Sam', day_sun: 'Dim',
      showcase_sync_title: 'Synchronisation multi-entrepôts', showcase_sync_desc: 'Suivi automatisé du stock en temps réel',
      showcase_sync_status: 'Actif', showcase_sync_item: 'Conteneur d\'import #492 (Électronique)', showcase_sync_done: 'Synchronisé ✓',
      showcase_quote_text: '"SmartIMS a automatisé toute notre chaîne d\'approvisionnement et nous a donné une clarté instantanée sur la conversion FX et les marges nettes."',
      showcase_quote_role: 'Directeur général, Importations mondiales',
      session_expired_title: 'Session expirée', session_expired_desc: 'Votre session a expiré après une période d\'inactivité. Veuillez vous reconnecter.',
    }
  };

  // ── Core Functions ────────────────────────

  function toWesternDigits(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/٫/g, '.');
  }

  function parseNum(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleanStr = toWesternDigits(val).replace(/[^0-9.-]+/g, '');
    const n = parseFloat(cleanStr);
    return isNaN(n) ? 0 : n;
  }

  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    _applyDir(lang);
  }

  /** Choose translation based on current lang */
  function choose(en, ar, fr) {
    const lang = getLang();
    if (lang === 'ar') return ar;
    if (lang === 'fr') return fr !== undefined ? fr : en;
    return en;
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
    // Update language button label
    const btn = document.getElementById('langToggleBtn');
    if (btn) {
      if (typeof UI !== 'undefined' && UI.icon) {
        if (lang === 'en') btn.innerHTML = `${UI.icon('globe', '', 14)} <span style="margin-left:4px">عربي</span>`;
        else if (lang === 'ar') btn.innerHTML = `${UI.icon('globe', '', 14)} <span style="margin-left:4px">Français</span>`;
        else if (lang === 'fr') btn.innerHTML = `${UI.icon('globe', '', 14)} <span style="margin-left:4px">English</span>`;
        else btn.innerHTML = `${UI.icon('globe', '', 14)} <span style="margin-left:4px">عربي</span>`;
      } else {
        if (lang === 'en') btn.textContent = 'عربي';
        else if (lang === 'ar') btn.textContent = 'Français';
        else if (lang === 'fr') btn.textContent = 'English';
        else btn.textContent = 'عربي';
      }
    }

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
    // Translate title/aria-label with data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const trans = t(key);
      if (trans && trans !== key) {
        el.title = trans;
        if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', trans);
      }
    });
  }

  /** Toggle between en ↔ ar ↔ fr, then re-render current page */
  function toggle() {
    const current = getLang();
    let newLang = 'en';
    if (current === 'en') newLang = 'ar';
    else if (current === 'ar') newLang = 'fr';
    else if (current === 'fr') newLang = 'en';
    setLang(newLang);
    // Re-render current page so all dynamic content updates
    if (typeof UI !== 'undefined' && typeof UI.navigate === 'function' && typeof UI.getCurrentPage === 'function') {
      UI.navigate(UI.getCurrentPage());
    } else if (document.body.classList.contains('login-page')) {
      _applyDir(newLang);
    } else {
      window.location.reload();
    }
  }

  /** Called on app boot */
  function init() {
    _applyDir(getLang());
  }

  return { getLang, setLang, t, toggle, init, toWesternDigits, parseNum, choose };
})();

// Global shorthand — all modules can call t('key') or choose(...)
window.t = I18n.t;
window.parseNum = I18n.parseNum;
window.toWesternDigits = I18n.toWesternDigits;
window.choose = I18n.choose;
