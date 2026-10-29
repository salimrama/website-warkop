# PRD: Locked Table Selection & Cashier Authorization Flow

## 1. Objective
Enhance the customer ordering flow so that once a table is selected on the customer's mobile device, the table selection interface disappears completely and cannot be changed manually by the customer. Table modification can ONLY be unlocked remotely by the cashier from the Manager/Cashier Dashboard.

## 2. Detailed Technical Requirements

### A. Customer Frontend (`/`)
1. **Permanent Table Lock:**
   - Once a customer selects a table (e.g., "Meja 05"), save the table data and a lock flag in `localStorage` (`selected_table` and `is_table_locked: true`).
   - Hide the Table Selection Modal completely once selected.
   - Remove/disable any client-side "Ganti Meja" or "Change Table" button from the customer UI.
   - Display a static, non-clickable header badge indicating the locked table (e.g., `🔒 Meja 05`).

2. **Real-time Unlock Listener (Socket.io):**
   - Subscribe the customer client to socket events (e.g., `table_unlocked`).
   - If the cashier triggers an unlock for this specific table ID:
     - Clear `selected_table` and `is_table_locked` from `localStorage`.
     - Show a notification modal: "Kasir telah membuka kunci meja. Silakan pilih meja kembali."
     - Automatically re-open the Table Selection Modal.

### B. Cashier Dashboard (`/cashier` or `/manager`)
1. **Table Management UI:**
   - On the Cashier/Manager view, display active/occupied tables with a **"Buka Kunci / Reset Meja"** button for each table.
2. **Backend API & Socket Trigger:**
   - Create a backend endpoint `POST /api/tables/:id/unlock` (or equivalent socket event `cashier_unlock_table`).
   - When clicked by the cashier:
     - Update table status in the database if necessary.
     - Emit a Socket.io event `table_unlocked` containing the `{ tableId }` to all connected clients.

## 3. Execution Instructions for AI
1. Update customer view components (e.g., `CustomerView.jsx` or equivalent) to strictly enforce the lock state and remove manual table-switching UI elements.
2. Add Socket.io listener in the customer frontend for the `table_unlocked` event.
3. Update the Cashier Dashboard to add the "Buka Kunci Meja" action button.
4. Add the corresponding Express route / Socket handler in the backend to broadcast table unlocks.