import { useMemo, useState } from 'react'
import { CategoryIcon, Icon } from '../components/Icon'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  deleteCategory
} from '../../services/adminApi'

const emptyProductForm = {
  name: '',
  category_id: '',
  price: '',
  stock: '',
  image_url: '',
  description: ''
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []

  const parseLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''))
    return result
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_]+/g, ''))
  const getIndex = (aliases) => headers.findIndex((h) => aliases.includes(h))
  const nameIdx = getIndex(['name', 'title', 'product', 'productname'])
  const catIdx = getIndex(['category', 'categoryname', 'categoryid', 'group'])
  const priceIdx = getIndex(['price', 'cost', 'amount'])
  const stockIdx = getIndex(['stock', 'quantity', 'qty', 'units'])
  const descIdx = getIndex(['description', 'desc', 'details', 'about'])
  const imgIdx = getIndex(['image', 'imageurl', 'img', 'photo', 'picture'])

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    if (cols.length === 0 || cols.every((c) => !c)) continue

    rows.push({
      rowNumber: i,
      name: (nameIdx !== -1 ? cols[nameIdx] : cols[0]) || '',
      category: (catIdx !== -1 ? cols[catIdx] : cols[1]) || '',
      price: (priceIdx !== -1 ? cols[priceIdx] : cols[2]) || '',
      stock: (stockIdx !== -1 ? cols[stockIdx] : cols[3]) || '',
      description: (descIdx !== -1 ? cols[descIdx] : cols[4]) || '',
      image_url: (imgIdx !== -1 ? cols[imgIdx] : cols[5]) || ''
    })
  }

  return rows
}

export function AdminConsole({
  user,
  products = [],
  categories = [],
  onProductsChange,
  onCategoriesChange,
  onReload,
  onLogout
}) {
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState(emptyProductForm)
  const [categoryInput, setCategoryInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [activeView, setActiveView] = useState('overview')
  const [feedback, setFeedback] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bulk Product Import state (Option A)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkRawText, setBulkRawText] = useState('')
  const [bulkFileName, setBulkFileName] = useState('')
  const [bulkParsedRows, setBulkParsedRows] = useState([])
  const [bulkFallbackCategoryId, setBulkFallbackCategoryId] = useState('')
  const [bulkImportProgress, setBulkImportProgress] = useState(null)
  const [isBulkImporting, setIsBulkImporting] = useState(false)
  const [bulkSkipDuplicates, setBulkSkipDuplicates] = useState(true)

  // Multi-select & Bulk Delete state
  const [selectedProductIds, setSelectedProductIds] = useState(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(null)

  const categorySummary = useMemo(() => {
    const categoryMap = new Map()

    for (const cat of categories) {
      categoryMap.set(cat.name, { id: cat.id, name: cat.name, count: 0 })
    }

    for (const product of products) {
      const existing = categoryMap.get(product.category) || {
        id: product.category_id,
        name: product.category || 'Uncategorized',
        count: 0
      }
      existing.count += 1
      categoryMap.set(existing.name, existing)
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

  function handleEditFieldChange(event) {
    const { name, value } = event.target
    setEditForm((current) => ({ ...current, [name]: value }))
  }

  async function handleAddProduct(event) {
    event.preventDefault()
    setFeedback(null)

    const cleanName = productForm.name.trim()
    const cleanCategoryId = productForm.category_id || categories[0]?.id
    const cleanPrice = Number(productForm.price)
    const cleanStock = Number(productForm.stock)

    if (!cleanName || productForm.price === '' || productForm.stock === '') {
      setFeedback({ type: 'error', message: 'Enter product name, price, and stock quantity.' })
      return
    }

    if (Number.isNaN(cleanPrice) || cleanPrice < 0) {
      setFeedback({ type: 'error', message: 'Price must be a valid positive number.' })
      return
    }

    if (Number.isNaN(cleanStock) || cleanStock < 0) {
      setFeedback({ type: 'error', message: 'Stock must be a valid non-negative number.' })
      return
    }

    if (!cleanCategoryId) {
      setFeedback({ type: 'error', message: 'Please select a valid category.' })
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createProduct({
        name: cleanName,
        category_id: cleanCategoryId,
        price: cleanPrice,
        stock: cleanStock,
        image_url: productForm.image_url?.trim() || null,
        description: productForm.description?.trim() || 'Added by admin'
      })

      const categoryName = categories.find((c) => c.id === cleanCategoryId)?.name || 'General'
      const newProductItem = {
        id: created.id,
        name: created.name,
        price: Number(created.price),
        stock: Number(created.stock),
        category_id: cleanCategoryId,
        category: categoryName,
        image: created.image_url || '',
        description: created.description || ''
      }

      onProductsChange([newProductItem, ...products])
      setProductForm(emptyProductForm)
      setActiveView('products')
      setFeedback({ type: 'success', message: `${cleanName} was successfully created.` })
    } catch (err) {
      setFeedback({ type: 'error', message: `Could not create product: ${err.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  function startEditProduct(product) {
    setEditingProduct(product)
    setEditForm({
      name: product.name,
      category_id: product.category_id || categories.find((c) => c.name === product.category)?.id || categories[0]?.id || '',
      price: product.price,
      stock: product.stock,
      image_url: product.image || '',
      description: product.description || ''
    })
  }

  async function handleSaveEdit(event) {
    event.preventDefault()
    if (!editingProduct) return
    setFeedback(null)

    const cleanName = editForm.name.trim()
    const cleanCategoryId = editForm.category_id
    const cleanPrice = Number(editForm.price)
    const cleanStock = Number(editForm.stock)

    if (!cleanName || Number.isNaN(cleanPrice) || Number.isNaN(cleanStock)) {
      setFeedback({ type: 'error', message: 'Please enter valid product details.' })
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await updateProduct(editingProduct.id, {
        name: cleanName,
        category_id: cleanCategoryId,
        price: cleanPrice,
        stock: cleanStock,
        image_url: editForm.image_url?.trim() || null,
        description: editForm.description?.trim() || ''
      })

      const categoryName = categories.find((c) => c.id === cleanCategoryId)?.name || editingProduct.category

      onProductsChange(
        products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: updated.name,
                price: Number(updated.price),
                stock: Number(updated.stock),
                category_id: cleanCategoryId,
                category: categoryName,
                image: updated.image_url || '',
                description: updated.description || ''
              }
            : p
        )
      )

      setEditingProduct(null)
      setFeedback({ type: 'success', message: `${cleanName} was updated successfully.` })
    } catch (err) {
      setFeedback({ type: 'error', message: `Could not update product: ${err.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAdjustStock(product, delta) {
    const nextStock = Math.max(0, Number(product.stock ?? 0) + delta)
    const categoryId = product.category_id || categories.find((c) => c.name === product.category)?.id

    if (!categoryId) {
      setFeedback({ type: 'error', message: 'Could not determine category ID for stock adjustment.' })
      return
    }

    try {
      await updateProduct(product.id, {
        name: product.name,
        price: product.price,
        category_id: categoryId,
        stock: nextStock,
        image_url: product.image || null,
        description: product.description || ''
      })

      onProductsChange(
        products.map((p) => (p.id === product.id ? { ...p, stock: nextStock } : p))
      )
      setFeedback({ type: 'success', message: `Stock for ${product.name} updated to ${nextStock}.` })
    } catch (err) {
      setFeedback({ type: 'error', message: `Could not adjust stock: ${err.message}` })
    }
  }

  async function handleRemoveProduct(product) {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteProduct(product.id)
      onProductsChange(products.filter((p) => p.id !== product.id))
      setSelectedProductIds((prev) => {
        if (!prev.has(product.id)) return prev
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
      setFeedback({ type: 'success', message: `${product.name} was removed from the catalog.` })
    } catch (err) {
      setFeedback({ type: 'error', message: `Could not delete product: ${err.message}` })
    }
  }

  function handleToggleSelectProduct(id) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleToggleSelectAll() {
    const allVisibleSelected =
      visibleProducts.length > 0 &&
      visibleProducts.every((p) => selectedProductIds.has(p.id))

    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleProducts.forEach((p) => next.delete(p.id))
      } else {
        visibleProducts.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  function handleClearSelectedProducts() {
    setSelectedProductIds(new Set())
  }

  async function handleExecuteBulkDelete() {
    const idsToDelete = Array.from(selectedProductIds)
    if (idsToDelete.length === 0) return

    setIsBulkDeleting(true)
    setBulkDeleteProgress({ current: 0, total: idsToDelete.length })

    const successfulIds = []
    const failedIds = []

    for (let i = 0; i < idsToDelete.length; i++) {
      const id = idsToDelete[i]
      try {
        await deleteProduct(id)
        successfulIds.push(id)
      } catch {
        failedIds.push(id)
      }
      setBulkDeleteProgress({ current: i + 1, total: idsToDelete.length })
    }

    if (successfulIds.length > 0) {
      const successfulSet = new Set(successfulIds)
      onProductsChange(products.filter((p) => !successfulSet.has(p.id)))
    }

    setSelectedProductIds(new Set())
    setIsBulkDeleting(false)
    setIsBulkDeleteModalOpen(false)

    if (failedIds.length === 0) {
      setFeedback({
        type: 'success',
        message: `Successfully deleted ${successfulIds.length} product${successfulIds.length === 1 ? '' : 's'}.`
      })
    } else {
      setFeedback({
        type: 'error',
        message: `Deleted ${successfulIds.length} products, but ${failedIds.length} failed to delete.`
      })
    }

    if (onReload) onReload()
  }

  async function handleAddCategory(event) {
    event.preventDefault()
    const nextCategoryName = categoryInput.trim()

    if (!nextCategoryName) {
      setFeedback({ type: 'error', message: 'Enter a category name.' })
      return
    }

    const alreadyExists = categories.some(
      (cat) => cat.name.toLowerCase() === nextCategoryName.toLowerCase()
    )
    if (alreadyExists) {
      setFeedback({ type: 'error', message: 'That category already exists.' })
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createCategory({ name: nextCategoryName })
      onCategoriesChange([...categories, { id: created.id, name: created.name, description: created.description || '' }])
      setCategoryInput('')
      setActiveView('categories')
      setFeedback({ type: 'success', message: `Category "${nextCategoryName}" was created.` })
    } catch (err) {
      setFeedback({ type: 'error', message: `Could not create category: ${err.message}` })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveCategory(category) {
    if (!window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      return
    }

    try {
      await deleteCategory(category.id)
      onCategoriesChange(categories.filter((c) => c.id !== category.id))
      setSelectedCategory('All')
      setFeedback({ type: 'success', message: `Category "${category.name}" was deleted.` })
      if (onReload) onReload()
    } catch (err) {
      setFeedback({ type: 'error', message: `Could not delete category: ${err.message}` })
    }
  }

  function handleDownloadTemplate() {
    const sampleCategory = categories[0]?.name || 'Lifestyle'
    const csvContent =
      'name,category,price,stock,description,image_url\n' +
      `"Nordic Stoneware Mug","${sampleCategory}",24.00,40,"Handcrafted stoneware ceramic mug with matte glaze","https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600"\n` +
      `"Studio Wireless Headphones","${categories[1]?.name || sampleCategory}",199.99,15,"Over-ear wireless headphones with active noise cancellation","https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"\n` +
      `"Canvas Weekend Bag","${categories[2]?.name || sampleCategory}",89.50,25,"Durable water-resistant cotton canvas duffel bag","https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600"\n`
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'piqnora_product_import_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function handleCsvFileSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBulkFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result || ''
      setBulkRawText(text)
      setBulkParsedRows(parseCSV(text))
    }
    reader.readAsText(file)
  }

  function handleRawTextChange(event) {
    const text = event.target.value
    setBulkRawText(text)
    setBulkParsedRows(parseCSV(text))
  }

  function resetBulkState() {
    setBulkRawText('')
    setBulkFileName('')
    setBulkParsedRows([])
    setBulkImportProgress(null)
    setIsBulkImporting(false)
  }

  const validatedBulkRows = useMemo(() => {
    const fallback = categories.find((c) => c.id === bulkFallbackCategoryId) || categories[0]
    const seenNamesInBatch = new Set()

    return bulkParsedRows.map((row) => {
      const cleanName = (row.name || '').trim()
      const cleanPrice = Number(row.price)
      const cleanStock = Number(row.stock)
      const catMatch = categories.find(
        (c) =>
          c.name.toLowerCase() === (row.category || '').trim().toLowerCase() ||
          c.id === (row.category || '').trim()
      )
      const resolvedCat = catMatch || fallback

      const errors = []
      if (!cleanName) errors.push('Name is required')
      if (Number.isNaN(cleanPrice) || cleanPrice <= 0) errors.push('Price must be > 0')
      if (Number.isNaN(cleanStock) || cleanStock < 0) errors.push('Stock must be >= 0')
      if (!resolvedCat) errors.push('No valid category')

      // Duplicate detection against current catalog and earlier rows in this batch
      const nameKey = cleanName.toLowerCase()
      const existsInCatalog = cleanName && products.some((p) => p.name.trim().toLowerCase() === nameKey)
      const isRepeatedInBatch = cleanName && seenNamesInBatch.has(nameKey)
      const isDuplicate = Boolean(existsInCatalog || isRepeatedInBatch)
      const duplicateReason = existsInCatalog
        ? 'Already exists in catalog'
        : isRepeatedInBatch
        ? 'Repeated in import batch'
        : null

      if (cleanName) {
        seenNamesInBatch.add(nameKey)
      }

      return {
        ...row,
        validation: {
          isValid: errors.length === 0,
          errors,
          cleanName,
          cleanPrice,
          cleanStock,
          category_id: resolvedCat?.id,
          category_name: resolvedCat?.name || 'Uncategorized',
          description: (row.description || '').trim() || 'Added via bulk import',
          image_url: (row.image_url || '').trim() || null,
          isDuplicate,
          duplicateReason
        }
      }
    })
  }, [bulkParsedRows, categories, bulkFallbackCategoryId, products])

  async function handleExecuteBulkImport() {
    const rowsToImport = validatedBulkRows.filter((r) => {
      if (!r.validation.isValid) return false
      if (bulkSkipDuplicates && r.validation.isDuplicate) return false
      return true
    })

    if (rowsToImport.length === 0) {
      setFeedback({
        type: 'error',
        message: 'No eligible products to import. Check row validation or uncheck "Skip duplicate products".'
      })
      return
    }

    setIsBulkImporting(true)
    setBulkImportProgress({
      total: rowsToImport.length,
      current: 0,
      errors: []
    })

    const createdProducts = []
    const failedRows = []

    for (let i = 0; i < rowsToImport.length; i++) {
      const row = rowsToImport[i]
      const { validation } = row

      try {
        const created = await createProduct({
          name: validation.cleanName,
          category_id: validation.category_id,
          price: validation.cleanPrice,
          stock: validation.cleanStock,
          description: validation.description,
          image_url: validation.image_url
        })

        createdProducts.push({
          id: created.id,
          name: created.name,
          price: Number(created.price),
          stock: Number(created.stock),
          category_id: validation.category_id,
          category: validation.category_name,
          description: created.description || '',
          image: created.image_url || ''
        })
      } catch (err) {
        failedRows.push({
          name: validation.cleanName,
          error: err.message || 'API error'
        })
      }

      setBulkImportProgress({
        total: rowsToImport.length,
        current: i + 1,
        errors: failedRows
      })
    }

    if (createdProducts.length > 0) {
      onProductsChange([...createdProducts, ...products])
      if (onReload) onReload()
    }

    setIsBulkImporting(false)
    const skippedCount = validatedBulkRows.filter((r) => r.validation.isValid && r.validation.isDuplicate).length

    if (failedRows.length === 0) {
      setFeedback({
        type: 'success',
        message: `Successfully imported ${createdProducts.length} products!${
          bulkSkipDuplicates && skippedCount > 0 ? ` (${skippedCount} duplicate items skipped)` : ''
        }`
      })
      setTimeout(() => {
        setIsBulkModalOpen(false)
        resetBulkState()
      }, 1500)
    } else {
      setFeedback({
        type: 'error',
        message: `Imported ${createdProducts.length} products with ${failedRows.length} errors.`
      })
    }
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
          <strong>{categories.length}</strong>
          <span>Curated groups</span>
        </article>
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel">
          <div className="panel-head">
            <h3>Category performance</h3>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All')
                setActiveView('products')
              }}
            >
              All products
            </button>
          </div>

          <div className="category-list-wrap">
            {categorySummary.length ? (
              categorySummary.map((category) => (
                <button
                  key={category.id || category.name}
                  type="button"
                  className={`category-chip ${selectedCategory === category.name ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category.name)
                    setActiveView('products')
                  }}
                  title={`View ${category.name} products`}
                >
                  <span className="category-summary-icon">
                    <CategoryIcon name={category.name} />
                  </span>
                  <span>{category.name}</span>
                  <strong>{category.count}</strong>
                </button>
              ))
            ) : (
              <div className="admin-empty-state">No categories yet. Add one to organize products.</div>
            )}
          </div>
        </article>

        <article className="admin-panel">
          <div className="panel-head">
            <h3>Add category</h3>
          </div>

          <form className="admin-inline-form" onSubmit={handleAddCategory}>
            <input
              value={categoryInput}
              onChange={(event) => setCategoryInput(event.target.value)}
              placeholder="New category name"
              disabled={isSubmitting}
            />
            <button type="submit" className="admin-secondary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
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

      <form className="admin-product-form" onSubmit={handleAddProduct}>
        <div className="admin-form-grid">
          <label>
            <span>Product name</span>
            <input
              name="name"
              value={productForm.name}
              onChange={handleProductFieldChange}
              placeholder="e.g. Wireless Headset"
              required
              disabled={isSubmitting}
            />
          </label>
          <label>
            <span>Category</span>
            <select
              name="category_id"
              value={productForm.category_id}
              onChange={handleProductFieldChange}
              disabled={isSubmitting}
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Price ($)</span>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={productForm.price}
              onChange={handleProductFieldChange}
              placeholder="0.00"
              required
              disabled={isSubmitting}
            />
          </label>
          <label>
            <span>Initial stock</span>
            <input
              name="stock"
              type="number"
              min="0"
              step="1"
              value={productForm.stock}
              onChange={handleProductFieldChange}
              placeholder="0"
              required
              disabled={isSubmitting}
            />
          </label>
          <label>
            <span>Image URL</span>
            <input
              name="image_url"
              value={productForm.image_url}
              onChange={handleProductFieldChange}
              placeholder="https://example.com/image.jpg"
              disabled={isSubmitting}
            />
          </label>
          <label>
            <span>Description</span>
            <input
              name="description"
              value={productForm.description}
              onChange={handleProductFieldChange}
              placeholder="Short product overview"
              disabled={isSubmitting}
            />
          </label>
        </div>

        <div className="admin-form-actions-row">
          <button type="submit" className="admin-primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating product...' : 'Add product'}
          </button>
          <button
            type="button"
            className="admin-bulk-trigger-button"
            onClick={() => setIsBulkModalOpen(true)}
            disabled={isSubmitting}
          >
            <Icon name="sparkle" /> Bulk Import Products (CSV)
          </button>
        </div>
      </form>

      <div className="panel-head admin-panel-head-split" style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h3>Product listings ({visibleProducts.length})</h3>
          {selectedCategory !== 'All' && (
            <span className="admin-filter-badge">
              Filtered: <strong>{selectedCategory}</strong>
              <button
                type="button"
                className="admin-clear-filter"
                onClick={() => setSelectedCategory('All')}
                title="Show all products"
              >
                ✕ Show all
              </button>
            </span>
          )}
        </div>
        <div className="admin-filter-control">
          <label htmlFor="admin-category-filter">Category:</label>
          <select
            id="admin-category-filter"
            className="admin-select-input"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="All">All Categories ({products.length})</option>
            {categorySummary.map((cat) => (
              <option key={cat.id || cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProductIds.size > 0 && (
        <div className="admin-bulk-action-bar">
          <div className="admin-bulk-action-info">
            <span>
              <strong>{selectedProductIds.size}</strong> product{selectedProductIds.size === 1 ? '' : 's'} selected
            </span>
          </div>
          <div className="admin-bulk-action-buttons">
            <button
              type="button"
              className="admin-clear-filter"
              onClick={handleClearSelectedProducts}
              disabled={isBulkDeleting}
            >
              Deselect all
            </button>
            <button
              type="button"
              className="remove-button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={isBulkDeleting}
            >
              <Icon name="trash" aria-hidden="true" /> Delete selected ({selectedProductIds.size})
            </button>
          </div>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  checked={
                    visibleProducts.length > 0 &&
                    visibleProducts.every((p) => selectedProductIds.has(p.id))
                  }
                  onChange={handleToggleSelectAll}
                  aria-label="Select all visible products"
                />
              </th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length ? (
              visibleProducts.map((product) => (
                <tr
                  key={product.id}
                  className={selectedProductIds.has(product.id) ? 'admin-row-selected' : ''}
                >
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={selectedProductIds.has(product.id)}
                      onChange={() => handleToggleSelectProduct(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </td>
                  <td>
                    <div className="product-cell">
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <span className="product-placeholder">
                          <Icon name="box" aria-hidden="true" />
                        </span>
                      )}
                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.description ? product.description.slice(0, 40) + '...' : 'In catalog'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>${Number(product.price).toFixed(2)}</td>
                  <td>
                    <div className="stock-control">
                      <button
                        type="button"
                        aria-label={`Decrease ${product.name} stock`}
                        onClick={() => handleAdjustStock(product, -1)}
                      >
                        <Icon name="minus" />
                      </button>
                      <span>{product.stock ?? 0}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${product.name} stock`}
                        onClick={() => handleAdjustStock(product, 1)}
                      >
                        <Icon name="plus" />
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="admin-action-group">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => startEditProduct(product)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => handleRemoveProduct(product)}
                      >
                        <Icon name="trash" aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  <div className="admin-empty-state">
                    No products match this view. Add a product or select another category.
                  </div>
                </td>
              </tr>
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
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All')
              setActiveView('products')
            }}
          >
            All products
          </button>
        </div>

        <div className="category-list-wrap">
          {categorySummary.length ? (
            categorySummary.map((category) => (
              <button
                key={category.id || category.name}
                type="button"
                className={`category-chip ${selectedCategory === category.name ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCategory(category.name)
                  setActiveView('products')
                }}
                title={`View ${category.name} products`}
              >
                <span className="category-summary-icon">
                  <CategoryIcon name={category.name} />
                </span>
                <span>{category.name}</span>
                <strong>{category.count}</strong>
              </button>
            ))
          ) : (
            <div className="admin-empty-state">No categories yet. Add one above.</div>
          )}
        </div>
      </article>

      <article className="admin-panel">
        <div className="panel-head">
          <h3>Category manager</h3>
        </div>

        <form className="admin-inline-form" onSubmit={handleAddCategory}>
          <input
            value={categoryInput}
            onChange={(event) => setCategoryInput(event.target.value)}
            placeholder="New category name"
            disabled={isSubmitting}
          />
          <button type="submit" className="admin-secondary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </form>

        <ul className="category-manager-list">
          {categories.length ? (
            categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id || p.category === cat.name).length
              return (
                <li key={cat.id}>
                  <div>
                    <span className="category-summary-icon">
                      <CategoryIcon name={cat.name} />
                    </span>
                    <strong>{cat.name}</strong>
                  </div>
                  <div className="category-manager-actions">
                    <button
                      type="button"
                      className="admin-view-products-button"
                      onClick={() => {
                        setSelectedCategory(cat.name)
                        setActiveView('products')
                      }}
                      title={`View all products in ${cat.name}`}
                    >
                      View {count} products →
                    </button>
                    <button
                      type="button"
                      className="category-delete-button"
                      onClick={() => handleRemoveCategory(cat)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })
          ) : (
            <li className="admin-empty-state">No categories yet. Add one above.</li>
          )}
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
            <button type="button" className="admin-action-button" onClick={onLogout}>
              Log out
            </button>
          </div>
        </header>

        {feedback && (
          <p
            className={`admin-feedback ${feedback.type}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            {feedback.message}
          </p>
        )}

        {activeView === 'overview' && renderOverview()}
        {activeView === 'products' && renderProducts()}
        {activeView === 'categories' && renderCategories()}

        {/* Full Product Edit Modal (PRD FR-08) */}
        {editingProduct && (
          <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title">
            <div className="admin-modal-card">
              <div className="admin-modal-head">
                <h3 id="edit-dialog-title">Edit product: {editingProduct.name}</h3>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setEditingProduct(null)}
                  aria-label="Close edit dialog"
                >
                  ✕
                </button>
              </div>

              <form className="admin-product-form" onSubmit={handleSaveEdit}>
                <div className="admin-form-grid">
                  <label className="wide-field">
                    <span>Product name</span>
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleEditFieldChange}
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                  <label>
                    <span>Category</span>
                    <select
                      name="category_id"
                      value={editForm.category_id}
                      onChange={handleEditFieldChange}
                      required
                      disabled={isSubmitting}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Price ($)</span>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={handleEditFieldChange}
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                  <label>
                    <span>Stock</span>
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      step="1"
                      value={editForm.stock}
                      onChange={handleEditFieldChange}
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                  <label className="wide-field">
                    <span>Image URL</span>
                    <input
                      name="image_url"
                      value={editForm.image_url}
                      onChange={handleEditFieldChange}
                      placeholder="https://example.com/image.jpg"
                      disabled={isSubmitting}
                    />
                  </label>
                  <label className="wide-field">
                    <span>Description</span>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditFieldChange}
                      rows="3"
                      className="admin-textarea"
                      placeholder="Product description"
                      disabled={isSubmitting}
                    />
                  </label>
                </div>

                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={() => setEditingProduct(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-primary-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving changes...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Product Import Modal (Option A) */}
        {isBulkModalOpen && (
          <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="bulk-dialog-title">
            <div className="admin-modal-card admin-modal-card-wide">
              <div className="admin-modal-head">
                <div>
                  <h3 id="bulk-dialog-title">Bulk Product Import</h3>
                  <p className="admin-modal-subtitle">Upload a CSV file or paste spreadsheet rows to batch import products.</p>
                </div>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => {
                    if (!isBulkImporting) {
                      setIsBulkModalOpen(false)
                    }
                  }}
                  disabled={isBulkImporting}
                  aria-label="Close bulk dialog"
                >
                  ✕
                </button>
              </div>

              <div className="admin-bulk-toolbar">
                <button
                  type="button"
                  className="admin-template-button"
                  onClick={handleDownloadTemplate}
                  title="Download a starter CSV file with sample products"
                >
                  📥 Download Sample CSV Template
                </button>
                <div className="admin-toolbar-options">
                  <label className="admin-checkbox-label" title="Automatically skip products that already exist in your catalog or appear multiple times in this batch">
                    <input
                      type="checkbox"
                      checked={bulkSkipDuplicates}
                      onChange={(e) => setBulkSkipDuplicates(e.target.checked)}
                      disabled={isBulkImporting}
                    />
                    <span>Skip duplicate products</span>
                  </label>
                  <div className="admin-fallback-cat-picker">
                    <label htmlFor="bulk-fallback-cat">Fallback Category:</label>
                    <select
                      id="bulk-fallback-cat"
                      className="admin-select-input"
                      value={bulkFallbackCategoryId}
                      onChange={(e) => setBulkFallbackCategoryId(e.target.value)}
                      disabled={isBulkImporting}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="admin-bulk-input-section">
                <div className="admin-file-dropzone">
                  <input
                    type="file"
                    id="csv-file-input"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleCsvFileSelect}
                    disabled={isBulkImporting}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="csv-file-input" className="admin-file-picker-label">
                    📁 {bulkFileName ? `File selected: ${bulkFileName}` : 'Choose CSV File to Upload'}
                  </label>
                  <span className="admin-dropzone-hint">or paste CSV rows directly below:</span>
                </div>

                <textarea
                  className="admin-textarea admin-bulk-textarea"
                  value={bulkRawText}
                  onChange={handleRawTextChange}
                  placeholder="name,category,price,stock,description,image_url&#10;Wireless Mouse,Electronics,39.99,50,Ergonomic mouse,https://...&#10;Ceramic Cup,Lifestyle,18.00,30,Handmade cup,https://..."
                  rows={4}
                  disabled={isBulkImporting}
                />
              </div>

              {bulkParsedRows.length > 0 && (
                <div className="admin-bulk-preview-section">
                  <div className="admin-preview-header">
                    <h4>
                      Preview ({bulkParsedRows.length} rows found —{' '}
                      <span className="text-valid">
                        {validatedBulkRows.filter((r) => r.validation.isValid && !r.validation.isDuplicate).length} ready
                      </span>
                      {validatedBulkRows.some((r) => r.validation.isValid && r.validation.isDuplicate) && (
                        <span className="text-warning">
                          , {validatedBulkRows.filter((r) => r.validation.isValid && r.validation.isDuplicate).length} duplicates ({bulkSkipDuplicates ? 'will skip' : 'will import'})
                        </span>
                      )}
                      {validatedBulkRows.some((r) => !r.validation.isValid) && (
                        <span className="text-invalid">
                          , {validatedBulkRows.filter((r) => !r.validation.isValid).length} invalid
                        </span>
                      )}
                      )
                    </h4>
                  </div>

                  <div className="admin-table-wrap admin-bulk-preview-wrap">
                    <table className="admin-table admin-preview-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Status</th>
                          <th>Product Name</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Details / Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validatedBulkRows.slice(0, 50).map((row) => (
                          <tr key={row.rowNumber} className={!row.validation.isValid ? 'row-has-error' : row.validation.isDuplicate ? 'row-has-warning' : ''}>
                            <td>{row.rowNumber}</td>
                            <td>
                              {!row.validation.isValid ? (
                                <span className="admin-badge admin-badge-invalid">✗ Error</span>
                              ) : row.validation.isDuplicate ? (
                                <span className={`admin-badge ${bulkSkipDuplicates ? 'admin-badge-warning' : 'admin-badge-notice'}`}>
                                  ⚠️ {bulkSkipDuplicates ? 'Duplicate (Skip)' : 'Duplicate'}
                                </span>
                              ) : (
                                <span className="admin-badge admin-badge-valid">✓ Ready</span>
                              )}
                            </td>
                            <td><strong>{row.name || <em>(empty)</em>}</strong></td>
                            <td>{row.validation.category_name}</td>
                            <td>${Number(row.price || 0).toFixed(2)}</td>
                            <td>{row.stock || 0}</td>
                            <td>
                              {!row.validation.isValid ? (
                                <span className="text-error-msg">{row.validation.errors.join(', ')}</span>
                              ) : row.validation.isDuplicate ? (
                                <span className="text-warning-msg">
                                  {row.validation.duplicateReason} ({bulkSkipDuplicates ? 'will be skipped' : 'will be created'})
                                </span>
                              ) : (
                                <small className="text-muted">{row.description || 'Valid row'}</small>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {validatedBulkRows.length > 50 && (
                    <p className="admin-preview-footer">Showing first 50 rows of {validatedBulkRows.length}.</p>
                  )}
                </div>
              )}

              {bulkImportProgress && (
                <div className="admin-bulk-progress-box">
                  <div className="admin-progress-header">
                    <span>
                      {isBulkImporting ? 'Importing products...' : 'Import finished!'}
                    </span>
                    <strong>
                      {bulkImportProgress.current} / {bulkImportProgress.total} (
                      {Math.round((bulkImportProgress.current / bulkImportProgress.total) * 100)}%)
                    </strong>
                  </div>
                  <div className="admin-progress-bar-bg">
                    <div
                      className="admin-progress-bar-fill"
                      style={{
                        width: `${Math.round((bulkImportProgress.current / bulkImportProgress.total) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setIsBulkModalOpen(false)}
                  disabled={isBulkImporting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={handleExecuteBulkImport}
                  disabled={
                    isBulkImporting ||
                    validatedBulkRows.filter((r) => {
                      if (!r.validation.isValid) return false
                      if (bulkSkipDuplicates && r.validation.isDuplicate) return false
                      return true
                    }).length === 0
                  }
                >
                  {isBulkImporting
                    ? `Importing (${bulkImportProgress?.current || 0}/${bulkImportProgress?.total || 0})...`
                    : `Import ${
                        validatedBulkRows.filter((r) => {
                          if (!r.validation.isValid) return false
                          if (bulkSkipDuplicates && r.validation.isDuplicate) return false
                          return true
                        }).length
                      } Products`}
                </button>
              </div>
            </div>
          </div>
        )}

        {isBulkDeleteModalOpen && (
          <div
            className="admin-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-delete-modal-title"
          >
            <div className="admin-modal-card">
              <div className="admin-modal-head">
                <h3 id="bulk-delete-modal-title">Delete {selectedProductIds.size} Products</h3>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => !isBulkDeleting && setIsBulkDeleteModalOpen(false)}
                  disabled={isBulkDeleting}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <p style={{ margin: '0 0 12px 0', color: '#444' }}>
                Are you sure you want to permanently delete these <strong>{selectedProductIds.size}</strong> selected products? This action cannot be undone.
              </p>

              <div className="admin-selected-products-preview">
                <ul className="admin-selected-products-list">
                  {products
                    .filter((p) => selectedProductIds.has(p.id))
                    .map((p) => (
                      <li key={p.id}>
                        <strong>{p.name}</strong> (${Number(p.price).toFixed(2)}) &bull; {p.category}
                      </li>
                    ))}
                </ul>
              </div>

              {isBulkDeleting && bulkDeleteProgress && (
                <div className="admin-progress-box" style={{ marginTop: '16px' }}>
                  <div className="admin-progress-bar-track">
                    <div
                      className="admin-progress-bar-fill"
                      style={{
                        width: `${Math.round((bulkDeleteProgress.current / bulkDeleteProgress.total) * 100)}%`,
                        background: '#dc2626'
                      }}
                    />
                  </div>
                  <p className="admin-progress-text">
                    Deleting {bulkDeleteProgress.current} of {bulkDeleteProgress.total} products...
                  </p>
                </div>
              )}

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  disabled={isBulkDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="remove-button"
                  style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer' }}
                  onClick={handleExecuteBulkDelete}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting
                    ? `Deleting (${bulkDeleteProgress?.current || 0}/${bulkDeleteProgress?.total || selectedProductIds.size})...`
                    : `Confirm Delete (${selectedProductIds.size})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
