import { dialog, ipcMain, BrowserWindow } from 'electron';
import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';

class FileSystemModule implements AppModule {
  async enable(context: ModuleContext): Promise<void> {
    await context.app.whenReady();
    
    // Handler for selecting directory
    ipcMain.handle('select-directory', async () => {
      // Get the main window
      const window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());
      if (!window) return null;
      
      const { canceled, filePaths } = await dialog.showOpenDialog(window, {
        properties: ['openDirectory'],
        title: 'Select a workspace folder',
      });
      
      if (canceled || filePaths.length === 0) {
        return null;
      }
      
      return filePaths[0];
    });
    
    // Clean up when app is about to quit
    context.app.on('will-quit', () => {
      ipcMain.removeHandler('select-directory');
    });
  }
}

export function createFileSystemModule(): AppModule {
  return new FileSystemModule();
}
