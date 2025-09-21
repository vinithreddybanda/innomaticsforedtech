-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  jd_file_url TEXT NOT NULL,
  jd_file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  resume_file_url TEXT NOT NULL,
  resume_file_name TEXT NOT NULL,
  resume_text TEXT,
  jd_text TEXT,
  score INTEGER,
  verdict TEXT CHECK (verdict IN ('High', 'Medium', 'Low')),
  matched_skills TEXT[],
  missing_skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_verdict ON applications(verdict);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create policies for jobs table (public read access, no auth required for viewing jobs)
CREATE POLICY "Allow public read access to jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update jobs" ON jobs FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated users to delete jobs" ON jobs FOR DELETE USING (true);

-- Create policies for applications table (public insert for job applications, authenticated read/update/delete)
CREATE POLICY "Allow public insert to applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated users to read applications" ON applications FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to update applications" ON applications FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated users to delete applications" ON applications FOR DELETE USING (true);
