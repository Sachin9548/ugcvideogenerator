export declare class StorageService {
    private s3Client;
    private bucketName;
    constructor();
    uploadFile(file: any, folder?: string): Promise<string>;
}
