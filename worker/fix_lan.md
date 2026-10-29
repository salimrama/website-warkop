# PRD & Troubleshooting: Fix Mobile LAN Connection Timeout

## 1. Issue Description
When accessing `http://192.168.100.12:5173` from a mobile browser on the same Wi-Fi network, the connection times out ("Situs ini tidak dapat dijangkau / ERR_CONNECTION_TIMED_OUT").

This indicates incoming TCP packets on ports 5173 (Frontend) and 5000 (Backend) are blocked by the OS firewall (nftables/iptables/ufw/firewalld) on CachyOS, or the applications are not strictly listening on `0.0.0.0`.

## 2. Objective
Diagnose the exact network blocker on CachyOS (Arch Linux), enforce `0.0.0.0` binding on Vite and Express, open incoming ports on the active firewall, and verify device reachability.

## 3. Execution Requirements for AI

### Step 1: Enforce Host Binding in Code
1. Inspect `frontend/vite.config.js`. Ensure `server` is configured to listen on `0.0.0.0`:
   ```javascript
   server: {
     host: '0.0.0.0',
     port: 5173
   }