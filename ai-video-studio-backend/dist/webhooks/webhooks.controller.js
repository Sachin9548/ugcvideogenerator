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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const svix_1 = require("svix");
const prisma_service_1 = require("../prisma/prisma.service");
let WebhooksController = class WebhooksController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleClerkWebhook(req, res, svixId, svixTimestamp, svixSignature) {
        console.log("📥 Webhook request received!");
        const secret = process.env.CLERK_WEBHOOK_SECRET;
        if (!secret) {
            console.error('❌ ERROR: CLERK_WEBHOOK_SECRET .env file mein nahi mili!');
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false });
        }
        const payload = req.rawBody?.toString('utf8');
        if (!payload) {
            console.error('❌ ERROR: req.rawBody missing hai. (main.ts mein rawBody: true check karein)');
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ success: false });
        }
        const headers = {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        };
        let evt;
        try {
            const wh = new svix_1.Webhook(secret);
            evt = wh.verify(payload, headers);
        }
        catch (err) {
            console.error('❌ Webhook Verification Failed:', err.message);
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ success: false });
        }
        if (evt.type === 'user.created') {
            const { id, email_addresses } = evt.data;
            const email = email_addresses[0].email_address;
            try {
                await this.prisma.user.create({
                    data: {
                        clerkId: id,
                        email: email,
                        credits: 0,
                    },
                });
                console.log(`✅ SUCCESS: Naya User DB mein save ho gaya: ${email}`);
            }
            catch (error) {
                console.error('⚠️ DB Save Error:', error.message);
            }
        }
        return res.status(common_1.HttpStatus.OK).json({ success: true });
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('clerk'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Headers)('svix-id')),
    __param(3, (0, common_1.Headers)('svix-timestamp')),
    __param(4, (0, common_1.Headers)('svix-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleClerkWebhook", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map