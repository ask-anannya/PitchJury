import re, json, sys

with open('/workspace/app-bn2wrjsgz11d/src/lib/personas.ts', 'r') as f:
    text = f.read()

# Extract persona blocks more carefully
blocks = re.findall(r'\{\s*key:\s*"([^"]+)".*?isRepresentative:\s*(?:true|false)\s*\}', text, re.DOTALL)
print(f"Found {len(blocks)} persona blocks")

# Better approach: find all persona entries
pattern = r'key:\s*"([^"]+)".*?archetype:\s*"([^"]+)".*?name:\s*"([^"]+)".*?role:\s*"([^"]+)".*?weight_pct:\s*([0-9.]+).*?background:\s*"([^"]*)".*?evaluation_lens:\s*"([^"]*)".*?image:\s*"([^"]*)".*?isRepresentative:\s*(true|false)'
matches = re.findall(pattern, text, re.DOTALL)

personas = []
for m in matches:
    personas.append({
        'key': m[0],
        'archetype': m[1],
        'name': m[2],
        'role': m[3],
        'weight_pct': float(m[4]),
        'image': m[7],
        'isRepresentative': m[8] == 'true'
    })

print(f'Total personas: {len(personas)}')
for p in personas:
    print(f"  {p['key']}: {p['name']} ({p['role']}) - rep={p['isRepresentative']}, img={'yes' if p['image'] else 'no'}")

# Save to JSON for the generation script
with open('/workspace/app-bn2wrjsgz11d/tasks/personas.json', 'w') as f:
    json.dump(personas, f, indent=2)
