import * as fs from 'fs/promises';

// This file provides binary file reading capabilities for the Electron app

/**
 * Reads a file as binary data and returns it as a base64 encoded string
 */
export async function readBinaryFile(filePath: string) {
  try {
    // Read the file as a buffer
    const buffer = await fs.readFile(filePath);
    
    // Convert the buffer to a base64 string
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error reading binary file:', error);
    throw error;
  }
}
