import { useEffect, useState, useCallback } from "react";
import { getProducts, getCategories } from "../../services/api";
import { AdminLogin } from "./AdminLogin";
import { AdminConsole } from "./AdminConsole";
import { useAuth } from "../../context/useAuth";
import "./admin.css";

export default function AdminApp() {
  const { user, isAuthenticated, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const handleReload = useCallback(() => {
    setLoading(true);
    setError("");
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated || user?.role !== "Administrator") {
      return;
    }

    async function fetchAdminData() {
      try {
        const [backendProducts, backendCategories] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        if (!isMounted) return;

        const categoryMap = Object.fromEntries(
          (backendCategories || []).map((cat) => [cat.id, cat.name])
        );

        const normalizedProducts = (backendProducts || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: Number(item.price) || 0,
          category_id: item.category_id,
          category: categoryMap[item.category_id] || item.category_name || "Uncategorized",
          image: item.image_url || "",
          stock: Number(item.stock) || 0,
        }));

        const normalizedCategories = (backendCategories || []).map((cat) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || "",
        }));

        setProducts(normalizedProducts);
        setCategories(normalizedCategories);
      } catch (err) {
        if (!isMounted) return;
        console.error("[AdminApp] Failed to load catalog from backend:", err.message);
        setError(err.message || "Unable to load inventory data right now.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAdminData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.role, reloadKey]);

  // Not logged in: show the admin login form.
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Logged in but not an Administrator: block admin access with route guard.
  if (user?.role !== "Administrator") {
    return (
      <main className="admin-login-shell">
        <section className="admin-login-card">
          <div className="admin-intro">
            <p className="admin-kicker">ADMIN ACCESS</p>
            <h1>Access denied.</h1>
            <p>You are not authorized to access the admin dashboard. Administrator privileges are required.</p>
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

  if (loading) {
    return (
      <main className="admin-login-shell">
        <div className="admin-login-card" style={{ textAlign: "center", padding: "3rem" }}>
          <span style={{ fontSize: "2rem" }}>⌛</span>
          <h2>Loading Admin Dashboard...</h2>
          <p>Fetching inventory and category data from database.</p>
        </div>
      </main>
    );
  }

  if (error && products.length === 0) {
    return (
      <main className="admin-login-shell">
        <div className="admin-login-card" style={{ textAlign: "center", padding: "3rem" }}>
          <span style={{ fontSize: "2rem" }}>⚠️</span>
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
          <button
            type="button"
            className="admin-primary-button"
            onClick={handleReload}
            style={{ marginTop: "1rem" }}
          >
            Retry
          </button>
        </div>
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
      onReload={handleReload}
      onLogout={logout}
    />
  );
}