
// Use localhost as it is the standard for local development. 
// If using a cloud IDE, you might need to check how to expose port 3001.
const API_URL = 'http://localhost:3001/api';

const handleFetch = async (endpoint: string, options?: RequestInit) => {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!res.ok) {
      const errorText = await res.text();
      try {
         const jsonError = JSON.parse(errorText);
         throw new Error(jsonError.error || `Error ${res.status}`);
      } catch (e) {
         throw new Error(errorText || `Error ${res.status}: ${res.statusText}`);
      }
    }
    return res.json();
  } catch (error: any) {
    console.error(`API Call Failed [${endpoint}]:`, error);
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      alert(`⚠️ Connection Failed\n\nCould not connect to the backend server.\n\n1. Open a NEW terminal.\n2. Run: npm install\n3. Run: node server/server.js\n4. Ensure it says "✅ SERVER READY"`);
    }
    throw error;
  }
};

export const api = {
  // Auth
  register: async (data: any) => {
    return handleFetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  login: async (data: any) => {
    return handleFetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // Assignments
  getAssignments: async (batch?: string) => {
    const query = batch ? `?batch=${batch}` : '';
    return handleFetch(`/assignments${query}`);
  },

  createAssignment: async (data: any) => {
    return handleFetch('/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  updateAssignment: async (id: string, data: any) => {
    return handleFetch(`/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  deleteAssignment: async (id: string) => {
    return handleFetch(`/assignments/${id}`, {
      method: 'DELETE',
    });
  },

  // Submissions
  getSubmissions: async (email?: string, role?: string) => {
    let query = '';
    if (email) query += `?email=${email}&role=${role}`;
    return handleFetch(`/submissions${query}`);
  },

  submitCode: async (data: any) => {
    return handleFetch('/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  gradeSubmission: async (id: string, score: number) => {
    return handleFetch(`/submissions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    });
  }
};
