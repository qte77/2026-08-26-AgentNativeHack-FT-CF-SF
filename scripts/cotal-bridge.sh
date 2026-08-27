#!/usr/bin/env bash
# cotal-bridge.sh
#
# Polls this project's live checkpoint feed and announces each new episode
# to the Cotal team channel (team.nolim) - real, judge-visible coordination
# evidence at hack.cotal.ai/graph.
#
# Runs persistently inside the Tenki cloud sandbox ("cotal-bridge-persistent")
# via session.exec("bash", {args: ["-lc", "..."]}), once `cotal` is
# authenticated there (mesh registration + login are handled by a separate
# effort - this script assumes that is already done).
#
# Context: README.md "Cotal mesh coordination" section, and
# docs/plans/0001-agent-native-hackathon-submission.md, row 7a.
#
# Requires: curl, and one of {jq, python3} (falls back to a sed/grep-based
# extraction if neither is present). Availability is checked at startup,
# never assumed.

set -uo pipefail
# Deliberately NOT `set -e`: a single failed curl or cotal call must log and
# let the loop continue, not kill the whole bridge (spec requirement #4).

BASE_URL="https://agent-native-hack.cloudflare-driveway392.workers.dev"
SEEN_FILE="${HOME}/.cotal-bridge-seen"
COTAL_BIN="${HOME}/.local/bin/cotal"
TEAM_CHANNEL="team.nolim"
POLL_INTERVAL=25 # seconds; spec asks for ~20-30s

log() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

touch "$SEEN_FILE" 2>/dev/null || true

# --- pick a JSON extraction strategy once, at startup ---
if command -v jq >/dev/null 2>&1; then
  JSON_TOOL="jq"
elif command -v python3 >/dev/null 2>&1; then
  JSON_TOOL="python3"
else
  JSON_TOOL="fallback"
fi
log "cotal-bridge starting - JSON extraction method: ${JSON_TOOL}"

if [ ! -x "$COTAL_BIN" ]; then
  log "warning: ${COTAL_BIN} not found or not executable yet - announces will fail and retry until it is"
fi

# stdin: raw body of GET /checkpoints -> {"ids": [...]}. stdout: one id per line.
extract_ids() {
  case "$JSON_TOOL" in
    jq)
      jq -r '.ids[]?' 2>/dev/null
      ;;
    python3)
      python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for i in data.get("ids", []) or []:
    print(i)
' 2>/dev/null
      ;;
    *)
      # Minimal fallback: the "ids" array only ever contains UUIDs, so pulling
      # every UUID-shaped token out of the response is equivalent here.
      tr -d '\n' | grep -oE '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
      ;;
  esac
}

# stdin: raw body of GET /checkpoints/<id> -> {"episode": {"decision": {"goal": "..."}}, ...}.
# stdout: the goal string, or nothing if absent/unparseable.
extract_goal() {
  case "$JSON_TOOL" in
    jq)
      jq -r '.episode.decision.goal // empty' 2>/dev/null
      ;;
    python3)
      python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
goal = (data.get("episode") or {}).get("decision", {}).get("goal")
if goal:
    print(goal)
' 2>/dev/null
      ;;
    *)
      # decision.goal is always the first field written inside the "decision"
      # object (src/checkpoint.ts / src/types.ts), so this holds even though
      # the Worker pretty-prints the JSON across multiple lines.
      tr -d '\n' | sed -n -E 's/.*"decision"[[:space:]]*:[[:space:]]*\{[[:space:]]*"goal"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/p'
      ;;
  esac
}

already_seen() {
  grep -qxF "$1" "$SEEN_FILE" 2>/dev/null
}

mark_seen() {
  printf '%s\n' "$1" >>"$SEEN_FILE"
}

announce() {
  local id="$1" goal="$2" msg
  msg="Episode ${id}: ${goal}"
  if "$COTAL_BIN" send msg "$TEAM_CHANNEL" "$msg"; then
    log "announced episode ${id}"
    mark_seen "$id"
  else
    log "cotal send failed for episode ${id} - not marking seen, will retry next poll"
  fi
}

poll_once() {
  local list_body ids id detail_body goal

  if ! list_body="$(curl -s --max-time 15 "${BASE_URL}/checkpoints")"; then
    log "curl failed fetching ${BASE_URL}/checkpoints - skipping this poll"
    return
  fi
  if [ -z "$list_body" ]; then
    log "empty response from /checkpoints - skipping this poll"
    return
  fi

  ids="$(printf '%s' "$list_body" | extract_ids)"
  if [ -z "$ids" ]; then
    log "no episode ids parsed from /checkpoints response - skipping this poll"
    return
  fi

  while IFS= read -r id; do
    [ -z "$id" ] && continue
    already_seen "$id" && continue

    if ! detail_body="$(curl -s --max-time 15 "${BASE_URL}/checkpoints/${id}")"; then
      log "curl failed fetching /checkpoints/${id} - will retry next poll"
      continue
    fi
    if [ -z "$detail_body" ]; then
      log "empty response for episode ${id} - will retry next poll"
      continue
    fi

    goal="$(printf '%s' "$detail_body" | extract_goal)"
    if [ -z "$goal" ]; then
      log "could not extract decision.goal for episode ${id} - will retry next poll"
      continue
    fi

    announce "$id" "$goal"
  done <<<"$ids"
}

log "polling ${BASE_URL}/checkpoints every ${POLL_INTERVAL}s, announcing new episodes to ${TEAM_CHANNEL}"
while true; do
  poll_once
  sleep "$POLL_INTERVAL"
done
