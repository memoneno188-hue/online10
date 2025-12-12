import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateBankDto,
    UpdateBankDto,
    CreateBankAccountDto,
    UpdateBankAccountDto,
    QueryDto,
} from './dto/bank.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BanksService {
    constructor(private prisma: PrismaService) { }

    // ============ BANKS ============

    async createBank(dto: CreateBankDto) {
        const existing = await this.prisma.bank.findUnique({
            where: { name: dto.name },
        });

        if (existing) {
            throw new ConflictException('هذا البنك مُسجَّل مسبقاً');
        }

        return this.prisma.bank.create({
            data: {
                name: dto.name,
            },
        });
    }

    async findAllBanks(query: QueryDto) {
        const { q, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.BankWhereInput = {};

        if (q) {
            where.name = { contains: q, mode: 'insensitive' };
        }

        const [banks, total] = await Promise.all([
            this.prisma.bank.findMany({
                where,
                skip,
                take: limit,
                include: {
                    _count: {
                        select: {
                            accounts: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.bank.count({ where }),
        ]);

        return {
            data: banks,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOneBank(id: string) {
        const bank = await this.prisma.bank.findUnique({
            where: { id },
            include: {
                accounts: true,
            },
        });

        if (!bank) {
            throw new NotFoundException('البنك غير موجود');
        }

        return bank;
    }

    async updateBank(id: string, dto: UpdateBankDto) {
        await this.findOneBank(id);

        return this.prisma.bank.update({
            where: { id },
            data: dto,
        });
    }

    async removeBank(id: string) {
        await this.findOneBank(id);

        // Check if bank has accounts
        const count = await this.prisma.bankAccount.count({
            where: { bankId: id },
        });

        if (count > 0) {
            throw new ConflictException('لا يمكن حذف البنك لوجود حسابات مرتبطة به');
        }

        await this.prisma.bank.delete({
            where: { id },
        });

        return { message: 'تم حذف البنك بنجاح' };
    }

    // ============ BANK ACCOUNTS ============

    async createBankAccount(dto: CreateBankAccountDto) {
        // Check if bank exists
        const bank = await this.prisma.bank.findUnique({
            where: { id: dto.bankId },
        });

        if (!bank) {
            throw new NotFoundException('البنك غير موجود');
        }

        // Check if account number exists
        const existing = await this.prisma.bankAccount.findUnique({
            where: { accountNo: dto.accountNo },
        });

        if (existing) {
            throw new ConflictException('رقم الحساب مُسجَّل مسبقاً');
        }

        const openingBalance = dto.openingBalance || 0;

        return this.prisma.bankAccount.create({
            data: {
                bankId: dto.bankId,
                accountNo: dto.accountNo,
                openingBalance: new Prisma.Decimal(openingBalance),
                currentBalance: new Prisma.Decimal(openingBalance),
            },
            include: {
                bank: true,
            },
        });
    }

    async findAllBankAccounts(query: QueryDto) {
        const { bankId, q, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.BankAccountWhereInput = {};

        if (bankId) where.bankId = bankId;

        if (q) {
            where.accountNo = { contains: q, mode: 'insensitive' };
        }

        const [accounts, total] = await Promise.all([
            this.prisma.bankAccount.findMany({
                where,
                skip,
                take: limit,
                include: {
                    bank: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.bankAccount.count({ where }),
        ]);

        return {
            data: accounts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOneBankAccount(id: string) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id },
            include: {
                bank: true,
            },
        });

        if (!account) {
            throw new NotFoundException('الحساب البنكي غير موجود');
        }

        return account;
    }

    async updateBankAccount(id: string, dto: UpdateBankAccountDto) {
        await this.findOneBankAccount(id);

        return this.prisma.bankAccount.update({
            where: { id },
            data: dto,
            include: {
                bank: true,
            },
        });
    }

    async removeBankAccount(id: string) {
        await this.findOneBankAccount(id);

        // Check if account has transactions
        const count = await this.prisma.voucher.count({
            where: { bankAccountId: id },
        });

        if (count > 0) {
            throw new ConflictException('لا يمكن حذف الحساب لوجود حركات مرتبطة به');
        }

        await this.prisma.bankAccount.delete({
            where: { id },
        });

        return { message: 'تم حذف الحساب البنكي بنجاح' };
    }

    /**
     * Get bank account transactions (vouchers)
     */
    async getAccountTransactions(accountId: string, query: QueryDto) {
        await this.findOneBankAccount(accountId);

        const { from, to, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.VoucherWhereInput = {
            bankAccountId: accountId,
        };

        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        const [vouchers, total] = await Promise.all([
            this.prisma.voucher.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
            }),
            this.prisma.voucher.count({ where }),
        ]);

        return {
            data: vouchers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
