import * as https from 'https'
import * as http from 'http'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { URL } from 'url'

export const getFileExtension = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.')

    if (lastDotIndex === -1 || lastDotIndex === 0) {
        return ''
    }

    return filename.substring(lastDotIndex + 1).toLowerCase()
}

export const getFileType = (filename: string): string | null => {
    const types = {
        photo: ['jpeg', 'jpg', 'bmp', 'gif', 'png', 'webp', 'wbmp', 'heic'],
        video: ['mpg', 'mp4', 'avi', 'mov', 'mkv', 'flv', 'webm'],
        audio: ['m4a', 'mp3', 'wav', 'wma', 'ogg', 'aac'],
        document: ['txt', 'doc', 'docx', 'xls', 'xlsx', 'pdf', 'tiff'],
    }

    // Извлекаем расширение файла
    const extension = getFileExtension(filename)

    if (!extension) {
        return null;
    }

    for (const type in types) {
        // @ts-ignore
        if (types[type].includes(extension.toLowerCase())) {
            return type
        }
    }

    return null
}

export const getFileNameFromUrl= (urlString: string): string => {
    try {
        const url = new URL(urlString)
        const pathname = url.pathname

        if (pathname) {
            const basename = path.basename(pathname)
            const cleanName = basename.split('?')[0].split('#')[0]
            if (cleanName && cleanName.includes('.') && cleanName.length > 1) {
                return cleanName
            }
        }

        const timestamp = Date.now()
        const extension = getFileExtension(urlString) || 'bin'
        return `downloaded-${timestamp}.${extension}`
    } catch {
        return `file-${Date.now()}.bin`
    }
}

export const getBufferFromUrl = async (urlString: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const url = new URL(urlString)
        const protocol = url.protocol === 'https:' ? https : http

        protocol
            .get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to get file: ${response.statusCode}`))
                    return
                }

                const chunks: Buffer[] = []
                response.on('data', (chunk: Buffer) => {
                    chunks.push(chunk)
                })

                response.on('end', () => {
                    const buffer = Buffer.concat(chunks)

                    resolve(buffer)
                })

                response.on('error', reject)
            })
            .on('error', reject)
    })
}

export const downloadToTemp = async (url: string): Promise<string> => {
    const ext = getFileExtension(url) || 'bin'
    const tempFile = path.join(os.tmpdir(), `maxbot-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`)
    const buffer = await getBufferFromUrl(url)

    await fs.promises.writeFile(tempFile, buffer)

    return tempFile
}