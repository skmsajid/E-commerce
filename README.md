# 🛒 FriendsCart

**FriendsCart** is a full-stack e-commerce web application built with **Django** and **HTML/CSS/JavaScript**.

It provides a complete shopping experience where users can browse products, manage their cart, place orders, and manage their account from a single platform.

## ✨ What FriendsCart Means

FriendsCart is designed as an online shopping platform that connects **customers and products in one place**.

The main idea is simple:

> **Browse → Add to Cart → Checkout → Place Order**

The project focuses on implementing the core functionality of a real e-commerce application using simple and understandable Django concepts.

## 🚀 Features

### 👤 User Accounts

* User registration and login
* Secure password handling using Django authentication
* User profile management
* Update personal information

### 🛍️ Product Shopping

* Browse products
* View products by category
* View product details
* Add products to cart
* Manage cart items

### 🛒 Cart Management

* Add products to cart
* Increase or decrease quantity
* Remove products
* Calculate cart totals

### 📦 Orders

* Place orders from the cart
* Store customer and order information
* Track order details

### ⭐ Feedback

* Users can submit feedback
* Users can view and manage their feedback
* Feedback is associated with the logged-in user

### 🛠️ Django Admin

* Manage users
* Manage products and categories
* Manage orders
* Manage application data through Django Admin

## 🔄 Project Flow

```text
             FRIENDSCART
                  │
                  ▼
          👤 Register / Login
                  │
                  ▼
          🏠 Browse Products
                  │
                  ▼
          📂 Select Category
                  │
                  ▼
          🛍️ View Product
                  │
                  ▼
           🛒 Add to Cart
                  │
                  ▼
          💳 Checkout / Order
                  │
                  ▼
          📦 Order Completed
                  │
                  ▼
           ⭐ Give Feedback
```

## 🧩 Project Structure

```text
FriendsCart/
│
├── accounts/        # User registration, login and profile
├── dashboard/       # User dashboard and feedback
├── categories/      # Product categories
├── cart/            # Cart and shopping functionality
├── main_app/        # Project configuration and URLs
│
├── templates/       # HTML templates
├── manage.py
├── requirements.txt
├── .gitignore
└── .env             # Database/environment configuration
```

## 🛠️ Technologies Used

* **Python**
* **Django**
* **MySQL**
* **HTML**
* **CSS**
* **JavaScript**

## 🔐 Authentication

FriendsCart uses Django's built-in authentication system with a custom `User` model based on `AbstractUser`.

User information such as:

* Username
* Email
* Phone number
* Address

is managed directly through the custom User model.

## ⚙️ Setup

Clone the project and create a virtual environment:

```bash
python -m venv env
```

Activate it:

### Windows

```bash
env\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
DB_NAME=ecommerce_db
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
```

Run migrations:

```bash
python manage.py migrate
```

Create an admin account:

```bash
python manage.py createsuperuser
```

Start the server:

```bash
python manage.py runserver
```

Open:

```text
http://127.0.0.1:8000/
```

## 🎯 Project Goal

FriendsCart was built to understand and implement the **core concepts of a real-world e-commerce application** using Django.

The project demonstrates:

* Django models and relationships
* Forms and validation
* Authentication
* Sessions
* CRUD operations
* Database interaction
* Shopping cart logic
* Order processing
* Django Admin
* HTML templates
* Backend-to-frontend data flow

## 📌 Future Improvements

* Online payment integration
* Product search and filtering
* Order status tracking
* Product reviews and ratings
* Wishlist
* Email notifications
* Improved admin dashboard

---

### 👨‍💻 FriendsCart

**A simple Django-based e-commerce application built to demonstrate a complete online shopping workflow.**
