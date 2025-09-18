import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidateApiClient } from '../../services/candidateApiClient';

const TakeAssessment = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState(0);
  const [warnMessage, setWarnMessage] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionTimers, setQuestionTimers] = useState([]); // 60s per question
  const tickRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  const ensureFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) return;
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Failed to enter fullscreen:', e);
    }
  }, []);

  // Keep screen awake if supported
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener?.('release', () => {
            console.log('Wake Lock was released');
          });
        }
      } catch (e) {
        console.warn('Wake Lock not available:', e);
      }
    };
    requestWakeLock();
    return () => {
      try { wakeLock && wakeLock.release && wakeLock.release(); } catch {}
    };
  }, []);

  const sendFlag = useCallback(async (type) => {
    try {
      if (!attempt) return;
      const res = await candidateApiClient.post(`/tests/${testId}/flag`, {
        attemptId: attempt._id,
        type,
        occurredAt: new Date().toISOString()
      });
      if (res.data?.data?.auto_submitted) {
        // Exit fullscreen and navigate out
        if (document.exitFullscreen) {
          try { await document.exitFullscreen(); } catch {}
        }
        navigate('/assessment-login');
      }
    } catch (e) {
      // Non-blocking
      console.warn('Proctor flag failed', e);
    }
  }, [attempt, testId, navigate]);

  useEffect(() => {
    // Try to enter fullscreen ASAP (still relies on prior user gesture from Precautions page)
    ensureFullscreen();

    const onChange = () => {
      if (!document.fullscreenElement) {
        // Immediately try to re-enter fullscreen
        ensureFullscreen();
        setWarnings((w) => w + 1);
        setWarnMessage('Fullscreen was exited. Please remain in fullscreen during the assessment.');
        sendFlag('fullscreen_exit');
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setWarnings((w) => w + 1);
        setWarnMessage('Tab/window switch detected. Please stay on the test page.');
        sendFlag('tab_switch');
      }
    };
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onCopy = () => {
      setWarnings((w) => w + 1);
      setWarnMessage('Copy action detected. Copy/paste is not allowed during the assessment.');
      sendFlag('copy_paste');
    };
    const onPaste = () => {
      setWarnings((w) => w + 1);
      setWarnMessage('Paste action detected. Copy/paste is not allowed during the assessment.');
      sendFlag('copy_paste');
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('copy', onCopy);
    window.addEventListener('paste', onPaste);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('paste', onPaste);
    };
  }, [ensureFullscreen, sendFlag]);

  useEffect(() => {
    const fetchTestOnly = async () => {
      setLoading(true);
      setError('');
      try {
        // Ensure fullscreen before network calls to minimize flicker
        await ensureFullscreen();
        const testRes = await candidateApiClient.get(`/tests/${testId}`);
        if (!testRes.data?.data?.test) throw new Error('Unable to fetch test');
        const t = testRes.data.data.test;
        setTest(t);
        const qCount = (t?.questionsPopulated || t?.questions || []).length || 0;
        if (qCount > 0) setQuestionTimers(Array(qCount).fill(60));
        setHasStarted(false);
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.message || e.message || 'Failed to start assessment');
      } finally {
        setLoading(false);
      }
    };

    fetchTestOnly();
  }, [testId, ensureFullscreen]);

  // Start attempt explicitly when user clicks Start
  const handleStart = async () => {
    if (!test) return;
    try {
      setSubmitting(true);
      const startRes = await candidateApiClient.post(`/tests/${testId}/start`);
      if (!startRes.data?.data) throw new Error('Unable to start test');
      setAttempt(startRes.data.data.attempt || startRes.data.data);
      // Initialize timers if not
      const qCount = (test?.questionsPopulated || test?.questions || []).length || 0;
      if (!questionTimers || questionTimers.length === 0) setQuestionTimers(Array(qCount).fill(60));
      setHasStarted(true);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to start assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // Per-question ticking
  useEffect(() => {
    if (!attempt || !hasStarted) return;
    if (!Array.isArray(questionTimers) || questionTimers.length === 0) return;
    tickRef.current = setInterval(() => {
      setQuestionTimers(prev => {
        if (!prev || prev.length === 0) return prev;
        const next = [...prev];
        const current = next[currentIndex] ?? 60;
        if (current <= 1) {
          next[currentIndex] = 0;
          // Auto-advance or submit
          if (currentIndex < ((test?.questionsPopulated || test?.questions || []).length - 1)) {
            setCurrentIndex(i => i + 1);
          } else {
            handleSubmit();
          }
        } else {
          next[currentIndex] = current - 1;
        }
        return next;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [attempt, hasStarted, currentIndex, questionTimers.length]);

  const handleAnswer = async (questionId, optionIdOrLetter) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIdOrLetter }));
    // Auto-save
    try {
      await candidateApiClient.post(`/tests/${testId}/answer`, {
        attemptId: attempt._id,
        questionId,
        answer: optionIdOrLetter
      });
    } catch (e) {
      // Non-blocking, allow progression
      console.warn('Save answer failed', e);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    setSubmitting(true);
    setError('');
    try {
      // Submit each answer (simple serial submission)
      for (const questionId of Object.keys(answers)) {
        await candidateApiClient.post(`/tests/${testId}/answer`, {
          attemptId: attempt._id,
          questionId,
          answer: answers[questionId]
        });
      }
      // Final submit
      const submitRes = await candidateApiClient.post(`/tests/${testId}/submit`, {
        attemptId: attempt._id
      });
      if (submitRes.data?.success) {
        // Exit fullscreen after submit
        if (document.exitFullscreen) {
          try { await document.exitFullscreen(); } catch {}
        }
        // Show thank-you modal, then redirect
        setShowThanks(true);
        setTimeout(() => {
          navigate('/assessment-login');
        }, 3000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (e) {
      console.error('Submit error', e);
      setError(e?.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-gray-600">Preparing your assessment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white p-6 rounded shadow">
          <div className="text-red-600 mb-4">{error}</div>
          <button onClick={() => navigate('/assessment-login')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded px-4 py-2">Back</button>
        </div>
      </div>
    );
  }

  // Normalize questions array
  const questions = (test?.questionsPopulated || test?.questions || []).map(q => q.question ? q : q);
  const total = questions.length;
  const current = questions[currentIndex] || {};
  const qId = current._id || current.id;
  const options = current.options || [];
  const currentSeconds = questionTimers[currentIndex] ?? 60;
  const progress = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  // Pre-start instruction screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
          <h1 className="text-2xl font-bold mb-2">{test?.title || 'Assessment'}</h1>
          <p className="text-gray-600 mb-6">Please review the instructions below before starting your assessment.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded border">
              <div className="text-sm text-gray-500">Total Questions</div>
              <div className="text-2xl font-semibold">{total}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded border">
              <div className="text-sm text-gray-500">Time Per Question</div>
              <div className="text-2xl font-semibold">1 min</div>
            </div>
            <div className="p-4 bg-gray-50 rounded border">
              <div className="text-sm text-gray-500">Total Estimated Time</div>
              <div className="text-2xl font-semibold">{total} min</div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">Instructions</h2>
            <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
              <li>Stay in fullscreen during the assessment.</li>
              <li>You have 1 minute per question; unanswered questions are skipped automatically.</li>
              <li>You cannot go back to previous questions.</li>
              <li>Your answers are saved automatically when selected.</li>
              <li>The test will submit automatically when the last question's time ends.</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <button onClick={handleStart} disabled={submitting || total === 0} className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded">
              {submitting ? 'Starting…' : (total === 0 ? 'No Questions Available' : 'Start Assessment')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        {showThanks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-center">
              <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
              <p className="text-gray-700 mb-4">Thanks for taking the assessment. Our team will review your responses and get back to you soon.</p>
              <p className="text-sm text-gray-500">You will be redirected shortly...</p>
            </div>
          </div>
        )}
        {warnings > 0 && (
          <div className="mb-4 p-3 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm">
            Warning: {warnMessage} (Total warnings: {warnings})
          </div>
        )}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{test?.title || 'Assessment'}</h1>
              <p className="text-gray-600">Question {Math.min(currentIndex + 1, total)} of {total}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Time for this question</div>
              <div className={`text-xl font-mono ${currentSeconds <= 10 ? 'text-red-600' : currentSeconds <= 20 ? 'text-yellow-600' : 'text-green-600'}`}>{Math.floor(currentSeconds / 60)}:{String(currentSeconds % 60).padStart(2, '0')}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 rounded">
              <div className="h-2 bg-blue-600 rounded" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Single-question view */}
        <div className="space-y-6">
          <div key={qId} className="border rounded p-4">
            <div className="font-medium mb-3">{currentIndex + 1}. {current.question || 'Question'}</div>
            <div className="space-y-2">
              {options.map((opt, idx) => {
                const key = opt._id || `${qId}-${idx}`;
                const label = String.fromCharCode(65 + idx);
                const value = opt._id || opt.text || label;
                const selected = answers[qId] === value;
                const text = opt.text || '';
                return (
                  <label key={key} className={`flex items-center gap-3 p-2 rounded border ${selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                    <input
                      type="radio"
                      name={`q-${qId}`}
                      checked={selected}
                      onChange={() => handleAnswer(qId, value)}
                    />
                    <span><strong>{label}.</strong> {text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          {currentIndex < (total - 1) ? (
            <button
              onClick={() => setCurrentIndex(i => i + 1)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeAssessment;
