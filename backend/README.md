# SaaS Directory Agent - Backend

AI-powered automated SaaS directory submission system with persistent browser sessions, login support, and multi-step form handling.

## 🚀 Features

- ✅ **Ollama AI Integration** - Free local AI with Mistral for form analysis
- ✅ **Persistent Browser Sessions** - Maintains login credentials across submissions
- ✅ **Multi-Step Form Support** - Handles Next/Continue buttons automatically
- ✅ **Login Credential Management** - Securely stores and uses directory credentials
- ✅ **Concurrent Submissions** - Process multiple directories simultaneously
- ✅ **Automatic Retries** - Smart retry logic for failed submissions
- ✅ **Form Caching** - Remembers form structures to speed up future submissions

## 📋 Prerequisites

- Python 3.9+
- PostgreSQL 14+
- Ollama with Mistral model
- Windows/Linux/Mac

## 🔧 Installation

### 1. Install Ollama

**Windows:**
```powershell
# Download from: https://ollama.com/download
# Install and run
ollama pull mistral:latest
```

**Linux/Mac:**
```bash
curl https://ollama.ai/install.sh | sh
ollama pull mistral:latest
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

### 3. Configure Environment

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/directory_agent

# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral:latest

# Security (generate: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=your-generated-secret-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Browser
HEADLESS_BROWSER=false
BROWSER_TIMEOUT=30000

# AI
AI_TEMPERATURE=0.1
MAX_TOKENS=4096

# Workflow
MAX_RETRIES=3
RETRY_DELAY=300
CONCURRENT_SUBMISSIONS=3

# Server
HOST=0.0.0.0
PORT=8000
```

### 4. Setup Database

```bash
# Create database
psql -U postgres -c "CREATE DATABASE directory_agent;"

# Initialize tables (automatic on first run)
python -m app.main
```

## 🏃 Running

### Development

```bash
# VS Code: Press F5 or use Run & Debug
# Or manually:
uvicorn app.main:app --reload
```

Visit http://localhost:8000/docs for API documentation

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration
│   ├── database.py             # Database setup
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── routes/                 # API endpoints
│   │   ├── saas.py
│   │   ├── directories.py
│   │   └── submissions.py
│   ├── services/               # Core business logic
│   │   ├── ai_form_reader.py  # Ollama integration
│   │   ├── browser_automation.py  # Playwright automation
│   │   └── workflow_manager.py    # Workflow orchestration
│   └── utils/
│       └── logger.py
├── uploads/                    # Generated files
│   └── screenshots/
├── .env                        # Environment variables
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🎯 Key Features Explained

### 1. Persistent Browser Sessions

The browser maintains context across submissions:
- Cookies and session data preserved
- No need to re-login for each submission
- Faster subsequent submissions

```python
# Browser context is reused
async with BrowserAutomation() as browser:
    await browser.login_if_required(...)
    # Context persists for all submissions
    await browser.fill_and_submit_form(...)
```

### 2. Login Credentials

Directories can require authentication:

```python
directory = Directory(
    name="Product Hunt",
    requires_login=True,
    login_url="https://producthunt.com/login",
    login_username="user@example.com",
    login_password="secure_password"
)
```

### 3. Multi-Step Forms

Handles forms with Next/Continue buttons:

```python
directory = Directory(
    name="Complex Directory",
    is_multi_step=True,
    step_count=3  # Number of steps
)
```

The system automatically:
1. Fills fields for step 1
2. Clicks "Next"
3. Fills fields for step 2
4. Clicks "Next"
5. Fills fields for step 3
6. Clicks "Submit"

### 4. Ollama AI Integration

Uses local Mistral model for form analysis:

```python
# Automatically detects form fields
form_structure = await ai_reader.analyze_form_from_screenshot(
    screenshot_path="form.png",
    html_content="<form>...</form>"
)
```

## 🔌 API Endpoints

### SaaS Products

```
GET    /api/saas              # List all products
POST   /api/saas              # Create product
GET    /api/saas/{id}         # Get product
PUT    /api/saas/{id}         # Update product
DELETE /api/saas/{id}         # Delete product
```

### Directories

```
GET    /api/directories       # List all directories
POST   /api/directories       # Create directory
GET    /api/directories/{id}  # Get directory
PUT    /api/directories/{id}  # Update directory
DELETE /api/directories/{id}  # Delete directory
```

### Submissions

```
GET    /api/submissions       # List submissions
POST   /api/submissions       # Create submission
POST   /api/submissions/bulk  # Bulk submit
GET    /api/submissions/stats # Dashboard stats
POST   /api/submissions/{id}/retry  # Retry failed
```

## 🐛 VS Code Debugging

### launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "debugpy",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--reload",
        "--host",
        "0.0.0.0",
        "--port",
        "8000"
      ],
      "jinja": true,
      "justMyCode": false,
      "env": {
        "PYTHONPATH": "${workspaceFolder}"
      }
    }
  ]
}
```

### settings.json

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/venv/Scripts/python.exe",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black"
}
```

## 🧪 Testing

```bash
# Run tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html
```

## 🔒 Security Notes

### ⚠️ Important: Production Deployment

**Login credentials are stored in plain text in development.**

For production:

1. **Encrypt passwords:**
```python
from cryptography.fernet import Fernet

# Generate key
key = Fernet.generate_key()

# Encrypt password
cipher = Fernet(key)
encrypted = cipher.encrypt(password.encode())
```

2. **Use environment variables for sensitive data**
3. **Enable HTTPS**
4. **Set HEADLESS_BROWSER=true**

## 🐛 Troubleshooting

### Ollama not connecting

```bash
# Check Ollama is running
ollama list

# Start Ollama
ollama serve
```

### Database connection failed

```bash
# Check PostgreSQL is running
pg_isready

# Verify connection
psql -U postgres -d directory_agent
```

### Playwright browser not found

```bash
playwright install chromium --force
```

### Import errors

```bash
# Ensure virtual environment is activated
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Reinstall dependencies
pip install -r requirements.txt
```

## 📊 Performance

- **Concurrent submissions:** 3 (configurable)
- **Retry delay:** 5 minutes
- **Max retries:** 3
- **Browser timeout:** 30 seconds

## 🔄 Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## 📝 Code Quality

```bash
# Format code
ruff format .

# Lint code
ruff check .

# Type checking
mypy app/
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests
5. Submit pull request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

- Documentation: http://localhost:8000/docs
- Issues: Report in GitHub
- Logs: Check console output

---

**Happy submitting! 🚀**