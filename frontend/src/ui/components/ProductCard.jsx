import { useState } from "react";
import { Icon } from "./Icon";
import { isProductFavorited } from "../../services/favouritesApi";
import "./store.css";

export function Rating({ value, reviews }) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <span className="product-rating">
      <Icon name="star" aria-hidden="true" />
      <span className="rating-value">{Number(value).toFixed(1)}</span>
      {reviews !== undefined && reviews !== null && (
        <small>({reviews})</small>
      )}
    </span>
  );
}

export function ProductCard({
  product,
  isFavorite,
  onFavorite,
  onSelect,
}) {
  const [imageStatus, setImageStatus] = useState(
    product.image ? "loading" : "error"
  );

  return (
    <article className="product-card">
      <button
        className={`favorite-toggle ${isFavorite ? "selected" : ""}`}
        type="button"
        onClick={() => onFavorite(product.id)}
        aria-label={
          isFavorite
            ? `Remove ${product.name} from favourites`
            : `Add ${product.name} to favourites`
        }
      >
        <Icon
          name={isFavorite ? "heartFilled" : "heart"}
          aria-hidden="true"
        />
      </button>

      <button
        className="product-image-button"
        type="button"
        onClick={() => onSelect(product)}
        aria-label={`View ${product.name}`}
      >
        <span
          className={`product-image-wrap ${product.color || ""} image-${imageStatus}`}
          aria-busy={imageStatus === "loading"}
        >
          {imageStatus === "loading" && (
            <span className="image-loading-state">
              Loading image
            </span>
          )}

          {imageStatus === "error" ? (
            <span
              className="image-error-state"
              role="img"
              aria-label={`Image unavailable for ${product.name}`}
            >
              Image unavailable
            </span>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImageStatus("ready")}
              onError={() => setImageStatus("error")}
            />
          )}
        </span>
      </button>

      <div className="product-info">
        <p className="product-category">{product.category}</p>

        <button
          type="button"
          className="product-name"
          onClick={() => onSelect(product)}
        >
          {product.name}
        </button>

        <Rating
          value={product.rating}
          reviews={product.reviews}
        />

        <div className="product-bottom">
          <strong>
            ${Number(product.price).toFixed(2)}
          </strong>

          <button
            type="button"
            className="quick-add"
            onClick={() => onSelect(product)}
            aria-label={`View ${product.name}`}
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  favorites,
  onFavorite,
  onSelect,
  emptyMessage = "No products found.",
}) {
  if (!products.length) {
    return (
      <div className="empty-state">
        <span>
          <Icon name="search" />
        </span>
        <h3>Nothing here just yet</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={isProductFavorited(favorites, product.id)}
          onFavorite={onFavorite}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}