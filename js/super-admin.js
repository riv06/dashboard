// Super Admin Dashboard JavaScript
requireAuth();
showUserInfo();

// Current state
let currentSection = 'overview';
let superAdmins = [];
let companies = [];
let users = [];
let sales = [];
let commissions = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setupNavigation();
});

// Setup navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
        });
    });
}

// Switch sections
function switchSection(section) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');

    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.add('hidden');
    });

    // Show selected section
    document.getElementById(`section-${section}`)?.classList.remove('hidden');

    currentSection = section;

    // Load section data
    loadSectionData(section);
}

// Load all data
async function loadAllData() {
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
}

// Load section data
async function loadSectionData(section) {
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
}

// Update stats
function updateStats() {
    document.getElementById('stat-companies').textContent = companies.length;
    document.getElementById('stat-users').textContent = users.length;
    document.getElementById('stat-tickets').textContent = sales.length;

    const totalCommissions = commissions.reduce((sum, c) => sum + parseFloat(c.total_commissions || 0), 0);
    document.getElementById('stat-commissions').textContent = `$${totalCommissions.toFixed(2)}`;
}

// ========== SUPER ADMINS ==========

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

    if (!tbody) return;

    if (superAdmins.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay super administradores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = superAdmins.map(admin => `
    <tr>
      <td>${admin.id}</td>
      <td>${admin.username}</td>
      <td>${admin.name || '-'}</td>
      <td>${admin.email || '-'}</td>
      <td>${new Date(admin.created_at).toLocaleDateString()}</td>
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

// ========== COMPANIES ==========

async function loadCompanies() {
    try {
        const response = await auth.fetch('/api/super-admin/companies');
        companies = await response.json();
        renderCompanies();
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

function renderCompanies() {
    const tbody = document.getElementById('companies-table-body');

    if (companies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay empresas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = companies.map(company => `
    <tr>
      <td>${company.id}</td>
      <td>${company.name}</td>
      <td>${company.email || '-'}</td>
      <td>${company.phone || '-'}</td>
      <td>${company.commission_percentage}%</td>
      <td>
        <span class="badge ${company.status === 'active' ? 'badge-success' : 'badge-danger'}">
          ${company.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td class="table-actions">
        <button class="btn btn-primary btn-sm" onclick="editCompany(${company.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCompany(${company.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function openCompanyModal(companyId = null) {
    const modal = document.getElementById('company-modal');
    const title = document.getElementById('modal-title');

    if (companyId) {
        const company = companies.find(c => c.id === companyId);
        title.textContent = 'Editar Empresa';
        document.getElementById('company-id').value = company.id;
        document.getElementById('company-name').value = company.name;
        document.getElementById('company-email').value = company.email || '';
        document.getElementById('company-phone').value = company.phone || '';
        document.getElementById('company-address').value = company.address || '';
        document.getElementById('company-commission').value = company.commission_percentage;
        document.getElementById('company-status').value = company.status;
    } else {
        title.textContent = 'Nueva Empresa';
        document.getElementById('company-form').reset();
        document.getElementById('company-id').value = '';
    }

    modal.classList.add('show');
}

function closeCompanyModal() {
    document.getElementById('company-modal').classList.remove('show');
}

function editCompany(id) {
    openCompanyModal(id);
}

async function saveCompany() {
    const id = document.getElementById('company-id').value;
    const data = {
        name: document.getElementById('company-name').value,
        email: document.getElementById('company-email').value,
        phone: document.getElementById('company-phone').value,
        address: document.getElementById('company-address').value,
        commission_percentage: document.getElementById('company-commission').value,
        status: document.getElementById('company-status').value
    };

    try {
        let response;
        if (id) {
            response = await auth.fetch(`/api/super-admin/companies/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await auth.fetch('/api/super-admin/companies', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            closeCompanyModal();
            await loadCompanies();
            updateStats();
            alert('Empresa guardada exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo guardar la empresa'));
        }
    } catch (error) {
        alert('Error al guardar empresa: ' + error.message);
    }
}

async function deleteCompany(id) {
    if (!confirm('¿Está seguro de eliminar esta empresa? Esta acción eliminará todos los datos relacionados.')) {
        return;
    }

    try {
        const response = await auth.fetch(`/api/super-admin/companies/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadCompanies();
            updateStats();
            alert('Empresa eliminada exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo eliminar la empresa'));
        }
    } catch (error) {
        alert('Error al eliminar empresa: ' + error.message);
    }
}

// ========== USERS ==========

async function loadUsers() {
    try {
        const response = await auth.fetch('/api/super-admin/users');
        users = await response.json();
        renderUsers();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers() {
    const tbody = document.getElementById('users-table-body');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.name || '-'}</td>
      <td>${user.email || '-'}</td>
      <td>${user.company_name}</td>
      <td><span class="badge badge-info">${user.role}</span></td>
      <td>${new Date(user.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

// ========== SALES ==========

async function loadSales() {
    try {
        const response = await auth.fetch('/api/super-admin/sales');
        sales = await response.json();
        renderSales();
    } catch (error) {
        console.error('Error loading sales:', error);
    }
}

function renderSales() {
    const tbody = document.getElementById('sales-table-body');

    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay ventas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = sales.map(sale => `
    <tr>
      <td>${sale.id}</td>
      <td>${sale.company_name}</td>
      <td>${sale.passenger_name}</td>
      <td>${sale.route_name || '-'}<br><small>${sale.origin || ''} → ${sale.destination || ''}</small></td>
      <td>${sale.seat_number}</td>
      <td>$${parseFloat(sale.price).toFixed(2)}</td>
      <td>$${parseFloat(sale.commission_amount).toFixed(2)}</td>
      <td>${new Date(sale.travel_date).toLocaleDateString()}</td>
      <td>
        <span class="badge ${sale.status === 'confirmed' ? 'badge-success' : 'badge-danger'}">
          ${sale.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
        </span>
      </td>
    </tr>
  `).join('');
}

// ========== COMMISSIONS ==========

async function loadCommissions() {
    try {
        const response = await auth.fetch('/api/super-admin/commissions');
        commissions = await response.json();
        renderCommissions();
    } catch (error) {
        console.error('Error loading commissions:', error);
    }
}

function renderCommissions() {
    const tbody = document.getElementById('commissions-table-body');

    if (commissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos de comisiones</td></tr>';
        return;
    }

    tbody.innerHTML = commissions.map(comm => `
    <tr>
      <td>${comm.name}</td>
      <td>${comm.commission_percentage}%</td>
      <td>${comm.total_tickets}</td>
      <td>$${parseFloat(comm.total_sales || 0).toFixed(2)}</td>
      <td><strong>$${parseFloat(comm.total_commissions || 0).toFixed(2)}</strong></td>
    </tr>
  `).join('');

    // Add totals row
    const totalTickets = commissions.reduce((sum, c) => sum + parseInt(c.total_tickets), 0);
    const totalSales = commissions.reduce((sum, c) => sum + parseFloat(c.total_sales || 0), 0);
    const totalCommissions = commissions.reduce((sum, c) => sum + parseFloat(c.total_commissions || 0), 0);

    tbody.innerHTML += `
    <tr style="background: #f5f5f5; font-weight: bold;">
      <td>TOTALES</td>
      <td>-</td>
      <td>${totalTickets}</td>
      <td>$${totalSales.toFixed(2)}</td>
      <td>$${totalCommissions.toFixed(2)}</td>
    </tr>
  `;
}
