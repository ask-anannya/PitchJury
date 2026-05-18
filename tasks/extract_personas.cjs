const fs = require('fs');
const text = fs.readFileSync('tasks/quantitative_sim_spec.md', 'utf8');
const matches = text.match(/\n```json\n([\s\S]*?)\n```/g);
if (!matches) { console.log('No matches'); process.exit(1); }
for (let i = 0; i < matches.length; i++) {
  const json = matches[i].replace(/\n```json\n|\n```/g, '');
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr) && arr.length > 0 && arr[0].key) {
      console.log('--- Panel', i, '---');
      arr.forEach(p => {
        console.log(JSON.stringify({
          key: p.key,
          archetype: p.archetype,
          name: p.name,
          role: p.role,
          weight_pct: p.weight_pct,
          background: p.background,
          evaluation_lens: p.evaluation_lens,
          hasImg: !!p.img
        }));
      });
    }
  } catch(e) {}
}
