import { useState } from 'react'

export function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!form.email || !form.password) {
      setError('Please enter your admin email and password.')
      return
    }

    onLogin({
      name: 'Piqnora Admin',
      email: form.email,
      role: 'store manager'
    })
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
          <p>Manage products, categories, and the growth of your storefront in one place.</p>
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
            />
          </label>

          {error && <p className="admin-error">{error}</p>}

          <button type="submit" className="admin-primary-button">Sign in</button>
        </form>
      </section>
    </main>
  )
}
