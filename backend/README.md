# SaaS Directory Agent - Backend

This is the backend service I built for automating SaaS directory submissions. It uses AI-powered browser automation to fill out and submit forms across hundreds of directories.

## My Current Solution: Browser Use Cloud API

I'm using **Browser Use Cloud** as the primary submission engine. It's a cloud-based service where an AI agent can see web pages and interact with them like a human. I just send it instructions and it handles the form filling, button clicking, and navigation.

### Why I chose this approach:

- **No heavy local setup** - I don't need to run AI models locally
- **Low memory footprint** - My machine doesn't need 16GB+ RAM
- **Handles complex scenarios** - Login pages, multi-step forms, dynamic fields
- **Reliable** - The infrastructure is managed for me

## Installation

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers (for fallback local mode)
playwright install chromium
```

## Configuration

Create a `.env` file:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/directory_agent

# Browser Use Cloud (my primary solution)
USE_BROWSER_USE_CLOUD=true
USE_BROWSER_USE=true
BROWSER_USE_API_KEY=your-api-key-here

# Security
SECRET_KEY=your-secret-key

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Browser Settings
HEADLESS_BROWSER=false
BROWSER_TIMEOUT=30000

# AI Settings (for local mode fallback)
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

## Running the Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI application entry
│   ├── config.py                     # Settings & configuration
│   ├── database.py                   # Database connection
│   ├── models.py                     # SQLAlchemy ORM models
│   ├── schemas.py                    # Pydantic request/response schemas
│   ├── dependencies.py               # FastAPI dependency injection
│   ├── routes/                       # API endpoint handlers
│   │   ├── auth.py                   # Authentication (login, register)
│   │   ├── saas.py                   # SaaS products CRUD
│   │   ├── directories.py            # Directories CRUD
│   │   └── submissions.py            # Submissions & bulk operations
│   ├── services/                     # Core business logic
│   │   ├── browser_use_service.py    # Browser Use Cloud API (primary)
│   │   ├── ai_form_reader.py         # Ollama form detection (fallback)
│   │   ├── browser_automation.py     # Playwright browser control
│   │   ├── browser_manager.py        # Browser session management
│   │   ├── form_filler.py            # Form field filling logic
│   │   ├── login_handler.py          # Directory login automation
│   │   ├── url_submission.py         # URL submission patterns
│   │   ├── workflow_manager.py       # Submission orchestration
│   │   └── strategies/
│   │       ├── browser_use_strategy.py   # Cloud API strategy
│   │       └── playwright_strategy.py    # Local Playwright strategy
│   └── utils/
│       ├── auth.py                   # Password encryption
│       └── logger.py                 # Colored logging setup
├── uploads/
│   └── screenshots/                  # Form screenshots
├── .env                              # Environment variables
├── requirements.txt                  # Python dependencies
└── README.md
```

## How Submissions Work

I built two strategies for form submission:

### 1. Browser Use Strategy (Primary)

This is what I'm using now. The flow:

1. I send the form URL and SaaS product data to Browser Use Cloud
2. The AI agent navigates to the page
3. It identifies form fields using vision
4. It fills in the data and submits
5. I get back a success/failure result

### 2. Playwright Strategy (Fallback)

If you disable cloud mode, it falls back to local Playwright automation with Ollama for form detection. I couldn't fully go this route because my machine doesn't have enough RAM for the AI models.

## API Endpoints

### Authentication
```
POST /api/auth/register    # Register user
POST /api/auth/login       # Login
POST /api/auth/logout      # Logout
GET  /api/auth/me          # Current user
```

### SaaS Products
```
GET    /api/saas           # List products
POST   /api/saas           # Create product
GET    /api/saas/{id}      # Get product
PUT    /api/saas/{id}      # Update product
DELETE /api/saas/{id}      # Delete product
```

### Directories
```
GET    /api/directories           # List directories
POST   /api/directories           # Create directory
GET    /api/directories/{id}      # Get directory
PUT    /api/directories/{id}      # Update directory
DELETE /api/directories/{id}      # Delete directory
```

### Submissions
```
GET    /api/submissions           # List submissions
POST   /api/submissions           # Create submission
POST   /api/submissions/bulk      # Bulk submit
GET    /api/submissions/stats     # Dashboard stats
POST   /api/submissions/{id}/retry # Retry failed
```

## Key Features I Implemented

### Login Support

Directories that require login work too:

```python
directory = Directory(
    name="Product Hunt",
    requires_login=True,
    login_url="https://producthunt.com/login",
    login_username="user@example.com",
    login_password="secure_password"
)
```

### Multi-Step Forms

I handle forms with Next/Continue buttons:

```python
directory = Directory(
    name="Complex Directory",
    is_multi_step=True,
    step_count=3
)
```

### Concurrent Submissions

I can submit to multiple directories at once:

```python
await workflow.bulk_submit(
    saas_product_id=1,
    directory_ids=[1, 2, 3, 4, 5],
    user_id=1
)
```

## Alternative: Local Mode with Ollama

If you have a machine with 16GB+ RAM and a decent GPU, you can try the local mode. I set up Ollama with Docker to use GPU:

```bash
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

Then pull a model:
```bash
docker exec -it ollama ollama pull qwen2.5vl:latest
```

Update `.env`:
```env
USE_BROWSER_USE_CLOUD=false
USE_BROWSER_USE=false
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5vl:latest
```

I couldn't continue with this approach because it requires too much RAM for my setup, but the code is there if you want to try it.

## Troubleshooting

### Browser Use API errors
- Check your API key in `.env`
- Verify your account has credits

### Database connection failed
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d directory_agent
```

### Playwright browser not found
```bash
playwright install chromium --force
```

### High memory usage (local mode)
This is why I moved to cloud mode. If you want to use local mode:
- Close other applications
- Use a smaller model
- Consider using GPU acceleration

## Code Quality

```bash
# Format code
ruff format .

# Lint
ruff check .

# Type checking
mypy app/
```

## Debugging in VS Code

I included VS Code launch configurations. Just press F5 to start debugging.

---

Built for automating the tedious work of SaaS directory submissions.
