import { useEffect, useState } from "react";
import products from "./data/products";
import {
  readCatalog,
  readFavorites,
  writeCatalog,
  writeFavorites,
} from "./data/catalogStorage";
import { categories as defaultCategories } from "./data/products";
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

function App() {
  const { user, isAuthenticated, logout } = useAuth();
const currentUser = user;

    const [catalogProducts, setCatalogProducts] = useState(() =>
    readCatalog(products, defaultCategories).products
  );
  const [categories, setCategories] = useState(() =>
    readCatalog(products, defaultCategories).categories
  );

  // Restore the correct starting page after a browser refresh.
  const [page, setPage] = useState(() =>
    user ? "home" : "welcome"
  );

  const [authView, setAuthView] = useState("login");
  const [pendingPage, setPendingPage] = useState("home");
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(
    () => readCatalog(products, defaultCategories).products[0]
  );
  const [favorites, setFavorites] = useState(() =>
    user ? readFavorites(user) : []
  );
  const [notice, setNotice] = useState("");

  const adminRouteRequested =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("view") === "admin";

  // Keep the temporary local catalog behavior for the design prototype.
  useEffect(() => {
    if (!adminRouteRequested) {
      writeCatalog(catalogProducts, categories);
    }
  }, [adminRouteRequested, catalogProducts, categories]);

  useEffect(() => {
    function refreshCatalog(event) {
      if (event.key !== "piqnora-catalog-v1") {
        return;
      }

      const catalog = readCatalog(products, defaultCategories);
      setCatalogProducts(catalog.products);
      setCategories(catalog.categories);
    }

    window.addEventListener("storage", refreshCatalog);

    return () => {
      window.removeEventListener("storage", refreshCatalog);
    };
  }, []);

  // Keep the current prototype favourites behavior for now.
  useEffect(() => {
    if (currentUser) {
      writeFavorites(currentUser, favorites);
    }
  }, [currentUser, favorites]);


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
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleFavorite(productId) {
    const product = catalogProducts.find(
      (item) => item.id === productId
    );

    const wasSaved = favorites.includes(productId);

    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );

    setNotice(
      product
        ? `${product.name} ${
            wasSaved ? "removed from" : "added to"
          } your favourites.`
        : ""
    );
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
        onSuccess={(loggedInUser) => {
          setFavorites(readFavorites(loggedInUser));
          setPage(pendingPage);
          setNotice(
            `Welcome to piqnora, ${loggedInUser.name}.`
          );
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }}
      />
    );
  }

  const sharedProps = {
    products: catalogProducts,
    categories: storefrontCategories,
    favorites,
    user: currentUser,
    onFavorite: toggleFavorite,
    onSelect: openProduct,
    onNavigate: navigate,
  };

  let content;

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
      content = (
        <ProductDetailsPage
          key={selectedProduct.id}
          {...sharedProps}
          product={selectedProduct}
          onBack={() => navigate("home")}
        />
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

  const shellPage = page === "detail" ? "home" : page;

  return (
    <StoreShell
      page={shellPage}
      isAuthenticated={isAuthenticated}
      user={currentUser}
      categories={storefrontCategories}
      favoritesCount={favorites.length}
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