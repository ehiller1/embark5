import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jeezilcobzdayekigzvf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZXppbGNvYnpkYXlla2lnenZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTY2ODMsImV4cCI6MjA1OTM3MjY4M30.mjyNOhoEumZQL9Wwd146xmXM1xXTV-dqrq1iYz6f2-w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SupaTest() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleTest() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      setResult(data);
      setError(error);
    } catch (err) {
      setError(err);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Supabase Vite Test</h2>
      <button onClick={handleTest} disabled={loading}>
        {loading ? 'Loading...' : 'Run Supabase Query'}
      </button>
      <pre style={{ marginTop: 16, background: '#eee', padding: 12 }}>
        {result ? JSON.stringify(result, null, 2) : 'No result'}
      </pre>
      <pre style={{ color: 'red' }}>
        {error ? JSON.stringify(error, null, 2) : ''}
      </pre>
    </div>
  );
}
