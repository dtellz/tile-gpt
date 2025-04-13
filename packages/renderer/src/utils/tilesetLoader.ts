import { readFile, readBinaryFile, pathExists } from './preload';
import { TilesetReference } from './tmxParser';
import { parseTsx, resolveTilesetImagePath } from './tsxParser';

// Cache for loaded tilesets and images
const tilesetCache = new Map<string, TilesetReference>();
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Load a tileset from a TSX file
 */
export async function loadTileset(
  tilesetPath: string, 
  firstGid: number,
  workspacePath: string
): Promise<TilesetReference | null> {
  // Check if already in cache
  if (tilesetCache.has(tilesetPath)) {
    return tilesetCache.get(tilesetPath) || null;
  }
  
  try {
    // Resolve the full path
    const fullPath = `${workspacePath}/${tilesetPath}`;
    
    // Check if the file exists
    const exists = await pathExists(fullPath);
    if (!exists) {
      throw new Error(`Tileset file not found: ${fullPath}`);
    }
    
    // Read the TSX file
    const tsxContent = await readFile(fullPath);
    
    // Parse the TSX content
    const tileset = parseTsx(tsxContent, firstGid, tilesetPath);
    
    // Cache the result
    tilesetCache.set(tilesetPath, tileset);
    
    return tileset;
  } catch (error) {
    console.error(`Error loading tileset ${tilesetPath}:`, error);
    return null;
  }
}

/**
 * Load an image for a tileset
 */
export async function loadTilesetImage(
  tileset: TilesetReference,
  workspacePath: string
): Promise<HTMLImageElement | null> {
  if (!tileset.imageSource) {
    return null;
  }
  
  // Resolve the image path relative to the tileset
  const imagePath = resolveTilesetImagePath(tileset.source, tileset.imageSource);
  
  // Check if already in cache
  if (imageCache.has(imagePath)) {
    return imageCache.get(imagePath) || null;
  }
  
  try {
    // Create a full path to the image
    const fullPath = `${workspacePath}/${imagePath}`;
    
    // Check if the file exists
    const exists = await pathExists(fullPath);
    if (!exists) {
      throw new Error(`Tileset image not found: ${fullPath}`);
    }
    
    // Try to load the actual image using the binary file reader
    try {
      // Get the image data as a base64 string
      const base64Data = await readBinaryFile(fullPath);
      
      // Determine the MIME type based on file extension
      const extension = imagePath.split('.').pop()?.toLowerCase();
      let mimeType = 'image/png'; // Default
      
      if (extension === 'jpg' || extension === 'jpeg') {
        mimeType = 'image/jpeg';
      } else if (extension === 'gif') {
        mimeType = 'image/gif';
      }
      
      // Create a data URL from the base64 data
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      // Create and load the image
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          imageCache.set(imagePath, img);
          resolve(img);
        };
        
        img.onerror = () => {
          // If loading fails, fall back to placeholder
          reject(new Error(`Failed to load image from data URL: ${imagePath}`));
        };
        
        img.src = dataUrl;
      });
    } catch (binaryError) {
      console.warn(`Failed to load binary image data, using placeholder: ${binaryError}`);
      
      // Fall back to a placeholder if binary loading fails
      const canvas = document.createElement('canvas');
      const size = 32; // Default size for a tile
      if (tileset.tileWidth && tileset.tileHeight) {
        canvas.width = tileset.tileWidth * (tileset.columns || 1);
        canvas.height = tileset.tileHeight * (Math.ceil((tileset.tileCount || 1) / (tileset.columns || 1)));
      } else {
        canvas.width = size * 10;
        canvas.height = size * 10;
      }
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw a placeholder pattern
        const colors = ['#4a90e2', '#50e3c2', '#b8e986', '#f8e71c', '#f5a623'];
        
        // Draw a grid of colored squares
        for (let y = 0; y < canvas.height; y += size) {
          for (let x = 0; x < canvas.width; x += size) {
            const colorIndex = Math.floor(Math.random() * colors.length);
            ctx.fillStyle = colors[colorIndex];
            ctx.fillRect(x, y, size, size);
            
            // Draw a border
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(x, y, size, size);
            
            // Draw tile index
            const tileIndex = Math.floor(y / size) * Math.floor(canvas.width / size) + Math.floor(x / size);
            ctx.fillStyle = '#000000';
            ctx.font = '10px Arial';
            ctx.fillText(tileIndex.toString(), x + 2, y + 12);
          }
        }
      }
      
      // Convert canvas to image
      const img = new Image();
      img.src = canvas.toDataURL('image/png');
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          imageCache.set(imagePath, img);
          resolve(img);
        };
        
        img.onerror = () => {
          reject(new Error(`Failed to create placeholder image for: ${imagePath}`));
        };
      });
    }
  } catch (error) {
    console.error(`Error loading tileset image ${tileset.imageSource}:`, error);
    return null;
  }
}

/**
 * Clear all caches
 */
export function clearTilesetCaches(): void {
  tilesetCache.clear();
  imageCache.clear();
}

/**
 * Get the source rectangle for a tile in a tileset
 */
export function getTileSourceRect(
  tileset: TilesetReference,
  localTileId: number
): { x: number, y: number, width: number, height: number } | null {
  if (!tileset.columns || !tileset.tileWidth || !tileset.tileHeight) {
    return null;
  }
  
  const columns = tileset.columns;
  const x = (localTileId % columns) * tileset.tileWidth;
  const y = Math.floor(localTileId / columns) * tileset.tileHeight;
  
  return {
    x,
    y,
    width: tileset.tileWidth,
    height: tileset.tileHeight
  };
}
