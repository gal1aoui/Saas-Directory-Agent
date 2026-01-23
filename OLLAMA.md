# Local AI Mode with Ollama

This is an alternative approach I explored for running the AI form detection locally instead of using Browser Use Cloud. I couldn't fully move forward with this because **it requires significant RAM (16GB+)** and a decent GPU for reasonable performance.

## Why I Didn't Go This Route

After testing, I found that:

- **High RAM usage** - Vision models like Qwen2.5-VL need 8-16GB+ RAM
- **Slow on CPU** - Without a GPU, inference takes too long
- **Complex setup** - Need to configure Ollama, pull models, handle GPU drivers

I switched to Browser Use Cloud API instead, which handles all the heavy lifting in the cloud.

## If You Want To Try It Anyway

If you have a powerful machine (16GB+ RAM, NVIDIA GPU), here's how to set it up.

### Option 1: Docker with GPU (Recommended)

I used this command to run Ollama with GPU support:

```bash
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

This forces Ollama to use the GPU via Docker's NVIDIA runtime.

### Option 2: Native Installation

**Windows:**
```powershell
# Download from: https://ollama.com/download/windows
# Install and run
ollama pull qwen2.5vl:latest
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5vl:latest
```

**Mac:**
```bash
brew install ollama
ollama pull qwen2.5vl:latest
```

### Pull a Vision Model

For form detection, you need a vision-capable model:

```bash
# Using Docker
docker exec -it ollama ollama pull qwen2.5vl:latest

# Native
ollama pull qwen2.5vl:latest
```

### Configuration

Update `backend/.env`:

```env
# Disable cloud mode
USE_BROWSER_USE_CLOUD=false
USE_BROWSER_USE=false

# Ollama settings
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5vl:latest

# AI settings
AI_TEMPERATURE=0.1
MAX_TOKENS=4096
```

### Testing

Check Ollama is running:

```bash
curl http://localhost:11434/api/tags
```

Test the model:

```bash
# Docker
docker exec -it ollama ollama run qwen2.5vl:latest "Hello!"

# Native
ollama run qwen2.5vl:latest "Hello!"
```

## System Requirements

### Minimum
- **RAM:** 16GB
- **Storage:** 10GB free
- **GPU:** Optional but recommended

### Recommended
- **RAM:** 32GB+
- **GPU:** NVIDIA with 8GB+ VRAM
- **Storage:** 20GB+ free

## Model Options

| Model | Size | RAM Needed | Notes |
|-------|------|------------|-------|
| `qwen2.5vl:latest` | ~4GB | 8GB+ | Vision model, my choice for forms |
| `llava` | ~4GB | 8GB+ | Alternative vision model |
| `llava:13b` | ~8GB | 16GB+ | Better accuracy, slower |
| `mistral` | ~4GB | 8GB+ | Text only, no vision |

## Troubleshooting

### "Out of memory" errors
- Close other applications
- Use a smaller model variant
- Add swap space (Linux)

### Slow responses
- Ensure GPU is being used: `nvidia-smi`
- Check for thermal throttling
- Consider using the cloud API instead

### Docker GPU not working
```bash
# Check NVIDIA Docker runtime is installed
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# If it fails, install nvidia-container-toolkit
```

### Model not found
```bash
# List installed models
docker exec -it ollama ollama list

# Pull the model
docker exec -it ollama ollama pull qwen2.5vl:latest
```

## My Recommendation

Unless you have a high-end machine, I'd recommend using the **Browser Use Cloud API** instead:

- No local resources needed
- Works on any machine
- More reliable results
- Just needs an API key

Set `USE_BROWSER_USE_CLOUD=true` in your `.env` and you're good to go.

---

This guide is here for those who want to experiment with local AI, but my production setup uses the cloud API.
