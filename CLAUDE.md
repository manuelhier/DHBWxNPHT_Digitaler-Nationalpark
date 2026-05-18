# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DHBW student project: a chatbot for **Nationalpark Hohe Tauern** (Austria's largest Alpine national park). Architecture is AnythingLLM as a headless RAG backend, with a custom-built frontend communicating via AnythingLLM's OpenAI-compatible API.

## Repository Structure

```
anythingllm/          # RAG backend (AnythingLLM in Docker)
  docker_compose.yml  # Single-service compose file
  .env                # Active config (gitignored)
  env.example         # Full reference of all supported env vars
  config/
    system-prompt-v1.md  # Versioned system prompts (German)
  storage/            # Persistent data volume (gitignored)

frontend/             # Custom chat UI (not yet scaffolded)
data/                 # Source documents for RAG ingestion
```

## Running AnythingLLM

```bash
mkdir -p anythingllm/storage
cd anythingllm
docker compose -f docker_compose.yml up -d
docker logs anythingllm          # confirm ready on port 3001
```

Admin UI: `http://localhost:3001`
Swagger API docs: `http://localhost:3001/api/docs`

Restart after `.env` changes:
```bash
docker compose -f docker_compose.yml restart
```

## API Integration

AnythingLLM exposes an OpenAI-compatible endpoint. The workspace slug acts as the model name:

```js
import OpenAI from "openai";
const client = new OpenAI({
  baseURL: "http://localhost:3001/api/v1/openai",
  apiKey: "YOUR_ANYTHINGLLM_API_KEY",
});
const res = await client.chat.completions.create({
  model: "your-workspace-slug",
  messages: [{ role: "user", content: "..." }],
});
```

API keys are managed in the AnythingLLM admin UI under Settings → API Keys.

## Environment Configuration

Copy `anythingllm/env.example` → `anythingllm/.env` and fill in:

| Key | Purpose |
|---|---|
| `JWT_SECRET` | Token signing — generate with `openssl rand -hex 32` |
| `GROQ_API_KEY` | LLM inference (free tier at console.groq.com) |
| `GROQ_MODEL_PREF` | Currently `llama-3.1-8b-instant` |
| `STORAGE_DEVICE_PATH` | Host path for the storage bind mount |
| `DISABLE_MODEL_CHANGING` | Lock model in UI (`true`) |

Embedding runs natively inside the container (no extra API key). Vector DB is LanceDB (embedded, no separate service).

## System Prompt

The chatbot answers in German by default, switches to English if the user writes in English. Prompts are versioned in `anythingllm/config/`. Paste the active prompt into the workspace settings via the admin UI or API.

Emergency number for mountain incidents: **140** (Bergrettung Österreich) — always referenced in the system prompt.

## Frontend

A static HTML prototype lives in `frontend/index.html` — open directly in a browser, no build step. It replicates the hohetauern.at hero section (nav, Großglockner background, park stats) and shows two chat entry points: a hero button and a floating FAB bottom-right. The `sendMessage()` stub in the script needs replacing with a real fetch to the AnythingLLM API.

Planned production stack: React + Vite + Tailwind CSS + `@assistant-ui/react` + `openai` npm package.

**UI entry points:** The chat can be opened from the hero CTA ("Park-Assistent fragen") or the persistent floating bubble. Both toggle the same overlay. Color scheme is park green (`#2d6a2d`) throughout.

**Deployment options:**
- Standalone page (student demo)
- Embedded widget via AnythingLLM's built-in script tag — drops into the existing hohetauern.at site with no custom frontend needed

## Chatbot Use Cases

Four topic areas, with example questions per area:

**General Information**
- Park zones and what's allowed/forbidden in each
- Visitor centre locations and opening times
- History and founding of the park
- Three state sections (Salzburg, Tyrol, Carinthia)

**Accommodation & Travel**
- Alpine huts (Alpenvereinshütten) — altitude, capacity, season
- Base villages (Zell am See, Matrei, Heiligenblut)
- Public transport connections (Postbus, train)
- Parking and road access

**Hiking & Activities**
- Trails by difficulty, distance, elevation
- Multi-day routes (e.g. Tauern Höhenweg)
- Via ferratas and guided ranger tours
- Winter activities (ski touring, snowshoeing)

**Nature & Wildlife**
- Flagship species: Steinbock, Bartgeier, Murmeltier, Steinadler
- Altitude vegetation zones and flowering seasons
- Glaciers (Pasterze) and geology
- Natura 2000 protected habitats

## RAG Document Scope

Documents procured manually from official park authorities (Salzburg/Tyrol/Carinthia sections) and Natura 2000 sources — not scraped. Quality over quantity: 20 curated documents beats 200 scraped pages. Primary language is German.
