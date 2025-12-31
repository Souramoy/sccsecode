import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { executeCode } from '../services/piston';
import { 
  Play, Send, ChevronLeft, Terminal, X, 
  FileCode, Settings, Info, Download, Copy,
  CheckCircle, AlertCircle, Cpu, Loader2,
  Maximize2, Minimize2, Save, Keyboard
} from 'lucide-react';

export const CodeEditor: React.FC = () => {
  const { subjectCode, assignmentNumber, questionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const question = location.state?.question;

  // -- Editor State --
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('C');
  const [activeTab, setActiveTab] = useState<'problem' | 'settings'>('problem');
  const [fontSize, setFontSize] = useState(14);
  const [lineCount, setLineCount] = useState(1);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(true);
  
  // -- Execution State --
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [showTerminal, setShowTerminal] = useState(true);
  const [activeTerminalTab, setActiveTerminalTab] = useState<'output' | 'input'>('input');
  
  // -- Complexity State --
  const [timeComplexity, setTimeComplexity] = useState('O(n)');
  const [spaceComplexity, setSpaceComplexity] = useState('O(1)');

  // -- Refs for Sync Scrolling --
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Fetch Previous Submission
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user?.email || !questionId) {
        setIsLoadingSubmission(false);
        return;
      }

      try {
        const submissions = await api.getSubmissions(user.email, 'student');
        const prev = submissions.find((s: any) => 
            s.subjectCode === subjectCode && 
            Number(s.assignmentNumber) === Number(assignmentNumber) && 
            s.questionId === questionId
        );

        if (prev) {
            setCode(prev.code);
            setLanguage(prev.language);
            setTimeComplexity(prev.timeComplexity);
            setSpaceComplexity(prev.spaceComplexity);
            if (prev.input) setCustomInput(prev.input);
            if (prev.output) setOutput(prev.output);
        }
      } catch (err) {
        console.error("Failed to fetch previous submission", err);
      } finally {
        setIsLoadingSubmission(false);
      }
    };

    fetchSubmission();
  }, [user, subjectCode, assignmentNumber, questionId]);

  // Initialize Code / Boilerplate
  useEffect(() => {
    if (!isLoadingSubmission && !code) {
        if (language === 'Python') setCode('# Write your solution here\n# Input provided via the "Input" tab below\nname = input("Enter name: ")\nprint(f"Hello {name}")');
        else if (language === 'Java') setCode('import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        if(scanner.hasNext()) {\n            String input = scanner.next();\n            System.out.println("Read: " + input);\n        }\n    }\n}');
        else if (language === 'C') setCode('#include <stdio.h>\n\nint main() {\n    int num;\n    if(scanf("%d", &num)) {\n        printf("Read number: %d", num);\n    }\n    return 0;\n}');
        else if (language === 'C++') setCode('#include <iostream>\n\nint main() {\n    int num;\n    if(std::cin >> num) {\n        std::cout << "Read number: " << num;\n    }\n    return 0;\n}');
    }
  }, [language, isLoadingSubmission]);

  useEffect(() => {
    setLineCount(code.split('\n').length || 1);
  }, [code]);

  if (!question) {
     return (
       <div className="fixed inset-0 z-50 bg-[#1e1e1e] text-gray-300 flex items-center justify-center flex-col gap-4">
         <AlertCircle size={48} className="text-red-500"/>
         <h2 className="text-xl font-bold">Context Missing</h2>
         <p>Please access this page from the dashboard.</p>
         <button onClick={() => navigate('/student')} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">Go Dashboard</button>
       </div>
     );
  }

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleRun = async () => {
    setShowTerminal(true);
    setActiveTerminalTab('output'); // Switch to output tab to see results
    setIsRunning(true);
    setOutput('Compiling and Executing...');
    try {
        const result = await executeCode(language, code, customInput);
        if (result.run) {
            setOutput(result.run.output);
        } else {
            setOutput(result.message || 'Unknown error occurred');
        }
    } catch (error: any) {
        setOutput(`Error: ${error.message}`);
    } finally {
        setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if(!window.confirm("Submit your solution for grading?")) return;
    setIsSubmitting(true);
    try {
      await api.submitCode({
        studentEmail: user?.email,
        subjectCode,
        assignmentNumber: Number(assignmentNumber),
        questionId,
        code,
        language,
        input: customInput, // Store the input used
        output: output,     // Store the last output
        timeComplexity,
        spaceComplexity
      });
      alert("Submitted successfully! The teacher will grade it shortly.");
      navigate('/student');
    } catch (err) {
      alert("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  const getFileExtension = () => {
    switch(language) {
      case 'Python': return 'py';
      case 'Java': return 'java';
      case 'C++': return 'cpp';
      default: return 'c';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[#1e1e1e] text-[#d4d4d4] font-sans overflow-hidden">
      
      {/* 1. Activity Bar (Leftmost) */}
      <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-6 border-r border-[#2b2b2b] z-20">
        <div className="p-2 bg-brand-600 rounded-lg cursor-pointer" title="Problem">
          <FileCode size={24} className="text-white" />
        </div>
        <button onClick={() => setActiveTab('problem')} className={`p-2 rounded hover:bg-[#444] ${activeTab === 'problem' ? 'text-white' : 'text-gray-500'}`}>
          <Info size={24} />
        </button>
        <button onClick={() => setActiveTab('settings')} className={`p-2 rounded hover:bg-[#444] ${activeTab === 'settings' ? 'text-white' : 'text-gray-500'}`}>
          <Settings size={24} />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate('/student')} className="p-2 text-gray-500 hover:text-red-400 hover:bg-[#444] rounded mb-2">
          <X size={24} />
        </button>
      </div>

      {/* 2. Side Panel (Problem Description) */}
      <div className="w-96 bg-[#252526] flex flex-col border-r border-[#1e1e1e]">
        <div className="h-10 px-4 flex items-center justify-between bg-[#252526] border-b border-[#1e1e1e]">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {activeTab === 'problem' ? 'PROBLEM DESCRIPTION' : 'SETTINGS'}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'problem' ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <h2 className="text-xl font-bold text-gray-100 mb-4">{question.title}</h2>
              <div className="bg-[#333333] p-3 rounded mb-6 text-xs text-gray-400 font-mono">
                Batch {user?.batch} • {subjectCode} • Assign #{assignmentNumber}
              </div>
              
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{question.description}</p>
              
              <div className="mt-8 pt-8 border-t border-[#333]">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Cpu size={16}/> Constraints
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e1e1e] p-3 rounded border border-[#333]">
                    <span className="block text-xs text-gray-500 mb-1">Time Complexity</span>
                    <code className="text-brand-400 font-mono">{question.expectedTimeComplexity}</code>
                  </div>
                  <div className="bg-[#1e1e1e] p-3 rounded border border-[#333]">
                    <span className="block text-xs text-gray-500 mb-1">Space Complexity</span>
                    <code className="text-brand-400 font-mono">{question.expectedSpaceComplexity}</code>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Editor Font Size</label>
                 <input 
                   type="range" 
                   min="10" 
                   max="24" 
                   value={fontSize} 
                   onChange={(e) => setFontSize(Number(e.target.value))} 
                   className="w-full"
                 />
                 <div className="text-right text-xs text-gray-400 mt-1">{fontSize}px</div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Complexity Estimate</label>
                 <div className="space-y-3">
                   <div>
                     <span className="text-xs text-gray-400 block mb-1">Time Analysis</span>
                     <select 
                       value={timeComplexity}
                       onChange={e => setTimeComplexity(e.target.value)}
                       className="w-full bg-[#1e1e1e] border border-[#333] rounded p-2 text-sm outline-none"
                     >
                        {['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)'].map(o => <option key={o}>{o}</option>)}
                     </select>
                   </div>
                   <div>
                     <span className="text-xs text-gray-400 block mb-1">Space Analysis</span>
                     <select 
                       value={spaceComplexity}
                       onChange={e => setSpaceComplexity(e.target.value)}
                       className="w-full bg-[#1e1e1e] border border-[#333] rounded p-2 text-sm outline-none"
                     >
                        {['O(1)', 'O(n)'].map(o => <option key={o}>{o}</option>)}
                     </select>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Editor Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] relative min-w-0">
        
        {/* Top Tab Bar */}
        <div className="h-10 bg-[#1e1e1e] flex items-center overflow-x-auto border-b border-[#2b2b2b]">
          <div className="flex items-center px-4 py-2 bg-[#2d2d2d] border-t-2 border-brand-500 text-gray-200 text-sm min-w-[120px] justify-between">
            <span className="flex items-center gap-2">
              <FileCode size={14} className="text-brand-500"/>
              {isLoadingSubmission ? 'Loading...' : `main.${getFileExtension()}`}
            </span>
          </div>
          
          <div className="flex-1 flex justify-end items-center px-4 gap-2">
             <div className="flex items-center gap-2 mr-4 bg-[#252526] rounded-md px-1 py-0.5 border border-[#333]">
                <select 
                   value={language}
                   onChange={e => setLanguage(e.target.value)}
                   className="bg-transparent text-xs text-gray-300 outline-none border-none py-1 pl-2"
                >
                   <option>C</option>
                   <option>C++</option>
                   <option>Java</option>
                   <option>Python</option>
                </select>
             </div>
             <button onClick={handleRun} disabled={isRunning} className="flex items-center gap-2 px-3 py-1 bg-[#333] hover:bg-[#444] rounded text-xs text-green-400 transition-colors">
               {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor"/>}
               <span>Run</span>
             </button>
             <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-3 py-1 bg-brand-700 hover:bg-brand-600 rounded text-xs text-white transition-colors">
               {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
               <span>Submit</span>
             </button>
          </div>
        </div>

        {/* Editor Surface */}
        <div className="flex-1 relative flex overflow-hidden">
           {isLoadingSubmission && (
             <div className="absolute inset-0 z-10 bg-[#1e1e1e] flex items-center justify-center text-gray-500">
               <Loader2 size={24} className="animate-spin" />
             </div>
           )}

           {/* Line Numbers */}
           <div 
             ref={lineNumbersRef}
             className="w-12 bg-[#1e1e1e] border-r border-[#2b2b2b] text-right pr-3 pt-4 text-gray-600 select-none font-mono text-sm overflow-hidden"
             style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
           >
              {Array.from({length: lineCount}, (_, i) => (
                <div key={i+1} className="h-[1.5em]">{i+1}</div>
              ))}
           </div>

           {/* Code Textarea */}
           <textarea
             ref={textareaRef}
             value={code}
             onChange={(e) => setCode(e.target.value)}
             onScroll={handleScroll}
             spellCheck={false}
             className="flex-1 bg-transparent text-[#d4d4d4] p-4 font-mono outline-none resize-none whitespace-pre leading-normal"
             style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
           />
           
           {/* Floating Tools */}
           <div className="absolute top-4 right-6 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <button onClick={handleCopy} className="p-1.5 bg-[#333] rounded hover:bg-[#444]" title="Copy Code">
                <Copy size={14} />
              </button>
           </div>
        </div>

        {/* Terminal Panel */}
        {showTerminal && (
           <div className="h-48 border-t border-[#2b2b2b] bg-[#1e1e1e] flex flex-col">
              <div className="px-4 py-1 flex justify-between items-center bg-[#252526] border-b border-[#2b2b2b]">
                 <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setActiveTerminalTab('input')}
                      className={`text-xs px-3 py-1 font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${activeTerminalTab === 'input' ? 'border-brand-500 text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                      <Keyboard size={12} /> Input
                    </button>
                    <button 
                      onClick={() => setActiveTerminalTab('output')}
                      className={`text-xs px-3 py-1 font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${activeTerminalTab === 'output' ? 'border-brand-500 text-gray-200' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                      <Terminal size={12} /> Output
                    </button>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setOutput('')} className="text-gray-500 hover:text-gray-300" title="Clear Output"><X size={12}/></button>
                    <button onClick={() => setShowTerminal(false)} className="text-gray-500 hover:text-gray-300" title="Minimize"><Minimize2 size={12}/></button>
                 </div>
              </div>
              
              <div className="flex-1 relative font-mono text-sm text-gray-300">
                 {/* Input Tab Content */}
                 <div className={`absolute inset-0 p-3 bg-[#1e1e1e] ${activeTerminalTab === 'input' ? 'z-10' : 'z-0 invisible'}`}>
                    <textarea 
                       value={customInput}
                       onChange={(e) => setCustomInput(e.target.value)}
                       placeholder="Enter standard input (stdin) here. For multiple inputs, put them on separate lines."
                       className="w-full h-full bg-[#1e1e1e] text-gray-300 resize-none outline-none border-none placeholder-gray-600"
                    />
                 </div>
                 
                 {/* Output Tab Content */}
                 <div className={`absolute inset-0 p-3 overflow-auto ${activeTerminalTab === 'output' ? 'z-10' : 'z-0 invisible'}`}>
                   {isRunning ? (
                     <div className="flex items-center gap-2 text-yellow-500">
                       <Loader2 size={14} className="animate-spin" />
                       <span>Compiling and executing on remote server...</span>
                     </div>
                   ) : (
                     <pre className="whitespace-pre-wrap">{output || <span className="text-gray-600 italic">No output yet. Input data in the 'Input' tab and click 'Run'.</span>}</pre>
                   )}
                 </div>
              </div>
           </div>
        )}
        
        {/* Bottom Status Bar */}
        <div className="h-6 bg-[#007acc] text-white flex items-center px-3 text-xs justify-between">
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><CheckCircle size={10} /> Ready</span>
              <span>Ln {code.substring(0, code.length).split('\n').length}, Col 1</span>
           </div>
           <div className="flex items-center gap-4">
              <span>Spaces: 4</span>
              <span>UTF-8</span>
              <span>{language}</span>
           </div>
        </div>

      </div>
    </div>
  );
};