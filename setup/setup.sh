#!/usr/bin/env bash
set -euo pipefail

BASE="http://anythingllm:3001"
WORKSPACE_NAME="${ANYTHINGLLM_WORKSPACE_NAME:-hohe-tauern}"
OLLAMA_BASE="${OLLAMA_BASE_PATH:-http://ollama:11434}"
MODEL="${OLLAMA_MODEL_PREF:-MichelRosselli/apertus:8b-instruct-2509-q4_k_m}"

if [ "${LLM_PROVIDER:-}" = "ollama" ]; then
  echo "→ Waiting for Ollama..."
  until curl -sf "$OLLAMA_BASE/api/tags" > /dev/null 2>&1; do sleep 3; done

  echo "→ Checking model: $MODEL..."
  if curl -sf "$OLLAMA_BASE/api/tags" | jq -r '.models[].name' | grep -qF "$MODEL"; then
    echo "   Already present, skipping pull"
  else
    echo "   Pulling model (first run: ~5 GB, may take several minutes)..."
    curl -sf -X POST "$OLLAMA_BASE/api/pull" \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"$MODEL\"}" \
      -o /dev/null
    echo "✓ Model ready"
  fi
fi


echo "→ Logging in..."
JWT=$(curl -sf -X POST "$BASE/api/request-token" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$AUTH_TOKEN\"}" \
  | jq -r '.token')

# Create a fresh API key
echo "→ Creating API key..."
API_KEY=$(curl -sf -X POST "$BASE/api/system/generate-api-key" \
  -H "Authorization: Bearer $JWT" \
  | jq -r '.apiKey.secret')

AUTH="Authorization: Bearer $API_KEY"

# Nuke existing workspace
echo "→ Removing existing workspace (nuke-and-rebuild)..."
EXISTING_SLUG=$(curl -sf "$BASE/api/v1/workspaces" \
  -H "$AUTH" \
  | jq -r --arg name "$WORKSPACE_NAME" '.workspaces[] | select(.name==$name) | .slug // empty')

if [ -n "$EXISTING_SLUG" ]; then
  curl -sf -X DELETE "$BASE/api/v1/workspace/$EXISTING_SLUG" -H "$AUTH" > /dev/null
  echo "   Deleted: $EXISTING_SLUG"
fi

# Create workspace
echo "→ Creating workspace..."
SLUG=$(curl -sf -X POST "$BASE/api/v1/workspace/new" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$WORKSPACE_NAME\"}" \
  | jq -r '.workspace.slug')

# Apply system prompt
echo "→ Applying system prompt..."
PROMPT=$(cat /config/system-prompt-v1.md)
curl -sf -X POST "$BASE/api/v1/workspace/$SLUG/update" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"openAiPrompt\": $(echo "$PROMPT" | jq -Rs .), \"queryRefusalResponse\": \"Dazu habe ich leider keine Informationen. Ich beantworte nur Fragen zum Nationalpark Hohe Tauern.\", \"chatMode\": \"query\"}" > /dev/null

# Upload documents from /data
echo "→ Uploading documents..."
ADDED_DOCS=()
for f in /data/*; do
  [ -f "$f" ] || continue
  echo "   + $(basename "$f")"
  DOC_LOC=$(curl -sf -X POST "$BASE/api/v1/document/upload" \
    -H "$AUTH" \
    -F "file=@$f" \
    | jq -r '.documents[0].location')
  ADDED_DOCS+=("\"$DOC_LOC\"")
done

# Embed documents into workspace
if [ ${#ADDED_DOCS[@]} -gt 0 ]; then
  echo "→ Embedding ${#ADDED_DOCS[@]} document(s)..."
  ADDS=$(IFS=,; echo "${ADDED_DOCS[*]}")
  curl -sf -X POST "$BASE/api/v1/workspace/$SLUG/update-embeddings" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{\"adds\": [$ADDS], \"deletes\": []}" > /dev/null
fi

# Write nginx auth include so frontend nginx can inject the Authorization header
echo "→ Writing nginx auth include to /run/config/anythingllm-auth.conf..."
mkdir -p /run/config
printf 'proxy_set_header Authorization "Bearer %s";\n' "$API_KEY" > /run/config/anythingllm-auth.conf
printf '{"workspace":"%s"}\n' "$SLUG" > /run/config/anythingllm-slug.json

echo "✓ Done. Workspace slug: $SLUG"
