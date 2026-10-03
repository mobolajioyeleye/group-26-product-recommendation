import { Icon } from '../components/Icon'
import { ProductGrid } from '../components/ProductCard'
import { PageHeading } from '../components/StoreShell'
import { isProductFavorited } from '../../services/favouritesApi'
import './pages.css'

export default function FavoritesPage({ products, favorites, favoritesLoading, onFavorite, onSelect, onNavigate }) {
  const savedProducts = products.filter((product) => isProductFavorited(favorites, product.id))

  if (favoritesLoading) {
    return (
      <div className="page-content saved-page">
        <PageHeading eyebrow="YOUR LITTLE COLLECTION" title="My favourites" description="All the good things you've saved, in one place." action={<button className="soft-button" type="button" onClick={() => onNavigate('search')}><Icon name="search" /> Find more</button>} />
        <div className="empty-state">
          <span>⌛</span>
          <h3>Loading your favourites...</h3>
          <p>Syncing with your account across all devices.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content saved-page">
      <PageHeading eyebrow="YOUR LITTLE COLLECTION" title="My favourites" description="All the good things you've saved, in one place." action={<button className="soft-button" type="button" onClick={() => onNavigate('search')}><Icon name="search" /> Find more</button>} />
      <div className="saved-summary"><span className="saved-heart"><Icon name="heart" /></span><span><strong>{savedProducts.length} saved finds</strong><small>Keep the things you love close.</small></span><span className="saved-summary-arrow"><Icon name="sparkle" /></span></div>
      <ProductGrid products={savedProducts} favorites={favorites} onFavorite={onFavorite} onSelect={onSelect} emptyMessage="Tap the heart on anything you love and it will be waiting here." />
    </div>
  )
}
