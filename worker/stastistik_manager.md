# PRD: Manager Statistics & Analytics Dashboard

## 1. Objective
Develop a comprehensive "Statistik & Laporan" (Statistics & Reports) module for the Manager Dashboard. This feature will allow the manager to track daily revenue, transaction volume, best-selling items across categories, and identify peak operational hours based on specific dates or days of the week.

## 2. Feature Requirements

### A. Frontend UI (Manager Dashboard: "Statistik")
- **Date & Day Filters:** 
  - Add controls to filter data by a specific date, a date range (Start Date - End Date), or by Day of the Week (Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu).
- **Key Metric Cards:**
  - Display "Total Pendapatan" (Total Revenue in Rp).
  - Display "Total Transaksi" (Number of completed orders).
- **Popular Items (Top Selling):**
  - Display lists or simple bar charts of the most popular items, categorized by:
    - Top Makanan (Food)
    - Top Minuman (Drinks)
    - Top Cemilan (Snacks)
- **Peak Hours Analysis (Jam Sibuk):**
  - Display a graph/chart (e.g., Line Chart or Bar Chart) showing transaction volume by hour (e.g., from 06:00 to 23:00). 
  - This allows the manager to select a day (e.g., "Sabtu") and visually see at which hours the Warkop gets the most orders.
  - *Recommendation:* Use a lightweight charting library like `recharts` or `chart.js` if necessary, or build a simple CSS-based bar visualization.

### B. Backend API (`/api/statistics`)
Create new REST endpoints to serve the aggregated data. Ensure these are protected by Manager authorization.

1. **`GET /api/statistics/summary`**
   - Query params: `startDate`, `endDate`, `dayOfWeek`.
   - Logic: Sum the `total_price` of all completed orders and count the number of orders within the given time frame.
2. **`GET /api/statistics/popular-items`**
   - Query params: `startDate`, `endDate`, `dayOfWeek`.
   - Logic: Join `orders`, `order_items`, and `menu` tables. Group by menu item ID and Category. `SUM()` the quantity sold. Order by quantity DESC. Return top items per category.
3. **`GET /api/statistics/peak-hours`**
   - Query params: `startDate`, `endDate`, `dayOfWeek`.
   - Logic: Extract the HOUR from the order's `created_at` timestamp. Group by this HOUR and `COUNT()` the number of orders. Return an array of hours and their transaction counts.

### C. Database Query Logic (SQLite / MySQL)
- Use standard SQL aggregation functions (`SUM`, `COUNT`, `GROUP BY`).
- Use Date and Time extraction functions appropriate for the active database (e.g., `strftime('%H', created_at)` for SQLite or `HOUR(created_at)` for MySQL) to group data for the peak hours analysis.
- Ensure only orders with a status of 'completed' (selesai) are calculated in the statistics.

## 3. Execution Instructions for AI
1. **Backend & Database Queries First:** Implement the complex SQL grouping and aggregation logic in the backend controllers. Test the endpoints to ensure they return correctly structured JSON data based on date/day filters.
2. **Frontend Dependencies:** If a charting library is needed for the Peak Hours graph, install a lightweight one like `recharts` (`npm install recharts`).
3. **Frontend Implementation:** Build the Statistics page layout in the Manager Dashboard. Implement the date/day pickers and connect them to the API endpoints to dynamically update the metric cards, popular items lists, and peak hours chart.