// Using browser's native DOMParser

export interface TilesetReference {
  firstGid: number;
  source: string;
  name?: string;
  tileWidth?: number;
  tileHeight?: number;
  imageSource?: string;
  imageWidth?: number;
  imageHeight?: number;
  tileCount?: number;
  columns?: number;
}

export interface TmxLayer {
  id: number;
  name: string;
  width: number;
  height: number;
  visible: boolean;
  data: number[];
}

export interface TmxMap {
  version: string;
  tiledVersion: string;
  orientation: string;
  renderOrder: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  infinite: boolean;
  tilesets: TilesetReference[];
  layers: TmxLayer[];
}

/**
 * Parse a TMX file content into a structured object
 */
export function parseTmx(content: string): TmxMap {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'application/xml');
  
  // Parse map attributes
  const mapElement = xmlDoc.getElementsByTagName('map')[0];
  const map: TmxMap = {
    version: mapElement.getAttribute('version') || '',
    tiledVersion: mapElement.getAttribute('tiledversion') || '',
    orientation: mapElement.getAttribute('orientation') || 'orthogonal',
    renderOrder: mapElement.getAttribute('renderorder') || 'right-down',
    width: parseInt(mapElement.getAttribute('width') || '0', 10),
    height: parseInt(mapElement.getAttribute('height') || '0', 10),
    tileWidth: parseInt(mapElement.getAttribute('tilewidth') || '0', 10),
    tileHeight: parseInt(mapElement.getAttribute('tileheight') || '0', 10),
    infinite: mapElement.getAttribute('infinite') === '1',
    tilesets: [],
    layers: []
  };
  
  // Parse tilesets
  const tilesetElements = xmlDoc.getElementsByTagName('tileset');
  for (let i = 0; i < tilesetElements.length; i++) {
    const tilesetElement = tilesetElements[i];
    const tileset: TilesetReference = {
      firstGid: parseInt(tilesetElement.getAttribute('firstgid') || '0', 10),
      source: tilesetElement.getAttribute('source') || ''
    };
    map.tilesets.push(tileset);
  }
  
  // Parse layers
  const layerElements = xmlDoc.getElementsByTagName('layer');
  for (let i = 0; i < layerElements.length; i++) {
    const layerElement = layerElements[i];
    const layerId = parseInt(layerElement.getAttribute('id') || '0', 10);
    const layerName = layerElement.getAttribute('name') || '';
    const layerWidth = parseInt(layerElement.getAttribute('width') || '0', 10);
    const layerHeight = parseInt(layerElement.getAttribute('height') || '0', 10);
    const visible = layerElement.getAttribute('visible') !== '0';
    
    // Parse layer data
    const dataElement = layerElement.getElementsByTagName('data')[0];
    const encoding = dataElement.getAttribute('encoding');
    
    let tileData: number[] = [];
    
    if (encoding === 'csv') {
      // Parse CSV data
      const csvContent = dataElement.textContent || '';
      tileData = csvContent
        .trim()
        .split(',')
        .map((value: string) => parseInt(value.trim(), 10))
        .filter((value: number) => !isNaN(value));
    } else {
      // For other encodings (base64, etc.), we would need to implement them
      console.warn(`Unsupported encoding: ${encoding}`);
    }
    
    const layer: TmxLayer = {
      id: layerId,
      name: layerName,
      width: layerWidth,
      height: layerHeight,
      visible,
      data: tileData
    };
    
    map.layers.push(layer);
  }
  
  return map;
}

/**
 * Get the tileset that contains a specific tile ID
 */
export function getTilesetForTile(tileId: number, tilesets: TilesetReference[]): TilesetReference | null {
  if (tileId === 0) return null; // Empty tile
  
  // Sort tilesets by firstGid in descending order
  const sortedTilesets = [...tilesets].sort((a, b) => b.firstGid - a.firstGid);
  
  // Find the tileset that contains this tile
  for (const tileset of sortedTilesets) {
    if (tileId >= tileset.firstGid) {
      return tileset;
    }
  }
  
  return null;
}

/**
 * Calculate the local tile ID within its tileset
 */
export function getLocalTileId(globalTileId: number, tileset: TilesetReference): number {
  return globalTileId - tileset.firstGid;
}

/**
 * Calculate the position of a tile in the tileset image
 */
export function getTilePosition(localTileId: number, columns: number): { x: number, y: number } {
  const x = localTileId % columns;
  const y = Math.floor(localTileId / columns);
  return { x, y };
}
