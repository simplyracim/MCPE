// views/home.js

export function render() {
  return `
    <div class="d-flex">

      <div class="p-4 w-100">
        <h1 class="mb-4">Employee List</h1>
        <table class="table table-striped-columns">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody id="employeeTableBody">
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function setup() {
  fetch('http://localhost:3000/routes/employees')
    .then(res => res.json())
    .then(data => {
      const tableBody = document.getElementById('employeeTableBody');
      if (!tableBody) return;
      data.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${emp.name}</td>
          <td>${emp.role_title}</td>
        `;
        tableBody.appendChild(tr);
      });
    })
    .catch(err => console.error('Error fetching employees:', err));
}
