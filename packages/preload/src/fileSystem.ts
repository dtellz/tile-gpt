import { dialog, ipcRenderer } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Opens a dialog to select a folder and returns the selected path
 */
export async function selectDirectory() {
  return ipcRenderer.invoke('select-directory');
}

/**
 * Gets the files and folders in a directory
 */
export async function readDirectory(dirPath: string) {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    return Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(dirPath, item.name);
        const stats = await fs.stat(itemPath);
        
        return {
          name: item.name,
          path: itemPath,
          type: item.isDirectory() ? 'folder' : 'file',
          size: stats.size,
          modifiedTime: stats.mtime.toISOString(),
        };
      })
    );
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
}

/**
 * Reads a file and returns its content
 */
export async function readFile(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}

/**
 * Checks if a path exists
 */
export async function pathExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
