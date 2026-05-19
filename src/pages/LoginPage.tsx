import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Radio, LogIn, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState('werner.nienaber@hpesa.com');
  const [password, setPassword] = useState('password123');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl mb-4">
            <Radio className="w-7 h-7 text-[#1F4E78]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HPE Asset Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">RFID Asset Tracking &amp; Condition Monitoring</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1F4E78]"
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1F4E78] text-white rounded-lg font-medium hover:bg-[#19406a] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-xs text-gray-400">Single sign-on via HPE Active Directory</p>
        </form>
      </div>
    </div>
  );
}
