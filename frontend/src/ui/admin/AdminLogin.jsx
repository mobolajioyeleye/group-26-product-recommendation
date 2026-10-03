import { useState } from "react";
import { useAuth } from "../../context/useAuth";

const DEFAULT_ADMIN_CREDENTIALS = {
  email: "admin@piqnora.com",
  password: "Password123!",
};

const UNAUTHORIZED_MESSAGE =
  "You are not authorized to access the admin dashboard. Administrator privileges are required.";

export function AdminLogin() {
  const { login, logout } = useAuth();

  const [form, setForm] = useState(DEFAULT_ADMIN_CREDENTIALS);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleFillCredentials() {
    setForm(DEFAULT_ADMIN_CREDENTIALS);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter your admin email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await login(form.email, form.password);

      if (data?.user?.role !== "Administrator") {
        await logout();
        setError(UNAUTHORIZED_MESSAGE);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <div className="admin-brand-block">
          <span className="admin-brand-mark">p</span>
          <span className="admin-brand-text">piqnora</span>
        </div>

        <div className="admin-intro">
          <p className="admin-kicker">ADMIN ACCESS</p>
          <h1>Welcome back.</h1>
          <p>
            Manage products, categories, and the growth of your storefront in
            one place.
          </p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label>
            <span>Admin email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@piqnora.com"
              disabled={loading}
              autoComplete="username"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              disabled={loading}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="admin-error">{error}</p>}

          <button
            type="submit"
            className="admin-primary-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={handleFillCredentials}
            disabled={loading}
            style={{ marginTop: "4px" }}
          >
            Reset Demo Admin Credentials
          </button>
        </form>
      </section>
    </main>
  );
}