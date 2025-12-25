import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { path, expires = 60 } = req.body;
  if (!path) return res.status(400).json({ error: 'Missing path' });

  const { data, error } = await supabaseAdmin.storage.from('files').createSignedUrl(path, expires);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ url: data.signedUrl });
}
