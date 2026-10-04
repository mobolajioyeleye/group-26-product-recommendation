import { useEffect, useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { ProductGrid } from "../components/ProductCard";
import { PageHeading } from "../components/StoreShell";
import {
  searchProducts,
  getProductsByCategory,
} from "../../services/api";
import { normalizeProducts } from "../data/productAdapter";
import "./pages.css";

export default function SearchPage({
  products,
  categories = [],
  favorites,
  searchValue,
  initialCategory,
  onFavorite,
  onSelect,
  onSearch,
}) {
  const [selectedCategories, setSelectedCategories] = useState(
    initialCategory && initialCategory !== "All products"
      ? [initialCategory]
      : []
  );

  const [sort, setSort] = useState("Recommended");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [searchResults, setSearchResults] = useState(products);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const filters = [
    "All products",
    ...categories.map((item) => item.name),
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadSearchResults() {
      const query = searchValue.trim();

      setIsSearching(true);
      setSearchError("");

      try {
        let results = [];

        // Search products from the backend first.
        if (query) {
          const backendProducts = await searchProducts(query);

          results = normalizeProducts(
            backendProducts,
            categories
          );

          // Apply multiple selected categories to search results.
          if (selectedCategories.length > 0) {
            const selectedSet = new Set(
              selectedCategories.map((name) =>
                name.toLowerCase()
              )
            );

            results = results.filter((product) =>
              selectedSet.has(
                String(product.category || "").toLowerCase()
              )
            );
          }
        }

        // No search text, but one or more categories selected.
        else if (selectedCategories.length > 0) {
          const selectedCategoryObjects = categories.filter(
            (item) =>
              selectedCategories.includes(item.name) &&
              item.id
          );

          const categoryResults = await Promise.all(
            selectedCategoryObjects.map(async (categoryItem) => {
              const backendProducts =
                await getProductsByCategory(categoryItem.id);

              return normalizeProducts(
                backendProducts,
                categories
              );
            })
          );

          // Combine products from all selected categories
          // and remove duplicates.
          const uniqueProducts = new Map();

          categoryResults.flat().forEach((product) => {
            if (product?.id) {
              uniqueProducts.set(product.id, product);
            }
          });

          results = Array.from(uniqueProducts.values());
        }

        // No search and no category filter.
        else {
          results = products;
        }

        if (cancelled) {
          return;
        }

        setSearchResults(results);
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
          setSearchError(
            error.message ||
              "Unable to search products right now."
          );
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    const timerId = window.setTimeout(
      loadSearchResults,
      searchValue.trim() ? 300 : 0
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [
    searchValue,
    selectedCategories,
    products,
    categories,
  ]);

  const matchingProducts = useMemo(() => {
    let results = [...searchResults];

    // Extra client-side category check keeps the UI consistent
    // with the selected checkboxes.
    if (selectedCategories.length > 0) {
      const selectedSet = new Set(
        selectedCategories.map((name) =>
          name.toLowerCase()
        )
      );

      results = results.filter((product) =>
        selectedSet.has(
          String(product.category || "").toLowerCase()
        )
      );
    }

    results = results.filter(
      (product) =>
        Number(product.price) <= maxPrice
    );

    if (sort === "Price: low to high") {
      results.sort(
        (first, second) =>
          Number(first.price) - Number(second.price)
      );
    }

    return results;
  }, [
    searchResults,
    selectedCategories,
    maxPrice,
    sort,
  ]);

  function toggleCategory(categoryName) {
    if (categoryName === "All products") {
      setSelectedCategories([]);
      return;
    }

    setSelectedCategories((current) =>
      current.includes(categoryName)
        ? current.filter(
            (name) => name !== categoryName
          )
        : [...current, categoryName]
    );
  }

  function clearFilters() {
    setSelectedCategories([]);
    setMaxPrice(5000);
    setSort("Recommended");
    onSearch("");
  }

  const allProductsSelected =
    selectedCategories.length === 0;

  return (
    <div className="page-content results-page">
      <PageHeading
        eyebrow="DISCOVER / SEARCH"
        title="Find your next favourite"
        description="A world of good things, picked just for you."
      />

      <div className="results-searchbar">
        <span>
          <Icon name="search" />
        </span>

        <input
          value={searchValue}
          onChange={(event) =>
            onSearch(event.target.value)
          }
          placeholder="Try ‘wireless headphones’"
          aria-label="Search products"
        />

        <kbd>Enter</kbd>
      </div>

      <div className="results-toolbar">
        <div
          className="filter-tabs"
          role="group"
          aria-label="Filter by category"
        >
          {filters.map((filter) => {
            const isActive =
              filter === "All products"
                ? allProductsSelected
                : selectedCategories.includes(filter);

            return (
              <button
                className={isActive ? "active" : ""}
                key={filter}
                type="button"
                aria-pressed={isActive}
                onClick={() =>
                  toggleCategory(filter)
                }
              >
                {filter}
              </button>
            );
          })}
        </div>

        <label className="sort-select">
          Sort by

          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
          >
            <option>Recommended</option>
            <option>Price: low to high</option>
          </select>
        </label>
      </div>

      <div className="results-layout">
        <aside className="filter-panel">
          <div className="filter-panel-heading">
            <h2>Filters</h2>

            <button
              type="button"
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>

          <fieldset>
            <legend>Category</legend>

            {categories.map((item) => {
              const isChecked =
                selectedCategories.includes(item.name);

              return (
                <label
                  className="filter-check"
                  key={item.id}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() =>
                      toggleCategory(item.name)
                    }
                  />

                  <span>{item.name}</span>

                  <small>
                    {item.count ?? 0}
                  </small>
                </label>
              );
            })}
          </fieldset>

          <fieldset>
            <legend>Price range</legend>

            <div className="price-range-label">
              <span>$0</span>

              <strong>
                Up to ${maxPrice}
              </strong>
            </div>

            <input
              className="range-input"
              type="range"
              min="0"
              max="5000"
              step="10"
              value={maxPrice}
              onChange={(event) =>
                setMaxPrice(
                  Number(event.target.value)
                )
              }
              aria-label="Maximum price"
            />
          </fieldset>
        </aside>

        <section className="results-products">
          <div className="results-count">
            <span>
              <strong>
                {matchingProducts.length}
              </strong>{" "}
              products found
            </span>
          </div>

          {isSearching ? (
            <div className="empty-state">
              <span>⌛</span>

              <h3>Searching products...</h3>

              <p>
                We're finding products that match
                your search.
              </p>
            </div>
          ) : searchError ? (
            <div className="empty-state">
              <span>⚠️</span>

              <h3>
                Unable to search products
              </h3>

              <p>{searchError}</p>
            </div>
          ) : (
            <ProductGrid
              products={matchingProducts}
              favorites={favorites}
              onFavorite={onFavorite}
              onSelect={onSelect}
              emptyMessage="Try another search or clear a filter to see more products."
            />
          )}
        </section>
      </div>
    </div>
  );
}