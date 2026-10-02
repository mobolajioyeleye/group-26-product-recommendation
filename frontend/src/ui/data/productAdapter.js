export function normalizeProduct(product, categoryMap = {}) {
    return {
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: Number(product.price) || 0,
      category:
        categoryMap[product.category_id] ||
        "Uncategorized",
      image: product.image_url || "",
      stock: Number(product.stock) || 0,
  
      // These are UI-only fields.
      // The backend does not currently provide rating/reviews/badge.
      color: "",
      badge: "",
    };
  }
  
  export function normalizeProducts(products = [], categories = []) {
    const categoryMap = Object.fromEntries(
      categories.map((category) => [category.id, category.name])
    );
  
    return products.map((product) =>
      normalizeProduct(product, categoryMap)
    );
  }