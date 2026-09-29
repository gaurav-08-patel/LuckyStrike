# Lucky Strike — Project Guide and Current Build Status

This document reflects the actual state of the project as it exists today. It is intended to help a new AI or developer understand the project without needing a fresh explanation from scratch.

---

## 1. Project summary

Lucky Strike is a full-stack raffle / draw application built with:

- Node.js + TypeScript + Express backend
- MySQL / MariaDB database
- React + TypeScript + Vite frontend
- JWT-based auth
- wallet logic and transaction history
- automated draw settlement and winner resolution
- public winners API and frontend carousel

The project is designed to stay generic and MySQL-compatible so it can work locally with MariaDB and later move to a cloud-hosted MySQL instance without code changes.

---

## 2. Current status

Completed features:

- local MariaDB / MySQL compatibility
- backend bootstrap and API setup
- JWT auth flow and protected routes
- profile and user management routes
- wallet balance system and transaction history
- draw creation and draw filtering routes
- draw detail route supporting either id or draw_code
- ticket purchase flow
- my tickets route
- draw settlement logic
- winner selection logic using deterministic seed-based fairness
- cron scheduler for expired draw settlement
- winner email notification flow
- public winners API
- frontend winners carousel and winners page
- frontend home page with campaign cards and countdown UI
- UTC-safe date conversion for database inserts
- backend public asset serving for banner images
- draw banner `image` field in DB
- updated schema in local MariaDB

Current known focus:

- maintain the local DB schema in sync with code
- keep winner records and public image URLs working reliably
- finalise production-ready email config and environment setup

---

## 3. Stack

### Backend

- Node.js
- TypeScript
- Express
- mysql2 / MariaDB pool
- JWT
- node-cron
- Nodemailer

### Frontend

- React
- TypeScript
- Vite
- React Router

### Database

- MariaDB (local dev)
- MySQL-compatible SQL patterns

---

## 4. Repository structure

```txt
LuckyStrike/
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── adminDraws.ts
│   │   │   ├── auth.ts
│   │   │   ├── draws.ts
│   │   │   ├── tickets.ts
│   │   │   ├── users.ts
│   │   │   ├── wallet.ts
│   │   │   └── winners.ts
│   │   ├── utils/
│   │   │   ├── drawSettlement.ts
│   │   │   ├── email.ts
│   │   │   ├── wallet.ts
│   │   │   ├── winnerPublic.ts
│   │   │   └── displayCodes.ts
│   │   └── ...
│   ├── sql/
│   │   └── init-schema.sql
│   ├── public/
│   │   └── images/
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── DIRECTION.md
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
├── README.md
└── .git/
```

---

## 5. Database schema

The current schema includes these main tables:

### users

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  email VARCHAR(150) NULL,
  gender VARCHAR(20) NULL,
  nationality VARCHAR(100) NULL,
  country_of_residence VARCHAR(100) NULL,
  wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

### wallet_transaction_history

```sql
CREATE TABLE IF NOT EXISTS wallet_transaction_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('topup', 'withdrawal', 'prize_credit', 'ticket_purchase') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference_type VARCHAR(30) NULL,
  reference_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_txn_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
```

### draws

```sql
CREATE TABLE IF NOT EXISTS draws (
  id INT AUTO_INCREMENT PRIMARY KEY,
  draw_code VARCHAR(20) NOT NULL UNIQUE,
  draw_type ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
  title VARCHAR(200) NOT NULL,
  image VARCHAR(500) NULL,
  prize_title VARCHAR(200) NOT NULL,
  prize_amount DECIMAL(10,2) NOT NULL,
  ticket_price DECIMAL(10,2) NOT NULL,
  max_tickets INT NOT NULL,
  tickets_sold INT NOT NULL DEFAULT 0,
  draw_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  status ENUM('active', 'closed', 'completed') NOT NULL DEFAULT 'active',
  winner_user_id INT NULL,
  rng_seed_hash VARCHAR(255) NULL,
  rng_seed VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

Important note:

- `image` stores the public image URL for the draw banner
- Example: `http://localhost:5000/public/images/draw-amt-1.webp`

### tickets

```sql
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_code VARCHAR(20) NOT NULL UNIQUE,
  draw_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('active', 'won', 'lost') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tickets_draw
    FOREIGN KEY (draw_id) REFERENCES draws(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
```

### winners

```sql
CREATE TABLE IF NOT EXISTS winners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  draw_id INT NOT NULL,
  draw_code VARCHAR(50) NOT NULL,
  ticket_code VARCHAR(50) NOT NULL,
  prize_title VARCHAR(200) NOT NULL,
  prize_amount DECIMAL(10,2) NOT NULL,
  winner_name VARCHAR(200) NOT NULL,
  draw_title VARCHAR(200) NOT NULL,
  draw_type ENUM('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
  image_url VARCHAR(500) NULL,
  announced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_winners_draw
    FOREIGN KEY (draw_id) REFERENCES draws(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
```

---

## 6. Business logic

### Auth flow

The app uses phone number OTP login via JWT. The token is attached to protected requests and identifies the current user.

Key files:

- backend/src/routes/auth.ts
- backend/src/middleware/auth.ts

### Wallet flow

User balance is maintained in `users.wallet_balance`. All balance updates happen through a shared helper, which also writes a row into wallet_transaction_history.

Key files:

- backend/src/utils/wallet.ts
- backend/src/routes/wallet.ts

### Draw lifecycle

A draw can be active, closed, or completed.

The cron scheduler checks active draws whose `draw_at` time has arrived, and then calls settlement logic.

Settlement behavior:

- only active draws are settled
- if no tickets are sold, the draw is closed
- if tickets exist, a winner is chosen using the seeded fairness logic
- winner wallet is credited
- tickets are marked won/lost
- draw is marked completed
- winner record is inserted
- winner email is sent

Key files:

- backend/src/server.ts
- backend/src/utils/drawSettlement.ts
- backend/src/routes/adminDraws.ts

### Draw image assignment

The backend assigns a banner image automatically based on prize amount when the draw is created.

Example mapping:

- lower prize -> draw-amt-1.webp
- medium prize -> draw-amt-2.webp
- higher prize -> draw-amt-3.webp

Key file:

- backend/src/routes/adminDraws.ts

### Public winners feed

The backend exposes recent winners through a public API, and the frontend consumes it for the homepage carousel and winners page.

Key files:

- backend/src/routes/winners.ts
- backend/src/utils/winnerPublic.ts
- frontend/src/components/WinnersCarousel.tsx
- frontend/src/pages/WinnersPage.tsx

---

## 7. API routes

### Public / health

- GET /api/health

### Auth

- POST /api/auth/login-signup

### Users

- GET /api/users/me
- PUT /api/users/profile

### Wallet

- GET /api/wallet
- POST /api/wallet/topup
- GET /api/wallet/transactions

### Draws

- GET /api/draws
- GET /api/draws/:id
- GET /api/admin/draws
- POST /api/admin/draws
- POST /api/admin/draws/:id/settle

### Tickets

- POST /api/draws/:id/buy
- GET /api/my-tickets

### Winners

- GET /api/winners

---

## 8. Public image hosting

The backend serves files from the backend public folder.

Example:

- file path: backend/public/images/draw-amt-1.webp
- URL: http://localhost:5000/public/images/draw-amt-1.webp

This is enabled in:

- backend/src/app.ts

This is the chosen pattern for local backend-hosted banner images.

---

## 9. Time handling

The app uses UTC-safe storage patterns.

Frontend local input is converted before being inserted into the database. This prevents timezone drift and inconsistent draw timing.

Relevant code:

- backend/src/routes/adminDraws.ts

---

## 10. Frontend overview

The frontend is a Vite React app with:

- landing page and hero section
- draw campaign list
- countdown and registration UI
- wallet page
- auth flow
- winners carousel and winners page

Main files:

- frontend/src/pages/Home.tsx
- frontend/src/components/WinnersCarousel.tsx
- frontend/src/pages/WinnersPage.tsx
- frontend/src/context/AuthContext.tsx

---

## 11. Local development workflow

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Build validation

```bash
cd backend && npm run build
cd frontend && npm run build
```

---

## 12. Environment variables

Example values:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=luckystrike
DB_PASSWORD=LuckyStrike123
DB_NAME=luckystrike

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=no-reply@luckystrike.local
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

JWT_SECRET=...
```

---

## 13. Important notes for future AI work

- The app is meant to be MySQL/MariaDB compatible, not Postgres specific.
- Always keep draw and winner tables in sync with the app logic.
- When truncating parent tables, child tables with foreign key dependencies must be cleared first.
- The backend serves static public assets from /public, so image URLs are generated as backend URLs.
- The game logic is backend-first; most important rules belong in the server and DB transaction layer.

---

## 14. Recommended reading order

To understand the app quickly, read these in order:

1. README.md
2. backend/DIRECTION.md
3. backend/src/app.ts
4. backend/src/server.ts
5. backend/src/routes/adminDraws.ts
6. backend/src/routes/draws.ts
7. backend/src/utils/drawSettlement.ts
8. backend/src/routes/winners.ts
9. frontend/src/pages/Home.tsx
10. frontend/src/components/WinnersCarousel.tsx

---

## 15. Final summary

Lucky Strike is a working raffle and draw application with real backend logic for auth, wallet, ticketing, draw settlement, winner selection, public winner presentation, and static image hosting. The project is now beyond a prototype and is in a practical development state where most of the core business rules are implemented and wired together.
