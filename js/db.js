/* =============================================
   DB.JS — localStorage Database Layer
   Smart Import & Sales Management System
   ============================================= */

const DB = (() => {
  const TABLES = ['users','categories','suppliers','products','productExpenses','sales','businessExpenses'];
  const PREFIX = 'sims_';

  // ── Internal helpers ──────────────────────
  function _key(table) {
    if (table === 'users') return PREFIX + 'users';
    try {
      const sess = JSON.parse(sessionStorage.getItem('sims_session'));
      if (sess && sess.id && sess.id !== 1) {
        return `${PREFIX}u${sess.id}_${table}`;
      }
    } catch (e) {}
    return PREFIX + table;
  }

  function _readTable(table) {
    try {
      const k = _key(table);
      let val = localStorage.getItem(k);
      if (!val && table === 'categories' && k !== PREFIX + 'categories') {
        const defaultCats = [
          { id: 1, name: 'Electronics', description: 'Electronic devices and accessories', createdAt: _now(), updatedAt: _now() },
          { id: 2, name: 'Clothing', description: 'Garments and fashion items', createdAt: _now(), updatedAt: _now() },
          { id: 3, name: 'Food & Beverage', description: 'Consumable food and drink products', createdAt: _now(), updatedAt: _now() },
          { id: 4, name: 'General', description: 'General merchandise and items', createdAt: _now(), updatedAt: _now() }
        ];
        localStorage.setItem(k, JSON.stringify(defaultCats));
        return defaultCats;
      }
      return JSON.parse(val || '[]');
    } catch { return []; }
  }

  function _writeTable(table, data) {
    localStorage.setItem(_key(table), JSON.stringify(data));
  }

  function _nextId(table) {
    const rows = _readTable(table);
    if (!rows.length) return 1;
    return Math.max(...rows.map(r => r.id)) + 1;
  }

  function _now() { return new Date().toISOString(); }

  // ── Public API ────────────────────────────

  /** Get all rows from a table */
  function getAll(table) { return _readTable(table); }

  /** Get a single row by id */
  function getById(table, id) {
    return _readTable(table).find(r => r.id === id) || null;
  }

  /** Insert a new row, returns the saved row (with id + timestamps) */
  function insert(table, data) {
    const rows = _readTable(table);
    const id = _nextId(table);
    const row = { id, ...data, createdAt: _now(), updatedAt: _now() };
    if (table === 'products' && (!row.code || row.code === 'Auto-generated' || row.code.trim() === '')) {
      row.code = generateProductCode();
    }
    rows.push(row);
    _writeTable(table, rows);
    return row;
  }

  /** Update a row by id, returns updated row or null */
  function update(table, id, data) {
    const rows = _readTable(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...data, updatedAt: _now() };
    _writeTable(table, rows);
    return rows[idx];
  }

  /** Delete a row by id, returns true/false */
  function remove(table, id) {
    const rows = _readTable(table);
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return false;
    rows.splice(idx, 1);
    _writeTable(table, rows);
    return true;
  }

  /** Query rows with a filter function */
  function query(table, filterFn) {
    return _readTable(table).filter(filterFn);
  }

  /** Count rows, optionally with filter */
  function count(table, filterFn) {
    const rows = _readTable(table);
    return filterFn ? rows.filter(filterFn).length : rows.length;
  }

  /** Sum a numeric field, optionally with filter */
  function sum(table, field, filterFn) {
    const rows = filterFn ? _readTable(table).filter(filterFn) : _readTable(table);
    return rows.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);
  }

  /** Clear all data (factory reset) */
  function clearAll() {
    TABLES.forEach(t => localStorage.removeItem(_key(t)));
  }

  /** Check if DB is initialised */
  function isInitialised() {
    return localStorage.getItem(PREFIX + 'init_v2') === '1';
  }

  /** Password hash using SHA-256 (async) */
  async function hashPassword(plain) {
    const enc = new TextEncoder().encode(plain);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /** Seed the database with demo data */
  async function seed() {
    if (isInitialised()) return;

    // Users
    const pwHash = await hashPassword('admin123');
    insert('users', { name: 'Admin User', email: 'admin@business.com', passwordHash: pwHash, role: 'admin', phone: '+250788000000', business: 'My Import Business', currency: 'USD' });

    // Categories
    const cats = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Garments and fashion items' },
      { name: 'Food & Beverage', description: 'Consumable food and drink products' },
      { name: 'Cosmetics', description: 'Beauty and personal care products' },
      { name: 'Home Appliances', description: 'Household appliances and equipment' },
      { name: 'Furniture', description: 'Home and office furniture' },
    ];
    cats.forEach(c => insert('categories', c));

    // Suppliers
    const supps = [
      { name: 'Cairo Electronics Co.', phone: '+20112345678', email: 'info@cairoelec.com', address: '15 Tahrir St', country: 'Egypt', notes: 'Reliable electronics supplier' },
      { name: 'Nile Fashion House', phone: '+20123456789', email: 'contact@nilefashion.com', address: '22 Ramses Ave', country: 'Egypt', notes: 'Clothing and accessories' },
      { name: 'Delta Goods Ltd.', phone: '+20198765432', email: 'sales@deltagoods.com', address: '5 Port Said Rd', country: 'Egypt', notes: 'General merchandise' },
      { name: 'Luxor Cosmetics', phone: '+20187654321', email: 'info@luxorcosm.com', address: '10 Queen St', country: 'Egypt', notes: 'Premium cosmetics' },
    ];
    const suppIds = supps.map(s => insert('suppliers', s).id);

    // Products (with expenses already embedded for seeding)
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

    const products = [
      {
        code: 'PRD-001', name: 'Samsung LED TV 43"', categoryId: 1, supplierId: suppIds[0],
        description: '43 inch LED Smart TV', purchasePrice: 180000, currency: 'FCFA', exchangeRate: 1,
        quantity: 20, purchaseDate: daysAgo(60), status: 'available',
        expenses: [
          { expenseType: 'Shipping', amount: 80000, note: 'Sea freight' },
          { expenseType: 'Customs Duty', amount: 50000, note: 'Customs' },
          { expenseType: 'Transportation', amount: 20000, note: 'Port to warehouse' },
          { expenseType: 'Insurance', amount: 10000, note: 'Cargo insurance' },
        ]
      },
      {
        code: 'PRD-002', name: 'iPhone 13 Case (Pack of 50)', categoryId: 1, supplierId: suppIds[0],
        description: 'Protective phone cases assorted colors', purchasePrice: 90000, currency: 'FCFA', exchangeRate: 1,
        quantity: 50, purchaseDate: daysAgo(45), status: 'available',
        expenses: [
          { expenseType: 'Shipping', amount: 18000, note: 'Air freight' },
          { expenseType: 'Customs Duty', amount: 12000, note: 'Customs' },
          { expenseType: 'Packaging', amount: 6000, note: 'Packaging material' },
        ]
      },
      {
        code: 'PRD-003', name: 'Men\'s Polo Shirts (100 pcs)', categoryId: 2, supplierId: suppIds[1],
        description: 'Assorted colors polo shirts size M-XL', purchasePrice: 240000, currency: 'FCFA', exchangeRate: 1,
        quantity: 100, purchaseDate: daysAgo(30), status: 'available',
        expenses: [
          { expenseType: 'Shipping', amount: 36000, note: 'Sea freight' },
          { expenseType: 'Customs Duty', amount: 48000, note: 'Customs' },
          { expenseType: 'Transportation', amount: 12000, note: 'Delivery' },
        ]
      },
      {
        code: 'PRD-004', name: 'Face Cream Set (24 pcs)', categoryId: 4, supplierId: suppIds[3],
        description: 'Luxury face cream and serum combo', purchasePrice: 144000, currency: 'FCFA', exchangeRate: 1,
        quantity: 24, purchaseDate: daysAgo(20), status: 'available',
        expenses: [
          { expenseType: 'Shipping', amount: 24000, note: 'Air freight' },
          { expenseType: 'Customs Duty', amount: 21600, note: 'Customs' },
          { expenseType: 'Insurance', amount: 7200, note: 'Cargo insurance' },
        ]
      },
      {
        code: 'PRD-005', name: 'Bluetooth Earbuds (30 pcs)', categoryId: 1, supplierId: suppIds[0],
        description: 'Wireless earbuds with charging case', purchasePrice: 108000, currency: 'FCFA', exchangeRate: 1,
        quantity: 30, purchaseDate: daysAgo(15), status: 'available',
        expenses: [
          { expenseType: 'Shipping', amount: 15000, note: 'Air freight' },
          { expenseType: 'Customs Duty', amount: 16200, note: 'Customs' },
          { expenseType: 'Packaging', amount: 4800, note: 'Display boxes' },
        ]
      },
      {
        code: 'PRD-006', name: 'Women\'s Handbags (20 pcs)', categoryId: 2, supplierId: suppIds[1],
        description: 'Leather handbags assorted styles', purchasePrice: 180000, currency: 'FCFA', exchangeRate: 1,
        quantity: 20, purchaseDate: daysAgo(10), status: 'available',
        expenses: [
          { expenseType: 'Shipping', amount: 27000, note: 'Air freight' },
          { expenseType: 'Customs Duty', amount: 36000, note: 'Customs' },
          { expenseType: 'Insurance', amount: 9000, note: 'Cargo insurance' },
        ]
      },
    ];

    products.forEach(p => {
      const { expenses, ...productData } = p;
      const product = insert('products', productData);
      expenses.forEach(e => insert('productExpenses', { ...e, productId: product.id, date: daysAgo(Math.floor(Math.random() * 10)) }));
    });

    // Sales (seed some historical sales)
    const salesData = [
      { productId: 1, quantity: 3, sellingPrice: 420000, saleDate: daysAgo(50), customer: 'John Electronics' },
      { productId: 1, quantity: 2, sellingPrice: 420000, saleDate: daysAgo(40), customer: 'Kigali Shop' },
      { productId: 2, quantity: 15, sellingPrice: 6000, saleDate: daysAgo(35), customer: 'Mobile Store RW' },
      { productId: 3, quantity: 30, sellingPrice: 6000, saleDate: daysAgo(25), customer: 'Fashion Kigali' },
      { productId: 4, quantity: 10, sellingPrice: 16000, saleDate: daysAgo(15), customer: 'Beauty Palace' },
      { productId: 5, quantity: 8, sellingPrice: 12000, saleDate: daysAgo(10), customer: 'Tech Hub RW' },
      { productId: 2, quantity: 10, sellingPrice: 6000, saleDate: daysAgo(8), customer: 'Phone World' },
      { productId: 3, quantity: 20, sellingPrice: 6000, saleDate: daysAgo(5), customer: 'Wholesale Kigali' },
      { productId: 1, quantity: 1, sellingPrice: 420000, saleDate: daysAgo(3), customer: 'Direct Customer' },
      { productId: 5, quantity: 5, sellingPrice: 12000, saleDate: daysAgo(1), customer: 'Electronics Hub' },
    ];

    salesData.forEach(s => {
      const product = getById('products', s.productId);
      if (!product) return;
      const expenses = query('productExpenses', e => e.productId === s.productId);
      const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
      const totalCost = product.purchasePrice + totalExpenses;
      const costPerUnit = totalCost / product.quantity;
      const revenue = s.sellingPrice * s.quantity;
      const cost = costPerUnit * s.quantity;
      const profit = revenue - cost;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      insert('sales', { ...s, revenue, cost, profit, profitMargin, paymentStatus: 'paid' });
    });

    // Business Expenses
    const bizExpenses = [
      { title: 'Office Rent', amount: 300000, category: 'Rent', expenseDate: daysAgo(60), note: 'Monthly office rent' },
      { title: 'Electricity Bill', amount: 48000, category: 'Electricity', expenseDate: daysAgo(58), note: '' },
      { title: 'Internet Service', amount: 30000, category: 'Internet', expenseDate: daysAgo(58), note: 'Monthly broadband' },
      { title: 'Staff Salary', amount: 480000, category: 'Salary', expenseDate: daysAgo(30), note: 'Monthly salary' },
      { title: 'Office Rent', amount: 300000, category: 'Rent', expenseDate: daysAgo(30), note: 'Monthly office rent' },
      { title: 'Marketing - Social Media', amount: 72000, category: 'Marketing', expenseDate: daysAgo(20), note: 'Facebook ads' },
      { title: 'Fuel', amount: 36000, category: 'Fuel', expenseDate: daysAgo(10), note: 'Delivery fuel' },
      { title: 'Office Supplies', amount: 27000, category: 'Office Supplies', expenseDate: daysAgo(5), note: 'Stationery' },
    ];
    bizExpenses.forEach(e => insert('businessExpenses', e));

    localStorage.setItem(PREFIX + 'init_v2', '1');
  }

  // ── Domain-Specific Helpers ───────────────

  /** Calculate total expenses for a product */
  function getProductTotalExpenses(productId) {
    return sum('productExpenses', 'amount', e => e.productId === productId);
  }

  /** Get cost per unit for a product */
  function getProductCostPerUnit(productId) {
    const product = getById('products', productId);
    if (!product) return 0;
    const totalExpenses = getProductTotalExpenses(productId);
    const totalCost = parseFloat(product.purchasePrice || 0) + totalExpenses;
    return product.quantity > 0 ? totalCost / product.quantity : totalCost;
  }

  /** Get total landed cost for a product */
  function getProductTotalCost(productId) {
    const product = getById('products', productId);
    if (!product) return 0;
    const totalExpenses = getProductTotalExpenses(productId);
    return parseFloat(product.purchasePrice || 0) + totalExpenses;
  }

  /** Get current stock for a product */
  function getProductStock(productId) {
    const product = getById('products', productId);
    if (!product) return 0;
    const soldQty = sum('sales', 'quantity', s => s.productId === productId);
    return Math.max(0, (product.quantity || 0) - soldQty);
  }

  /** Get stock status: 'available' | 'low' | 'out' */
  function getStockStatus(productId, lowThreshold = 5) {
    const stock = getProductStock(productId);
    if (stock === 0) return 'out';
    if (stock <= lowThreshold) return 'low';
    return 'available';
  }

  /** Get enriched product (with computed fields) */
  function getEnrichedProduct(productId) {
    const product = getById('products', productId);
    if (!product) return null;
    const cat = getById('categories', product.categoryId);
    const supp = getById('suppliers', product.supplierId);
    const totalExpenses = getProductTotalExpenses(productId);
    const totalCost = parseFloat(product.purchasePrice || 0) + totalExpenses;
    const costPerUnit = product.quantity > 0 ? totalCost / product.quantity : totalCost;
    const currentStock = getProductStock(productId);
    const stockStatus = getStockStatus(productId);
    return {
      ...product,
      categoryName: cat?.name || 'N/A',
      supplierName: supp?.name || product.supplierName || 'N/A',
      totalExpenses,
      totalCost,
      costPerUnit,
      currentStock,
      stockStatus,
    };
  }

  /** Get all enriched products */
  function getAllEnrichedProducts() {
    return getAll('products').map(p => getEnrichedProduct(p.id)).filter(Boolean);
  }

  /** Get enriched sale (with product info) */
  function getEnrichedSale(saleId) {
    const sale = getById('sales', saleId);
    if (!sale) return null;
    const product = getById('products', sale.productId);
    return { ...sale, productName: product?.name || 'Unknown', productCode: product?.code || '' };
  }

  /** Get all enriched sales */
  function getAllEnrichedSales() {
    return getAll('sales').map(s => getEnrichedSale(s.id)).filter(Boolean)
      .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
  }

  /** Dashboard summary stats */
  function getDashboardStats() {
    const products = getAllEnrichedProducts();
    const sales = getAll('sales');
    const bizExp = getAll('businessExpenses');

    const totalProducts = products.length;
    const totalCategories = count('categories');
    const totalSuppliers = count('suppliers');

    const totalInvestment = products.reduce((a, p) => a + p.totalCost, 0);
    const inventoryValue = products.reduce((a, p) => a + p.costPerUnit * p.currentStock, 0);

    const totalRevenue = sum('sales', 'revenue');
    const totalProfit = sum('sales', 'profit');
    const totalImportExpenses = products.reduce((a, p) => a + p.totalExpenses, 0);
    const totalBizExpenses = sum('businessExpenses', 'amount');
    const totalExpenses = totalImportExpenses + totalBizExpenses;

    const lowStock = products.filter(p => p.stockStatus === 'low').length;
    const outOfStock = products.filter(p => p.stockStatus === 'out').length;

    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.saleDate === today);
    const salesToday = todaySales.reduce((a, s) => a + s.revenue, 0);
    const profitToday = todaySales.reduce((a, s) => a + s.profit, 0);

    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthSales = sales.filter(s => s.saleDate?.startsWith(thisMonth));
    const salesThisMonth = monthSales.reduce((a, s) => a + s.revenue, 0);
    const profitThisMonth = monthSales.reduce((a, s) => a + s.profit, 0);

    return {
      totalProducts, totalCategories, totalSuppliers,
      totalInvestment, inventoryValue,
      totalRevenue, totalProfit, totalExpenses,
      lowStock, outOfStock,
      salesToday, profitToday,
      salesThisMonth, profitThisMonth,
    };
  }

  /** Get monthly data for charts (last N months) */
  function getMonthlyData(months = 6) {
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toISOString().slice(0, 7);
      const label = d.toLocaleString((typeof I18n !== 'undefined' && I18n.getLang() === 'ar' ? 'ar-EG' : 'en'), { month: 'short', year: '2-digit' });

      const sales = query('sales', s => s.saleDate?.startsWith(month));
      const bizExp = query('businessExpenses', e => e.expenseDate?.startsWith(month));
      const revenue = sales.reduce((a, s) => a + (s.revenue || 0), 0);
      const profit = sales.reduce((a, s) => a + (s.profit || 0), 0);
      const expenses = bizExp.reduce((a, e) => a + (e.amount || 0), 0);
      result.push({ month, label, revenue, profit, expenses });
    }
    return result;
  }

  /** Get top selling products */
  function getTopProducts(limit = 5) {
    const products = getAll('products');
    return products.map(p => {
      const sales = query('sales', s => s.productId === p.id);
      const totalQty = sales.reduce((a, s) => a + s.quantity, 0);
      const totalRevenue = sales.reduce((a, s) => a + s.revenue, 0);
      return { ...p, totalQty, totalRevenue };
    }).sort((a, b) => b.totalQty - a.totalQty).slice(0, limit);
  }

  /** Generate auto product code */
  function generateProductCode() {
    const existing = getAll('products').map(p => p.code).filter(c => c?.startsWith('PRD-'));
    const nums = existing.map(c => parseInt(c.split('-')[1] || '0', 10)).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return 'PRD-' + String(next).padStart(3, '0');
  }

  return {
    getAll, getById, insert, update, remove, query, count, sum,
    clearAll, isInitialised, hashPassword, seed,
    getProductTotalExpenses, getProductCostPerUnit, getProductTotalCost,
    getProductStock, getStockStatus, getEnrichedProduct, getAllEnrichedProducts,
    getEnrichedSale, getAllEnrichedSales,
    getDashboardStats, getMonthlyData, getTopProducts, generateProductCode,
  };
})();
