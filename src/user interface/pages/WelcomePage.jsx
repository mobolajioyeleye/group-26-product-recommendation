import { PageHeading, SectionHeading } from '../components/StoreShell'
import { CategoryIcon, Icon } from '../components/Icon'
import welcomeCollectionImage from '../../../img/products/welcome-collection.jpg'
import './pages.css'

export default function WelcomePage({ categories = [], onNavigate, onCategory }) {
  return (
    <div className="page-content welcome-page">
      <PageHeading
        eyebrow="A BETTER WAY TO FIND YOUR NEXT FAVOURITE"
        title="Discover a little more."
        description="Discover products made for your interests."
      />
      <section className="welcome-hero">
        <div className="welcome-copy">
          <span className="hero-kicker"><i /> THE GOOD FINDS EDIT</span>
          <h2>Discover amazing<br />products, tailored<br />just for you.</h2>
          <p>Explore hand-picked products, trending picks, and personal recommendations made around what you love.</p>
          <div className="welcome-actions">
            <button className="primary-button" type="button" onClick={() => onNavigate('home')}>Get started <Icon name="arrowRight" aria-hidden="true" /></button>
            <button className="welcome-secondary" type="button" onClick={() => onNavigate('search')}>Explore the edit</button>
          </div>
          <div className="welcome-trust">
            <span aria-label="5 out of 5"><Icon name="star" /><Icon name="star" /><Icon name="star" /><Icon name="star" /><Icon name="star" /></span>
            <small>Loved by curious shoppers everywhere</small>
          </div>
        </div>
        <div className="welcome-art">
          <div className="welcome-art-shape shape-one" />
          <div className="welcome-art-shape shape-two" />
          <span className="floating-label label-one">A good find <Icon name="sparkle" aria-hidden="true" /></span>
          <span className="floating-label label-two">Just for you</span>
          <img src={welcomeCollectionImage} alt="A curated collection of lifestyle favourites" />
        </div>
      </section>
      <section className="welcome-categories">
        <SectionHeading
          title="Popular categories"
          detail="Start with what you love"
          action="See all categories"
          onAction={() => onNavigate('search')}
        />
        {categories.length ? (
          <div className="category-grid">
            {categories.slice(0, 5).map((category, index) => (
              <button
                className="category-card"
                key={category.name}
                type="button"
                onClick={() => onCategory(category.name)}
              >
                <span className={`category-art category-art-${index + 1}`}><CategoryIcon name={category.name} /></span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.count} finds</span>
                <Icon className="category-arrow" name="arrowUpRight" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state category-empty-state">
            <span><Icon name="box" /></span>
            <h3>No categories yet</h3>
            <p>Check back when new products are added.</p>
          </div>
        )}
      </section>
      <section className="welcome-bottom-cta">
        <div>
          <span className="hero-kicker">YOUR NEXT FAVOURITE IS WAITING</span>
          <h2>Good things are closer than you think.</h2>
        </div>
        <button className="primary-button" type="button" onClick={() => onNavigate('home')}>
          Browse the collection <Icon name="arrowRight" aria-hidden="true" />
        </button>
      </section>
    </div>
  )
}
