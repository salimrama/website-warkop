# PRD: User Password Management (Change Password Feature)

## 1. Objective
Allow all authenticated users (both 'Cashier'/Karyawan and 'Manager') to securely change their own passwords from within their respective dashboards.

## 2. Feature Requirements

### A. Frontend UI (Cashier & Manager Dashboards)
- **Menu/Button Access:** Add a "Ganti Password" (Change Password) button in the header, sidebar, or a dedicated profile dropdown for both the Cashier and Manager views.
- **Change Password Modal/Form:** 
  - When clicked, open a modal with three input fields:
    1. `Password Lama` (Current Password)
    2. `Password Baru` (New Password)
    3. `Konfirmasi Password Baru` (Confirm New Password)
  - **Client-side Validation:** Ensure "Password Baru" and "Konfirmasi Password Baru" match exactly before allowing submission.
  - Show loading states and toast/alert notifications for success ("Password berhasil diubah") or error ("Password lama salah", dll).

### B. Backend API (`/api/users` or `/api/auth`)
- **New Endpoint:** Create a `PUT` endpoint (e.g., `PUT /api/users/change-password`).
- **Authentication:** Ensure this route is protected by the existing authentication middleware (the user must be logged in, and the user ID should be extracted from the token/session).
- **Security Logic:**
  1. Receive `oldPassword` and `newPassword` from the request body.
  2. Fetch the user from the database using the ID from the auth token.
  3. Compare `oldPassword` with the stored hashed password using `bcrypt.compare`. If it doesn't match, return a `400 Bad Request` or `401 Unauthorized` with an appropriate error message.
  4. If valid, hash the `newPassword` using `bcrypt.hash`.
  5. Update the user's password column in the database with the new hash.
  6. Return a `200 OK` success response.

## 3. Execution Instructions for AI
1. **Backend First:** Implement the `change-password` endpoint in the Express router and controller. Verify that `bcrypt` is imported and used correctly for comparison and hashing.
2. **Frontend Second:** Create the UI component for changing the password. Integrate this component into the layout of BOTH the Manager Dashboard and Cashier Dashboard.
3. **Integration:** Connect the frontend form to the new backend endpoint using `fetch` or `axios`, and handle the UI feedback (success/error states) properly.