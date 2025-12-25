import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing Authorization' });

  // Validate user from access token
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) return res.status(401).json({ error: userErr?.message || 'Invalid token' });
  const userId = userData.user.id;

  const { subject_id, name, path, size, content_type } = req.body || {};
  if (!subject_id || !path) return res.status(400).json({ error: 'Missing required fields' });

  // Basic server-side validation
  if (size && size > 10 * 1024 * 1024) return res.status(400).json({ error: 'File too large (max 10 MB)' });

  // Ensure subject exists
  const { data: subj, error: subjErr } = await supabaseAdmin.from('subjects').select('id').eq('id', subject_id).maybeSingle();
  if (subjErr) return res.status(500).json({ error: subjErr.message });
  if (!subj) return res.status(400).json({ error: 'Subject not found' });

  const { data, error } = await supabaseAdmin.from('files').insert([{ subject_id, name, path, size, content_type, uploaded_by: userId }]).select();
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ data });
}
