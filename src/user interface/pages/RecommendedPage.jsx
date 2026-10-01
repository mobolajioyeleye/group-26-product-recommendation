import { Icon } from '../components/Icon'
import { ProductGrid } from '../components/ProductCard'
import { PageHeading, SectionHeading } from '../components/StoreShell'
import { recommendProducts } from '../data/recommendations'
import './pages.css'

export default function RecommendedPage({ products, favorites, onFavorite, onSelect, onNavigate }) {
  const recommendations = recommendProducts(products, favorites)
  const hasPreferences = favorites.length > 0

  return (
    <div className="page-content recommended-page">
      <PageHeading
        eyebrow="A LITTLE MORE YOU"
        title="Recommended for you"
        description="Discover finds selected around what you save."
        action={<button className="soft-button" type="button" onClick={() => onNavigate('favorites')}><Icon name="heart" /> Your favourites</button>}
      />
      <section className="recommendation-banner">
        <span className="recommendation-icon"><Icon name="sparkle" /></span>
        <div>
          <strong>{hasPreferences ? 'Picked around your favourites' : 'A thoughtful place to start'}</strong>
          <p>{hasPreferences
            ? 'More finds from categories you have saved, with highly rated picks first.'
            : 'New here? Start with well-rated, well-reviewed finds. Save a few to shape future picks.'}</p>
        </div>
        <span className="recommendation-decoration"><Icon name="star" /></span>
      </section>
      <section className="products-section">
        <SectionHeading title={hasPreferences ? 'Based on what you like' : 'Popular starter picks'} detail={`${recommendations.length} ${recommendations.length === 1 ? 'product' : 'products'} to explore`} />
        <ProductGrid
          products={recommendations}
          favorites={favorites}
          onFavorite={onFavorite}
          onSelect={onSelect}
          emptyMessage="You have saved every product in the catalog. Check back when more finds are added."
        />
      </section>
    </div>
  )
}
