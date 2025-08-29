#!/usr/bin/env python3
import os, json, re, argparse
import requests
import boto3

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
REPO = os.environ["REPO"]
PR_NUMBER = os.environ["PR_NUMBER"]
AWS_REGION = os.environ.get("AWS_REGION", "us-west-2")
MODEL_ID = os.environ.get("ANTHROPIC_MODEL_ID", "anthropic.claude-3-7-sonnet-20250219-v1:0")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "4000"))

GH_API = "https://api.github.com"

# ---------- GitHub helpers ----------
def gh_headers():
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

def get_changed_files():
    url = f"{GH_API}/repos/{REPO}/pulls/{PR_NUMBER}/files"
    files = []
    page = 1
    while True:
        resp = requests.get(url, headers=gh_headers(), params={"page": page, "per_page": 100})
        resp.raise_for_status()
        chunk = resp.json()
        if not chunk: break
        files.extend(chunk)
        page += 1
    return files

def create_or_update_comment(body: str):
    list_url = f"{GH_API}/repos/{REPO}/issues/{PR_NUMBER}/comments"
    resp = requests.get(list_url, headers=gh_headers())
    resp.raise_for_status()
    comments = resp.json()
    marker = "<!-- ai-code-review:bedrock-claude -->"

    existing = next((c for c in comments if c.get("body","").startswith(marker)), None)
    payload = {"body": f"{marker}\n{body}"}

    if existing:
        edit_url = f"{GH_API}/repos/{REPO}/issues/comments/{existing['id']}"
        r = requests.patch(edit_url, headers=gh_headers(), json=payload)
        r.raise_for_status()
    else:
        r = requests.post(list_url, headers=gh_headers(), json=payload)
        r.raise_for_status()

# ---------- Bedrock (Anthropic Messages) ----------
bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)

SYSTEM_PROMPT = """You are a rigorous senior software engineer performing code review on a Pull Request.
Focus on: correctness, security, performance, maintainability, readability, and tests.
Be concise but specific. Provide actionable suggestions and short examples.
Never leak secrets. If you detect keys/tokens, flag them clearly.
Prefer language-idiomatic recommendations. Return Markdown with clear headings and bullet points.
When a change is OK, say so briefly.
"""

USER_PREFIX = """PR metadata:
- Repository: {repo}
- PR #: {pr}

Review the following unified diffs. For each file:
- List concrete issues (if any) with short rationale.
- Security: note any input validation, XSS/SQLi, SSRF, deserialization, path traversal or secrets.
- Performance: obvious hot paths, N+1, unnecessary I/O.
- PHP/Moodle conventions (if relevant): coding style, API usage, globals, DB access, capability checks, xss-safe output.
- Provide quick-fix snippets where appropriate.
- Tests: suggest focused tests.

Return in **Markdown**, under these headings:
1. Summary
2. File-by-file notes
3. Security & Privacy
4. Performance
5. Tests
6. Overall verdict (approve / request changes / comment)

Diff chunk:
"""

