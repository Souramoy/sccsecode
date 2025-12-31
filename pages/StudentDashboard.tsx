import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Assignment, Submission } from '../types';
import { Link } from 'react-router-dom';
import { Code, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  useEffect(() => {
    const load = async () => {
      if (user?.batch) {
        const [assignData, subData] = await Promise.all([
           api.getAssignments(user.batch),
           api.getSubmissions(user.email, 'student')
        ]);
        setAssignments(assignData);
        setSubmissions(subData);
      }
    };
    load();
  }, [user]);

  const subjects = ['All', ...Array.from(new Set(assignments.map(a => a.subjectCode)))];
  
  const filteredAssignments = selectedSubject === 'All' 
    ? assignments 
    : assignments.filter(a => a.subjectCode === selectedSubject);

  const getQuestionStatus = (qId: string) => {
    const sub = submissions.find(s => s.questionId === qId);
    if (!sub) return 'pending';
    return sub.score !== null ? 'graded' : 'submitted';
  };

  const getScoreDisplay = (qId: string) => {
     const sub = submissions.find(s => s.questionId === qId);
     if (!sub) return null;
     if (sub.score === null) return <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded text-xs font-bold">Unchecked</span>;
     return <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs font-bold">{sub.score}/10</span>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Lab Assignments</h1>
        <p className="text-gray-500">Batch {user?.batch}</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
         {subjects.map(subj => (
           <button
             key={subj}
             onClick={() => setSelectedSubject(subj)}
             className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
               selectedSubject === subj 
                 ? 'bg-brand-600 text-white' 
                 : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
             }`}
           >
             {subj}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredAssignments.map((assign) => (
          <div key={assign.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <div className="flex justify-between items-start mb-4">
                <div>
                   <span className="inline-block px-2 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded mb-2">{assign.subjectCode}</span>
                   <h2 className="text-lg font-bold text-gray-900">Assignment #{assign.assignmentNumber}</h2>
                   <p className="text-sm text-gray-500">Contains {assign.questions.length} problems</p>
                </div>
             </div>
             
             <div className="space-y-3 mt-4">
                {assign.questions.map(q => {
                   const status = getQuestionStatus(q.id);
                   return (
                     <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-brand-200 transition-colors">
                        <div className="flex items-center gap-3">
                           {status === 'graded' ? (
                             <CheckCircle className="text-green-500 h-5 w-5" />
                           ) : status === 'submitted' ? (
                             <Clock className="text-blue-500 h-5 w-5" />
                           ) : (
                             <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                           )}
                           <span className="font-medium text-gray-800">{q.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           {getScoreDisplay(q.id)}
                           <Link 
                             to={`/editor/${assign.subjectCode}/${assign.assignmentNumber}/${q.id}`}
                             state={{ question: q }}
                             className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors"
                           >
                             {status === 'pending' ? 'Solve' : 'View Code'}
                           </Link>
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        ))}

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
             <Code className="mx-auto h-12 w-12 text-gray-300 mb-3" />
             <p className="text-gray-500">No assignments found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};