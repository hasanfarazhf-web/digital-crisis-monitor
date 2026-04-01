const DEMO = {
  middleEast: [
    { id: 'me-1', region: 'middleEast', title: 'Checkpoint congestion mentions rise', summary: 'Open-source statements reference delays and diversions near monitored corridor routes.', source: 'Demo feed', score: 0.82, credibility: 0.72, time: new Date(Date.now() - 5 * 60000).toISOString(), position: [25.2854, 51.5310], url: 'https://docs.x.com/x-api/posts/filtered-stream/introduction' },
    { id: 'me-2', region: 'middleEast', title: 'Port approach route under pressure', summary: 'Posts and statements indicate vehicle backups around access points and inspection lanes.', source: 'Demo feed', score: 0.68, credibility: 0.64, time: new Date(Date.now() - 16 * 60000).toISOString(), position: [26.2285, 50.5860], url: 'https://docs.x.com/x-api/webhooks/stream/quickstart' },
    { id: 'me-3', region: 'middleEast', title: 'Alternate route discussion appears', summary: 'Users mention using secondary roads away from main monitored corridors.', source: 'Demo feed', score: 0.58, credibility: 0.61, time: new Date(Date.now() - 28 * 60000).toISOString(), position: [24.4539, 54.3773], url: 'https://docs.x.com/x-api/posts/filtered-stream/introduction' }
  ],
  taiwan: [
    { id: 'tw-1', region: 'taiwan', title: 'Harbor district slowdown references', summary: 'Short burst of posts references slower truck movement and checks near the selected corridor.', source: 'Demo feed', score: 0.74, credibility: 0.66, time: new Date(Date.now() - 9 * 60000).toISOString(), position: [25.13, 121.74], url: 'https://docs.x.com/x-api/posts/filtered-stream/introduction' }
  ],
  westCoast: [
    { id: 'wc-1', region: 'westCoast', title: 'Port gate protest references', summary: 'Public mentions indicate gathering activity around cargo approaches.', source: 'Demo feed', score: 0.79, credibility: 0.71, time: new Date(Date.now() - 7 * 60000).toISOString(), position: [33.75, -118.2], url: 'https://docs.x.com/x-api/webhooks/stream/quickstart' }
  ],
  eastAfrica: [
    { id: 'ea-1', region: 'eastAfrica', title: 'CBD disruption mentions', summary: 'Open posts reference diversion points and downtown connector delays.', source: 'Demo feed', score: 0.71, credibility: 0.68, time: new Date(Date.now() - 12 * 60000).toISOString(), position: [-1.286, 36.817], url: 'https://docs.x.com/x-api/posts/filtered-stream/introduction' }
  ]
};

async function fetchRemote(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Feed ${res.status}`);
  return res.json();
}

function windowFilter(items, minutes) {
  const cutoff = Date.now() - (minutes * 60 * 1000);
  return items.filter(x => new Date(x.time).getTime() >= cutoff);
}

export default async function handler(req, res) {
  const region = req.query.region || 'middleEast';
  const minutes = Number(req.query.window || 45);
  const remote = process.env.SIGNALS_JSON_URL;

  if (!remote) {
    const items = windowFilter(DEMO[region] || DEMO.middleEast, minutes);
    return res.status(200).json({ items, rotationSeconds: 35, mode: 'demo' });
  }

  try {
    const payload = await fetchRemote(remote);
    const raw = Array.isArray(payload) ? payload : (payload.items || []);
    const scoped = raw.filter(x => !x.region || x.region === region);
    const items = windowFilter(scoped, minutes);
    res.status(200).json({ items, rotationSeconds: Number(payload.rotationSeconds || 35), mode: 'live-feed' });
  } catch (error) {
    const items = windowFilter(DEMO[region] || DEMO.middleEast, minutes);
    res.status(200).json({ items, rotationSeconds: 35, mode: 'demo-fallback', error: error.message });
  }
}
