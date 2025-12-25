-- Policies for subjects table
ALTER TABLE IF EXISTS subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_subjects_authenticated" ON subjects
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "select_subjects" ON subjects
  FOR SELECT
  USING (true);

CREATE POLICY "delete_own_subjects" ON subjects
  FOR DELETE
  USING (auth.uid() = created_by OR auth.role() = 'service_role');

-- Policies for files table
ALTER TABLE IF EXISTS files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_files_authenticated" ON files
  FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "select_files" ON files
  FOR SELECT
  USING (true);

CREATE POLICY "delete_own_files" ON files
  FOR DELETE
  USING (auth.uid() = uploaded_by OR auth.role() = 'service_role');

-- Note: To allow server/service role inserts (when using the service role key), you can either
-- use the service role key from server-side logic (like in our API) or adjust policies accordingly.
