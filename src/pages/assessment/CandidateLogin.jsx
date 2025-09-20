import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { candidateApiClient } from '../../services/candidateApiClient';

const CandidateLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token'); // New: Get token from URL
  const initialTestId = params.get('testId');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [validatingToken, setValidatingToken] = useState(false);

  useEffect(() => {
    // Clear any previous candidate token when landing here
    localStorage.removeItem('candidate_token');
    
    // If token is provided, validate it and get candidate info
    if (token) {
      validateAssessmentToken();
    } else {
      setError('No assessment token provided. Please use the link from your email.');
    }
  }, [token]);

  const validateAssessmentToken = async () => {
    setValidatingToken(true);
    setError('');
    
    try {
      const response = await candidateApiClient.get(`/candidates/assessment/validate/${token}`);
      
      if (response.data.success) {
        const candidate = response.data.data;
        setCandidateInfo(candidate);
        setEmail(candidate.email); // Pre-fill email
        
        if (candidate.pendingTests.length === 0) {
          setError('No pending assessments found for this candidate.');
        }
      } else {
        setError(response.data.message || 'Invalid assessment token');
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setError(err.response?.data?.message || 'Invalid or expired assessment token');
    } finally {
      setValidatingToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!token) {
      setError('Assessment token is missing');
      setLoading(false);
      return;
    }
    
    try {
      // Use new assessment login API
      const res = await candidateApiClient.post('/candidates/assessment/login', { 
        token, 
        email, 
        password 
      });
      
      if (res.data?.success && res.data?.data?.sessionToken) {
        // Store session token for assessment
        localStorage.setItem('candidate_token', res.data.data.sessionToken);
        localStorage.setItem('candidate_info', JSON.stringify(res.data.data));
        sessionStorage.setItem('assessment_token', token); // Store assessment token for later use
        
        // If candidate already completed test, skip precautions and go to dashboard
        try {
          let testIdToCheck = initialTestId;
          if (!testIdToCheck && token) {
            // Validate token to discover pending tests / assigned test id
            const v = await candidateApiClient.get(`/candidates/assessment/validate/${token}`);
            const first = v.data?.data?.pendingTests?.[0];
            const t = first?.testId;
            const derivedId = t && typeof t === 'object' ? (t._id || t.id) : t;
            if (derivedId) testIdToCheck = derivedId;
          }

          if (testIdToCheck) {
            try {
              const resultsRes = await candidateApiClient.get(`/tests/${testIdToCheck}/results`);
              if (resultsRes.data?.success && resultsRes.data?.data?.attempt) {
                const attempt = resultsRes.data.data.attempt;
                try {
                  sessionStorage.setItem('dash_test_id', testIdToCheck);
                  sessionStorage.setItem('dash_attempt_id', attempt._id || attempt.id);
                } catch {}
                navigate('/assessment/dashboard');
                return;
              }
            } catch (e) {
              // 404: no completed attempt, continue to precautions
            }
          }
        } catch (checkErr) {
          // Non-blocking; fall back to normal flow
        }

        // Navigate to assessment precautions or directly to test
        const nextUrl = initialTestId
          ? `/assessment/precautions?testId=${initialTestId}&token=${token}`
          : `/assessment/precautions?token=${token}`;
        navigate(nextUrl);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900">Validating Assessment Token</h2>
          <p className="text-sm text-gray-600 mt-2">Please wait while we verify your assessment invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Assessment Login</h1>
        
        {candidateInfo ? (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">Welcome, {candidateInfo.name}!</h3>
            <p className="text-sm text-blue-700 mt-1">
              You have {candidateInfo.pendingTests.length} pending assessment(s)
            </p>
            {candidateInfo.tokenExpiry && (
              <p className="text-xs text-blue-600 mt-1">
                Token expires: {new Date(candidateInfo.tokenExpiry).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600 mb-6">Use the credentials shared via email to continue.</p>
        )}
        
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
        )}
        
        {candidateInfo && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="you@example.com"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Email is pre-filled from your invitation</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password from email"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Use the password provided in your assessment email</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded px-4 py-2 transition-colors"
            >
              {loading ? 'Signing in...' : 'Start Assessment'}
            </button>
          </form>
        )}
        
        {!candidateInfo && !validatingToken && (
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don't have an assessment link? Contact your recruiter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateLogin;
