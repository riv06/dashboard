// Continuation of super-admin.js for managing super admins

// ========== SUPER ADMINS MANAGEMENT ==========

let superAdmins = [];

async function loadSuperAdmins() {
    try {
        const response = await auth.fetch('/api/super-admin/super-admins');
        superAdmins = await response.json();
        renderSuperAdmins();
    } catch (error) {
        console.error('Error loading super admins:', error);
    }
}

function renderSuperAdmins() {
    const tbody = document.getElementById('super-admins-table-body');

    if (!tbody) return; // Table doesn't exist yet

    if (superAdmins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay super administradores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = superAdmins.map(admin => `
    <tr>
      <td>${admin.id}</td>
      <td>${admin.username}</td>
      <td>${admin.name || '-'}</td>
      <td>${admin.email || '-'}</td>
      <td class="table-actions">
        <button class="btn btn-primary btn-sm" onclick="editSuperAdmin(${admin.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteSuperAdmin(${admin.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function openSuperAdminModal(adminId = null) {
    const modal = document.getElementById('super-admin-modal');
    const title = document.getElementById('super-admin-modal-title');
    const passwordField = document.getElementById('super-admin-password');

    if (!modal) return;

    if (adminId) {
        const admin = superAdmins.find(a => a.id === adminId);
        title.textContent = 'Editar Super Admin';
        document.getElementById('super-admin-id').value = admin.id;
        document.getElementById('super-admin-username').value = admin.username;
        document.getElementById('super-admin-username').disabled = true;
        passwordField.required = false;
        passwordField.value = '';
        document.getElementById('super-admin-name').value = admin.name || '';
        document.getElementById('super-admin-email').value = admin.email || '';
    } else {
        title.textContent = 'Nuevo Super Admin';
        document.getElementById('super-admin-form').reset();
        document.getElementById('super-admin-id').value = '';
        document.getElementById('super-admin-username').disabled = false;
        passwordField.required = true;
    }

    modal.classList.add('show');
}

function closeSuperAdminModal() {
    document.getElementById('super-admin-modal')?.classList.remove('show');
}

function editSuperAdmin(id) {
    openSuperAdminModal(id);
}

async function saveSuperAdmin() {
    const id = document.getElementById('super-admin-id').value;
    const password = document.getElementById('super-admin-password').value;

    const data = {
        username: document.getElementById('super-admin-username').value,
        name: document.getElementById('super-admin-name').value,
        email: document.getElementById('super-admin-email').value
    };

    if (password || !id) {
        data.password = password;
    }

    try {
        let response;
        if (id) {
            response = await auth.fetch(`/api/super-admin/super-admins/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await auth.fetch('/api/super-admin/super-admins', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            closeSuperAdminModal();
            await loadSuperAdmins();
            alert('Super admin guardado exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo guardar el super admin'));
        }
    } catch (error) {
        alert('Error al guardar super admin: ' + error.message);
    }
}

async function deleteSuperAdmin(id) {
    if (!confirm('¿Está seguro de eliminar este super administrador?')) return;

    try {
        const response = await auth.fetch(`/api/super-admin/super-admins/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadSuperAdmins();
            alert('Super admin eliminado exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo eliminar el super admin'));
        }
    } catch (error) {
        alert('Error al eliminar super admin: ' + error.message);
    }
}

// Update loadAllData to include super admins
const originalLoadAllData = loadAllData;
loadAllData = async function () {
    try {
        await Promise.all([
            loadSuperAdmins(),
            loadCompanies(),
            loadUsers(),
            loadSales(),
            loadCommissions()
        ]);
        updateStats();
    } catch (error) {
        console.error('Error loading data:', error);
    }
};

// Update loadSectionData to include super admins
const originalLoadSectionData = loadSectionData;
loadSectionData = async function (section) {
    switch (section) {
        case 'super-admins':
            await loadSuperAdmins();
            break;
        case 'companies':
            await loadCompanies();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'sales':
            await loadSales();
            break;
        case 'commissions':
            await loadCommissions();
            break;
    }
};
