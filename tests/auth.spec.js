/**
 * auth.spec.js
 *
 * Tests for user authentication endpoints:
 *   POST /users/register
 *   POST /users/login
 *   GET  /users/profile
 *   PATCH /users/profile
 *   DELETE /users/logout
 *   DELETE /users/delete-account
 *
 * Covers: happy path flows, validation errors, and unauthorized access.
 */

const { test, expect } = require('@playwright/test');
const { NotesApiClient } = require('../helpers/notesApiClient');
const { generateUser } = require('../fixtures/testData');

test.describe('User Authentication', () => {

  // ─── Registration ──────────────────────────────────────────────────────────

  test.describe('POST /users/register', () => {

    test('registers a new user successfully', async ({ request }) => {
      const client = new NotesApiClient(request);
      const user = generateUser();

      const response = await client.registerUser(user.name, user.email, user.password);
      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.email).toBe(user.email);
      expect(body.data.name).toBe(user.name);
      // Password should never be returned
      expect(body.data).not.toHaveProperty('password');
    });

    test('returns 400 when email is missing', async ({ request }) => {
      const client = new NotesApiClient(request);

      const response = await client.registerUser('No Email User', '', 'Test@12345!');
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body).toHaveProperty('message');
    });

    test('returns 400 when password is too short', async ({ request }) => {
      const client = new NotesApiClient(request);
      const user = generateUser();

      const response = await client.registerUser(user.name, user.email, '123');
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('returns 409 when registering with duplicate email', async ({ request }) => {
      const client = new NotesApiClient(request);
      const user = generateUser();

      // First registration
      await client.registerUser(user.name, user.email, user.password);

      // Duplicate registration
      const response = await client.registerUser(user.name, user.email, user.password);
      expect(response.status()).toBe(409);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

  });

  // ─── Login ─────────────────────────────────────────────────────────────────

  test.describe('POST /users/login', () => {

    test('logs in with valid credentials and returns token', async ({ request }) => {
      const client = new NotesApiClient(request);
      const user = generateUser();

      // Register first
      await client.registerUser(user.name, user.email, user.password);

      // Login
      const response = await client.loginUser(user.email, user.password);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('token');
      expect(typeof body.data.token).toBe('string');
      expect(body.data.token.length).toBeGreaterThan(0);
    });

    test('returns 401 with wrong password', async ({ request }) => {
      const client = new NotesApiClient(request);
      const user = generateUser();

      await client.registerUser(user.name, user.email, user.password);

      const response = await client.loginUser(user.email, 'WrongPassword!99');
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('returns 400 with invalid email format', async ({ request }) => {
      const client = new NotesApiClient(request);

      const response = await client.loginUser('not-an-email', 'Test@12345!');
      expect(response.status()).toBe(400);
    });

  });

  // ─── Profile ───────────────────────────────────────────────────────────────

  test.describe('GET /users/profile', () => {

    test('returns profile for authenticated user', async ({ request }) => {
      const client = new NotesApiClient(request);
      const user = generateUser();

      await client.registerUser(user.name, user.email, user.password);
      await client.loginUser(user.email, user.password);

      const response = await client.getProfile();
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.email).toBe(user.email);
      expect(body.data.name).toBe(user.name);
    });

    test('returns 401 when accessing profile without token', async ({ request }) => {
      // Manually make a raw request without a token
      const response = await request.get(
        'https://practice.expandtesting.com/notes/api/users/profile'
      );
      expect(response.status()).toBe(401);
    });

  });

  // ─── Update Profile ────────────────────────────────────────────────────────

  test.describe('PATCH /users/profile', () => {

    test('updates user name successfully', async ({ request }) => {
      const client = new NotesApiClient(request);
      const user = generateUser();

      await client.registerUser(user.name, user.email, user.password);
      await client.loginUser(user.email, user.password);

      const newName = `Updated Name ${Date.now()}`;
      const response = await client.updateProfile(newName);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe(newName);
    });

  });

  // ─── Logout ────────────────────────────────────────────────────────────────

  test.describe('DELETE /users/logout', () => {

    test('logs out authenticated user successfully', async ({ request }) => {
      const client = new NotesApiClient(request);
      const user = generateUser();

      await client.registerUser(user.name, user.email, user.password);
      await client.loginUser(user.email, user.password);

      const response = await client.logoutUser();
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
    });

    test('token is invalidated after logout', async ({ request }) => {
      const client = new NotesApiClient(request);
      const user = generateUser();

      await client.registerUser(user.name, user.email, user.password);
      await client.loginUser(user.email, user.password);
      await client.logoutUser();

      // Using the old token should now fail
      const response = await client.getProfile();
      expect(response.status()).toBe(401);
    });

  });

});
