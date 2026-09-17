# Engineering Reasoning

## 1. Problem Understanding
Pharmacy inventory is batch-oriented: the same medicine can exist in several batches with different expiry dates. The critical rule is therefore FEFO rather than simple FIFO.

## 2. Requirements Analysis
The implementation prioritizes persistence, real REST APIs, authentication, search, pagination, sorting, expiry visibility and backend-enforced dispensing.

## 3. Why MERN
React provides a focused interactive UI, Express exposes REST endpoints, Node.js keeps the API lightweight, and MongoDB/Mongoose map naturally to medicine, batch and audit records.

## 4. Database Design
Medicines store stable catalogue information. Batches are separate because quantity and expiry vary by batch. Dispensing records preserve the allocation audit trail.

## 5. Why Batches Are Separate
A single medicine can have multiple expiry dates. Combining those values into one medicine document would make FEFO and inventory auditing harder.

## 6. FEFO Algorithm
The service filters to positive, non-expired batches and sorts by expiry ascending. It consumes each batch until the requested quantity is satisfied.

## 7. Backend Enforcement
FEFO is a business rule, so it is enforced by the API rather than trusting the browser. This prevents a modified client from selecting an expired or later-expiring batch.

## 8. Sellable Stock
Sellable stock is the sum of quantities whose expiry date is later than the current time. Expired quantity is reported separately.

## 9. Expiry Handling
Batches are classified into expired, critical (7 days), warning (30 days), upcoming (90 days) and safe states.

## 10. Transaction Safety
Dispensing uses a MongoDB transaction and conditional quantity updates. The allocation is checked before changes are committed, so insufficient inventory does not create a partial sale.

## 11. Search Design
The medicine endpoint uses case-insensitive matching over medicine metadata and supports query parameters for server-side filtering.

## 12. Pagination Design
Pagination is performed with database `skip`/`limit`, returning total item and page counts to the frontend.

## 13. Sorting Design
Sort fields are allow-listed to avoid arbitrary query fields. Batch expiry is the default order because it matches FEFO visibility.

## 14. Authentication
Passwords are bcrypt-hashed and JWTs identify authenticated users. Password fields are removed from JSON output.

## 15. API Design
Responses use `{success, message, data}` for consistency and management routes require a bearer token.

## 16. Frontend Architecture
Pages are separated from reusable navigation, form, table, search, pagination, alert and state components. Axios centralizes the API base URL and JWT header.

## 17. Error Handling
Express has centralized not-found and error middleware. Client pages render API errors, loading states and empty states instead of blank content.

## 18. Testing Strategy
Pure FEFO and stock rules are covered with Node's built-in test runner. Authentication hashing is also checked. Integration tests should run against a dedicated MongoDB test database in a CI environment.

## 19. Edge Cases
The API validates positive quantities, date ordering, missing resources, duplicate batch numbers, authentication, invalid pagination and insufficient sellable stock.

## 20. Bugs Found During Development
During the project completion pass, the original uploaded archive was found to contain only the root scaffold. The application was rebuilt around the required client/server structure. No additional runtime bug is claimed here without a reproducible test result.

## 21. Fixes Applied
Added the React/Vite application, Express/Mongoose backend, database models, FEFO service, authentication, seed data, API documentation, UI states and automated unit tests. The root scripts now install, run, test and build the two applications.

## 22. Future Improvements
The next three product features intentionally remain Supplier Management, Automated Notifications, and Sales & Inventory Analytics.
