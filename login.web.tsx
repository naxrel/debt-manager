import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';

export default function LoginWeb() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const success = await login(username, password);
    setIsLoading(false);
    if (success) {
      router.replace('/(tabs)/home');
    } else {
      setError('Username atau password salah');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <form onSubmit={handleLogin} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px #0001', minWidth: 320 }}>
        <h2 style={{ textAlign: 'center', color: '#2563eb', marginBottom: 24 }}>Login</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#333' }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }}
            disabled={isLoading}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: '#333' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }}
            disabled={isLoading}
          />
        </div>
        {error && <div style={{ color: '#ef4444', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <button
          type="submit"
          style={{ width: '100%', background: '#2563eb', color: '#fff', padding: 12, border: 'none', borderRadius: 6, fontSize: 16, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', marginBottom: 8 }}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Login'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ color: '#666' }}>Belum punya akun? </span>
          <a href="/auth/register" style={{ color: '#2563eb', fontWeight: 600 }}>Register</a>
        </div>
      </form>
    </div>
  );
}
