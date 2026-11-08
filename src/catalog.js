export const BASES = {
  small: { id: 'clip-small-v1', label: 'Small', width: 20, length: 60, price: 9 },
  medium: { id: 'clip-medium-v1', label: 'Medium', width: 25, length: 85, price: 14 },
};

export const BASE_COLORS = [
  { name: 'Cherry', hex: '#e74365' }, { name: 'Butter', hex: '#e8bd42' }, { name: 'Pool', hex: '#369eaa' },
  { name: 'Lilac', hex: '#9578c6' }, { name: 'Espresso', hex: '#49342f' }, { name: 'Cloud', hex: '#f4eee4' },
  { name: 'Black', hex: '#211e20' }, { name: 'Green', hex: '#34835e' },
];

export const GEM_COLORS = [
  { name: 'Pink', hex: '#f2679a' }, { name: 'Red', hex: '#e43b46' }, { name: 'Orange', hex: '#f28b45' },
  { name: 'Yellow', hex: '#f4cf55' }, { name: 'Green', hex: '#4dad81' }, { name: 'Blue', hex: '#4f9fe4' },
  { name: 'Purple', hex: '#9870d1' }, { name: 'Clear', hex: '#e8f6fa' },
];
// Keep retired colors readable on already saved designs and carts; new designs only offer GEM_COLORS.
export const RETIRED_GEM_COLORS = [
  { name: 'Champagne', hex: '#d9b678' }, { name: 'Iridescent', hex: '#a7a5e8' },
];

export const TIERS = [
  { id: 'S', label: 'Small', price: 1, dims: { round:[2,2], oval:[2,3], heart:[3,3], teardrop:[2,3], marquise:[2,4], emerald:[2,2], square:[2,2], princess:[2,2], cushion:[2,2], pear:[2,3], flower:[3,3], star:[3,3], octagon:[2,2], hexagon:[2,2], irregular:[3,3] } },
  { id: 'M', label: 'Medium', price: 2, dims: { round:[4,4], oval:[4,6], heart:[5,5], teardrop:[4,6], marquise:[3,6], emerald:[4,6], square:[4,4], princess:[4,4], cushion:[4,4], pear:[4,6], flower:[5,5], star:[5,5], octagon:[4,4], hexagon:[4,4], irregular:[5,5] } },
  { id: 'L', label: 'Large', price: 3, dims: { round:[7,7], oval:[6,8], heart:[8,8], teardrop:[6,9], marquise:[4,8], emerald:[6,8], square:[6,6], princess:[6,6], cushion:[6,6], pear:[6,9], flower:[8,8], star:[8,8], octagon:[7,7], hexagon:[7,7], irregular:[8,8] } },
];

export const SHAPES = [
  ['round','Round'], ['oval','Oval'], ['heart','Heart'], ['teardrop','Teardrop'], ['marquise','Marquise'],
  ['emerald','Emerald cut'], ['square','Square'], ['princess','Princess cut'], ['cushion','Cushion'],
  ['pear','Pear'], ['flower','Flower'], ['star','Star'], ['octagon','Octagon'], ['hexagon','Hexagon'], ['irregular','Irregular'],
];

// Prototype catalog prices and dimensions are shared by the UI and payment API.
// Live supplier inventory and production SKUs still need to be connected.
export const GEM_CATALOG = SHAPES.flatMap(([shape, name]) => TIERS.map(tier => {
  const [width, length] = tier.dims[shape];
  return {
    id: 'gem-' + shape + '-' + tier.id.toLowerCase(),
    sku: 'CH-' + shape.slice(0, 3).toUpperCase() + '-' + tier.id,
    name: name + ' · ' + tier.label,
    shape,
    tier: tier.id,
    tierName: tier.label,
    width,
    length,
    height: Math.max(0.8, Math.min(2.2, Math.min(width, length) * 0.38)),
    price: tier.price,
    colors: GEM_COLORS,
    inventory: 'Catalog preview',
  };
}));

const unitPolygon = gem => {
  const count = gem.shape === 'round' ? 32
    : ['oval','teardrop','pear','marquise'].includes(gem.shape) ? 24
    : gem.shape === 'heart' ? 32 : gem.shape === 'flower' ? 40
    : gem.shape === 'star' ? 10 : gem.shape === 'irregular' ? 9
    : gem.shape === 'hexagon' ? 6 : gem.shape === 'octagon' ? 8 : 4;
  if (gem.shape === 'heart') return Array.from({ length: count }, (_, i) => {
    const angle = Math.PI * 2 * i / count;
    return [16 * Math.pow(Math.sin(angle), 3) / 17, (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) / 17];
  });
  if (['star','flower','irregular'].includes(gem.shape)) return Array.from({ length: count }, (_, i) => {
    const angle = Math.PI * 2 * i / count - Math.PI / 2;
    const irregular = [1,.73,.94,.61,.86,.7,.98,.63,.81][i];
    const radius = gem.shape === 'star' ? (i % 2 ? .47 : 1) : gem.shape === 'flower' ? (i % 2 ? .69 : 1) : irregular;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
  if (gem.shape === 'marquise') return Array.from({ length: count }, (_, i) => {
    const angle = Math.PI * 2 * i / count;
    return [Math.cos(angle) * Math.pow(Math.abs(Math.cos(angle)), 1.8), Math.sin(angle) * .55];
  });
  if (gem.shape === 'teardrop' || gem.shape === 'pear') return Array.from({ length: count }, (_, i) => {
    const angle = Math.PI * 2 * i / count;
    return [Math.sin(angle) * (.72 + .28 * Math.cos(angle)), Math.cos(angle)];
  });
  if (['square','princess','emerald','cushion'].includes(gem.shape)) {
    const cut = gem.shape === 'emerald' ? .27 : gem.shape === 'cushion' ? .22 : 0;
    return [[-1+cut,-1], [1-cut,-1], [1,-1+cut], [1,1-cut], [1-cut,1], [-1+cut,1], [-1,1-cut], [-1,-1+cut]];
  }
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.PI * 2 * i / count - Math.PI / 2;
    return [Math.cos(angle), Math.sin(angle)];
  });
};

export const gemPolygonMm = (gem, positionMm, rotation = 0) => {
  const unit = unitPolygon(gem);
  const maxX = Math.max(...unit.map(point => Math.abs(point[0]))) || 1;
  const maxY = Math.max(...unit.map(point => Math.abs(point[1]))) || 1;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return unit.map(([x, y]) => {
    const sx = x / maxX * gem.width / 2;
    const sy = y / maxY * gem.length / 2;
    return [positionMm[0] + sx * cos - sy * sin, positionMm[1] + sx * sin + sy * cos];
  });
};

const quadratic = (start, control, end, segments = 10) => Array.from({ length: segments }, (_, index) => {
  const t = (index + 1) / segments;
  const inverse = 1 - t;
  return [
    inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0],
    inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1],
  ];
});

const roundedClipBoundary = base => {
  const halfW = base.width / 2 - 0.2; // UI surface has a 0.2 mm safety inset.
  const halfL = base.length / 2 - 0.2;
  const radius = halfW * .78;
  const points = [[-halfW + radius, -halfL], [halfW - radius, -halfL]];
  const appendCurve = (start, control, end) => points.push(...quadratic(start, control, end));
  appendCurve(points[points.length - 1], [halfW, -halfL], [halfW, -halfL + radius]);
  points.push([halfW, halfL - radius]);
  appendCurve(points[points.length - 1], [halfW, halfL], [halfW - radius, halfL]);
  points.push([-halfW + radius, halfL]);
  appendCurve(points[points.length - 1], [-halfW, halfL], [-halfW, halfL - radius]);
  points.push([-halfW, -halfL + radius]);
  appendCurve(points[points.length - 1], [-halfW, -halfL], [-halfW + radius, -halfL]);
  points.pop();
  return points;
};

const pointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const polygonsIntersect = (a, b) => {
  const orient = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const crosses = (p, q, r, s) => orient(p, q, r) * orient(p, q, s) < -1e-10 && orient(r, s, p) * orient(r, s, q) < -1e-10;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) if (crosses(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
  return pointInPolygon(a[0], b) || pointInPolygon(b[0], a);
};

export const validateGemstoneLayout = (base, stones) => {
  const boundary = roundedClipBoundary(base);
  const polygons = [];
  for (const stone of stones) {
    const gem = GEM_CATALOG.find(item => item.sku === stone.skuId);
    if (!gem) return { valid: false, reason: 'A gemstone SKU is not in the catalog.' };
    const position = stone.surfacePositionMm;
    const rotation = stone.orientation;
    const polygon = gemPolygonMm(gem, position, rotation);
    if (!polygon.every(point => pointInPolygon(point, boundary))) return { valid: false, reason: 'A gemstone extends beyond the clip surface.' };
    if (polygons.some(other => polygonsIntersect(polygon, other))) return { valid: false, reason: 'Two gemstones overlap.' };
    polygons.push(polygon);
  }
  return { valid: true };
};

export const validateDesign = design => {
  if (!design || typeof design !== 'object') throw new Error('A design is missing.');
  const base = Object.values(BASES).find(item => item.id === design.baseSku);
  if (!base) throw new Error('A hair clip size is not available.');
  if (design.baseSize !== base.label || Number(design.baseDimensionsMm?.length) !== base.length || Number(design.baseDimensionsMm?.width) !== base.width) {
    throw new Error('The clip dimensions do not match the selected size.');
  }
  if (!BASE_COLORS.some(color => color.hex.toLowerCase() === String(design.baseColorHex || '').toLowerCase())) {
    throw new Error('A base color is not available.');
  }
  if (!Array.isArray(design.gemstones) || design.gemstones.length > 200) throw new Error('This design has too many gemstones.');
  const ids = new Set();
  let total = base.price;
  for (const stone of design.gemstones) {
    if (!stone || typeof stone !== 'object') throw new Error('A gemstone entry is invalid.');
    const gem = GEM_CATALOG.find(item => item.sku === stone.skuId);
    if (!gem || stone.gemId !== gem.id || stone.shape !== gem.shape) throw new Error('A gemstone SKU is not in the catalog.');
    const id = String(stone.instanceId || '');
    if (!id || id.length > 120 || ids.has(id)) throw new Error('Gemstone instances must have unique IDs.');
    ids.add(id);
    const dims = stone.physicalDimensionsMm || {};
    if (Number(dims.width) !== gem.width || Number(dims.length) !== gem.length || Math.abs(Number(dims.height) - gem.height) > .001) {
      throw new Error('A gemstone physical size does not match its SKU.');
    }
    if (![...gem.colors, ...RETIRED_GEM_COLORS].some(color => color.hex.toLowerCase() === String(stone.color || '').toLowerCase())) throw new Error('A gemstone color is not available.');
    if (!Array.isArray(stone.surfacePositionMm) || stone.surfacePositionMm.length !== 2 || !stone.surfacePositionMm.every(Number.isFinite)) {
      throw new Error('A gemstone position is invalid.');
    }
    if (!Number.isFinite(stone.orientation) || Math.abs(stone.orientation) > 1000000) throw new Error('A gemstone orientation is invalid.');
    total += gem.price;
  }
  const layout = validateGemstoneLayout(base, design.gemstones);
  if (!layout.valid) throw new Error(layout.reason);
  return { base, total, gemstones: design.gemstones.map(stone => GEM_CATALOG.find(item => item.sku === stone.skuId)) };
};
