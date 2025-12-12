import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetOpeningBalanceDto, QueryTransactionsDto } from './dto/treasury.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TreasuryService {
    constructor(private prisma: PrismaService) { }

    /**
     * Set opening balance (once only)
     */
    async setOpeningBalance(dto: SetOpeningBalanceDto, userId: string) {
        const treasury = await this.prisma.treasury.findUnique({
            where: { id: 'single_row' },
        });

        if (treasury?.openingSetAt) {
            throw new ForbiddenException('تم تعيين الرصيد الافتتاحي مسبقاً');
        }

        const updated = await this.prisma.treasury.update({
            where: { id: 'single_row' },
            data: {
                openingBalance: new Prisma.Decimal(dto.openingBalance),
                currentBalance: new Prisma.Decimal(dto.openingBalance),
                openingSetAt: new Date(),
                openingSetBy: userId,
            },
        });

        return updated;
    }

    /**
     * Get treasury balance
     */
    async getBalance() {
        const treasury = await this.prisma.treasury.findUnique({
            where: { id: 'single_row' },
        });

        if (!treasury) {
            throw new BadRequestException('الخزنة غير موجودة');
        }

        // Get settings for preventNegativeTreasury
        const settings = await this.prisma.appSetting.findUnique({
            where: { id: 'single_row' },
        });

        return {
            currentBalance: treasury.currentBalance
                ? parseFloat(treasury.currentBalance.toString())
                : 0,
            openingBalance: treasury.openingBalance
                ? parseFloat(treasury.openingBalance.toString())
                : null,
            openingSetAt: treasury.openingSetAt,
            openingSetBy: treasury.openingSetBy,
            preventNegativeTreasury: settings?.preventNegativeTreasury ?? false,
        };
    }

    /**
     * Get treasury transactions
     */
    async getTransactions(query: QueryTransactionsDto) {
        const { from, to, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TreasuryTransactionWhereInput = {};

        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        const [transactions, total] = await Promise.all([
            this.prisma.treasuryTransaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
                include: {
                    voucher: {
                        select: {
                            code: true,
                        },
                    },
                },
            }),
            this.prisma.treasuryTransaction.count({ where }),
        ]);

        return {
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get treasury report
     */
    async getReport(from?: string, to?: string) {
        const where: Prisma.TreasuryTransactionWhereInput = {};

        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        const [transactions, totals] = await Promise.all([
            this.prisma.treasuryTransaction.findMany({
                where,
                orderBy: { date: 'asc' },
            }),
            this.prisma.treasuryTransaction.groupBy({
                by: ['type'],
                where,
                _sum: {
                    amount: true,
                },
            }),
        ]);

        const totalIn = totals.find((t) => t.type === 'IN')?._sum.amount || 0;
        const totalOut = totals.find((t) => t.type === 'OUT')?._sum.amount || 0;

        return {
            transactions,
            summary: {
                totalIn: parseFloat(totalIn.toString()),
                totalOut: parseFloat(totalOut.toString()),
                net: parseFloat(totalIn.toString()) - parseFloat(totalOut.toString()),
            },
        };
    }

    /**
     * Update treasury settings
     */
    async updateSettings(preventNegativeTreasury: boolean) {
        const settings = await this.prisma.appSetting.findUnique({
            where: { id: 'single_row' },
        });

        if (!settings) {
            throw new BadRequestException('الإعدادات غير موجودة');
        }

        const updated = await this.prisma.appSetting.update({
            where: { id: 'single_row' },
            data: {
                preventNegativeTreasury,
            },
        });

        return updated;
    }
}
