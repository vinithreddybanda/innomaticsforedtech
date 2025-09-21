-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('job-descriptions', 'job-descriptions', true),
  ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for job descriptions bucket
CREATE POLICY "Allow public read access to job descriptions" ON storage.objects
FOR SELECT USING (bucket_id = 'job-descriptions');

CREATE POLICY "Allow authenticated users to upload job descriptions" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'job-descriptions');

CREATE POLICY "Allow authenticated users to update job descriptions" ON storage.objects
FOR UPDATE USING (bucket_id = 'job-descriptions');

CREATE POLICY "Allow authenticated users to delete job descriptions" ON storage.objects
FOR DELETE USING (bucket_id = 'job-descriptions');

-- Create storage policies for resumes bucket
CREATE POLICY "Allow public upload to resumes" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Allow authenticated users to read resumes" ON storage.objects
FOR SELECT USING (bucket_id = 'resumes');

CREATE POLICY "Allow authenticated users to update resumes" ON storage.objects
FOR UPDATE USING (bucket_id = 'resumes');

CREATE POLICY "Allow authenticated users to delete resumes" ON storage.objects
FOR DELETE USING (bucket_id = 'resumes');
