# SmartIMS — System Documentation

**Smart Import & Sales Management System**
*Multi-Tenant SaaS Inventory & Sales Platform*

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Backend (Django API)](#5-backend-django-api)
6. [Frontend (JavaScript SPA)](#6-frontend-javascript-spa)
7. [Authentication & Security](#7-authentication--security)
8. [Multi-Tenancy (Company Isolation)](#8-multi-tenancy-company-isolation)
9. [Data Flow: Login → Dashboard](#9-data-flow-login--dashboard)
10. [User Roles & Permissions](#10-user-roles--permissions)
11. [Database Models](#11-database-models)
12. [API Endpoints](#12-api-endpoints)
13. [Offline Support & Sync](#13-offline-support--sync)
14. [Internationalization (i18n)](#14-internationalization-i18n)
15. [Infrastructure & Hosting](#15-infrastructure--hosting)
16. [Known Issues & Solutions](#16-known-issues--solutions)
17. [For Developers: How to Add a New Feature](#17-for-developers-how-to-add-a-new-feature)

---

## 1. System Overview

SmartIMS is a **multi-tenant SaaS** (Software as a Service) application for managing:

- **Products & Inventory** — Track products, stock levels, purchase prices, import costs
- **Sales & Invoices** — Record sales, generate invoices, track credit/payment status
- **Expenses** — Both product-related import expenses and general business expenses
- **Categories & Suppliers** — Organize products and manage supplier relationships
- **Users & Roles** — Admin, Manager, Cashier, Staff with different access levels
- **Dashboard & Reports** — Real-time analytics, profit/loss reports, monthly trends

Each **company** (tenant) has completely isolated data — Company A can never see Company B's data.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│                    USER'S BROWSER                │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ index.html │  │ app.html │  │  Other HTML  │ │
│  │  (Login)   │  │ (Main)   │  │   pages      │ │
│  └──────┬─────┘  └─────┬────┘  └──────────────┘ │
│         │              │                         │
│  ┌──────┴──────────────┴────────────────────┐   │
│  │           JavaScript Layer               │   │
│  │  auth.js → api_client.js → db.js        │   │
│  │  app.js, dashboard.js, products.js, etc  │   │
│  └──────────────────┬───────────────────────┘   │
│                     │                            │
│              localStorage                        │
│         (offline cache per company)              │
└─────────────────────┬───────────────────────────┘
                      │ HTTPS (JWT Bearer Token)
                      ▼
┌─────────────────────────────────────────────────┐
│              RENDER.COM (Cloud)                  │
│  ┌──────────────────────────────────────────┐   │
│  │         Django REST API (Gunicorn)       │   │
│  │  ┌────────────┐  ┌───────────────────┐   │   │
│  │  │ JWT Auth   │  │ TenantMiddleware  │   │   │
│  │  │ (SimpleJWT)│  │ (company filter)  │   │   │
│  │  └────────────┘  └───────────────────┘   │   │
│  │  ┌──────────────────────────────────┐    │   │
│  │  │  ViewSets (Products, Sales, etc) │    │   │
│  │  │  → CompanyScopedModelViewSet     │    │   │
│  │  └──────────────────────────────────┘    │   │
│  └──────────────────┬───────────────────────┘   │
│                     │                            │
│  ┌──────────────────┴───────────────────────┐   │
│  │         Neon PostgreSQL Database          │   │
│  │  (All company data, isolated by FK)       │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Key principle:** The frontend is a **static HTML/JS/CSS app** served by Django. All data lives in the **PostgreSQL database**. The frontend syncs data from the backend API on every login and caches it in `localStorage` for fast rendering.

---

## 3. Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | Django 5.x + Django REST Framework |
| Authentication | JWT (SimpleJWT) with custom claims |
| Database | PostgreSQL (Neon.tech cloud) |
| Web Server | Gunicorn |
| Static Files | WhiteNoise |
| Hosting | Render.com (Free Tier) |
| Keep-Alive | UptimeRobot (pings every 5 min) |

### Frontend
| Component | Technology |
|-----------|-----------|
| Structure | Plain HTML5 (index.html, app.html) |
| Logic | Vanilla JavaScript (no React/Vue) |
| Styling | Vanilla CSS with CSS Variables (dark mode) |
| Charts | Chart.js |
| Icons | Custom SVG icon system (icons.js) |
| Translations | Custom i18n (English, Arabic, French) |
| Data Cache | Browser localStorage |

---

## 4. Project Structure

```
inventory system/
│
├── index.html              # Login page
├── app.html                # Main application (SPA shell)
├── reset-password.html     # Password reset page
├── verify-email.html       # Email verification / forced password change
├── render.yaml             # Render.com deployment config
│
├── css/
│   └── style.css           # All styles (themes, components, responsive)
│
├── js/
│   ├── api_client.js       # HTTP client for Django REST API
│   ├── auth.js             # Login, logout, session management
│   ├── db.js               # Local data layer (localStorage CRUD, sync, offline queue)
│   ├── app.js              # Main UI controller (navigation, modals, formatting)
│   ├── dashboard.js        # Dashboard page (KPIs, charts, alerts)
│   ├── products.js         # Products page (CRUD, import costs)
│   ├── categories.js       # Categories page
│   ├── suppliers.js        # Suppliers page
│   ├── sales.js            # Sales/Invoices page (cart, credit tracking)
│   ├── expenses.js         # Expenses page (product + business expenses)
│   ├── inventory.js        # Inventory management page (stock in/out)
│   ├── reports.js          # Profit & Loss reports
│   ├── users.js            # User management (admin panel)
│   ├── i18n.js             # Translations (EN, AR, FR)
│   ├── icons.js            # SVG icon definitions
│   └── chart.min.js        # Chart.js library
│
└── backend/
    ├── manage.py
    ├── requirements.txt
    │
    ├── sims_backend/       # Django project config
    │   ├── settings.py     # All Django settings
    │   ├── urls.py         # Root URL routing
    │   └── wsgi.py         # WSGI entry point
    │
    └── api/                # Main Django app
        ├── models.py       # Database models
        ├── serializers.py  # DRF serializers
        ├── views.py        # API ViewSets + Dashboard stats
        ├── urls.py         # API URL routing
        ├── permissions.py  # Role-based access control
        ├── authentication.py  # Custom JWT authentication
        ├── middleware.py   # Tenant middleware
        ├── jwt_views.py    # Login, password reset views
        ├── platform_views.py  # Platform Owner endpoints
        ├── platform_urls.py   # Platform Owner URL routing
        ├── signals.py      # Django signals
        ├── utils.py        # Helper functions
        └── mail_backend.py # Custom email backend
```

---

## 5. Backend (Django API)

### How Requests Are Processed

```
HTTP Request
    │
    ▼
SecurityMiddleware (HTTPS, headers)
    │
    ▼
WhiteNoise (serves static files: HTML, JS, CSS)
    │
    ▼
CorsMiddleware (validates origin)
    │
    ▼
AuthenticationMiddleware (Django sessions)
    │
    ▼
CustomJWTAuthentication (validates JWT token, loads user + company)
    │
    ▼
TenantMiddleware (attaches company_id and role from JWT to request)
    │
    ▼
Permission Classes (checks role: admin? manager? cashier?)
    │
    ▼
CompanyScopedModelViewSet (filters queryset by user.company)
    │
    ▼
Serializer (validates data, computes fields like profit, stock)
    │
    ▼
Database Query (PostgreSQL on Neon)
    │
    ▼
JSON Response
```

### The Base ViewSet: CompanyScopedModelViewSet

This is the **most important class** in the backend. Every data endpoint inherits from it:

```python
class CompanyScopedModelViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # Only return data belonging to the logged-in user's company
        return self.queryset.filter(company=self.request.user.company)

    def perform_create(self, serializer):
        # Auto-assign company and user when creating new records
        serializer.save(
            company=self.request.user.company,
            user_id=self.request.user.id
        )
```

This ensures **Company A can never see Company B's data** — the filter is enforced at the database query level.

---

## 6. Frontend (JavaScript SPA)

### The 3 Core JavaScript Files

#### 1. auth.js — Session Management
- Handles login (sends credentials to `/api/auth/login/`)
- Stores JWT tokens in `sessionStorage` and `localStorage`
- Decodes the JWT payload to extract user info (id, email, role, company_id)
- Manages session expiry and logout
- Handles forced password change flow

#### 2. api_client.js — API Communication
- Wraps all HTTP calls to the Django backend
- Automatically attaches `Authorization: Bearer <token>` header
- Handles token refresh when access token expires (401 → refresh → retry)
- Health check uses `/api/health/` with 15-second timeout
- All API requests have 20-second timeout
- Handles session expiry (redirects to login if refresh also fails)

#### 3. db.js — Local Data Layer
- Reads/writes to `localStorage` (the "offline cache")
- **syncFromBackend()** — Downloads all data from Django API into localStorage
  - Retries 3 times with 2-second delays on failure
  - Normalizes field names (snake_case ↔ camelCase)
- **getAll(table)** — Reads data from localStorage, filtered by tenant
- **insert/update/remove** — Writes locally AND queues changes for the API
- **Offline Queue** — If API is unreachable, changes are queued and flushed later
- Provides computed data: enriched products (with stock, expenses), dashboard stats

### How a Page Renders

```
User clicks "Products" in navigation
    │
    ▼
app.js → navigate('products')
    │
    ▼
Products.render(container)
    │
    ▼
DB.getAll('products')  ←── reads from localStorage
    │
    ▼
DB.getAllEnrichedProducts()  ←── joins with categories, suppliers, expenses
    │
    ▼
Generates HTML table with product data
    │
    ▼
Inserts into DOM → User sees the products table
```

---

## 7. Authentication & Security

### Login Flow

```
1. User enters email + password on index.html
2. auth.js sends POST to /api/auth/login/
3. Backend validates credentials
4. Backend generates JWT with custom claims:
   {
     "user_id": 27,
     "role": "admin",
     "company_id": 25,
     "email": "user@example.com",
     "name": "Amine",
     "currency": "FCFA"
   }
5. Frontend stores access token + refresh token
6. Redirects to app.html
7. app.js calls DB.syncFromBackend()
8. syncFromBackend downloads all company data from API
9. Dashboard renders with real data
```

### Token Lifecycle

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 1 hour | Sent with every API request |
| Refresh Token | 7 days | Used to get a new access token when it expires |

When the access token expires:
1. API returns 401 Unauthorized
2. api_client.js automatically calls `/api/auth/refresh/`
3. Gets a new access token
4. Retries the original request
5. If refresh also fails → user is logged out

### Security Features

- **HTTPS enforced** (HSTS headers, 1-year preload)
- **CORS restricted** to specific domains
- **Rate limiting**: 15 login attempts/minute, 300 API calls/minute per user
- **Token blacklisting** on logout (prevents reuse of old tokens)
- **Role-based access** enforced on every endpoint
- **Company isolation** enforced at the database query level
- **Forced password change** for new users created by admin
- **XSS protection**, Content-Type nosniff, X-Frame-Options DENY
- **Password policy**: Django validators (min 8 chars, not common, not all numeric, not similar to the username) on every path that sets a password
- **Suspended/deleted companies** are rejected on every request, not only at login
- **Cross-tenant references are rejected**: product/category/supplier/invoice IDs must belong to the caller's company
- **Roles**: `platform_owner` can never be assigned through the API; users cannot change their own role or company
- **Emailed links** (reset/verification) only use `FRONTEND_URL` or an origin in `CORS_ALLOWED_ORIGINS`
- **Stock and totals are enforced by the server**: overselling is rejected and invoice totals are computed from the line items
- Only the frontend files (`*.html`, `css/`, `js/`, favicons) are served as static files; backend source is never served

### Required Environment Variables (production)

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Django secret key (required when `DEBUG` is not `true`) |
| `DATABASE_URL` | PostgreSQL/CockroachDB connection string. Never commit it. |
| `FRONTEND_URL` | Base URL used in emailed links, e.g. `https://abdelsamadamineoumar.github.io/inventory` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |
| `EMAIL_BACKEND` / `BREVO_API_KEY` / `EMAIL_HOST…` | Email delivery |

### Running the Tests

```bash
cd backend
pip install -r requirements.txt
SECRET_KEY=test python manage.py test api
```

---

## 8. Multi-Tenancy (Company Isolation)

### How Data is Isolated

Every data model has a `company` foreign key:

```python
class Product(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    # ... other fields
```

Every API request is filtered by the logged-in user's company:

```python
def get_queryset(self):
    return self.queryset.filter(company=self.request.user.company)
```

### Example

If Company A (id=25) and Company B (id=26) both have products:
- User from Company A requests `/api/products/` → gets only Company A's products
- User from Company B requests `/api/products/` → gets only Company B's products
- There is **no way** to access another company's data

### Frontend Tenant Filtering

The frontend also filters data by company in db.js:

```javascript
function _tenantRows(table) {
    const all = _readTable(table);
    const tenantId = getTenantId(); // company_id from session
    return all.filter(r => {
        const rComp = Number(r.company_id || r.company || 0);
        return rComp === tenantId;
    });
}
```

---

## 9. Data Flow: Login to Dashboard

Complete flow from opening the browser to seeing your dashboard:

```
Step 1: User opens https://inventory-ts07.onrender.com
        → Django serves index.html

Step 2: User enters email & password, clicks "Sign In"
        → auth.js sends POST /api/auth/login/
        → Backend validates → returns JWT tokens
        → Tokens stored in sessionStorage + localStorage

Step 3: Redirect to app.html
        → app.js loads → reads session → shows "Syncing data..." spinner

Step 4: DB.syncFromBackend() runs
        → Calls ApiClient.checkHealth() → hits /api/health/
        → If server responds: proceed
        → If timeout: retry up to 3 times

Step 5: For each data table (categories, products, suppliers, etc.):
        → ApiClient.getAll('products') → GET /api/products/
        → Backend filters by company → returns JSON array
        → Frontend normalizes field names
        → Saves to localStorage as sims_products

Step 6: Sync complete → navigate('dashboard')
        → Dashboard.render() → DB.getDashboardStats()
        → Reads from localStorage → calculates totals
        → Renders KPIs, charts, alerts
```

---

## 10. User Roles & Permissions

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| platform_owner | Super Admin | Manages all companies. Cannot see company data. |
| admin | Company Owner | Full access to all company features |
| manager | Supervisor | Most features except user management and settings |
| cashier | Sales Rep | Can view products and create sales only |
| staff | Warehouse | Can view products, categories, suppliers (read-only) |

### Permission Matrix

| Feature | Admin | Manager | Cashier | Staff |
|---------|-------|---------|---------|-------|
| Dashboard | ✅ | ✅ | ❌ | ❌ |
| Products | ✅ Read/Write | ✅ Read/Write | Read-only | Read-only |
| Categories | ✅ Read/Write | ✅ Read/Write | ❌ | Read-only |
| Suppliers | ✅ Read/Write | ✅ Read/Write | ❌ | Read-only |
| Sales | ✅ All | ✅ All | ✅ View + Create | ❌ |
| Expenses | ✅ | ✅ | ❌ | ❌ |
| Inventory | ✅ Read/Write | ✅ Read/Write | ❌ | Read-only |
| Reports | ✅ | ❌ | ❌ | ❌ |
| Users | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |

---

## 11. Database Models

### Entity Relationship

```
Company (1) ──── (N) User
    │
    ├──── (N) Category
    ├──── (N) Supplier
    ├──── (N) Product ──── (N) ProductExpense
    │         │
    │         └──── (N) Sale ──┐
    │                          │
    ├──── (N) Invoice ─────────┘  (Invoice has many Sale items)
    ├──── (N) BusinessExpense
    ├──── (N) InventoryEntry
    └──── (N) AuditLog
```

### Key Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Company** | Tenant/Organization | name, subscription_plan, status, currency |
| **User** | System user | email, role, company (FK), must_change_password |
| **Category** | Product grouping | name, description |
| **Supplier** | Vendor/source | name, phone, email, country |
| **Product** | Item in inventory | code, name, purchase_price, selling_price, quantity |
| **ProductExpense** | Import cost for a product | expense_type, amount |
| **Invoice** | Sales transaction header | invoice_number, customer, total_revenue, payment_status |
| **Sale** | Line item within an invoice | product, quantity, selling_price, revenue, profit |
| **BusinessExpense** | General company expense | title, amount, category, expense_date |
| **InventoryEntry** | Stock movement record | product, entry_type (in/out/adjustment), quantity |

### Profit Calculation

```
Product Total Cost = purchase_price + sum(all ProductExpenses)
Cost Per Unit      = Total Cost / quantity
Sale Cost          = Cost Per Unit × quantity sold
Sale Revenue       = selling_price × quantity sold
Sale Profit        = Revenue - Cost
Profit Margin      = (Profit / Revenue) × 100
```

---

## 12. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login/ | Login → returns JWT tokens |
| POST | /api/auth/refresh/ | Refresh access token |
| POST | /api/auth/change-password/ | Change password |
| POST | /api/auth/password-reset/ | Request password reset |
| POST | /api/auth/password-reset/confirm/ | Confirm password reset |
| GET | /api/health/ | Health check (no auth required) |

### Company Data (requires JWT + company membership)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/products/ | List/Create products |
| GET/PATCH/DELETE | /api/products/{id}/ | Read/Update/Delete product |
| GET/POST | /api/categories/ | List/Create categories |
| GET/POST | /api/suppliers/ | List/Create suppliers |
| GET/POST | /api/invoices/ | List/Create invoices |
| GET/POST | /api/sales/ | List/Create sale line items |
| GET/POST | /api/product-expenses/ | List/Create product expenses |
| GET/POST | /api/business-expenses/ | List/Create business expenses |
| GET/POST | /api/inventory/ | List/Create inventory entries |
| GET/POST | /api/users/ | List/Create users (admin only) |
| GET | /api/dashboard/ | Aggregated dashboard statistics |
| GET | /api/reports/ | Profit & Loss report |
| GET/PATCH | /api/settings/ | Company settings |

### Platform Owner (requires platform_owner role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/platform/stats/ | Platform-wide statistics |
| GET/POST | /api/platform/companies/ | List/Create companies |
| DELETE | /api/platform/companies/{id}/ | Soft-delete company |
| POST | /api/platform/companies/{id}/suspend/ | Suspend company |
| POST | /api/platform/companies/{id}/activate/ | Activate company |

---

## 13. Offline Support & Sync

### How Offline Mode Works

```
User performs action (e.g., adds a product)
    │
    ├─── API is reachable?
    │    ├── YES → Send to API immediately + save to localStorage
    │    └── NO  → Save to localStorage + add to Offline Queue
    │
    ▼
Next time syncFromBackend() runs (on login or page load):
    │
    ├── flushOfflineQueue() → Sends all queued changes to API
    └── Download fresh data from API → Replace localStorage
```

### Offline Queue

Queued operations are stored in localStorage under the key `sims_offline_queue_{company_id}`. Each entry records the table, action (insert/update/remove), and the data. When connectivity returns, the queue is flushed to the backend API.

---

## 14. Internationalization (i18n)

The system supports 3 languages:
- **English** (default)
- **Arabic** (with RTL support)
- **French**

Language is selected from the login page or settings. Translations are in js/i18n.js.

To translate text in code:
```javascript
${t('page_dashboard')}        // Uses translation key
${I18n.choose('English', 'عربي', 'Français')}  // Inline choice
```

---

## 15. Infrastructure & Hosting

### Production Architecture

```
UptimeRobot ──ping every 5min──→ Render.com (Django + Gunicorn)
                                     │
                                     ├── Serves frontend (HTML/JS/CSS)
                                     ├── REST API (Django REST Framework)
                                     └── Connects to Neon PostgreSQL
```

### Render.com Configuration

- **Build:** `pip install -r requirements.txt && python manage.py migrate`
- **Start:** `gunicorn sims_backend.wsgi:application --bind 0.0.0.0:$PORT`
- **Plan:** Free tier (auto-sleeps after 15 min inactivity without UptimeRobot)

### UptimeRobot Keep-Alive

- **Service:** UptimeRobot (uptimerobot.com)
- **URL to ping:** `https://inventory-ts07.onrender.com/api/health/`
- **Interval:** Every 5 minutes
- **Purpose:** Prevents Render free-tier server from sleeping

### Key Environment Variables

| Variable | Purpose |
|----------|---------|
| SECRET_KEY | Django cryptographic signing key |
| DATABASE_URL | PostgreSQL connection string (Neon) |
| DEBUG | Set to False in production |
| ALLOWED_HOSTS | Allowed domains |
| CORS_ALLOWED_ORIGINS | Allowed frontend origins |
| EMAIL_HOST | SMTP server for emails |

---

## 16. Known Issues & Solutions

### Issue: Data Shows 0 on New Device/Browser (SOLVED)

**Symptom:** Dashboard shows all zeros on a new phone or incognito browser.

**Root Cause:** The health check used the heavy `/api/dashboard/` endpoint with a 2-second timeout. Render free-tier servers can take 10-30 seconds on cold start, so the check always timed out, causing sync to silently abort.

**Solution (August 2026):**
1. Changed health endpoint to `/api/health/` (lightweight, no auth)
2. Increased health timeout from 2s to 15s
3. Increased API timeout from 8s to 20s
4. Added retry logic: 3 attempts with 2-second delays
5. UptimeRobot keeps server awake to prevent cold starts

---

## 17. For Developers: How to Add a New Feature

### Example: Adding a "Customers" module

**Step 1:** Add model in `backend/api/models.py`
```python
class Customer(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    user_id = models.IntegerField(default=1)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, blank=True, null=True)
```

**Step 2:** Add serializer in `backend/api/serializers.py`

**Step 3:** Add ViewSet inheriting from `CompanyScopedModelViewSet`

**Step 4:** Register URL in `backend/api/urls.py`

**Step 5:** Run `python manage.py makemigrations && python manage.py migrate`

**Step 6:** Add `'customers'` to the TABLES array in `js/db.js`

**Step 7:** Create `js/customers.js` with the UI module

**Step 8:** Register the page in `js/app.js` navigation

---

## Quick Reference

| What | Where |
|------|-------|
| Live URL | https://inventory-ts07.onrender.com |
| GitHub | https://github.com/ABDELSAMADAMINEOUMAR/inventory |
| Database | Neon PostgreSQL |
| Hosting | Render.com (Free Tier) |
| Keep-Alive | UptimeRobot |
| API Base | https://inventory-ts07.onrender.com/api/ |
| Health Check | https://inventory-ts07.onrender.com/api/health/ |

---

*Documentation last updated: August 31, 2026*
*System Version: SmartIMS v1.0*
