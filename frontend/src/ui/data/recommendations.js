export function recommendProducts(products, favorites, limit) {
  const favoriteIds = new Set(favorites)
  const categoryAffinity = new Map()

  for (const product of products) {
    if (!favoriteIds.has(product.id)) {
      continue
    }

    categoryAffinity.set(product.category, (categoryAffinity.get(product.category) || 0) + 1)
  }

  const rankedProducts = products
    .filter((product) => !favoriteIds.has(product.id))
    .map((product) => ({
      product,
      score: (categoryAffinity.get(product.category) || 0) * 5
        + Number(product.rating || 0)
        + Math.log1p(Number(product.reviews || 0)) / 10
    }))
    .sort((first, second) => second.score - first.score || first.product.name.localeCompare(second.product.name))
    .map(({ product }) => product)

  return limit === undefined ? rankedProducts : rankedProducts.slice(0, limit)
}