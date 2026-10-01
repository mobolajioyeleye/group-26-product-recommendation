import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { ProductGrid } from '../components/ProductCard'
import { PageHeading } from '../components/StoreShell'
import './pages.css'

export default function SearchPage({ products, categories = [], favorites, searchValue, initialCategory, onFavorite, onSelect, onSearch }) {
  const [category, setCategory] = useState(initialCategory || 'All products')
  const [sort, setSort] = useState('Recommended')
  const [maxPrice, setMaxPrice] = useState(300)
  const [minRating, setMinRating] = useState(0)
  const filters = ['All products', ...new Set([
    ...categories.map((item) => item.name),
    ...products.map((product) => product.category)
  ])]

  const matchingProducts = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    const results = products.filter((product) => {
      const matchesQuery = !query || `${product.name} ${product.category}`.toLowerCase().includes(query)
      const matchesCategory = category === 'All products' || product.category === category
      return matchesQuery && matchesCategory && product.price <= maxPrice && product.rating >= minRating
    })
    if (sort === 'Price: low to high') results.sort((a, b) => a.price - b.price)
    if (sort === 'Top rated') results.sort((a, b) => b.rating - a.rating)
    return results
  }, [products, searchValue, category, maxPrice, minRating, sort])

  return (
    <div className="page-content results-page">
      <PageHeading eyebrow="DISCOVER / SEARCH" title="Find your next favourite" description="A world of good things, picked just for you." />
      <div className="results-searchbar"><span><Icon name="search" /></span><input value={searchValue} onChange={(event) => onSearch(event.target.value)} placeholder="Try ‘wireless headphones’" aria-label="Search products" /><kbd>Enter</kbd></div>
      <div className="results-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter by category">
          {filters.map((filter) => <button className={category === filter ? 'active' : ''} key={filter} type="button" onClick={() => setCategory(filter)}>{filter}</button>)}
        </div>
        <label className="sort-select">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option>Recommended</option><option>Price: low to high</option><option>Top rated</option></select></label>
      </div>
      <div className="results-layout">
        <aside className="filter-panel">
          <div className="filter-panel-heading"><h2>Filters</h2><button type="button" onClick={() => { setCategory('All products'); setMaxPrice(300); setMinRating(0) }}>Clear all</button></div>
          <fieldset><legend>Category</legend>{filters.slice(1).map((filter) => <label className="filter-check" key={filter}><input type="checkbox" checked={category === filter} onChange={() => setCategory(category === filter ? 'All products' : filter)} /><span>{filter}</span><small>{products.filter((product) => product.category === filter).length}</small></label>)}</fieldset>
          <fieldset><legend>Price range</legend><div className="price-range-label"><span>$0</span><strong>Up to ${maxPrice}</strong></div><input className="range-input" type="range" min="30" max="300" step="10" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} aria-label="Maximum price" /></fieldset>
          <fieldset><legend>Customer rating</legend>{[4.5, 4, 3].map((rating) => <label className="filter-check" key={rating}><input type="radio" name="rating" checked={minRating === rating} onChange={() => setMinRating(rating)} /><span className="filter-stars" aria-label={`${rating} stars and up`}><Icon name="star" /><Icon name="star" /><Icon name="star" /><Icon name="star" /><Icon name="star" /> <small>& up</small></span></label>)}</fieldset>
        </aside>
        <section className="results-products">
          <div className="results-count"><span><strong>{matchingProducts.length}</strong> products found</span></div>
          <ProductGrid products={matchingProducts} favorites={favorites} onFavorite={onFavorite} onSelect={onSelect} emptyMessage="Try another search or clear a filter to see more products." />
        </section>
      </div>
    </div>
  )
}
