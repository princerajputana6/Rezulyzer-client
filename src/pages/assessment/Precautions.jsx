import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { candidateApiClient } from '../../services/candidateApiClient';

const Precautions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const queryTestId = params.get('testId');

  const [status, setStatus] = useState({ camera: false, microphone: false, location: false, fullscreen: false });
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    // Add listeners to discourage tab switch
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        console.warn('Tab hidden during precautions');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const requestPermissions = async () => {
    setError('');
    setWorking(true);
    try {
      // Request camera & mic
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setStatus((s) => ({ ...s, camera: true, microphone: true }));
      } catch (e) {
        console.error('Media permission error', e);
        setError('Please allow camera and microphone permissions to continue.');
        setWorking(false);
        return;
      }

      // Request location
      await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
        navigator.geolocation.getCurrentPosition(
          () => { setStatus((s) => ({ ...s, location: true })); resolve(); },
          (err) => { console.error('Location permission error', err); reject(err); },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }).catch(() => { throw new Error('Please allow location permission to continue.'); });

      // Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setStatus((s) => ({ ...s, fullscreen: true }));
      }

      // Determine testId: use query or fetch latest
      let testId = queryTestId;
      if (!testId) {
        try {
          const res = await candidateApiClient.get('/candidate/me/latest-test');
          testId = res.data?.data?.testId;
        } catch (e) {
          console.error('Fetch latest test failed', e);
        }
      }
      if (!testId) {
        setError('No assigned test found. Please contact your administrator.');
        setWorking(false);
        return;
      }

      navigate(`/assessment/take/${testId}`);
    } catch (err) {
      setError(err.message || 'Failed to acquire permissions.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Before You Begin</h1>
        <p className="text-gray-600 mb-4">To ensure test integrity, we need the following permissions:</p>
        <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700">
          <li>Camera and Microphone access for proctoring</li>
          <li>Location access for compliance</li>
          <li>Fullscreen mode to minimize distractions</li>
        </ul>
        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-sm">
          <div className={`p-3 rounded border ${status.camera ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Camera: {status.camera ? 'Allowed' : 'Pending'}</div>
          <div className={`p-3 rounded border ${status.microphone ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Mic: {status.microphone ? 'Allowed' : 'Pending'}</div>
          <div className={`p-3 rounded border ${status.location ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Location: {status.location ? 'Allowed' : 'Pending'}</div>
          <div className={`p-3 rounded border ${status.fullscreen ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Fullscreen: {status.fullscreen ? 'On' : 'Pending'}</div>
        </div>
        <button
          onClick={requestPermissions}
          disabled={working}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded px-4 py-2"
        >
          {working ? 'Preparing...' : 'Allow & Continue'}
        </button>
      </div>
    </div>
  );
};

export default Precautions;
