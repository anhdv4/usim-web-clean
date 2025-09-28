# USIM Web Application - Page Structure

## 📋 Overview
The application has been restructured with separate pages for better organization and easier navigation.

## 🗂️ Page Structure

### 1. **Home Page** (`/`)
- **Purpose**: Main entry point with authentication check
- **Function**: Checks login status, redirects to `/login` if not authenticated, or `/countries` if authenticated
- **Access**: Direct URL or app start

### 2. **Login Page** (`/login`)
- **Purpose**: User authentication
- **Features**:
  - Username/password login
  - Admin and regular user support
  - Session management
- **Access**: When not logged in

### 3. **Countries Page** (`/countries`)
- **Purpose**: Country selection
- **Features**:
  - Grid of country cards with flags
  - Cart button (with debug styling)
  - Click country to go to products
- **URL**: `/countries`
- **Navigation**: From home page or back from products

### 4. **Products Page** (`/products?country=COUNTRY_NAME`)
- **Purpose**: Product browsing and ordering
- **Features**:
  - Product table with filters
  - Add to cart functionality
  - Cart button (with debug styling)
  - Days filter dropdown
  - Quantity controls for each product
- **URL**: `/products?country=Australia` (example)
- **Navigation**: From countries page, back to countries

## 🔗 Navigation Flow

```
Home (/) → Login (/login) → Countries (/countries) → Products (/products?country=X)
    ↑              ↓                           ↓                           ↓
    └─────── Check Auth ─────────────── Back ────────────────────────┘
```

## 🎯 Key Features by Page

### Countries Page
- ✅ Country selection with flag images
- ✅ Cart button with item count
- ✅ Responsive grid layout
- ✅ Debug styling for cart button

### Products Page
- ✅ Product table with VND pricing
- ✅ Days filter dropdown
- ✅ Quantity controls (+/- buttons)
- ✅ Add to cart for eSIM and Physical SIM
- ✅ Cart button with item count
- ✅ Debug styling for cart button

## 🛠️ Technical Details

### Routing
- Uses Next.js App Router
- URL parameters for country selection
- Client-side navigation

### State Management
- Local component state for cart and UI
- URL parameters for country selection
- Local storage for user authentication and sessions
- Authentication state managed across pages

### Styling
- Tailwind CSS
- Responsive design
- Debug styling (red borders) for cart buttons

## 🚀 How to Use

1. **Start**: Go to `/` (checks authentication)
2. **Login**: If not logged in, redirected to `/login`
   - Enter username/password (default: admin/admin123 or user/user123)
3. **Select Country**: After login, redirected to `/countries`
   - Click on a country card to view products
4. **Browse Products**: View products for selected country in `/products?country=X`
   - Use days filter to narrow down results
5. **Add to Cart**: Use quantity controls (+/-) and "Thêm" buttons
6. **View Cart**: Click cart button to see current items

## 🔧 Debug Information

Both cart buttons have debug styling:
- Red border around button
- Yellow background
- Console logs on click
- Alert popup with cart count

This helps identify if buttons are clickable and functioning properly.

## 📝 Notes

- Cart functionality is implemented but uses alerts for feedback
- Payment system is stubbed with QR code generation
- User management is available for admin users
- All pages are responsive and mobile-friendly