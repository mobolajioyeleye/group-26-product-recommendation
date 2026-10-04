const storageKey = 'piqnora-catalog-v1'

function favoritesKey(user) {
  const accountId = String(user?.email || user?.phone || user?.name || 'member').trim().toLowerCase()
  return `piqnora-favorites-v1:${accountId}`
}

export function readFavorites(user) {
  try {
    const savedFavorites = JSON.parse(window.localStorage.getItem(favoritesKey(user)) || '[]')
    return Array.isArray(savedFavorites) ? savedFavorites : []
  } catch {
    return []
  }
}

export function writeFavorites(user, favorites) {
  try {
    window.localStorage.setItem(favoritesKey(user), JSON.stringify(favorites))
  } catch {
    return false
  }

  return true
}

export function readCatalog(defaultProducts, defaultCategories) {
  try {
    const savedCatalog = window.localStorage.getItem(storageKey)
    if (!savedCatalog) {
      return { products: defaultProducts, categories: defaultCategories }
    }

    const catalog = JSON.parse(savedCatalog)
    const savedProducts = Array.isArray(catalog.products) ? catalog.products : defaultProducts
    const productCategoryNames = new Set(savedProducts.map((product) => product.category).filter(Boolean))
    const savedCategories = Array.isArray(catalog.categories) ? catalog.categories : defaultCategories
    const normalizedCategories = savedCategories.reduce((normalized, category) => {
      if (!category?.name || category.name === 'More') {
        return normalized
      }

      const name = category.name === 'Sports' && productCategoryNames.has('Sports & Outdoor')
        ? 'Sports & Outdoor'
        : category.name
      if (!normalized.some((item) => item.name === name)) {
        normalized.push({ name, count: category.count || 0 })
      }
      return normalized
    }, [])

    for (const name of productCategoryNames) {
      if (!normalizedCategories.some((category) => category.name === name)) {
        normalizedCategories.push({ name, count: 0 })
      }
    }

    return {
      products: savedProducts,
      categories: normalizedCategories
    }
  } catch {
    return { products: defaultProducts, categories: defaultCategories }
  }
}

export function writeCatalog(products, categories) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ products, categories }))
  } catch {
    return false
  }

  return true
}