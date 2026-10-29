# PRD: Login Cleanup & Manager Employee Management

## 1. Objective
Prepare the application for production by removing the hardcoded "Akun Percobaan" (Test Account) from the login screen, and add a "Pecat Karyawan" (Fire/Delete Employee) feature exclusively for the Manager role.

## 2. Feature Requirements

### A. Login Screen Cleanup (Remove Test Account)
- **Frontend Action:** Locate the Login component (e.g., `Login.jsx` or similar).
- Find and completely remove any buttons, auto-fill text, or UI elements related to "Akun Percobaan", "Login as Guest", or "Test Account".
- Ensure that from now on, all cashiers and managers must manually type their valid username and password to enter the system.

### B. Manager Dashboard: "Pecat Karyawan" (Fire Employee)
- **Frontend Action (Manager View):** 
  - Locate the Employee Management (Manajemen Karyawan/User) section within the Manager Dashboard.
  - Add a **"Pecat" (Delete/Fire)** button next to each employee's name in the list.
  - When the manager clicks "Pecat", show a confirmation modal/dialog first: *"Apakah Anda yakin ingin memecat karyawan ini? Tindakan ini tidak dapat dibatalkan."*
  - If confirmed, send a request to the backend to delete/deactivate the employee account and immediately update the UI list to reflect the removal.
- **Backend Action:**
  - Create or update the DELETE endpoint (e.g., `DELETE /api/users/:id` or `DELETE /api/employees/:id`).
  - Ensure this endpoint has authorization checks so ONLY a user with the 'Manager' role can execute this action.
  - Delete the specified user from the database.

## 3. Execution Instructions for AI
1. Search for the Login component and clean up the UI by removing the test account credentials.
2. Search for the Manager Dashboard components to add the "Pecat" button and confirmation modal.
3. Check the backend routes to ensure the delete employee endpoint exists, works correctly with the database, and is protected by Manager authorization.
4. Test the flow by analyzing the code to ensure a cashier cannot see or use the "Pecat" button.