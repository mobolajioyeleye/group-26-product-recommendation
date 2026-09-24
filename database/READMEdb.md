# Database

This directory contains the database structure, migrations, seed data, and database-related models for the Product Recommendation App.

## Database Stack

* PostgreSQL
* Supabase
* Node.js `pg` driver
* `node-pg-migrate` for migrations

## Database Structure

The database currently contains five main tables:

```text
users
categories
products
activities
favourites
```

### Relationships

```text
users ───────< activities >────── products
  │                                  │
  └────────< favourites >────────────┘

categories ───────< products
```

* A user can have multiple activities.
* A product can have multiple activities.
* A user can favourite multiple products.
* A product can be favourited by multiple users.
* Each product belongs to one category.

## Migrations

The initial database schema is managed through:

```text
database/migrations/001_initial_schema.sql
```

The migration creates:

* Tables
* Primary keys
* Foreign keys
* Unique constraints
* Check constraints
* Indexes
* UUID generation

Migrations are applied using the project's migration command.

## Seed Data

Initial test data is stored in:

```text
database/seeds/001_initial_data.sql
```

Current seed data:

```text
20 users
6 categories
30 products
100 activities
30 favourites
```

The seed data provides enough records for development and testing of the application's product, activity, and recommendation features.

## Database Models

Database operations are separated into model files:

```text
backend/src/models/
├── user.model.js
├── category.model.js
├── product.model.js
├── activity.model.js
└── favourite.model.js
```

Each model contains the database queries required to create, retrieve, update, or delete its corresponding records.

### User Model

Handles:

* Creating users
* Getting all users
* Finding users by ID
* Finding users by email
* Updating user details
* Updating passwords
* Deleting users

### Category Model

Handles:

* Creating categories
* Getting all categories
* Finding categories by ID
* Updating categories
* Deleting categories

### Product Model

Handles:

* Creating products
* Getting all products
* Finding products by ID
* Getting products by category
* Searching products
* Updating products
* Deleting products

### Activity Model

Handles:

* Creating activities
* Getting all activities
* Finding activities by ID
* Getting activities by user
* Getting activities by product
* Getting activities for a specific user/product combination
* Deleting activities

Supported activity types:

```text
VIEW
FAVOURITE
```

### Favourite Model

Handles:

* Creating favourites
* Getting all favourites
* Checking a user's favourite for a product
* Getting favourites by user
* Getting favourites by product
* Deleting favourites

The `favourites` table uses a composite primary key:

```text
(user_id, product_id)
```

This prevents the same user from favouriting the same product more than once.

## Testing

Each database model has a dedicated test script:

```text
backend/scripts/
├── test-user-model.js
├── test-category-model.js
├── test-product-model.js
├── test-activity-model.js
└── test-favourite-model.js
```

All five models have been tested successfully against the Supabase PostgreSQL database.

## Environment Configuration

Database credentials are stored locally in:

```text
backend/.env
```

The actual `.env` file is excluded from Git. A template is provided through:

```text
backend/.env.example
```

No database credentials should be committed to the repository.
