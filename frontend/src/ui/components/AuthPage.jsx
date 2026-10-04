import { useState } from "react";
import { useAuth } from "../../context/useAuth";
import { Icon } from "./Icon";
import shoppingImage from "../../../img/login img.png";
import "../App.css";

function PiqnoraLogo() {
  return (
    <div className="piqnora-logo">
      <span className="logo-bag">
        <Icon name="bag" />
      </span>
      <span>piqnora</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.25c1.9-1.75 2.97-4.33 2.97-7.37Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.4l-3.25-2.52c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.05v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.92a6 6 0 0 1 0-3.84v-2.6H3.05a10 10 0 0 0 0 9.04l3.36-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.88-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.48l3.36 2.6C7.2 7.72 9.4 5.96 12 5.96Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.37 12.18c.02 2.13 1.87 2.84 1.89 2.85-.02.05-.3 1.03-.97 2.04-.58.88-1.19 1.75-2.15 1.77-.94.02-1.24-.57-2.32-.57-1.08 0-1.41.55-2.3.59-.92.03-1.62-.94-2.2-1.82-1.2-1.8-2.12-5.07-.89-7.28.61-1.1 1.7-1.8 2.89-1.82.9-.02 1.74.61 2.29.61.55 0 1.58-.76 2.66-.65.45.02 1.72.18 2.53 1.37-.07.04-1.51.88-1.5 2.91ZM14.62 5.99c.49-.59.82-1.42.73-2.24-.71.03-1.57.47-2.08 1.06-.46.53-.86 1.37-.75 2.18.79.06 1.6-.4 2.1-1Z" />
    </svg>
  );
}

export default function AuthPage({ initialView = "login", onSuccess }) {
  const [view, setView] = useState(initialView);
  const [error, setError] = useState("");

  const { login, register, loading } = useAuth();

  const isSignup = view === "signup";

  async function submitAuth(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      if (isSignup) {
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");
        const confirmPassword = String(
          formData.get("confirmPassword") || ""
        );

        if (password !== confirmPassword) {
          setError("Your passwords do not match. Please check and try again.");
          return;
        }

        const data = await register(name, email, password);
        onSuccess?.(data.user);
        return;
      }

      const email = String(formData.get("email") || "").trim();
      const password = String(formData.get("password") || "");

      const data = await login(email, password);
      onSuccess?.(data.user);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again."
      );
    }
  }

  return (
    <main className={`shop-screen ${isSignup ? "signup-screen" : ""}`}>
      <section
        className={`shop-card ${isSignup ? "signup-card" : ""}`}
        aria-label={
          isSignup ? "Create a piqnora account" : "Sign in to piqnora"
        }
      >
        <PiqnoraLogo />

        <h1>{isSignup ? "Create Account..." : "Welcome Back!"}</h1>

        <p className="shop-intro">
          {isSignup
            ? "Join piqnora and get access to exclusive finds and offers."
            : "Login to your account to continue shopping and enjoy a better experience."}
        </p>

        <form onSubmit={submitAuth}>
          {isSignup ? (
            <>
              <label className="shop-label">
                Full Name
                <input
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="shop-label">
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="shop-label">
                Create Password
                <input
                  name="password"
                  type="password"
                  placeholder="Create password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label className="shop-label">
                Confirm Password
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            </>
          ) : (
            <>
              <label className="shop-label">
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="shop-label">
                Password
                <input
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <a className="forgot-link" href="#forgot-password">
                Forgotten Password?
              </a>
            </>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="shop-submit" type="submit" disabled={loading}>
            {loading
              ? "PLEASE WAIT..."
              : isSignup
                ? "CREATE ACCOUNT"
                : "LOGIN"}
          </button>
        </form>

        {!isSignup && (
          <>
            <div className="shop-divider">
              <span />
              OR
              <span />
            </div>

            <div className="social-buttons">
              <button type="button">
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <button type="button">
                <AppleIcon />
                <span>Continue with Apple</span>
              </button>
            </div>
          </>
        )}

        <p className="account-switch">
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setError("");
              setView(isSignup ? "login" : "signup");
            }}
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </section>

      <section
        className="illustration-panel"
        aria-label="Shop online with piqnora"
      >
        <img
          className="shopping-art"
          src={shoppingImage}
          alt="People shopping online with piqnora"
        />
      </section>
    </main>
  );
}