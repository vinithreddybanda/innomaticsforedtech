# Innomatics Research Labs - Automated Resume Evaluation System

## 🎯 Problem Statement

At Innomatics Research Labs, the placement process faces significant challenges across our four locations (Hyderabad, Bangalore, Pune, and Delhi NCR):

### Current Challenges
- **Volume Overload**: 18-20 job requirements received weekly, each attracting thousands of applications
- **Manual Processing**: Recruiters and mentors manually review every resume, taking 15-30 minutes per evaluation
- **Inconsistent Evaluation**: Different evaluators interpret job requirements differently, leading to inconsistent candidate assessments
- **Resource Strain**: High workload prevents placement staff from focusing on interview preparation and student guidance
- **Time Pressure**: Hiring companies demand fast, high-quality shortlists, but manual processes cause delays

### Business Impact
- Delayed candidate shortlisting affecting company relationships
- Inconsistent quality in candidate evaluation
- Overwhelmed placement team leading to burnout
- Missed opportunities due to slow response times
- Inability to scale with growing application volumes

## 🚀 Solution Approach

We developed an AI-powered automated resume evaluation system that transforms the manual process into an intelligent, scalable solution.

### Key Innovation Areas

#### 1. **Intelligent Document Processing**
- **Multi-format Support**: Processes PDF, DOCX, PPTX, and XLSX files
- **Advanced Text Extraction**: Uses `office-text-extractor` library for accurate content parsing
- **Server-side Processing**: Handles large files efficiently without client-side limitations

#### 2. **AI-Powered Analysis Engine**
- **Advanced AI Model**: Groq's Llama-3.3-70B-Versatile for sophisticated resume analysis
- **Semantic Matching**: Goes beyond keyword matching to understand context and relevance
- **Structured Evaluation**: Provides scored assessments with detailed skill breakdown

#### 3. **Comprehensive Analytics Dashboard**
- **Real-time Insights**: Live application trends and score distributions
- **Interactive Visualizations**: AG Charts integration for professional data presentation
- **Actionable Intelligence**: Identifies skill gaps and market trends for student guidance

#### 4. **Scalable Architecture**
- **Modern Tech Stack**: Next.js 14 with TypeScript for type-safe, performant application
- **Cloud Database**: Supabase integration for reliable data storage and authentication
- **Production-Ready**: Built with error handling, security, and scalability in mind

## 🛠 Technology Stack

- **Frontend**: Next.js 14.2.32 with React 18 and TypeScript
- **Backend**: Next.js API Routes with server-side processing
- **Database**: Supabase (PostgreSQL) with real-time capabilities  
- **AI Engine**: Groq AI with Llama-3.3-70B-Versatile model
- **Document Processing**: office-text-extractor for multi-format support
- **Visualization**: ag-charts-react for interactive charts
- **Styling**: Tailwind CSS with Shadcn/ui component library
- **Authentication**: Supabase Auth for secure admin access

## ⚡ Installation Steps

### Prerequisites
Ensure you have the following installed:
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd innomaticsforedtech
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq AI Configuration
GROQ_API_KEY=your_groq_api_key
```

#### Getting API Keys:

**Supabase Setup:**
1. Visit [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Settings > API to find your URL and anon key

**Groq AI Setup:**
1. Visit [console.groq.com](https://console.groq.com) and create an account
2. Navigate to API Keys section
3. Generate a new API key

### Step 4: Database Setup
Execute the following SQL scripts in your Supabase SQL editor:

1. **Create Tables** (`scripts/001_create_tables.sql`):
```sql
-- Jobs table for storing job postings
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  jd_file_url TEXT,
  jd_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table for storing candidate applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_name TEXT NOT NULL,
  resume_file_url TEXT,
  analysis_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
```

2. **Setup Storage** (`scripts/002_create_storage_buckets.sql`):
```sql
-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('resumes', 'resumes', false),
  ('job-descriptions', 'job-descriptions', false);

-- Set up storage policies
CREATE POLICY "Users can upload resumes" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Users can view own uploads" ON storage.objects 
  FOR SELECT USING (bucket_id = 'resumes');
```

### Step 5: Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Step 6: Verify Installation
1. Visit `http://localhost:3000` - Should show the student portal
2. Visit `http://localhost:3000/admin/login` - Should show the admin login
3. Try uploading a sample resume to test the system

## 📖 Usage Guide

### For Students

#### 1. **Browse Job Opportunities**
- Visit the homepage to see all available job postings
- Each job card displays the title, description, and application statistics
- Click on any job to view detailed requirements

#### 2. **Submit Application**
- Click "Apply Now" on your desired position
- Enter your full name in the application form
- Upload your resume using the drag-and-drop interface
- Supported formats: PDF, DOCX, PPTX, XLSX (max 10MB)

#### 3. **Get Instant Analysis**
- After submission, the AI analysis begins automatically
- Progress indicator shows real-time processing status
- Analysis typically completes in 3-5 seconds

#### 4. **Review Results**
- **Overall Score**: 0-100 numerical rating with visual gauge
- **Verdict Classification**: 
  - **High** (90-100): Excellent match for the position
  - **Medium** (70-89): Good match with some gaps
  - **Low** (0-69): Significant skill gaps identified
- **Matched Skills**: Green badges showing skills you possess
- **Missing Skills**: Red badges highlighting areas for improvement
- **Detailed Feedback**: Specific recommendations for skill development

### For Placement Team (Admin)

#### 1. **Access Admin Dashboard**
- Navigate to `/admin/login`
- Enter your administrator credentials
- Access comprehensive analytics dashboard

#### 2. **Monitor Applications**
- **Score Distribution**: Donut chart showing High/Medium/Low ratio
- **Application Trends**: Line chart tracking daily application volume
- **Skill Analytics**: Bar charts identifying most common skill gaps
- **Real-time Updates**: Dashboard refreshes automatically

#### 3. **Generate Insights**
- Identify trending skills in job market
- Spot curriculum gaps based on missing skills
- Track placement team performance metrics
- Export data for detailed reporting

#### 4. **Navigate System**
- Click "Innomatics Research Labs" logo to return to student portal
- Use breadcrumb navigation for easy system traversal

## 🔧 Advanced Configuration

### Production Deployment

#### Build for Production
```bash
npm run build
npm run start
```

#### Environment Variables for Production
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
GROQ_API_KEY=your_production_groq_key
```

### Custom Configuration Options

#### Modify AI Analysis Parameters
Edit `lib/groq-analysis.ts` to customize:
- Analysis prompt templates
- Scoring algorithms
- Skill extraction logic
- Response formatting

#### Adjust File Upload Limits
Modify `next.config.mjs`:
```javascript
export default {
  experimental: {
    serverComponentsExternalPackages: ['office-text-extractor']
  },
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Adjust file size limit
    }
  }
}
```

#### Customize UI Components
All UI components are in `components/ui/` and can be styled using Tailwind CSS classes.

## 🔍 API Reference

### Document Processing Endpoint
```
POST /api/extract-text
Content-Type: multipart/form-data

Body: FormData with 'file' field

Response:
{
  "text": "extracted document content",
  "success": true
}
```

### Resume Analysis Endpoint
```
POST /api/analyze-resume
Content-Type: application/json

Body:
{
  "resumeText": "candidate resume content",
  "jdText": "job description content"
}

Response:
{
  "score": 85,
  "verdict": "High",
  "matched_skills": ["React", "Node.js", "JavaScript"],
  "missing_skills": ["Docker", "AWS", "MongoDB"]
}
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### "GROQ_API_KEY not found" Error
```bash
# Check if environment variable is set
echo $GROQ_API_KEY  # Linux/Mac
Get-ChildItem Env:GROQ_API_KEY  # Windows PowerShell

# Ensure .env.local file exists and contains the key
# Restart development server after adding the key
```

#### File Upload Failures
- Verify file size is under 10MB limit
- Ensure file format is supported (PDF, DOCX, PPTX, XLSX)
- Check browser console for detailed error messages

#### Database Connection Issues
```typescript
// Test Supabase connection in browser console
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
const { data, error } = await supabase.from('jobs').select('*').limit(1)
console.log('Connection test:', error ? 'Failed' : 'Success')
```

#### Charts Not Rendering
```bash
# Reinstall chart dependencies
npm uninstall ag-charts-react
npm install ag-charts-react@latest
npm run dev
```

### Getting Help
- Check browser console for error messages
- Review server logs in terminal
- Verify all environment variables are correctly set
- Ensure database tables are properly created

## 📊 Performance Metrics

### Expected Performance
- **Document Processing**: < 2 seconds for files up to 5MB
- **AI Analysis**: 3-8 seconds depending on content complexity
- **Chart Rendering**: < 1 second for typical datasets
- **Page Load Time**: < 1 second on standard connections

### System Limits
- **File Size**: 10MB maximum per upload
- **Concurrent Users**: Optimized for 100+ simultaneous users
- **Analysis Volume**: 1000+ resumes per day capacity
- **Data Storage**: Unlimited with Supabase scaling

## 🤝 Contributing

We welcome contributions to improve the system! Here's how to get started:

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Make Changes**: Follow existing code patterns and conventions
4. **Test Changes**: Ensure all functionality works correctly
5. **Submit Pull Request**: Include detailed description of changes

### Development Guidelines
- Use TypeScript for type safety
- Follow existing component structure
- Add error handling for new features
- Update documentation for significant changes

## 📄 License

This project is developed for Innomatics Research Labs internal use. All rights reserved.

## 📞 Support

For technical support or questions:
- **Internal Support**: Contact the development team
- **Documentation**: Refer to inline code comments
- **Issues**: Use the project's issue tracking system

---

**System Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: September 21, 2025

**Built with ❤️ for Innomatics Research Labs**
