# EventHub

A modern, full-stack event-management platform built with React and Node.js. Enjoy friction-free ticketing (QR codes included), real-time chat support, and secure payment processing—all in one place.


## Project Overview

EventHub bridges the gap between event organizers and attendees. Discover, book, and manage events with enterprise-grade features like digital ticketing, integrated payments, and live customer support.


## Features

### Advanced Digital Ticketing

* **QR Codes** for every ticket (scan & go)
* **Mobile Validation** at the gate
* **Peer-to-Peer Transfers** with automatic price reconciliation
* **Email Delivery** (PDF attachments)
* **Bulk Purchases** for groups
* **Smart Refunds** with configurable rules

### Payment Processing

* **Multiple Methods**: credit, debit, saved cards
* **In-App Credits** with balance tracking
* **Automated Refunds** & status monitoring
* **Payment Analytics** for revenue insights

### Smart Event Discovery

* **Advanced Search** by location, date, price, category
* **Geocoding** for instant mapping & address validation
* **Recently Viewed** for tailored suggestions

###  Real-Time Experience

* **Live Chat** powered by Socket.io
* **Instant Notifications** for bookings and changes
* **Admin Alerts** for new bookings or issues

### Security & Authentication

* **JWT** token-based auth
* **OAuth** (Google, Facebook)
* **Role-Based Access**: admin, user, guest
* **Data Encryption** for sensitive info

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Node.js API    │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ • Components    │◄──►│ • REST API      │◄──►│ • Event Data    │
│ • State Mgmt    │    │ • Auth          │    │ • User Data     │
│ • Real-time UI  │    │ • Business Logic│    │ • Transactions  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   Socket.io     │
         └──────────────►│ • Live Chat     │
                        │ • Notifications │
                        │ • Real-time     │
                        └─────────────────┘
```


## How to run it

### Prerequisites

* **Node.js** ≥ 18 (with npm)
* **PostgreSQL** ≥ 13
* **Google Maps API key** for geocoding
* **SMTP account** (e.g., Gmail) for email notifications

### Environment Configuration

<details>
<summary>Backend <code>.env</code></summary>

```env
# ── Server ──
PORT=5000
NODE_ENV=development

# ── Database ──
DB_USER=postgres
DB_HOST=localhost
DB_NAME=eventhub
DB_PASSWORD=your_secure_password
DB_PORT=5432

# ── JWT ──
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# ── Client ──
CLIENT_URL=http://localhost:5173

# ── Google OAuth ──
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# ── Facebook OAuth ──
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# ── Email ──
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=noreply@eventhub.com
EMAIL_FROM_NAME=EventHub

# ── Google Maps ──
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

</details>

<details>
<summary>Frontend <code>.env</code></summary>

```env
# ── Google Maps ──
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ── API ──
VITE_API_URL=http://localhost:5000/api

# ── Socket.io ──
VITE_SOCKET_API_URL=http://localhost:5000
```

</details>

### Installation & Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/Valy2255/EventHub.git
   cd EventHub
   ```

2. **Backend**

   ```bash
   cd backend
   npm install
   # Add your .env (see above)
   npm run dev
   ```

3. **Frontend**

   ```bash
   cd ../frontend
   npm install
   # Add your .env (see above)
   npm run dev
   ```

4. **Database Setup**

   ```bash
   # 1. Create an empty PostgreSQL database
   createdb eventhub

   # 2. Restore the schema (change placeholders as needed)
   psql -U <your_username> -h <host> -p <port> -d eventhub \
     -f "./db_backup_schema/eventhub_structure_backup.sql"
   ```

   **Tip:** On Windows, you can replace the relative path with something like
   `C:\path\to\repo\db_backup_schema\eventhub_structure_backup.sql`.

### Where to Find Everything

* **Frontend**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)
* **Admin Dashboard**: [http://localhost:5173/admin](http://localhost:5173/admin)

