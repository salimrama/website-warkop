# PRD UPDATE: Statistics Filters, Chart/List Toggle, and Copy Data

## 1. Objective
Refine the "Statistik & Laporan" module on the Manager Dashboard. This update will simplify the time filters, introduce a toggle between Chart and List views, and add a quick "Copy Data" functionality for reporting purposes.

## 2. Updated Feature Requirements

### A. Revised Filter Logic (Penyederhanaan Filter)
- **Remove "Day of the Week":** Completely remove any filter related to "Hari dalam minggu" (Senin, Selasa, dll).
- **Filter 1 (Periode Spesifik):** Provide dropdowns or pickers to filter data specifically by:
  - **Tahun (Year):** (e.g., 2026)
  - **Bulan (Month):** (e.g., Oktober 2026)
  - **Hari/Tanggal (Specific Day):** (e.g., 30 Oktober 2026)
- **Filter 2 (Rentang Waktu / Date Range):** 
  - Keep the "Dari Tanggal" (Start Date) and "Sampai Tanggal" (End Date) selectors. This is sufficient for custom ranges.

### B. View Mode Toggle (Grafik vs List Catatan)
- Add a UI toggle switch or button group: **"Tampilan Grafik"** vs **"List Catatan"**.
- **Tampilan Grafik (Chart View):** Visual representation of the data (Peak hours, popular items, revenue trends) using charts.
- **List Catatan (Data Table View):** Display the exact same analytical data in clean, structured HTML Tables or lists for easy reading.

### C. "Copy Data" Functionality
- When the user selects the **"List Catatan"** view, add a **"Salin Data" (Copy Data)** button above or below the data tables.
- **Logic:** When clicked, use the `navigator.clipboard.writeText` API to copy the currently displayed statistics data.
- **Formatting:** Format the copied string cleanly (e.g., Tab-separated values or neat text format) so the manager can instantly paste it into Excel, Google Sheets, or WhatsApp.
- Provide a success toast/alert feedback: "Data berhasil disalin!" after copying.

## 3. Execution Instructions for AI
1. **Update UI Filters:** Remove weekday filters and implement the Year, Month, Specific Date, and Date Range inputs.
2. **Update Backend Logic:** Adjust the `/api/statistics` controllers to parse and filter the database queries based on the new `year`, `month`, `date`, `startDate`, and `endDate` parameters.
3. **Build View Toggle:** Create a React state (e.g., `viewMode: 'chart' | 'list'`) to conditionally render either the graphs or the data tables.
4. **Implement Clipboard API:** Write the JavaScript handler for the "Salin Data" button to dynamically extract the loaded statistics and copy them to the user's clipboard in a spreadsheet-friendly format.