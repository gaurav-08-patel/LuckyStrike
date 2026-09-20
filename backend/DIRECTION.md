# 🎟️ Lottery / Prize-Draw Platform — Dev-Stage Build Guide (v3, with code)

> Same 31 steps, same rule — **one step, one module, independently rollback-able**
> — but now every step includes the actual code to write, not just a
> description. Copy each block into the file named at the top of it, in order.

---

## 0. Quick Reference: Final Decisions

| Decision           | Answer                                                         |
| ------------------ | -------------------------------------------------------------- |
| Login              | Phone + OTP only, one route (`/login-signup`), no password     |
| Wallet balance     | Lives directly on `users.wallet_balance`                       |
| Wallet history     | Auto-written by a shared helper — never manual                 |
| Payments           | Fake top-up now; real Razorpay/Stripe test mode is future work |
| Withdrawals        | Not built yet                                                  |
| Prize payout       | Auto-credited to wallet + emailed                              |
| Winner pick        | Seed-commit-reveal (provably fair), not `Math.random()`        |
| Draw closing       | Fully automatic via scheduled job                              |
| Concurrency safety | Plain MySQL `SELECT ... FOR UPDATE`, no Redis                  |

## Project Status

Status as of current build:

- Phase A — Completed
- Phase B — Completed
- Phase C — Completed
- Phase D — Completed
- Phase E — Not started

This project has already validated the local MariaDB/MySQL setup, connected the backend successfully, created the required schema tables for `users`, `wallet_transaction_history`, `draws`, and `tickets`, implemented the phone + OTP authentication flow with JWT-based protected routes, and completed the wallet flow with a shared helper plus protected balance and transaction endpoints.

---

## PHASE A — Project Foundation

### Step 1: Initialize the backend project

**Objective:** A running server with one working route.

```bash
mkdir lottery-backend && cd lottery-backend
npm init -y
npm install express dotenv
npm install --save-dev nodemon
```

`server.js`:

```js
const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

Add to `package.json` scripts: `"dev": "nodemon server.js"`

**Test:** `npm run dev`, then visit `http://localhost:5000/health` → see `{ "status": "ok" }`.

---

### Step 2: Folder structure

**Objective:** Organize before adding real code.

```bash
mkdir routes controllers utils config middleware jobs
```

Nothing to test — just structure. Nothing else references these yet.

---

### Step 3: Environment configuration

**Objective:** All secrets/config live in `.env`, nothing hardcoded.

`.env`:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=lottery_db
JWT_SECRET=replace_with_a_long_random_string
```

`.gitignore`:

```
node_modules
.env
```

**Test:** add `console.log(process.env.DB_NAME)` temporarily in `server.js`, confirm it prints correctly, then remove the log line.

---

### Step 4: Connect to MySQL

**Objective:** A reusable connection pool other files can import.

```bash
npm install mysql2
```

`config/db.js`:

```js
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
```

Temporarily add to `server.js` to confirm it works, then remove:

```js
const pool = require("./config/db");
pool.query("SELECT 1").then(() => console.log("MySQL connected"));
```

**Test:** server startup logs "MySQL connected" with no errors.

---

## PHASE B — Database Tables

Run each of these directly in MySQL Workbench, TablePlus, or the `mysql` CLI —
one at a time, in order.

### Step 5: `users` table

```sql
CREATE TABLE users (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    phone_number          VARCHAR(20) NOT NULL UNIQUE,
    first_name            VARCHAR(100),
    last_name             VARCHAR(100),
    email                 VARCHAR(150) NULL,
    gender                VARCHAR(20) NULL,
    nationality           VARCHAR(100) NULL,
    country_of_residence  VARCHAR(100) NULL,
    wallet_balance        DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_phone_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Test:** `INSERT INTO users (phone_number) VALUES ('+911234567890');` then `SELECT * FROM users;` — confirm it appears with `wallet_balance = 0.00`.

### Step 6: `wallet_transaction_history` table

```sql
CREATE TABLE wallet_transaction_history (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    type            ENUM('topup', 'withdrawal', 'prize_credit', 'ticket_purchase') NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    balance_after   DECIMAL(10,2) NOT NULL,
    reference_type  VARCHAR(30) NULL,
    reference_id    INT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Test:** `INSERT INTO wallet_transaction_history (user_id, type, amount, balance_after) VALUES (1, 'topup', 100, 100);` then try the same with `user_id = 999` — confirm it fails on the foreign key.

### Step 7: `draws` table

```sql
CREATE TABLE draws (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    prize_title     VARCHAR(200) NOT NULL,
    prize_amount    DECIMAL(10,2) NOT NULL,
    ticket_price    DECIMAL(10,2) NOT NULL,
    max_tickets     INT NOT NULL,
    tickets_sold    INT NOT NULL DEFAULT 0,
    draw_at         DATETIME NOT NULL,
    expires_at      DATETIME NOT NULL,
    status          ENUM('active', 'closed', 'completed') NOT NULL DEFAULT 'active',
    winner_user_id  INT NULL,
    rng_seed_hash   VARCHAR(255) NULL,
    rng_seed        VARCHAR(255) NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Step 8: `tickets` table

```sql
CREATE TABLE tickets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    draw_id     INT NOT NULL,
    user_id     INT NOT NULL,
    status      ENUM('active', 'won', 'lost') NOT NULL DEFAULT 'active',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (draw_id) REFERENCES draws(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## PHASE C — Phone + OTP Authentication

### Step 9: OTP utility functions

**Objective:** Generate/store/verify OTPs — no route yet.

`utils/otp.js`:

```js
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const otpStore = new Map(); // phoneNumber -> { otp, expiresAt }

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber).replace(/\s+/g, "").trim();
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOtp(phoneNumber) {
  const otp = generateOtp();
  otpStore.set(phoneNumber, { otp, expiresAt: Date.now() + OTP_TTL_MS });
  return otp;
}

function verifyOtp(phoneNumber, otp) {
  const record = otpStore.get(phoneNumber);
  if (!record) return false;
  const isValid = record.otp === otp && Date.now() < record.expiresAt;
  if (isValid) otpStore.delete(phoneNumber);
  return isValid;
}

module.exports = { normalizePhoneNumber, generateOtp, storeOtp, verifyOtp };
```

**Test:** create a throwaway `test.js`, `require` this file, call `storeOtp('+911111111111')`, log the returned OTP, then call `verifyOtp('+911111111111', <that otp>)` and confirm it returns `true`. Run with `node test.js`, then delete the file.

---

### Step 10 & 11: The `/login-signup` route (both branches together, since they're one route)

**Objective:** One route — no OTP in body = send one; OTP in body = verify + login/create.

```bash
npm install jsonwebtoken
```

`routes/auth.js`:

```js
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { normalizePhoneNumber, storeOtp, verifyOtp } = require("../utils/otp");

const router = express.Router();

router.post("/login-signup", async (req, res) => {
  const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber || "");
  const otp = String(req.body?.otp || "");

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  // --- Branch 1: no OTP provided yet -> generate and return one ---
  if (!otp) {
    const generatedOtp = storeOtp(phoneNumber);
    return res.status(200).json({
      message: "OTP sent successfully.",
      phoneNumber,
      otp: generatedOtp, // dev mode only — remove this field once real SMS is wired in
      isOtpPreview: true,
    });
  }

  // --- Branch 2: OTP provided -> verify, then login or create ---
  const isValid = verifyOtp(phoneNumber, otp);
  if (!isValid) {
    return res.status(400).json({ message: "Invalid or expired OTP." });
  }

  const [existingRows] = await pool.query(
    "SELECT * FROM users WHERE phone_number = ?",
    [phoneNumber],
  );

  let user;
  let isNewUser;

  if (existingRows.length > 0) {
    user = existingRows[0];
    isNewUser = false;
    await pool.query("UPDATE users SET is_phone_verified = TRUE WHERE id = ?", [
      user.id,
    ]);
  } else {
    const [result] = await pool.query(
      "INSERT INTO users (phone_number, is_phone_verified) VALUES (?, TRUE)",
      [phoneNumber],
    );
    isNewUser = true;
    const [newRows] = await pool.query("SELECT * FROM users WHERE id = ?", [
      result.insertId,
    ]);
    user = newRows[0];
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  return res.status(200).json({
    message: isNewUser ? "Account created successfully." : "Login successful.",
    isNewUser,
    user,
    token,
    redirectUrl: isNewUser ? "/whatsapp-verify-page" : "/",
  });
});

module.exports = router;
```

Wire it into `server.js`:

```js
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);
```

**Test with Postman/curl:**

```bash
# Step 1: request OTP
curl -X POST http://localhost:5000/login-signup -H "Content-Type: application/json" -d '{"phoneNumber":"+911234567890"}'

# copy the "otp" from the response, then:
curl -X POST http://localhost:5000/login-signup -H "Content-Type: application/json" -d '{"phoneNumber":"+911234567890","otp":"123456"}'
```

First call with a brand-new number should return `isNewUser: true` and the verify-page redirect. Calling it again with the same number (new OTP each time) should return `isNewUser: false` and `/`.

---

### Step 12: Auth middleware

**Objective:** Protect routes using the JWT from Step 11.

`middleware/auth.js`:

```js
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = { requireAuth };
```

**Test:** add a temporary route `app.get('/test-auth', requireAuth, (req, res) => res.json(req.user))`, call it with and without the `Authorization: Bearer <token>` header, confirm it behaves correctly in both cases. Remove the test route after.

---

## PHASE D — Wallet (Fake Top-Up + Auto History)

### Step 13: Get wallet balance

`routes/wallet.js`:

```js
const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/wallet", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT wallet_balance FROM users WHERE id = ?",
    [req.user.id],
  );
  res.json({ balance: rows[0].wallet_balance });
});

module.exports = router;
```

Wire into `server.js`: `app.use('/', require('./routes/wallet'));`

**Test:** call `GET /wallet` with your token, confirm it returns `{ "balance": "0.00" }`.

---

### Step 14: Shared wallet-update helper (the most important file in this build)

**Objective:** One function every future money-movement uses.

`utils/wallet.js`:

```js
async function updateWalletBalance(
  connection,
  userId,
  amount,
  type,
  referenceType = null,
  referenceId = null,
) {
  await connection.query(
    "UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?",
    [amount, userId],
  );

  const [rows] = await connection.query(
    "SELECT wallet_balance FROM users WHERE id = ?",
    [userId],
  );
  const balanceAfter = rows[0].wallet_balance;

  await connection.query(
    `INSERT INTO wallet_transaction_history (user_id, type, amount, balance_after, reference_type, reference_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, type, amount, balanceAfter, referenceType, referenceId],
  );

  return balanceAfter;
}

module.exports = { updateWalletBalance };
```

Note: `connection` here must be a single checked-out connection (from `pool.getConnection()`), not the pool itself — that's what lets this run inside a transaction alongside other queries (Steps 15 and 20 both do this).

**Test:** throwaway script:

```js
const pool = require("./config/db");
const { updateWalletBalance } = require("./utils/wallet");

(async () => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  const newBalance = await updateWalletBalance(
    connection,
    1,
    100,
    "topup",
    "topup",
    null,
  );
  await connection.commit();
  console.log("New balance:", newBalance);
  connection.release();
  process.exit();
})();
```

Run it, confirm `users.wallet_balance` and a new `wallet_transaction_history` row both updated correctly.

---

### Step 15: Fake top-up endpoint

Add to `routes/wallet.js`:

```js
const { updateWalletBalance } = require("../utils/wallet");

router.post("/wallet/topup", requireAuth, async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid amount is required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const newBalance = await updateWalletBalance(
      connection,
      req.user.id,
      amount,
      "topup",
      "topup",
      null,
    );
    await connection.commit();
    res.json({ message: "Top-up successful.", balance: newBalance });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: "Top-up failed." });
  } finally {
    connection.release();
  }
});
```

**Test:** `POST /wallet/topup { "amount": 500 }` a few times, confirm `GET /wallet` reflects the growing balance each time.

---

### Step 16: Wallet transaction history endpoint

Add to `routes/wallet.js`:

```js
router.get("/wallet/transactions", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM wallet_transaction_history WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id],
  );
  res.json(rows);
});
```

**Test:** call it after Step 15's test top-ups, confirm each shows with the correct `balance_after`.

---

## PHASE E — Draws

### Step 17: Create draw (admin) — with the fairness commitment

```bash
npm install crypto  # actually built into Node, no install needed — just require('crypto')
```

`routes/adminDraws.js`:

```js
const express = require("express");
const crypto = require("crypto");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

async function requireAdmin(req, res, next) {
  const [rows] = await pool.query("SELECT is_admin FROM users WHERE id = ?", [
    req.user.id,
  ]);
  if (!rows[0]?.is_admin)
    return res.status(403).json({ message: "Admin only." });
  next();
}

router.post("/admin/draws", requireAuth, requireAdmin, async (req, res) => {
  const {
    title,
    prizeTitle,
    prizeAmount,
    ticketPrice,
    maxTickets,
    drawAt,
    expiresAt,
  } = req.body;

  if (new Date(expiresAt).getTime() <= new Date(drawAt).getTime()) {
    return res
      .status(400)
      .json({ message: "expiresAt must be later than drawAt." });
  }

  const seed = crypto.randomBytes(32).toString("hex");
  const seedHash = crypto.createHash("sha256").update(seed).digest("hex");

  const [result] = await pool.query(
    `INSERT INTO draws (title, prize_title, prize_amount, ticket_price, max_tickets, draw_at, expires_at, rng_seed_hash, rng_seed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      prizeTitle,
      prizeAmount,
      ticketPrice,
      maxTickets,
      drawAt,
      expiresAt,
      seedHash,
      seed,
    ],
  );
  // NOTE: rng_seed is stored now but must never be exposed via any GET route
  // until the draw is completed (Step 24 reveals it deliberately).

  res.status(201).json({
    message: "Draw created.",
    drawId: result.insertId,
    rngSeedHash: seedHash,
  });
});

module.exports = router;
```

Wire in: `app.use('/', require('./routes/adminDraws'));`
Manually run `UPDATE users SET is_admin = TRUE WHERE id = 1;` on your test user first.

**Test:** create a draw as your admin user, confirm `rng_seed_hash` is saved and looks like a valid SHA-256 hex string.

---

### Step 18 & 19: List + detail routes

`routes/draws.js`:

```js
const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.get("/draws", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM draws WHERE status = 'active'",
  );
  res.json(rows);
});

router.get("/draws/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM draws WHERE id = ?", [
    req.params.id,
  ]);
  if (!rows.length) return res.status(404).json({ message: "Draw not found." });

  const draw = rows[0];
  // Only expose the seed once the draw is completed — that's the "reveal" step
  if (draw.status !== "completed") {
    delete draw.rng_seed;
  }
  res.json(draw);
});

module.exports = router;
```

Wire in: `app.use('/', require('./routes/draws'));`

---

## PHASE F — Buying Tickets

### Step 20: Ticket purchase (the one place a real transaction matters)

`routes/tickets.js`:

```js
const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { updateWalletBalance } = require("../utils/wallet");

const router = express.Router();

router.post("/draws/:id/buy", requireAuth, async (req, res) => {
  const drawId = req.params.id;
  const quantity = Number(req.body?.quantity);
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Valid quantity is required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock this draw's row so concurrent buyers queue safely
    const [drawRows] = await connection.query(
      "SELECT * FROM draws WHERE id = ? FOR UPDATE",
      [drawId],
    );
    const draw = drawRows[0];

    if (!draw || draw.status !== "active") {
      throw new Error("Draw is not active.");
    }
    if (new Date(draw.expires_at).getTime() <= Date.now()) {
      throw new Error("Draw has expired.");
    }
    if (draw.tickets_sold + quantity > draw.max_tickets) {
      throw new Error("Not enough tickets remaining.");
    }

    const totalCost = draw.ticket_price * quantity;

    const [userRows] = await connection.query(
      "SELECT wallet_balance FROM users WHERE id = ? FOR UPDATE",
      [req.user.id],
    );
    if (userRows[0].wallet_balance < totalCost) {
      throw new Error("Insufficient wallet balance.");
    }

    await updateWalletBalance(
      connection,
      req.user.id,
      -totalCost,
      "ticket_purchase",
      "draw",
      drawId,
    );

    const ticketValues = Array.from({ length: quantity }, () => [
      drawId,
      req.user.id,
    ]);
    await connection.query("INSERT INTO tickets (draw_id, user_id) VALUES ?", [
      ticketValues,
    ]);

    await connection.query(
      "UPDATE draws SET tickets_sold = tickets_sold + ? WHERE id = ?",
      [quantity, drawId],
    );

    await connection.commit();
    res.json({
      message: "Tickets purchased successfully.",
      quantity,
      totalCost,
    });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ message: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
```

Wire in: `app.use('/', require('./routes/tickets'));`

**Test:** buy tickets normally (confirm balance drops, `tickets_sold` increases). Then try buying more than your balance allows, and more than `max_tickets` allows — confirm both fail cleanly with nothing partially applied (check `wallet_transaction_history` didn't get an entry for the failed attempts).

---

### Step 21: My tickets

Add to `routes/tickets.js`:

```js
router.get("/my-tickets", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT tickets.id, tickets.status, draws.title, draws.prize_title
     FROM tickets JOIN draws ON tickets.draw_id = draws.id
     WHERE tickets.user_id = ?`,
    [req.user.id],
  );
  res.json(rows);
});
```

---

## PHASE G — Automated Closing & Fair Winner Selection

### Step 22: Winner-picking function (pure logic)

`utils/fairDraw.js`:

```js
const crypto = require("crypto");

function pickWinningIndex(seed, drawId, ticketCount) {
  const hmac = crypto
    .createHmac("sha256", seed)
    .update(String(drawId))
    .digest("hex");
  const winningIndex = BigInt("0x" + hmac) % BigInt(ticketCount);
  return Number(winningIndex);
}

module.exports = { pickWinningIndex };
```

**Test:**

```js
const { pickWinningIndex } = require("./utils/fairDraw");
console.log(pickWinningIndex("abc123", 5, 10)); // run a few times, confirm it's always the SAME number
```

---

### Step 23: Email utility

```bash
npm install nodemailer
```

`utils/email.js`:

```js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g. sandbox.smtp.mailtrap.io for dev testing
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendWinnerEmail(toEmail, drawTitle, prizeAmount) {
  if (!toEmail) return; // user may not have set an email yet — skip silently for now
  await transporter.sendMail({
    from: '"Prize Draws" <no-reply@yourapp.com>',
    to: toEmail,
    subject: `You won: ${drawTitle}!`,
    text: `Congratulations! You won the "${drawTitle}" draw. ₹${prizeAmount} has been credited to your wallet.`,
  });
}

module.exports = { sendWinnerEmail };
```

Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` to `.env` (Mailtrap gives you free test credentials instantly).

**Test:** call `sendWinnerEmail('you@example.com', 'Test Draw', 500)` from a throwaway script, confirm it lands in your Mailtrap inbox.

---

### Step 24: Process one draw (wires 14 + 22 + 23 together)

`jobs/processDraw.js`:

```js
const pool = require("../config/db");
const { updateWalletBalance } = require("../utils/wallet");
const { pickWinningIndex } = require("../utils/fairDraw");
const { sendWinnerEmail } = require("../utils/email");

async function processDrawIfDue(drawId) {
  const connection = await pool.getConnection();
  let winnerEmail = null;
  let drawTitle = null;
  let prizeAmount = null;

  try {
    await connection.beginTransaction();

    const [drawRows] = await connection.query(
      "SELECT * FROM draws WHERE id = ? FOR UPDATE",
      [drawId],
    );
    const draw = drawRows[0];
    drawTitle = draw.title;
    prizeAmount = draw.prize_amount;

    await connection.query("UPDATE draws SET status = 'closed' WHERE id = ?", [
      drawId,
    ]);

    const [ticketRows] = await connection.query(
      "SELECT id, user_id FROM tickets WHERE draw_id = ? AND status = 'active'",
      [drawId],
    );

    if (ticketRows.length === 0) {
      await connection.query(
        "UPDATE draws SET status = 'completed' WHERE id = ?",
        [drawId],
      );
      await connection.commit();
      return;
    }

    const winningIndex = pickWinningIndex(
      draw.rng_seed,
      drawId,
      ticketRows.length,
    );
    const winningTicket = ticketRows[winningIndex];

    await connection.query("UPDATE tickets SET status = 'won' WHERE id = ?", [
      winningTicket.id,
    ]);
    await connection.query(
      "UPDATE tickets SET status = 'lost' WHERE draw_id = ? AND id != ?",
      [drawId, winningTicket.id],
    );

    await updateWalletBalance(
      connection,
      winningTicket.user_id,
      prizeAmount,
      "prize_credit",
      "draw",
      drawId,
    );

    await connection.query(
      "UPDATE draws SET status = 'completed', winner_user_id = ? WHERE id = ?",
      [winningTicket.user_id, drawId],
    );

    const [userRows] = await connection.query(
      "SELECT email FROM users WHERE id = ?",
      [winningTicket.user_id],
    );
    winnerEmail = userRows[0].email;

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error(`Failed to process draw ${drawId}:`, err.message);
    return;
  } finally {
    connection.release();
  }

  // Email sent AFTER commit succeeds — a failed email shouldn't undo a valid winner pick
  if (winnerEmail) {
    await sendWinnerEmail(winnerEmail, drawTitle, prizeAmount);
  }
}

module.exports = { processDrawIfDue };
```

**Test:** manually run `processDrawIfDue(<your test draw id>)` from a throwaway script on a draw with a couple of tickets already bought. Confirm: one ticket `won`, others `lost`, winner's wallet credited, history row added, and email sent.

---

### Step 25: The scheduled job

```bash
npm install node-cron
```

`jobs/drawScheduler.js`:

```js
const cron = require("node-cron");
const pool = require("../config/db");
const { processDrawIfDue } = require("./processDraw");

function startDrawScheduler() {
  cron.schedule("* * * * *", async () => {
    const [dueDraws] = await pool.query(
      "SELECT id FROM draws WHERE status = 'active' AND draw_at <= NOW()",
    );
    for (const draw of dueDraws) {
      await processDrawIfDue(draw.id);
    }
  });
  console.log("Draw scheduler started — checking every minute.");
}

module.exports = { startDrawScheduler };
```

In `server.js`:

```js
const { startDrawScheduler } = require("./jobs/drawScheduler");
startDrawScheduler();
```

**Test:** create a draw with `draw_at` set to 1–2 minutes from now, buy tickets for it, then just wait — with no manual action, confirm it closes and picks a winner on its own within a minute of `draw_at`.

---

## PHASE H — Frontend (Minimal, React)

### Step 26: Set up React app

```bash
npx create-vite@latest lottery-frontend -- --template react
cd lottery-frontend
npm install axios react-router-dom
```

`src/api.js`:

```js
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### Step 27: Login/signup page

```jsx
// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const requestOtp = async () => {
    const { data } = await api.post("/login-signup", { phoneNumber });
    setOtpSent(true);
    alert(`Dev mode OTP: ${data.otp}`); // remove once real SMS is wired in
  };

  const verifyOtp = async () => {
    const { data } = await api.post("/login-signup", { phoneNumber, otp });
    localStorage.setItem("token", data.token);
    navigate(data.redirectUrl);
  };

  return (
    <div>
      <input
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="Phone number"
      />
      {!otpSent ? (
        <button onClick={requestOtp}>Send OTP</button>
      ) : (
        <>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />
          <button onClick={verifyOtp}>Verify</button>
        </>
      )}
    </div>
  );
}
```

### Step 28: Wallet page

```jsx
// src/pages/Wallet.jsx
import { useEffect, useState } from "react";
import api from "../api";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);

  const load = async () => {
    const bal = await api.get("/wallet");
    const txns = await api.get("/wallet/transactions");
    setBalance(bal.data.balance);
    setHistory(txns.data);
  };

  useEffect(() => {
    load();
  }, []);

  const topUp = async () => {
    await api.post("/wallet/topup", { amount: 500 });
    load();
  };

  return (
    <div>
      <h2>Balance: ₹{balance}</h2>
      <button onClick={topUp}>Add ₹500 (fake)</button>
      <ul>
        {history.map((t) => (
          <li key={t.id}>
            {t.type}: {t.amount} → balance {t.balance_after}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Steps 29–31: Draws list/detail, buy flow, my tickets

Same pattern as above — call the matching endpoint (`GET /draws`, `GET /draws/:id`, `POST /draws/:id/buy`, `GET /my-tickets`), store the result in `useState`, render it. Reuse the same `api.js` instance from Step 26 for all of them; no new setup needed.

---

## What's Left Out (Future Work)

| Left out              | Add it when...                   |
| --------------------- | -------------------------------- |
| Real payment gateway  | Swaps in only at Step 15         |
| Withdrawals / payouts | Decided how payouts get executed |
| KYC                   | Right before withdrawals         |
| Redis / queues        | Real concurrent load appears     |
| Real SMS delivery     | Before real users                |

By the end of Step 25, run the whole loop with no frontend at all, purely via Postman/curl and `node-cron` doing its thing in the background — that's the point to stress-test before building Phase H.
