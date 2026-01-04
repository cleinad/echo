# Echo

Echo answers your questions in concise podcast style audio clips.

<img src="docs/extension-view.png" alt="Extension View" width="100%" />
<img src="docs/web-view.png" alt="Web View" width="100%" />

## Technologies

### Backend
- **Python 3.12** - Core language
- **FastAPI** - REST API framework
- **LangChain 1.2.0** - LLM orchestration
- **LangGraph 1.0.5** - Processing pipeline state machine
- **OpenAI API** / **Google Gemini** - Language models
- **ElevenLabs** - Text-to-speech synthesis
- **Supabase** - PostgreSQL database, storage, and authentication
- **Pydantic** - Data validation
- **pytest** - Testing framework

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling

### Extension
- **Plasmo** - Chrome extension framework
- **Chrome Extension API** - Browser integration

## Prerequisites

- **Python 3.12+**
- **Node.js 18+** and npm
- **Supabase account** (for database, storage, and auth)
- **API Keys**:
  - OpenAI API key (or Google API key)
  - ElevenLabs API key
  - Supabase URL and service role key

## Setup

### Quick Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Remember to add your API keys
cp .env.example .env
```

Edit `backend/.env` with your API keys. Example:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# LLM Configuration
OPENAI_API_KEY=your_openai_api_key

# TTS Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# App Settings
DEBUG=false
```

### Frontend Setup

```bash
cd web
npm install

# Create .env.local with your Supabase public keys
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Extension Setup

```bash
cd extension
npm install
```

## Running the Application

### Backend API Server

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Background Worker (Required)

**IMPORTANT**: The background worker processes pending audio clips. Without it, clips will remain in "pending" status.

```bash
# In a separate terminal
cd backend
source venv/bin/activate
python worker.py
```

The worker polls for pending clips every 10 seconds and processes them through the LangGraph pipeline.

### Web App

```bash
cd web
npm run dev
```

The web app will be available at http://localhost:3000

### Chrome Extension

```bash
cd extension
npm run dev
```

Then:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/build/chrome-mv3-dev` directory

## How It Works

1. **Capture**: Type a note through the Chrome extension or web app
2. **Configure**: Select target duration (2, 5, or 10 minutes) and optionally add additional information
3. **Process**: Background worker extracts content, generates a conversational script using LLM, and converts it to audio
4. **Listen**: Play audio clips in the web app with progress tracking and resume capability

## Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Test Script Generation

```bash
cd backend
source venv/bin/activate
python tests/test_script_generation.py
```

## License

 [LICENSE](LICENSE)
