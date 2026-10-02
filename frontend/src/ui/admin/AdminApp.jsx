import { useEffect, useState } from 'react'
import productsData, { categories as defaultCategories } from '../data/products'
import { readCatalog, writeCatalog } from '../data/catalogStorage'
import { AdminLogin } from './AdminLogin'
import { AdminConsole } from './AdminConsole'
import './admin.css'

export default function AdminApp() {
  const [adminUser, setAdminUser] = useState(null)
  const [products, setProducts] = useState(() => readCatalog(productsData, defaultCategories).products)
  const [categories, setCategories] = useState(() => readCatalog(productsData, defaultCategories).categories)

  useEffect(() => {
    writeCatalog(products, categories)
  }, [products, categories])

  if (!adminUser) {
    return <AdminLogin onLogin={setAdminUser} />
  }

  return (
    <AdminConsole
      user={adminUser}
      products={products}
      categories={categories}
      onProductsChange={setProducts}
      onCategoriesChange={setCategories}
      onLogout={() => setAdminUser(null)}
    />
  )
}
