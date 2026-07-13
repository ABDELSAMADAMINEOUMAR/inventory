/* =============================================
   USERS.JS — User & Role Management Module
   Smart Import & Sales Management System
   ============================================= */

const Users = (() => {
  let _editUserId = null;

  async function render(container) {
    const currentUser = Auth.currentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛡️</div>
          <h3>${I18n.getLang() === 'ar' ? 'تم رفض الوصول' : 'Access Denied'}</h3>
          <p>${I18n.getLang() === 'ar' ? 'هذه الصفحة مخصصة للمسؤولين فقط.' : 'This administrative area is restricted to Admin accounts only.'}</p>
        </div>`;
      return;
    }

    let users = [];
    if (typeof ApiClient !== 'undefined' && await ApiClient.checkHealth()) {
      try {
        users = await ApiClient.getAll('users');
      } catch (e) {
        users = DB.getAll('users');
      }
    } else {
      users = DB.getAll('users');
    }
    const isBackend = typeof ApiClient !== 'undefined' && sessionStorage.getItem('sims_token');
    if (!isBackend) {
      const tenantId = typeof DB !== 'undefined' && DB.getTenantId ? DB.getTenantId() : null;
      if (tenantId && Array.isArray(users)) {
        users = users.filter(u => Number(u.id) === tenantId || Number(u.userId || u.user_id || u.adminId || u.ownerId) === tenantId);
      }
    }

    const isAr = I18n.getLang() === 'ar';

    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title">
          <h2>👥 ${isAr ? 'إدارة المستخدمين والصلاحيات' : 'User & Role Management'}</h2>
          <p>${users.length} ${isAr ? 'حساب مسجل في النظام' : 'registered account(s) in system'}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Users.openAdd()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            ${isAr ? 'إضافة مستخدم جديد' : 'Add New User'}
          </button>
        </div>
      </div>

      <div class="card table-wrap" style="padding:0;overflow:hidden;">
        <table class="table" style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:rgba(255,255,255,0.03);text-align:left;border-bottom:1px solid var(--border-light);">
              <th style="padding:16px;">${isAr ? 'المستخدم' : 'User'}</th>
              <th style="padding:16px;">${isAr ? 'اسم المستخدم (الدخول)' : 'Username (Login ID)'}</th>
              <th style="padding:16px;">${isAr ? 'النشاط التجاري' : 'Business'}</th>
              <th style="padding:16px;">${isAr ? 'الدور / الصلاحية' : 'Role'}</th>
              <th style="padding:16px;">${isAr ? 'تاريخ التسجيل' : 'Registered Date'}</th>
              <th style="padding:16px;text-align:right;">${isAr ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            ${users.length ? users.map(u => renderRow(u, currentUser.id)).join('') : `
              <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">${isAr ? 'لا يوجد مستخدمين' : 'No users found'}</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function getRoleBadge(role) {
    const isAr = I18n.getLang() === 'ar';
    const r = (role || 'staff').toLowerCase();
    if (r === 'admin') return `<span class="badge badge-purple" style="font-size:12px;padding:4px 10px;">🛡️ ${isAr ? 'مسؤول' : 'Admin'}</span>`;
    if (r === 'manager') return `<span class="badge badge-blue" style="font-size:12px;padding:4px 10px;">👔 ${isAr ? 'مدير' : 'Manager'}</span>`;
    if (r === 'cashier') return `<span class="badge badge-green" style="font-size:12px;padding:4px 10px;">💵 ${isAr ? 'كاشير' : 'Cashier'}</span>`;
    return `<span class="badge badge-yellow" style="font-size:12px;padding:4px 10px;">👤 ${isAr ? 'موظف' : 'Staff'}</span>`;
  }

  function renderRow(u, currentUserId) {
    const isAr = I18n.getLang() === 'ar';
    const initials = (u.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isMe = u.id === currentUserId || String(u.id) === String(currentUserId);

    return `
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:var(--transition);" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
      <td style="padding:16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(124,58,237,0.3);">${initials}</div>
          <div>
            <div style="font-weight:700;color:var(--text);">${u.name || 'Unnamed'} ${isMe ? `<span style="font-size:11px;color:var(--primary);margin-left:4px;">(${isAr ? 'أنت' : 'You'})</span>` : ''}</div>
            <div style="font-size:12px;color:var(--text-muted);">${u.phone || ''}</div>
          </div>
        </div>
      </td>
      <td style="padding:16px;color:var(--text-muted);font-size:14px;font-weight:600;">${u.username || u.email || '—'}</td>
      <td style="padding:16px;font-weight:500;">${u.business || 'My Business'}</td>
      <td style="padding:16px;">${getRoleBadge(u.role)}</td>
      <td style="padding:16px;color:var(--text-muted);font-size:13px;">${u.createdAt ? new Date(u.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
      <td style="padding:16px;text-align:right;">
        <div style="display:inline-flex;gap:8px;">
          <button class="act-btn edit" onclick="Users.openEditRole(${u.id})" title="${isAr ? 'تعديل الصلاحية' : 'Edit Role'}">✏️</button>
          <button class="act-btn view" onclick="Users.openResetPassword(${u.id})" title="${isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}">🔑</button>
          ${!isMe ? `<button class="act-btn del" onclick="Users.deleteUser(${u.id})" title="${isAr ? 'حذف الحساب' : 'Delete User'}">🗑️</button>` : ''}
        </div>
      </td>
    </tr>`;
  }

  function openAdd() {
    const isAr = I18n.getLang() === 'ar';
    UI.createModal('addUserModal', `👤 ${isAr ? 'إضافة موظف / كاشير جديد' : 'Add Staff / Cashier'}`,
      `<div class="form-grid">
        <div class="field">
          <label>${isAr ? 'اسم المستخدم (تسجيل الدخول)' : 'Username (Login ID)'} <span class="req">*</span></label>
          <input class="input" id="addUserUsername" placeholder="e.g. cashier1, staff_ali" required>
        </div>
        <div class="field">
          <label>${isAr ? 'الاسم الكامل' : 'Full Name'} <span class="req">*</span></label>
          <input class="input" id="addUserName" placeholder="e.g. John Doe" required>
        </div>
        <div class="field">
          <label>${isAr ? 'كلمة المرور الابتدائية' : 'Initial Password'} <span class="req">*</span></label>
          <input class="input" type="password" id="addUserPwd" placeholder="Min 6 chars" required>
        </div>
        <div class="field">
          <label>${isAr ? 'الصلاحية / الدور' : 'Role'} <span class="req">*</span></label>
          <select class="select" id="addUserRole">
            <option value="staff">${isAr ? 'موظف (Staff)' : 'Staff (Read/Write Sales)'}</option>
            <option value="cashier">${isAr ? 'كاشير (Cashier)' : 'Cashier (Sales Only)'}</option>
            <option value="manager">${isAr ? 'مدير (Manager)' : 'Manager (Manage Inventory)'}</option>
            <option value="admin">${isAr ? 'مسؤول عام (Admin)' : 'Admin (Full Access)'}</option>
          </select>
        </div>
        <div style="grid-column:1/-1;font-size:0.8rem;color:var(--text-muted);background:rgba(255,255,255,0.03);padding:10px;border-radius:8px;">
          💡 ${isAr ? 'لا حاجة للتحقق عبر البريد. يمكن للموظف الدخول فوراً باسم المستخدم وكلمة المرور هذه.' : 'No email verification needed. Staff can sign in immediately using this Username and Password.'}
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal('addUserModal')">${isAr ? 'إلغاء' : 'Cancel'}</button>
       <button class="btn btn-primary" onclick="Users.saveNewUser()">💾 ${isAr ? 'إنشاء الحساب' : 'Create Account'}</button>`
    );
  }

  async function saveNewUser() {
    const isAr = I18n.getLang() === 'ar';
    const username = document.getElementById('addUserUsername')?.value.trim();
    const name = document.getElementById('addUserName')?.value.trim();
    const password = document.getElementById('addUserPwd')?.value;
    const role = document.getElementById('addUserRole')?.value || 'staff';

    if (!username || !name || !password) {
      UI.toast('error', isAr ? 'خطأ' : 'Error', isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      UI.toast('error', isAr ? 'خطأ في كلمة المرور' : 'Password Error', isAr ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters.');
      return;
    }

    const users = typeof DB !== 'undefined' && DB.getRawAll ? DB.getRawAll('users') : DB.getAll('users');
    if (users.some(u => (u.username && u.username.toLowerCase() === username.toLowerCase()) || (u.email && u.email.toLowerCase() === username.toLowerCase()))) {
      UI.toast('error', isAr ? 'خطأ' : 'Error', isAr ? 'اسم المستخدم هذا مسجل بالفعل' : 'An account with this username already exists.');
      return;
    }

    const pwHash = await DB.hashPassword(password);
    const currentUser = Auth.currentUser();
    const generatedEmail = `${username}@${(currentUser?.company_name || 'store').replace(/[^a-z0-9]/gi, '')}.local`;
    const newUser = {
      username,
      name,
      email: generatedEmail,
      password: password,
      passwordHash: pwHash,
      password_hash: pwHash,
      role,
      is_active: true,
      must_change_password: false,
      phone: '',
      business: currentUser?.business || 'My Business',
      currency: currentUser?.currency || 'USD',
      createdAt: new Date().toISOString()
    };

    try {
      await DB.insert('users', newUser);
    } catch (err) {
      UI.toast('error', isAr ? 'خطأ' : 'Error', err.message || 'The server rejected this action.');
      return;
    }
    UI.toast('success', isAr ? 'تم الإنشاء' : 'Success', isAr ? 'تم إنشاء الحساب بنجاح! يمكن للموظف الدخول الآن.' : 'Account created! Staff can log in immediately.');
    UI.closeModal('addUserModal');
    render(document.getElementById('pageContent'));
  }

  function openEditRole(id) {
    _editUserId = id;
    const u = DB.getById('users', id);
    if (!u) return;
    const isAr = I18n.getLang() === 'ar';

    UI.createModal('editRoleModal', `✏️ ${isAr ? 'تعديل صلاحيات المستخدم' : 'Edit User Role'} — ${u.name}`,
      `<div class="form-grid">
        <div class="field">
          <label>${isAr ? 'اختر الدور الجديد' : 'Select New Role'}</label>
          <select class="select" id="editUserRole">
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>🛡️ ${isAr ? 'مسؤول (Admin) - صلاحية كاملة' : 'Admin - Full Access'}</option>
            <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>👔 ${isAr ? 'مدير (Manager) - إدارة المخزون والمصاريف' : 'Manager - Manage Inventory & Expenses'}</option>
            <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>👤 ${isAr ? 'موظف (Staff) - تسجيل المبيعات والمنتجات' : 'Staff - Record Sales & Products'}</option>
            <option value="cashier" ${u.role === 'cashier' ? 'selected' : ''}>💵 ${isAr ? 'كاشير (Cashier) - نقاط البيع فقط' : 'Cashier - Sales Only'}</option>
          </select>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal('editRoleModal')">${isAr ? 'إلغاء' : 'Cancel'}</button>
       <button class="btn btn-primary" onclick="Users.saveRole()">💾 ${isAr ? 'حفظ الصلاحية' : 'Save Role'}</button>`
    );
  }

  async function saveRole() {
    if (!_editUserId) return;
    const isAr = I18n.getLang() === 'ar';
    const newRole = document.getElementById('editUserRole')?.value || 'staff';
    
    try {
      await DB.update('users', _editUserId, { role: newRole });
    } catch (err) {
      UI.toast('error', isAr ? 'خطأ' : 'Error', err.message || 'The server rejected this action.');
      return;
    }
    UI.toast('success', isAr ? 'تم التحديث' : 'Role Updated', isAr ? 'تم تحديث صلاحيات المستخدم بنجاح' : 'User role permissions updated successfully!');
    UI.closeModal('editRoleModal');
    render(document.getElementById('pageContent'));
  }

  function openResetPassword(id) {
    _editUserId = id;
    const u = DB.getById('users', id);
    if (!u) return;
    const isAr = I18n.getLang() === 'ar';

    UI.createModal('resetPwdModal', `🔑 ${isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password'} — ${u.name}`,
      `<div class="form-grid">
        <div class="field">
          <label>${isAr ? 'كلمة المرور الجديدة' : 'New Password'} <span class="req">*</span></label>
          <input class="input" type="password" id="newResetPwd" placeholder="Min 6 chars" required>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal('resetPwdModal')">${isAr ? 'إلغاء' : 'Cancel'}</button>
       <button class="btn btn-primary" style="background:#3b82f6;" onclick="Users.saveResetPassword()">🔑 ${isAr ? 'تحديث كلمة المرور' : 'Update Password'}</button>`
    );
  }

  async function saveResetPassword() {
    if (!_editUserId) return;
    const isAr = I18n.getLang() === 'ar';
    const pwd = document.getElementById('newResetPwd')?.value;
    if (!pwd || pwd.length < 6) {
      UI.toast('error', isAr ? 'خطأ' : 'Error', isAr ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters.');
      return;
    }

    const hash = await DB.hashPassword(pwd);
    try {
      await DB.update('users', _editUserId, { password: pwd, passwordHash: hash, password_hash: hash });
    } catch (err) {
      UI.toast('error', isAr ? 'خطأ' : 'Error', err.message || 'The server rejected this action.');
      return;
    }
    UI.toast('success', isAr ? 'تم التحديث' : 'Password Reset', isAr ? 'تم تغيير كلمة المرور بنجاح' : 'User password has been reset successfully!');
    UI.closeModal('resetPwdModal');
  }

  async function deleteUser(id) {
    const isAr = I18n.getLang() === 'ar';
    const u = DB.getById('users', id);
    if (!u) return;

    const ok = await UI.confirm(
      isAr ? 'تأكيد الحذف' : 'Confirm Deletion',
      `${isAr ? 'هل أنت متأكد من حذف حساب' : 'Are you sure you want to delete account'} "${u.name}"? ${isAr ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This cannot be undone.'}`
    );
    if (!ok) return;

    try {
      await DB.remove('users', id);
    } catch (err) {
      UI.toast('error', isAr ? 'خطأ' : 'Error', err.message || 'The server rejected this action.');
      return;
    }
    UI.toast('success', isAr ? 'تم الحذف' : 'User Deleted', isAr ? 'تم حذف حساب المستخدم' : 'User account has been deleted.');
    render(document.getElementById('pageContent'));
  }

  return { render, openAdd, saveNewUser, openEditRole, saveRole, openResetPassword, saveResetPassword, deleteUser };
})();
