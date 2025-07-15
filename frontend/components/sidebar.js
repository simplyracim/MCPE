// components/sidebar.js
import './sidebar.css';

let sidebarState = 'collapsed';

export function render(initialState = 'expanded') {
  sidebarState = initialState;
  const isCollapsed = sidebarState === 'collapsed';

  return `
      <div class="sidebar-container">
        <div class="sidebar ${isCollapsed ? 'collapsed' : ''}" id="sidebar">
          <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">❯</button>

        <img src="/assets/icons/lb_logo_dark.png" alt="Logo" class="logo">
        <div class="logo-text">Lunch Box</div>
        <div class="logo-subtitle">Information System</div>

        <hr class="fancy-hr">

        <div class="mb-3">Signed in as:</div>
        <div class="profile-picture">
          <img src="assets/profiles/blank.svg" alt="Profile Picture">
        </div>

        <hr class="fancy-hr">

        <h4>General</h4>
        <ul class="nav nav-pills flex-column mb-auto">
          <li class="nav-item">
            <a href="/" data-link class="nav-link">Home</a>
          </li>
          <li>
            <a href="/about" data-link class="nav-link">About</a>
          </li>
          <li>
            <a href="/login" data-link class="nav-link">Login</a>
          </li>
          <li>
            <a href="/contact" data-link class="nav-link">Contact</a>
          </li>
          <li>
            <a href="/employees" data-link class="nav-link">Employees</a>
          </li>
        </ul>

        <h4>Pages</h4>
      </div>
  `;
}

export function setup(state = 'collapsed') {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;

  toggle.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    toggle.textContent = isCollapsed ? '❯' : '❮';
  });

  if (state === 'expanded') {
    // Delay expansion to ensure transition works
    setTimeout(() => {
      sidebar.classList.remove('collapsed');
      toggle.textContent = '❮';
    }, 50);
  }
}


export function setSidebarState(state) {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  if (!sidebar || !toggle) return;

  sidebarState = state;
  const isCollapsed = state === 'collapsed';

  sidebar.classList.toggle('collapsed', isCollapsed);
  toggle.textContent = isCollapsed ? '❯' : '❮';
}

export function getSidebarState() {
  return sidebarState;
}