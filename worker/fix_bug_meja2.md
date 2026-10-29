# BUG FIX: Incorrect Customer Table Reset on Order Completion

## 1. Problem Description
Currently, there is a logical bug in the application. When the cashier clicks "Selesai" (Complete Order) to mark a customer's food as delivered, the customer's UI on their mobile device incorrectly resets and forces them to select a table again. 

**Expected Behavior:** The customer must remain locked to their selected table even after an order is completed, so they can place additional orders later. The customer's table session and `localStorage` should ONLY be cleared when the cashier explicitly clicks the "Selesai & Bersihkan Meja" (Clear Table Session) button.

## 2. Logical Separation Required
We need to strictly separate the **Order Lifecycle** from the **Table Lifecycle**.

### A. Action 1: "Selesai" (Complete Order / Deliver Food)
- **Cashier UI:** Clicks "Selesai" on a specific order.
- **Backend:** Updates the *order status* to completed in the database. Emits a socket event like `order_completed`.
- **Customer UI:** Receives notification (e.g., "Pesanan telah diantar"). **CRITICAL:** DO NOT clear `selected_table` or `is_table_locked` from `localStorage`. The customer must stay on the menu page, locked to their current table.

### B. Action 2: "Selesai & Bersihkan Meja" (Clear Table Session)
- **Cashier UI:** Clicks "Selesai & Bersihkan Meja" indicating the customer has paid and left.
- **Backend:** Updates the *table status* to 'available'. Emits the `table_session_ended` socket event.
- **Customer UI:** Listens to `table_session_ended`. ONLY THEN does the app clear `selected_table` and `is_table_locked` from `localStorage`, and forces the UI back to the Table Selection screen.

## 3. Execution Instructions for AI
1. **Audit the Backend Routes & Socket Events:** Check the endpoint handling "Order Completion". Make sure it does NOT accidentally call the table reset logic or emit the `table_session_ended` event.
2. **Audit Customer Frontend:** Check the socket listeners in the customer view. Ensure that a completed order does not trigger `localStorage.removeItem('selected_table')`.
3. **Fix the Flow:** Ensure the frontend and backend clearly distinguish between finishing a single order (Action A) and completely terminating the table's session (Action B).