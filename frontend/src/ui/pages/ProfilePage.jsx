import { Icon } from '../components/Icon'
import { PageHeading } from '../components/StoreShell'
import './pages.css'

export default function ProfilePage({ user, onNavigate }) {
  const name = user?.name || 'piqnora member'
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()

  return (
    <div className="page-content profile-page">
      <PageHeading eyebrow="YOUR SPACE" title="My profile" description="Your account details and discovery preferences." />
      <div className="profile-layout">
        <aside className="profile-menu">
          <button className="active" type="button"><Icon name="user" aria-hidden="true" /> <span>Personal details</span></button>
          <button type="button" onClick={() => onNavigate('favorites')}><Icon name="heart" aria-hidden="true" /> <span>My favourites</span></button>
          <button type="button" onClick={() => onNavigate('recommended')}><Icon name="sparkle" aria-hidden="true" /> <span>For you</span></button>
          <button className="profile-logout" type="button" onClick={() => onNavigate('logout')}><Icon name="arrowRight" aria-hidden="true" /> <span>Log out</span></button>
        </aside>
        <section className="profile-content">
          <div className="profile-card profile-details-card">
            <div className="profile-card-heading">
              <div><h2>Personal details</h2><p>Contact details used for your piqnora account.</p></div>
            </div>
            <div className="profile-identity">
              <span className="profile-avatar profile-avatar-large">{initials}</span>
              <span><strong>{name}</strong><small>{user?.email || user?.phone || 'Add contact information'}</small></span>
              <span className="member-badge">PIQNORA MEMBER</span>
            </div>
            <div className="profile-fields">
              <div><small>Full name</small><strong>{name}</strong></div>
              <div><small>Email address</small><strong>{user?.email || 'Not provided'}</strong></div>
              <div><small>Phone number</small><strong>{user?.phone || 'Not provided'}</strong></div>
            </div>
          </div>
          <div className="profile-card profile-discovery-card">
            <div className="profile-card-heading">
              <div><h2>Your discovery space</h2><p>Return to your saved finds or explore more recommendations.</p></div>
            </div>
            <div className="profile-discovery-actions">
              <button type="button" onClick={() => onNavigate('favorites')}><Icon name="heart" /> My favourites</button>
              <button type="button" onClick={() => onNavigate('recommended')}><Icon name="sparkle" /> Recommended for you</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
