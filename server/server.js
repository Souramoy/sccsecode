
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  students: path.join(DATA_DIR, 'students.json'),
  teachers: path.join(DATA_DIR, 'teachers.json'),
  assignments: path.join(DATA_DIR, 'assignments.json'),
  submissions: path.join(DATA_DIR, 'submissions.json'),
};

// Initialize Data Files
const initializeData = async () => {
  try {
    // Ensure data folder exists
    try {
      await fs.access(DATA_DIR);
    } catch {
      console.log('📂 Creating data directory...');
      await fs.mkdir(DATA_DIR, { recursive: true });
    }

    // Ensure files exist with valid JSON array
    for (const [key, filePath] of Object.entries(FILES)) {
      try {
        await fs.access(filePath);
      } catch {
        console.log(`📄 Creating empty ${key}.json...`);
        // We write valid sample data for assignments if it's the assignments file, else empty array
        const initialContent = '[]';
        await fs.writeFile(filePath, initialContent);
      }
    }
    console.log('✅ Database files ready');
  } catch (err) {
    console.error('❌ Error initializing data:', err);
    process.exit(1);
  }
};

// Helper to read/write JSON
const readData = async (file) => {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
    return [];
  }
};

const writeData = async (file, data) => {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
};

// --- ROUTES ---

// Auth
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role, name, batch } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'Missing fields' });

    const file = role === 'student' ? FILES.students : FILES.teachers;
    const users = await readData(file);

    if (users.find(u => u.email === email)) return res.status(409).json({ error: 'User already exists' });

    const newUser = { email, password, role, name, batch, id: Date.now().toString() };
    users.push(newUser);
    await writeData(file, users);

    const { password: _, ...userWithoutPass } = newUser;
    res.json({ user: userWithoutPass });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const file = role === 'student' ? FILES.students : FILES.teachers;
    const users = await readData(file);

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const { password: _, ...userWithoutPass } = user;
    res.json({ user: userWithoutPass });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Assignments
app.get('/api/assignments', async (req, res) => {
  try {
    const { batch } = req.query;
    const assignments = await readData(FILES.assignments);
    const filtered = batch ? assignments.filter(a => a.batch === batch) : assignments;
    res.json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/assignments', async (req, res) => {
  try {
    const { subjectCode, batch, assignmentNumber, questions, createdBy } = req.body;
    const assignments = await readData(FILES.assignments);
    
    const newAssignment = {
      id: Date.now().toString(),
      subjectCode,
      batch,
      assignmentNumber: Number(assignmentNumber),
      questions,
      createdBy,
      createdAt: new Date().toISOString()
    };

    assignments.push(newAssignment);
    await writeData(FILES.assignments, assignments);
    res.json(newAssignment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const assignments = await readData(FILES.assignments);
    const index = assignments.findIndex(a => a.id === id);
    
    if (index === -1) return res.status(404).json({ error: 'Assignment not found' });

    // Merge updates
    assignments[index] = { ...assignments[index], ...updatedData };
    
    await writeData(FILES.assignments, assignments);
    res.json(assignments[index]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let assignments = await readData(FILES.assignments);
    const initialLength = assignments.length;
    assignments = assignments.filter(a => a.id !== id);
    
    if (assignments.length === initialLength) {
        return res.status(404).json({ error: 'Assignment not found' });
    }

    await writeData(FILES.assignments, assignments);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const { email, role } = req.query;
    const submissions = await readData(FILES.submissions);
    if (role === 'student') return res.json(submissions.filter(s => s.studentEmail === email));
    res.json(submissions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/submissions', async (req, res) => {
  try {
    const submission = req.body;
    // We no longer calculate automated score based on complexity.
    // Default score is null (Unchecked)
    
    const finalSubmission = {
      ...submission,
      id: Date.now().toString(),
      score: null, 
      timestamp: new Date().toISOString()
    };

    const submissions = await readData(FILES.submissions);
    
    // Remove previous submission for same question if exists (overwrite policy)
    // Or keep history? For simplicity, we usually append, but let's just append.
    submissions.push(finalSubmission);
    await writeData(FILES.submissions, submissions);

    res.json(finalSubmission);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update Submission (Grading)
app.put('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const submissions = await readData(FILES.submissions);
    
    const index = submissions.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Submission not found' });

    submissions[index].score = Number(score); // Update score
    
    await writeData(FILES.submissions, submissions);
    res.json(submissions[index]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start Server AFTER initialization
initializeData().then(() => {
  // Bind to 0.0.0.0 to ensure visibility on all network interfaces
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ SERVER READY ON: http://localhost:${PORT}`);
    console.log(`📂 Data Storage: ${DATA_DIR}`);
  });
});
