# REASONING

This document records the engineering decisions, implementation rationale, testing approach and development fixes for PharmaFlow. It describes the reasoning at an engineering level; it does not reproduce private model chain-of-thought.

## 1. Understanding the Problem

A neighborhood pharmacy can hold several batches of the same medicine. Each batch can have a different expiry date and quantity.

The important inventory rule is therefore not ordinary FIFO. The application needs **FEFO — First-Expiry-First-Out** — so the valid batch with the earliest expiry is dispensed first.

The system also needs to prevent expired stock from being sold, provide search and expiry visibility, and keep an auditable record of dispensing.

## 2. Requirements Translated into Features

The requirements were mapped to:

- Persistent MongoDB storage.
- REST APIs for core operations.
- React UI consuming those APIs.
- User registration and login.
- Medicine and batch management.
- Search.
- Pagination.
- Sorting.
- Sellable-stock calculation.
- Expiry alerts.
- FEFO dispensing.
- Dispensing history.
- A one-page product landing page.
- Root README, reasoning documentation and AI logs.

## 3. Why MERN

The project uses MongoDB, Express, React and Node.js.

This keeps the application in one primary programming ecosystem while separating the frontend UI from the backend business rules.

React handles the interactive pharmacist interface.

Express and Node.js expose REST APIs and enforce business rules.

MongoDB stores the catalogue, batches, users and dispensing records.

Mongoose provides schemas, validation and database access.

## 4. Database Design

The main entities are:

### User

Stores:

- Name
- Email
- Password hash
- Role
- Timestamps

### Medicine

Stores catalogue information such as:

- Name
- Generic name
- Manufacturer
- Category
- Description

### Batch

Stores stock-specific information:

- Medicine reference
- Batch number
- Quantity
- Received date
- Expiry date

A separate Batch entity is important because the same medicine may have many batches and each batch can expire at a different time.

### Dispensing

Stores:

- Medicine
- Pharmacist/user
- Requested quantity
- Exact batch allocations
- Creation timestamp

This provides an audit trail of which batches were actually consumed.

## 5. FEFO Design

FEFO is implemented in the backend service instead of trusting the browser.

The algorithm:

1. Select batches for the requested medicine.
2. Require positive quantity.
3. Require expiry later than the current time.
4. Sort by expiry date ascending.
5. Calculate allocations until the requested quantity is satisfied.
6. Reject the request if there is not enough valid stock.
7. Decrement the allocated batches.
8. Create a dispensing record containing the exact allocations.

This prevents an expired batch from being selected simply because it contains available quantity.

## 6. Why FEFO Is Backend-Enforced

The frontend is a user interface and cannot be treated as a trusted source for inventory rules.

If FEFO existed only in React, a modified request could potentially try to select another batch.

The API therefore calculates the allocation itself. The frontend only sends the medicine and requested quantity.

## 7. Atomic Dispensing

A dispensing operation can affect several batch documents and create one dispensing record.

The implementation uses MongoDB transaction behavior so the operation can be treated as one logical unit.

If sufficient sellable stock is not available, the transaction should not leave a partial deduction behind.

This is important for inventory consistency.

## 8. Sellable Stock

Sellable stock is not simply the sum of all batch quantities.

A batch is sellable only when:

```text
quantity > 0
AND
expiryDate > current date/time
```

Expired quantities are therefore excluded from the sellable total and can be reported separately.

## 9. Expiry Alerts

Expiry information is exposed through a dedicated API.

The UI can request different windows such as:

```text
7 days
30 days
90 days
```

The application also classifies batches for easier pharmacist review.

## 10. Search

Search is implemented through API query parameters rather than filtering only in the browser.

Example:

```text
GET /api/medicines?search=paracetamol
```

This allows the backend to perform the filtering and lets the UI display results returned by the real database.

## 11. Pagination and Sorting

Inventory can grow, so the API supports server-side pagination and sorting.

Example:

```text
GET /api/medicines?page=1&limit=10
```

and:

```text
GET /api/medicines?page=1&limit=10&sortBy=name&order=asc
```

Batch views use expiry-oriented ordering so that the earliest-expiring stock is easy to inspect.

## 12. Authentication

Registration and login are handled by the backend.

Passwords are hashed with bcryptjs rather than stored as plain text.

JWT authentication is used to identify authenticated requests.

Protected management endpoints require:

```text
Authorization: Bearer <JWT>
```

## 13. Frontend Structure

The React application separates:

- Pages
- Reusable UI components
- API modules
- Authentication context
- Utility functions

Axios centralizes API communication and authentication headers.

This keeps API logic separate from page rendering.

## 14. Error Handling

The backend contains centralized error handling and route protection.

The frontend displays loading, empty and error states rather than silently failing.

Important cases include:

- Invalid IDs.
- Missing medicines.
- Missing batches.
- Invalid quantities.
- Invalid dates.
- Authentication failures.
- Duplicate batch numbers.
- Insufficient sellable stock.
- Database connection failures.

## 15. Testing Strategy

The most important tests focus on inventory rules.

### FEFO ordering

If:

```text
Batch A expires before Batch B
```

then A must be allocated before B.

### Expired exclusion

An expired batch must not contribute to sellable stock and must not be selected for dispensing.

### Multi-batch allocation

If:

```text
Batch A = 5
Batch B = 10
Requested = 8
```

the expected allocation is:

```text
Batch A = 5
Batch B = 3
```

### Insufficient stock

If valid stock is less than the requested quantity, the operation must fail without leaving a partial deduction.

### Authentication

Password hashing and authenticated API behavior are tested.

## 16. Development Fixes

The project was tested during development through terminal output and the browser.

Issues encountered during the development process included:

### Malformed MongoDB URI

A connection string was initially constructed with two MongoDB URI prefixes, producing an invalid value.

The connection string was corrected to the standard form:

```text
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/pharmaflow?retryWrites=true&w=majority
```

### MongoDB connectivity

The application produced a `querySrv ECONNREFUSED` connection error during local testing.

DNS/SRV resolution was checked with:

```powershell
nslookup -type=SRV _mongodb._tcp.YOUR-CLUSTER.mongodb.net
```

The SRV lookup returned MongoDB Atlas hosts, confirming that DNS resolution was working. The remaining troubleshooting points were Atlas network access, credentials and direct connectivity.

### Frontend JSX syntax

A Vite transform error was encountered in `DispensingHistory.jsx` at a specific source line. The component was corrected so its JSX structure and statements were syntactically valid.

### npm project location

Running an npm command from a directory without the root `package.json` produced `ENOENT`.

The fix was to run commands from the actual project root:

```text
pharmaflow/
```

or directly from:

```text
pharmaflow/server/
```

and:

```text
pharmaflow/client/
```

as appropriate.

## 17. Security During Development

Environment variables are kept outside source control.

The file:

```text
server/.env
```

must not be committed because it contains database credentials and application secrets.

The repository should contain:

```text
server/.env.example
```

with placeholder values instead.

If a real database password is ever exposed publicly, it should be changed immediately.

## 18. Final Architecture

```text
React / Vite
     |
     | HTTP / JSON
     v
Express REST API
     |
     +--> Authentication middleware
     |
     +--> Controllers
     |
     +--> FEFO / stock / expiry services
     |
     v
Mongoose
     |
     v
MongoDB Atlas
```

The frontend is responsible for usability. The backend is responsible for inventory rules and persistence.

## 19. Known Testing Boundary

Unit tests for the core rules can run without a full browser workflow.

Tests involving the real MongoDB database require a running MongoDB instance or dedicated test database.

For a production CI pipeline, a separate test database should be used rather than the development database.

## 20. Future Improvements

The landing page intentionally lists exactly three next features:

1. Supplier Management
2. Automated Notifications
3. Sales & Inventory Analytics
