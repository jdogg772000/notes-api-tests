/**
 * notes.spec.js
 *
 * Tests for the Notes CRUD endpoints:
 *   POST   /notes
 *   GET    /notes
 *   GET    /notes/:id
 *   PUT    /notes/:id
 *   PATCH  /notes/:id  (toggle completed)
 *   DELETE /notes/:id
 *
 * Covers: full lifecycle, validation, auth enforcement, and edge cases.
 */

const { test, expect } = require('@playwright/test');
const { NotesApiClient } = require('../helpers/notesApiClient');
const { generateUser, generateNote, NOTE_CATEGORIES } = require('../fixtures/testData');

// ─── Shared Setup ─────────────────────────────────────────────────────────────
// Each describe block that needs auth uses this helper to register + login
// and returns a ready-to-use authenticated client.

async function createAuthenticatedClient(request) {
  const client = new NotesApiClient(request);
  const user = generateUser();
  await client.registerUser(user.name, user.email, user.password);
  await client.loginUser(user.email, user.password);
  return client;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Notes API', () => {

  // ─── Create Note ────────────────────────────────────────────────────────────

  test.describe('POST /notes', () => {

    test('creates a note with valid data', async ({ request }) => {
      const client = await createAuthenticatedClient(request);
      const note = generateNote();

      const response = await client.createNote(note.title, note.description, note.category);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.title).toBe(note.title);
      expect(body.data.description).toBe(note.description);
      expect(body.data.category).toBe(note.category);
      expect(body.data.completed).toBe(false); // new notes default to not completed
    });

    test('creates notes in all valid categories', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      for (const category of NOTE_CATEGORIES) {
        const response = await client.createNote(
          `${category} Note`,
          `A note in the ${category} category.`,
          category
        );
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.data.category).toBe(category);
      }
    });

    test('returns 400 when title is missing', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      const response = await client.createNote('', 'Description without title', 'Home');
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('returns 400 when description is missing', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      const response = await client.createNote('Title Without Description', '', 'Work');
      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
    });

    test('returns 401 when creating a note without auth', async ({ request }) => {
      const response = await request.post(
        'https://practice.expandtesting.com/notes/api/notes',
        { data: generateNote() }
      );
      expect(response.status()).toBe(401);
    });

  });

  // ─── Get All Notes ──────────────────────────────────────────────────────────

  test.describe('GET /notes', () => {

    test('returns empty array when user has no notes', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      const response = await client.getAllNotes();
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    test('returns only notes belonging to the authenticated user', async ({ request }) => {
      const client = await createAuthenticatedClient(request);
      const note = generateNote({ title: 'Ownership Test Note' });

      // Create a note
      const createResponse = await client.createNote(note.title, note.description, note.category);
      const createdNote = (await createResponse.json()).data;

      // Fetch all notes
      const getResponse = await client.getAllNotes();
      const body = await getResponse.json();

      // Confirm the created note is present
      const found = body.data.find(n => n.id === createdNote.id);
      expect(found).toBeDefined();
      expect(found.title).toBe(note.title);
    });

  });

  // ─── Get Note by ID ─────────────────────────────────────────────────────────

  test.describe('GET /notes/:id', () => {

    test('retrieves a specific note by ID', async ({ request }) => {
      const client = await createAuthenticatedClient(request);
      const note = generateNote();

      const createResponse = await client.createNote(note.title, note.description, note.category);
      const noteId = (await createResponse.json()).data.id;

      const response = await client.getNoteById(noteId);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data.id).toBe(noteId);
      expect(body.data.title).toBe(note.title);
    });

    test('returns 400 for a non-existent note ID', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      const response = await client.getNoteById('000000000000000000000000');
      expect(response.status()).toBe(400);
    });

  });

  // ─── Update Note (PUT) ──────────────────────────────────────────────────────

  test.describe('PUT /notes/:id', () => {

    test('updates all fields of an existing note', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      // Create original note
      const createResponse = await client.createNote('Original Title', 'Original Description', 'Home');
      const noteId = (await createResponse.json()).data.id;

      // Update it
      const response = await client.updateNote(
        noteId,
        'Updated Title',
        'Updated Description',
        true,
        'Work'
      );
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data.title).toBe('Updated Title');
      expect(body.data.description).toBe('Updated Description');
      expect(body.data.completed).toBe(true);
      expect(body.data.category).toBe('Work');
    });

  });

  // ─── Toggle Completed (PATCH) ───────────────────────────────────────────────

  test.describe('PATCH /notes/:id', () => {

    test('marks a note as completed', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      const createResponse = await client.createNote('Task to Complete', 'Do this thing', 'Personal');
      const noteId = (await createResponse.json()).data.id;

      const response = await client.patchNoteCompleted(noteId, true);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data.completed).toBe(true);
    });

    test('marks a completed note back to incomplete', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      const createResponse = await client.createNote('Toggle Test', 'Start incomplete', 'Home');
      const noteId = (await createResponse.json()).data.id;

      // Mark complete
      await client.patchNoteCompleted(noteId, true);

      // Mark incomplete
      const response = await client.patchNoteCompleted(noteId, false);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.data.completed).toBe(false);
    });

  });

  // ─── Delete Note ────────────────────────────────────────────────────────────

  test.describe('DELETE /notes/:id', () => {

    test('deletes a note successfully', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      const createResponse = await client.createNote('Note to Delete', 'Temporary note', 'Home');
      const noteId = (await createResponse.json()).data.id;

      const deleteResponse = await client.deleteNote(noteId);
      expect(deleteResponse.status()).toBe(200);

      // Verify it's gone
      const getResponse = await client.getNoteById(noteId);
      expect(getResponse.status()).toBe(400);
    });

    test('returns 400 when deleting a non-existent note', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      const response = await client.deleteNote('000000000000000000000000');
      expect(response.status()).toBe(400);
    });

    test('returns 401 when deleting without auth', async ({ request }) => {
      const response = await request.delete(
        'https://practice.expandtesting.com/notes/api/notes/000000000000000000000001'
      );
      expect(response.status()).toBe(401);
    });

  });

  // ─── End-to-End Lifecycle ───────────────────────────────────────────────────

  test.describe('Full Note Lifecycle', () => {

    test('create → read → update → complete → delete', async ({ request }) => {
      const client = await createAuthenticatedClient(request);

      // 1. Create
      const createResponse = await client.createNote(
        'Lifecycle Test',
        'Testing the full note lifecycle',
        'Work'
      );
      expect(createResponse.status()).toBe(200);
      const noteId = (await createResponse.json()).data.id;

      // 2. Read
      const getResponse = await client.getNoteById(noteId);
      expect(getResponse.status()).toBe(200);
      expect((await getResponse.json()).data.completed).toBe(false);

      // 3. Update
      const updateResponse = await client.updateNote(
        noteId,
        'Lifecycle Test - Updated',
        'Updated during lifecycle test',
        false,
        'Personal'
      );
      expect(updateResponse.status()).toBe(200);
      expect((await updateResponse.json()).data.title).toBe('Lifecycle Test - Updated');

      // 4. Complete
      const patchResponse = await client.patchNoteCompleted(noteId, true);
      expect(patchResponse.status()).toBe(200);
      expect((await patchResponse.json()).data.completed).toBe(true);

      // 5. Delete
      const deleteResponse = await client.deleteNote(noteId);
      expect(deleteResponse.status()).toBe(200);

      // 6. Confirm gone
      const confirmResponse = await client.getNoteById(noteId);
      expect(confirmResponse.status()).toBe(400);
    });

  });

});
