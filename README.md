# SaaS Directory Submission Agent

An intelligent, automated system for submitting SaaS products to hundreds of directories using AI-powered form detection and browser automation.

## 🎯 Features

- **AI Form Detection**: Automatically detects and understands form fields using GPT-4 Vision or Claude
- **Browser Automation**: Fills and submits forms using Playwright
- **Bulk Submissions**: Submit to multiple directories concurrently
- **Smart Retry Logic**: Automatically retries failed submissions
- **Dashboard Analytics**: Track submission status and success rates
- **Form Caching**: Remembers form structures to speed up future submissions

## 🏗️ Architecture

### Three-Layer Design

1. **AI Form Reader (Brain)**
   - Uses vision models to analyze forms
   - Detects field types, labels, and requirements
   - Maps SaaS data to form fields intelligently

2. **Browser Automation (Hands)**
   - Playwright-based form filling
   - Handles text inputs, file uploads, dropdowns
   - Screenshot capture for verification

3. **Workflow Manager (Control Center)**
   - Orchestrates submission pipeline
   - Manages concurrent submissions
   - Implements retry logic and scheduling

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- OpenAI API key (or Anthropic API key)

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Install Playwright browsers
playwright install chromium

# 5. Create .env file
cp .env.example .env
# Edit .env with your configuration

# 6. Setup database
createdb directory_agent  # Create PostgreSQL database
alembic upgrade head      # Run migrations

# 7. Run server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
echo "VITE_API_URL=http://localhost:8000/api" > .env

# 4. Run development server
npm run dev
```

## 📝 Configuration

### Environment Variables (Backend)

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/directory_agent

# AI Provider (choose one or both)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Application
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Browser Automation
HEADLESS_BROWSER=False  # Set to True in production
BROWSER_TIMEOUT=30000

# AI Settings
AI_MODEL=gpt-4-vision-preview
AI_TEMPERATURE=0.1

# Workflow
MAX_RETRIES=3
RETRY_DELAY=300  # 5 minutes
CONCURRENT_SUBMISSIONS=3
```

## 📊 Database Schema

### Tables

**saas_products**
- Product information (name, URL, description, logo, etc.)

**directories**
- Directory URLs and metadata
- Cached form structures
- Success statistics

**submissions**
- Submission records with status tracking
- Error logs and retry count
- Detected form fields

**form_fields**
- Detected form field details
- Used for learning and caching

## 🔧 API Endpoints

### SaaS Products
- `POST /api/saas` - Create SaaS product
- `GET /api/saas` - List all products
- `GET /api/saas/{id}` - Get product details
- `PUT /api/saas/{id}` - Update product
- `DELETE /api/saas/{id}` - Delete product

### Directories
- `POST /api/directories` - Add directory
- `GET /api/directories` - List directories
- `GET /api/directories/{id}` - Get directory details
- `PUT /api/directories/{id}` - Update directory
- `DELETE /api/directories/{id}` - Delete directory

### Submissions
- `POST /api/submissions` - Create single submission
- `POST /api/submissions/bulk` - Bulk submit
- `GET /api/submissions` - List submissions (with filters)
- `GET /api/submissions/stats` - Dashboard statistics
- `POST /api/submissions/{id}/retry` - Retry failed submission

## 💡 Usage Examples

### 1. Add a SaaS Product

```bash
curl -X POST http://localhost:8000/api/saas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyAwesomeSaaS",
    "website_url": "https://myawesomesaas.com",
    "description": "A revolutionary SaaS platform...",
    "short_description": "Revolutionary SaaS",
    "category": "Productivity",
    "contact_email": "hello@myawesomesaas.com",
    "logo_url": "https://myawesomesaas.com/logo.png"
  }'
```

### 2. Add Directories

```bash
curl -X POST http://localhost:8000/api/directories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Hunt",
    "url": "https://www.producthunt.com",
    "submission_url": "https://www.producthunt.com/posts/new",
    "status": "active",
    "domain_authority": 92
  }'
```

### 3. Bulk Submit

```bash
curl -X POST http://localhost:8000/api/submissions/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "saas_product_id": 1,
    "directory_ids": [1, 2, 3, 4, 5]
  }'
```

## 🎨 Frontend Components

### Dashboard
- Real-time statistics
- Success rate visualization
- Recent submissions list
- Pie chart of submission statuses

### Submissions List
- Filterable table of all submissions
- Status badges and icons
- Retry failed submissions
- View detailed logs

### Bulk Submit
- Select SaaS product
- Multi-select directories
- Real-time submission progress
- Batch result summary

### SaaS Manager
- Add/edit SaaS products
- Upload logos
- Manage product details

### Directory Manager
- Add/edit directories
- Track success rates
- View form cache status

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 📈 Performance Tips

1. **Use Form Caching**: Once a form is analyzed, its structure is cached
2. **Adjust Concurrency**: Set `CONCURRENT_SUBMISSIONS` based on your system
3. **Headless Mode**: Enable `HEADLESS_BROWSER=True` in production
4. **Database Indexes**: Ensure indexes on frequently queried fields

## 🐛 Troubleshooting

### Common Issues

**Issue**: Playwright browser not found
```bash
playwright install chromium
```

**Issue**: Database connection error
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
```

**Issue**: AI API errors
```bash
# Verify API keys in .env
# Check API key permissions and billing
```

**Issue**: Form detection failures
- Try different AI models (GPT-4 vs Claude)
- Check screenshot quality
- Manually add form structure to directory cache

## 🔒 Security Considerations

- Store API keys in environment variables only
- Use HTTPS in production
- Implement rate limiting on API endpoints
- Validate all user inputs
- Sanitize URLs before visiting
- Use secure database credentials

## 🚢 Deployment

### Using Docker (Recommended)

```dockerfile
# Dockerfile for backend
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN playwright install chromium
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Deployment Options

- **Backend**: Railway, Render, AWS EC2, Google Cloud Run
- **Frontend**: Vercel, Netlify, AWS Amplify
- **Database**: Supabase, AWS RDS, Digital Ocean Managed Database

## 📚 Tech Stack

### Backend
- FastAPI - Web framework
- SQLAlchemy - ORM
- Playwright - Browser automation
- OpenAI/Anthropic - AI form detection
- PostgreSQL - Database
- Alembic - Database migrations

### Frontend
- React 18 - UI library
- Vite - Build tool
- Tailwind CSS - Styling
- Axios - HTTP client
- Recharts - Data visualization
- Lucide React - Icons

## 🤝 Contributing

This is an assessment project. After completion, contributions may be accepted.

## 📄 License

Proprietary - GenieOps

## 🙋 Support

For questions or issues:
- Email: support@genie-ops.com
- Documentation: https://docs.genie-ops.com

## ✨ Future Enhancements

- [ ] CAPTCHA solving integration
- [ ] Multi-step form support
- [ ] Email verification automation
- [ ] Social media auto-posting
- [ ] Analytics and SEO tracking
- [ ] Webhook notifications
- [ ] Team collaboration features
- [ ] Custom form field mapping rules

---

Built with ❤️ for GenieOps Assessment