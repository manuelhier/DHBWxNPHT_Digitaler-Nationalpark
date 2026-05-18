# Digitalpark Hohe Tauern – Chatbot

DHBW Studienprojekt in Kooperation mit dem Nationalpark Hohe Tauern.
KI-gestützter Chatbot auf Basis von AnythingLLM mit eigenem Frontend.

---

## Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installiert und gestartet
- Zugriff auf die geteilte `.env`-Datei (siehe unten)

---

## Einrichtung

### 1. Repository klonen

```bash
git clone <repo-url>
cd DHBWxNPHT_Digitaler-Nationalpark
```

### 2. `.env`-Datei einbinden

Die `.env`-Datei enthält API-Keys und Secrets und wird **nicht** im Repository gespeichert. Sie wird separat bereitgestellt.

> Die Datei muss unter `anythingllm/.env` liegen – genau dort erwartet Docker Compose sie.

### 3. Container starten

```bash
cd anythingllm
docker compose -f docker_compose.yml up -d
```

Logs prüfen:

```bash
docker logs anythingllm
```

Sobald im Log `Listening on port 3001` erscheint, ist das System bereit.

---

## Zugriff

| Dienst | URL |
| --- | --- |
| Admin UI / Setup-Wizard | <http://localhost:3001> |
| API Dokumentation (Swagger) | <http://localhost:3001/api/docs> |
| Demo Frontend | `frontend/index.html` direkt im Browser öffnen |

---

## Container verwalten

```bash
# Stoppen
docker compose -f docker_compose.yml down

# Neu starten (z.B. nach .env-Änderungen)
docker compose -f docker_compose.yml restart

# Status prüfen
docker ps
```

---

## Projektstruktur

```
anythingllm/        # RAG-Backend (AnythingLLM)
  docker_compose.yml
  .env              # Secrets – nicht committen (gitignored)
  env.example       # Vorlage mit allen verfügbaren Variablen
  config/           # Versionierte System-Prompts
  storage/          # Persistente Daten – nicht committen (gitignored)

frontend/           # Eigenes Chat-Frontend
  index.html        # Demo-Prototyp (kein Build nötig)

data/               # Quelldokumente für RAG-Ingestion
```

---

## Häufige Probleme

**Container startet nicht:**
Sicherstellen dass `anythingllm/.env` existiert und `STORAGE_DEVICE_PATH=./storage` gesetzt ist.

**Port 3001 bereits belegt:**

```bash
docker ps  # prüfen welcher Container den Port belegt
```

**`.env` wurde versehentlich committet:**

```bash
git rm --cached anythingllm/.env
git commit -m "remove .env from tracking"
```

Danach alle API-Keys sofort rotieren.
