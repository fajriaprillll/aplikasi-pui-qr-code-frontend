# QR Code Food Ordering System

A modern web application for QR code-based food ordering systems in restaurants.

## Features

### Customer Features
- Scan QR code at the table to access the menu
- Browse the restaurant's menu with categories
- Add items to cart with quantity selection
- Place orders directly from the web app

### Admin Features
- Menu management (CRUD operations)
- Order management with status updates
- Table management with QR code generation
- Simple authentication system

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **Forms**: React Hook Form
- **QR Code**: react-qr-code
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/qr-food-ordering.git
cd qr-food-ordering
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

### Usage

#### Customer View
- Visit `http://localhost:5173/order?table=1` to see the customer ordering page for table 1
- Browse menu items, add to cart, and place an order

#### Admin View
- Visit `http://localhost:5173/admin/login` to access the admin dashboard
- Use the following credentials:
  - Username: admin
  - Password: admin123
- Manage menus, orders, and tables from the dashboard

## API Endpoints

The application is designed to work with the following API endpoints:

### Menu API
- `GET /api/menu` - Get all menu items
- `POST /api/menu` - Create a new menu item
- `PUT /api/menu/:id` - Update a menu item
- `DELETE /api/menu/:id` - Delete a menu item

### Order API
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order

### Table API
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create a new table
- `PUT /api/tables/:id` - Update a table
- `DELETE /api/tables/:id` - Delete a table

## License

MIT

## Acknowledgments

- This project uses various open-source libraries
- Inspired by modern QR code ordering systems in restaurants
