// apps/web/src/modules/auth/pages/LoginPage.jsx
// Deliberately minimal (Ch.9 "simplest working implementation") — email
// + password via Supabase Auth directly. No signup flow here; store
// owners/associates are expected to be created via the Supabase
// dashboard (or a future admin invite flow) rather than self-signup,
// consistent with this being internal store software, not a public app.
import { useState } from 'react';
import supabase from '../../../shared/utils/supabaseClient';

export default function LoginPage({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');

  const handleLogin = async () => {
    setStatus('loading');
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setStatus('idle');
      return;
    }
    setStatus('done');
    onLoggedIn?.();
  };

  return (
    <div className="w-full px-4 py-6 max-w-sm mx-auto mt-12">
      <h1 className="text-lg font-semibold mb-4 text-center">Scaleeasy</h1>
      <div className="space-y-3">
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          type="email" placeholder="Email"
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          type="password" placeholder="Password"
          value={password} onChange={e => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={handleLogin}
          disabled={!email || !password || status === 'loading'}
          className="w-full px-4 py-2 bg-[#1F4E5C] text-white rounded-lg text-sm disabled:opacity-50"
        >
          {status === 'loading' ? 'Signing in…' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}
