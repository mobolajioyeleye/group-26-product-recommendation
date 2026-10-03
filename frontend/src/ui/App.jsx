import { useEffect, useState } from "react";
import { readFavorites } from "./data/catalogStorage";
import { getProducts, getCategories } from "../services/api";
import { normalizeProducts } from "./data/productAdapter";
import AuthPage from "./components/AuthPage";
import { StoreShell } from "./components/StoreShell";
import AdminApp from "./admin/AdminApp";
import DiscoverPage from "./pages/DiscoverPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import RecommendedPage from "./pages/RecommendedPage";
import SearchPage from "./pages/SearchPage";
import WelcomePage from "./pages/WelcomePage";
import { useAuth } from "../context/useAuth";
import {
  getFavourites,
  addFavourite,
  removeFavourite,
  isProductFavorited,
  UUID_TO_SLUG,
  SLUG_TO_UUID,
} from "../services/favouritesApi";

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const currentUser = user;

  // Real backend product/category data
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  // Restore the correct starting page after a browser refresh.
  const [page, setPage] = useState(() => {
    try {
      const savedPage =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("piqnora-page")
          : null;
      if (savedPage) return savedPage;
    } catch {}
    return user ? "home" : "welcome";
  });


  const [authView, setAuthView] = useState("login");
  const [pendingPage, setPendingPage] = useState("home");
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Always start with empty favourites. The database is the single
  // source of truth for authenticated users — stale localStorage is
  // never used to pre-populate state on mount.
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(Boolean(user));

  const [notice, setNotice] = useState("");

  // Load products and categories from the real backend.
  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setProductsLoading(true);
      setProductsError("");

      try {
        const [backendProducts, backendCategories] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        if (cancelled) {
          return;
        }

        setCatalogProducts(
          normalizeProducts(backendProducts, backendCategories)
        );

        setCategories(backendCategories);
      } catch (error) {
        if (!cancelled) {
          setProductsError(
            error.message || "Unable to load products right now."
          );
        }
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const adminRouteRequested =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("view") === "admin";

  // Sync favourites with the live backend when authenticated
  useEffect(() => {
    let isMounted = true;

    async function syncLiveFavorites() {
      if (currentUser) {
        setFavoritesLoading(true);
        try {
          const liveData = await getFavourites();
          console.log("[F6 Sync] Backend returned:", liveData?.length, "items", liveData);
          if (isMounted && Array.isArray(liveData)) {
            const backendIds = liveData.flatMap((item) => {
              const rawId = item.product_id || item.productId || item.id;
              const slug = UUID_TO_SLUG[rawId];
              return slug ? [rawId, slug] : [rawId];
            });
            console.log("[F6 Sync] Setting favorites to:", backendIds.length, "IDs:", backendIds);
            // The database is the single source of truth for authenticated users.
            setFavorites(backendIds);
            writeFavorites(currentUser, backendIds);
          }
        } catch (error) {
          console.error(
            "[F6 Sync] FETCH FAILED — will show 0 favorites. Error:", error.message,
            "Status:", error?.response?.status
          );
          // On any error (including 401), show 0 — never show stale cached data.
          if (isMounted) {
            setFavorites([]);
          }
        } finally {
          if (isMounted) setFavoritesLoading(false);
        }
      } else {
        setFavorites([]);
        setFavoritesLoading(false);
      }
    }

    syncLiveFavorites();

    const handleSyncOnFocus = () => {
      if (document.visibilityState === "visible") {
        syncLiveFavorites();
      }
    };

    window.addEventListener("focus", handleSyncOnFocus);
    document.addEventListener("visibilitychange", handleSyncOnFocus);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleSyncOnFocus);
      document.removeEventListener("visibilitychange", handleSyncOnFocus);
    };
  }, [currentUser]);

  const storefrontCategories = Array.from(
    new Set([
      ...categories.map((category) => category.name),
      ...catalogProducts.map((product) => product.category),
    ])
  )
    .filter((name) => name && name !== "More")
    .map((name) => ({
      name,
      count: catalogProducts.filter(
        (product) => product.category === name
      ).length,
    }));

  if (adminRouteRequested) {
    return <AdminApp />;
  }

  async function navigate(nextPage, category = "") {
    if (nextPage === "login" || nextPage === "signup") {
      setAuthView(nextPage);
      setPage("auth");
      return;
    }

    if (nextPage === "logout") {
      try {
        await logout();
      } finally {
        setFavorites([]);
        setNotice("");
        try {
          window.sessionStorage.removeItem("piqnora-page");
        } catch {}
        setPage("welcome");
      }
      return;
    }

    if (!isAuthenticated && nextPage !== "welcome") {
      setPendingPage(nextPage);
      setAuthView("login");
      setPage("auth");
      return;
    }

    if (category) {
      setSelectedCategory(category);
    } else if (nextPage === "search") {
      setSelectedCategory("");
    }

    setPage(nextPage);
    try {
      window.sessionStorage.setItem("piqnora-page", nextPage);
    } catch {}
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  async function toggleFavorite(productId) {
    if (!isAuthenticated) {
      setPendingPage(page);
      setAuthView("login");
      setPage("auth");
      setNotice("Please log in to save items to your favourites.");
      return;
    }

    const product = catalogProducts.find(
      (item) => item.id === productId
    );

    const wasSaved = isProductFavorited(favorites, productId);
    const targetUuid = SLUG_TO_UUID[productId];
    const targetSlug = UUID_TO_SLUG[productId];

    // Optimistic UI update
    const updatedFavorites = wasSaved
      ? favorites.filter(
          (id) => id !== productId && id !== targetUuid && id !== targetSlug
        )
      : [...favorites, productId];

    setFavorites(updatedFavorites);
    if (currentUser) {
      writeFavorites(currentUser, updatedFavorites);
    }

    setNotice(
      product
        ? `${product.name} ${
            wasSaved ? "removed from" : "added to"
          } your favourites.`
        : wasSaved
        ? "Item removed from your favourites."
        : "Item added to your favourites."
    );

    try {
      if (wasSaved) {
        await removeFavourite(productId);
      } else {
        await addFavourite(productId);
      }
    } catch (error) {
      console.error("[Favourites] Backend sync error:", error.message);
      // Rollback on network/API failure
      setFavorites(favorites);
      if (currentUser) {
        writeFavorites(currentUser, favorites);
      }
      setNotice(`Could not update favourites: ${error.message}`);
    }
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setPage("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (page === "auth") {
    return (
      <AuthPage
        key={authView}
        initialView={authView}
        onSuccess={async (loggedInUser) => {
          setPage(pendingPage);
          setNotice(
            `Welcome to piqnora, ${loggedInUser.name}.`
          );
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          try {
            const liveData = await getFavourites();
            if (Array.isArray(liveData)) {
              const backendIds = liveData.flatMap((item) => {
                const rawId = item.product_id || item.productId || item.id;
                const slug = UUID_TO_SLUG[rawId];
                return slug ? [rawId, slug] : [rawId];
              });
              setFavorites(backendIds);
              writeFavorites(loggedInUser, backendIds);
            }
          } catch (e) {
            console.warn("[Favourites] Login sync fallback:", e.message);
            setFavorites(readFavorites(loggedInUser));
          }
        }}
      />

    );
  }

  const sharedProps = {
    products: catalogProducts,
    categories: storefrontCategories,
    favorites,
    favoritesLoading,
    user: currentUser,
    onFavorite: toggleFavorite,
    onSelect: openProduct,
    onNavigate: navigate,
  };

  let content;

  // Show backend loading state for product pages.
  if (productsLoading && page !== "welcome") {
    content = (
      <div className="page-content">
        <div className="empty-state">
          <span>⌛</span>
          <h3>Loading products...</h3>
          <p>We're getting the latest products for you.</p>
        </div>
      </div>
    );
  } else if (productsError && page !== "welcome") {
    content = (
      <div className="page-content">
        <div className="empty-state">
          <span>⚠️</span>
          <h3>Unable to load products</h3>
          <p>{productsError}</p>
        </div>
      </div>
    );
  } else {
    switch (page) {
      case "welcome":
        content = (
          <WelcomePage
            categories={storefrontCategories}
            onNavigate={navigate}
            onCategory={(category) =>
              navigate("search", category)
            }
          />
        );
        break;

      case "home":
        content = (
          <DiscoverPage
            {...sharedProps}
            onCategory={(category) =>
              navigate("search", category)
            }
          />
        );
        break;

      case "search":
        content = (
          <SearchPage
            key={selectedCategory}
            {...sharedProps}
            searchValue={searchValue}
            initialCategory={selectedCategory}
            onSearch={setSearchValue}
          />
        );
        break;

      case "detail":
        content = selectedProduct ? (
          <ProductDetailsPage
            key={selectedProduct.id}
            {...sharedProps}
            product={selectedProduct}
            onBack={() => navigate("home")}
          />
        ) : (
          <div className="page-content">
            <div className="empty-state">
              <span>🔍</span>
              <h3>Product not found</h3>
              <p>The selected product is no longer available.</p>
            </div>
          </div>
        );
        break;

      case "favorites":
        content = <FavoritesPage {...sharedProps} />;
        break;

      case "recommended":
        content = <RecommendedPage {...sharedProps} />;
        break;

      case "profile":
        content = (
          <ProfilePage
            user={currentUser}
            onNavigate={navigate}
          />
        );
        break;

      default:
        content = (
          <WelcomePage
            categories={storefrontCategories}
            onNavigate={navigate}
            onCategory={(category) =>
              navigate("search", category)
            }
          />
        );
    }
  }

  const shellPage = page === "detail" ? "home" : page;
  const uniqueFavoritesCount = new Set(
    favorites.map((id) => SLUG_TO_UUID[id] || id)
  ).size;

  return (
    <StoreShell
      page={shellPage}
      isAuthenticated={isAuthenticated}
      user={currentUser}
      categories={storefrontCategories}
      favoritesCount={uniqueFavoritesCount}
      announcement={notice}
      onNavigate={navigate}
      onSearch={setSearchValue}
      searchValue={searchValue}
    >
      {content}
    </StoreShell>
  );
}

export default App;