# Notes API Test Suite

Playwright-based API automation test suite targeting the [expandtesting.com](https://practice.expandtesting.com) Notes REST API.

Built to demonstrate proficiency in API test automation using Playwright's native `request` context — no browser required.

---

## Stack

- **[Playwright](https://playwright.dev/)** — API testing via `APIRequestContext`
- **JavaScript (Node.js)**
- **Target API** — [Notes API Swagger Docs](https://practice.expandtesting.com/notes/api/api-docs/)

---

## Project Structure

```
notes-api-tests/
├── helpers/
│   └── notesApiClient.js   # Reusable API client wrapper
├── fixtures/
│   └── testData.js         # Test data generators
├── tests/
│   ├── health.spec.js      # Health check endpoint
│   ├── auth.spec.js        # Registration, login, profile, logout
│   └── notes.spec.js       # Full CRUD + lifecycle tests
├── playwright.config.js
└── package.json
```

---

## Test Coverage

### Health
- `GET /health-check` — system availability

### Auth (`/users`)
| Scenario | Test |
|---|---|
| Register new user | ✅ |
| Register with duplicate email | ✅ (409) |
| Register with missing/invalid fields | ✅ (400) |
| Login with valid credentials | ✅ |
| Login with wrong password | ✅ (401) |
| Login with invalid email format | ✅ (400) |
| Get profile (authenticated) | ✅ |
| Get profile (no token) | ✅ (401) |
| Update profile name | ✅ |
| Logout | ✅ |
| Token invalidated after logout | ✅ |

### Notes (`/notes`)
| Scenario | Test |
|---|---|
| Create note (all valid categories) | ✅ |
| Create note without title | ✅ (400) |
| Create note without auth | ✅ (401) |
| Get all notes | ✅ |
| Get note by ID | ✅ |
| Get non-existent note | ✅ (400) |
| Update note (PUT) | ✅ |
| Toggle completed (PATCH) | ✅ |
| Toggle back to incomplete | ✅ |
| Delete note | ✅ |
| Delete non-existent note | ✅ (400) |
| Delete without auth | ✅ (401) |
| Full lifecycle (create→read→update→complete→delete) | ✅ |

---

## Setup & Run

```bash
# Install dependencies
npm install

# Run all tests
npx playwright test

# Run specific file
npx playwright test tests/notes.spec.js

# Run with HTML report
npx playwright test --reporter=html
```

---

## Design Decisions

**Reusable API client (`NotesApiClient`)** — All HTTP calls go through a single helper class. Tests stay focused on assertions, not request construction. Token management is handled centrally.

**Unique test data per run** — `generateUser()` uses timestamps to prevent email conflicts when tests run repeatedly against a shared API.

**No browser context** — Playwright's `APIRequestContext` is used directly, keeping tests fast and infrastructure-free.

**Positive and negative coverage** — Every endpoint includes both happy-path and error-condition tests (missing fields, wrong credentials, unauthorized access, non-existent resources).
