# 🦙 Ollama Setup Guide - FREE Local AI

## Why Ollama?

✅ **100% FREE** - No API costs, no rate limits
✅ **Privacy** - All data stays on your machine
✅ **No Internet Required** - Works completely offline
✅ **Fast** - Local processing, no network latency
✅ **Powerful** - Qwen2.5-VL supports vision + text analysis

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Ollama

**Windows:**
1. Download from: https://ollama.com/download/windows
2. Run the installer
3. Ollama will start automatically

**Verify Installation:**
```powershell
ollama --version
```

### Step 2: Download Qwen2.5-VL Model

```powershell
# Pull the vision model (this will take a few minutes - ~4GB download)
ollama pull qwen2.5-vl:latest

# Verify it's downloaded
ollama list
```

You should see `qwen2.5-vl:latest` in the list.

### Step 3: Configure Backend

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/directory_agent

# Ollama (Local AI - No API key needed!)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5-vl:latest

# Security
SECRET_KEY=your-generated-secret-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Browser
HEADLESS_BROWSER=false

# Other settings
DEBUG=true
BROWSER_TIMEOUT=30000
AI_TEMPERATURE=0.1
MAX_TOKENS=4096
MAX_RETRIES=3
RETRY_DELAY=300
CONCURRENT_SUBMISSIONS=3
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=5242880
HOST=0.0.0.0
PORT=8000
```

**Done!** ✅ No API keys needed!

## 🧪 Test Ollama

```powershell
# Test text generation
ollama run qwen2.5-vl "Hello, how are you?"

# Test with vision (create a test image first)
# The model will analyze images automatically when you use it with our app
```

## 📊 System Requirements

**Minimum:**
- RAM: 8GB
- Storage: 5GB free space
- CPU: Any modern processor

**Recommended:**
- RAM: 16GB+
- GPU: NVIDIA GPU with CUDA support (optional, but faster)
- Storage: 10GB+ free space

## 🔧 Troubleshooting

### ❌ "Failed to connect to Ollama"

**Solution:**

```powershell
# Check if Ollama is running
Get-Process ollama

# If not running, start it
ollama serve
```

Ollama should auto-start after installation, but if it doesn't:
- Open Task Manager
- Look for "Ollama" in background processes
- If not there, run: `ollama serve`

---

### ❌ "Model qwen2.5-vl:latest not found"

**Solution:**

```powershell
# Pull the model
ollama pull qwen2.5-vl:latest

# Wait for download to complete (it's ~4GB)
# Then verify
ollama list
```

---

### ❌ "Out of memory" errors

**Solution 1: Use smaller model**
```powershell
# Try the smaller version (2GB instead of 4GB)
ollama pull qwen2.5-vl:7b
```

Update `.env`:
```env
OLLAMA_MODEL=qwen2.5-vl:7b
```

**Solution 2: Close other applications**
- Close browser tabs
- Close other memory-heavy apps
- Restart Ollama

---

### ❌ Model is very slow

**Check if using GPU:**
```powershell
# Ollama will automatically use GPU if available
# Check GPU usage in Task Manager -> Performance -> GPU
```

**Speed it up:**
1. Close other applications
2. Make sure Ollama has GPU access
3. Consider using a smaller model for faster responses

---

## 🎯 Model Comparison

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `qwen2.5-vl:latest` | ~4GB | Medium | High | Production use |
| `qwen2.5-vl:7b` | ~2GB | Fast | Good | Low RAM systems |
| `llava:latest` | ~4.5GB | Medium | High | Alternative option |

To switch models:

```powershell
# Pull new model
ollama pull llava:latest

# Update .env
OLLAMA_MODEL=llava:latest
```

---

## 🆚 Ollama vs OpenAI

| Feature | Ollama (Qwen2.5-VL) | OpenAI (GPT-4 Vision) |
|---------|---------------------|----------------------|
| **Cost** | ✅ FREE | ❌ ~$0.01 per request |
| **Privacy** | ✅ Local, private | ❌ Sent to OpenAI |
| **Speed** | ✅ Fast (local) | ⚠️ Network dependent |
| **Rate Limits** | ✅ None | ❌ Yes |
| **Internet** | ✅ Works offline | ❌ Requires internet |
| **Quality** | ⚠️ Very good | ✅ Excellent |
| **Setup** | ⚠️ Requires installation | ✅ Just API key |

**For this project: Ollama is perfect!** ✅

---

## 💡 Tips

### 1. Keep Ollama Running

Ollama should auto-start with Windows. If it doesn't:

```powershell
# Add to startup
# 1. Press Win+R
# 2. Type: shell:startup
# 3. Create shortcut to: C:\Users\YourName\AppData\Local\Programs\Ollama\ollama.exe
```

### 2. Monitor Performance

```powershell
# Check Ollama status
curl http://localhost:11434/api/tags

# Should return list of models
```

### 3. GPU Acceleration (Optional)

If you have NVIDIA GPU:

1. Install CUDA Toolkit: https://developer.nvidia.com/cuda-downloads
2. Restart Ollama
3. It will automatically use GPU

Check if GPU is being used:
- Open Task Manager
- Go to Performance tab
- Watch GPU usage when running the app

---

## 🎓 Advanced Configuration

### Use Different Port

```env
OLLAMA_HOST=http://localhost:12345
```

Then start Ollama with custom port:
```powershell
$env:OLLAMA_HOST="0.0.0.0:12345"
ollama serve
```

### Increase Context Window

```env
MAX_TOKENS=8192  # Bigger context for complex forms
```

### Adjust Temperature

```env
AI_TEMPERATURE=0.0  # More deterministic (0.0 - 1.0)
```

---

## 📖 Ollama Commands Reference

```powershell
# List downloaded models
ollama list

# Pull a model
ollama pull qwen2.5-vl:latest

# Remove a model
ollama rm qwen2.5-vl:latest

# Run interactive chat
ollama run qwen2.5-vl

# Get model info
ollama show qwen2.5-vl

# Check version
ollama --version

# Update Ollama
# Download latest from ollama.com and reinstall
```

---

## ✅ Final Checklist

Before running the app:

- [ ] Ollama installed
- [ ] `qwen2.5-vl:latest` model downloaded
- [ ] Ollama is running (`Get-Process ollama`)
- [ ] `.env` file configured with `OLLAMA_HOST` and `OLLAMA_MODEL`
- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Playwright browsers installed (`playwright install chromium`)

---

## 🎉 Ready to Go!

```powershell
# Start backend
cd backend
.\venv\Scripts\Activate
python -m uvicorn app.main:app --reload
```

You should see:
```
✅ Database initialized
🤖 AI: Ollama (qwen2.5-vl:latest)
🌍 Server: http://0.0.0.0:8000
✅ Application started successfully
```

Visit: http://localhost:8000/docs

**Enjoy FREE, local AI! 🦙✨**

---

## 📞 Need Help?

**Common Issues:**

1. **Can't connect to Ollama** → Run `ollama serve`
2. **Model not found** → Run `ollama pull qwen2.5-vl:latest`
3. **Out of memory** → Use smaller model or close other apps
4. **Slow responses** → Check GPU usage, close other apps

**Resources:**
- Ollama Docs: https://github.com/ollama/ollama
- Qwen2.5-VL: https://ollama.com/library/qwen2.5-vl
- Our Issues: Check app logs in console

---

**Congratulations!** 🎊

You now have a **completely FREE**, **privacy-focused** AI-powered SaaS directory submission system running entirely on your local machine!