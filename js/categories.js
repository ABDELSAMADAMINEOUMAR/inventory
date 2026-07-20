/* =============================================
   CATEGORIES.JS — Category Management Module
   ============================================= */

const Categories = (() => {
  function render(container) {
    const cats = DB.getAll('categories');
    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title" style="display:flex;align-items:center;gap:10px;"><h2>${UI.icon('tag', '', 24)} ${t('page_categories')}</h2><p>${cats.length} ${I18n.choose('categories', 'فئات نشطة', 'catégories')}</p></div>
        <div class="page-actions">
          ${UI.canEditProducts() ? `<button class="btn btn-primary" onclick="Categories.openAdd()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${t('btn_add_category')}
          </button>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;" id="catGrid">
        ${cats.length ? cats.map(renderCard).join('') : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${UI.icon('tag', '', 32)}</div><h3>${I18n.choose('No categories yet', 'لا توجد فئات بعد', 'Aucune catégorie pour le moment')}</h3><p>${I18n.choose('Create your first product category to get started.', 'قم بإنشاء فئتك الأولى للبدء.', 'Créez votre première catégorie pour commencer.')}</p><button class="btn btn-primary" onclick="Categories.openAdd()">${t('btn_add_category')}</button></div>`}
      </div>
    </div>`;
  }

  function getSmartIcon(c) {
    if (c.icon && typeof c.icon === 'string' && c.icon.trim()) {
      const val = c.icon.trim();
      if (val.startsWith('<svg')) return val;
      if (typeof UI !== 'undefined' && UI.icons && UI.icons[val]) return UI.icon(val, '', 24);
    }
    const name = (c.name || '').toLowerCase();
    if (/electr|phone|mobile|comput|laptop|tech|إلكترون|هواتف|حاسوب|جوال|أجهزة|électr/.test(name)) return UI.icon('monitor', '', 24);
    if (/cloth|fashion|wear|dress|shirt|shoe|ملابس|أزياء|أحذية|vêtement|mode/.test(name)) return UI.icon('tag', '', 24);
    if (/food|grocer|fruit|meat|drink|beverag|طعام|أغذية|فواكه|مشروب|بقالة|nourri/.test(name)) return UI.icon('coffee', '', 24);
    if (/cosmet|beaut|makeup|perfum|تجميل|عطور|مكياج|beauté/.test(name)) return UI.icon('star', '', 24);
    if (/home|furnit|kitchen|house|أثاث|منزل|مطبخ|maison/.test(name)) return UI.icon('home', '', 24);
    if (/tool|hardwar|auto|car|repair|أدوات|معدات|سيارات|قطع|outil/.test(name)) return UI.icon('tool', '', 24);
    if (/med|health|pharm|drug|أدوية|صحة|صيدل|santé/.test(name)) return UI.icon('activity', '', 24);
    if (/book|paper|office|station|كتب|مكتب|قرطاس/.test(name)) return UI.icon('book', '', 24);
    if (/toy|game|kid|baby|ألعاب|أطفال|jouet/.test(name)) return UI.icon('gift', '', 24);
    return UI.icon('layers', '', 24);
  }

  function renderCard(c) {
    const prodCount = DB.count('products', p => p.categoryId === c.id);
    const icon = getSmartIcon(c);
    return `
    <div class="card" style="padding:20px;transition:var(--transition)" onmouseover="this.style.borderColor='rgba(124,58,237,0.3)'" onmouseout="this.style.borderColor='var(--border-light)'">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
        <div style="width:48px;height:48px;border-radius:12px;background:rgba(124,58,237,0.12);color:var(--primary);display:flex;align-items:center;justify-content:center;">${icon}</div>
        <div class="actions">
          ${UI.canEditProducts() ? `<button class="act-btn edit" onclick="Categories.openEdit(${c.id})" title="${t('btn_edit')}">${UI.icon('edit', '', 16)}</button>
          <button class="act-btn del"  onclick="Categories.delete(${c.id})" title="${t('btn_delete')}">${UI.icon('trash', '', 16)}</button>` : ''}
        </div>
      </div>
      <div style="font-size:1rem;font-weight:700;margin-bottom:4px">${c.name}</div>
      <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px">${c.description || I18n.choose('No description', 'لا يوجد وصف', 'Aucune description')}</div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="badge badge-purple">${prodCount} ${I18n.choose('product(s)', 'منتجات', 'produit(s)')}</span>
      </div>
    </div>`;
  }

  function formBody(c = {}) {
    return `
    <div class="form-grid">
      <div class="field">
        <label>${I18n.choose('Category Name', 'اسم الفئة', 'Nom de la catégorie')} <span class="req">*</span></label>
        <input class="input" id="catName" value="${c.name || ''}" placeholder="e.g. Electronics or ملابس" required>
      </div>
      <div class="field">
        <label>${I18n.choose('Category Icon Identifier (Optional)', 'معرف أيقونة الفئة (اختياري)', 'Identifiant d\'icône (Optionnel)')}</label>
        <input class="input" id="catIcon" value="${c.icon || ''}" placeholder="e.g. monitor, tag, coffee, home, layers" style="max-width:240px;">
      </div>
      <div class="field" style="grid-column:1/-1">
        <label>${t('lbl_desc')}</label>
        <textarea class="textarea" id="catDesc" placeholder="${I18n.choose('Brief description of this category…', 'وصف مختصر لهذه الفئة…', 'Brève description de cette catégorie…')}">${c.description || ''}</textarea>
      </div>
    </div>`;
  }

  let _editId = null;

  function openAdd() {
    if (!UI.canEditProducts()) { UI.toast('error', I18n.choose('Not Allowed', 'غير مسموح', 'Non autorisé'), I18n.choose('You do not have permission to add categories.', 'ليس لديك صلاحية لإضافة فئات.', 'Vous n\'avez pas la permission d\'ajouter des catégories.')); return; }
    _editId = null;
    UI.createModal('catModal', `${UI.icon('tag', '', 20)} ${t('btn_add_category')}`,
      formBody(),
      `<button class="btn btn-ghost" onclick="UI.closeModal('catModal')">${t('btn_cancel')}</button>
       <button class="btn btn-primary" onclick="Categories.save()">${UI.icon('save', '', 16)} ${t('btn_save')}</button>`
    );
  }

  function openEdit(id) {
    if (!UI.canEditProducts()) { UI.toast('error', I18n.choose('Not Allowed', 'غير مسموح', 'Non autorisé'), I18n.choose('You do not have permission to edit categories.', 'ليس لديك صلاحية لتعديل الفئات.', 'Vous n\'avez pas la permission de modifier des catégories.')); return; }
    _editId = id;
    const c = DB.getById('categories', id);
    if (!c) return;
    UI.createModal('catModal', `${UI.icon('edit', '', 20)} ${t('btn_edit')}`,
      formBody(c),
      `<button class="btn btn-ghost" onclick="UI.closeModal('catModal')">${t('btn_cancel')}</button>
       <button class="btn btn-primary" onclick="Categories.save()">${UI.icon('save', '', 16)} ${t('btn_update')}</button>`
    );
  }

  async function save(e) {
    if (e && e.preventDefault) e.preventDefault();
    const btn = document.querySelector('#catModal .btn-primary');
    if (UI.lockBtn(btn)) return;
    try {
      const name = document.getElementById('catName').value;
      const desc = document.getElementById('catDesc').value;
      const icon = (document.getElementById('catIcon')?.value || '').trim();
      if (!name.trim()) return;

      try {
        if (_editId) {
          await DB.update('categories', _editId, { name, description: desc, icon });
          UI.toast('success', I18n.choose('Category Updated', 'تم تحديث الفئة', 'Catégorie mise à jour'));
        } else {
          await DB.insert('categories', { name, description: desc, icon });
          UI.toast('success', I18n.choose('Category Added', 'تمت إضافة الفئة', 'Catégorie ajoutée'));
        }
      } catch (err) {
        UI.toast('error', I18n.choose('Not Allowed', 'غير مسموح', 'Non autorisé'), err.message || I18n.choose('The server rejected this action.', 'رفض الخادم هذا الإجراء.', 'Le serveur a rejeté cette action.'));
        return;
      }

      UI.closeModal('catModal');
      render(document.getElementById('pageContent'));
    } finally {
      UI.unlockBtn(btn);
    }
  }


  async function del(id) {
    if (!UI.canEditProducts()) { UI.toast('error', I18n.choose('Not Allowed', 'غير مسموح', 'Non autorisé'), I18n.choose('You do not have permission to delete categories.', 'ليس لديك صلاحية لحذف الفئات.', 'Vous n\'avez pas la permission de supprimer des catégories.')); return; }
    const c = DB.getById('categories', id);
    const count = DB.count('products', p => p.categoryId === id);
    if (count > 0) { UI.toast('error', I18n.choose('Cannot Delete', 'لا يمكن الحذف', 'Suppression impossible'), I18n.choose(`This category has ${count} product(s). Move them first.`, `تحتوي هذه الفئة على ${count} منتج. انقلها أولاً.`, `Cette catégorie contient ${count} produit(s). Déplacez-les d'abord.`)); return; }
    const ok = await UI.confirm(t('confirm_delete'), `"${c.name}" ${t('cannot_undo')}`);
    if (!ok) return;
    try {
      await DB.remove('categories', id);
    } catch (err) {
      UI.toast('error', I18n.choose('Not Allowed', 'غير مسموح', 'Non autorisé'), err.message || I18n.choose('The server rejected this action.', 'رفض الخادم هذا الإجراء.', 'Le serveur a rejeté cette action.'));
      return;
    }
    UI.toast('success', I18n.choose('Category Deleted', 'تم حذف الفئة', 'Catégorie supprimée'));
    UI.navigate('categories');
  }

  return { render, openAdd, openEdit, save, delete: del };
})();
