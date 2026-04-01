const DEMO = {
  middleEast: {
    incidents: [
      { id: 'me-1', type: 'Road closure', description: 'Checkpoint-related closure near coastal connector', criticality: 'high', position: [25.2854, 51.5310] },
      { id: 'me-2', type: 'Congestion', description: 'Port access queueing on main approach road', criticality: 'moderate', position: [26.2285, 50.5860] },
      { id: 'me-3', type: 'Construction', description: 'Lane restrictions near industrial zone', criticality: 'low', position: [24.4539, 54.3773] }
    ],
    flow: [{ jamFactor: 4.8 }, { jamFactor: 5.6 }, { jamFactor: 3.9 }]
  },
  taiwan: {
    incidents: [
      { id: 'tw-1', type: 'Traffic congestion', description: 'Urban arterial slowdown', criticality: 'moderate', position: [25.0330, 121.5654] },
      { id: 'tw-2', type: 'Road closure', description: 'Temporary closure near logistics route', criticality: 'high', position: [22.6273, 120.3014] }
    ],
    flow: [{ jamFactor: 4.2 }, { jamFactor: 6.1 }]
  },
  westCoast: {
    incidents: [
      { id: 'wc-1', type: 'Congestion', description: 'Freeway slowdown near port access', criticality: 'moderate', position: [33.7701, -118.1937] },
      { id: 'wc-2', type: 'Restriction', description: 'Police activity restricting lanes', criticality: 'high', position: [37.7749, -122.4194] }
    ],
    flow: [{ jamFactor: 5.2 }, { jamFactor: 6.4 }, { jamFactor: 4.7 }]
  },
  eastAfrica: {
    incidents: [
      { id: 'ea-1', type: 'Congestion', description: 'CBD connector slowdown', criticality: 'moderate', position: [-1.286389, 36.817223] },
      { id: 'ea-2', type: 'Road closure', description: 'Restriction near government precinct', criticality: 'high', position: [0.3476, 32.5825] }
    ],
    flow: [{ jamFactor: 3.6 }, { jamFactor: 4.4 }]
  }
};

function parseBbox(input) {
  return (input || '').split(',').map(Number).filter(n => Number.isFinite(n));
}

function centerFromBbox(b) {
  if (b.length !== 4) return null;
  return [(b[1] + b[3]) / 2, (b[0] + b[2]) / 2];
}

function guessPoint(item, fallbackCenter) {
  const lat = item?.location?.shape?.links?.[0]?.points?.[0]?.lat ?? item?.location?.shape?.links?.[0]?.points?.[0]?.latitude;
  const lng = item?.location?.shape?.links?.[0]?.points?.[0]?.lng ?? item?.location?.shape?.links?.[0]?.points?.[0]?.longitude;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  const geom = item?.location?.shape?.value;
  if (Array.isArray(geom) && geom.length >= 2) return [geom[0], geom[1]];
  return fallbackCenter;
}

async function fetchHere(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HERE ${res.status}`);
  return res.json();
}

export default async function handler(req, res) {
  const bbox = parseBbox(req.query.bbox);
  const region = req.query.region || 'middleEast';
  const apiKey = process.env.HERE_API_KEY;

  if (!apiKey || bbox.length !== 4) {
    return res.status(200).json({ ...DEMO[region] || DEMO.middleEast, mode: 'demo' });
  }

  const [west, south, east, north] = bbox;
  const inParam = `bbox:${west},${south},${east},${north}`;
  const center = centerFromBbox(bbox);

  try {
    const [incidentsData, flowData] = await Promise.all([
      fetchHere(`https://data.traffic.hereapi.com/v7/incidents?in=${encodeURIComponent(inParam)}&locationReferencing=shape&apiKey=${apiKey}`),
      fetchHere(`https://data.traffic.hereapi.com/v7/flow?in=${encodeURIComponent(inParam)}&locationReferencing=shape&apiKey=${apiKey}`)
    ]);

    const incidents = (incidentsData.results || incidentsData.incidents || []).map((item, idx) => ({
      id: item.id || `incident-${idx}`,
      type: item.type || item.incidentDetails?.type || 'Incident',
      description: item.description?.value || item.summary?.value || item.incidentDetails?.description || 'Active traffic incident',
      criticality: item.criticality || item.incidentDetails?.criticality || item.severity || 'unclassified',
      position: guessPoint(item, center)
    }));

    const flowItems = (flowData.results || flowData.sourceUpdated || flowData.flow || []).flatMap(entry => {
      if (Array.isArray(entry.currentFlow?.traversability)) return [];
      if (entry.currentFlow) return [{ jamFactor: Number(entry.currentFlow.jamFactor || 0) }];
      if (entry.jamFactor !== undefined) return [{ jamFactor: Number(entry.jamFactor || 0) }];
      return [];
    });

    res.status(200).json({ incidents, flow: flowItems, mode: 'live' });
  } catch (error) {
    res.status(200).json({ ...DEMO[region] || DEMO.middleEast, mode: 'demo-fallback', error: error.message });
  }
}
