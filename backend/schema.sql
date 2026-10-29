-- ============================================================
-- WARKOP APP - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS warkop_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE warkop_db;

-- ------------------------------------------------------------
-- Tabel: users
-- Role: 'cashier' | 'manager'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          INT          UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('cashier', 'manager') NOT NULL DEFAULT 'cashier',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Tabel: tables (Meja Pelanggan, nomor 1-20)
-- Status: 'available' | 'occupied'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tables` (
  id          INT         UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  table_number INT        NOT NULL UNIQUE,
  status      ENUM('available', 'occupied') NOT NULL DEFAULT 'available',
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed 20 meja
INSERT INTO `tables` (table_number) VALUES
  (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
  (11),(12),(13),(14),(15),(16),(17),(18),(19),(20);

-- ------------------------------------------------------------
-- Tabel: menus
-- Category: 'food' | 'drink' | 'snack'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menus (
  id          INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  category    ENUM('food', 'drink', 'snack') NOT NULL DEFAULT 'drink',
  image_url   VARCHAR(255),
  is_available TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed Data Menu Dummy (Minuman, Makanan, Camilan)
INSERT INTO menus (name, description, price, category, image_url) VALUES
  ('Kopi Hitam Tubruk', 'Kopi robusta khas nusantara, diseduh tubruk kental beraroma kuat.', 6000.00, 'drink', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80'),
  ('Kopi Susu Gula Aren', 'Paduan espresso robusta, susu kental manis gurih, dan gula aren asli.', 12000.00, 'drink', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80'),
  ('Kopi Tarik Aceh', 'Kopi pekat khas Aceh ditarik berbusa lembut, rasa manis legit.', 10000.00, 'drink', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80'),
  ('Es Teh Manis Jumbo', 'Teh melati wangi khas warkop, disajikan dingin segar porsi besar.', 5000.00, 'drink', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80'),
  ('Nutrisari Dingin', 'Minuman sari buah jeruk manis asam segar pelepas dahaga.', 5000.00, 'drink', 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80'),
  ('Soda Gembira', 'Sirup merah cocopandan, susu kental manis, dan soda segar berbusa.', 14000.00, 'drink', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80'),
  ('Wedang Jahe Hangat', 'Seduhan jahe emprit bakar geprek asli, gula kelapa, dan serai.', 8000.00, 'drink', 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&auto=format&fit=crop&q=80'),
  ('Indomie Goreng Internet (Telur Kornet)', 'Indomie goreng dengan topping kornet sapi gurih dan telur setengah matang.', 15000.00, 'food', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80'),
  ('Indomie Kuah Kari Ayam Spesial', 'Indomie kuah rasa kari ayam pekat dengan telur rebus, sawi, dan cabai rawit.', 13000.00, 'food', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80'),
  ('Nasi Goreng Gila Warkop', 'Nasi goreng harum rempah bertabur tumisan sosis, bakso, ayam suwir, dan sayuran.', 18000.00, 'food', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format&fit=crop&q=80'),
  ('Magelangan Warkop (Nasi + Mie)', 'Kombinasi nasi dan mie goreng racikan warkop, porsi mantap mengenyangkan.', 17000.00, 'food', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&auto=format&fit=crop&q=80'),
  ('Nasi Ayam Geprek Sambal Korek', 'Ayam crispy digeprek dengan cabai rawit pedas nampol, disajikan dengan nasi hangat.', 20000.00, 'food', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80'),
  ('Roti Bakar Coklat Keju', 'Roti tawar tebal renyah isi meses coklat melimpah dan taburan keju parut.', 13000.00, 'snack', 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=400&auto=format&fit=crop&q=80'),
  ('Pisang Goreng Keju Aren', 'Pisang kepok manis digoreng krispi dengan keju parut dan gula aren cair.', 12000.00, 'snack', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop&q=80'),
  ('Cireng Crispy Bumbu Rujak', 'Cireng kenyal renyah di luar, disajikan dengan cocolan saus bumbu rujak.', 10000.00, 'snack', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80'),
  ('Kentang Goreng French Fries', 'Kentang goreng renyah bumbu gurih asin, disajikan lengkap dengan saus sambal.', 12000.00, 'snack', 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80');

-- ------------------------------------------------------------
-- Tabel: orders
-- Source: 'customer' (dari web pelanggan) | 'cashier' (input manual kasir)
-- Status: 'pending' | 'processing' | 'completed' | 'cancelled'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  table_id      INT           UNSIGNED NOT NULL,
  cashier_id    INT           UNSIGNED,               -- NULL jika dari pelanggan langsung
  source        ENUM('customer', 'cashier') NOT NULL DEFAULT 'customer',
  status        ENUM('pending', 'processing', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  total_price   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes         TEXT,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_orders_table
    FOREIGN KEY (table_id)   REFERENCES `tables`(id) ON UPDATE CASCADE,
  CONSTRAINT fk_orders_cashier
    FOREIGN KEY (cashier_id) REFERENCES users(id)    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Tabel: order_items
-- Detail item per pesanan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id          INT           UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    INT           UNSIGNED NOT NULL,
  menu_id     INT           UNSIGNED NOT NULL,
  quantity    INT           UNSIGNED NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2) NOT NULL,  -- Harga saat order (snapshot)
  subtotal    DECIMAL(10,2) NOT NULL,  -- quantity * unit_price
  notes       VARCHAR(255),            -- Catatan khusus per item (contoh: "tanpa es")
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_menu
    FOREIGN KEY (menu_id)  REFERENCES menus(id)  ON UPDATE CASCADE
);

