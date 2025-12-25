import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = supabase.auth.getSession().then(r => r.data.session);
    session && session.then(s => setUser(s?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function signIn() {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <header style={{display:'flex',gap:12,alignItems:'center',padding:12}}>
      <h1 style={{margin:0}}>Subject Files</h1>
      <div style={{marginLeft:'auto'}}>
        {user ? (
          <>
            <span style={{marginRight:8}}>{user.email}</span>
            <button onClick={signOut}>Sign out</button>
          </>
        ) : (
          <button onClick={signIn}>Sign in with Google</button>
        )}
      </div>
    </header>
  );
}
