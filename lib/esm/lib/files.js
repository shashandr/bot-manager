export const getFileExtension = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === 0) {
        return '';
    }
    return filename.substring(lastDotIndex + 1).toLowerCase();
};
export const getFileType = (filename) => {
    const types = {
        photo: ['jpeg', 'jpg', 'bmp', 'gif', 'png', 'webp', 'wbmp', 'heic'],
        video: ['mpg', 'mp4', 'avi', 'mov', 'mkv', 'flv', 'webm'],
        audio: ['m4a', 'mp3', 'wav', 'wma', 'ogg', 'aac'],
        document: ['txt', 'doc', 'docx', 'xls', 'xlsx', 'pdf', 'tiff'],
    };
    // Извлекаем расширение файла
    const extension = getFileExtension(filename);
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
