# PRD: Local Area Network (Wi-Fi) Accessibility Configuration

## 1. Project Context & Current State
We have successfully built a full-stack Point of Sale (POS) and ordering application for a Coffee Shop. 
- **Backend:** Node.js, Express, `mysql2`, `socket.io` (Running on port 5000).
- **Frontend:** React, Vite, Tailwind CSS, `socket.io-client` (Running on port 5173).
- **Database:** MySQL 8.0 running via Docker.
- **OS Environment:** CachyOS (Arch Linux).
- **Current Issue:** The application is currently hardcoded to `localhost`. It works perfectly on the host machine, but other devices (like customer smartphones or cashier tablets) connected to the same Wi-Fi network cannot communicate with the backend or access the frontend properly.

## 2. Objective
Configure the frontend, backend, and environment setup so that the application is fully accessible to any device connected to the same Local Area Network (Wi-Fi) without hardcoding a static IP address, as DHCP might change the host's IP address in the future.

## 3. Technical Requirements

### A. Frontend (Vite & API/Socket Configuration)
1. **Vite Host Exposure:** Update `package.json` so the `dev` script runs Vite with the `--host` flag to expose it to the network.
2. **Dynamic API & Socket URLs:** Do NOT hardcode `192.168.x.x` in the frontend code. Instead, update the frontend configuration (e.g., `src/utils/config.js` or `.env` + logic) to dynamically resolve the backend URL using `window.location.hostname`. 
   - *Example logic:* `const API_URL = "http://" + window.location.hostname + ":5000";`
   - This ensures that if a customer opens `http://192.168.1.15:5173`, the React app automatically knows the backend is at `http://192.168.1.15:5000`.

### B. Backend (Express Server & CORS)
1. **Network Binding:** Ensure the Express server listens on `0.0.0.0` (all network interfaces) instead of strictly `127.0.0.1` or `localhost`.
2. **CORS & Socket.io Configuration:** Ensure the CORS policy for both Express and Socket.io allows connections from any origin (`*`) or dynamically allows the local network IP, avoiding CORS blockage when accessed from mobile devices.

### C. OS / Firewall Instructions (CachyOS / Arch Linux)
1. Provide the necessary bash commands to identify the host machine's current local IP address.
2. Provide the necessary bash commands to open ports `5000` and `5173` through the firewall in Arch Linux (e.g., using `ufw`, as it is common, or `firewalld`).

## 4. Execution Instructions for the AI
Please execute this PRD step-by-step:
- **Step 1:** Give me the updated code for the Frontend dynamic URL configuration and the `package.json` update.
- **Step 2:** Give me the updated code for the Backend (`server.js` or configuration files) to handle network binding and CORS.
- **Step 3:** Provide the terminal commands ONE BY ONE in separate bash blocks to check the IP address and configure the firewall on my CachyOS machine.