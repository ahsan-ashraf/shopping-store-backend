# 🧠 Shopping Store – Backend API
A scalable, production-ready backend API built with NestJS, TypeScript, and PostgreSQL, powering a modern e-commerce platform.
Designed using clean architecture principles, modular design, and real-world backend patterns.

This backend handles authentication, roles, stores, products, carts, orders, payments, and media storage.

## 🚀 Backend Highlights
- 🏗️ Modular NestJS architecture
- 🔐 JWT-based authentication & role-based authorization
- 🧩 Prisma ORM with PostgreSQL
- 💳 Stripe payment integration
- 🖼️ AWS S3 file storage
- 🗑️ Soft deletes & transactional operations
- 🛡️ DTO validation with class-validator
- ⚡ Optimized for scalability & maintainability

## 🧱 Tech Stack
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Stripe API
- AWS S3
- Docker-ready architecture

## 🧠 Architecture Overview
 - Feature-based modules
 - Controllers → Services → Repositories
 - DTOs for strict input validation
 - Guards & decorators for auth & roles
 - Centralized error handling
 - Transaction-safe business logic

Built to scale like a real production system, not a demo API.

## 🔐 Authentication & Authorization
- JWT access & refresh tokens
- Role system:</br>
  - ```SuperAdmin```</br>
  - ```Admin```</br>
  - ```Seller```</br>
  - ```Buyer```</br>
  - ```Rider```</br>
- Custom guards & decorators
- Secure logout & token rotation

## 🛍️ Core Business Modules
### 👤 Users
- Registration & login
- Role-based access
- Soft delete support
  
### 🏬 Stores
- Seller store registration
- Banner & icon upload (S3)
- Approval & operational states
- Product upload
- Manage products
  
### 📦 Products
- Product CRUD
- Multiple images
- Video support
- Category support
- Stock & quantity management
  
### 🛒 Cart & Wishlist
- Atomic quantity updates (+1 / -1)
- Transaction-safe operations
- User-specific isolation
  
### 📦 Orders & Payments
- Stripe checkout
- Order lifecycle management
- Payment & order statuses

## 🖼️ Media Handling
- AWS S3 integration
- Secure uploads
- Image preview & deletion
- Optimized for performance

## ⚙️ Project Setup
To start backend locally:
```
npm install
npm run start:dev
```

Swagger Api Docs can be found at:
```
http://localhost:5000/api
```

## 🌍 Environment Variables
```
DATABASE_URL=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
STRIPE_SECRET_KEY=...
AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## 👨‍💻 Author
Ahsan Ali</br>
Backend-focused Full Stack Developer</br>
Specializing in NestJS, PostgreSQL, Prisma & scalable APIs</br>


