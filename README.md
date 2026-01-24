# SaaS Directory Submission Agent

I built this system to automate submitting SaaS products to hundreds of directories using AI-powered browser automation. The goal is to save countless hours of manual form filling while ensuring accurate submissions.

## How It Works

I use **Browser Use Cloud API** as the primary solution. It's a cloud-based AI agent that can see and interact with web pages like a human would. I simply give it instructions like "fill out this form with my SaaS details" and it handles the rest - finding fields, typing, clicking buttons, even navigating multi-step forms.

### Why Browser Use Cloud?

After testing multiple approaches, I settled on Browser Use Cloud because:

- **No local setup required** - Just an API key
- **Handles complex forms** - Multi-step, dynamic fields, login-protected pages
- **Low RAM usage** - Everything runs in the cloud
- **Reliable** - Managed infrastructure means consistent performance

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- Browser Use Cloud API key (get one at [cloud.browser-use.com](https://cloud.browser-use.com/))

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Create .env file with your configuration
cp .env.example .env
# Edit .env and add your BROWSER_USE_API_KEY

# Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit http://localhost:5173 to access the dashboard.

## Configuration

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/directory_agent

# Browser Use Cloud (Primary Solution)
USE_BROWSER_USE_CLOUD=true
BROWSER_USE_API_KEY=your-api-key-here

# Authentication
SECRET_KEY=your-secret-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Browser Settings
HEADLESS_BROWSER=false
BROWSER_TIMEOUT=30000

# Workflow
MAX_RETRIES=3
RETRY_DELAY=300
CONCURRENT_SUBMISSIONS=3
```

## Features

- **AI-Powered Form Detection** - Automatically understands form structure
- **Browser Automation** - Fills and submits forms using AI vision
- **Bulk Submissions** - Submit to multiple directories at once
- **Login Support** - Handles password-protected directories
- **Multi-Step Forms** - Navigates complex submission wizards
- **Retry Logic** - Automatically retries failed submissions
- **Dashboard** - Track submission status and success rates

## Alternative: Local Mode with Ollama

I also built a local mode using Ollama for those who want to keep everything on their machine. However, **I couldn't fully move forward with this approach because it requires significant RAM** (16GB+ recommended).

If you have a powerful machine, you can try it:

1. Run Ollama with GPU support using Docker:

```bash
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

2. Pull a vision model:

```bash
docker exec -it ollama ollama pull qwen2.5vl:latest
```

3. Update your `.env`:

```env
USE_BROWSER_USE_CLOUD=false
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5vl:latest
```

See [OLLAMA.md](OLLAMA.md) for more details on the local setup.

## Project Structure

```
.
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # Application entry point
│   │   ├── config.py                 # Configuration settings
│   │   ├── database.py               # Database setup
│   │   ├── models.py                 # SQLAlchemy models
│   │   ├── schemas.py                # Pydantic schemas
│   │   ├── dependencies.py           # FastAPI dependencies
│   │   ├── routes/                   # API endpoints
│   │   │   ├── auth.py               # Authentication
│   │   │   ├── saas.py               # SaaS products CRUD
│   │   │   ├── directories.py        # Directories CRUD
│   │   │   └── submissions.py        # Submissions & bulk submit
│   │   ├── services/                 # Business logic
│   │   │   ├── browser_use_service.py    # Browser Use Cloud API
│   │   │   ├── ai_form_reader.py         # Ollama integration (fallback)
│   │   │   ├── browser_automation.py     # Playwright automation
│   │   │   ├── browser_manager.py        # Browser session management
│   │   │   ├── form_filler.py            # Form filling logic
│   │   │   ├── login_handler.py          # Directory login handling
│   │   │   ├── url_submission.py         # URL submission patterns
│   │   │   ├── workflow_manager.py       # Orchestration
│   │   │   └── strategies/
│   │   │       ├── browser_use_strategy.py   # Cloud strategy (primary)
│   │   │       └── playwright_strategy.py    # Local strategy (fallback)
│   │   └── utils/
│   │       ├── auth.py               # Encryption utilities
│   │       └── logger.py             # Logging setup
│   ├── uploads/                      # Generated screenshots
│   ├── requirements.txt
│   └── README.md
│
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── layout/               # Layout & navigation
│   │   │   ├── dashboard/            # Dashboard components
│   │   │   ├── submissions/          # Submission list & details
│   │   │   ├── bulk-submit/          # Bulk submission workflow
│   │   │   ├── saas/                 # SaaS product management
│   │   │   └── directories/          # Directory management
│   │   ├── contexts/                 # React contexts (Auth, Modal)
│   │   ├── pages/                    # Login & Register pages
│   │   ├── services/api/             # API client & endpoints
│   │   ├── store/hooks/              # TanStack Query hooks
│   │   ├── types/                    # TypeScript types & Zod schemas
│   │   ├── App.tsx                   # Main app with routing
│   │   └── main.tsx                  # Entry point
│   ├── package.json
│   └── README.md
│
├── OLLAMA.md                         # Local AI setup guide
└── README.md                         # This file
```

## API Endpoints

### SaaS Products

- `POST /api/saas` - Create a SaaS product
- `GET /api/saas` - List all products
- `PUT /api/saas/{id}` - Update a product
- `DELETE /api/saas/{id}` - Delete a product

### Directories

- `POST /api/directories` - Add a directory
- `GET /api/directories` - List directories
- `PUT /api/directories/{id}` - Update directory
- `DELETE /api/directories/{id}` - Delete directory

### Submissions

- `POST /api/submissions` - Create single submission
- `POST /api/submissions/bulk` - Bulk submit
- `GET /api/submissions` - List submissions
- `POST /api/submissions/{id}/retry` - Retry failed submission

## Tech Stack

### Backend

- FastAPI - API framework
- SQLAlchemy - ORM
- Browser Use SDK - AI browser automation
- PostgreSQL - Database

### Frontend

- React 19 - UI framework
- Vite - Build tool
- Tailwind CSS - Styling
- React Query - Data fetching

## Troubleshooting

### Browser Use API errors

- Verify your API key is correct in `.env`
- Check your account has available credits

### Database connection errors

```bash
# Ensure PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
```

### Form submission failures

- Check the submission logs in the dashboard
- Some directories may have CAPTCHAs or rate limits
- Try reducing `CONCURRENT_SUBMISSIONS`

## Future Plans

- [ ] Webhook notifications
- [ ] Analytics and reporting
