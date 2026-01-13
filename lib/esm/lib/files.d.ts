export declare const getFileExtension: (filename: string) => string;
export declare const getFileType: (filename: string) => string | null;
export declare const getFileNameFromUrl: (urlString: string) => string;
export declare const getBufferFromUrl: (urlString: string) => Promise<any>;
export declare const downloadToTemp: (url: string) => Promise<string>;
