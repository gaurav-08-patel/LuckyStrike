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
    wallet_balance        DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_phone_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wallet_transaction_history (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    type            ENUM('topup', 'withdrawal', 'prize_credit', 'ticket_purchase') NOT NULL,
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
    title           VARCHAR(200) NOT NULL,
    prize_title     VARCHAR(200) NOT NULL,
    prize_amount    DECIMAL(10,2) NOT NULL,
    ticket_price    DECIMAL(10,2) NOT NULL,
    max_tickets     INT NOT NULL,
    tickets_sold    INT NOT NULL DEFAULT 0,
    draw_at         DATETIME NOT NULL,
    status          ENUM('active', 'closed', 'completed') NOT NULL DEFAULT 'active',
    winner_user_id  INT NULL,
    rng_seed_hash   VARCHAR(255) NULL,
    rng_seed        VARCHAR(255) NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tickets (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    draw_id     INT NOT NULL,
    user_id     INT NOT NULL,
    status      ENUM('active', 'won', 'lost') NOT NULL DEFAULT 'active',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_draw
        FOREIGN KEY (draw_id) REFERENCES draws(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_tickets_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;
