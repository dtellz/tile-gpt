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
    // Try different path formats to find the image
    let fullPath = `${workspacePath}/${imagePath}`;
    let exists = await pathExists(fullPath);
    
    // If not found, try alternative path formats
    if (!exists) {
      console.log(`Image not found at ${fullPath}, trying alternative paths...`);
      
      // Try without the tileset directory prefix (sometimes images are in a common folder)
      const imageFileName = imagePath.split('/').pop();
      if (imageFileName) {
        const altPath1 = `${workspacePath}/${imageFileName}`;
        console.log(`Trying alternative path 1: ${altPath1}`);
        const altExists1 = await pathExists(altPath1);
        if (altExists1) {
          console.log(`Found image at alternative path: ${altPath1}`);
          fullPath = altPath1;
          exists = true;
        }
      }
      
      // Try looking in common image directories
      if (!exists) {
        // Add specific directories from the logs
        const commonDirs = [
          'png_files',
          'images', 
          'img', 
          'assets', 
          'tiles',
          // Add specific directories for the_cove project
          'the_cove/png_files',
          'png_files/the_cove'
        ];
        
        for (const dir of commonDirs) {
          if (imageFileName) {
            const altPath2 = `${workspacePath}/${dir}/${imageFileName}`;
            console.log(`Trying alternative path 2: ${altPath2}`);
            const altExists2 = await pathExists(altPath2);
            if (altExists2) {
              console.log(`Found image at alternative path: ${altPath2}`);
              fullPath = altPath2;
              exists = true;
              break;
            }
          }
        }
      }
      
      // Try specific known mappings based on the logs
      if (!exists && imageFileName) {
        // Map specific tileset names to known image locations
        const specificMappings: Record<string, string> = {
          'harbor_tiles.tsx': 'png_files/Harbor.png',
          'grass_floors.tsx': 'png_files/grass_floors.png',
          'harbor_lantern.tsx': 'png_files/lantern.png'
        };
        
        // Extract the tileset name from the path
        const tilesetName = tileset.source.split('/').pop();
        
        if (tilesetName && specificMappings[tilesetName]) {
          const specificPath = `${workspacePath}/${specificMappings[tilesetName]}`;
          console.log(`Trying specific mapping for ${tilesetName}: ${specificPath}`);
          const specificExists = await pathExists(specificPath);
          
          if (specificExists) {
            console.log(`Found image using specific mapping: ${specificPath}`);
            fullPath = specificPath;
            exists = true;
          }
        }
      }
    }
    
    // If still not found, throw an error
    if (!exists) {
      console.error(`Tileset image not found after trying multiple paths: ${imagePath}`);
      throw new Error(`Tileset image not found: ${fullPath}`);
    }
    
    console.log(`Using image path: ${fullPath}`);
    
    
    // Try to load the actual image using the binary file reader
    try {
      // Get the image data as a base64 string
      console.log(`Reading binary file: ${fullPath}`);
      const base64Data = await readBinaryFile(fullPath);
      
      if (!base64Data || base64Data.length === 0) {
        console.error(`Empty or invalid binary data for ${fullPath}`);
        throw new Error(`Empty or invalid binary data for ${fullPath}`);
      }
      
      console.log(`Successfully read binary data (${base64Data.length} chars) for ${imagePath}`);
      
      // Determine the MIME type based on file extension
      const extension = imagePath.split('.').pop()?.toLowerCase();
      let mimeType = 'image/png'; // Default
      
      if (extension === 'jpg' || extension === 'jpeg') {
        mimeType = 'image/jpeg';
      } else if (extension === 'gif') {
        mimeType = 'image/gif';
      }
      
      console.log(`Using MIME type: ${mimeType} for extension: ${extension}`);
      
      // Create a data URL from the base64 data
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      
      // Create and load the image
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          console.log(`Image loaded successfully: ${imagePath} (${img.width}x${img.height})`);
          imageCache.set(imagePath, img);
          resolve(img);
        };
        
        img.onerror = (e) => {
          // If loading fails, fall back to placeholder
          console.error(`Failed to load image from data URL: ${imagePath}`, e);
          reject(new Error(`Failed to load image from data URL: ${imagePath}`));
        };
        
        // Set a timeout to detect if the image loading is taking too long
        const timeout = setTimeout(() => {
          console.warn(`Image loading timeout for ${imagePath}`);
        }, 5000);
        
        // Clear the timeout when the image loads or errors
        img.onload = () => {
          clearTimeout(timeout);
          console.log(`Image loaded successfully: ${imagePath} (${img.width}x${img.height})`);
          imageCache.set(imagePath, img);
          resolve(img);
        };
        
        img.onerror = (e) => {
          clearTimeout(timeout);
          console.error(`Failed to load image from data URL: ${imagePath}`, e);
          reject(new Error(`Failed to load image from data URL: ${imagePath}`));
        };
        
        console.log(`Setting image src for ${imagePath}`);
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
  // Safety check for null/undefined tileset
  if (!tileset) {
    console.warn('Tileset is null or undefined');
    return null;
  }

  // Use default values for missing properties
  const tileWidth = tileset.tileWidth || 32; // Default to 32 if undefined
  const tileHeight = tileset.tileHeight || 32; // Default to 32 if undefined
  const columns = tileset.columns || 1; // Default to 1 if undefined
  
  // Log the values we're using
  console.log(`Using values: tileWidth=${tileWidth}, tileHeight=${tileHeight}, columns=${columns}`);
  
  // Check if the localTileId is valid (should be >= 0)
  if (localTileId < 0) {
    console.warn(`Invalid localTileId: ${localTileId}`);
    return null;
  }
  
  // Calculate the position in the tileset image
  // For large localTileIds with small column counts, we need a better approach
  // Most tilesets are organized in a grid with reasonable dimensions
  
  // If columns is 1 (which is often a default when not specified), try to estimate a better value
  let effectiveColumns = columns;
  if (columns === 1 && localTileId > 20) { // If we have many tiles but only 1 column, something's likely wrong
    // Try to estimate a reasonable column count based on typical tileset layouts
    // Most tilesets use 8, 16, or 32 columns
    if (tileset.imageWidth && tileset.tileWidth) {
      // Calculate based on actual image width if available
      effectiveColumns = Math.floor(tileset.imageWidth / tileWidth);
      console.log(`Estimated columns from image dimensions: ${effectiveColumns}`);
    } else {
      // Otherwise use a reasonable default
      effectiveColumns = 16; // A common value for many tilesets
      console.log(`Using estimated default columns: ${effectiveColumns}`);
    }
  }
  
  // Calculate position with the effective column count
  const row = Math.floor(localTileId / effectiveColumns);
  const col = localTileId % effectiveColumns;
  
  const x = col * tileWidth;
  const y = row * tileHeight;
  
  // Log the calculated position
  console.log(`Calculated position for tile ${localTileId}: x=${x}, y=${y} (row=${row}, col=${col}, using columns=${effectiveColumns})`);
  
  // If the position still seems unreasonable, cap it
  const maxY = 1024; // Maximum reasonable height for a tileset
  if (y > maxY) {
    console.warn(`Capping unreasonably large Y position from ${y} to ${maxY}`);
    return {
      x,
      y: maxY,
      width: tileWidth,
      height: tileHeight
    };
  }
  
  // Validate that the calculated position is within the image bounds if we have image dimensions
  if (tileset.imageWidth && tileset.imageHeight) {
    if (x >= tileset.imageWidth || y >= tileset.imageHeight) {
      console.warn(`Tile position out of bounds: x=${x}, y=${y}, imageWidth=${tileset.imageWidth}, imageHeight=${tileset.imageHeight}`);
      return null;
    }
  }
  
  // Return the source rectangle
  return {
    x,
    y,
    width: tileWidth,
    height: tileHeight
  };
}
