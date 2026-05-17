/**
 * NotesApiClient
 *
 * A reusable wrapper around Playwright's APIRequestContext.
 * Centralizes base URL, auth token management, and response handling
 * so individual test files stay clean and focused on assertions.
 */

const BASE_URL = 'https://practice.expandtesting.com/notes/api';

class NotesApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   */
  constructor(request) {
    this.request = request;
    this.token = null;
  }

  // ─── Auth Header ────────────────────────────────────────────────────────────

  _authHeaders() {
    if (!this.token) throw new Error('No auth token set. Call login() first.');
    return { 'x-auth-token': this.token };
  }

  // ─── Health ─────────────────────────────────────────────────────────────────

  async healthCheck() {
    return this.request.get(`${BASE_URL}/health-check`);
  }

  // ─── Users ──────────────────────────────────────────────────────────────────

  async registerUser(name, email, password) {
    return this.request.post(`${BASE_URL}/users/register`, {
      data: { name, email, password },
    });
  }

  async loginUser(email, password) {
    const response = await this.request.post(`${BASE_URL}/users/login`, {
      data: { email, password },
    });
    if (response.ok()) {
      const body = await response.json();
      this.token = body.data?.token ?? null;
    }
    return response;
  }

  async getProfile() {
    return this.request.get(`${BASE_URL}/users/profile`, {
      headers: this._authHeaders(),
    });
  }

  async updateProfile(name) {
    return this.request.patch(`${BASE_URL}/users/profile`, {
      headers: this._authHeaders(),
      data: { name },
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request.post(`${BASE_URL}/users/change-password`, {
      headers: this._authHeaders(),
      data: { currentPassword, newPassword },
    });
  }

  async logoutUser() {
    return this.request.delete(`${BASE_URL}/users/logout`, {
      headers: this._authHeaders(),
    });
  }

  async deleteAccount() {
    return this.request.delete(`${BASE_URL}/users/delete-account`, {
      headers: this._authHeaders(),
    });
  }

  // ─── Notes ──────────────────────────────────────────────────────────────────

  async createNote(title, description, category = 'Home') {
    return this.request.post(`${BASE_URL}/notes`, {
      headers: this._authHeaders(),
      data: { title, description, category },
    });
  }

  async getAllNotes() {
    return this.request.get(`${BASE_URL}/notes`, {
      headers: this._authHeaders(),
    });
  }

  async getNoteById(noteId) {
    return this.request.get(`${BASE_URL}/notes/${noteId}`, {
      headers: this._authHeaders(),
    });
  }

  async updateNote(noteId, title, description, completed, category) {
    return this.request.put(`${BASE_URL}/notes/${noteId}`, {
      headers: this._authHeaders(),
      data: { title, description, completed, category },
    });
  }

  async patchNoteCompleted(noteId, completed) {
    return this.request.patch(`${BASE_URL}/notes/${noteId}`, {
      headers: this._authHeaders(),
      data: { completed },
    });
  }

  async deleteNote(noteId) {
    return this.request.delete(`${BASE_URL}/notes/${noteId}`, {
      headers: this._authHeaders(),
    });
  }
}

module.exports = { NotesApiClient };
