import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Assignment, Batch, Question, Submission } from '../types';
import { Plus, Users, BookOpen, Clock, Activity, Trash2, Edit2, ArrowLeft, Save, X, Terminal, FileCode } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments' | 'monitor'>('monitor');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  // Assignment Management State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [subjectCode, setSubjectCode] = useState('');
  const [targetBatch, setTargetBatch] = useState<Batch>(Batch.X);
  const [assignNum, setAssignNum] = useState('');
  const [questions, setQuestions] = useState<Partial<Question>[]>([{ id: Date.now().toString() }]);

  // Grading Modal State
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignRes, subRes] = await Promise.all([
        api.getAssignments(),
        api.getSubmissions(undefined, 'teacher')
      ]);
      setAssignments(assignRes);
      setSubmissions(subRes);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter assignments created by this teacher
  const myAssignments = assignments.filter(a => a.createdBy === user?.email);

  const addQuestionField = () => {
    setQuestions([...questions, { id: Date.now().toString() }]);
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const openCreateForm = () => {
    setSubjectCode('');
    setTargetBatch(Batch.X);
    setAssignNum('');
    setQuestions([{ id: Date.now().toString() }]);
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (assignment: Assignment) => {
    setSubjectCode(assignment.subjectCode);
    setTargetBatch(assignment.batch);
    setAssignNum(assignment.assignmentNumber.toString());
    setQuestions(assignment.questions);
    setEditingId(assignment.id);
    setIsFormOpen(true);
  };

  const handleDeleteAssignment = async (id: string) => {
    if(!window.confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) return;
    try {
        await api.deleteAssignment(id);
        await fetchData();
    } catch (err) {
        alert("Failed to delete assignment");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        subjectCode,
        batch: targetBatch,
        assignmentNumber: Number(assignNum),
        questions: questions as Question[],
        createdBy: user?.email
      };

      if (editingId) {
        await api.updateAssignment(editingId, payload);
        alert('Assignment Updated!');
      } else {
        await api.createAssignment(payload);
        alert('Assignment Created!');
      }

      await fetchData();
      setIsFormOpen(false);
      setEditingId(null);
    } catch (error) {
      alert('Failed to save assignment');
    }
  };

  const openGradingModal = (sub: Submission) => {
      setSelectedSubmission(sub);
      setGradeInput(sub.score !== null ? sub.score.toString() : '');
  };

  const handleGradeSubmit = async () => {
      if (!selectedSubmission) return;
      
      const score = Number(gradeInput);
      if (isNaN(score) || score < 0 || score > 10) {
          alert("Please enter a valid score between 0 and 10");
          return;
      }

      try {
          await api.gradeSubmission(selectedSubmission.id, score);
          alert("Grade Saved!");
          setSelectedSubmission(null);
          fetchData(); // Refresh list
      } catch (e) {
          alert("Failed to save grade");
      }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
          <button
            onClick={() => { setActiveTab('monitor'); setIsFormOpen(false); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'monitor' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Monitor & Grade
          </button>
          <button
            onClick={() => { setActiveTab('assignments'); setIsFormOpen(false); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'assignments' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Manage Assignments
          </button>
        </div>
      </div>

      {activeTab === 'assignments' ? (
        // --- ASSIGNMENTS TAB ---
        isFormOpen ? (
            // FORM VIEW
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                   {editingId ? <Edit2 className="h-5 w-5"/> : <Plus className="h-5 w-5" />} 
                   {editingId ? 'Edit Assignment' : 'New Assignment'}
                 </h2>
                 <button onClick={() => setIsFormOpen(false)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
                    <ArrowLeft size={16} /> Cancel
                 </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code</label>
                    <input required value={subjectCode} onChange={e => setSubjectCode(e.target.value)} className="w-full border p-2 rounded focus:ring-2 ring-brand-200 outline-none" placeholder="CS501" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Batch</label>
                    <select value={targetBatch} onChange={e => setTargetBatch(e.target.value as Batch)} className="w-full border p-2 rounded focus:ring-2 ring-brand-200 outline-none">
                      <option value={Batch.X}>Batch X</option>
                      <option value={Batch.Y}>Batch Y</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignment #</label>
                    <input required type="number" value={assignNum} onChange={e => setAssignNum(e.target.value)} className="w-full border p-2 rounded focus:ring-2 ring-brand-200 outline-none" placeholder="1" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-medium text-gray-900">Questions</h3>
                    <button type="button" onClick={addQuestionField} className="text-sm text-brand-600 hover:bg-brand-50 px-2 py-1 rounded">+ Add Question</button>
                  </div>
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3 relative group">
                      <span className="absolute top-2 right-2 text-xs text-gray-400 font-mono">Q{idx + 1}</span>
                      {questions.length > 1 && (
                          <button 
                             type="button" 
                             className="absolute top-2 right-10 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                             onClick={() => {
                                 const newQ = [...questions];
                                 newQ.splice(idx, 1);
                                 setQuestions(newQ);
                             }}
                          >
                            Remove
                          </button>
                      )}
                      <input required placeholder="Question Title" value={q.title || ''} className="w-full border p-2 rounded focus:ring-2 ring-brand-200 outline-none" onChange={e => handleQuestionChange(idx, 'title', e.target.value)} />
                      <textarea required placeholder="Problem Description" value={q.description || ''} className="w-full border p-2 rounded h-24 focus:ring-2 ring-brand-200 outline-none" onChange={e => handleQuestionChange(idx, 'description', e.target.value)} />
                      <div className="grid grid-cols-2 gap-4">
                         <select className="border p-2 rounded bg-white" value={q.expectedTimeComplexity || ''} onChange={e => handleQuestionChange(idx, 'expectedTimeComplexity', e.target.value)}>
                           <option value="">Expected Time Complexity</option>
                           <option value="O(1)">O(1)</option>
                           <option value="O(log n)">O(log n)</option>
                           <option value="O(n)">O(n)</option>
                           <option value="O(n log n)">O(n log n)</option>
                           <option value="O(n^2)">O(n^2)</option>
                         </select>
                         <select className="border p-2 rounded bg-white" value={q.expectedSpaceComplexity || ''} onChange={e => handleQuestionChange(idx, 'expectedSpaceComplexity', e.target.value)}>
                           <option value="">Expected Space Complexity</option>
                           <option value="O(1)">O(1)</option>
                           <option value="O(n)">O(n)</option>
                         </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                  <button type="submit" className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 shadow-sm">
                    <Save size={18} /> {editingId ? 'Save Changes' : 'Publish Assignment'}
                  </button>
                </div>
              </form>
            </div>
        ) : (
            // LIST VIEW
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">My Assignments</h2>
                        <p className="text-sm text-gray-500">Manage lab work for your students</p>
                    </div>
                    <button onClick={openCreateForm} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 shadow-sm transition-all">
                        <Plus size={18} /> Create New
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {myAssignments.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-gray-500">You haven't created any assignments yet.</p>
                            <button onClick={openCreateForm} className="mt-4 text-brand-600 font-medium hover:underline">Create your first one</button>
                        </div>
                    ) : (
                        myAssignments.map((assign) => (
                            <div key={assign.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-brand-200 transition-colors flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-bold rounded uppercase tracking-wider">{assign.subjectCode}</span>
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded">Batch {assign.batch}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">Assignment #{assign.assignmentNumber}</h3>
                                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                                        <span className="flex items-center gap-1"><Clock size={14}/> Created: {new Date(assign.createdAt || Date.now()).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1"><BookOpen size={14}/> {assign.questions.length} Questions</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                      onClick={() => openEditForm(assign)}
                                      className="p-2 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" 
                                      title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteAssignment(assign.id)}
                                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                                      title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )
      ) : (
        // --- MONITOR TAB ---
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><BookOpen size={20} /></div>
                   <h3 className="font-semibold text-gray-700">Total Assignments</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-green-100 rounded-lg text-green-600"><Users size={20} /></div>
                   <h3 className="font-semibold text-gray-700">Total Submissions</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{submissions.length}</p>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Activity size={20} /></div>
                   <h3 className="font-semibold text-gray-700">Pending Review</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {submissions.filter(s => s.score === null).length}
                </p>
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Student Submissions</h3>
                <p className="text-xs text-gray-500 mt-1">Click on a row to grade the submission.</p>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3">Student</th>
                      <th className="px-6 py-3">Assignment</th>
                      <th className="px-6 py-3">Question</th>
                      <th className="px-6 py-3">Complexity (T/S)</th>
                      <th className="px-6 py-3">Score</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No submissions yet.</td></tr>
                    ) : (
                      submissions.map((sub) => {
                         const assign = assignments.find(a => a.subjectCode === sub.subjectCode && a.assignmentNumber === sub.assignmentNumber);
                         const quest = assign?.questions.find(q => q.id === sub.questionId);
                         return (
                          <tr key={sub.id} className="bg-white border-b hover:bg-brand-50 cursor-pointer transition-colors" onClick={() => openGradingModal(sub)}>
                            <td className="px-6 py-4 font-medium text-gray-900">{sub.studentEmail}</td>
                            <td className="px-6 py-4">{sub.subjectCode} - A{sub.assignmentNumber}</td>
                            <td className="px-6 py-4 truncate max-w-xs">{quest?.title || 'Unknown'}</td>
                            <td className="px-6 py-4"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{sub.timeComplexity} / {sub.spaceComplexity}</span></td>
                            <td className="px-6 py-4">
                                {sub.score === null ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Unchecked</span>
                                ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">{sub.score}/10</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-gray-500">{new Date(sub.timestamp).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                <span className="text-brand-600 hover:text-brand-800 font-medium">Grade</span>
                            </td>
                          </tr>
                         );
                      })
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                  <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                      <div>
                          <h3 className="font-bold text-gray-900">Grading Submission</h3>
                          <p className="text-sm text-gray-500">{selectedSubmission.studentEmail}</p>
                      </div>
                      <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-gray-200 rounded-full">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                             <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><FileCode size={16}/> Source Code</h4>
                             <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono h-64 overflow-auto">{selectedSubmission.code}</pre>
                             <div className="mt-2 text-xs text-gray-500 flex gap-4">
                                <span>Language: {selectedSubmission.language}</span>
                                <span>Complexity: {selectedSubmission.timeComplexity} / {selectedSubmission.spaceComplexity}</span>
                             </div>
                          </div>
                          <div className="space-y-4">
                              <div>
                                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Terminal size={16}/> Input Provided</h4>
                                  <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg text-xs font-mono h-24 overflow-auto border">{selectedSubmission.input || "(No Input)"}</pre>
                              </div>
                              <div>
                                  <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Terminal size={16}/> Output Received</h4>
                                  <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg text-xs font-mono h-24 overflow-auto border">{selectedSubmission.output || "(No Output)"}</pre>
                              </div>
                          </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                          <label className="font-bold text-blue-900">Assign Grade (0-10):</label>
                          <div className="flex items-center gap-4">
                              <input 
                                  type="number" 
                                  min="0" 
                                  max="10" 
                                  value={gradeInput} 
                                  onChange={(e) => setGradeInput(e.target.value)}
                                  className="w-24 p-2 border border-blue-200 rounded text-center text-lg font-bold focus:ring-2 ring-blue-500 outline-none" 
                              />
                              <button 
                                  onClick={handleGradeSubmit}
                                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                              >
                                  Save Grade
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};