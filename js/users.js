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
          <h3>${I18n.choose('Access Denied', 'تم رفض الوصول', 'Accès refusé')}</h3>
          <p>${I18n.choose('This administrative area is restricted to Admin accounts only.', 'هذه الصفحة مخصصة للمسؤولين فقط.', 'Cette zone administrative est réservée uniquement aux comptes administrateurs.')}</p>
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

    container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <div class="page-title">
          <h2>👥 ${I18n.choose('User & Role Management', 'إدارة المستخدمين والصلاحيات', 'Gestion des utilisateurs et des rôles')}</h2>
          <p>${users.length} ${I18n.choose('registered account(s) in system', 'حساب مسجل في النظام', 'compte(s) enregistré(s) dans le système')}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="Users.openAdd()">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            ${I18n.choose('Add New User', 'إضافة مستخدم جديد', 'Ajouter un nouvel utilisateur')}
          </button>
        </div>
      </div>

      <div class="card table-wrap" style="padding:0;overflow:hidden;">
        <table class="table" style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:rgba(255,255,255,0.03);text-align:left;border-bottom:1px solid var(--border-light);">
              <th style="padding:16px;">${I18n.choose('User', 'المستخدم', 'Utilisateur')}</th>
              <th style="padding:16px;">${I18n.choose('Username (Login ID)', 'اسم المستخدم (الدخول)', 'Nom d\'utilisateur (ID de connexion)')}</th>
              <th style="padding:16px;">${I18n.choose('Business', 'النشاط التجاري', 'Entreprise')}</th>
              <th style="padding:16px;">${I18n.choose('Role', 'الدور / الصلاحية', 'Rôle')}</th>
              <th style="padding:16px;">${I18n.choose('Registered Date', 'تاريخ التسجيل', 'Date d\'inscription')}</th>
              <th style="padding:16px;text-align:right;">${I18n.choose('Actions', 'الإجراءات', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${users.length ? users.map(u => renderRow(u, currentUser.id)).join('') : `
              <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">${I18n.choose('No users found', 'لا يوجد مستخدمين', 'Aucun utilisateur trouvé')}</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  function getRoleBadge(role) {
    const r = (role || 'staff').toLowerCase();
    if (r === 'admin') return `<span class="badge badge-purple" style="font-size:12px;padding:4px 10px;">🛡️ ${I18n.choose('Admin', 'مسؤول', 'Administrateur')}</span>`;
    if (r === 'manager') return `<span class="badge badge-blue" style="font-size:12px;padding:4px 10px;">👔 ${I18n.choose('Manager', 'مدير', 'Responsable')}</span>`;
    if (r === 'cashier') return `<span class="badge badge-green" style="font-size:12px;padding:4px 10px;">💵 ${I18n.choose('Cashier', 'كاشير', 'Caissier')}</span>`;
    return `<span class="badge badge-yellow" style="font-size:12px;padding:4px 10px;">👤 ${I18n.choose('Staff', 'موظف', 'Personnel')}</span>`;
  }

  function renderRow(u, currentUserId) {
    const initials = (u.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isMe = u.id === currentUserId || String(u.id) === String(currentUserId);
    const locale = I18n.getLang() === 'ar' ? 'ar-EG' : (I18n.getLang() === 'fr' ? 'fr-FR' : 'en-GB');

    return `
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);transition:var(--transition);" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
      <td style="padding:16px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(124,58,237,0.3);">${initials}</div>
          <div>
            <div style="font-weight:700;color:var(--text);">${u.name || 'Unnamed'} ${isMe ? `<span style="font-size:11px;color:var(--primary);margin-left:4px;">(${I18n.choose('You', 'أنت', 'Vous')})</span>` : ''}</div>
            <div style="font-size:12px;color:var(--text-muted);">${u.phone || ''}</div>
          </div>
        </div>
      </td>
      <td style="padding:16px;color:var(--text-muted);font-size:14px;font-weight:600;">${u.username || u.email || '—'}</td>
      <td style="padding:16px;font-weight:500;">${u.business || 'My Business'}</td>
      <td style="padding:16px;">${getRoleBadge(u.role)}</td>
      <td style="padding:16px;color:var(--text-muted);font-size:13px;">${u.createdAt ? new Date(u.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
      <td style="padding:16px;text-align:right;">
        <div style="display:inline-flex;gap:8px;">
          <button class="act-btn edit" onclick="Users.openEditRole(${u.id})" title="${I18n.choose('Edit Role', 'تعديل الصلاحية', 'Modifier le rôle')}">✏️</button>
          <button class="act-btn view" onclick="Users.openResetPassword(${u.id})" title="${I18n.choose('Reset Password', 'إعادة تعيين كلمة المرور', 'Réinitialiser le mot de passe')}">🔑</button>
          ${!isMe ? `<button class="act-btn del" onclick="Users.deleteUser(${u.id})" title="${I18n.choose('Delete User', 'حذف الحساب', 'Supprimer l\'utilisateur')}">🗑️</button>` : ''}
        </div>
      </td>
    </tr>`;
  }

  function openAdd() {
    UI.createModal('addUserModal', `👤 ${I18n.choose('Add Staff / Cashier', 'إضافة موظف / كاشير جديد', 'Ajouter un membre du personnel / caissier')}`,
      `<div class="form-grid">
        <div class="field">
          <label>${I18n.choose('Username (Login ID)', 'اسم المستخدم (تسجيل الدخول)', 'Nom d\'utilisateur (ID de connexion)')} <span class="req">*</span></label>
          <input class="input" id="addUserUsername" placeholder="e.g. cashier1, staff_ali" required>
        </div>
        <div class="field">
          <label>${I18n.choose('Full Name', 'الاسم الكامل', 'Nom complet')} <span class="req">*</span></label>
          <input class="input" id="addUserName" placeholder="e.g. John Doe" required>
        </div>
        <div class="field">
          <label>${I18n.choose('Initial Password', 'كلمة المرور الابتدائية', 'Mot de passe initial')} <span class="req">*</span></label>
          <input class="input" type="password" id="addUserPwd" placeholder="Min 6 chars" required>
        </div>
        <div class="field">
          <label>${I18n.choose('Role', 'الصلاحية / الدور', 'Rôle')} <span class="req">*</span></label>
          <select class="select" id="addUserRole">
            <option value="staff">${I18n.choose('Staff (Read/Write Sales)', 'موظف (Staff)', 'Personnel (Lecture/Écriture des ventes)')}</option>
            <option value="cashier">${I18n.choose('Cashier (Sales Only)', 'كاشير (Cashier)', 'Caissier (Ventes uniquement)')}</option>
            <option value="manager">${I18n.choose('Manager (Manage Inventory)', 'مدير (Manager)', 'Responsable (Gestion du stock)')}</option>
            <option value="admin">${I18n.choose('Admin (Full Access)', 'مسؤول عام (Admin)', 'Administrateur (Accès complet)')}</option>
          </select>
        </div>
        <div style="grid-column:1/-1;font-size:0.8rem;color:var(--text-muted);background:rgba(255,255,255,0.03);padding:10px;border-radius:8px;">
          💡 ${I18n.choose('No email verification needed. Staff can sign in immediately using this Username and Password.', 'لا حاجة للتحقق عبر البريد. يمكن للموظف الدخول فوراً باسم المستخدم وكلمة المرور هذه.', 'Aucune vérification d\'email requise. Le personnel peut se connecter immédiatement avec ce nom d\'utilisateur et ce mot de passe.')}
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal('addUserModal')">${t('btn_cancel') || I18n.choose('Cancel', 'إلغاء', 'Annuler')}</button>
       <button class="btn btn-primary" onclick="Users.saveNewUser()">💾 ${I18n.choose('Create Account', 'إنشاء الحساب', 'Créer un compte')}</button>`
    );
  }

  async function saveNewUser() {
    const username = document.getElementById('addUserUsername')?.value.trim();
    const name = document.getElementById('addUserName')?.value.trim();
    const password = document.getElementById('addUserPwd')?.value;
    const role = document.getElementById('addUserRole')?.value || 'staff';

    if (!username || !name || !password) {
      UI.toast('error', I18n.choose('Error', 'خطأ', 'Erreur'), I18n.choose('Please fill in all required fields.', 'يرجى ملء جميع الحقول المطلوبة', 'Veuillez remplir tous les champs requis.'));
      return;
    }
    if (password.length < 6) {
      UI.toast('error', I18n.choose('Password Error', 'خطأ في كلمة المرور', 'Erreur de mot de passe'), I18n.choose('Password must be at least 6 characters.', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل', 'Le mot de passe doit comporter au moins 6 caractères.'));
      return;
    }

    const users = typeof DB !== 'undefined' && DB.getRawAll ? DB.getRawAll('users') : DB.getAll('users');
    if (users.some(u => (u.username && u.username.toLowerCase() === username.toLowerCase()) || (u.email && u.email.toLowerCase() === username.toLowerCase()))) {
      UI.toast('error', I18n.choose('Error', 'خطأ', 'Erreur'), I18n.choose('An account with this username already exists.', 'اسم المستخدم هذا مسجل بالفعل', 'Un compte avec ce nom d\'utilisateur existe déjà.'));
      return;
    }

    const pwHash = await DB.hashPassword(password);
    const currentUser = Auth.currentUser();
    const tenantId = typeof DB !== 'undefined' && DB.getTenantId ? DB.getTenantId() : (currentUser?.company_id || currentUser?.id || 1);
    const generatedEmail = `${username}@${(currentUser?.company_name || 'store').replace(/[^a-z0-9]/gi, '')}.local`;
    const newUser = {
      username,
      name,
      email: generatedEmail,
      password: password,
      passwordHash: pwHash,
      password_hash: pwHash,
      role,
      company_id: currentUser?.company_id || tenantId,
      userId: tenantId,
      user_id: tenantId,
      adminId: tenantId,
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
      UI.toast('error', I18n.choose('Error', 'خطأ', 'Erreur'), err.message || I18n.choose('The server rejected this action.', 'رفض الخادم هذا الإجراء.', 'Le serveur a rejeté cette action.'));
      return;
    }
    UI.toast('success', I18n.choose('Success', 'تم الإنشاء', 'Succès'), I18n.choose('Account created! Staff can log in immediately.', 'تم إنشاء الحساب بنجاح! يمكن للموظف الدخول الآن.', 'Compte créé ! Le personnel peut se connecter immédiatement.'));
    UI.closeModal('addUserModal');
    render(document.getElementById('pageContent'));
  }

  function openEditRole(id) {
    _editUserId = id;
    const u = DB.getById('users', id);
    if (!u) return;

    UI.createModal('editRoleModal', `✏️ ${I18n.choose('Edit User Role', 'تعديل صلاحيات المستخدم', 'Modifier le rôle de l\'utilisateur')} — ${u.name}`,
      `<div class="form-grid">
        <div class="field">
          <label>${I18n.choose('Select New Role', 'اختر الدور الجديد', 'Sélectionner un nouveau rôle')}</label>
          <select class="select" id="editUserRole">
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>🛡️ ${I18n.choose('Admin - Full Access', 'مسؤول (Admin) - صلاحية كاملة', 'Administrateur - Accès complet')}</option>
            <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>👔 ${I18n.choose('Manager - Manage Inventory & Expenses', 'مدير (Manager) - إدارة المخزون والمصاريف', 'Responsable - Gestion du stock et des dépenses')}</option>
            <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>👤 ${I18n.choose('Staff - Record Sales & Products', 'موظف (Staff) - تسجيل المبيعات والمنتجات', 'Personnel - Enregistrer les ventes et produits')}</option>
            <option value="cashier" ${u.role === 'cashier' ? 'selected' : ''}>💵 ${I18n.choose('Cashier - Sales Only', 'كاشير (Cashier) - نقاط البيع فقط', 'Caissier - Ventes uniquement')}</option>
          </select>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal('editRoleModal')">${t('btn_cancel') || I18n.choose('Cancel', 'إلغاء', 'Annuler')}</button>
       <button class="btn btn-primary" onclick="Users.saveRole()">💾 ${I18n.choose('Save Role', 'حفظ الصلاحية', 'Enregistrer le rôle')}</button>`
    );
  }

  async function saveRole() {
    if (!_editUserId) return;
    const newRole = document.getElementById('editUserRole')?.value || 'staff';
    
    try {
      await DB.update('users', _editUserId, { role: newRole });
    } catch (err) {
      UI.toast('error', I18n.choose('Error', 'خطأ', 'Erreur'), err.message || I18n.choose('The server rejected this action.', 'رفض الخادم هذا الإجراء.', 'Le serveur a rejeté cette action.'));
      return;
    }
    UI.toast('success', I18n.choose('Role Updated', 'تم التحديث', 'Rôle mis à jour'), I18n.choose('User role permissions updated successfully!', 'تم تحديث صلاحيات المستخدم بنجاح', 'Les autorisations du rôle de l\'utilisateur ont été mises à jour avec succès !'));
    UI.closeModal('editRoleModal');
    render(document.getElementById('pageContent'));
  }

  function openResetPassword(id) {
    _editUserId = id;
    const u = DB.getById('users', id);
    if (!u) return;

    UI.createModal('resetPwdModal', `🔑 ${I18n.choose('Reset Password', 'إعادة تعيين كلمة المرور', 'Réinitialiser le mot de passe')} — ${u.name}`,
      `<div class="form-grid">
        <div class="field">
          <label>${I18n.choose('New Password', 'كلمة المرور الجديدة', 'Nouveau mot de passe')} <span class="req">*</span></label>
          <input class="input" type="password" id="newResetPwd" placeholder="Min 6 chars" required>
        </div>
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal('resetPwdModal')">${t('btn_cancel') || I18n.choose('Cancel', 'إلغاء', 'Annuler')}</button>
       <button class="btn btn-primary" style="background:#3b82f6;" onclick="Users.saveResetPassword()">🔑 ${I18n.choose('Update Password', 'تحديث كلمة المرور', 'Mettre à jour le mot de passe')}</button>`
    );
  }

  async function saveResetPassword() {
    if (!_editUserId) return;
    const pwd = document.getElementById('newResetPwd')?.value;
    if (!pwd || pwd.length < 6) {
      UI.toast('error', I18n.choose('Password Error', 'خطأ في كلمة المرور', 'Erreur de mot de passe'), I18n.choose('Password must be at least 6 characters.', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل', 'Le mot de passe doit comporter au moins 6 caractères.'));
      return;
    }

    const hash = await DB.hashPassword(pwd);
    try {
      await DB.update('users', _editUserId, { password: pwd, passwordHash: hash, password_hash: hash });
    } catch (err) {
      UI.toast('error', I18n.choose('Error', 'خطأ', 'Erreur'), err.message || I18n.choose('The server rejected this action.', 'رفض الخادم هذا الإجراء.', 'Le serveur a rejeté cette action.'));
      return;
    }
    UI.toast('success', I18n.choose('Password Reset', 'تم التحديث', 'Mot de passe réinitialisé'), I18n.choose('User password has been reset successfully!', 'تم تغيير كلمة المرور بنجاح', 'Le mot de passe de l\'utilisateur a été réinitialisé avec succès !'));
    UI.closeModal('resetPwdModal');
  }

  async function deleteUser(id) {
    const u = DB.getById('users', id);
    if (!u) return;

    const ok = await UI.confirm(
      I18n.choose('Confirm Deletion', 'تأكيد الحذف', 'Confirmer la suppression'),
      I18n.choose(`Are you sure you want to delete account "${u.name}"? This cannot be undone.`, `هل أنت متأكد من حذف حساب "${u.name}"؟ لا يمكن التراجع عن هذا الإجراء.`, `Êtes-vous sûr de vouloir supprimer le compte "${u.name}" ? Cette action est irréversible.`)
    );
    if (!ok) return;

    try {
      await DB.remove('users', id);
    } catch (err) {
      UI.toast('error', I18n.choose('Error', 'خطأ', 'Erreur'), err.message || I18n.choose('The server rejected this action.', 'رفض الخادم هذا الإجراء.', 'Le serveur a rejeté cette action.'));
      return;
    }
    UI.toast('success', I18n.choose('User Deleted', 'تم الحذف', 'Utilisateur supprimé'), I18n.choose('User account has been deleted.', 'تم حذف حساب المستخدم', 'Le compte utilisateur a été supprimé.'));
    render(document.getElementById('pageContent'));
  }

  return { render, openAdd, saveNewUser, openEditRole, saveRole, openResetPassword, saveResetPassword, deleteUser };
})();
