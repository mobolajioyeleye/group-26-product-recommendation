import { useState, useEffect } from "react";
import { Icon } from "../components/Icon";
import { Rating, ProductGrid } from "../components/ProductCard";
import { SectionHeading } from "../components/StoreShell";
import { recordProductView } from "../../services/activityApi";
import "./pages.css";


export default function ProductDetailsPage({
  product,
  products,
  favorites,
  onFavorite,
  onSelect,
  onBack,
}) {
  const [activeTab, setActiveTab] = useState("Overview");

  const [imageStatus, setImageStatus] = useState(
    product.image ? "loading" : "error"
  );

  const isFavorite = favorites.includes(product.id);

  const related = products
    .filter(
      (item) =>
        item.id !== product.id &&
        item.category === product.category
    )
    .slice(0, 4);

  const hasReviews =
    product.reviews !== undefined &&
    product.reviews !== null;

  const categoryName = product.category || "Uncategorized";

  useEffect(() => {
    if (product?.id) {
      recordProductView(product.id);
    }
  }, [product?.id]);

  return (
    <div className="page-content detail-page">
      <div className="detail-breadcrumb">
        <button type="button" onClick={onBack}>
          Discover
        </button>

        <span>/</span>

        <button type="button" onClick={onBack}>
          {categoryName}
        </button>

        <span>/</span>

        <span>{product.name}</span>
      </div>

      <section className="detail-layout">
        <div className="detail-gallery">
          <div className="detail-thumbnails">
            <button className="thumb-active" type="button">
              {product.image ? (
                <img
                  src={product.image}
                  alt="Product view"
                />
              ) : (
                <span>Image unavailable</span>
              )}
            </button>
          </div>

          <div
            className={`detail-image ${product.color || ""}`}
            aria-busy={imageStatus === "loading"}
          >
            {product.badge && (
              <span className="detail-badge">
                {product.badge}
              </span>
            )}

            {imageStatus === "loading" && (
              <span className="detail-image-status">
                Loading product image
              </span>
            )}

            {imageStatus === "error" || !product.image ? (
              <span
                className="detail-image-status"
                role="img"
                aria-label={`Image unavailable for ${product.name}`}
              >
                Image unavailable
              </span>
            ) : (
              <img
                src={product.image}
                alt={product.name}
                onLoad={() => setImageStatus("ready")}
                onError={() => setImageStatus("error")}
              />
            )}
          </div>
        </div>

        <div className="detail-info">
          <p className="product-category">
            {categoryName.toUpperCase()}
          </p>

          <h1>{product.name}</h1>

          <p className="detail-subtitle">
            Made for the everyday, elevated.
          </p>

          <Rating
            value={product.rating}
            reviews={product.reviews}
          />

          <div className="detail-price">
            <strong>
              ${Number(product.price).toFixed(2)}
            </strong>
          </div>

          <p className="detail-description">
            {product.description ||
              "No additional product description is available."}
          </p>

          <button
            className={`detail-favorite-button ${
              isFavorite ? "saved" : ""
            }`}
            type="button"
            onClick={() => onFavorite(product.id)}
          >
            <Icon
              name={
                isFavorite
                  ? "heartFilled"
                  : "heart"
              }
              aria-hidden="true"
            />

            {isFavorite
              ? "Saved to favourites"
              : "Add to favourites"}
          </button>
        </div>
      </section>

      <section className="detail-tabs-section">
        <div className="detail-tabs">
          {["Overview", "Details", "Reviews"].map(
            (tab) => (
              <button
                className={
                  activeTab === tab ? "active" : ""
                }
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
              >
                {tab}

                {tab === "Reviews" &&
                  hasReviews && (
                    <small>
                      {" "}
                      ({product.reviews})
                    </small>
                  )}
              </button>
            )
          )}
        </div>

        <div className="detail-tab-copy">
          <h2>
            {activeTab === "Overview"
              ? "The good stuff"
              : activeTab === "Details"
                ? "Thoughtful details"
                : "Customer reviews"}
          </h2>

          <p>
            {activeTab === "Reviews"
              ? hasReviews
                ? `Rated ${product.rating} out of 5 by ${product.reviews} customers.`
                : "Customer ratings and reviews are not available yet."
              : product.description ||
                "No additional product information is available."}
          </p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="products-section">
          <SectionHeading
            title="You might also like"
            detail="A few more good finds"
            action="Back to discover"
            onAction={onBack}
          />

          <ProductGrid
            products={related}
            favorites={favorites}
            onFavorite={onFavorite}
            onSelect={onSelect}
          />
        </section>
      )}
    </div>
  );
}