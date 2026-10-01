import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './user interface/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
