// Company Dashboard JavaScript
requireAuth();
showUserInfo();

// Current state
let currentSection = 'overview';
let routes = [];
let buses = [];
let drivers = [];
let tickets = [];
let users = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getUser();
    if (user && user.company_name) {
        document.getElementById('company-name').textContent = user.company_name;
    }

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
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');

    document.querySelectorAll('.dashboard-section').forEach(sec => {
        sec.classList.add('hidden');
    });

    document.getElementById(`section-${section}`)?.classList.remove('hidden');

    currentSection = section;
    loadSectionData(section);
}

// Load all data
async function loadAllData() {
    try {
        await Promise.all([
            loadRoutes(),
            loadBuses(),
            loadDrivers(),
            loadTickets(),
            loadUsers()
        ]);
        updateStats();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load section data
async function loadSectionData(section) {
    switch (section) {
        case 'routes':
            await loadRoutes();
            break;
        case 'buses':
            await loadBuses();
            break;
        case 'drivers':
            await loadDrivers();
            break;
        case 'tickets':
            await loadTickets();
            break;
        case 'users':
            await loadUsers();
            break;
    }
}

// Update stats
function updateStats() {
    document.getElementById('stat-routes').textContent = routes.length;
    document.getElementById('stat-buses').textContent = buses.length;
    document.getElementById('stat-tickets').textContent = tickets.length;
    document.getElementById('stat-drivers').textContent = drivers.length;
}

// ========== ROUTES ==========

async function loadRoutes() {
    try {
        const response = await auth.fetch('/api/company/routes');
        routes = await response.json();
        renderRoutes();
        updateRouteSelects();
    } catch (error) {
        console.error('Error loading routes:', error);
    }
}

function renderRoutes() {
    const tbody = document.getElementById('routes-table-body');

    if (routes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay rutas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = routes.map(route => `
    <tr>
      <td>${route.id}</td>
      <td>${route.name}</td>
      <td>${route.origin}</td>
      <td>${route.destination}</td>
      <td>$${parseFloat(route.price).toFixed(2)}</td>
      <td>${route.duration_hours || '-'}</td>
      <td class="table-actions">
        <button class="btn btn-primary btn-sm" onclick="editRoute(${route.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRoute(${route.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function updateRouteSelects() {
    const select = document.getElementById('ticket-route');
    select.innerHTML = '<option value="">Seleccione una ruta</option>' +
        routes.map(r => `<option value="${r.id}" data-price="${r.price}">${r.name} (${r.origin} → ${r.destination})</option>`).join('');

    select.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (selectedOption.dataset.price) {
            document.getElementById('ticket-price').value = selectedOption.dataset.price;
        }
    });
}

function openRouteModal(routeId = null) {
    const modal = document.getElementById('route-modal');
    const title = document.getElementById('route-modal-title');

    if (routeId) {
        const route = routes.find(r => r.id === routeId);
        title.textContent = 'Editar Ruta';
        document.getElementById('route-id').value = route.id;
        document.getElementById('route-name').value = route.name;
        document.getElementById('route-origin').value = route.origin;
        document.getElementById('route-destination').value = route.destination;
        document.getElementById('route-price').value = route.price;
        document.getElementById('route-duration').value = route.duration_hours || '';
    } else {
        title.textContent = 'Nueva Ruta';
        document.getElementById('route-form').reset();
        document.getElementById('route-id').value = '';
    }

    modal.classList.add('show');
}

function closeRouteModal() {
    document.getElementById('route-modal').classList.remove('show');
}

function editRoute(id) {
    openRouteModal(id);
}

async function saveRoute() {
    const id = document.getElementById('route-id').value;
    const data = {
        name: document.getElementById('route-name').value,
        origin: document.getElementById('route-origin').value,
        destination: document.getElementById('route-destination').value,
        price: document.getElementById('route-price').value,
        duration_hours: document.getElementById('route-duration').value || null
    };

    try {
        let response;
        if (id) {
            response = await auth.fetch(`/api/company/routes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await auth.fetch('/api/company/routes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            closeRouteModal();
            await loadRoutes();
            updateStats();
            alert('Ruta guardada exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo guardar la ruta'));
        }
    } catch (error) {
        alert('Error al guardar ruta: ' + error.message);
    }
}

async function deleteRoute(id) {
    if (!confirm('¿Está seguro de eliminar esta ruta?')) return;

    try {
        const response = await auth.fetch(`/api/company/routes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadRoutes();
            updateStats();
            alert('Ruta eliminada exitosamente');
        }
    } catch (error) {
        alert('Error al eliminar ruta: ' + error.message);
    }
}

// ========== BUSES ==========

async function loadBuses() {
    try {
        const response = await auth.fetch('/api/company/buses');
        buses = await response.json();
        renderBuses();
        updateBusSelects();
    } catch (error) {
        console.error('Error loading buses:', error);
    }
}

function renderBuses() {
    const tbody = document.getElementById('buses-table-body');

    if (buses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay autobuses registrados</td></tr>';
        return;
    }

    tbody.innerHTML = buses.map(bus => `
    <tr>
      <td>${bus.id}</td>
      <td>${bus.bus_number}</td>
      <td>${bus.plate_number}</td>
      <td>${bus.capacity} pasajeros</td>
      <td>
        <span class="badge ${bus.status === 'active' ? 'badge-success' : bus.status === 'maintenance' ? 'badge-warning' : 'badge-danger'}">
          ${bus.status === 'active' ? 'Activo' : bus.status === 'maintenance' ? 'Mantenimiento' : 'Inactivo'}
        </span>
      </td>
      <td class="table-actions">
        <button class="btn btn-primary btn-sm" onclick="editBus(${bus.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBus(${bus.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function updateBusSelects() {
    const select = document.getElementById('ticket-bus');
    select.innerHTML = '<option value="">Seleccione un autobús</option>' +
        buses.filter(b => b.status === 'active').map(b => `<option value="${b.id}">${b.bus_number} - ${b.plate_number}</option>`).join('');
}

function openBusModal(busId = null) {
    const modal = document.getElementById('bus-modal');
    const title = document.getElementById('bus-modal-title');

    if (busId) {
        const bus = buses.find(b => b.id === busId);
        title.textContent = 'Editar Autobús';
        document.getElementById('bus-id').value = bus.id;
        document.getElementById('bus-number').value = bus.bus_number;
        document.getElementById('bus-plate').value = bus.plate_number;
        document.getElementById('bus-status').value = bus.status;
    } else {
        title.textContent = 'Nuevo Autobús';
        document.getElementById('bus-form').reset();
        document.getElementById('bus-id').value = '';
    }

    modal.classList.add('show');
}

function closeBusModal() {
    document.getElementById('bus-modal').classList.remove('show');
}

function editBus(id) {
    openBusModal(id);
}

async function saveBus() {
    const id = document.getElementById('bus-id').value;
    const data = {
        bus_number: document.getElementById('bus-number').value,
        plate_number: document.getElementById('bus-plate').value,
        status: document.getElementById('bus-status').value
    };

    try {
        let response;
        if (id) {
            response = await auth.fetch(`/api/company/buses/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await auth.fetch('/api/company/buses', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            closeBusModal();
            await loadBuses();
            updateStats();
            alert('Autobús guardado exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo guardar el autobús'));
        }
    } catch (error) {
        alert('Error al guardar autobús: ' + error.message);
    }
}

async function deleteBus(id) {
    if (!confirm('¿Está seguro de eliminar este autobús?')) return;

    try {
        const response = await auth.fetch(`/api/company/buses/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadBuses();
            updateStats();
            alert('Autobús eliminado exitosamente');
        }
    } catch (error) {
        alert('Error al eliminar autobús: ' + error.message);
    }
}

// ========== DRIVERS ==========

async function loadDrivers() {
    try {
        const response = await auth.fetch('/api/company/drivers');
        drivers = await response.json();
        renderDrivers();
        updateDriverSelects();
    } catch (error) {
        console.error('Error loading drivers:', error);
    }
}

function renderDrivers() {
    const tbody = document.getElementById('drivers-table-body');

    if (drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay choferes registrados</td></tr>';
        return;
    }

    tbody.innerHTML = drivers.map(driver => `
    <tr>
      <td>${driver.id}</td>
      <td>${driver.name}</td>
      <td>${driver.license_number}</td>
      <td>${driver.phone || '-'}</td>
      <td>${driver.email || '-'}</td>
      <td>
        <span class="badge ${driver.status === 'active' ? 'badge-success' : 'badge-danger'}">
          ${driver.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td class="table-actions">
        <button class="btn btn-primary btn-sm" onclick="editDriver(${driver.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteDriver(${driver.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function updateDriverSelects() {
    const select = document.getElementById('ticket-driver');
    select.innerHTML = '<option value="">Seleccione un chofer</option>' +
        drivers.filter(d => d.status === 'active').map(d => `<option value="${d.id}">${d.name} - ${d.license_number}</option>`).join('');
}

function openDriverModal(driverId = null) {
    const modal = document.getElementById('driver-modal');
    const title = document.getElementById('driver-modal-title');

    if (driverId) {
        const driver = drivers.find(d => d.id === driverId);
        title.textContent = 'Editar Chofer';
        document.getElementById('driver-id').value = driver.id;
        document.getElementById('driver-name').value = driver.name;
        document.getElementById('driver-license').value = driver.license_number;
        document.getElementById('driver-phone').value = driver.phone || '';
        document.getElementById('driver-email').value = driver.email || '';
        document.getElementById('driver-status').value = driver.status;
    } else {
        title.textContent = 'Nuevo Chofer';
        document.getElementById('driver-form').reset();
        document.getElementById('driver-id').value = '';
    }

    modal.classList.add('show');
}

function closeDriverModal() {
    document.getElementById('driver-modal').classList.remove('show');
}

function editDriver(id) {
    openDriverModal(id);
}

async function saveDriver() {
    const id = document.getElementById('driver-id').value;
    const data = {
        name: document.getElementById('driver-name').value,
        license_number: document.getElementById('driver-license').value,
        phone: document.getElementById('driver-phone').value,
        email: document.getElementById('driver-email').value,
        status: document.getElementById('driver-status').value
    };

    try {
        let response;
        if (id) {
            response = await auth.fetch(`/api/company/drivers/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await auth.fetch('/api/company/drivers', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            closeDriverModal();
            await loadDrivers();
            updateStats();
            alert('Chofer guardado exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo guardar el chofer'));
        }
    } catch (error) {
        alert('Error al guardar chofer: ' + error.message);
    }
}

async function deleteDriver(id) {
    if (!confirm('¿Está seguro de eliminar este chofer?')) return;

    try {
        const response = await auth.fetch(`/api/company/drivers/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadDrivers();
            updateStats();
            alert('Chofer eliminado exitosamente');
        }
    } catch (error) {
        alert('Error al eliminar chofer: ' + error.message);
    }
}

// ========== TICKETS ==========

async function loadTickets() {
    try {
        const response = await auth.fetch('/api/company/tickets');
        tickets = await response.json();
        renderTickets();
    } catch (error) {
        console.error('Error loading tickets:', error);
    }
}

function renderTickets() {
    const tbody = document.getElementById('tickets-table-body');

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay boletos vendidos</td></tr>';
        return;
    }

    tbody.innerHTML = tickets.map(ticket => `
    <tr>
      <td>${ticket.id}</td>
      <td>${ticket.passenger_name}</td>
      <td>${ticket.route_name || '-'}<br><small>${ticket.origin || ''} → ${ticket.destination || ''}</small></td>
      <td>${ticket.bus_number || '-'}</td>
      <td><strong>${ticket.seat_number}</strong></td>
      <td>$${parseFloat(ticket.price).toFixed(2)}</td>
      <td>$${parseFloat(ticket.commission_amount).toFixed(2)}</td>
      <td>${new Date(ticket.travel_date).toLocaleDateString()}</td>
      <td>
        <span class="badge ${ticket.status === 'confirmed' ? 'badge-success' : 'badge-danger'}">
          ${ticket.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
        </span>
      </td>
    </tr>
  `).join('');
}

function openTicketModal() {
    const modal = document.getElementById('ticket-modal');
    document.getElementById('ticket-form').reset();

    // Set today as minimum date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('ticket-date').setAttribute('min', today);
    document.getElementById('ticket-date').value = today;

    modal.classList.add('show');
}

function closeTicketModal() {
    document.getElementById('ticket-modal').classList.remove('show');
}

async function saveTicket() {
    const data = {
        passenger_name: document.getElementById('ticket-passenger').value,
        route_id: document.getElementById('ticket-route').value,
        bus_id: document.getElementById('ticket-bus').value,
        driver_id: document.getElementById('ticket-driver').value,
        seat_number: document.getElementById('ticket-seat').value,
        travel_date: document.getElementById('ticket-date').value,
        price: document.getElementById('ticket-price').value
    };

    try {
        const response = await auth.fetch('/api/company/tickets', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeTicketModal();
            await loadTickets();
            updateStats();
            alert('Boleto vendido exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo vender el boleto'));
        }
    } catch (error) {
        alert('Error al vender boleto: ' + error.message);
    }
}

// ========== USERS ==========

async function loadUsers() {
    try {
        const response = await auth.fetch('/api/company/users');
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
      <td><span class="badge badge-info">${user.role}</span></td>
      <td>${new Date(user.created_at).toLocaleDateString()}</td>
      <td class="table-actions">
        <button class="btn btn-primary btn-sm" onclick="editUser(${user.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const title = document.getElementById('user-modal-title');
    const passwordField = document.getElementById('user-password');

    if (userId) {
        const user = users.find(u => u.id === userId);
        title.textContent = 'Editar Usuario';
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-username').value = user.username;
        document.getElementById('user-username').disabled = true;
        passwordField.required = false;
        passwordField.value = '';
        document.getElementById('user-name').value = user.name || '';
        document.getElementById('user-email').value = user.email || '';
        document.getElementById('user-role').value = user.role;
    } else {
        title.textContent = 'Nuevo Usuario';
        document.getElementById('user-form').reset();
        document.getElementById('user-id').value = '';
        document.getElementById('user-username').disabled = false;
        passwordField.required = true;
    }

    modal.classList.add('show');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('show');
}

function editUser(id) {
    openUserModal(id);
}

async function saveUser() {
    const id = document.getElementById('user-id').value;
    const password = document.getElementById('user-password').value;

    const data = {
        username: document.getElementById('user-username').value,
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        role: document.getElementById('user-role').value
    };

    if (password || !id) {
        data.password = password;
    }

    try {
        let response;
        if (id) {
            response = await auth.fetch(`/api/company/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } else {
            response = await auth.fetch('/api/company/users', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }

        if (response.ok) {
            closeUserModal();
            await loadUsers();
            alert('Usuario guardado exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'No se pudo guardar el usuario'));
        }
    } catch (error) {
        alert('Error al guardar usuario: ' + error.message);
    }
}

async function deleteUser(id) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;

    try {
        const response = await auth.fetch(`/api/company/users/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadUsers();
            alert('Usuario eliminado exitosamente');
        }
    } catch (error) {
        alert('Error al eliminar usuario: ' + error.message);
    }
}
