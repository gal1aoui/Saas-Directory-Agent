# 🦙 Ollama Setup Guide - FREE Local AI with Mistral

## Why Ollama + Mistral?

✅ **100% FREE** - No API costs, unlimited usage
✅ **Privacy First** - All data stays on your machine
✅ **Works Offline** - No internet required after setup
✅ **Fast Processing** - Local execution, no network latency
✅ **Mistral Model** - Excellent for text + form analysis

## 🚀 Quick Setup

### Step 1: Install Ollama

**Windows:**
```powershell
# Download installer
# Visit: https://ollama.com/download/windows
# Run the installer
# Ollama starts automatically
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Mac:**
```bash
# Download from: https://ollama.com/download/mac
# Or use Homebrew
brew install ollama
```

**Verify Installation:**
```bash
ollama --version
```

### Step 2: Download Mistral Model

```bash
# Pull Mistral (latest version)
ollama pull mistral:latest

# This downloads ~4GB - may take a few minutes
# Verify download
ollama list
```

You should see:
```
NAME              SIZE      MODIFIED
mistral:latest    6 GB    2 minutes ago
```

### Step 3: Test Ollama

```bash
# Test text generation
ollama run mistral "Hello, how are you?"

# You should see a response
```

**Done!** ✅ Ollama with Mistral is ready

## 🎯 Configure Backend

Update `backend/.env`:

```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral:latest

# No API keys needed!
```

## 🧪 Testing

### Check Ollama is Running

```bash
# Windows PowerShell
Get-Process ollama

# Linux/Mac
ps aux | grep ollama
```

If not running:
```bash
ollama serve
```

### Test API Endpoint

```bash
curl http://localhost:11434/api/tags
```

Should return list of installed models.

## 📊 Model Comparison

| Model | Size | Speed | Best For |
|-------|------|-------|----------|
| `mistral:latest` | ~4GB | Fast | **Our Choice** - Great balance |
| `mistral:7b` | ~4GB | Fast | Same as latest |
| `llama2` | ~4GB | Medium | Alternative option |
| `codellama` | ~4GB | Medium | Code-focused tasks |

**Why Mistral?**
- Excellent text understanding
- Fast inference
- Good at structured output
- Works great for form analysis

## 🔧 Advanced Configuration

### Use Different Model

```bash
# Pull alternative model
ollama pull llama2:latest

# Update .env
OLLAMA_MODEL=llama2:latest
```

### Adjust Performance

```env
# In .env
AI_TEMPERATURE=0.0      # More deterministic (0.0-1.0)
MAX_TOKENS=8192        # Larger context window
```

### Custom Ollama Host

```bash
# Start Ollama on different port
OLLAMA_HOST=0.0.0.0:12345 ollama serve
```

Update `.env`:
```env
OLLAMA_HOST=http://localhost:12345
```

## 🐛 Troubleshooting

### ❌ "Failed to connect to Ollama"

**Check if Ollama is running:**
```bash
# Windows
Get-Process ollama

# Linux/Mac
pgrep ollama
```

**Start Ollama:**
```bash
ollama serve
```

**Test connection:**
```bash
curl http://localhost:11434/api/version
```

---

### ❌ "Model not found"

**List installed models:**
```bash
ollama list
```

**Pull Mistral:**
```bash
ollama pull mistral:latest
```

**Verify in .env:**
```env
OLLAMA_MODEL=mistral:latest
```

---

### ❌ "Out of memory"

**Solution 1: Close other apps**
- Free up RAM
- Close browser tabs
- Stop other services

**Solution 2: Use smaller model**
```bash
# Try smaller version
ollama pull mistral:7b-text-q4_0
```

**Solution 3: Increase swap (Linux)**
```bash
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

### ❌ Slow responses

**Check resource usage:**
- Open Task Manager (Windows) or Activity Monitor (Mac)
- Look at CPU/RAM usage
- Close unnecessary applications

**Enable GPU acceleration (NVIDIA only):**
1. Install CUDA Toolkit
2. Restart Ollama
3. It will auto-detect GPU

**Verify GPU usage:**
```bash
nvidia-smi  # Should show ollama process
```

---

## 💡 Tips & Tricks

### 1. Auto-start Ollama (Windows)

```powershell
# Create startup shortcut
# 1. Press Win+R
# 2. Type: shell:startup
# 3. Create shortcut to Ollama
```

### 2. Monitor Ollama

```bash
# Check running models
ollama ps

# View logs (Linux/Mac)
journalctl -u ollama -f
```

### 3. Update Ollama

**Windows:**
- Download latest installer
- Run to update

**Linux/Mac:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 4. Update Models

```bash
# Update Mistral to latest
ollama pull mistral:latest

# Remove old versions
ollama rm mistral:old-version
```

## 🆚 Ollama vs Cloud AI

| Feature | Ollama (Mistral) | OpenAI GPT-4 |
|---------|------------------|--------------|
| **Cost** | ✅ FREE | ❌ $0.01-0.03/request |
| **Privacy** | ✅ 100% local | ❌ Sent to cloud |
| **Speed** | ✅ Fast (local) | ⚠️ Network dependent |
| **Rate Limits** | ✅ None | ❌ Yes |
| **Internet** | ✅ Works offline | ❌ Requires internet |
| **Quality** | ✅ Very good | ✅ Excellent |
| **Setup** | ⚠️ Installation needed | ✅ Just API key |

**For this project: Ollama is perfect!** ✅

## 📊 System Requirements

### Minimum
- **CPU:** Any modern processor
- **RAM:** 8GB
- **Storage:** 5GB free
- **OS:** Windows 10+, macOS 12+, Linux

### Recommended
- **CPU:** 4+ cores
- **RAM:** 16GB+
- **Storage:** 10GB+ free
- **GPU:** NVIDIA with CUDA (optional)

## 🎓 Ollama Commands Reference

```bash
# List installed models
ollama list

# Pull a model
ollama pull mistral:latest

# Run interactive chat
ollama run mistral

# Remove a model
ollama rm mistral:old

# Show model info
ollama show mistral

# Check version
ollama --version

# Start server
ollama serve

# Stop server (Ctrl+C)
```

## 🔐 Security Notes

- Ollama runs locally - your data never leaves your machine
- No API keys to manage
- No external dependencies once model is downloaded
- Perfect for sensitive data processing

## ✅ Integration Checklist

Before running the app:

- [ ] Ollama installed
- [ ] Mistral model downloaded (`ollama pull mistral:latest`)
- [ ] Ollama is running (`ollama serve` or auto-started)
- [ ] Backend `.env` configured with Ollama settings
- [ ] Test connection: `curl http://localhost:11434/api/tags`

## 🚀 Ready to Go!

```bash
# Backend
cd backend
uvicorn app.main:app --reload

# You should see:
# 🤖 AI: Ollama (mistral:latest)
# ✅ Application started successfully
```

## 🆘 Getting Help

**Check logs:**
```bash
# Backend logs
# Look in terminal running uvicorn

# Ollama logs (Linux/Mac)
journalctl -u ollama -n 100
```

**Common issues:**
1. Ollama not running → `ollama serve`
2. Model not found → `ollama pull mistral:latest`
3. Out of memory → Close other apps
4. Slow → Check CPU/RAM usage

**Resources:**
- Ollama Docs: https://github.com/ollama/ollama
- Mistral AI: https://docs.mistral.ai/
- Our Issues: Check backend console

---

## 🎉 Congratulations!

You now have a **completely FREE**, **privacy-focused** AI system running locally on your machine!

**No API costs. No rate limits. No cloud dependencies.** 🦙✨

**Happy submitting! 🚀**