"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
let StorageService = class StorageService {
    s3Client;
    bucketName = process.env.AWS_S3_BUCKET_NAME;
    constructor() {
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
        });
    }
    async uploadFile(file, folder = 'uploads') {
        try {
            const uniqueFileName = `${folder}/${(0, uuid_1.v4)()}-${file.originalname.replace(/\s+/g, '-')}`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: uniqueFileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            });
            await this.s3Client.send(command);
            const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
            console.log(`☁️ File uploaded to S3: ${fileUrl}`);
            return fileUrl;
        }
        catch (error) {
            console.error('❌ S3 Upload Error:', error);
            throw new Error('Failed to upload file to AWS S3');
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map