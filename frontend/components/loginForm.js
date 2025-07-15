import './loginForm.css';

export default function LoginForm() {
  return `
    <div class="login-card">
      <h2>Login</h2>
      <form id="loginForm">
        <div class="form-group">
          <label for="email">Email address</label>
          <input type="email" id="email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" required>
        </div>
        <button type="submit">Login</button>
      </form>
      <div id="loginError" class="error-message hidden">Invalid credentials</div>
    </div>
  `;
}
