"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadToTemp = exports.getBufferFromUrl = exports.getFileNameFromUrl = exports.getFileType = exports.getFileExtension = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const url_1 = require("url");
const getFileExtension = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
        return '';
    }
    return filename.substring(lastDotIndex + 1).toLowerCase();
};
exports.getFileExtension = getFileExtension;
const getFileType = (filename) => {
    const types = {
        photo: ['jpeg', 'jpg', 'bmp', 'gif', 'png', 'webp', 'wbmp', 'heic'],
        video: ['mpg', 'mp4', 'avi', 'mov', 'mkv', 'flv', 'webm'],
        audio: ['m4a', 'mp3', 'wav', 'wma', 'ogg', 'aac'],
        document: ['txt', 'doc', 'docx', 'xls', 'xlsx', 'pdf', 'tiff'],
    };
    // Извлекаем расширение файла
    const extension = (0, exports.getFileExtension)(filename);
    if (!extension) {
        return null;
    }
    for (const type in types) {
        // @ts-ignore
        if (types[type].includes(extension.toLowerCase())) {
            return type;
        }
    }
    return null;
};
exports.getFileType = getFileType;
const getFileNameFromUrl = (urlString) => {
    try {
        const url = new url_1.URL(urlString);
        const pathname = url.pathname;
        if (pathname) {
            const basename = path.basename(pathname);
            const cleanName = basename.split('?')[0].split('#')[0];
            if (cleanName && cleanName.includes('.') && cleanName.length > 1) {
                return cleanName;
            }
        }
        const timestamp = Date.now();
        const extension = (0, exports.getFileExtension)(urlString) || 'bin';
        return `downloaded-${timestamp}.${extension}`;
    }
    catch {
        return `file-${Date.now()}.bin`;
    }
};
exports.getFileNameFromUrl = getFileNameFromUrl;
const getBufferFromUrl = async (urlString) => {
    return new Promise((resolve, reject) => {
        const url = new url_1.URL(urlString);
        const protocol = url.protocol === 'https:' ? https : http;
        protocol
            .get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get file: ${response.statusCode}`));
                return;
            }
            const chunks = [];
            response.on('data', (chunk) => {
                chunks.push(chunk);
            });
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });
            response.on('error', reject);
        })
            .on('error', reject);
    });
};
exports.getBufferFromUrl = getBufferFromUrl;
const downloadToTemp = async (url) => {
    const ext = (0, exports.getFileExtension)(url) || 'bin';
    const tempFile = path.join(os.tmpdir(), `maxbot-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`);
    const buffer = await (0, exports.getBufferFromUrl)(url);
    await fs.promises.writeFile(tempFile, buffer);
    return tempFile;
};
exports.downloadToTemp = downloadToTemp;
