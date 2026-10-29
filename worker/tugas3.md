# PRD: Customer Table Selection & Persistent Ordering Flow

## 1. Feature Overview
Implement a mandatory table selection step when a customer first opens the ordering web (`/`). The selected table must be persisted in local storage so the customer can view the menu, complete orders, and continue placing additional orders seamlessly.

## 2. User Flow Requirements
1. **Initial Access (Table Selection Screen/Modal):**
   - Upon opening `/`, check if `selected_table` exists in `localStorage`.
   - If NO table is selected, show a Table Selection modal/screen blocking the menu view.
   - Fetch active tables from backend (`GET /api/tables`).
   - When a table is selected, save it (`localStorage.setItem('selected_table', JSON.stringify(table))` and unlock the menu.

2. **Menu Display (Makanan, Minuman, Camilan):**
   - Show the selected table at the header (e.g., "Meja 05") with a "Ganti Meja" option to reset `localStorage`.
   - Allow filtering by categories (Makanan, Minuman, Camilan).
   - Allow adding items to the cart and submitting orders.

3. **Post-Checkout Flow (Continuous Ordering):**
   - After a successful checkout (order submitted to backend and Socket.io event emitted):
     - Clear only the shopping cart items.
     - Show a success notification modal: "Pesanan Berhasil Dikirim!".
     - Keep `selected_table` saved in `localStorage`.
     - Redirect or leave the customer on the menu page so they can order again anytime.

## 3. Execution Instructions for AI
- Modify the React customer page/component (e.g., `CustomerView.jsx` or `App.jsx`).
- Implement state persistence using `localStorage`.
- Ensure checkout reset logic clears cart state without resetting table state.