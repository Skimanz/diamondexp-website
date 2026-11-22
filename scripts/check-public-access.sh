#!/usr/bin/env bash
set -euo pipefail

site_url="${SITE_URL:-https://diamondexp.nz}"
task_tmp_dir="$(mktemp -d)"
live_json="$task_tmp_dir/availability.json"
headers="$task_tmp_dir/headers.txt"

fetch() {
  curl --fail --silent --show-error --location --retry 2 --max-time 30 "$@"
}

fetch --dump-header "$headers" --output "$live_json" "$site_url/availability.json"
grep -Eqi '^content-type:[[:space:]]*application/json' "$headers"
python3 -m json.tool "$live_json" >/dev/null
cmp availability.json "$live_json"

python3 - "$live_json" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as source:
    data = json.load(source)

assert data["days"]["2027-01-15"]["status"] == "unavailable"
assert data["days"]["2027-01-16"]["status"] == "unavailable"
assert {"pending", "booked", "unavailable"}.issubset(
    {entry["status"] for entry in data["days"].values()}
)
PY

fetch --output "$task_tmp_dir/availability.html" "$site_url/availability"
grep -q 'Ski availability' "$task_tmp_dir/availability.html"
grep -q 'New Zealand' "$task_tmp_dir/availability.html"

fetch --output "$task_tmp_dir/japan.html" "$site_url/japan"
grep -q 'Regular ¥95,000' "$task_tmp_dir/japan.html"
grep -q 'Peak ¥120,000' "$task_tmp_dir/japan.html"

chatgpt_user='Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot'
search_bot='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot'
fetch --user-agent "$chatgpt_user" --output /dev/null "$site_url/availability.json"
fetch --user-agent "$search_bot" --output /dev/null "$site_url/availability.json"

echo "Public availability, pricing and OpenAI access checks passed for $site_url."
