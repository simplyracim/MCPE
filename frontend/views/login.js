import { navigateTo } from '../main.js'
import LoginForm from '../components/loginForm.js';
import './login.css'; // <-- We'll define layout styles here

export function render() {
  return `
    <div class="login-page">
      ${LoginForm()}

      <div class="home-button">
        <button onclick="window.location.href='/'">Go to Home</button>
      </div>
    </div>
  `;
}

export function setup() {
  const form = document.getElementById('loginForm');
  const errorDiv = document.getElementById('loginError');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.email.value;
    const password = form.password.value;

    try {
      errorDiv.classList.add('hidden');
      errorDiv.textContent = '';

      const res = await fetch('http://localhost:4000/routes/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
          navigateTo('/');
        } else {
        errorDiv.textContent = data.message || "Invalid credentials";
        errorDiv.classList.remove('hidden');
      }
    } catch (err) {
      console.error(err);
      errorDiv.textContent = "Server error";
      errorDiv.classList.remove('hidden');
    }
  });
}
