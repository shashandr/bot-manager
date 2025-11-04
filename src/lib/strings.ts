export const dashToCamelCase = (str: string): string => {
    return str.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase())
}

export const ucfirst = (str: string): string => {
    if (!str) return str

    return str.charAt(0).toUpperCase() + str.slice(1)
}

export const stripTags = (str: string, allowed: string[] = []): string => {
    const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*\/?>(?<!<\/>)/gi
    const commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi

    return str
        .split('&nbsp;')
        .join(' ')
        .replace(commentsAndPhpTags, '')
        .replace(tags, (match: string, tag: string) =>
            allowed.includes(tag.toLowerCase()) ? match : ''
        )
}

export const pregMatchAll = (regex: string | RegExp, str: string): string[][] => {
    const source = typeof regex === 'string' ? regex : regex.source
    const flags =
        typeof regex === 'string'
            ? 'g'
            : regex.flags.includes('g')
              ? regex.flags
              : regex.flags + 'g'
    const re = new RegExp(source, flags)

    return [...str.matchAll(re)].reduce<string[][]>((acc, group: RegExpMatchArray) => {
        group
            .filter((element) => typeof element === 'string')
            .forEach((element, i) => {
                if (!acc[i]) acc[i] = []

                acc[i].push(element as string)
            })

        return acc
    }, [])
}

/**
 * Определяет тип файла (изображение или документ) по имени файла или пути
 */
export const getFileType = (
    file: string | { source?: string; filename?: string } | any
): 'image' | 'document' => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg']
    const imageMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/tiff',
        'image/svg+xml',
    ]

    let fileName: string | undefined
    let mimeType: string | undefined

    if (typeof file === 'string') {
        fileName = file
    } else if (file && typeof file === 'object') {
        fileName =
            file.filename ||
            file.name ||
            (typeof file.source === 'string' ? file.source : undefined)
        mimeType = file.mimeType || file.mime || file.type
    }

    // Проверка по MIME-типу
    if (mimeType) {
        const lowerMimeType = mimeType.toLowerCase()
        if (imageMimeTypes.some((type) => lowerMimeType.startsWith(type))) {
            return 'image'
        }
    }

    // Проверка по расширению файла
    if (fileName) {
        const lowerFileName = fileName.toLowerCase()
        const extension = lowerFileName.includes('.') ? '.' + lowerFileName.split('.').pop() : ''

        if (imageExtensions.includes(extension)) {
            return 'image'
        }
    }

    // По умолчанию считаем документом
    return 'document'
}
