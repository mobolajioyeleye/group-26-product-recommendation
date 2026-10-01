import earbudsImage from '../../../img/products/earbuds.jpg'
import smartWatchImage from '../../../img/products/smart-watch.jpg'
import laptopSleeveImage from '../../../img/products/laptop-sleeve.jpg'
import backpackImage from '../../../img/products/backpack.jpg'
import headphonesImage from '../../../img/products/headphones.jpg'
import cameraImage from '../../../img/products/camera.jpg'
import sneakersImage from '../../../img/products/sneakers.jpg'
import speakerImage from '../../../img/products/speaker.jpg'
import ceramicVaseImage from '../../../img/products/ceramic-vase.jpg'
import skincareImage from '../../../img/products/skincare.jpg'
import yogaMatImage from '../../../img/products/yoga-mat.jpg'

const products = [
  {
    id: 'earbuds',
    name: 'Wireless Earbuds Pro',
    category: 'Electronics',
    price: 49.99,
    rating: 4.8,
    reviews: 124,
    badge: 'BEST SELLER',
    image: earbudsImage,
    color: 'lavender',
    description: 'Rich, balanced sound meets all-day comfort. Enjoy active noise cancellation, a pocket-sized charging case, and up to 30 hours of listening.'
  },
  {
    id: 'smart-watch',
    name: 'Smart Watch Series 8',
    category: 'Electronics',
    price: 79.99,
    rating: 4.7,
    reviews: 89,
    badge: 'NEW ARRIVAL',
    image: smartWatchImage,
    color: 'blue',
    description: 'Keep your day moving with activity insights, helpful notifications, and a bright always-on display in a lightweight, comfortable design.'
  },
  {
    id: 'laptop-sleeve',
    name: 'Everyday Laptop Sleeve',
    category: 'Accessories',
    price: 29.99,
    rating: 4.6,
    reviews: 56,
    badge: '',
    image: laptopSleeveImage,
    color: 'sand',
    description: 'A soft-lined, water-resistant sleeve that keeps your laptop protected on the commute and polished in the meeting room.'
  },
  {
    id: 'backpack',
    name: 'City Commuter Backpack',
    category: 'Fashion',
    price: 39.99,
    rating: 4.9,
    reviews: 203,
    badge: 'TOP RATED',
    image: backpackImage,
    color: 'mint',
    description: 'A thoughtfully organized everyday backpack with a padded laptop pocket, weather-ready finish, and room for everything you need.'
  },
  {
    id: 'headphones',
    name: 'Studio Wireless Headphones',
    category: 'Electronics',
    price: 119.99,
    rating: 4.8,
    reviews: 172,
    badge: '',
    image: headphonesImage,
    color: 'peach',
    description: 'Lose yourself in detailed sound with cushioned over-ear comfort, seamless Bluetooth pairing, and a battery made for long days.'
  },
  {
    id: 'camera',
    name: 'Pocket Digital Camera',
    category: 'Electronics',
    price: 249.99,
    rating: 4.5,
    reviews: 68,
    badge: 'EDITOR PICK',
    image: cameraImage,
    color: 'blue',
    description: 'Capture the small moments in crisp detail with a compact body, easy controls, and beautiful color straight out of camera.'
  },
  {
    id: 'sneakers',
    name: 'Cloud Walk Sneakers',
    category: 'Fashion',
    price: 64.99,
    rating: 4.7,
    reviews: 94,
    badge: '',
    image: sneakersImage,
    color: 'lavender',
    description: 'A featherlight sneaker with a responsive sole and breathable knit upper, designed for long walks and everyday adventures.'
  },
  {
    id: 'speaker',
    name: 'Mini Bluetooth Speaker',
    category: 'Electronics',
    price: 34.99,
    rating: 4.4,
    reviews: 47,
    badge: '',
    image: speakerImage,
    color: 'sand',
    description: 'Take your playlist anywhere with room-filling sound, simple pairing, and a durable splash-resistant finish.'
  },
  {
    id: 'ceramic-vase',
    name: 'Sculpted Ceramic Vase',
    category: 'Home & Living',
    price: 32.00,
    rating: 4.6,
    reviews: 73,
    badge: '',
    image: ceramicVaseImage,
    color: 'sand',
    description: 'A simple sculptural vase with a soft matte finish, made to bring a little warmth to your shelf, table, or favourite corner.'
  },
  {
    id: 'face-care',
    name: 'Daily Glow Skincare Set',
    category: 'Beauty',
    price: 42.00,
    rating: 4.7,
    reviews: 115,
    badge: 'COMMUNITY PICK',
    image: skincareImage,
    color: 'peach',
    description: 'A gentle daily routine with nourishing essentials for a fresh, hydrated feel from your first cleanse to your last step.'
  },
  {
    id: 'yoga-mat',
    name: 'Everyday Flow Yoga Mat',
    category: 'Sports & Outdoor',
    price: 38.00,
    rating: 4.8,
    reviews: 81,
    badge: '',
    image: yogaMatImage,
    color: 'mint',
    description: 'A supportive, grippy mat with a comfortable cushioned feel for stretching, slow mornings, and your everyday movement practice.'
  }
]

export const categories = Array.from(new Set(products.map((product) => product.category))).map((name) => ({
  name,
  count: products.filter((product) => product.category === name).length
}))

export default products
