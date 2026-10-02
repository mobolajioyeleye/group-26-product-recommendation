import { useEffect, useState } from "react";
import productsData, { categories as defaultCategories } from "../data/products";
import { readCatalog, writeCatalog } from "../data/catalogStorage";
import { AdminLogin } from "./AdminLogin";
import { AdminConsole } from "./AdminConsole";
import "./admin.css";
import { useAuth } from "../../context/useAuth";

export default function AdminApp() {
  const { user, isAuthenticated, logout } = useAuth();

  const [products, setProducts] = useState(() =>
    readCatalog(productsData, defaultCategories).products
  );

  const [categories, setCategories] = useState(() =>
    readCatalog(productsData, defaultCategories).categories
  );

  useEffect(() => {
    writeCatalog(products, categories);
  }, [products, categories]);

  // Not logged in: show the real admin login form.
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Logged in but not an Administrator: block admin access.
  if (user?.role !== "Administrator") {
    return (
      <main className="admin-login-shell">
        <section className="admin-login-card">
          <div className="admin-intro">
            <p className="admin-kicker">ADMIN ACCESS</p>
            <h1>Access denied.</h1>
            <p>You are not authorized to access the admin dashboard.</p>
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={logout}
          >
            Log out
          </button>
        </section>
      </main>
    );
  }

  return (
    <AdminConsole
      user={user}
      products={products}
      categories={categories}
      onProductsChange={setProducts}
      onCategoriesChange={setCategories}
      onLogout={logout}
    />
  );
}