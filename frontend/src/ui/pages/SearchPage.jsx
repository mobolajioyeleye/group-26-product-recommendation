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
  const [category, setCategory] = useState(
    initialCategory || "All products"
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
        let results = products;

        if (query) {
          const backendProducts = await searchProducts(query);

          results = normalizeProducts(
            backendProducts,
            categories
          );
        } else if (category !== "All products") {
          const selectedCategory = categories.find(
            (item) => item.name === category
          );

          if (selectedCategory?.id) {
            const backendProducts =
              await getProductsByCategory(selectedCategory.id);

            results = normalizeProducts(
              backendProducts,
              categories
            );
          } else {
            results = [];
          }
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
  }, [searchValue, category, products, categories]);

  const matchingProducts = useMemo(() => {
    let results = [...searchResults];

    if (category !== "All products") {
      results = results.filter(
        (product) => product.category === category
      );
    }

    results = results.filter(
      (product) => Number(product.price) <= maxPrice
    );

    if (sort === "Price: low to high") {
      results.sort(
        (first, second) =>
          Number(first.price) - Number(second.price)
      );
    }

    return results;
  }, [searchResults, category, maxPrice, sort]);

  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory);
  }

  function clearFilters() {
    setCategory("All products");
    setMaxPrice(5000);
    setSort("Recommended");
    onSearch("");
  }

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
          role="tablist"
          aria-label="Filter by category"
        >
          {filters.map((filter) => (
            <button
              className={
                category === filter ? "active" : ""
              }
              key={filter}
              type="button"
              onClick={() =>
                handleCategoryChange(filter)
              }
            >
              {filter}
            </button>
          ))}
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

            {categories.map((item) => (
              <label
                className="filter-check"
                key={item.id}
              >
                <input
                  type="checkbox"
                  checked={category === item.name}
                  onChange={() =>
                    setCategory(
                      category === item.name
                        ? "All products"
                        : item.name
                    )
                  }
                />

                <span>{item.name}</span>

                <small>{item.count ?? 0}</small>
              </label>
            ))}
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
                setMaxPrice(Number(event.target.value))
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
                We're finding products that match your
                search.
              </p>
            </div>
          ) : searchError ? (
            <div className="empty-state">
              <span>⚠️</span>
              <h3>Unable to search products</h3>
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