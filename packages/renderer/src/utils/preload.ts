/**
 * This file provides type-safe access to the preload APIs exposed by Electron
 */

// Define the file system API types
interface FileSystemAPI {
  selectDirectory: () => Promise<string | null>;
  readDirectory: (path: string) => Promise<{
    name: string;
    path: string;
    type: 'file' | 'folder';
    size: number;
    modifiedTime: string;
  }[]>;
  readFile: (path: string) => Promise<string>;
  readBinaryFile: (path: string) => Promise<string>; // Returns base64 encoded string
  pathExists: (path: string) => Promise<boolean>;
}

// In the preload script, the functions are exposed with base64-encoded names
// We need to use the same encoding to access them
const encodedNames = {
  selectDirectory: btoa('selectDirectory'),
  readDirectory: btoa('readDirectory'),
  readFile: btoa('readFile'),
  readBinaryFile: btoa('readBinaryFile'),
  pathExists: btoa('pathExists')
};

// Access the preload APIs from the window object
type ElectronWindow = Record<string, unknown>;
const w = window as unknown as ElectronWindow;

// Export the preload APIs with proper typing
export const selectDirectory = w[encodedNames.selectDirectory] as FileSystemAPI['selectDirectory'];
export const readDirectory = w[encodedNames.readDirectory] as FileSystemAPI['readDirectory'];
export const readFile = w[encodedNames.readFile] as FileSystemAPI['readFile'];
export const readBinaryFile = w[encodedNames.readBinaryFile] as FileSystemAPI['readBinaryFile'];
export const pathExists = w[encodedNames.pathExists] as FileSystemAPI['pathExists'];
