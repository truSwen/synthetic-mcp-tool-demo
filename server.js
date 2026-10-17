import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {pathToFileURL} from 'node:url';
import {createServer} from './tools.js';
export {createServer};
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)serveStdio(createServer);
