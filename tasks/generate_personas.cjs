const fs = require('fs');

const text = fs.readFileSync('tasks/quantitative_sim_spec.md', 'utf8');
const matches = text.match(/\n```json\n([\s\S]*?)\n```/g);

const panels = [];
const seenArchetypes = new Set();

// Image mappings for representative personas
const imageMap = {
  'yc_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/YC partner.png',
  'angel_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/angel with operator background (2).png',
  'fc_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/first-cheque (1).png',
  'da_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/devils advocate.png',
  'tech_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/technical co investor.png',
  'mkt_p1': 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_dfd08014-4235-462b-8049-fa79247ec7ec.jpg',
  'vpe_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/vp of engineering.png',
  'cfo_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/cfo.png',
  'ciso_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/ciso.png',
  'proc_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/procurement lead.png',
  'eu_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/end user.png',
  'em_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/senior engineering manager.png',
  'hr_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/hr screener.png',
  'peer_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/potential temmate.png',
  'skip_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/skip-level director (1).png',
  'rec_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/recruiter (1).png',
  'lp_p1': 'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/Lead Partner.png',
  'assoc_p1': 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_ed9bc0d9-5f9d-4942-a72d-f3872190e711.jpg',
  'pf_p1': 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b8b4e9e6-24d2-468f-95bd-39ee687ce670.jpg',
  'op_p1': 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_ce858c2a-42a5-432c-a0a6-9decbe3e7f82.jpg',
};

const panelLabels = ['seed_investors', 'enterprise_buyers', 'hiring_managers', 'series_a_investors'];
const panelTitles = ['Seed Investors', 'Enterprise Buyers', 'Hiring Managers at Tech Companies', 'Series A Investors'];
const panelImages = [
  'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/seed invest.png',
  'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/enterprise buyers.png',
  'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/hiring managers.png',
  'https://miaoda-conversation-file.s3cdn.medo.dev/user-bkod68nngr28/app-bn2wrjsgz11d/20260518/series A.png',
];

let panelIdx = 0;
for (const match of matches || []) {
  const json = match.replace(/\n```json\n|\n```/g, '');
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr) && arr.length > 0 && arr[0].key) {
      const panelArchetypes = new Set();
      const personas = arr.map(p => {
        const isRep = !panelArchetypes.has(p.archetype);
        panelArchetypes.add(p.archetype);
        const img = imageMap[p.key] || '';
        return {
          key: p.key,
          archetype: p.archetype,
          name: p.name,
          role: p.role,
          weight_pct: p.weight_pct,
          background: p.background,
          evaluation_lens: p.evaluation_lens,
          image: img,
          isRepresentative: isRep,
        };
      });
      panels.push({
        key: panelLabels[panelIdx],
        label: panelTitles[panelIdx],
        image: panelImages[panelIdx],
        personas,
      });
      panelIdx++;
    }
  } catch(e) {}
}

// Generate TypeScript
let ts = `export interface Persona {
  key: string;
  archetype: string;
  name: string;
  role: string;
  weight_pct: number;
  background: string;
  evaluation_lens: string;
  image: string;
  isRepresentative: boolean;
}

export interface AudiencePanel {
  key: string;
  label: string;
  personas: Persona[];
  image: string;
}

`;

panels.forEach((panel, i) => {
  ts += `const ${panel.key}: AudiencePanel = {\n`;
  ts += `  key: "${panel.key}",\n`;
  ts += `  label: "${panel.label}",\n`;
  ts += `  image: "${panel.image}",\n`;
  ts += `  personas: [\n`;
  panel.personas.forEach(p => {
    ts += `    {\n`;
    ts += `      key: "${p.key}",\n`;
    ts += `      archetype: "${p.archetype}",\n`;
    ts += `      name: "${p.name}",\n`;
    ts += `      role: "${p.role}",\n`;
    ts += `      weight_pct: ${p.weight_pct},\n`;
    ts += `      background: "${p.background.replace(/"/g, '\\"')}",\n`;
    ts += `      evaluation_lens: "${p.evaluation_lens.replace(/"/g, '\\"')}",\n`;
    ts += `      image: "${p.image}",\n`;
    ts += `      isRepresentative: ${p.isRepresentative},\n`;
    ts += `    },\n`;
  });
  ts += `  ],\n`;
  ts += `};\n\n`;
});

ts += `export const audiencePanels: AudiencePanel[] = [\n`;
panels.forEach(p => {
  ts += `  ${p.key},\n`;
});
ts += `];\n\n`;

ts += `export function getPanelByKey(key: string): AudiencePanel | undefined {\n`;
ts += `  return audiencePanels.find((p) => p.key === key);\n`;
ts += `}\n\n`;

ts += `export function getRepresentativePersonas(panel: AudiencePanel): Persona[] {\n`;
ts += `  return panel.personas.filter((p) => p.isRepresentative);\n`;
ts += `}\n`;

fs.writeFileSync('src/lib/personas.ts', ts);
console.log('Generated personas.ts with', panels.reduce((s, p) => s + p.personas.length, 0), 'personas');
console.log('Representatives:', panels.reduce((s, p) => s + p.personas.filter(x => x.isRepresentative).length, 0));
