const DEMO = {
  middleEast: [
    { id: 's1', title: 'Port access chatter spike', summary: 'Multiple public-source mentions of delays and checkpoint congestion around the selected corridor.', source: 'Demo feed', score: 0.8, credibility: 0.7, time: new Date(Date.now() - 5 * 60000).toISOString(), position: [25.30, 51.52], url: 'https://publicintelligence.net/dhs-social-media/' },
    { id: 's2', title: 'Route diversion mention', summary: 'Open statement referencing alternate routing away from a monitored connector.', source: 'Demo feed', score: 0.6, credibility: 0.6, time: new Date(Date.now() - 18 * 60000).toISOString(), position: [24.49, 54.36], url: 'https://docs.x.com/x-api/posts/filtered-stream/introduction' }
  ],
  taiwan: [
    { id: 's3', title: 'Harbor district watch chatter', summary: 'Short burst of posts mentioning cordon activity and slower inland movement.', source: 'Demo feed', score: 0.75, credibility: 0.65, time: new Date(Date.now() - 9 * 60000).toISOString(), position: [25.13, 121.74], url: 'https://docs.x.com/x-api/posts/filtered-stream/introduction' }
  ],
  westCoast: [
    { id: 's4', title: 'Port gate protest references', summary: 'Public mentions indicate gathering activity around cargo routes.', source: 'Demo feed', score: 0.82, credibility: 0.7, time: new Date(Date.now() - 7 * 60000).toISOString(), position: [33.75, -118.20], url: 'https://docs.x.com/x-api/webhooks/stream/quickstart' }
  ],
  eastAfrica: [
    { id: 's5', title: 'CBD disruption mentions', summary: 'Open posts reference police diversions and central connector delays.', source: 'Demo feed', score: 0.7, credibility: 0.68, time: new Date(Date.now() - 11 * 60000).toISOString(), position: [-1.28, 36.82], url: 'https://docs.x.com/x-api/posts/filtered-stream/introduction' }
  ]
};

async function fetchRemote(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Feed ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  const region = req.query.region || 'middleEast';
  const remote = process.env.SIGNALS_JSON_URL;
  if (!remote) return res.status(200).json({ items: DEMO[region] || DEMO.middleEast, mode: 'demo' });

  try {
    const payload = await fetchRemote(remote);
    const items = Array.isArray(payload) ? payload : (payload.items || []);
    const filtered = items.filter(x => !x.region || x.region === region);
    res.status(200).json({ items: filtered, mode: 'live-feed' });
  } catch (error) {
    res.status(200).json({ items: DEMO[region] || DEMO.middleEast, mode: 'demo-fallback', error: error.message });
  }
}
