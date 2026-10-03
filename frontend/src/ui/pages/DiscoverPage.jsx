import { useEffect, useState } from 'react'
import { CategoryIcon, Icon } from '../components/Icon'
import { ProductGrid } from '../components/ProductCard'
import { PageHeading, SectionHeading } from '../components/StoreShell'
import { getRecommendations } from '../../services/recommendationApi'
import './pages.css'

export default function DiscoverPage({ products, categories = [], favorites, user, onFavorite, onSelect, onNavigate, onCategory }) {
  const [recommendations, setRecommendations] = useState([])
  const [isRecLoading, setIsRecLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false

    async function loadPicks() {
      setIsRecLoading(true)
      try {
        const result = await getRecommendations({ limit: 8 })
        if (!isCancelled && Array.isArray(result.recommendations) && result.recommendations.length > 0) {
          setRecommendations(result.recommendations)
        }
      } catch (err) {
        console.warn("[DiscoverPage] Could not load recommendation picks:", err.message)
      } finally {
        if (!isCancelled) {
          setIsRecLoading(false)
        }
      }
    }

    loadPicks()

    return () => {
      isCancelled = true
    }
  }, [favorites, user?.id])

  const trending = products.slice().sort((first, second) => second.rating - first.rating).slice(0, 4)

  // Use backend recommendations, falling back to top products if backend recommendations not loaded yet
  const effectiveRecommendations = recommendations.length > 0 ? recommendations : products
  const heroSlides = effectiveRecommendations.slice(0, 3)
  const picks = (recommendations.length >= 4 ? recommendations.slice(0, 4) : effectiveRecommendations.slice(0, 4))

  const [activeSlide, setActiveSlide] = useState(0)
  const safeSlideIndex = heroSlides.length ? activeSlide % heroSlides.length : 0
  const featuredProduct = heroSlides[safeSlideIndex]
  const firstName = user?.name?.split(' ')[0] || 'there'

  useEffect(() => {
    if (heroSlides.length < 2) {
      return
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [heroSlides.length])

  function moveSlide(direction) {
    if (heroSlides.length < 2) {
      return
    }

    setActiveSlide((current) => (current + direction + heroSlides.length) % heroSlides.length)
  }

  return (
    <div className="page-content discover-page">
      <PageHeading eyebrow="YOUR DISCOVERY SPACE" title={`Good morning, ${firstName}`} description="Find something you'll love today." action={<button className="soft-button" type="button" onClick={() => onNavigate('favorites')}><Icon name="heart" aria-hidden="true" /> <span>My favourites</span></button>} />

      <section className="discovery-hero">
        <div className="hero-copy">
          <span className="hero-kicker"><i /> CURATED FOR YOU</span>
          <h2>Top picks for<br />your everyday.</h2>
          <p>Thoughtful finds, standout quality, and little things that make life better.</p>
          <button className="primary-button" type="button" onClick={() => onNavigate('search')}>Explore picks <Icon name="arrowRight" aria-hidden="true" /></button>
          <div className="hero-carousel-controls" aria-label="Recommended product slides">
            <button type="button" className="hero-carousel-arrow" aria-label="Previous recommendation" onClick={() => moveSlide(-1)} disabled={heroSlides.length < 2}>
              <Icon name="arrowLeft" />
            </button>
            <div className="hero-pagination" role="group" aria-label="Choose recommendation slide">
              {heroSlides.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  className={`hero-pagination-dot ${safeSlideIndex === index ? 'current' : ''}`}
                  aria-label={`Show ${product.name}`}
                  aria-current={safeSlideIndex === index ? 'true' : undefined}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
            <span className="hero-slide-count">{String(safeSlideIndex + 1).padStart(2, '0')} <small>/ {String(heroSlides.length).padStart(2, '0')}</small></span>
            <button type="button" className="hero-carousel-arrow" aria-label="Next recommendation" onClick={() => moveSlide(1)} disabled={heroSlides.length < 2}>
              <Icon name="arrowRight" />
            </button>
          </div>
        </div>
        <div className="hero-image-area">
          <div className="hero-sun" />
          {featuredProduct ? (
            <>
              <span className="hero-note note-top"><Icon name="sparkle" /> {featuredProduct.recommendationReason || `New in ${featuredProduct.category}`}</span>
              <div className="hero-carousel-viewport" aria-roledescription="carousel" aria-label="Products recommended for you">
                <div className="hero-slide-track" style={{ transform: `translateX(-${safeSlideIndex * 100}%)` }}>
                  {heroSlides.map((product) => (
                    <button className="hero-slide" key={product.id} type="button" onClick={() => onSelect(product)} aria-label={`View ${product.name}`}>
                      <img src={product.image} alt={product.name} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="hero-product-tag" aria-live="polite">
                <span className="hero-tag-icon"><CategoryIcon name={featuredProduct.category} /></span>
                <span><small>RECOMMENDED FOR YOU</small><strong>{featuredProduct.name}</strong></span>
                <Icon className="hero-tag-arrow" name="arrowUpRight" aria-hidden="true" />
              </div>
            </>
          ) : <div className="hero-image-placeholder" role="status">No products available yet.</div>}
        </div>
        <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
      </section>

      <section className="category-section">
        <SectionHeading title="Shop by category" detail="A good place to start" action="View all" onAction={() => onNavigate('search')} />
        {categories.length
          ? <div className="category-grid">
              {categories.slice(0, 5).map((category, index) => (
                <button className="category-card" key={category.name} type="button" onClick={() => onCategory(category.name)}>
                  <span className={`category-art category-art-${index + 1}`}><CategoryIcon name={category.name} /></span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{category.count} finds</span>
                  <Icon className="category-arrow" name="arrowUpRight" aria-hidden="true" />
                </button>
              ))}
            </div>
          : <div className="empty-state category-empty-state"><span><Icon name="box" /></span><h3>No categories yet</h3><p>New product categories will appear here when they are added.</p></div>}
      </section>

      <section className="products-section">
        <SectionHeading title="Trending right now" detail="The things everyone's talking about" action="See all" onAction={() => onNavigate('search')} />
        <ProductGrid products={trending} favorites={favorites} onFavorite={onFavorite} onSelect={onSelect} />
      </section>

      <section className="picks-section">
        <SectionHeading title="Picked just for you" detail="A few things we think you'll love" action="Explore more" onAction={() => onNavigate('recommended')} />
        {isRecLoading && recommendations.length === 0 ? (
          <div className="empty-state">
            <span>⌛</span>
            <h3>Finding your picks...</h3>
          </div>
        ) : (
          <ProductGrid products={picks} favorites={favorites} onFavorite={onFavorite} onSelect={onSelect} />
        )}
      </section>
      <footer className="store-footer"><span>© 2025 piqnora</span><span>Good things, thoughtfully found.</span><a href="#help">Need a hand?</a></footer>
    </div>
  )
}
