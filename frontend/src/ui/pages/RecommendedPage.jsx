import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { ProductGrid } from "../components/ProductCard";
import { PageHeading, SectionHeading } from "../components/StoreShell";
import { getRecommendations } from "../../services/recommendationApi";
import "./pages.css";

export default function RecommendedPage({
  favorites,
  onFavorite,
  onSelect,
  onNavigate,
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadRecommendations() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getRecommendations({ limit: 12 });
        if (!isCancelled) {
          setRecommendations(result.recommendations);
          setMeta(result.meta);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err.message || "Unable to load recommendations at the moment."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      isCancelled = true;
    };
  }, [favorites]);

  const isPersonalized = Boolean(meta?.personalized);
  const topCategory = meta?.topCategories?.[0]?.categoryName;

  return (
    <div className="page-content recommended-page">
      <PageHeading
        eyebrow="A LITTLE MORE YOU"
        title="Recommended for you"
        description="Discover finds selected around what you view and save."
        action={
          <button
            className="soft-button"
            type="button"
            onClick={() => onNavigate("favorites")}
          >
            <Icon name="heart" /> Your favourites
          </button>
        }
      />

      <section className="recommendation-banner">
        <span className="recommendation-icon">
          <Icon name="sparkle" />
        </span>
        <div>
          <strong>
            {isPersonalized
              ? topCategory
                ? `Picked for your interest in ${topCategory}`
                : "Picked around your favourites & activity"
              : "A thoughtful place to start"}
          </strong>
          <p>
            {isPersonalized
              ? "Finds tailored to what you have browsed and saved, with fresh picks just for you."
              : "New here? Start with well-rated, well-reviewed finds. Save a few to shape future picks."}
          </p>
        </div>
        <span className="recommendation-decoration">
          <Icon name="star" />
        </span>
      </section>

      {isLoading ? (
        <div className="empty-state">
          <span>⌛</span>
          <h3>Loading recommendations...</h3>
          <p>Curating personalized finds based on your activity.</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <span>⚠️</span>
          <h3>Unable to load recommendations</h3>
          <p>{error}</p>
        </div>
      ) : (
        <section className="products-section">
          <SectionHeading
            title={isPersonalized ? "Based on what you like" : "Popular starter picks"}
            detail={`${recommendations.length} ${
              recommendations.length === 1 ? "product" : "products"
            } to explore`}
          />
          <ProductGrid
            products={recommendations}
            favorites={favorites}
            onFavorite={onFavorite}
            onSelect={onSelect}
            emptyMessage="No recommendations available at this time. Check back soon."
          />
        </section>
      )}
    </div>
  );
}
