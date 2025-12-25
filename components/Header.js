import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(data?.session?.user ?? null);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    // Redirects to Google OAuth flow and returns to the app
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
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
            <img src={user.user_metadata?.avatar_url || user?.avatar_url} alt="avatar" style={{width:28,height:28,borderRadius:14,marginRight:8}} />
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
