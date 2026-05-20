#!/usr/bin/env python3
"""Generate avatar images for all personas using the image generation API."""

import json, os, re, time, base64, requests, sys

API_KEY = os.environ.get("INTEGRATIONS_API_KEY")
SUBMIT_URL = "https://app-bn2wrjsgz11d-api-zYkZzKQJrBdL.gateway.appmedo.com/image-generation/submit"
QUERY_URL = "https://app-bn2wrjsgz11d-api-GYX1lzGw0DQa.gateway.appmedo.com/image-generation/task"
OUT_DIR = "/workspace/app-bn2wrjsgz11d/tasks/avatars"

os.makedirs(OUT_DIR, exist_ok=True)

STYLE_PROMPT = (
    "Flat vector illustration portrait, upper body bust shot, "
    "clean modern corporate style, vibrant bold colors with purple and teal accents, "
    "solid color background, friendly professional expression, "
    "minimalist design, no text, no shadows, flat shading, "
    "head and shoulders only, centered composition"
)


def extract_personas():
    with open("/workspace/app-bn2wrjsgz11d/src/lib/personas.ts", "r") as f:
        text = f.read()
    pattern = r'key:\s*"([^"]+)".*?archetype:\s*"([^"]+)".*?name:\s*"([^"]+)".*?role:\s*"([^"]+)".*?weight_pct:\s*([0-9.]+).*?background:\s*"([^"]*)".*?evaluation_lens:\s*"([^"]*)".*?image:\s*"([^"]*)".*?isRepresentative:\s*(true|false)'
    matches = re.findall(pattern, text, re.DOTALL)
    personas = []
    for m in matches:
        if m[0] in ("seed_investors", "enterprise_buyers", "hiring_managers", "series_a_investors"):
            continue  # skip panel keys
        personas.append({
            "key": m[0],
            "archetype": m[1],
            "name": m[2],
            "role": m[3],
            "isRepresentative": m[8] == "true",
        })
    return personas


def build_prompt(persona):
    name = persona["name"]
    archetype = persona["archetype"]
    role = persona["role"]
    return (
        f"Professional bust portrait of {name}, a {archetype} ({role}). "
        f"{STYLE_PROMPT}"
    )


def submit_task(prompt):
    headers = {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": f"Bearer {API_KEY}",
    }
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    resp = requests.post(SUBMIT_URL, headers=headers, json=body)
    resp.raise_for_status()
    data = resp.json()
    if data.get("status") != 0:
        raise Exception(f"Submit error: {data.get('message')}")
    return data["data"]["taskId"]


def query_task(task_id):
    headers = {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": f"Bearer {API_KEY}",
    }
    resp = requests.post(QUERY_URL, headers=headers, json={"taskId": task_id})
    resp.raise_for_status()
    data = resp.json()
    if data.get("status") != 0:
        raise Exception(f"Query error: {data}")
    return data["data"]


def save_image(task_result, persona_key):
    markdown = task_result["result"]["candidates"][0]["content"]["parts"][0]["text"]
    match = re.search(r'data:[^;]+;base64,([^)]+)', markdown)
    if not match:
        print(f"  [{persona_key}] Could not extract base64")
        return False
    b64 = match.group(1)
    img_path = os.path.join(OUT_DIR, f"{persona_key}.jpg")
    with open(img_path, "wb") as f:
        f.write(base64.b64decode(b64))
    print(f"  [{persona_key}] Saved to {img_path}")
    return True


def main():
    personas = extract_personas()
    print(f"Found {len(personas)} personas")

    # Submit all tasks
    tasks = {}
    print("\nSubmitting tasks...")
    for p in personas:
        prompt = build_prompt(p)
        try:
            tid = submit_task(prompt)
            tasks[tid] = p["key"]
            print(f"  [{p['key']}] taskId={tid}")
        except Exception as e:
            print(f"  [{p['key']}] Submit FAILED: {e}")

    print(f"\nSubmitted {len(tasks)} tasks. Polling for results...")

    completed = set()
    failed = set()
    deadline = time.time() + 30 * 60  # 30 min timeout

    while len(completed) + len(failed) < len(tasks) and time.time() < deadline:
        for tid, key in list(tasks.items()):
            if key in completed or key in failed:
                continue
            try:
                result = query_task(tid)
                status = result.get("status")
                if status == "SUCCESS":
                    save_image(result, key)
                    completed.add(key)
                elif status == "FAILED":
                    print(f"  [{key}] FAILED: {result.get('error')}")
                    failed.add(key)
                elif status == "TIMEOUT":
                    print(f"  [{key}] TIMEOUT")
                    failed.add(key)
                # PENDING -> keep polling
            except Exception as e:
                print(f"  [{key}] Query error: {e}")
        if len(completed) + len(failed) < len(tasks):
            time.sleep(7)

    print(f"\nDone! Completed: {len(completed)}, Failed: {len(failed)}")
    print(f"Images saved to: {OUT_DIR}")

    # Save mapping
    mapping = {p["key"]: f"/tasks/avatars/{p['key']}.jpg" for p in personas if p["key"] in completed}
    with open(os.path.join(OUT_DIR, "mapping.json"), "w") as f:
        json.dump(mapping, f, indent=2)


if __name__ == "__main__":
    main()
