
const API_URL = 'https://emkc.org/api/v2/piston';

type Runtime = {
  language: string;
  version: string;
  aliases: string[];
};

let runtimesCache: Runtime[] = [];

// Fetch available runtimes from Piston to ensure we use valid versions
const getRuntimes = async (): Promise<Runtime[]> => {
  if (runtimesCache.length > 0) return runtimesCache;
  try {
    const res = await fetch(`${API_URL}/runtimes`);
    if (!res.ok) throw new Error('Failed to fetch runtimes');
    const data = await res.json();
    runtimesCache = data;
    return data;
  } catch (err) {
    console.error("Piston Runtimes Error:", err);
    // Fallback to common versions if API listing fails (prevents complete breakage)
    return [
      { language: 'python', version: '3.10.0', aliases: ['py'] },
      { language: 'java', version: '15.0.2', aliases: [] },
      { language: 'c', version: '10.2.0', aliases: ['gcc'] },
      { language: 'c++', version: '10.2.0', aliases: ['cpp', 'g++'] },
    ];
  }
};

const LANGUAGE_MAP: Record<string, string> = {
  'Python': 'python',
  'Java': 'java',
  'C': 'c',
  'C++': 'c++',
};

const FILE_NAMES: Record<string, string> = {
  'Python': 'main.py',
  'Java': 'Main.java',
  'C': 'main.c',
  'C++': 'main.cpp',
};

export const executeCode = async (languageName: string, sourceCode: string, stdin: string = '') => {
  const pistonLang = LANGUAGE_MAP[languageName];
  if (!pistonLang) throw new Error(`Unsupported language: ${languageName}`);

  const runtimes = await getRuntimes();
  
  // Find the runtime configuration
  const runtime = runtimes.find(r => 
    r.language === pistonLang || r.aliases.includes(pistonLang)
  );

  if (!runtime) {
    throw new Error(`Runtime not found for ${languageName}`);
  }

  try {
    const response = await fetch(`${API_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [
          {
            name: FILE_NAMES[languageName],
            content: sourceCode,
          }
        ],
        stdin: stdin, // Pass standard input here
      }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Execution failed');
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to connect to execution engine.");
  }
};
