#!/usr/bin/env python3
import os, json, re, argparse
import requests
import boto3

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
REPO = os.environ["REPO"]
PR_NUMBER = os.environ["PR_NUMBER"]
AWS_REGION = os.environ.get("AWS_REGION", "us-west-2")
MODEL_ID = os.environ.get("ANTHROPIC_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "4000"))

GH_API = "https://api.github.com"

# Debug toggle (set DEBUG=1 in workflow env to enable)
DEBUG = os.environ.get("DEBUG", "0") == "1"
def debug(msg: str):
    if DEBUG:
        print(f"DEBUG: {msg}")

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
        if not chunk:
            break
        files.extend(chunk)
        page += 1
    return files

def get_full_pr_diff_text() -> str:
    """
    Fallback: fetch entire PR diff as unified text using 'diff' media type.
    """
    url = f"{GH_API}/repos/{REPO}/pulls/{PR_NUMBER}"
    headers = gh_headers().copy()
    headers["Accept"] = "application/vnd.github.v3.diff"
    resp = requests.get(url, headers=headers)
    resp.raise_for_status()
    return resp.text or ""

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

def build_unified_diff(files):
    """
    Build a unified diff from the GitHub 'files' API.
    If files lack 'patch' (binary/large), returns empty string and caller may fallback.
    """
    diffs = []
    for f in files:
        filename = f.get("filename")
        status = f.get("status")
        has_patch = "patch" in f

        debug(f"file: {filename} status={status} has_patch={has_patch}")
        if not has_patch:
            continue

        if status == "removed":
            header = f"--- a/{filename}\n+++ /dev/null\n"
        else:
            header = f"--- a/{filename}\n+++ b/{filename}\n"
        patch = f["patch"]
        diffs.append(header + patch)
    return "\n".join(diffs)

def call_bedrock(prompt: str) -> str:
    req = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": MAX_TOKENS,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": [{"type":"text", "text": prompt}]}
        ]
    }
    resp = bedrock.invoke_model(
        modelId=MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(req),
    )
    body = json.loads(resp["body"].read())
    parts = body.get("content", [])
    text = ""
    for p in parts:
        if p.get("type") == "text":
            text += p.get("text","")
    return text.strip()

def extract_verdict(markdown: str) -> str:
    """
    Naively infer a verdict string from the combined markdown:
    approve | comment | request_changes
    """
    m = re.search(r'Overall verdict.*?:\s*(.+)', markdown, re.IGNORECASE | re.DOTALL)
    text = (m.group(1) if m else markdown).lower()
    if "request changes" in text or "changes requested" in text:
        return "request_changes"
    if "approve" in text or "lgtm" in text:
        return "approve"
    return "comment"

def chunk_text(text: str, max_chars: int = 12000):
    text = text.strip()
    if len(text) <= max_chars:
        return [text]
    chunks, start = [], 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        split = text.rfind("\n@@", start, end)
        if split == -1 or split <= start + 1000:
            split = text.rfind("\n", start, end)
            if split == -1 or split <= start:
                split = end
        chunks.append(text[start:split])
        start = split
    return chunks

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--emit-verdict", action="store_true")
    args = parser.parse_args()

    files = get_changed_files()
    debug(f"files count from GitHub API: {len(files)}")

    if not files:
        out = "No changed files detected."
        create_or_update_comment(out)
        print("comment" if args.emit_verdict else "", end="")
        return

    unified = build_unified_diff(files)
    debug(f"unified diff length (from files API): {len(unified)}")

    if not unified:
        debug("no patches via files API; fetching full PR diff text…")
        unified = get_full_pr_diff_text()
        debug(f"unified diff length (full PR diff): {len(unified)}")

    if not unified:
        out = "Changed files are binary or too large; no textual diff available."
        create_or_update_comment(out)
        print("comment" if args.emit_verdict else "", end="")
        return

    chunks = chunk_text(unified)
    all_sections = []
    for i, chunk in enumerate(chunks, 1):
        user = USER_PREFIX.format(repo=REPO, pr=PR_NUMBER, diff=chunk)
        debug(f"sending chunk {i}/{len(chunks)} to model; chunk_len={len(chunk)}")
        section = call_bedrock(user)
        all_sections.append(f"### Chunk {i}/{len(chunks)}\n\n{section}")

    final = (
        "## 🤖 Claude AI Code Review\n"
        "_Model_: `{model}` | _Region_: `{region}`\n\n"
        "{sections}\n\n"
        "### Overall verdict: comment\n"
        "> Note: Large PRs are reviewed in chunks."
    ).format(
        model=MODEL_ID, region=AWS_REGION, sections="\n\n---\n\n".join(all_sections)
    )

    create_or_update_comment(final)

    if args.emit_verdict:
        verdict_text = extract_verdict("\n\n".join(all_sections))
        print(verdict_text, end="")

if __name__ == "__main__":
    main()
