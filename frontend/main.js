// components
import * as Sidebar from './components/sidebar.js';
import './styles/global.css';

// views
import * as Home from './views/home.js';
import * as About from './views/about.js';
import * as Contact from './views/contact.js';
import * as Login from './views/login.js';
import * as Employees from './views/employees.js';

const routes = {
  '/': Home,
  '/about': About,
  '/contact': Contact,
  '/login': Login,
  '/employees': Employees
};

export function navigateTo(url) {
  history.pushState(null, null, url);
  render();
}

const sidebarStates = {
  '/': 'expanded',
  '/login': 'excluded',
  '/about': 'collapsed',
  '/employees': 'expanded',
  '/contact': 'expanded'
};

function render() {
  const path = window.location.pathname;
  const view = routes[path];
  const app = document.getElementById('app');

  if (!view) {
    app.innerHTML = '<h1>404 Not Found</h1>';
    return;
  }

  const sidebarMode = sidebarStates[path] || 'expanded';
  const noSidebar = sidebarMode === 'excluded';

  if (noSidebar) {
    app.innerHTML = view.render();
    view.setup?.();
    return;
  }

  // Inject layout only once
  if (!document.getElementById('view-container')) {
    app.innerHTML = `
      ${Sidebar.render('collapsed')}
      <div id="view-container" class="main-content"></div>
    `;
    Sidebar.setup(sidebarMode); // setup reads the state from DOM
  } else {
    // If layout exists but you want to programmatically change sidebar:
    Sidebar.setSidebarState(sidebarMode);
  }

  const container = document.getElementById('view-container');
  if (!container) return;

  container.innerHTML = view.render();
  view.setup?.();
}


window.addEventListener('popstate', render);

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('[data-link]');
    if (link) {
      e.preventDefault();
      navigateTo(link.href);
    }
  });

  render();
});
