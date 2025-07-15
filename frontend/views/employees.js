// views/employees.js

export function render() {
  return `
    <div class="container">
      <h1 class="mb-3">Employees</h1>
      <div id="employeeCards" class="d-flex flex-wrap gap-3"></div>
    </div>
  `;
}

export function setup() {
  fetch('http://localhost:3000/routes/employees')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('employeeCards');
      if (!container) return;

      data.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'card p-3 shadow';
        card.style.width = '18rem';
        card.innerHTML = `
          <img src="/assets/profiles/blank.svg" class="card-img-top mb-2" alt="Profile Picture">
          <div class="card-body">
            <h5 class="card-title text-center">${emp.name}</h5>
            <p class="card-text text-center">${emp.role_title || 'No Role Assigned'}</p>
            <p class="card-text text-center text-muted">${emp.is_admin ? 'Admin' : 'Regular User'}</p>
          </div>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => console.error('Error fetching employee data:', err));
}
