import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, path } = req.body || {};
  if (!id && !path) return res.status(400).json({ error: 'Provide file id or path' });

  // Find file record if id provided
  let fileRec = null;
  if (id) {
    const { data, error } = await supabaseAdmin.from('files').select('*').eq('id', id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'File not found' });
    fileRec = data;
  }

  const filePath = path || fileRec.path;

  try {
    const { data: downloadData, error: dlErr } = await supabaseAdmin.storage.from('files').download(filePath);
    if (dlErr) return res.status(500).json({ error: dlErr.message });

    const buffer = await downloadData.arrayBuffer();
    const buf = Buffer.from(buffer);

    const { scanBuffer } = await import('../../lib/virusScanner');
    const result = await scanBuffer(buf);

    // update file record with scan results
    const { data: updated, error: upErr } = await supabaseAdmin.from('files').update({ scanned: true, infected: result.infected, scan_output: result.output, scanned_at: new Date() }).eq('id', id).select();
    if (upErr) return res.status(500).json({ error: upErr.message });

    return res.status(200).json({ data: updated, scan: result });
  } catch (err) {
    console.error('Error during scan', err);
    return res.status(500).json({ error: 'Scan failed' });
  }
}
