// Using browser's native DOMParser
import { TilesetReference } from './tmxParser';

/**
 * Parse a TSX file content into a structured tileset object
 */
export function parseTsx(content: string, firstGid: number, source: string): TilesetReference {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'application/xml');
  
  // Parse tileset attributes
  const tilesetElement = xmlDoc.getElementsByTagName('tileset')[0];
  
  const tileset: TilesetReference = {
    firstGid,
    source,
    name: tilesetElement.getAttribute('name') || '',
    tileWidth: parseInt(tilesetElement.getAttribute('tilewidth') || '0', 10),
    tileHeight: parseInt(tilesetElement.getAttribute('tileheight') || '0', 10),
    tileCount: parseInt(tilesetElement.getAttribute('tilecount') || '0', 10),
    columns: parseInt(tilesetElement.getAttribute('columns') || '0', 10),
  };
  
  // Parse image
  const imageElements = tilesetElement.getElementsByTagName('image');
  if (imageElements.length > 0) {
    const imageElement = imageElements[0];
    tileset.imageSource = imageElement.getAttribute('source') || '';
    tileset.imageWidth = parseInt(imageElement.getAttribute('width') || '0', 10);
    tileset.imageHeight = parseInt(imageElement.getAttribute('height') || '0', 10);
  }
  
  return tileset;
}

/**
 * Resolve the relative path of a tileset image
 */
export function resolveTilesetImagePath(tilesetPath: string, imageSource: string): string {
  // Extract the directory from the tileset path
  const lastSlashIndex = tilesetPath.lastIndexOf('/');
  const tilesetDir = lastSlashIndex >= 0 ? tilesetPath.substring(0, lastSlashIndex + 1) : '';
  
  // Combine with the image source
  return tilesetDir + imageSource;
}
