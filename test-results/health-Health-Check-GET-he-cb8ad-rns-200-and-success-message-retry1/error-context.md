# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: health.spec.js >> Health Check >> GET /health-check returns 200 and success message
- Location: tests/health.spec.js:14:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 403
```

# Test source

```ts
  1  | /**
  2  |  * health.spec.js
  3  |  *
  4  |  * Tests for the API health check endpoint.
  5  |  * A simple but important test — verifies the system under test is reachable
  6  |  * and returning expected status before running deeper test suites.
  7  |  */
  8  | 
  9  | const { test, expect } = require('@playwright/test');
  10 | const { NotesApiClient } = require('../helpers/notesApiClient');
  11 | 
  12 | test.describe('Health Check', () => {
  13 | 
  14 |   test('GET /health-check returns 200 and success message', async ({ request }) => {
  15 |     const client = new NotesApiClient(request);
  16 |     const response = await client.healthCheck();
  17 | 
  18 |     // Assert HTTP status
> 19 |     expect(response.status()).toBe(200);
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  20 | 
  21 |     const body = await response.json();
  22 | 
  23 |     // Assert response shape
  24 |     expect(body).toHaveProperty('success', true);
  25 |     expect(body).toHaveProperty('message');
  26 |     expect(typeof body.message).toBe('string');
  27 |     expect(body.message.toLowerCase()).toContain('healthy');
  28 |   });
  29 | 
  30 | });
  31 | 
```