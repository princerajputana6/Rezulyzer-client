import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { candidateApiClient } from '../../services/candidateApiClient';

const CandidateDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const qpTestId = params.get('testId');
  const qpAttemptId = params.get('attemptId');
  const [testId, setTestId] = useState(qpTestId || null);
  const [attemptId, setAttemptId] = useState(qpAttemptId || null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fallback to sessionStorage if query params are not present
    try {
      if (!qpTestId) {
        const sTest = sessionStorage.getItem('dash_test_id');
        if (sTest) setTestId(sTest);
      }
      if (!qpAttemptId) {
        const sAtt = sessionStorage.getItem('dash_attempt_id');
        if (sAtt) setAttemptId(sAtt);
      }
    } catch {}
  }, [qpTestId, qpAttemptId]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        if (!testId) {
          setError('Missing test information.');
          setLoading(false);
          return;
        }
        const res = await candidateApiClient.get(`/tests/${testId}/results`, {
          params: attemptId ? { attemptId } : {}
        });
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load results');
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [testId, attemptId]);

  const test = data?.test;
  const attempt = data?.attempt;
  const totalQuestions = data?.analysis?.totalQuestions || 0;
  const correctAnswers = data?.analysis?.correctAnswers || 0;
  const percentage = attempt?.percentage ?? Math.round((correctAnswers / Math.max(totalQuestions,1)) * 100);
  const completedAt = attempt?.completedAt ? new Date(attempt.completedAt) : null;
  const startedAt = attempt?.startedAt ? new Date(attempt.startedAt) : null;
  const timeSpent = attempt?.timeSpent || (completedAt && startedAt ? Math.round((completedAt - startedAt) / 60000) : null);

  const answersByQuestion = useMemo(() => {
    const arr = Array.isArray(attempt?.answers) ? attempt.answers : [];
    const byId = {};
    arr.forEach(a => { byId[a.questionId] = a; });
    return byId;
  }, [attempt]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-6 rounded shadow">
          <div className="text-red-600 mb-4">{error}</div>
          <div className="space-y-2">
            <button onClick={() => navigate('/assessment-login')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded px-4 py-2">Back</button>
            <button onClick={() => { try { const sTest = sessionStorage.getItem('dash_test_id'); const sAtt = sessionStorage.getItem('dash_attempt_id'); if (sTest) setTestId(sTest); if (sAtt) setAttemptId(sAtt); } catch {} }} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded px-4 py-2">Retry with saved context</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Assessment Dashboard</h1>
            <p className="text-gray-600">Summary of your latest assessment</p>
          </div>
          <div className="text-sm text-gray-500">{completedAt ? `Completed on ${completedAt.toLocaleString()}` : (startedAt ? `Started on ${startedAt.toLocaleString()}` : '')}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded border">
            <div className="text-sm text-gray-500">Assessment</div>
            <div className="text-lg font-semibold truncate" title={test?.title || 'N/A'}>{test?.title || 'N/A'}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded border">
            <div className="text-sm text-gray-500">Score</div>
            <div className="text-lg font-semibold">{attempt?.score ?? correctAnswers}/{totalQuestions}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded border">
            <div className="text-sm text-gray-500">Percentage</div>
            <div className="text-lg font-semibold">{percentage}%</div>
          </div>
          <div className="p-4 bg-gray-50 rounded border">
            <div className="text-sm text-gray-500">Time Spent</div>
            <div className="text-lg font-semibold">{timeSpent != null ? `${timeSpent} min` : '—'}</div>
          </div>
        </div>

        {/* Per-question breakdown when available */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Question Breakdown</h2>
          <div className="overflow-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 border-b">#</th>
                  <th className="text-left p-2 border-b">Question</th>
                  <th className="text-left p-2 border-b">Your Answer</th>
                  <th className="text-left p-2 border-b">Result</th>
                </tr>
              </thead>
              <tbody>
                {(test?.questions || []).map((q, idx) => {
                  const a = answersByQuestion[q._id];
                  const result = a?.isCorrect == null ? '—' : a.isCorrect ? 'Correct' : 'Incorrect';
                  return (
                    <tr key={q._id} className="odd:bg-white even:bg-gray-50">
                      <td className="p-2 border-b">{idx + 1}</td>
                      <td className="p-2 border-b max-w-xl">
                        <div className="truncate" title={q.question}>{q.question}</div>
                      </td>
                      <td className="p-2 border-b">{a?.answer ?? '—'}</td>
                      <td className={`p-2 border-b ${a?.isCorrect === true ? 'text-green-600' : a?.isCorrect === false ? 'text-red-600' : 'text-gray-500'}`}>{result}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">Next Steps</h2>
          <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
            <li>Keep your email accessible for any updates from the recruiter.</li>
            <li>Review your result summary and prepare for potential follow-ups.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/assessment-login')} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded">Exit</button>
          {testId && (
            <a href={`/api/tests/${testId}/results${attempt?`?attemptId=${attempt._id||attempt.id}`:''}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Download Summary (API)</a>
          )}
          {testId && attempt && (
            <>
              <a href={`/api/tests/${testId}/proctoring/export?attemptId=${attempt._id||attempt.id}&format=csv`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Proctoring CSV</a>
              <a href={`/api/tests/${testId}/proctoring/export?attemptId=${attempt._id||attempt.id}&format=pdf`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded">Proctoring PDF</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
