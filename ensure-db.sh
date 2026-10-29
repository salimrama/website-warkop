#!/usr/bin/env bash

# Fungsi untuk memeriksa dan menyalakan database
check_and_start_db() {
  echo "🔍 Memeriksa status database MySQL (port 3306)..."

  # Cek apakah port 3306 sudah aktif (bisa pakai nc / bash TCP test)
  if (echo > /dev/tcp/127.0.0.1/3306) >/dev/null 2>&1; then
    echo "✅ Database sudah aktif di port 3306."
    return 0
  fi

  echo "⚠️ Database belum menyala. Mencoba menyalakan database..."

  # 1. Coba nyalakan lewat docker compose / docker
  if command -v docker &> /dev/null; then
    # Cek apakah container warkop-mysql ada
    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^warkop-mysql$"; then
      echo "🐳 Menyalakan container warkop-mysql..."
      docker start warkop-mysql >/dev/null 2>&1
    elif [ -f "docker-compose.yml" ]; then
      echo "🐳 Menjalankan docker compose up -d mysql..."
      docker compose up -d mysql >/dev/null 2>&1 || docker-compose up -d mysql >/dev/null 2>&1
    fi
  fi

  # 2. Coba nyalakan lewat systemctl (mariadb / mysqld) jika docker belum jalan
  if ! (echo > /dev/tcp/127.0.0.1/3306) >/dev/null 2>&1; then
    if command -v systemctl &> /dev/null; then
      sudo systemctl start mariadb 2>/dev/null || sudo systemctl start mysqld 2>/dev/null || true
    fi
  fi

  # Tunggu database siap (maksimal 15 detik)
  for i in {1..15}; do
    if (echo > /dev/tcp/127.0.0.1/3306) >/dev/null 2>&1; then
      echo "✅ Database berhasil tersambung!"
      return 0
    fi
    sleep 1
  done

  echo "⚠️ Menjalankan backend & frontend (pastikan MySQL sudah siap)..."
}

check_and_start_db

