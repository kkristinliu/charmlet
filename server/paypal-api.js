import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createReadStream, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASES, GEM_COLORS, GEM_CATALOG, RETIRED_GEM_COLORS, validateDesign } from '../src/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const production = process.env.NODE_ENV === 'production';
const distRoot = path.join(root, 'dist');
const envFile = path.join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const environment = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
const clientId = process.env.PAYPAL_CLIENT_ID || '';
const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const openaiModel = process.env.OPENAI_MODEL || 'gpt-6-luna';
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const apiBase = environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const pendingOrders = new Map();
const MAX_REQUEST_BYTES = 1_000_000;

const respond = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(body));
};

const clientMimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const serveClient = (request, response, pathname) => {
  if (!existsSync(distRoot)) return respond(response, 503, { error: 'The website build is missing. Run the production build before starting the service.' });
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath.replace(/^\/+/, '') || 'index.html';
  const requestedFile = path.resolve(distRoot, relativePath);
  if (!requestedFile.startsWith(distRoot + path.sep)) return respond(response, 400, { error: 'Invalid path.' });

  let filePath = requestedFile;
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    if (path.extname(decodedPath)) return respond(response, 404, { error: 'Not found.' });
    filePath = path.join(distRoot, 'index.html');
  }

  const isHtml = path.basename(filePath) === 'index.html';
  response.writeHead(200, {
    'Content-Type': clientMimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  if (request.method === 'HEAD') return response.end();
  createReadStream(filePath).pipe(response);
};

const readJson = request => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', chunk => {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_REQUEST_BYTES) {
      reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
      request.destroy();
    }
  });
  request.on('end', () => {
    try { resolve(JSON.parse(body || '{}')); }
    catch { reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })); }
  });
  request.on('error', reject);
});

const getAccessToken = async () => {
  if (!clientId || !clientSecret) throw Object.assign(new Error('PayPal Sandbox credentials are not configured.'), { status: 503 });
  const response = await fetch(apiBase + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    console.error('PayPal OAuth request failed with status', response.status);
    throw Object.assign(new Error('PayPal authentication failed. Check the Sandbox app credentials.'), { status: 502 });
  }
  return body.access_token;
};

const paypalRequest = async (url, options = {}) => {
  const token = await getAccessToken();
  const response = await fetch(apiBase + url, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('PayPal API request failed with status', response.status);
    throw Object.assign(new Error('PayPal could not process this request. Please try again.'), { status: 502 });
  }
  return body;
};

const makePurchaseItems = designs => {
  const items = [];
  for (const design of designs) {
    const base = Object.values(BASES).find(item => item.id === design.baseSku);
    items.push({
      name: 'CHARMLET custom clip · ' + base.label,
      sku: base.id,
      quantity: '1',
      category: 'PHYSICAL_GOODS',
      unit_amount: { currency_code: 'USD', value: base.price.toFixed(2) },
    });
    for (const stone of design.gemstones) {
      const gem = GEM_CATALOG.find(item => item.sku === stone.skuId);
      items.push({
        name: 'Gemstone · ' + gem.name + ' · ' + stone.color,
        sku: gem.sku,
        quantity: '1',
        category: 'PHYSICAL_GOODS',
        unit_amount: { currency_code: 'USD', value: gem.price.toFixed(2) },
      });
    }
  }
  return items;
};

const handleAIStylist = async request => {
  if (!openaiApiKey) throw Object.assign(new Error('AI Stylist needs an OpenAI API key. Add OPENAI_API_KEY to .env.local, then restart CHARMLET.'), { status: 503 });
  const body = await readJson(request);
  const prompt = String(body.prompt || '').trim();
  if (prompt.length < 3 || prompt.length > 500) throw Object.assign(new Error('Describe your style in 3 to 500 characters.'), { status: 400 });
  const base = Object.values(BASES).find(item => item.label === body.baseSize);
  if (!base) throw Object.assign(new Error('Choose a valid clip size before asking the AI Stylist.'), { status: 400 });
  const baseColor = String(body.baseColor || '').slice(0, 40);
  const catalog = GEM_CATALOG.map(gem => ({
    sku: gem.sku,
    name: gem.name,
    shape: gem.shape,
    tier: gem.tierName,
    dimensionsMm: gem.width === gem.length ? `${gem.width} mm` : `${gem.width} × ${gem.length} mm`,
    priceUsd: gem.price,
  }));
  const allowedSkus = GEM_CATALOG.map(gem => gem.sku);
  const allowedColors = GEM_COLORS.map(color => color.name);
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'story', 'stones'],
    properties: {
      title: { type: 'string' },
      story: { type: 'string' },
      stones: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['sku', 'color', 'reason'],
          properties: {
            sku: { type: 'string', enum: allowedSkus },
            color: { type: 'string', enum: allowedColors },
            reason: { type: 'string' },
          },
        },
      },
    },
  };
  let upstream;
  try {
    upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: { Authorization: 'Bearer ' + openaiApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: openaiModel,
        max_output_tokens: 500,
        input: [
          {
            role: 'developer',
            content: [{ type: 'input_text', text: `You are CHARMLET's gemstone stylist. Create a tasteful, wearable hair-clip gemstone palette from the supplied fixed catalog. Use only exact catalog SKUs and available colors. Do not invent products, dimensions, stock, or prices. Do not choose placement coordinates or promise that stones will fit together; the customer will place each stone manually and the studio validates collisions. Suggest exactly three distinct catalog SKUs. Keep the title short and the story/reasons concise. Return only the requested structured fields.\nCurrent clip: ${base.label}, ${base.length} × ${base.width} mm, ${baseColor} base.\nFixed gemstone catalog: ${JSON.stringify(catalog)}` }],
          },
          { role: 'user', content: [{ type: 'input_text', text: prompt }] },
        ],
        text: { format: { type: 'json_schema', name: 'charmlet_stylist', strict: true, schema } },
      }),
    });
  } catch {
    throw Object.assign(new Error('The AI Stylist could not reach OpenAI. Check your connection and try again.'), { status: 502 });
  }
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    console.error('OpenAI Stylist request failed with status', upstream.status);
    throw Object.assign(new Error('The AI Stylist could not create a look. Check the OpenAI API key and model setting.'), { status: 502 });
  }
  const output = payload.output_text || (payload.output || []).flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
  if (!output) throw Object.assign(new Error('The AI Stylist returned no usable recommendations. Please try a shorter style description.'), { status: 502 });
  let recommendation;
  try { recommendation = JSON.parse(output); }
  catch { throw Object.assign(new Error('The AI Stylist returned an unreadable result. Please try again.'), { status: 502 }); }
  if (!Array.isArray(recommendation.stones) || recommendation.stones.length < 3) {
    throw Object.assign(new Error('The AI Stylist could not find three valid catalog picks. Please try another style description.'), { status: 502 });
  }
  const stones = recommendation.stones.slice(0, 3).map(choice => {
    const gem = GEM_CATALOG.find(item => item.sku === choice.sku);
    const color = GEM_COLORS.find(item => item.name === choice.color);
    if (!gem || !color) throw Object.assign(new Error('The AI Stylist returned a catalog item that is unavailable.'), { status: 502 });
    return {
      sku: gem.sku,
      name: gem.name,
      shape: gem.shape,
      tier: gem.tierName,
      dimensionsMm: { width: gem.width, length: gem.length },
      price: gem.price,
      color: color.name,
      colorHex: color.hex,
      reason: String(choice.reason || '').slice(0, 180),
    };
  });
  return { title: String(recommendation.title || 'Your gemstone look').slice(0, 80), story: String(recommendation.story || '').slice(0, 300), stones, model: openaiModel };
};

const handleAIStylistPalette = async request => {
  if (!geminiApiKey) throw Object.assign(new Error('Gemini color styling is not configured. Add GEMINI_API_KEY to .env.local; generated layouts and studio colors still work without it.'), { status: 503 });
  const body = await readJson(request);
  const base = Object.values(BASES).find(item => item.label === body.baseSize);
  if (!base) throw Object.assign(new Error('Choose a valid clip size before refreshing the AI palette.'), { status: 400 });
  const title = String(body.title || '').slice(0, 80);
  const baseColor = String(body.baseColor || '').slice(0, 40);
  const complexity = Math.max(1, Math.min(10, Math.round(Number(body.complexity) || 5)));
  const targetTotal = Math.max(15, Math.min(100, Math.round(Number(body.targetTotal) || 15 + (complexity - 1) * 85 / 9)));
  if (!Array.isArray(body.stones) || body.stones.length < 1 || body.stones.length > 100) throw Object.assign(new Error('An AI design must contain between 1 and 100 catalog gemstones.'), { status: 400 });
  const stones = body.stones.map(item => {
    const gem = GEM_CATALOG.find(candidate => candidate.sku === item?.sku);
    if (!gem || !['S','M','L'].includes(gem.tier)) throw Object.assign(new Error('A suggested gemstone SKU is not available for this design.'), { status: 400 });
    return { sku: gem.sku, name: gem.name, shape: gem.shape, tier: gem.tierName, dimensionsMm: `${gem.width} × ${gem.length}` };
  });
  const allowedColors = GEM_COLORS.map(color => color.name);
  const schema = {
    type: 'OBJECT',
    additionalProperties: false,
    required: ['story','colors'],
    propertyOrdering: ['story','colors'],
    properties: {
      story: { type: 'STRING' },
      colors: { type: 'ARRAY', minItems: stones.length, maxItems: stones.length, items: { type: 'STRING', enum: allowedColors } },
    },
  };
  let upstream;
  try {
    upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: { 'x-goog-api-key': geminiApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `You are CHARMLET's hair-clip gemstone color stylist. Keep every gemstone SKU, shape, size, price, position, and order unchanged. Return one catalog color name for each supplied gemstone, in the same order, and one short style story. Use only these colors: ${allowedColors.join(', ')}. Consider the base color and make larger stones the focal points with smaller accent stones. Reflect complexity level ${complexity}/10 and the $${targetTotal} total design target in the palette and short story: lower levels should feel simple and airy; higher levels should feel bold and richly layered. Never invent products, sizes, or prices.` }] },
        contents: [{ role: 'user', parts: [{ text: `Create a coordinated, colorful palette.\nClip: ${base.label}, ${base.length} × ${base.width} mm, ${baseColor} base.\nComplexity: ${complexity}/10 · target total: $${targetTotal}.\nStyle: ${title}.\nFixed gemstones in order: ${JSON.stringify(stones)}` }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: schema, maxOutputTokens: Math.min(4096, 180 + stones.length * 22), temperature: 0.9 },
      }),
    });
  } catch {
    throw Object.assign(new Error('Gemini could not be reached. The studio-generated palette remains available.'), { status: 502 });
  }
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    console.error('Gemini palette request failed with status', upstream.status);
    throw Object.assign(new Error('Gemini could not refresh the palette. The studio-generated colors remain available.'), { status: 502 });
  }
  const output = payload.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('');
  let palette;
  try { palette = JSON.parse(output || ''); }
  catch { throw Object.assign(new Error('Gemini returned an unreadable color palette.'), { status: 502 }); }
  if (!Array.isArray(palette.colors) || palette.colors.length !== stones.length || palette.colors.some(color => !allowedColors.includes(color))) {
    throw Object.assign(new Error('Gemini returned a color that is not in the catalog.'), { status: 502 });
  }
  return { story: String(palette.story || '').slice(0, 220), colors: palette.colors, model: geminiModel, provider: 'Gemini' };
};

const handleCreateOrder = async request => {
  const body = await readJson(request);
  if (!Array.isArray(body.designs) || body.designs.length < 1 || body.designs.length > 20) {
    throw Object.assign(new Error('Your bag must contain between 1 and 20 custom clips.'), { status: 400 });
  }
  const instanceIds = new Set();
  const validated = body.designs.map(design => {
    const result = validateDesign(design);
    for (const stone of design.gemstones) {
      if (instanceIds.has(stone.instanceId)) throw new Error('Gemstone instances must have unique IDs across the bag.');
      instanceIds.add(stone.instanceId);
    }
    return { design, ...result };
  });
  const total = validated.reduce((sum, item) => sum + item.total, 0);
  if (!Number.isFinite(total) || total <= 0 || total > 5000) throw new Error('The order total is outside the allowed range.');
  const purchaseItems = makePurchaseItems(validated.map(item => item.design));
  const itemTotal = purchaseItems.reduce((sum, item) => sum + Number(item.unit_amount.value) * Number(item.quantity), 0);
  if (Math.abs(itemTotal - total) > 0.001) throw new Error('The server could not reconcile the order total.');

  const customIds = validated.map(item => String(item.design.designId || '').slice(0, 50)).filter(Boolean);
  const order = await paypalRequest('/v2/checkout/orders', {
    method: 'POST',
    headers: { 'PayPal-Request-Id': randomUUID() },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        ...(customIds.length ? { custom_id: customIds.join(',').slice(0, 127) } : {}),
        description: 'CHARMLET customized gemstone hair clips',
        amount: {
          currency_code: 'USD',
          value: total.toFixed(2),
          breakdown: { item_total: { currency_code: 'USD', value: total.toFixed(2) } },
        },
        items: purchaseItems,
      }],
      payment_source: {
        paypal: { experience_context: { brand_name: 'CHARMLET', user_action: 'PAY_NOW', shipping_preference: 'GET_FROM_FILE' } },
      },
    }),
  });
  if (!order.id) throw Object.assign(new Error('PayPal did not return an order ID.'), { status: 502 });
  pendingOrders.set(order.id, { total, createdAt: Date.now() });
  for (const [id, value] of pendingOrders) if (Date.now() - value.createdAt > 30 * 60 * 1000) pendingOrders.delete(id);
  return { id: order.id, total: total.toFixed(2), currency: 'USD' };
};

const handleCapture = async orderId => {
  if (!/^[A-Z0-9-]{8,80}$/i.test(orderId)) throw Object.assign(new Error('PayPal order ID is invalid.'), { status: 400 });
  const expected = pendingOrders.get(orderId);
  if (!expected) throw Object.assign(new Error('This order is no longer available. Please start checkout again.'), { status: 404 });
  const capture = await paypalRequest('/v2/checkout/orders/' + encodeURIComponent(orderId) + '/capture', {
    method: 'POST',
    headers: { 'PayPal-Request-Id': randomUUID() },
    body: '{}',
  });
  const purchaseUnit = capture.purchase_units?.[0];
  const captureInfo = purchaseUnit?.payments?.captures?.[0];
  const amount = Number(captureInfo?.amount?.value);
  if (capture.status !== 'COMPLETED' || captureInfo?.status !== 'COMPLETED' || !Number.isFinite(amount) || Math.abs(amount - expected.total) > 0.001) {
    throw Object.assign(new Error('PayPal did not confirm the expected completed payment.'), { status: 502 });
  }
  pendingOrders.delete(orderId);
  const shipping = purchaseUnit?.shipping;
  const address = shipping?.address;
  const delivery = shipping && address ? {
    name: shipping.name?.full_name || '',
    address: {
      addressLine1: address.address_line_1 || '',
      addressLine2: address.address_line_2 || '',
      city: address.admin_area_2 || '',
      region: address.admin_area_1 || '',
      postalCode: address.postal_code || '',
      countryCode: address.country_code || '',
    },
  } : null;
  return { id: orderId, status: capture.status, captureId: captureInfo.id, total: amount.toFixed(2), currency: 'USD', environment, shipping: delivery };
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  try {
    if (request.method === 'GET' && url.pathname === '/api/paypal/config') {
      return respond(response, 200, { configured: Boolean(clientId && clientSecret), clientId: clientId && clientSecret ? clientId : null, environment });
    }
    if (request.method === 'POST' && url.pathname === '/api/ai/stylist') {
      return respond(response, 200, await handleAIStylist(request));
    }
    if (request.method === 'GET' && url.pathname === '/api/ai/stylist/config') {
      return respond(response, 200, { configured: Boolean(geminiApiKey), provider: 'Gemini', model: geminiModel });
    }
    if (request.method === 'POST' && url.pathname === '/api/ai/stylist/palette') {
      return respond(response, 200, await handleAIStylistPalette(request));
    }
    if (request.method === 'POST' && url.pathname === '/api/paypal/orders') {
      const order = await handleCreateOrder(request);
      return respond(response, 200, order);
    }
    const captureMatch = url.pathname.match(/^\/api\/paypal\/orders\/([^/]+)\/capture$/);
    if (request.method === 'POST' && captureMatch) {
      const payment = await handleCapture(decodeURIComponent(captureMatch[1]));
      return respond(response, 200, payment);
    }
    if (production && ['GET', 'HEAD'].includes(request.method) && !url.pathname.startsWith('/api')) {
      return serveClient(request, response, url.pathname);
    }
    return respond(response, 404, { error: 'Not found.' });
  } catch (error) {
    const status = error.status || 400;
    if (status >= 500) console.error(error.message);
    return respond(response, status, { error: status >= 500 ? error.message : error.message });
  }
});

const port = Number(process.env.PORT || process.env.PAYPAL_API_PORT || 3001);
const host = production ? '0.0.0.0' : '127.0.0.1';
server.listen(port, host, () => console.log('CHARMLET server ready on http://' + host + ':' + port));
