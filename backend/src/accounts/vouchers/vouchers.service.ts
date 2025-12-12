import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../../ledger/ledger.service';
import { CreateVoucherDto, UpdateVoucherDto, QueryVouchersDto } from './dto/voucher.dto';
import { Prisma, VoucherType, PaymentMethod } from '@prisma/client';

@Injectable()
export class VouchersService {
    constructor(
        private prisma: PrismaService,
        private ledger: LedgerService,
    ) { }

    /**
     * Generate voucher code
     */
    private async generateVoucherCode(type: VoucherType, date: Date): Promise<string> {
        const year = date.getFullYear().toString().slice(-2);
        const typePrefix = type === 'RECEIPT' ? 'RC' : 'PY';

        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59);

        const count = await this.prisma.voucher.count({
            where: {
                type,
                date: {
                    gte: startOfYear,
                    lte: endOfYear,
                },
            },
        });

        const sequence = (count + 1).toString().padStart(4, '0');
        return `${typePrefix}-${year}-${sequence}`;
    }

    /**
     * Create voucher (receipt or payment)
     */
    async create(createVoucherDto: CreateVoucherDto, userId: string) {
        const {
            type,
            partyType,
            partyId,
            partyName,
            method,
            bankAccountId,
            referenceNumber,
            amount,
            note,
            date,
            categoryId,
        } = createVoucherDto;

        // Validate party
        if (partyType !== 'OTHER' && !partyId) {
            throw new BadRequestException('يجب تحديد الجهة');
        }

        if (partyType === 'OTHER' && !partyName) {
            throw new BadRequestException('يجب إدخال اسم الجهة');
        }

        // Validate bank account for bank transfers
        if (method === 'BANK_TRANSFER' && !bankAccountId) {
            throw new BadRequestException('يجب اختيار الحساب البنكي للتحويل');
        }

        // Validate category for payment vouchers
        if (type === 'PAYMENT' && !categoryId && partyType === 'OTHER') {
            throw new BadRequestException('يجب تحديد تصنيف المصروف');
        }

        // Check negative balance settings
        if (method === 'CASH') {
            const settings = await this.prisma.appSetting.findUnique({
                where: { id: 'single_row' },
            });

            if (settings?.preventNegativeTreasury && type === 'PAYMENT') {
                const treasury = await this.prisma.treasury.findUnique({
                    where: { id: 'single_row' },
                });

                const currentBalance = treasury?.currentBalance
                    ? parseFloat(treasury.currentBalance.toString())
                    : 0;

                if (currentBalance < amount) {
                    throw new BadRequestException('الرصيد غير كافٍ في الخزنة');
                }
            }
        } else if (method === 'BANK_TRANSFER' && bankAccountId) {
            const settings = await this.prisma.appSetting.findUnique({
                where: { id: 'single_row' },
            });

            if (settings?.preventNegativeBank && type === 'PAYMENT') {
                const account = await this.prisma.bankAccount.findUnique({
                    where: { id: bankAccountId },
                });

                if (!account) {
                    throw new NotFoundException('الحساب البنكي غير موجود');
                }

                const currentBalance = parseFloat(account.currentBalance.toString());
                if (currentBalance < amount) {
                    throw new BadRequestException('الرصيد غير كافٍ في الحساب البنكي');
                }
            }
        }

        // Generate voucher code
        const code = await this.generateVoucherCode(type, new Date(date));

        // Create voucher
        const voucher = await this.prisma.voucher.create({
            data: {
                code,
                type,
                partyType,
                partyId,
                partyName,
                method,
                bankAccountId,
                referenceNumber,
                amount: new Prisma.Decimal(amount),
                note,
                date: new Date(date),
                categoryId,
                createdBy: userId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                bankAccount: true,
                category: true,
            },
        });

        // Update treasury or bank account
        if (method === 'CASH') {
            await this.updateTreasury(type, amount, voucher.id);
        } else if (bankAccountId) {
            await this.updateBankAccount(bankAccountId, type, amount);
        }

        // Create ledger entry
        const debitAccount =
            type === 'RECEIPT'
                ? method === 'CASH'
                    ? 'treasury'
                    : `bank:${bankAccountId}`
                : this.getExpenseAccount(partyType, partyId, categoryId);

        const creditAccount =
            type === 'RECEIPT'
                ? this.getRevenueAccount(partyType, partyId)
                : method === 'CASH'
                    ? 'treasury'
                    : `bank:${bankAccountId}`;

        await this.ledger.createEntry({
            sourceType: 'VOUCHER',
            sourceId: voucher.id,
            debitAccount,
            creditAccount,
            amount,
            description: `${type === 'RECEIPT' ? 'سند قبض' : 'سند صرف'} رقم ${code}`,
        });

        return voucher;
    }

    /**
     * Update treasury balance
     */
    private async updateTreasury(type: VoucherType, amount: number, voucherId: string) {
        const treasury = await this.prisma.treasury.findUnique({
            where: { id: 'single_row' },
        });

        const currentBalance = treasury?.currentBalance
            ? parseFloat(treasury.currentBalance.toString())
            : 0;

        const newBalance =
            type === 'RECEIPT' ? currentBalance + amount : currentBalance - amount;

        await this.prisma.treasury.update({
            where: { id: 'single_row' },
            data: {
                currentBalance: new Prisma.Decimal(newBalance),
            },
        });

        // Create treasury transaction
        await this.prisma.treasuryTransaction.create({
            data: {
                date: new Date(),
                type: type === 'RECEIPT' ? 'IN' : 'OUT',
                amount: new Prisma.Decimal(amount),
                note: `${type === 'RECEIPT' ? 'سند قبض' : 'سند صرف'}`,
                balanceAfter: new Prisma.Decimal(newBalance),
                voucherId,
                createdBy: 'system',
            },
        });
    }

    /**
     * Update bank account balance
     */
    private async updateBankAccount(
        bankAccountId: string,
        type: VoucherType,
        amount: number,
    ) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id: bankAccountId },
        });

        if (!account) {
            throw new NotFoundException('الحساب البنكي غير موجود');
        }

        const currentBalance = parseFloat(account.currentBalance.toString());
        const newBalance =
            type === 'RECEIPT' ? currentBalance + amount : currentBalance - amount;

        await this.prisma.bankAccount.update({
            where: { id: bankAccountId },
            data: {
                currentBalance: new Prisma.Decimal(newBalance),
            },
        });
    }

    /**
     * Get expense account based on party type
     */
    private getExpenseAccount(
        partyType: string,
        partyId?: string,
        categoryId?: string,
    ): string {
        switch (partyType) {
            case 'CUSTOMER':
                return `customer:${partyId}`;
            case 'EMPLOYEE':
                return `employee:${partyId}`;
            case 'AGENT':
                return `agent:${partyId}`;
            case 'OTHER':
                return categoryId ? `expense:${categoryId}` : 'expense:other';
            default:
                return 'expense:other';
        }
    }

    /**
     * Get revenue account based on party type
     */
    private getRevenueAccount(partyType: string, partyId?: string): string {
        switch (partyType) {
            case 'CUSTOMER':
                return `customer:${partyId}`;
            case 'EMPLOYEE':
                return `employee:${partyId}`;
            case 'AGENT':
                return `agent:${partyId}`;
            default:
                return 'revenue:other';
        }
    }

    /**
     * Find all vouchers
     */
    async findAll(query: QueryVouchersDto) {
        const { type, from, to, q, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.VoucherWhereInput = {};

        if (type) where.type = type;

        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        if (q) {
            where.OR = [
                { code: { contains: q, mode: 'insensitive' } },
                { note: { contains: q, mode: 'insensitive' } },
                { partyName: { contains: q, mode: 'insensitive' } },
            ];
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
                    bankAccount: {
                        include: {
                            bank: true,
                        },
                    },
                    category: true,
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

    /**
     * Find one voucher
     */
    async findOne(id: string) {
        const voucher = await this.prisma.voucher.findUnique({
            where: { id },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                bankAccount: {
                    include: {
                        bank: true,
                    },
                },
                category: true,
            },
        });

        if (!voucher) {
            throw new NotFoundException('السند غير موجود');
        }

        return voucher;
    }

    /**
     * Update voucher
     */
    async update(id: string, updateVoucherDto: UpdateVoucherDto) {
        const voucher = await this.findOne(id);

        const updateData: any = {};

        if (updateVoucherDto.partyType !== undefined) updateData.partyType = updateVoucherDto.partyType;
        if (updateVoucherDto.partyId !== undefined) updateData.partyId = updateVoucherDto.partyId;
        if (updateVoucherDto.partyName !== undefined) updateData.partyName = updateVoucherDto.partyName;
        if (updateVoucherDto.method !== undefined) updateData.method = updateVoucherDto.method;
        if (updateVoucherDto.bankAccountId !== undefined) updateData.bankAccountId = updateVoucherDto.bankAccountId;
        if (updateVoucherDto.referenceNumber !== undefined) updateData.referenceNumber = updateVoucherDto.referenceNumber;
        if (updateVoucherDto.amount !== undefined) updateData.amount = new Prisma.Decimal(updateVoucherDto.amount);
        if (updateVoucherDto.categoryId !== undefined) updateData.categoryId = updateVoucherDto.categoryId;
        if (updateVoucherDto.note !== undefined) updateData.note = updateVoucherDto.note;
        if (updateVoucherDto.date !== undefined) updateData.date = new Date(updateVoucherDto.date);

        const updatedVoucher = await this.prisma.voucher.update({
            where: { id },
            data: updateData,
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                bankAccount: true,
                category: true,
            },
        });

        return updatedVoucher;
    }

    /**
     * Delete voucher
     */
    async remove(id: string) {
        const voucher = await this.findOne(id);

        // Reverse the treasury/bank update
        if (voucher.method === 'CASH') {
            const treasury = await this.prisma.treasury.findUnique({
                where: { id: 'single_row' },
            });

            const currentBalance = treasury?.currentBalance
                ? parseFloat(treasury.currentBalance.toString())
                : 0;

            const amount = parseFloat(voucher.amount.toString());
            const newBalance =
                voucher.type === 'RECEIPT'
                    ? currentBalance - amount
                    : currentBalance + amount;

            await this.prisma.treasury.update({
                where: { id: 'single_row' },
                data: {
                    currentBalance: new Prisma.Decimal(newBalance),
                },
            });
        } else if (voucher.bankAccountId) {
            const account = await this.prisma.bankAccount.findUnique({
                where: { id: voucher.bankAccountId },
            });

            if (account) {
                const currentBalance = parseFloat(account.currentBalance.toString());
                const amount = parseFloat(voucher.amount.toString());
                const newBalance =
                    voucher.type === 'RECEIPT'
                        ? currentBalance - amount
                        : currentBalance + amount;

                await this.prisma.bankAccount.update({
                    where: { id: voucher.bankAccountId },
                    data: {
                        currentBalance: new Prisma.Decimal(newBalance),
                    },
                });
            }
        }

        await this.prisma.voucher.delete({
            where: { id },
        });

        return { message: 'تم حذف السند بنجاح' };
    }
}
