import './store.css'
import { Icon } from './Icon'

const navigation = [
  { id: 'home', label: 'Discover', icon: 'home' },
  { id: 'search', label: 'Search products', icon: 'search' },
  { id: 'favorites', label: 'My Favourites', icon: 'heart' },
  { id: 'recommended', label: 'For you', icon: 'sparkle' },
  { id: 'profile', label: 'My Profile', icon: 'user' }
]

export function StoreLogo({ onClick }) {
  return (
    <button className="store-logo" type="button" onClick={onClick} aria-label="piqnora home">
      <span className="store-logo-mark">p</span>
      <span>piqnora</span>
    </button>
  )
}

function userInitials(user) {
  return (user?.name || 'Member').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function StoreShell({ page, isAuthenticated, user, categories = [], favoritesCount = 0, announcement, onNavigate, onSearch, searchValue, children }) {
  return (
    <div className={`store-app ${isAuthenticated ? '' : 'public-store'}`}>
      <header className="store-header">
        <StoreLogo onClick={() => onNavigate(isAuthenticated ? 'home' : 'welcome')} />
        {isAuthenticated ? <>
          <form className="header-search" onSubmit={(event) => { event.preventDefault(); onNavigate('search') }}>
            <span aria-hidden="true"><Icon name="search" /></span>
            <input value={searchValue} onChange={(event) => onSearch(event.target.value)} placeholder="Search products, brands and categories..." aria-label="Search products" />
            <kbd>Ctrl K</kbd>
          </form>
          <div className="header-actions">
            <button className="icon-button mobile-search-button" type="button" aria-label="Search" onClick={() => onNavigate('search')}><Icon name="search" /></button>
            <button className="icon-button" type="button" aria-label="Notifications"><Icon name="bell" /></button>
            <button className="header-avatar" type="button" aria-label="Open profile" onClick={() => onNavigate('profile')}>{userInitials(user)}</button>
          </div>
        </> : <div className="public-header-actions">
          <button type="button" onClick={() => onNavigate('login')}>Log in</button>
          <button type="button" onClick={() => onNavigate('signup')}>Create account <Icon name="arrowRight" /></button>
        </div>}
      </header>

      {isAuthenticated && <aside className="store-sidebar">
        <p className="sidebar-caption">MENU</p>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <button className={`sidebar-link ${page === item.id ? 'active' : ''}`} key={item.id} type="button" onClick={() => onNavigate(item.id)}>
              <span className="sidebar-icon" aria-hidden="true"><Icon name={item.icon} /></span>
              <span>{item.label}</span>
              {item.id === 'favorites' && <span className="sidebar-count">{favoritesCount}</span>}
            </button>
          ))}
        </nav>
        <p className="sidebar-caption category-caption">CATEGORIES</p>
        <nav aria-label="Product categories" className="sidebar-categories">
          {categories.slice(0, 5).map((category) => (
            <button key={category.name} type="button" className="sidebar-link" onClick={() => onNavigate('search', category.name)}>
              <span className="category-dot" />
              <span>{category.name}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-promo">
          <span className="promo-sparkle"><Icon name="sparkle" /></span>
          <strong>Find your next favourite</strong>
          <p>Explore picks shaped around what you save.</p>
          <button type="button" onClick={() => onNavigate('recommended')}>For you <Icon name="arrowRight" /></button>
        </div>
        <button className="sidebar-profile" type="button" onClick={() => onNavigate('profile')}>
          <span className="profile-avatar">{userInitials(user)}</span>
          <span><strong>{user?.name || 'piqnora member'}</strong><small>{user?.email || user?.phone || 'Personal account'}</small></span>
          <span className="profile-more"><Icon name="ellipsis" /></span>
        </button>
      </aside>}

      {announcement && <div className="store-announcement" role="status" aria-live="polite">{announcement}</div>}
      <main className="store-main">{children}</main>
      {isAuthenticated && <nav className="mobile-tabbar" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <button className={page === item.id ? 'active' : ''} key={item.id} type="button" onClick={() => onNavigate(item.id)}>
            <span><Icon name={item.icon} /></span><small>{item.label === 'Search products' ? 'Search' : item.label.replace('My ', '')}</small>
          </button>
        ))}
      </nav>}
    </div>
  )
}

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  )
}

export function SectionHeading({ title, detail, action, onAction }) {
  return (
    <div className="section-heading">
      <div><h2>{title}</h2>{detail && <p>{detail}</p>}</div>
      {action && <button type="button" onClick={onAction}>{action}<Icon name="arrowRight" aria-hidden="true" /></button>}
    </div>
  )
}
