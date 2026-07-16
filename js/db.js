/* =============================================
   DB.JS — localStorage Database Layer
   Smart Import & Sales Management System
   ============================================= */

const DB = (() => {
  const TABLES = ['users','categories','suppliers','products','productExpenses','sales','businessExpenses','companies'];
  const PREFIX = 'sims_';

  // ── Internal helpers ──────────────────────
  function _key(table) {
    return PREFIX + table;
  }

  function _apiEndpoint(table) {
    if (table === 'productExpenses') return 'product-expenses';
    if (table === 'businessExpenses') return 'business-expenses';
    if (table === 'companies') return 'platform/companies';
    return table;
  }

  function _normalizeRecord(table, r) {
    if (!r || typeof r !== 'object') return r;
    const copy = { ...r };
    if (table === 'users') {
      if (copy.password_hash !== undefined && copy.passwordHash === undefined) copy.passwordHash = copy.password_hash;
      if (copy.passwordHash !== undefined && copy.password_hash === undefined) copy.password_hash = copy.passwordHash;
    } else if (table === 'products') {
      if (copy.category !== undefined && copy.categoryId === undefined) copy.categoryId = copy.category;
      if (copy.categoryId !== undefined && copy.category === undefined) copy.category = copy.categoryId;
      if (copy.supplier !== undefined && copy.supplierId === undefined) copy.supplierId = copy.supplier;
      if (copy.supplierId !== undefined && copy.supplier === undefined) copy.supplier = copy.supplierId;
      if (copy.purchase_price !== undefined && copy.purchasePrice === undefined) copy.purchasePrice = copy.purchase_price;
      if (copy.purchasePrice !== undefined && copy.purchase_price === undefined) copy.purchase_price = copy.purchasePrice;
      if (copy.exchange_rate !== undefined && copy.exchangeRate === undefined) copy.exchangeRate = copy.exchange_rate;
      if (copy.exchangeRate !== undefined && copy.exchange_rate === undefined) copy.exchange_rate = copy.exchangeRate;
      if (copy.purchase_date !== undefined && copy.purchaseDate === undefined) copy.purchaseDate = copy.purchase_date;
      if (copy.purchaseDate !== undefined && copy.purchase_date === undefined) copy.purchase_date = copy.purchaseDate;
    } else if (table === 'productExpenses') {
      if (copy.expense_type !== undefined && copy.expenseType === undefined) copy.expenseType = copy.expense_type;
      if (copy.expenseType !== undefined && copy.expense_type === undefined) copy.expense_type = copy.expenseType;
      if (copy.product !== undefined && copy.productId === undefined) copy.productId = copy.product;
      if (copy.productId !== undefined && copy.product === undefined) copy.product = copy.productId;
    } else if (table === 'sales') {
      if (copy.product !== undefined && copy.productId === undefined) copy.productId = copy.product;
      if (copy.productId !== undefined && copy.product === undefined) copy.product = copy.productId;
      if (copy.selling_price !== undefined && copy.sellingPrice === undefined) copy.sellingPrice = copy.selling_price;
      if (copy.sellingPrice !== undefined && copy.selling_price === undefined) copy.selling_price = copy.sellingPrice;
      if (copy.sale_date !== undefined && copy.saleDate === undefined) copy.saleDate = copy.sale_date;
      if (copy.saleDate !== undefined && copy.sale_date === undefined) copy.sale_date = copy.saleDate;
      if (copy.profit_margin !== undefined && copy.profitMargin === undefined) copy.profitMargin = copy.profit_margin;
      if (copy.profitMargin !== undefined && copy.profit_margin === undefined) copy.profit_margin = copy.profitMargin;
      if (copy.payment_status !== undefined && copy.paymentStatus === undefined) copy.paymentStatus = copy.payment_status;
      if (copy.paymentStatus !== undefined && copy.payment_status === undefined) copy.payment_status = copy.paymentStatus;
      if (copy.amount_paid !== undefined && copy.amountPaid === undefined) copy.amountPaid = copy.amount_paid;
      if (copy.amountPaid !== undefined && copy.amount_paid === undefined) copy.amount_paid = copy.amountPaid;
      if (copy.due_date !== undefined && copy.dueDate === undefined) copy.dueDate = copy.due_date;
      if (copy.dueDate !== undefined && copy.due_date === undefined) copy.due_date = copy.dueDate;
    } else if (table === 'businessExpenses') {
      if (copy.expense_date !== undefined && copy.expenseDate === undefined) copy.expenseDate = copy.expense_date;
      if (copy.expenseDate !== undefined && copy.expense_date === undefined) copy.expense_date = copy.expenseDate;
    }
    const tId = getTenantId();
    if (copy.userId === undefined && copy.user_id === undefined && copy.adminId === undefined && copy.ownerId === undefined) {
      if (copy.user !== undefined) {
        copy.userId = copy.user;
        copy.user_id = copy.user;
      } else if (tId && table !== 'companies') {
        copy.userId = tId;
        copy.user_id = tId;
      }
    }
    return copy;
  }

  function _readTable(table) {
    try {
      const k = _key(table);
      let val = localStorage.getItem(k);
      const raw = JSON.parse(val || '[]');
      return Array.isArray(raw) ? raw.map(r => _normalizeRecord(table, r)) : [];
    } catch { return []; }
  }

  function _writeTable(table, data) {
    localStorage.setItem(_key(table), JSON.stringify(data));
    if ((table === 'products' || table === 'sales') && typeof UI !== 'undefined' && UI.updateStockBadge) {
      setTimeout(() => { try { UI.updateStockBadge(); } catch(e) {} }, 50);
    }
  }

  function _getOfflineQueueKey(tenantId) {
    const tid = tenantId || getTenantId() || 'anon';
    return PREFIX + 'offline_queue_' + tid;
  }

  function _addToOfflineQueue(table, action, recordId, data) {
    if (table === 'companies' || table === 'users') return;
    try {
      const key = _getOfflineQueueKey();
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push({
        id: 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        table,
        action,
        recordId,
        data: data || null,
        timestamp: _now()
      });
      localStorage.setItem(key, JSON.stringify(existing));
      console.log(`[Offline Queue] Added ${action} on ${table} to queue (${key}).`);
    } catch (e) {
      console.warn('Failed to add to offline queue:', e);
    }
  }

  function _nextId(table) {
    const rows = _readTable(table);
    if (!rows.length) return 1;
    return Math.max(...rows.map(r => r.id)) + 1;
  }

  function _now() { return new Date().toISOString(); }

  function getTenantId() {
    try {
      const sess = JSON.parse(sessionStorage.getItem('sims_session'));
      if (!sess) return null;
      if (sess.role === 'admin') return Number(sess.id);
      return Number(sess.userId || sess.user_id || sess.adminId || sess.ownerId || sess.id || 1);
    } catch (e) { return null; }
  }

  function _seedTenantCategories(tenantId) {
    if (!tenantId) return;
    const cats = [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Garments and fashion items' },
      { name: 'Food & Beverage', description: 'Consumable food and drink products' },
      { name: 'Cosmetics', description: 'Beauty and personal care products' },
      { name: 'Home Appliances', description: 'Household appliances and equipment' },
      { name: 'Furniture', description: 'Home and office furniture' },
    ];
    let rows = _readTable('categories');
    let nextId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    cats.forEach(c => {
      const row = _normalizeRecord('categories', { id: nextId++, userId: tenantId, user_id: tenantId, adminId: tenantId, ...c, createdAt: _now(), updatedAt: _now() });
      rows.push(row);
    });
    localStorage.setItem(_key('categories'), JSON.stringify(rows));
  }

  function _tenantRows(table) {
    const all = _readTable(table);
    if (table === 'companies') return all;
    const tenantId = getTenantId();
    if (!tenantId) return all;

    const uSess = typeof Auth !== 'undefined' && Auth.currentUser ? Auth.currentUser() : null;
    if (uSess && uSess.role === 'platform_owner') return all;

    if (table === 'users') {
      return all.filter(u => {
        const uId = Number(u.id);
        const uOwner = Number(u.userId || u.user_id || u.adminId || u.ownerId || u.user || 1);
        const uComp = Number(u.company_id || u.company || 0);
        return uId === tenantId || uOwner === tenantId || (uComp && uComp === tenantId);
      });
    }

    const filtered = all.filter(r => {
      const rOwner = r.userId || r.user_id || r.adminId || r.ownerId || r.user;
      if (rOwner === undefined || rOwner === null) return true;
      return Number(rOwner) === tenantId;
    });

    if (table === 'categories' && filtered.length === 0) {
      _seedTenantCategories(tenantId);
      return _readTable('categories').filter(r => {
        const rOwner = r.userId || r.user_id || r.adminId || r.ownerId || r.user;
        if (rOwner === undefined || rOwner === null) return true;
        return Number(rOwner) === tenantId;
      });
    }
    return filtered;
  }

  function _toServerPayload(table, data) {
    if (!data || typeof data !== 'object') return data;
    const p = { ...data };
    if (table === 'products') {
      if (p.categoryId !== undefined) p.category = (p.categoryId && !isNaN(p.categoryId)) ? parseInt(p.categoryId) : null;
      if (p.supplierId !== undefined) p.supplier = (p.supplierId && !isNaN(p.supplierId)) ? parseInt(p.supplierId) : null;
      if (p.purchasePrice !== undefined) p.purchase_price = parseFloat(p.purchasePrice) || 0;
      if (p.exchangeRate !== undefined) p.exchange_rate = parseFloat(p.exchangeRate) || 1.0;
      if (p.purchaseDate !== undefined) p.purchase_date = p.purchaseDate || null;
    } else if (table === 'productExpenses') {
      if (p.productId !== undefined) p.product = (p.productId && !isNaN(p.productId)) ? parseInt(p.productId) : null;
      if (p.expenseType !== undefined) p.expense_type = p.expenseType;
    } else if (table === 'sales') {
      if (p.productId !== undefined) p.product = (p.productId && !isNaN(p.productId)) ? parseInt(p.productId) : null;
      if (p.sellingPrice !== undefined) p.selling_price = parseFloat(p.sellingPrice) || 0;
      if (p.saleDate !== undefined) p.sale_date = p.saleDate || null;
      if (p.profitMargin !== undefined) p.profit_margin = parseFloat(p.profitMargin) || 0;
      if (p.paymentStatus !== undefined) p.payment_status = p.paymentStatus;
      if (p.amountPaid !== undefined) p.amount_paid = (p.amountPaid !== null && p.amountPaid !== '') ? parseFloat(p.amountPaid) : null;
      if (p.dueDate !== undefined) p.due_date = p.dueDate || null;
    } else if (table === 'businessExpenses') {
      if (p.expenseDate !== undefined) p.expense_date = p.expenseDate || null;
    } else if (table === 'inventoryEntries') {
      if (p.productId !== undefined) p.product = (p.productId && !isNaN(p.productId)) ? parseInt(p.productId) : null;
      if (p.entryType !== undefined) p.entry_type = p.entryType;
      if (p.entryDate !== undefined) p.entry_date = p.entryDate || null;
    } else if (table === 'users') {
      if (p.passwordHash !== undefined) p.password_hash = p.passwordHash;
      if (p.password !== undefined) p.password = p.password;
    }
    return p;
  }

  function getRawAll(table) { return _readTable(table); }

  // ── Public API ────────────────────────────

  /** Get all rows from a table */
  function getAll(table) { return _tenantRows(table); }

  /** Get a single row by id */
  function getById(table, id) {
    return _tenantRows(table).find(r => r.id === id || r.id == id || String(r.id) === String(id)) || null;
  }

  /** Insert a new row, returns the saved row (with id + timestamps) */
  async function insert(table, data) {
    const endpoint = _apiEndpoint(table);

    if (table === 'products' && (!data.code || data.code === 'Auto-generated' || data.code.trim() === '')) {
      data.code = generateProductCode();
    }

    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        const payload = _toServerPayload(table, data);
        const saved = await ApiClient.insert(endpoint, payload);
        const rows = _readTable(table);
        const row = _normalizeRecord(table, { ...data, ...saved });
        rows.push(row);
        _writeTable(table, rows);
        return row;
      } catch (err) {
        if (err.name !== 'AbortError' && !String(err.message).includes('Failed to fetch')) {
          throw err;
        }
      }
    }

    // Offline fallback (no backend reachable) — local-only, unchanged behavior
    const rows = _readTable(table);
    const id = _nextId(table);
    let tenantId = 1;
    try {
      if (table === 'users' && data && data.role === 'admin') {
        tenantId = id;
      } else {
        const tid = getTenantId();
        if (tid) tenantId = tid;
      }
    } catch (e) {}
    const row = _normalizeRecord(table, { id, userId: tenantId, user_id: tenantId, adminId: tenantId, ...data, createdAt: _now(), updatedAt: _now() });
    if (table === 'products' && (!row.code || row.code === 'Auto-generated' || row.code.trim() === '')) {
      row.code = generateProductCode();
    }
    rows.push(row);
    _writeTable(table, rows);
    _addToOfflineQueue(table, 'insert', row.id, row);
    return row;
  }

  /** Update a row by id, returns updated row or null */
  async function update(table, id, data) {
    const endpoint = _apiEndpoint(table);

    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        const payload = _toServerPayload(table, data);
        const saved = await ApiClient.update(endpoint, id, payload);
        const rows = _readTable(table);
        const idx = rows.findIndex(r => r.id === id || r.id == id);
        if (idx !== -1) {
          rows[idx] = _normalizeRecord(table, { ...rows[idx], ...data, ...saved });
          _writeTable(table, rows);
          return rows[idx];
        }
        return _normalizeRecord(table, { id, ...data, ...saved });
      } catch (err) {
        if (err.name !== 'AbortError' && !String(err.message).includes('Failed to fetch')) {
          throw err;
        }
      }
    }

    // Offline fallback (no backend reachable) — local-only, unchanged behavior
    const rows = _readTable(table);
    const idx = rows.findIndex(r => r.id === id || r.id == id);
    if (idx === -1) return null;
    const tenantId = getTenantId();
    if (tenantId && table !== 'companies') {
      if (table === 'users') {
        const uId = Number(rows[idx].id);
        const uOwner = Number(rows[idx].userId || rows[idx].user_id || rows[idx].adminId || rows[idx].ownerId || 1);
        if (uId !== tenantId && uOwner !== tenantId) return null;
      } else {
        const rOwner = Number(rows[idx].userId || rows[idx].user_id || rows[idx].adminId || rows[idx].ownerId || 1);
        if (rOwner !== tenantId) return null;
      }
    }
    const rowOwner = rows[idx].userId || rows[idx].user_id || rows[idx].adminId || rows[idx].ownerId || tenantId || 1;
    rows[idx] = _normalizeRecord(table, { ...rows[idx], ...data, userId: rowOwner, user_id: rowOwner, adminId: rowOwner, updatedAt: _now() });
    _writeTable(table, rows);
    _addToOfflineQueue(table, 'update', rows[idx].id, rows[idx]);
    return rows[idx];
  }

  /** Delete a row by id, returns true/false */
  async function remove(table, id) {
    const endpoint = _apiEndpoint(table);

    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      // Ask Django FIRST. If it rejects (403, 400, etc.), this throws
      // and nothing gets removed locally.
      await ApiClient.remove(endpoint, id); // throws on non-2xx

      const rows = _readTable(table);
      const idx = rows.findIndex(r => r.id === id || r.id == id);
      if (idx !== -1) {
        rows.splice(idx, 1);
        _writeTable(table, rows);
      }
      return true;
    }

    // Offline fallback (no backend reachable) — local-only, unchanged behavior
    const rows = _readTable(table);
    const idx = rows.findIndex(r => r.id === id || r.id == id);
    if (idx === -1) return false;
    const tenantId = getTenantId();
    if (tenantId) {
      if (table === 'users') {
        const uId = Number(rows[idx].id);
        const uOwner = Number(rows[idx].userId || rows[idx].user_id || rows[idx].adminId || rows[idx].ownerId || 1);
        if (uId !== tenantId && uOwner !== tenantId) return false;
      } else {
        const rOwner = Number(rows[idx].userId || rows[idx].user_id || rows[idx].adminId || rows[idx].ownerId || 1);
        if (rOwner !== tenantId) return false;
      }
    }
    rows.splice(idx, 1);
    _writeTable(table, rows);
    _addToOfflineQueue(table, 'remove', id, null);
    return true;
  }

  /** Query rows with a filter function */
  function query(table, filterFn) {
    return _tenantRows(table).filter(filterFn);
  }

  /** Count rows, optionally with filter */
  function count(table, filterFn) {
    const rows = _tenantRows(table);
    return filterFn ? rows.filter(filterFn).length : rows.length;
  }

  /** Sum a numeric field, optionally with filter */
  function sum(table, field, filterFn) {
    const rows = filterFn ? _tenantRows(table).filter(filterFn) : _tenantRows(table);
    return rows.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);
  }

  /** Clear all data (factory reset) */
  function clearAll() {
    TABLES.forEach(t => localStorage.removeItem(_key(t)));
  }

  /** Clear only cached tenant data tables right on logout or account switch */
  function clearTenantCache() {
    const dataTables = ['products', 'categories', 'suppliers', 'sales', 'businessExpenses', 'productExpenses', 'audit_logs', 'notifications'];
    dataTables.forEach(t => {
      localStorage.removeItem(_key(t));
      sessionStorage.removeItem(_key(t));
    });
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

  /** Seed the database with clean deployment data */
  async function seed() {
    if (localStorage.getItem(PREFIX + 'clean_deploy_production_v3') !== '1') {
      TABLES.forEach(t => localStorage.removeItem(_key(t)));
      localStorage.setItem(PREFIX + 'clean_deploy_production_v3', '1');
    }
    if (isInitialised()) return;

    // Seed ONLY the Platform Super Owner account for fresh production management
    const platHash = await hashPassword('123456');
    insert('users', { name: 'Platform Super Owner', username: 'abdouamine@gmail.com', email: 'abdouamine@gmail.com', passwordHash: platHash, role: 'platform_owner', phone: '+18005550000', business: 'SaaS Platform', currency: 'USD' });

    // Seed empty clean categories
    const cats = [
      { name: 'General', description: 'General merchandise' },
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Garments and fashion items' },
      { name: 'Food & Beverage', description: 'Consumable food and drink products' }
    ];
    cats.forEach(c => insert('categories', c));

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

  /** Get all enriched products optimized O(N) */
  function getAllEnrichedProducts() {
    const products = getAll('products');
    const categories = getAll('categories');
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const suppliers = getAll('suppliers');
    const suppMap = new Map(suppliers.map(s => [s.id, s.name]));

    const sales = getAll('sales');
    const soldQtyMap = new Map();
    for (let i = 0; i < sales.length; i++) {
      const s = sales[i];
      soldQtyMap.set(s.productId, (soldQtyMap.get(s.productId) || 0) + (s.quantity || 0));
    }

    const expenses = getAll('productExpenses');
    const expMap = new Map();
    for (let i = 0; i < expenses.length; i++) {
      const e = expenses[i];
      expMap.set(e.productId, (expMap.get(e.productId) || 0) + parseFloat(e.amount || 0));
    }

    return products.map(product => {
      const totalExpenses = expMap.get(product.id) || 0;
      const totalCost = parseFloat(product.purchasePrice || 0) + totalExpenses;
      const costPerUnit = product.quantity > 0 ? totalCost / product.quantity : totalCost;
      const soldQty = soldQtyMap.get(product.id) || 0;
      const currentStock = Math.max(0, (product.quantity || 0) - soldQty);
      const stockStatus = currentStock === 0 ? 'out' : (currentStock <= 5 ? 'low' : 'available');
      return {
        ...product,
        categoryName: catMap.get(product.categoryId) || 'N/A',
        supplierName: suppMap.get(product.supplierId) || product.supplierName || 'N/A',
        totalExpenses,
        totalCost,
        costPerUnit,
        currentStock,
        stockStatus,
      };
    });
  }

  /** Get enriched sale (with product info and verified financial figures) */
  function getEnrichedSale(saleId) {
    const sale = getById('sales', saleId);
    if (!sale) return null;
    const product = getEnrichedProduct(sale.productId);
    const qty = Number(sale.quantity || 0);
    const sellingPrice = Number(sale.sellingPrice !== undefined ? sale.sellingPrice : (sale.selling_price || 0));
    const cpu = product ? Number(product.costPerUnit || 0) : 0;

    let revenue = (sale.revenue !== undefined && sale.revenue !== null && !isNaN(sale.revenue)) ? Number(sale.revenue) : (sellingPrice * qty);
    if (revenue === 0 && sellingPrice * qty > 0) revenue = sellingPrice * qty;

    let cost = (sale.cost !== undefined && sale.cost !== null && !isNaN(sale.cost)) ? Number(sale.cost) : (cpu * qty);
    if (cost === 0 && cpu * qty > 0) cost = cpu * qty;

    let profit = (sale.profit !== undefined && sale.profit !== null && !isNaN(sale.profit)) ? Number(sale.profit) : (revenue - cost);
    if ((profit === 0 || isNaN(profit)) && (revenue !== cost || revenue > 0)) profit = revenue - cost;

    const pmRaw = sale.profitMargin !== undefined ? sale.profitMargin : sale.profit_margin;
    let profitMargin = (pmRaw !== undefined && pmRaw !== null && !isNaN(pmRaw)) ? Number(pmRaw) : (revenue > 0 ? (profit / revenue) * 100 : 0);
    if ((profitMargin === 0 || isNaN(profitMargin)) && profit !== 0 && revenue > 0) profitMargin = (profit / revenue) * 100;

    return {
      ...sale,
      revenue, cost, profit, profitMargin,
      sellingPrice,
      productName: product?.name || 'Unknown',
      productCode: product?.code || ''
    };
  }

  /** Get all enriched sales optimized O(N) */
  function getAllEnrichedSales() {
    const products = getAllEnrichedProducts();
    const prodMap = new Map(products.map(p => [p.id, p]));
    return getAll('sales').map(sale => {
      const product = prodMap.get(sale.productId);
      const qty = Number(sale.quantity || 0);
      const sellingPrice = Number(sale.sellingPrice !== undefined ? sale.sellingPrice : (sale.selling_price || 0));
      const cpu = product ? Number(product.costPerUnit || 0) : 0;

      let revenue = (sale.revenue !== undefined && sale.revenue !== null && !isNaN(sale.revenue)) ? Number(sale.revenue) : (sellingPrice * qty);
      if (revenue === 0 && sellingPrice * qty > 0) revenue = sellingPrice * qty;

      let cost = (sale.cost !== undefined && sale.cost !== null && !isNaN(sale.cost)) ? Number(sale.cost) : (cpu * qty);
      if (cost === 0 && cpu * qty > 0) cost = cpu * qty;

      let profit = (sale.profit !== undefined && sale.profit !== null && !isNaN(sale.profit)) ? Number(sale.profit) : (revenue - cost);
      if ((profit === 0 || isNaN(profit)) && (revenue !== cost || revenue > 0)) profit = revenue - cost;

      const pmRaw = sale.profitMargin !== undefined ? sale.profitMargin : sale.profit_margin;
      let profitMargin = (pmRaw !== undefined && pmRaw !== null && !isNaN(pmRaw)) ? Number(pmRaw) : (revenue > 0 ? (profit / revenue) * 100 : 0);
      if ((profitMargin === 0 || isNaN(profitMargin)) && profit !== 0 && revenue > 0) profitMargin = (profit / revenue) * 100;

      return {
        ...sale,
        revenue, cost, profit, profitMargin,
        sellingPrice,
        productName: product?.name || 'Unknown',
        productCode: product?.code || ''
      };
    }).sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
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
      const locale = (typeof I18n !== 'undefined' && I18n.choose) ? I18n.choose('en', 'ar-EG', 'fr-FR') : 'en';
      const label = d.toLocaleString(locale, { month: 'short', year: '2-digit' });

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

  async function flushOfflineQueue() {
    if (typeof ApiClient === 'undefined') return 0;
    try {
      const isOnline = await ApiClient.checkHealth();
      if (!isOnline) return 0;
      const key = _getOfflineQueueKey();
      const queue = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(queue) || queue.length === 0) return 0;

      console.log(`[Offline Queue] Flushing ${queue.length} items to Django backend...`);
      let successCount = 0;
      const remaining = [];

      for (const item of queue) {
        try {
          const endpoint = _apiEndpoint(item.table);
          if (item.action === 'insert') {
            const payload = _toServerPayload(item.table, item.data);
            await ApiClient.insert(endpoint, payload);
          } else if (item.action === 'update') {
            const payload = _toServerPayload(item.table, item.data);
            await ApiClient.update(endpoint, item.recordId, payload);
          } else if (item.action === 'remove') {
            await ApiClient.remove(endpoint, item.recordId);
          }
          successCount++;
        } catch (err) {
          console.warn(`[Offline Queue] Failed item ${item.id} (${item.action} on ${item.table}):`, err);
          if (err.name === 'AbortError' || String(err.message).includes('Failed to fetch')) {
            remaining.push(item);
          }
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(key, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(key);
      }
      if (successCount > 0) {
        console.log(`[Offline Queue] Successfully flushed ${successCount} offline records to Django!`);
      }
      return successCount;
    } catch (e) {
      console.error('Error flushing offline queue:', e);
      return 0;
    }
  }

  async function syncFromBackend() {
    if (typeof ApiClient === 'undefined') return false;
    try {
      const isOnline = await ApiClient.checkHealth();
      if (!isOnline) {
        console.warn('Django API is offline or unreachable. Using local cache.');
        return false;
      }
      await flushOfflineQueue();
      for (const table of TABLES) {
        if (table === 'users') continue;
        const endpoint = _apiEndpoint(table);
        try {
          const serverData = await ApiClient.getAll(endpoint);
          if (Array.isArray(serverData)) {
            const tenantId = getTenantId();
            const normalized = serverData.map(r => {
              const rec = _normalizeRecord(table, r);
              if (tenantId && rec.userId === undefined && rec.user_id === undefined && rec.adminId === undefined && rec.ownerId === undefined && rec.user === undefined) {
                rec.userId = tenantId;
                rec.user_id = tenantId;
              }
              return rec;
            });
            localStorage.setItem(_key(table), JSON.stringify(normalized));
          }
        } catch (err) {
          console.warn(`Failed to sync table ${table} from Django API:`, err);
        }
      }
      console.log('Successfully synchronized all data from Django backend!');
      return true;
    } catch (e) {
      console.error('Failed during syncFromBackend:', e);
      return false;
    }
  }

  return {
    getAll, getRawAll, getTenantId, getById, insert, update, remove, query, count, sum,
    clearAll, clearTenantCache, flushOfflineQueue, isInitialised, hashPassword, seed, syncFromBackend,
    getProductTotalExpenses, getProductCostPerUnit, getProductTotalCost,
    getProductStock, getStockStatus, getEnrichedProduct, getAllEnrichedProducts,
    getEnrichedSale, getAllEnrichedSales,
    getDashboardStats, getMonthlyData, getTopProducts, generateProductCode,
  };
})();
