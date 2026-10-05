# Group 26 Product Recommendation App

A full-stack product recommendation web application developed by Group 26.

The application helps users discover products through personalized and general product recommendations. Users can browse products, search and filter products, view product details, favourite products, and receive recommendations based on their interactions.

## Live Application

**Frontend:**  
https://group-26-product-recommendation.vercel.app/

**Backend API:**  
https://group-26-product-recommendation.onrender.com/

## Project Overview

The Group 26 Product Recommendation App is designed to improve product discovery by presenting users with relevant products based on their interests and interactions.

The system supports both authenticated and unauthenticated users. New or unauthenticated users can receive general discovery recommendations, while authenticated users can receive recommendations based on recorded activities such as product views and favourites.

## Main Features

### User Features

- User registration and login
- User authentication and authorization
- Browse products
- View product details
- Search for products
- Browse products by category
- Favourite products
- Record user activities
- Receive product recommendations
- Responsive user interface
- Loading and error states
- Frontend form validation

### Recommendation System

The recommendation system supports:

- General/cold-start recommendations for users without activity
- Personalized recommendations for users with recorded activity
- Favourite-based recommendation signals
- Product-view activity signals
- Category-based recommendations
- Recommendation scoring
- Exclusion of products the user has already interacted with
- Recommendation limits and configuration

### Admin Features

- Admin dashboard
- Product management
- Category management
- Administrative controls

## Security and Reliability

- Authentication using JWT
- Protected routes
- Request validation
- Rate limiting
- CORS configuration
- Environment-based configuration
- Error handling
- Secure handling of environment variables

## Technology Stack

### Frontend

- React
- Vite
- React Router
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- REST API
- JWT authentication

### Database

- PostgreSQL

### Deployment

- Vercel - Frontend
- Render - Backend
- PostgreSQL - Database

## Project Structure

```text
group-26-product-recommendation/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
│   ├── package.json
│   └── ...
│
├── README.md
└── .gitignore