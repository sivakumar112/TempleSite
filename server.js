const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

const USERS = {
  pilgrim: 'pilgrim123',
  admin: 'admin123',
  user: 'password'
};

const sessions = {};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const templesPath = path.join(__dirname, 'data', 'temples.json');
let templesData = [];
if (fs.existsSync(templesPath)) {
  templesData = JSON.parse(fs.readFileSync(templesPath, 'utf8'));
}

// ─── Fetch real Wikipedia thumbnails for all temples on startup ──────────────

const WIKI_HEADERS = { 'User-Agent': 'TempleInfoHub/1.0 (student project)' };

async function fetchWikiThumbnail(title) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url, { headers: WIKI_HEADERS });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      thumbnail: data.thumbnail ? data.thumbnail.source : null,
      image: data.originalimage ? data.originalimage.source : null
    };
  } catch { return null; }
}

function generateNameVariations(name) {
  const variations = [name];
  const cleaned = name
    .replace(/^Sri\s+/i, '').replace(/^Shri\s+/i, '').replace(/^Shree\s+/i, '')
    .replace(/\s+Temple$/i, '').replace(/\s+Mandir$/i, '').replace(/\s+Kovil$/i, '')
    .trim();
  if (cleaned !== name) variations.push(cleaned);
  variations.push(cleaned + ' Temple');
  const withoutHonorifics = name.replace(/^(Sri|Shri|Shree)\s+/i, '').trim();
  if (withoutHonorifics !== name) variations.push(withoutHonorifics);
  return [...new Set(variations)];
}

async function fetchBestThumbnail(templeName) {
  const variations = generateNameVariations(templeName);
  for (const v of variations) {
    const result = await fetchWikiThumbnail(v);
    if (result && (result.image || result.thumbnail)) return result;
  }
  // Fallback: grab first Wikimedia Commons image
  try {
    const imgs = await fetchWikiImages(templeName);
    if (imgs.length) return { thumbnail: imgs[0], image: imgs[0] };
  } catch {}
  return null;
}

async function fetchWikiImages(searchTerm) {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=6&format=json`;
    const searchRes = await fetch(searchUrl, { headers: WIKI_HEADERS });
    const searchData = await searchRes.json();
    const results = (searchData.query && searchData.query.search) || [];
    const fileTitles = results.map(r => r.title);
    if (!fileTitles.length) return [];

    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
    const infoRes = await fetch(infoUrl, { headers: WIKI_HEADERS });
    const infoData = await infoRes.json();
    const pages = (infoData.query && infoData.query.pages) || {};
    return Object.values(pages)
      .filter(p => p.imageinfo && p.imageinfo[0])
      .map(p => p.imageinfo[0].thumburl || p.imageinfo[0].url);
  } catch { return []; }
}

async function enrichTemples() {
  console.log('Fetching real images from Wikipedia & Wikimedia Commons...');
  for (const temple of templesData) {
    const title = temple.wikiTitle || temple.name;

    const wiki = await fetchBestThumbnail(title);
    if (wiki) {
      temple.thumbnail = wiki.image || wiki.thumbnail || null;
    }

    const images = await fetchWikiImages(title);
    if (images.length) {
      temple.gallery = images;
    }

    // Small delay to respect Wikimedia rate limits
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('Temple images loaded successfully.');
}

enrichTemples();

// ─── Auth ───────────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password required' });
  if (USERS[username] !== password) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  sessions[sessionId] = { username, loginAt: Date.now() };
  res.json({ success: true, sessionId, username });
});

app.post('/api/auth/google', (req, res) => {
  const { name, email } = req.body || {};
  const sessionId = 'sess_google_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  sessions[sessionId] = { username: name || email || 'Google User', loginAt: Date.now(), google: true };
  res.json({ success: true, sessionId, username: name || email || 'Google User' });
});

app.post('/api/logout', (req, res) => {
  const { sessionId } = req.body || {};
  if (sessionId && sessions[sessionId]) delete sessions[sessionId];
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  if (!sessionId || !sessions[sessionId]) return res.status(401).json({ loggedIn: false });
  res.json({ loggedIn: true, username: sessions[sessionId].username });
});

// ─── Local temple DB ────────────────────────────────────────────────────────

app.get('/api/temples', (req, res) => {
  let list = templesData;
  const q = (req.query.q || '').toLowerCase();
  const location = (req.query.location || '').toLowerCase();
  const deity = (req.query.deity || '').toLowerCase();
  if (q) {
    list = list.filter(t =>
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.location && t.location.toLowerCase().includes(q)) ||
      (t.deity && t.deity.toLowerCase().includes(q)) ||
      (t.city && t.city.toLowerCase().includes(q))
    );
  }
  if (location) list = list.filter(t => (t.location || '').toLowerCase().includes(location) || (t.city || '').toLowerCase().includes(location));
  if (deity) list = list.filter(t => (t.deity || '').toLowerCase().includes(deity));
  const religion = (req.query.religion || '').toLowerCase();
  if (religion) list = list.filter(t => (t.religion || '').toLowerCase().includes(religion));
  res.json(list);
});

app.get('/api/temples/:id', (req, res) => {
  const temple = templesData.find(t => t.id === req.params.id);
  if (!temple) return res.status(404).json({ error: 'Temple not found' });
  res.json(temple);
});

app.get('/api/festivals', (req, res) => {
  const fp = path.join(__dirname, 'data', 'festivals.json');
  if (!fs.existsSync(fp)) return res.json([]);
  let list = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const religion = (req.query.religion || '').toLowerCase();
  if (religion) list = list.filter(f => (f.religion || '').toLowerCase().includes(religion));
  res.json(list);
});

// ─── Explore temples by city using OpenStreetMap Nominatim ───────────────────
// Nominatim search finds temples, religious places, and points of interest

app.get('/api/explore/:city', async (req, res) => {
  const city = req.params.city;
  const headers = { 'User-Agent': 'TempleInfoHub/1.0 (student project)' };
  try {
    const searches = [
      `temple in ${city}, India`,
      `mosque in ${city}, India`,
      `church in ${city}, India`,
      `gurudwara in ${city}, India`,
      `mandir in ${city}, India`,
      `masjid in ${city}, India`,
      `dargah in ${city}, India`
    ];

    const allResults = [];
    const seenIds = new Set();

    for (const q of searches) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=20&addressdetails=1`;
      const response = await fetch(url, { headers });
      const data = await response.json();
      for (const place of data) {
        if (!seenIds.has(place.place_id)) {
          seenIds.add(place.place_id);
          allResults.push(place);
        }
      }
      // Nominatim rate limit: 1 req/sec
      await new Promise(r => setTimeout(r, 1100));
    }

    const temples = allResults
      .filter(p => {
        const name = (p.display_name || '').toLowerCase();
        const firstName = name.split(',')[0].trim();
        const type = (p.type || '').toLowerCase();
        const cls = (p.class || '').toLowerCase();
        const isWorship = type === 'place_of_worship' || type === 'temple';
        const nameMatch = firstName.includes('temple') || firstName.includes('mandir') ||
                          firstName.includes('kovil') || firstName.includes('devasthan') ||
                          firstName.includes('shrine');
        // Exclude roads, parks, etc. that just have "temple" in the name
        const isRoad = type === 'residential' || type === 'street' || cls === 'highway';
        return (isWorship || (cls === 'amenity' && nameMatch) || nameMatch) && !isRoad;
      })
      .map(p => {
        const n = (p.display_name || '').toLowerCase();
        let religion = 'Hindu';
        if (n.includes('masjid') || n.includes('mosque') || n.includes('dargah') || n.includes('idgah')) religion = 'Islam';
        else if (n.includes('church') || n.includes('cathedral') || n.includes('basilica') || n.includes('chapel')) religion = 'Christian';
        else if (n.includes('gurudwara') || n.includes('gurdwara')) religion = 'Sikh';
        else if (n.includes('monastery') || n.includes('vihara') || n.includes('buddha') || n.includes('pagoda')) religion = 'Buddhist';
        else if (n.includes('jain') || n.includes('derasar')) religion = 'Jain';
        return {
        osmId: p.osm_id,
        name: p.display_name ? p.display_name.split(',')[0].trim() : 'Place of Worship',
        deity: religion === 'Islam' ? 'Allah' : religion === 'Christian' ? 'Jesus Christ' : religion === 'Sikh' ? 'Guru Granth Sahib' : religion === 'Buddhist' ? 'Lord Buddha' : religion === 'Jain' ? 'Tirthankara' : '',
        religion,
        city: city,
        lat: parseFloat(p.lat),
        lon: parseFloat(p.lon),
        fullAddress: p.display_name || '',
        address: p.address ? (p.address.road || p.address.suburb || '') : '',
        website: ''
      };});

    // If Nominatim found results, enrich with images and return
    if (temples.length) {
      for (const t of temples.slice(0, 10)) {
        try {
          const w = await fetchBestThumbnail(t.name);
          if (w) t.thumbnail = w.image || w.thumbnail || null;
        } catch {}
      }
      return res.json({ city, count: temples.length, temples, source: 'nominatim' });
    }

    const llmPrompt = `List the most famous religious places (temples, mosques, churches, gurudwaras, monasteries) in ${city}, India.
Return ONLY a JSON array. Each object: {"id":"slug","name":"Place Name","deity":"Main deity/figure","religion":"Hindu|Islam|Christian|Sikh|Buddhist|Jain","city":"${city}","lat":0,"lon":0,"address":"Area/Street","website":""}
Return 5-15 places covering ALL religions present in the city. No markdown, just JSON array.`;
    const raw = await callGroqLLM(llmPrompt, `temples in ${city}`, 1500);
    let llmTemples = [];
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\[[\s\S]*\]/);
      llmTemples = m ? JSON.parse(m[0]) : [];
    } catch {}
    for (const t of llmTemples) {
      t.city = t.city || city;
      t.source = 'ai';
      try {
        const w = await fetchBestThumbnail(t.name);
        if (w) t.thumbnail = w.image || w.thumbnail || null;
      } catch {}
    }
    res.json({ city, count: llmTemples.length, temples: llmTemples, source: 'ai' });

  } catch (err) {
    res.status(500).json({ error: 'Explore error: ' + err.message, city, temples: [] });
  }
});

// ─── Wikipedia API: get temple summary (with LLM fallback) ──────────────────

app.get('/api/wiki/:title', async (req, res) => {
  const title = req.params.title.replace(/ /g, '_');
  const originalTitle = req.params.title;
  try {
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: { 'User-Agent': 'TempleInfoHub/1.0 (student project)' }
    });
    if (response.ok) {
      const data = await response.json();
      return res.json({
        title: data.title,
        extract: data.extract,
        description: data.description || '',
        thumbnail: data.thumbnail ? data.thumbnail.source : null,
        image: data.originalimage ? data.originalimage.source : null,
        url: data.content_urls && data.content_urls.desktop ? data.content_urls.desktop.page : '',
        source: 'wikipedia'
      });
    }

    // Wikipedia not found — LLM fallback
    const llmPrompt = `You are an encyclopedia. Write a brief, factual 3-4 sentence description of "${originalTitle}" (Indian temple/religious place). Include its location, main deity, historical significance, and architectural style. Just plain text, no formatting.`;
    const extract = await callGroqLLM(llmPrompt, originalTitle, 300);
    res.json({
      title: originalTitle,
      extract,
      description: 'AI-generated description',
      thumbnail: null,
      image: null,
      url: '',
      source: 'ai'
    });
  } catch (err) {
    // Even if Wikipedia API errors, try LLM
    try {
      const extract = await callGroqLLM(
        `Write a brief 3-4 sentence factual description of "${originalTitle}" (Indian temple). Plain text only.`,
        originalTitle, 300
      );
      res.json({ title: originalTitle, extract, description: 'AI-generated', thumbnail: null, image: null, url: '', source: 'ai' });
    } catch {
      res.status(500).json({ error: 'Could not fetch info: ' + err.message });
    }
  }
});

// ─── Wikimedia Commons API: get temple images ───────────────────────────────

app.get('/api/images/:query', async (req, res) => {
  const q = req.params.query;
  const limit = parseInt(req.query.limit) || 6;
  try {
    // Use Wikimedia Commons search with srnamespace=6 (File namespace) for actual images
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=${limit}&format=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TempleInfoHub/1.0 (student project)' }
    });
    const data = await response.json();
    const results = (data.query && data.query.search) || [];
    const fileTitles = results.map(r => r.title);

    if (fileTitles.length === 0) {
      return res.json({ query: q, count: 0, images: [] });
    }

    // Fetch image URLs for found files
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitles.join('|'))}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json`;
    const infoResponse = await fetch(infoUrl, {
      headers: { 'User-Agent': 'TempleInfoHub/1.0 (student project)' }
    });
    const infoData = await infoResponse.json();
    const pages = (infoData.query && infoData.query.pages) || {};
    const images = Object.values(pages)
      .filter(p => p.imageinfo && p.imageinfo[0])
      .map(p => {
        const info = p.imageinfo[0];
        return {
          title: p.title.replace('File:', ''),
          url: info.thumburl || info.url,
          fullUrl: info.url,
          description: info.extmetadata && info.extmetadata.ImageDescription
            ? info.extmetadata.ImageDescription.value.replace(/<[^>]*>/g, '').slice(0, 200)
            : ''
        };
      });

    res.json({ query: q, count: images.length, images });
  } catch (err) {
    res.status(500).json({ error: 'Wikimedia API error: ' + err.message });
  }
});

// ─── Groq LLM: AI chat + recommendations ───────────────────────────────────

function buildTempleContext() {
  return templesData.map(t =>
    `${t.name} (${t.location}) - Deity: ${t.deity}, Timings: ${t.timings}, Best time: ${t.bestTimeToVisit}, Festivals: ${(t.festivals || []).join(', ')}`
  ).join('\n');
}

async function callGroqLLM(systemPrompt, userMessage, maxTokens = 1024) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: maxTokens
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'LLM error');
  return data.choices?.[0]?.message?.content || 'No response.';
}

const SYSTEM_PROMPT = `You are an expert guide for religious pilgrimages in India. You have deep knowledge of temples (Hindu), mosques (Islam), churches (Christian), gurudwaras (Sikh), Buddhist monasteries, and Jain temples — their rituals, customs, dress codes, best times to visit, and spiritual significance. You respect all religions equally.

Here is the temple database you can reference:
${buildTempleContext()}

Rules:
- Provide practical, specific recommendations with temple names, locations, and key details.
- If asked about a specific temple, give timings, dress code, rituals, and tips.
- If asked for recommendations, suggest temples matching the user's preferences (location, deity, season, etc.).
- Format responses clearly with bullet points or numbered lists when listing multiple items.
- Answer in the same language the user writes in.
- Be respectful of all religious traditions.`;

app.post('/api/ai/recommend', async (req, res) => {
  const { message, religion } = req.body || {};
  const userMessage = message || 'Suggest temples for pilgrimage in India.';
  const religionContext = religion ? `\n\nIMPORTANT: The user has selected "${religion}" as their religion filter. Focus ALL your responses EXCLUSIVELY on ${religion} sacred places, traditions, rituals, and customs. Do NOT mention places or practices from other religions unless asked.` : '';
  try {
    const reply = await callGroqLLM(SYSTEM_PROMPT + religionContext, userMessage);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// AI: smart recommendations based on user preference
app.post('/api/ai/smart-recommend', async (req, res) => {
  const { preference, season, region, deity, religion } = req.body || {};
  const religionScope = religion ? `ONLY recommend ${religion} sacred places.` : 'You may recommend sacred places from any religion.';
  const prompt = `Based on these preferences, recommend the best sacred places to visit. ${religionScope}
- Preference: ${preference || 'spiritual experience'}
- Season/Month: ${season || 'any'}
- Region: ${region || 'any region in India'}
- Preferred deity/focus: ${deity || 'any'}
${religion ? '- Religion: ' + religion : ''}

Give a ranked list of 3-5 places with:
1. Place name and location
2. Why it matches (1 line)
3. Best time to visit
4. One key ritual to experience
5. One practical tip

Format as a clear numbered list.`;
  try {
    const reply = await callGroqLLM(SYSTEM_PROMPT, prompt);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// AI: LLM-powered festival search
app.post('/api/ai/festivals', async (req, res) => {
  const { query, religion } = req.body || {};
  const religionScope = religion ? `from ${religion} tradition ONLY` : 'from ALL religions (Hindu, Islam, Christian, Sikh, Buddhist, Jain)';
  const prompt = `List religious festivals ${religionScope}${query ? ' related to "' + query + '"' : ' in India for the full year'}.
${religion ? 'IMPORTANT: Only include ' + religion + ' festivals. Do not include festivals from other religions.' : ''}
Return ONLY a JSON array. Each object:
{"id":"slug","name":"Festival Name","month":"Month(s)","religion":"${religion || 'Religion'}","description":"1-2 sentence description","temples":[],"rituals":["ritual1","ritual2"]}
Return 5-10 festivals. No markdown, no explanation, just JSON array.`;
  try {
    const raw = await callGroqLLM(prompt, query || 'major Hindu festivals', 1500);
    let festivals = [];
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\[[\s\S]*\]/);
      festivals = m ? JSON.parse(m[0]) : [];
    } catch {}
    festivals.forEach(f => f.source = 'ai');
    res.json(festivals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: LLM-powered temple detail — get full info about any temple by name
app.post('/api/ai/temple-detail', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const prompt = `Provide detailed information about "${name}" (Indian religious place — could be a temple, mosque, church, gurudwara, monastery, or any place of worship).
Return ONLY a JSON object with these fields:
{"name":"Full Name","deity":"Main deity/figure","religion":"Hindu|Islam|Christian|Sikh|Buddhist|Jain","location":"City, State","timings":"Opening hours","dressCode":"Dress code","rituals":["ritual1","ritual2","ritual3"],"history":"3-4 sentence history","festivals":["festival1","festival2"],"bestTimeToVisit":"Best months","visitorGuidelines":"Key tips","nearbyPlaces":["nearby place 1","nearby place 2"]}
No markdown, no explanation, just JSON object.`;
  try {
    const raw = await callGroqLLM(prompt, name, 1024);
    let temple = {};
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      temple = m ? JSON.parse(m[0]) : {};
    } catch {}
    temple.source = 'ai';
    res.json(temple);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI: LLM-powered temple search — returns structured JSON temple data
app.post('/api/ai/search', async (req, res) => {
  const { query, religion } = req.body || {};
  if (!query) return res.status(400).json({ error: 'query is required' });

  const religionScope = religion ? `ONLY ${religion} sacred places` : 'sacred places from ALL religions';
  const searchPrompt = `You are a sacred places information database API for India. You MUST respond with ONLY a valid JSON array, nothing else.
${religion ? 'IMPORTANT: Return ONLY ' + religion + ' sacred places. Do NOT include places from other religions.' : ''}

Search query: "${query}"

Return a JSON array of 1-5 matching ${religionScope} (${religion === 'Hindu' ? 'temples, mandirs' : religion === 'Islam' ? 'mosques, masjids, dargahs' : religion === 'Christian' ? 'churches, cathedrals, basilicas' : religion === 'Sikh' ? 'gurudwaras, gurdwaras' : religion === 'Buddhist' ? 'monasteries, viharas, pagodas' : religion === 'Jain' ? 'Jain temples, derasars' : 'temples, mosques, churches, gurudwaras, monasteries'}). Each object MUST have ALL these fields:
[
  {
    "id": "place-name-slug",
    "name": "Full Official Name",
    "deity": "Main deity/figure/saint worshipped",
    "religion": "${religion || 'Hindu|Islam|Christian|Sikh|Buddhist|Jain'}",
    "location": "City, State, India",
    "timings": "Daily opening hours like 6:00 AM - 9:00 PM",
    "dressCode": "Required dress code for visitors",
    "rituals": ["Main ritual 1", "Main ritual 2", "Main ritual 3"],
    "history": "Brief 2-3 sentence factual history.",
    "festivals": ["Major festival 1", "Major festival 2"],
    "bestTimeToVisit": "Best months to visit",
    "visitorGuidelines": "Important tips and rules for visitors"
  }
]

CRITICAL RULES:
- Output ONLY the JSON array. No text before or after. No markdown fences.
- Use REAL factual data about religious places in India.
${religion ? '- Return ONLY ' + religion + ' places. No other religions.' : '- Include places from ALL relevant religions matching the query.'}
- If query is a place name, return that 1 place with complete details.
- If query is a city/region, return top 3-5 famous ${religion || ''} sacred places there.
- If query is a deity name, return 3-5 most famous places for that deity.
- The "id" should be a URL-friendly slug like "simhachalam-temple".`;

  try {
    const raw = await callGroqLLM(searchPrompt, query, 2048);
    // Extract JSON from the response
    let temples;
    try {
      // Strip markdown code fences if present
      let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      // Find the JSON array
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      temples = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (parseErr) {
      console.log('LLM JSON parse error:', parseErr.message, 'Raw:', raw.substring(0, 200));
      temples = [];
    }

    // Enrich each result with best available image
    for (const t of temples) {
      try {
        const wikiData = await fetchBestThumbnail(t.name);
        if (wikiData) {
          t.thumbnail = wikiData.image || wikiData.thumbnail || null;
        }
      } catch {}
      t.source = 'ai';
    }

    res.json({ query, count: temples.length, temples });
  } catch (err) {
    res.status(500).json({ error: err.message || 'LLM search error' });
  }
});

// ─── AI: Real-time Spiritual Alerts ─────────────────────────────────────────

app.get('/api/ai/alerts', async (req, res) => {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const religion = req.query.religion || '';
  const religionScope = religion ? `specifically for ${religion} faith` : 'for ALL religions in India (Hindu, Islam, Christian, Sikh, Buddhist, Jain)';
  const prompt = `Today is ${today}. Provide real-time spiritual alerts ${religionScope}.
Return ONLY a JSON object:
{"date":"${today}","alerts":[{"type":"festival|auspicious|prayer|special","title":"Short Title","message":"1-sentence description","religion":"${religion || 'Hindu|Islam|Christian|Sikh|Buddhist|Jain|All'}","priority":"high|medium|low","icon":"calendar|star|moon|sun|bell|mosque|church|cross"}],"panchang":{"tithi":"Tithi name","nakshatra":"Nakshatra","yoga":"Yoga","sunrise":"Time","sunset":"Time","auspiciousTime":"Best time range"}}
Include 4-6 alerts${religion ? ' relevant to ' + religion : ' covering MULTIPLE religions'}. No markdown, just JSON.`;
  try {
    const raw = await callGroqLLM(prompt, 'spiritual alerts for today', 1024);
    let data = {};
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : {};
    } catch {}
    data.source = 'ai';
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Temple of the Day ──────────────────────────────────────────────────

app.get('/api/ai/temple-of-day', async (req, res) => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const religion = req.query.religion || '';
  const religionClause = religion ? `Pick a famous ${religion} sacred place` : 'Pick sacred place number ' + (dayOfYear % 200) + ' from your knowledge of famous Indian religious places (temples, mosques, churches, gurudwaras, monasteries — rotate across ALL religions)';
  const prompt = `${religionClause}.
Return ONLY a JSON object:
{"name":"Place Name","deity":"Main deity/figure","religion":"${religion || 'Hindu|Islam|Christian|Sikh|Buddhist|Jain'}","location":"City, State","tagline":"One inspiring sentence about this place","history":"2-3 sentence history","whyVisit":"1 sentence reason to visit today","timings":"Opening hours","funFact":"One interesting fact most people don't know"}
No markdown, just JSON.`;
  try {
    const raw = await callGroqLLM(prompt, `temple of day #${dayOfYear}`, 512);
    let temple = {};
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      temple = m ? JSON.parse(m[0]) : {};
    } catch {}
    const wiki = await fetchBestThumbnail(temple.name || '');
    if (wiki) temple.thumbnail = wiki.image || wiki.thumbnail;
    temple.source = 'ai';
    res.json(temple);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Pilgrimage Planner ─────────────────────────────────────────────────

app.post('/api/ai/planner', async (req, res) => {
  const { days, region, deity, startCity, travelStyle, religion } = req.body || {};
  const religionScope = religion ? `covering ONLY ${religion} sacred places` : 'covering sacred places of ALL religions (temples, mosques, churches, gurudwaras, etc.)';
  const prompt = `Create a ${days || 3}-day spiritual pilgrimage itinerary ${religionScope}.
Starting city: ${startCity || 'flexible'}
Region: ${region || 'any India'}
Preferred deity/focus: ${deity || 'any'}
${religion ? 'IMPORTANT: Only include ' + religion + ' places.' : ''}
Travel style: ${travelStyle || 'comfortable'}

Return ONLY a JSON object:
{"title":"Itinerary Title","days":[{"day":1,"city":"City","temples":[{"name":"Temple","time":"Suggested visit time","tip":"1 tip"}],"accommodation":"Suggested stay","travel":"How to get here from previous city"}],"totalBudget":"Estimated budget range in INR","packingTips":["tip1","tip2"],"bestSeason":"Best months for this trip"}
No markdown, just JSON.`;
  try {
    const raw = await callGroqLLM(prompt, `${days}-day pilgrimage planner`, 2048);
    let plan = {};
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      plan = m ? JSON.parse(m[0]) : {};
    } catch {}
    plan.source = 'ai';
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Conversational Trip Planner (detailed) ─────────────────────────────

app.post('/api/ai/plan-trip', async (req, res) => {
  const p = req.body || {};
  const numDays = parseInt(String(p.days).replace(/\D/g, '')) || 3;
  const prompt = `You are India's top spiritual pilgrimage trip planner with 30 years of experience covering ALL religions. Create an EXCEPTIONAL, DETAILED plan that can include temples, mosques, churches, gurudwaras, monasteries, and dargahs as appropriate.

Pilgrim preferences:
- Starting city: ${p.startCity || 'Not specified'}
- Days: ${numDays}
- Region: ${p.region || 'Any India'}
- Religion preference: ${p.religion || 'All religions'}
- Deity/focus: ${p.deity || 'Any'}
- Budget: ${p.budget || 'Moderate'}
- Travel: ${p.travelStyle || 'Comfortable'}
- Group: ${p.group || 'Solo'}
- Interests: ${p.interests || 'General'}
- Health: ${p.health || 'Good'}
- Food: ${p.food || 'Vegetarian'}

Return ONLY JSON:
{
  "title":"Trip title",
  "summary":"3-4 sentence overview mentioning spiritual theme, key highlights, and what makes this route special",
  "days":[{
    "day":1,
    "city":"City",
    "theme":"Day theme",
    "weather":"Expected weather for that region",
    "temples":[{
      "name":"Temple Name",
      "time":"Visit window like 5:30 AM - 7:30 AM (include darshan timings)",
      "deity":"Main deity",
      "mustDo":"Must-do ritual/activity at this specific temple",
      "tip":"Practical tip specific to this temple",
      "dressCode":"What to wear here",
      "dosDonts":"One important do or don't",
      "specialDarshan":"Special darshan info if any (like Suprabhatam, Abhishekam timing)"
    }],
    "meals":{"breakfast":"Specific restaurant/area + dish","lunch":"Specific suggestion","dinner":"Specific suggestion"},
    "nearbyAttractions":["1-2 non-temple places worth visiting nearby"],
    "localPhrases":[{"phrase":"Local language phrase","meaning":"English meaning","language":"Language name"}],
    "accommodation":"Specific hotel/dharamshala name + area",
    "travel":"Detailed travel instructions from previous location (distance, time, mode)",
    "estimatedCost":"Day cost in INR with breakdown"
  }],
  "totalBudget":{"min":"₹ amount","max":"₹ amount","breakdown":{"transport":"₹ amount","accommodation":"₹ amount","food":"₹ amount","donations":"₹ amount","misc":"₹ amount"}},
  "packingList":["item1","item2","item3","item4","item5"],
  "bestSeason":"Best months with reason",
  "importantTips":["5 specific practical tips"],
  "dosAndDonts":{"dos":["do1","do2","do3"],"donts":["dont1","dont2","dont3"]},
  "emergencyInfo":{"police":"100","ambulance":"108","touristHelpline":"1800-111-363","nearestHospital":"General info"},
  "spiritualSignificance":"Why this specific route is spiritually meaningful and what blessings pilgrims seek",
  "routeMapQuery":"Google Maps search query for the full route"
}
Include exactly ${numDays} days. Use REAL temple names, REAL locations, REAL timings. No markdown, just JSON.`;

  try {
    const raw = await callGroqLLM(prompt, JSON.stringify(p), 4096);
    let plan = {};
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      plan = m ? JSON.parse(m[0]) : {};
    } catch {}

    // Enrich temples with images
    if (plan.days) {
      for (const day of plan.days) {
        if (day.temples) {
          for (const temple of day.temples) {
            try {
              const w = await fetchBestThumbnail(temple.name);
              if (w) temple.thumbnail = w.image || w.thumbnail || null;
            } catch {}
          }
        }
      }
    }

    plan.source = 'ai';
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Temple Story Narrator ──────────────────────────────────────────────

app.post('/api/ai/story', async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const prompt = `Tell the mythological/historical story of "${name}" (Indian sacred place — could be a temple, mosque, church, gurudwara, or monastery) in a captivating narrative style.
Return ONLY a JSON object:
{"title":"Story title","religion":"Hindu|Islam|Christian|Sikh|Buddhist|Jain","story":"Paragraph 1. Paragraph 2. Paragraph 3. (all in one string, separated by periods)","characters":[{"name":"Name","role":"Role"}],"moralLesson":"Lesson","scriptureSource":"e.g. Quran, Bible, Guru Granth Sahib, Puranas, Tripitaka","funFact":"Fun fact"}
IMPORTANT: The story field should be a SINGLE line string without literal newlines. Use periods to separate paragraphs. No markdown, just valid JSON.`;
  try {
    const raw = await callGroqLLM(prompt, name, 2048);
    let data = {};
    try {
      let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      cleaned = cleaned.replace(/[\r\n]+/g, ' ');
      const m = cleaned.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : {};
    } catch (parseErr) {
      try {
        let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        cleaned = cleaned.replace(/[\r\n]+/g, ' ').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        const m = cleaned.match(/\{.*\}/);
        data = m ? JSON.parse(m[0]) : {};
      } catch {}
    }
    if (data.scriptureSource && !data.source) data.source = data.scriptureSource;
    if (!data.source) data.source = 'ai';
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Wish/Prayer Guide ──────────────────────────────────────────────────

app.post('/api/ai/wish-guide', async (req, res) => {
  const { wish, religion } = req.body || {};
  if (!wish) return res.status(400).json({ error: 'wish required' });
  const religionScope = religion ? `ONLY from ${religion} tradition` : 'across ALL religions in India';
  const prompt = `A person has this wish/prayer: "${wish}"
Suggest the best sacred places ${religionScope}, along with rituals and practices to fulfill this wish. Return ONLY a JSON object:
{"wish":"${wish}","temples":[{"name":"Place Name","location":"City, State","deity":"Deity/Saint","religion":"${religion || 'Hindu|Islam|Christian|Sikh|Buddhist|Jain'}","whyThisTemple":"Why this place is specifically powerful for this wish","ritual":"Specific ritual to perform here","bestDay":"Best day/time to visit for this wish","offering":"What to offer"}],"mantra":{"sanskrit":"Prayer/mantra text","meaning":"English meaning","chantCount":"How many times to chant/recite"},"generalAdvice":"2-3 sentences of spiritual guidance${religion ? ' from ' + religion + ' perspective' : ' covering multiple faiths'}","vratOrFast":"Any recommended fasting/spiritual practice for this wish","gemstone":"Recommended gemstone if applicable"}
Include 4-6 places${religion ? ' from ' + religion + ' tradition' : ' from DIFFERENT religions'}. No markdown, just JSON.`;
  try {
    const raw = await callGroqLLM(prompt, wish, 1500);
    let data = {};
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : {};
    } catch {}
    if (data.temples) {
      for (const t of data.temples) {
        try {
          const w = await fetchBestThumbnail(t.name);
          if (w) t.thumbnail = w.image || w.thumbnail || null;
        } catch {}
      }
    }
    data.source = 'ai';
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Temple Quiz ────────────────────────────────────────────────────────

app.get('/api/ai/quiz', async (req, res) => {
  const rand = Math.floor(Math.random() * 10000);
  const religion = req.query.religion || '';
  const religionScope = religion ? `about ${religion} sacred places, traditions, and history in India` : 'about sacred places of ALL religions in India — temples, mosques, churches, gurudwaras, monasteries';
  const prompt = `Create a fun quiz ${religionScope} (quiz set #${rand}).${religion ? ' Focus ONLY on ' + religion + ' tradition.' : ' Include questions from Hindu, Islam, Christian, Sikh, Buddhist, and Jain traditions.'}
Return ONLY a JSON array of 5 questions:
[{"question":"The question?","options":["A","B","C","D"],"correct":0,"explanation":"Why this is correct + interesting fact","difficulty":"easy|medium|hard"}]
"correct" is the 0-based index of the right answer. Mix difficulties. No markdown, just JSON array.`;
  try {
    const raw = await callGroqLLM(prompt, `quiz #${rand}`, 1200);
    let questions = [];
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\[[\s\S]*\]/);
      questions = m ? JSON.parse(m[0]) : [];
    } catch {}
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Nearby Essentials ──────────────────────────────────────────────────

app.post('/api/ai/nearby', async (req, res) => {
  const { temple } = req.body || {};
  if (!temple) return res.status(400).json({ error: 'temple required' });
  const prompt = `For a visitor/pilgrim visiting "${temple}" (a sacred place in India, could be temple/mosque/church/gurudwara), suggest nearby essentials.
Return ONLY a JSON object:
{"temple":"${temple}","food":[{"name":"Place name","type":"Restaurant/Street food/Temple prasad","specialty":"What to try","price":"Price range","distance":"Distance from temple"}],"stay":[{"name":"Place name","type":"Dharamshala/Budget hotel/Resort","price":"Per night range","distance":"Distance","tip":"Booking tip"}],"transport":{"howToReach":"How to reach this temple from nearest city/airport/railway","localTransport":"Auto/taxi/bus info","parking":"Parking availability"},"shopping":[{"item":"What to buy","where":"Where to buy it"}],"nearbyTemples":["Other temples within 5km"]}
Include 2-3 items in each category. No markdown, just JSON.`;
  try {
    const raw = await callGroqLLM(prompt, temple, 1500);
    let data = {};
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : {};
    } catch {}
    data.source = 'ai';
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Temple Comparison ──────────────────────────────────────────────────

app.post('/api/ai/compare', async (req, res) => {
  const { temple1, temple2 } = req.body || {};
  if (!temple1 || !temple2) return res.status(400).json({ error: 'two temple names required' });
  const prompt = `Compare these two Indian temples: "${temple1}" vs "${temple2}".
Return ONLY a JSON object:
{"temple1":{"name":"${temple1}","deity":"","location":"","built":"","architecture":"","significance":"1 line","bestFor":"","timings":"","dressCode":"","rating":0},"temple2":{"name":"${temple2}","deity":"","location":"","built":"","architecture":"","significance":"1 line","bestFor":"","timings":"","dressCode":"","rating":0},"comparison":[{"aspect":"Spiritual Significance","temple1":"","temple2":""},{"aspect":"Architecture","temple1":"","temple2":""},{"aspect":"Best Time to Visit","temple1":"","temple2":""},{"aspect":"Crowd Level","temple1":"","temple2":""},{"aspect":"Accessibility","temple1":"","temple2":""}],"verdict":"1-2 sentence final recommendation"}
rating is 1-5 stars. No markdown, just JSON.`;
  try {
    const raw = await callGroqLLM(prompt, `compare ${temple1} vs ${temple2}`, 1500);
    let data = {};
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : {};
    } catch {}
    // Fetch thumbnails for both
    for (const key of ['temple1', 'temple2']) {
      if (data[key] && data[key].name) {
        try {
          const w = await fetchBestThumbnail(data[key].name);
          if (w) data[key].thumbnail = w.image || w.thumbnail;
        } catch {}
      }
    }
    data.source = 'ai';
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Did You Know (random spiritual facts) ─────────────────────────────

app.get('/api/ai/did-you-know', async (req, res) => {
  const rand = Math.floor(Math.random() * 10000);
  const religion = req.query.religion || '';
  const religionScope = religion ? `about ${religion} sacred places in India` : 'about sacred places of ALL religions in India — temples, mosques, churches, gurudwaras, monasteries';
  const prompt = `Share 3 fascinating "Did You Know?" facts ${religionScope} (fact set #${rand}).${religion ? ' Focus exclusively on ' + religion + ' tradition.' : ' Include facts from different religions.'}
Return ONLY a JSON array of objects:
[{"fact":"The interesting fact","temple":"Related temple name if any","category":"history|architecture|ritual|mythology|science"}]
Make them unique, surprising, and educational. No markdown, just JSON array.`;
  try {
    const raw = await callGroqLLM(prompt, `temple facts #${rand}`, 600);
    let facts = [];
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\[[\s\S]*\]/);
      facts = m ? JSON.parse(m[0]) : [];
    } catch {}
    res.json(facts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Mantra of the Day ──────────────────────────────────────────────────

app.get('/api/ai/mantra', async (req, res) => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const religion = req.query.religion || '';
  const religionScope = religion ? `from ${religion} tradition` : 'from any religion in India (rotate: Hindu, Islam, Christian, Sikh, Buddhist, Jain)';
  const prompt = `Share prayer/mantra #${dayOfYear % 108} ${religionScope}.
Return ONLY a JSON object:
{"sanskrit":"Prayer text in original language","transliteration":"Romanized pronunciation","meaning":"English meaning","deity":"Associated deity/figure","religion":"${religion || 'Hindu|Islam|Christian|Sikh|Buddhist|Jain'}","benefit":"Spiritual benefit","chantCount":"Recommended repetitions"}
No markdown, just JSON.`;
  try {
    const raw = await callGroqLLM(prompt, `mantra #${dayOfYear}`, 400);
    let data = {};
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : {};
    } catch {}
    data.source = 'ai';
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Aarti / Bhajan Lyrics ──────────────────────────────────────────────

app.post('/api/ai/aarti', async (req, res) => {
  const { temple, deity } = req.body || {};
  const subject = temple || deity || 'Lord Shiva';
  const prompt = `Provide the famous prayer hymn, aarti, bhajan, qawwali, psalm, kirtan, or chant associated with "${subject}" (a sacred place or religious figure in India — could be from any religion: Hindu, Islam, Christian, Sikh, Buddhist, Jain).
Return ONLY a JSON object:
{"title":"Aarti/Bhajan title","deity":"Deity name","lyrics":"Full lyrics of the aarti in original language (Hindi/Sanskrit). Write each line separated by |","lyricsTransliteration":"Romanized transliteration of the lyrics, lines separated by |","meaning":"Brief meaning of the aarti in English (2-3 sentences)","whenToSing":"When this aarti is traditionally sung","significance":"Spiritual significance of this aarti"}
No markdown, just valid JSON.`;
  try {
    const raw = await callGroqLLM(prompt, subject, 1500);
    let data = {};
    try {
      let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim().replace(/[\r\n]+/g, ' ');
      const m = cleaned.match(/\{.*\}/);
      data = m ? JSON.parse(m[0]) : {};
    } catch {}
    data.source = 'ai';
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Horoscope / Rashi Guide ────────────────────────────────────────────

app.get('/api/ai/horoscope/:rashi', async (req, res) => {
  const rashi = req.params.rashi;
  let dateStr;
  if (req.query.date) {
    const d = new Date(req.query.date + 'T00:00:00');
    dateStr = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } else {
    dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  const dayName = dateStr.split(',')[0] || '';
  const religion = req.query.religion || '';
  const religionScope = religion ? `Focus on ${religion} tradition only.` : '';
  const prompt = `Generate a spiritual horoscope for "${rashi}" rashi (zodiac) for ${dateStr}. ${religionScope}
Return ONLY a valid JSON object (single line, no newlines inside):
{"rashi":"${rashi}","date":"${dateStr}","prediction":"3-4 sentence spiritual prediction","luckyTemple":"A ${religion || 'sacred'} place to visit","luckyDeity":"Deity to pray to","luckyColor":"color","luckyNumber":"number","mantra":"A short prayer/mantra","templeRecommendation":"Why this place is lucky","overallRating":4,"advice":"One line of advice","daySignificance":"What makes this day special","doOnThisDay":"3 things to do (comma separated)","avoidOnThisDay":"2 things to avoid (comma separated)"}
overallRating is 1-5. All values must be strings (no arrays). No markdown, just JSON.`;
  try {
    const raw = await callGroqLLM(prompt, rashi, 500);
    let data = {};
    try {
      let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim().replace(/[\r\n]+/g, ' ');
      const m = cleaned.match(/\{[\s\S]*\}/);
      data = m ? JSON.parse(m[0]) : {};
    } catch {}
    if (data.doOnThisDay && typeof data.doOnThisDay === 'string') {
      data.doOnThisDay = data.doOnThisDay.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    }
    if (data.avoidOnThisDay && typeof data.avoidOnThisDay === 'string') {
      data.avoidOnThisDay = data.avoidOnThisDay.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(data.doOnThisDay)) data.doOnThisDay = [];
    if (!Array.isArray(data.avoidOnThisDay)) data.avoidOnThisDay = [];
    data.source = 'ai';
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI: Temple Map Data ────────────────────────────────────────────────────

app.get('/api/ai/map-temples', async (req, res) => {
  const prompt = `List 25 famous sacred places across ALL religions in India with their GPS coordinates. Include Hindu temples, mosques, churches, gurudwaras, Buddhist monasteries, and Jain temples.
Return ONLY a JSON array:
[{"name":"Place Name","lat":12.345,"lng":78.123,"deity":"Main deity/figure","religion":"Hindu|Islam|Christian|Sikh|Buddhist|Jain","city":"City","state":"State","type":"Jyotirlinga|Mosque|Church|Gurudwara|Monastery|Shakti Peetha|Char Dham|Famous|Dargah"}]
Include at least: 10 Hindu temples, 4 mosques/dargahs, 3 churches, 3 gurudwaras, 3 Buddhist sites, 2 Jain temples. Use REAL accurate GPS coordinates. No markdown, just JSON array.`;
  try {
    const raw = await callGroqLLM(prompt, 'map temples', 1500);
    let temples = [];
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const m = cleaned.match(/\[[\s\S]*\]/);
      temples = m ? JSON.parse(m[0]) : [];
    } catch {}
    for (const t of temples) {
      try {
        const w = await fetchBestThumbnail(t.name);
        if (w) t.thumbnail = w.image || w.thumbnail || null;
      } catch {}
    }
    res.json(temples);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Serve index ────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Temple Information Hub running at http://localhost:${PORT}`);
});
