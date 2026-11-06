# TASK: Refactor Project Architecture using SOLID Principles

## 1. Objective
Refactor the existing Warkop POS application (both Express.js backend and React frontend) to strictly adhere to SOLID principles. The goal is to separate concerns, make the codebase highly modular, easier to read, maintain, and extend for future learning.

## 2. Core Architectural Changes (Backend - Express.js)
Currently, the backend likely mixes routing, business logic, and database queries within the same files (Controllers/Routes). We need to implement a **Layered Architecture**.

### A. Single Responsibility Principle (SRP)
Separate the backend into distinct layers, where each file has only ONE reason to change:
1. **Routes (`/routes`):** Only responsible for defining HTTP endpoints and mapping them to controllers.
2. **Controllers (`/controllers`):** Only responsible for handling HTTP requests, parsing parameters/body, and returning HTTP responses. **NO SQL QUERIES HERE.**
3. **Services (`/services`):** Contains the core business logic (e.g., calculating totals, validating table availability).
4. **Repositories (`/repositories`):** Only responsible for direct database interactions (SQL queries).

### B. Dependency Inversion Principle (DIP)
- High-level modules (Services) should not depend on low-level modules (Database directly).
- Refactor the code to use **Dependency Injection**. Inject the database connection into the Repositories, and inject Repositories into the Services.
- *Action:* Avoid hardcoding `import db from '../db.js'` inside every controller. Pass it down structurally.

### C. Open/Closed Principle (OCP)
- Standardize the API Response format. Create a utility class or function (e.g., `ApiResponse.success()`, `ApiResponse.error()`).
- This allows us to extend response formatting in the future without modifying every single controller.

### D. Liskov Substitution Principle (LSP)
- Ensure consistent return types from all Repositories. If a repository fetches a single record, it should consistently return an object or `null` (not sometimes `false` or throwing an unhandled error).

## 3. Core Architectural Changes (Frontend - React)

### A. Single Responsibility Principle (SRP)
- **UI vs Logic:** React components should only be responsible for rendering UI. 
- *Action:* Extract complex state management, Socket.io event listeners, and API fetch calls into **Custom Hooks** (e.g., `useOrders.js`, `useTables.js`, `useSocket.js`). 

### B. Interface Segregation Principle (ISP)
- Components should not be forced to depend on massive data objects if they only need a few fields.
- *Action:* Refactor component props. Instead of passing an entire `order` object to a small `<OrderItem />` component, pass only the required scalar props (e.g., `name`, `quantity`, `price`).

## 4. Execution Instructions for AI (Step-by-Step)
**CRITICAL: Do this incrementally to prevent breaking the app.**

1. **Step 1: Backend Repositories & Services (SRP & DIP)**
   - Create `backend/src/repositories` and move all SQL queries from controllers into repository classes/functions.
   - Create `backend/src/services` and move business logic (like table locking validation) here.
2. **Step 2: Backend Controllers & Routes**
   - Update controllers to only call Services and return standardized responses (OCP).
3. **Step 3: Frontend Custom Hooks (SRP)**
   - Extract data fetching (`useEffect` with `fetch`/`axios`) from pages (like `CustomerView` or `ManagerDashboard`) into custom hooks inside `src/hooks/`.
4. **Step 4: Frontend Prop Refactoring (ISP)**
   - Review all React components. Ensure props are destructured and minimal.
5. **Step 5: Test & Validate**
   - Ensure the app still compiles, runs, and Socket.io events (table lock, order complete) still work perfectly after the refactor.

Please read the current folder structure first, then begin with **Step 1**.