/**
 * health.spec.js
 *
 * Tests for the API health check endpoint.
 * A simple but important test — verifies the system under test is reachable
 * and returning expected status before running deeper test suites.
 */

const { test, expect } = require('@playwright/test');
const { NotesApiClient } = require('../helpers/notesApiClient');

test.describe('Health Check', () => {

  test('GET /health-check returns 200 and success message', async ({ request }) => {
    const client = new NotesApiClient(request);
    const response = await client.healthCheck();

    // Assert HTTP status
    expect(response.status()).toBe(200);

    const body = await response.json();

    // Assert response shape
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('message');
    expect(typeof body.message).toBe('string');
    expect(body.message.toLowerCase()).toContain('healthy');
  });

});
