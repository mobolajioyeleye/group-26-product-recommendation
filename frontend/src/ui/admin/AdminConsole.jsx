import { useMemo, useState } from 'react'
import { CategoryIcon, Icon } from '../components/Icon'

const emptyProductForm = {
  name: '',
  category: '',
  price: '',
  stock: '',
  image: ''
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'new-product'
}

export function AdminConsole({ user, products, categories, onProductsChange, onCategoriesChange, onLogout }) {
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [categoryInput, setCategoryInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeView, setActiveView] = useState('overview')
  const [feedback, setFeedback] = useState(null)

  const categorySummary = useMemo(() => {
    const categoryMap = new Map()

    for (const category of categories) {
      categoryMap.set(category.name, { name: category.name, count: 0 })
    }

    for (const product of products) {
      const existing = categoryMap.get(product.category) || { name: product.category, count: 0 }
      existing.count += 1
      categoryMap.set(product.category, existing)
    }

    return Array.from(categoryMap.values())
  }, [categories, products])

  const visibleProducts = selectedCategory === 'All'
    ? products
    : products.filter((product) => product.category === selectedCategory)

  const totalInventory = products.reduce((sum, product) => sum + Number(product.stock ?? 0), 0)

  function handleProductFieldChange(event) {
    const { name, value } = event.target
    setProductForm((current) => ({ ...current, [name]: value }))
  }

  function addProduct(event) {
    event.preventDefault()

    const cleanName = productForm.name.trim()
    const cleanCategory = (productForm.category || categories[0]?.name || 'General').trim()
    const cleanPrice = Number(productForm.price)
    const cleanStock = Number(productForm.stock)

    if (!cleanName || !productForm.price || !productForm.stock || Number.isNaN(cleanPrice) || Number.isNaN(cleanStock)) {
      setFeedback({ type: 'error', message: 'Enter a product name, price, and stock quantity.' })
      return
    }

    const productId = slugify(cleanName)
    if (products.some((product) => product.id === productId)) {
      setFeedback({ type: 'error', message: 'A product with that name already exists.' })
      return
    }

    const nextProduct = {
      id: productId,
      name: cleanName,
      category: cleanCategory,
      price: Number(cleanPrice.toFixed(2)),
      stock: Math.max(0, Math.floor(cleanStock)),
      rating: 4.6,
      reviews: 0,
      badge: 'NEW',
      image: productForm.image.trim() || products[0]?.image || '',
      description: 'Freshly added by the admin team.'
    }

    const nextProducts = [nextProduct, ...products]
    onProductsChange(nextProducts)

    const categoryExists = categories.some((item) => item.name === cleanCategory)
    if (!categoryExists) {
      onCategoriesChange([
        ...categories,
        { name: cleanCategory, count: 1 }
      ])
    }

    setProductForm(emptyProductForm)
    setActiveView('products')
    setFeedback({ type: 'success', message: `${cleanName} was added to the catalog.` })
  }

  function adjustStock(productId, delta) {
    onProductsChange(products.map((product) => {
      if (product.id !== productId) {
        return product
      }

      const nextStock = Math.max(0, Number(product.stock ?? 0) + delta)
      return { ...product, stock: nextStock }
    }))
    setFeedback({ type: 'success', message: 'Product stock updated.' })
  }

  function removeProduct(productId) {
    const removedProduct = products.find((product) => product.id === productId)
    const remainingProducts = products.filter((product) => product.id !== productId)
    onProductsChange(remainingProducts)
    setFeedback({ type: 'success', message: `${removedProduct?.name || 'Product'} was removed from the catalog.` })
  }

  function addCategory(event) {
    event.preventDefault()

    const nextCategoryName = categoryInput.trim()
    if (!nextCategoryName) {
      setFeedback({ type: 'error', message: 'Enter a category name.' })
      return
    }

    const alreadyExists = categories.some((category) => category.name.toLowerCase() === nextCategoryName.toLowerCase())
    if (alreadyExists) {
      setFeedback({ type: 'error', message: 'That category already exists.' })
      return
    }

    onCategoriesChange([
      ...categories,
      { name: nextCategoryName, count: 0 }
    ])
    setCategoryInput('')
    setActiveView('categories')
    setFeedback({ type: 'success', message: `${nextCategoryName} was added.` })
  }

  function removeCategory(categoryName) {
    const remainingCategories = categories.filter((category) => category.name !== categoryName)
    const hasProductsToMove = products.some((product) => product.category === categoryName)
    let fallbackCategory = remainingCategories[0]?.name

    if (hasProductsToMove && !fallbackCategory) {
      fallbackCategory = 'General'
      remainingCategories.push({ name: fallbackCategory, count: 0 })
    }
    onCategoriesChange(remainingCategories)
    onProductsChange(products.map((product) => {
      if (product.category !== categoryName) {
        return product
      }

      return { ...product, category: fallbackCategory }
    }))
    setSelectedCategory('All')
    setFeedback({
      type: 'success',
      message: hasProductsToMove
        ? `${categoryName} was removed. Its products moved to ${fallbackCategory}.`
        : `${categoryName} was removed.`
    })
  }

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' }
  ]

  const sectionTitle = {
    overview: 'Inventory overview',
    products: 'Product management',
    categories: 'Category management'
  }[activeView]

  const renderOverview = () => (
    <>
      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <p>Products</p>
          <strong>{products.length}</strong>
          <span>Live listings</span>
        </article>
        <article className="admin-stat-card">
          <p>Inventory</p>
          <strong>{totalInventory}</strong>
          <span>Available units</span>
        </article>
        <article className="admin-stat-card">
          <p>Low stock</p>
          <strong>{products.filter((product) => Number(product.stock ?? 0) <= 5).length}</strong>
          <span>Products with 5 or fewer units</span>
        </article>
        <article className="admin-stat-card">
          <p>Categories</p>
          <strong>{categorySummary.length}</strong>
          <span>Curated groups</span>
        </article>
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel">
          <div className="panel-head">
            <h3>Category performance</h3>
            <button type="button" onClick={() => {
              setSelectedCategory('All')
              setActiveView('categories')
            }}>All</button>
          </div>

          <div className="category-list-wrap">
            {categorySummary.length ? categorySummary.map((category) => (
              <button
                key={category.name}
                type="button"
                className={`category-chip ${selectedCategory === category.name ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCategory(category.name)
                  setActiveView('categories')
                }}
              >
                <span className="category-summary-icon"><CategoryIcon name={category.name} /></span>
                <span>{category.name}</span>
                <strong>{category.count}</strong>
              </button>
            )) : <div className="admin-empty-state">No categories yet. Add one to organize products.</div>}
          </div>
        </article>

        <article className="admin-panel">
          <div className="panel-head">
            <h3>Add category</h3>
          </div>

          <form className="admin-inline-form" onSubmit={addCategory}>
            <input
              value={categoryInput}
              onChange={(event) => setCategoryInput(event.target.value)}
              placeholder="New category name"
            />
            <button type="submit" className="admin-secondary-button">Add</button>
          </form>
        </article>
      </section>
    </>
  )

  const renderProducts = () => (
    <section className="admin-panel product-panel">
      <div className="panel-head">
        <h3>Product management</h3>
      </div>

      <form className="admin-product-form" onSubmit={addProduct}>
        <div className="admin-form-grid">
          <label>
            <span>Product</span>
            <input name="name" value={productForm.name} onChange={handleProductFieldChange} placeholder="Product name" required />
          </label>
          <label>
            <span>Category</span>
            <select name="category" value={productForm.category} onChange={handleProductFieldChange}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Price</span>
            <input name="price" type="number" min="0" step="0.01" value={productForm.price} onChange={handleProductFieldChange} placeholder="0.00" required />
          </label>
          <label>
            <span>Stock</span>
            <input name="stock" type="number" min="0" step="1" value={productForm.stock} onChange={handleProductFieldChange} placeholder="0" required />
          </label>
          <label className="wide-field">
            <span>Image URL</span>
            <input name="image" value={productForm.image} onChange={handleProductFieldChange} placeholder="Optional image URL" />
          </label>
        </div>

        <button type="submit" className="admin-primary-button">Add product</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length ? visibleProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="product-cell">
                    {product.image
                      ? <img src={product.image} alt={product.name} />
                      : <span className="product-placeholder"><Icon name="box" aria-hidden="true" /></span>}
                    <div>
                      <strong>{product.name}</strong>
                      <small>{product.badge || 'Featured'}</small>
                    </div>
                  </div>
                </td>
                <td>{product.category}</td>
                <td>${Number(product.price).toFixed(2)}</td>
                <td>
                  <div className="stock-control">
                    <button type="button" aria-label={`Decrease ${product.name} stock`} onClick={() => adjustStock(product.id, -1)}><Icon name="minus" /></button>
                    <span>{product.stock ?? 0}</span>
                    <button type="button" aria-label={`Increase ${product.name} stock`} onClick={() => adjustStock(product.id, 1)}><Icon name="plus" /></button>
                  </div>
                </td>
                <td>
                  <button type="button" className="remove-button" onClick={() => removeProduct(product.id)}><Icon name="trash" aria-hidden="true" /> Remove</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5"><div className="admin-empty-state">No products match this view. Add a product or select another category.</div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderCategories = () => (
    <section className="admin-content-grid">
      <article className="admin-panel">
        <div className="panel-head">
          <h3>Category performance</h3>
          <button type="button" onClick={() => setSelectedCategory('All')}>All</button>
        </div>

        <div className="category-list-wrap">
          {categorySummary.length ? categorySummary.map((category) => (
            <button
              key={category.name}
              type="button"
              className={`category-chip ${selectedCategory === category.name ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(category.name)}
            >
              <span className="category-summary-icon"><CategoryIcon name={category.name} /></span>
              <span>{category.name}</span>
              <strong>{category.count}</strong>
            </button>
          )) : <div className="admin-empty-state">No categories yet. Add one above.</div>}
        </div>
      </article>

      <article className="admin-panel">
        <div className="panel-head">
          <h3>Category manager</h3>
        </div>

        <form className="admin-inline-form" onSubmit={addCategory}>
          <input
            value={categoryInput}
            onChange={(event) => setCategoryInput(event.target.value)}
            placeholder="New category name"
          />
          <button type="submit" className="admin-secondary-button">Add</button>
        </form>

        <ul className="category-manager-list">
          {categorySummary.length ? categorySummary.map((category) => (
            <li key={category.name}>
              <div>
                <span className="category-summary-icon"><CategoryIcon name={category.name} /></span>
                <strong>{category.name}</strong>
              </div>
              <small>{category.count} items</small>
              <button type="button" onClick={() => removeCategory(category.name)}>Remove</button>
            </li>
          )) : <li className="admin-empty-state">No categories yet. Add one above.</li>}
        </ul>
      </article>
    </section>
  )

  return (
    <div className="admin-app-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-row">
          <span className="admin-brand-mark">p</span>
          <span>piqnora</span>
        </div>

        <nav className="admin-nav" aria-label="Admin dashboard navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-mini-card">
          <p>Store health</p>
          <strong>Excellent</strong>
          <span>{totalInventory} items in stock</span>
        </div>
      </aside>

      <main className="admin-main-panel">
        <header className="admin-header">
          <div>
            <p className="admin-header-kicker">Dashboard</p>
            <h2>{sectionTitle}</h2>
          </div>

          <div className="admin-header-actions">
            <div className="admin-user-pill">
              <span className="admin-user-avatar">{(user?.name || 'A').slice(0, 1).toUpperCase()}</span>
              <span>{user?.name || 'Admin'}</span>
            </div>
            <button type="button" className="admin-action-button" onClick={onLogout}>Log out</button>
          </div>
        </header>

        {feedback && <p className={`admin-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}
        {activeView === 'overview' && renderOverview()}
        {activeView === 'products' && renderProducts()}
        {activeView === 'categories' && renderCategories()}
      </main>
    </div>
  )
}
