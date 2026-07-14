/* =============================================
   CATEGORIES.JS — Category Management Module
   ============================================= */

const Categories = (() => {
  function render(container) {
    const cats = DB.getAll('categories');
    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title"><h2>🏷️ ${t('page_categories')}</h2><p>${cats.length} ${I18n.getLang() === 'ar' ? 'فئات نشطة' : 'categories'}</p></div>
        <div class="page-actions">
          ${UI.canEditProducts() ? `<button class="btn btn-primary" onclick="Categories.openAdd()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${t('btn_add_category')}
          </button>` : ''}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;" id="catGrid">
        ${cats.length ? cats.map(renderCard).join('') : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🏷️</div><h3>${I18n.getLang() === 'ar' ? 'لا توجد فئات بعد' : 'No categories yet'}</h3><p>${I18n.getLang() === 'ar' ? 'قم بإنشاء فئتك الأولى للبدء.' : 'Create your first product category to get started.'}</p><button class="btn btn-primary" onclick="Categories.openAdd()">${t('btn_add_category')}</button></div>`}
      </div>
    </div>`;
  }

  function renderCard(c) {
    const prodCount = DB.count('products', p => p.categoryId === c.id);
    const icons = ['📱', '👗', '🍎', '💄', '🏠', '🪑', '📦', '🛒', '🔧', '💊'];
    const icon = icons[c.id % icons.length] || '📦';
    return `
    <div class="card" style="padding:20px;transition:var(--transition)" onmouseover="this.style.borderColor='rgba(124,58,237,0.3)'" onmouseout="this.style.borderColor='var(--border-light)'">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
        <div style="width:48px;height:48px;border-radius:12px;background:rgba(124,58,237,0.12);display:flex;align-items:center;justify-content:center;font-size:24px">${icon}</div>
        <div class="actions">
          ${UI.canEditProducts() ? `<button class="act-btn edit" onclick="Categories.openEdit(${c.id})" title="${t('btn_edit')}">✏️</button>
          <button class="act-btn del"  onclick="Categories.delete(${c.id})" title="${t('btn_delete')}">🗑️</button>` : ''}
        </div>
      </div>
      <div style="font-size:1rem;font-weight:700;margin-bottom:4px">${c.name}</div>
      <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px">${c.description || (I18n.getLang() === 'ar' ? 'لا يوجد وصف' : 'No description')}</div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="badge badge-purple">${prodCount} ${I18n.getLang() === 'ar' ? 'منتجات' : 'product(s)'}</span>
      </div>
    </div>`;
  }

  function formBody(c = {}) {
    return `
    <div class="form-grid">
      <div class="field">
        <label>${I18n.getLang() === 'ar' ? 'اسم الفئة' : 'Category Name'} <span class="req">*</span></label>
        <input class="input" id="catName" value="${c.name || ''}" placeholder="e.g. Electronics" required>
      </div>
      <div class="field">
        <label>${t('lbl_desc')}</label>
        <textarea class="textarea" id="catDesc" placeholder="${I18n.getLang() === 'ar' ? 'وصف مختصر لهذه الفئة…' : 'Brief description of this category…'}">${c.description || ''}</textarea>
      </div>
    </div>`;
  }

  let _editId = null;

  function openAdd() {
    if (!UI.canEditProducts()) { UI.toast('error', 'Not Allowed', 'You do not have permission to add categories.'); return; }
    _editId = null;
    UI.createModal('catModal', `🏷️ ${t('btn_add_category')}`,
      formBody(),
      `<button class="btn btn-ghost" onclick="UI.closeModal('catModal')">${t('btn_cancel')}</button>
       <button class="btn btn-primary" onclick="Categories.save()">💾 ${t('btn_save')}</button>`
    );
  }

  function openEdit(id) {
    if (!UI.canEditProducts()) { UI.toast('error', 'Not Allowed', 'You do not have permission to edit categories.'); return; }
    _editId = id;
    const c = DB.getById('categories', id);
    if (!c) return;
    UI.createModal('catModal', `✏️ ${t('btn_edit')}`,
      formBody(c),
      `<button class="btn btn-ghost" onclick="UI.closeModal('catModal')">${t('btn_cancel')}</button>
       <button class="btn btn-primary" onclick="Categories.save()">💾 ${t('btn_update')}</button>`
    );
  }

  async function save(e) {
    if (e && e.preventDefault) e.preventDefault();
    const btn = document.querySelector('#catModal .btn-primary');
    if (UI.lockBtn(btn)) return;
    try {
      const name = document.getElementById('catName').value;
      const desc = document.getElementById('catDesc').value;
      if (!name.trim()) return;

      try {
        if (_editId) {
          await DB.update('categories', _editId, { name, description: desc });
          UI.toast('success', 'Category Updated');
        } else {
          await DB.insert('categories', { name, description: desc });
          UI.toast('success', 'Category Added');
        }
      } catch (err) {
        UI.toast('error', 'Not Allowed', err.message || 'The server rejected this action.');
        return;
      }

      UI.closeModal('catModal');
      render(document.getElementById('pageContent'));
    } finally {
      UI.unlockBtn(btn);
    }
  }


  async function del(id) {
    if (!UI.canEditProducts()) { UI.toast('error', 'Not Allowed', 'You do not have permission to delete categories.'); return; }
    const c = DB.getById('categories', id);
    const count = DB.count('products', p => p.categoryId === id);
    if (count > 0) { UI.toast('error', 'Cannot Delete', `This category has ${count} product(s). Move them first.`); return; }
    const ok = await UI.confirm(t('confirm_delete'), `"${c.name}" ${t('cannot_undo')}`);
    if (!ok) return;
    try {
      await DB.remove('categories', id);
    } catch (err) {
      UI.toast('error', 'Not Allowed', err.message || 'The server rejected this action.');
      return;
    }
    UI.toast('success', 'Category Deleted');
    UI.navigate('categories');
  }

  return { render, openAdd, openEdit, save, delete: del };
})();
