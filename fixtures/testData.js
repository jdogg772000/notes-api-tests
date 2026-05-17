/**
 * testData.js
 *
 * Generates unique test data per test run using timestamps.
 * Avoids collisions when tests run repeatedly against a shared API.
 */

function generateUser() {
  const timestamp = Date.now();
  return {
    name: `Test User ${timestamp}`,
    email: `testuser_${timestamp}@example.com`,
    password: 'Test@12345!',
  };
}

function generateNote(overrides = {}) {
  return {
    title: 'My Test Note',
    description: 'This is a test note created by Playwright automation.',
    category: 'Home',
    ...overrides,
  };
}

const NOTE_CATEGORIES = ['Home', 'Work', 'Personal'];

module.exports = { generateUser, generateNote, NOTE_CATEGORIES };
