# Product Catalogue Backend (Node.js + TypeScript)

Lightweight Backend-for-Frontend (BFF) API built with Node.js, Express, and TypeScript. It acts as an anti-corruption layer between the Android client and the external Fake Store API, handling DTO mapping, top-rated sorting, search filtering, and product enquiries without requiring external paid accounts.

---

## Prerequisites

* **Node.js** v18 or higher (`node -v`)
* **npm** v9 or higher (`npm -v`)

---

## Quick Start (Under 2 Minutes)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create your local environment file:**
   ```bash
   cp .env.example .env
   ```
   *(Default values work out of the box—no API keys or external accounts required.)*

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the server:**
   * **Development mode (auto-reloads on file changes):**
     ```bash
     npm run dev
     ```

The server will start at **`http://localhost:3000`**.

---

## Connecting from the Android App

* **Android Emulator:** The app connects to the host machine via `http://10.0.2.2:3000/`.


---

## Environment Variables

Configured via `backend/.env` (see `backend/.env.example`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port the Express server listens on |
| `FAKESTORE_BASE_URL` | `https://fakestoreapi.com` | Upstream product catalog data source |
| `SALES_INBOX_EMAIL` | `sales@example.com` | Target inbox logged by `ConsoleEmailService` on enquiry submission |

---

## Available API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check (`{ "status": "ok" }`) |
| `GET` | `/api/products?q=<term>` | Case-insensitive search across product title and description |
| `GET` | `/api/products/:id` | Single product details by ID |
| `POST` | `/api/enquiries` | Submit a product enquiry (`name`, `email`, `phone`, `productId`, `productTitle`, `quantity`) |

### Quick Verification (`curl`)

```bash
# Check server status
curl http://localhost:3000/health

# Fetch top 5 featured products
curl http://localhost:3000/api/products/featured

# Test product enquiry submission
curl -X POST http://localhost:3000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+919876543210",
    "productId": 1,
    "productTitle": "Fjallraven - Foldsack No. 1 Backpack",
    "quantity": 1
  }'
```
*(Submitted enquiries are logged directly in the Node.js terminal via `ConsoleEmailService`.)*

---

---

## Architecture Notes

* **Swappable Catalog Provider (`src/catalogProvider.ts`):** Isolates the Fake Store API behind a `CatalogProvider` interface with a 5-minute in-memory cache and maps external JSON into internal domain `Product` DTOs.
* **Swappable Email Service (`src/emailService.ts`):** Uses an `EmailService` interface currently backed by `ConsoleEmailService` for zero-setup local testing, ready to swap for AWS SES or Nodemailer in production.
