-- LuckyStrike schema bootstrap
-- Run with:
--   sudo mariadb -uroot < backend/sql/init-schema.sql
-- or:
--   mysql -u root -p < backend/sql/init-schema.sql

CREATE DATABASE IF NOT EXISTS luckystrike CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE luckystrike;

CREATE TABLE IF NOT EXISTS users (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    phone_number          VARCHAR(20) NOT NULL UNIQUE,
    first_name            VARCHAR(100) NULL,
    last_name             VARCHAR(100) NULL,
    email                 VARCHAR(150) NULL,
    gender                VARCHAR(20) NULL,
    nationality           VARCHAR(100) NULL,
    country_of_residence  VARCHAR(100) NULL,
    profile_image         VARCHAR(500) NULL,
    wallet_balance        DECIMAL(10,2) NOT NULL DEFAULT 0,
    pending_withdrawal_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_phone_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_bank_accounts (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    user_id               INT NOT NULL,
    account_holder_name   VARCHAR(200) NOT NULL,
    bank_name             VARCHAR(200) NOT NULL,
    account_number        VARCHAR(80) NOT NULL,
    iban                  VARCHAR(100) NULL,
    ifsc_code             VARCHAR(50) NULL,
    swift_code            VARCHAR(50) NULL,
    branch_name           VARCHAR(200) NULL,
    routing_number        VARCHAR(100) NULL,
    is_default            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_bank_accounts_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    user_id               INT NOT NULL,
    bank_account_id       INT NOT NULL,
    amount                DECIMAL(10,2) NOT NULL,
    currency              VARCHAR(10) NOT NULL DEFAULT 'INR',
    status                ENUM('pending', 'under_review', 'approved', 'rejected', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
    request_note          TEXT NULL,
    admin_note            TEXT NULL,
    reviewed_by_admin_id  INT NULL,
    reviewed_at           DATETIME NULL,
    paid_at               DATETIME NULL,
    payment_reference     VARCHAR(200) NULL,
    rejection_reason      TEXT NULL,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_withdrawal_requests_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_withdrawal_requests_bank_account
        FOREIGN KEY (bank_account_id) REFERENCES user_bank_accounts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS withdrawal_audit_logs (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    withdrawal_request_id INT NOT NULL,
    actor_user_id         INT NULL,
    actor_role            ENUM('user', 'admin') NOT NULL,
    action               VARCHAR(100) NOT NULL,
    old_status           VARCHAR(50) NULL,
    new_status           VARCHAR(50) NULL,
    note                 TEXT NULL,
    created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_withdrawal_audit_request
        FOREIGN KEY (withdrawal_request_id) REFERENCES withdrawal_requests(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wallet_transaction_history (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    type            ENUM('topup', 'withdrawal', 'withdrawal_request', 'withdrawal_approved', 'withdrawal_paid', 'withdrawal_rejected', 'withdrawal_cancelled', 'prize_credit', 'ticket_purchase') NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    balance_after   DECIMAL(10,2) NOT NULL,
    reference_type  VARCHAR(30) NULL,
    reference_id    INT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wallet_txn_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS draws (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    draw_code       VARCHAR(20) NOT NULL UNIQUE,
    draw_type       ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
    title           VARCHAR(200) NOT NULL,
    image           VARCHAR(500) NULL,
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tickets (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    ticket_code     VARCHAR(20) NOT NULL UNIQUE,
    draw_id         INT NOT NULL,
    user_id         INT NOT NULL,
    status          ENUM('active', 'won', 'lost') NOT NULL DEFAULT 'active',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_draw
        FOREIGN KEY (draw_id) REFERENCES draws(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS winners (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    draw_id         INT NOT NULL,
    draw_code       VARCHAR(50) NOT NULL,
    ticket_code     VARCHAR(50) NOT NULL,
    prize_title     VARCHAR(200) NOT NULL,
    prize_amount    DECIMAL(10,2) NOT NULL,
    winner_name     VARCHAR(200) NOT NULL,
    draw_title      VARCHAR(200) NOT NULL,
    draw_type       ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
    image_url       VARCHAR(500) NULL,
    announced_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_winners_draw
        FOREIGN KEY (draw_id) REFERENCES draws(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_requests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    issue_type      VARCHAR(50) NOT NULL,
    subject         VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    status          ENUM('received', 'in_review', 'resolved', 'closed') NOT NULL DEFAULT 'received',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_support_requests_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;
