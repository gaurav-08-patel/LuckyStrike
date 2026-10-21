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

The project is now in a feature-complete phase for the main Lucky Strike product flow and is actively being polished for client presentation, payout workflow maturity, and page-level UX refinement.

Completed features:

- local MariaDB / MySQL compatibility with MySQL-safe SQL and UTC-aware time handling
- backend bootstrap and API setup
- JWT auth flow and protected routes
- profile and user management routes
- profile update flow with auth refresh after save
- avatar upload flow using Cloudinary-compatible remote URLs and persisted `profile_image`
- user profile image support with placeholder initials and image fallback UI
- wallet balance system, transaction history, and wallet top-up flow
- account/profile page with mobile-friendly dashboard layout
- sidebar/account UX improvements, responsive mobile drawer behavior, and role-aware account layout
- separate user/admin account shells and tab gating based on the real logged-in user state
- draw creation, draw filtering, and draw detail routes
- ticket purchase flow and `my tickets` history
- draw settlement logic and winner selection using deterministic seeded fairness
- cron scheduler for expired draw settlement
- winner email notification flow
- public winners API and frontend winners carousel / page
- frontend home page with campaign cards and countdown UI
- backend public asset serving for banner images and draw `image` field support
- local schema updates including `profile_image`, `is_admin`, and wallet support
- support ticket form with backend persistence to MySQL via `support_requests`
- admin support review API with status updates: received / in_review / resolved / closed
- user activity tab combining recent transaction history, recent ticket purchases, and recent won tickets
- role checks now rely on the authenticated user’s actual `is_admin` flag rather than URL assumptions
- withdrawal workflow separation into wallet vs request lifecycle logic
- saved bank account system as the source of truth for false-safe withdrawal requests
- user-side withdrawal request creation and request history endpoints
- admin withdrawal review, approval, rejection, and payout action flow
- audit logs and actor visibility for payout decisions
- custom account sidebar scrollbar styling with a slim pink/red look and rounded corners
- SEO metadata component for page title / description / OG / Twitter / canonical tags
- metadata rollout across major app pages
- demo campaign seeder for 20 presentation-ready campaigns expiring within a few days
- multiple visual redesign iterations for the campaign detail page while keeping the behavior unchanged
- frontend build validation after latest layout passes

Current working state:

- the app is functionally end-to-end for auth, profile management, wallet flow, ticketing, winners, support, and payout workflow
- the withdrawal architecture follows the agreed business model: save bank details once, select a bank account, request withdrawal, admin approve, manual payout later, and pay as the final settlement event
- the frontend UI is aligned with the account/profile aesthetic and includes polished sidebar, home CTA, and campaign detail styling
- the reusable metadata component is in place and being used across public and account pages
- the app remains MySQL/MariaDB compatible and can be used locally without breaking the core logic
- the main remaining operational risk is local DB schema alignment for the payout lifecycle and transaction enum values
- the campaign detail page is intentionally kept in design-exploration mode until the final visual direction is selected
- environment variables for DB, JWT, email, and optional external services still need to remain synchronized with local `.env` files

### Withdrawal workflow status

The project now follows the intended withdrawal business flow:

- users save bank accounts in a dedicated `user_bank_accounts` table
- withdrawal requests reference a saved `bank_account_id`, not raw bank data
- the request is created with `status = pending`
- pending withdrawal amount is reserved on request creation
- admin reviews the user, wallet, and bank account details
- admin can approve or reject the request
- actual wallet deduction happens only when the admin marks the request as paid
- payout actions are kept separate from approval to reflect real manual payout timing

This architecture matches the business rule and keeps the wallet logic cleanly separated from withdrawal lifecycle operations.

### Metadata / SEO status

A reusable `MetaData` component was added and uses React 19-compatible document tag hoisting.

It provides:

- page title
- meta description
- Open Graph data
- Twitter card data
- canonical URL
- support for page-specific image values such as `campaign.image`

This has been rolled out across the main public and account pages to improve shareability and page quality.

### Admin / account UX status

Role-based access remains server/session-truth driven.

- admin-only routes depend on the actual `user.is_admin` value
- user-only pages hide admin sections when not allowed
- account sidebar and mobile drawer styling has been refined to remove browser-default scrollbar behavior
- custom slim pink/red scrollbars are now applied to the account shell for a cleaner cross-browser experience

### Presentation / demo-data status

The app includes a Node.js seeder script that posts demo campaign data through the admin draw endpoint.

It creates 20 campaign entries with near-term expiry dates so the app is presentation-ready for client demos.

### Known follow-up items

- verify local MySQL/MariaDB enum / schema values for payout transaction types against the app contract
- finalize the final visual direction for the campaign detail page after evaluating the latest design iterations
- complete any remaining metadata copy polish for pages that still need final brand wording
- continue hardening the payout flow using a live DB instance to validate approve / pay / reject lifecycle end-to-end

---

### Role access status

Role-based access is now treated as a server/session truth source rather than a UI-only guess.

- the auth/session payload must include the actual admin state from the database (`user.is_admin`)
- admin-only routes should only be considered accessible when the authenticated user is truly an admin
- user account pages must not expose admin tabs or admin-only route navigation when the user is not an admin
- the previous issue where stale account-role state caused /admin paths to redirect incorrectly has been addressed by validating the current user object before rendering role-specific UI

### Activity tab status

The account activity section is built as a dedicated component that shows:

- recent wallet / transaction history
- recent ticket purchases
- recent won tickets
- empty-state placeholders when there is no activity
- direct links to the full activity pages: `/my-tickets` and `/wallet`

This is designed to keep the dashboard compact while still giving users a clear and useful recent activity summary.

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
  profile_image VARCHAR(500) NULL,
  wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT UTC_TIMESTAMP,
  updated_at DATETIME DEFAULT UTC_TIMESTAMP ON UPDATE UTC_TIMESTAMP
) ENGINE=InnoDB;
```

Important note:

- `profile_image` stores the full Cloudinary URL, not a local file path
- frontend code expects `profileImage` on the client and `profile_image` in MySQL
- the app refreshes `/api/auth/me` after profile updates so the latest data is immediately reflected in auth state

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

### support_requests

```sql
CREATE TABLE IF NOT EXISTS support_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  issue_type VARCHAR(50) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('received', 'in_review', 'resolved', 'closed') NOT NULL DEFAULT 'received',
  created_at DATETIME DEFAULT UTC_TIMESTAMP,
  updated_at DATETIME DEFAULT UTC_TIMESTAMP ON UPDATE UTC_TIMESTAMP,
  CONSTRAINT fk_support_requests_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
```

This table stores support tickets submitted from the account Support tab. Each request is associated with a user and can later be reviewed in an admin console or exported for email automation.

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

### Admin overview dashboard

The admin overview tab is designed as a live operations dashboard. Its data is pulled from a single API so the frontend can render KPI cards, recent sales, current draws, recent winners, and open support tickets without multiple round-trips.

Primary route:

- GET /api/admin/overview

Response shape:

```json
{
  "summary": {
    "totalUsers": 240,
    "activeDraws": 8,
    "ticketsSoldLast7Days": 450,
    "openSupportRequests": 14,
    "walletVolumeLast30Days": 18250.5
  },
  "activeDraws": [
    {
      "id": 12,
      "drawCode": "DA-1001",
      "title": "Weekend Rush",
      "prizeTitle": "Tesla Model 3",
      "prizeAmount": 35000,
      "ticketPrice": 10,
      "maxTickets": 200,
      "ticketsSold": 162,
      "drawAt": "2026-10-21T18:00:00.000Z",
      "expiresAt": "2026-10-21T16:00:00.000Z",
      "status": "active"
    }
  ],
  "recentTicketPurchases": [
    {
      "id": 88,
      "ticketCode": "TK-4091",
      "userId": 22,
      "userName": "Aisha Khan",
      "drawCode": "DA-1001",
      "drawTitle": "Weekend Rush",
      "prizeAmount": 35000,
      "ticketPrice": 10,
      "createdAt": "2026-10-20T10:44:00.000Z"
    }
  ],
  "recentWinners": [
    {
      "id": 5,
      "drawCode": "DA-0999",
      "winnerName": "Rafael Lewis",
      "prizeAmount": 12000,
      "announcedAt": "2026-10-19T12:00:00.000Z",
      "drawTitle": "Gold Drop"
    }
  ],
  "recentSupportRequests": [
    {
      "id": 9,
      "issueType": "wallet",
      "subject": "Top-up not reflecting",
      "status": "in_review",
      "createdAt": "2026-10-20T09:12:00.000Z",
      "userName": "Nora Ahmed"
    }
  ]
}
```

This backend contract feeds the Overview tab with:

- KPI metrics at the top
- recent active draws table
- ticket purchase feed
- recent winners feed
- support queue feed

The frontend should treat this as the source of truth for the dashboard cards and tables.

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
