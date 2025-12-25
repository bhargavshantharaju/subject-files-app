import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

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
    const { data, error } = await supabase.from('subjects').insert([{ name: newSubject }]).select();
    if (error) setMessage(error.message);
    else {
      setNewSubject('');
      fetchSubjects();
    }
  }

  async function uploadFile(e) {
    e.preventDefault();
    if (!file || !selectedSubject) return setMessage('Select a subject and file');
    const filePath = `${selectedSubject.name}/${Date.now()}_${file.name}`;

    // upload to the 'files' bucket
    const { error: uploadError } = await supabase.storage.from('files').upload(filePath, file, { upsert: false });
    if (uploadError) return setMessage(uploadError.message);

    // insert metadata
    const { error: metaError } = await supabase.from('files').insert([{ subject_id: selectedSubject.id, name: file.name, path: filePath, size: file.size, content_type: file.type }]);
    if (metaError) return setMessage(metaError.message);

    setMessage('Uploaded');
    setFile(null);
    fetchSubjects();
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
            <h2>Upload to Subject</h2>
            {selectedSubject ? (
              <div>
                <p>Selected: {selectedSubject.name}</p>
                <form onSubmit={uploadFile}>
                  <input type="file" onChange={e => setFile(e.target.files[0])} />
                  <button type="submit">Upload</button>
                </form>
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
