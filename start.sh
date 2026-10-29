#!/usr/bin/env bash

# Skrip untuk menjalankan Database, Backend, dan Frontend secara bersamaan
echo "☕ Menyalakan Aplikasi Warkop Lengkap..."

# 1. Pastikan Database siap
./ensure-db.sh

# Trap CTRL+C untuk mematikan proses node ketika dihentikan
trap 'kill 0' EXIT

# 2. Jalankan Backend
echo "🚀 Memulai Backend di port 5000..."
(cd backend && npm run dev) &

# 3. Jalankan Frontend
echo "💻 Memulai Frontend di port 5173..."
(cd frontend && npm run dev) &

# Tunggu proses
wait
