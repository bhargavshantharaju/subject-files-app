import { useEffect, useState } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabaseClient';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
    })();
  }, []);

  async function fetchFiles() {
    const { data, error } = await supabase.from('files').select('*').order('uploaded_at', { ascending: false });
    if (error) return setMessage(error.message);
    setFiles(data || []);
  }

  useEffect(() => { fetchFiles(); }, []);

  async function rescan(f) {
    setMessage('Rescanning...');
    const res = await fetch('/api/scan-file', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: f.id })});
    const payload = await res.json();
    if (!res.ok) setMessage(payload?.error || 'Rescan failed');
    else { setMessage('Rescan complete'); fetchFiles(); }
  }

  // Very simple admin access control: set env var NEXT_PUBLIC_ADMIN_EMAILS (comma-separated)
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!user || (adminEmails.length && !adminEmails.includes(user.email))) {
    return (
      <div>
        <Header />
        <main style={{padding:20}}>You must be an admin to view this page.</main>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main style={{padding:20}}>
        <h2>Admin - Files</h2>
        <p style={{color:'green'}}>{message}</p>
        <table border={1} cellPadding={8} style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr><th>Name</th><th>Subject</th><th>Uploader</th><th>Size</th><th>Scanned</th><th>Infected</th><th>Scan Output</th><th>Actions</th></tr></thead>
          <tbody>
            {files.map(f => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.subject_id}</td>
                <td>{f.uploaded_by}</td>
                <td>{Math.round((f.size||0)/1024)} KB</td>
                <td>{String(f.scanned)}</td>
                <td>{String(f.infected)}</td>
                <td><pre style={{whiteSpace:'pre-wrap',maxWidth:400}}>{f.scan_output}</pre></td>
                <td><button onClick={() => rescan(f)}>Re-scan</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
