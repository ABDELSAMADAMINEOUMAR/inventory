/* =============================================
   SUPPLIERS.JS — Supplier Management Module
   ============================================= */

const Suppliers = (() => {
  let _editId = null;
  let _search = '';

  function render(container) {
    const supps = DB.getAll('suppliers');
    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title"><h2>🏭 ${t('page_suppliers')}</h2><p>${supps.length} ${t('supp_registered')}</p></div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Suppliers.openAdd()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${t('btn_add_supp')}
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-search">
          <svg class="filter-search-icon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input class="input filter-search" placeholder="${t('ph_supp_search')}" oninput="Suppliers.setSearch(this.value)">
        </div>
      </div>

      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>${t('th_supp')}</th><th>${t('th_country')}</th><th>${t('th_phone')}</th><th>${t('th_email')}</th><th>${t('nav_products')}</th><th>${t('th_notes')}</th><th>${t('th_actions')}</th></tr></thead>
        <tbody id="suppTbody"></tbody>
      </table></div></div>
    </div>`;
    renderTable();
  }

  function setSearch(q) { _search = q.toLowerCase(); renderTable(); }

  function renderTable() {
    const body = document.getElementById('suppTbody');
    if (!body) return;
    let data = DB.getAll('suppliers');
    if (_search) data = data.filter(s => s.name.toLowerCase().includes(_search) || s.country?.toLowerCase().includes(_search) || s.email?.toLowerCase().includes(_search));

    if (!data.length) {
      body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🏭</div><h3>${t('no_supp')}</h3><p>${t('add_first_supp')}</p><button class="btn btn-primary" onclick="Suppliers.openAdd()">${t('btn_add_supp')}</button></div></td></tr>`;
      return;
    }
    body.innerHTML = data.map(s => {
      const prodCount = DB.count('products', p => p.supplierId === s.id);
      return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">${s.name.charAt(0).toUpperCase()}</div>
            <div><div style="font-weight:600">${s.name}</div><div style="font-size:0.75rem;color:var(--text-muted)">${s.address || ''}</div></div>
          </div>
        </td>
        <td><span class="badge badge-info">${s.country || '—'}</span></td>
        <td class="td-muted">${s.phone || '—'}</td>
        <td class="td-muted">${s.email || '—'}</td>
        <td><span class="badge badge-purple">${prodCount} ${prodCount !== 1 ? t('products_count') : t('product_count')}</span></td>
        <td class="td-muted" style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.notes || '—'}</td>
        <td><div class="actions">
          <button class="act-btn edit" onclick="Suppliers.openEdit(${s.id})" title="${t('btn_edit')}">✏️</button>
          <button class="act-btn del"  onclick="Suppliers.delete(${s.id})" title="${t('btn_delete')}">🗑️</button>
        </div></td>
      </tr>`;
    }).join('');
  }

  function formBody(s = {}) {
    const countries = ['Egypt', 'Rwanda', 'Uganda', 'Kenya', 'Tanzania', 'Ethiopia', 'Ghana', 'Nigeria', 'South Africa', 'Morocco', 'USA', 'China', 'UAE', 'Turkey', 'India'];
    return `
    <div class="form-grid form-grid-2">
      <div class="field col-span-2">
        <label>${t('lbl_supp_name')} <span class="req">*</span></label>
        <input class="input" id="suppName" value="${s.name || ''}" placeholder="e.g. Cairo Electronics Co." required>
      </div>
      <div class="field">
        <label>${t('th_phone')}</label>
        <input class="input" id="suppPhone" value="${s.phone || ''}" placeholder="+20 12 345 6789">
      </div>
      <div class="field">
        <label>${t('th_email')}</label>
        <input class="input" type="email" id="suppEmail" value="${s.email || ''}" placeholder="contact@supplier.com">
      </div>
      <div class="field">
        <label>${t('th_country')}</label>
        <select class="select" id="suppCountry">
          <option value="">${t('sel_country')}</option>
          ${countries.map(c => `<option ${s.country === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>${t('lbl_address')}</label>
        <input class="input" id="suppAddr" value="${s.address || ''}" placeholder="${t('ph_supp_addr')}">
      </div>
      <div class="field col-span-2">
        <label>${t('th_notes')}</label>
        <textarea class="textarea" id="suppNotes" placeholder="${t('ph_supp_notes')}">${s.notes || ''}</textarea>
      </div>
    </div>`;
  }

  function openAdd() {
    _editId = null;
    UI.createModal('suppModal', `🏭 ${t('btn_add_supp')}`,
      formBody(),
      `<button class="btn btn-ghost" onclick="UI.closeModal('suppModal')">${t('btn_cancel')}</button>
       <button class="btn btn-primary" onclick="Suppliers.save()">💾 ${t('btn_save')}</button>`
    );
  }

  function openEdit(id) {
    _editId = id;
    const s = DB.getById('suppliers', id);
    if (!s) return;
    UI.createModal('suppModal', `✏️ ${t('edit_supp')}`,
      formBody(s),
      `<button class="btn btn-ghost" onclick="UI.closeModal('suppModal')">${t('btn_cancel')}</button>
       <button class="btn btn-primary" onclick="Suppliers.save()">💾 ${t('btn_save')}</button>`
    );
  }

  function save() {
    const name = document.getElementById('suppName')?.value.trim();
    if (!name) { UI.toast('error', 'Supplier name required'); return; }
    const data = {
      name,
      phone: document.getElementById('suppPhone')?.value.trim(),
      email: document.getElementById('suppEmail')?.value.trim(),
      country: document.getElementById('suppCountry')?.value,
      address: document.getElementById('suppAddr')?.value.trim(),
      notes: document.getElementById('suppNotes')?.value.trim(),
    };
    if (_editId) DB.update('suppliers', _editId, data);
    else DB.insert('suppliers', data);
    UI.closeModal('suppModal');
    UI.toast('success', _editId ? 'Supplier Updated' : 'Supplier Added');
    UI.navigate('suppliers');
  }

  async function del(id) {
    const s = DB.getById('suppliers', id);
    const c = DB.count('products', p => p.supplierId === id);
    if (c > 0) { UI.toast('error', 'Cannot Delete', `This supplier has ${c} product(s). Remove them first.`); return; }
    const ok = await UI.confirm(t('del_supp_title'), `"${s.name}" ${t('supp_del_msg')}`);
    if (!ok) return;
    DB.remove('suppliers', id);
    UI.toast('success', 'Supplier Deleted');
    UI.navigate('suppliers');
  }

  return { render, setSearch, openAdd, openEdit, save, delete: del };
})();
