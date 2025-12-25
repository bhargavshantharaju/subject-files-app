import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [filesList, setFilesList] = useState([]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) fetchFiles(selectedSubject.id);
    else setFilesList([]);
  }, [selectedSubject]);

  async function fetchSubjects() {
    let { data, error } = await supabase.from('subjects').select('*').order('created_at', { ascending: false });
    if (error) return setMessage(error.message);

    // If no subjects exist yet, create a default one named 'UPANYAS'
    if (!data || data.length === 0) {
      const { data: ins, error: insErr } = await supabase.from('subjects').insert([{ name: 'UPANYAS' }]).select();
      if (insErr) return setMessage(insErr.message);
      data = ins;
    }

    setSubjects(data || []);

    // Automatically select UPANYAS if present, otherwise the first subject
    if (!selectedSubject && data && data.length > 0) {
      const defaultSub = data.find(s => s.name === 'UPANYAS') || data[0];
      setSelectedSubject(defaultSub);
    }
  }

  async function createSubject(e) {
    e.preventDefault();
    if (!newSubject) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;

    const { data, error } = await supabase.from('subjects').insert([{ name: newSubject, created_by: userId }]).select();
    if (error) return setMessage(error.message);
    setNewSubject('');
    fetchSubjects();
  }

  async function fetchFiles(subjectId) {
    const { data, error } = await supabase.from('files').select('*').eq('subject_id', subjectId).order('uploaded_at', { ascending: false });
    if (error) return setMessage(error.message);
    setFilesList(data || []);
  }

  async function uploadFile(e) {
    e.preventDefault();
    if (!file || !selectedSubject) return setMessage('Select a subject and file');

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id ?? null;
    if (!userId) return setMessage('You must be signed in to upload');

    const filePath = `${selectedSubject.name}/${Date.now()}_${file.name}`;

    // upload to the 'files' bucket
    const { error: uploadError } = await supabase.storage.from('files').upload(filePath, file, { upsert: false });
    if (uploadError) return setMessage(uploadError.message);

    // insert metadata
    const { error: metaError } = await supabase.from('files').insert([{ subject_id: selectedSubject.id, name: file.name, path: filePath, size: file.size, content_type: file.type, uploaded_by: userId }]);
    if (metaError) return setMessage(metaError.message);

    setMessage('Uploaded');
    setFile(null);
    fetchFiles(selectedSubject.id);
  }

  async function getDownloadUrl(path) {
    // Use server-side endpoint to create a signed URL using the service role key
    const res = await fetch('/api/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, expires: 60 })
    });
    const payload = await res.json();
    if (!res.ok) {
      setMessage(payload?.error || 'Failed to get download URL');
      return null;
    }
    return payload.url;
  }

  return (
    <div>
      <Header />
      <main style={{padding:20}}>
        <section style={{marginBottom:20}}>
          <form onSubmit={createSubject}>
            <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="New subject name" />
            <button type="submit">Create Subject</button>
          </form>
        </section>

        <section style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          <div>
            <h2>Subjects</h2>
            <ul>
              {subjects.map(s => (
                <li key={s.id} style={{marginBottom:8}}>
                  <button onClick={() => setSelectedSubject(s)} style={{fontWeight: selectedSubject?.id === s.id ? 'bold' : 'normal'}}>{s.name}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>{selectedSubject ? `Files in ${selectedSubject.name}` : 'Upload to Subject'}</h2>
            {selectedSubject ? (
              <div>
                <p>Selected: {selectedSubject.name}</p>
                <form onSubmit={uploadFile}>
                  <input type="file" onChange={e => setFile(e.target.files[0])} />
                  <button type="submit">Upload</button>
                </form>

                <h3 style={{marginTop:16}}>Files</h3>
                <ul>
                  {filesList.map(f => (
                    <li key={f.id} style={{marginBottom:8}}>
                      <strong>{f.name}</strong> — {Math.round((f.size||0)/1024)} KB — uploaded by {f.uploaded_by || 'unknown'} at {new Date(f.uploaded_at).toLocaleString()}
                      <button style={{marginLeft:8}} onClick={async () => {
                        const url = await getDownloadUrl(f.path);
                        if (url) window.open(url, '_blank');
                      }}>Download</button>
                    </li>
                  ))}
                </ul>

              </div>
            ) : (
              <p>Select a subject to upload files.</p>
            )}
            <p style={{color:'green'}}>{message}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
