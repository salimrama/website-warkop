# PRD: Table Session Completion & Customer Device Reset

## 1. Problem Statement
Currently, when a customer finishes their order and leaves, the cashier marks the table as "available". However, the customer's device still retains the locked table in `localStorage`. If they reopen the website, they are still attached to the same table. We need a way to completely terminate the table session, resetting the customer's device and making the table truly available for the next person.

## 2. Feature Requirements

### A. Cashier Dashboard (`/cashier` or `/manager`)
- Add a new action button for occupied/active tables: **"Selesai & Bersihkan Meja"** (Complete & Clean Table).
- Clicking this button should:
  1. Update the table status in the database to "available/empty".
  2. Trigger a backend event to forcefully reset any connected customer devices currently holding that table.

### B. Backend API & Socket.io
- Create a new endpoint or socket event (e.g., `POST /api/tables/:id/complete`).
- When triggered:
  - Update the table status to 'available' in the database.
  - Emit a Socket.io broadcast event named `table_session_ended` with the payload `{ tableId }`.

### C. Customer Frontend (`/`)
1. **Real-time Reset (Active Connection):**
   - Add a Socket.io listener for `table_session_ended`.
   - If the received `tableId` matches the `selected_table` ID in `localStorage`:
     - Clear `selected_table`, `is_table_locked`, and shopping cart from `localStorage`.
     - Show an alert/toast: "Sesi meja telah diakhiri. Terima kasih atas kunjungan Anda."
     - Re-open the Table Selection screen.

2. **Stale Session Validation (On Page Load / Refresh):**
   - **Crucial Fix:** If the customer closed their browser and the socket was disconnected when the cashier cleared the table, the `localStorage` won't be cleared in real-time. 
   - Add a validation check in `useEffect` when the app loads:
     - If `localStorage` has a `selected_table`, send a request to the backend (e.g., `GET /api/tables/:id/status`) to verify if the table is currently "occupied".
     - If the backend responds that the table is actually "available", it means the customer has an expired/stale session.
     - Automatically clear the `localStorage` and force the Table Selection screen to appear.

## 3. Execution Instructions for AI
1. Implement the "Selesai & Bersihkan Meja" UI and logic in the cashier components.
2. Write the backend logic to handle the table completion and Socket.io `table_session_ended` emit.
3. Update the customer frontend to handle BOTH the real-time Socket listener and the on-mount table status validation.
4. Ensure no customer can bypass the table selection if their saved table is already marked "available" in the database.