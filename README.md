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
git clone https://github.com/manuelhier/DHBWxNPHT_Digitaler-Nationalpark.git
cd DHBWxNPHT_Digitaler-Nationalpark
```

### 2. `.env`-Datei einbinden

Die `.env`-Datei enthält API-Keys und Secrets und wird **nicht** im Repository gespeichert. Sie wird separat bereitgestellt.

> Die Datei muss unter `setup/.env` liegen – genau dort erwartet Docker Compose sie.

### 3. Alle Container starten

```bash
docker compose up -d
```

Docker Compose startet drei Dienste:

| Container | Aufgabe |
|---|---|
| `npht-anythingllm` | RAG-Backend (AnythingLLM) auf Port 3001 |
| `npht-setup` | Richtet Workspace, Dokumente und Chat-Widget automatisch ein, beendet sich danach |
| `npht-frontend` | Nginx-Server mit dem Chat-Frontend auf Port 3002 |

Der Setup-Container wartet automatisch, bis AnythingLLM bereit ist, und führt dann folgende Schritte aus:
- Workspace `hohe-tauern` erstellen
- System-Prompt einspielen
- Dokumente aus `anythingllm/data/` hochladen und einbetten
- Embed-Config für das Chat-Widget anlegen
- `frontend/config.json` mit der generierten Embed-ID schreiben

Logs des Setup-Containers prüfen:

```bash
docker logs npht-setup
```

Erwartete Ausgabe am Ende: `✓ Done. Workspace slug: hohe-tauern, embed UUID: <uuid>`

---

## Zugriff

| Dienst | URL |
|---|---|
| Chat-Frontend | <http://localhost:3002> |
| AnythingLLM Admin UI | <http://localhost:3001> |
| API-Dokumentation (Swagger) | <http://localhost:3001/api/docs> |

---

## Container verwalten

```bash
# Stoppen
docker compose down

# Neu starten (z.B. nach .env-Änderungen)
docker compose restart

# Status prüfen
docker ps
```

**Kompletter Neuaufbau** (Workspace und Dokumente werden neu eingespielt):

```bash
docker compose down
docker compose up -d
```

Da der Setup-Container bei jedem Start den Workspace neu anlegt, wird dabei auch eine neue Embed-ID generiert und `frontend/config.json` aktualisiert.

---

## Projektstruktur

```
docker-compose.yml      # Orchestriert alle drei Dienste

anythingllm/
  config/               # Versionierte System-Prompts (deutsch)
  env.example           # Vorlage mit allen verfügbaren Variablen

setup/
  setup.sh              # Automatisches Setup-Skript
  Dockerfile
  .env                  # Secrets – nicht committen (gitignored)

frontend/
  index.html            # Chat-Frontend (via Nginx auf Port 3002)
  config.json           # Generiert vom Setup-Container – nicht committen (gitignored)

config/
  nginx.conf            # Nginx-Konfiguration (proxied /api/ und /embed/ zu AnythingLLM)

anythingllm/
  data/                 # Quelldokumente für RAG-Ingestion
```

---

## Häufige Probleme

**Chat-Widget lädt nicht / „config.json nicht gefunden":**

Der Setup-Container ist noch nicht durchgelaufen oder ist fehlgeschlagen.

```bash
docker logs npht-setup
```

Danach ggf. neu starten: `docker compose up -d`

**Port 3001 oder 3002 bereits belegt:**

```bash
docker ps  # prüfen welcher Container den Port belegt
```

**`.env` wurde versehentlich committet:**

```bash
git rm --cached setup/.env
git commit -m "remove .env from tracking"
```

Danach alle API-Keys sofort rotieren.
