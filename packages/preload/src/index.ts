import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer} from 'electron';
import {selectDirectory, readDirectory, readFile, pathExists} from './fileSystem.js';
import {readBinaryFile} from './fileSystem.binary.js';

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

export {sha256sum, versions, send, selectDirectory, readDirectory, readFile, readBinaryFile, pathExists};
