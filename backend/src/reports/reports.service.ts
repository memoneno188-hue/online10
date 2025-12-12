import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Treasury Report
     */
    async getTreasuryReport(from?: string, to?: string) {
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
                _sum: { amount: true },
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
     * Customer Statement
     */
    async getCustomerStatement(customerId: string, from?: string, to?: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer) {
            throw new Error('العميل غير موجود');
        }

        // Get invoices
        const invoiceWhere: Prisma.InvoiceWhereInput = {
            customerId,
        };

        if (from || to) {
            invoiceWhere.date = {};
            if (from) invoiceWhere.date.gte = new Date(from);
            if (to) invoiceWhere.date.lte = new Date(to);
        }

        const invoices = await this.prisma.invoice.findMany({
            where: invoiceWhere,
            orderBy: { date: 'asc' },
        });

        // Get vouchers (receipts from customer)
        const voucherWhere: Prisma.VoucherWhereInput = {
            partyType: 'CUSTOMER',
            partyId: customerId,
        };

        if (from || to) {
            voucherWhere.date = {};
            if (from) voucherWhere.date.gte = new Date(from);
            if (to) voucherWhere.date.lte = new Date(to);
        }

        const vouchers = await this.prisma.voucher.findMany({
            where: voucherWhere,
            orderBy: { date: 'asc' },
        });

        const totalInvoices = invoices.reduce(
            (sum, inv) => sum + parseFloat(inv.total.toString()),
            0,
        );
        const totalPayments = vouchers.reduce(
            (sum, v) => sum + parseFloat(v.amount.toString()),
            0,
        );

        return {
            customer,
            invoices,
            vouchers,
            summary: {
                totalInvoices,
                totalPayments,
                balance: totalInvoices - totalPayments,
            },
        };
    }

    /**
     * Income/Expense Report
     */
    async getIncomeExpenseReport(from?: string, to?: string) {
        const where: Prisma.LedgerEntryWhereInput = {};

        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }

        const entries = await this.prisma.ledgerEntry.findMany({
            where,
            orderBy: { createdAt: 'asc' },
        });

        // Categorize by account type
        const income = entries
            .filter((e) => e.creditAccount.startsWith('revenue:'))
            .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

        const expenses = entries
            .filter((e) => e.debitAccount.startsWith('expense:'))
            .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

        return {
            entries,
            summary: {
                totalIncome: income,
                totalExpenses: expenses,
                netProfit: income - expenses,
            },
        };
    }

    /**
     * Agent Statement
     */
    async getAgentStatement(agentId: string, from?: string, to?: string) {
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            include: { vessels: true },
        });

        if (!agent) {
            throw new Error('الوكيل غير موجود');
        }

        const tripWhere: Prisma.TripWhereInput = { agentId };
        const feeWhere: Prisma.AdditionalFeeWhereInput = { agentId };

        if (from || to) {
            const dateFilter: any = {};
            if (from) dateFilter.gte = new Date(from);
            if (to) dateFilter.lte = new Date(to);
            tripWhere.date = dateFilter;
            feeWhere.date = dateFilter;
        }

        const [trips, fees, vouchers] = await Promise.all([
            this.prisma.trip.findMany({
                where: tripWhere,
                include: { vessel: true },
                orderBy: { date: 'asc' },
            }),
            this.prisma.additionalFee.findMany({
                where: feeWhere,
                include: { vessel: true },
                orderBy: { date: 'asc' },
            }),
            // Get payment vouchers for agent
            this.prisma.voucher.findMany({
                where: {
                    partyType: 'AGENT',
                    partyId: agentId,
                    type: 'PAYMENT',
                    ...(from || to ? {
                        date: {
                            ...(from ? { gte: new Date(from) } : {}),
                            ...(to ? { lte: new Date(to) } : {}),
                        }
                    } : {}),
                },
                orderBy: { date: 'asc' },
            }),
        ]);

        const totalTrips = trips.reduce(
            (sum, t) => sum + parseFloat(t.totalAmount.toString()),
            0,
        );
        const totalFees = fees.reduce(
            (sum, f) => sum + parseFloat(f.amount.toString()),
            0,
        );
        const totalVouchers = vouchers.reduce(
            (sum, v) => sum + parseFloat(v.amount.toString()),
            0,
        );

        return {
            agent,
            trips: trips.map(t => ({
                ...t,
                vesselName: t.vessel?.name || '-',
            })),
            fees: fees.map(f => ({
                ...f,
                vesselName: f.vessel?.name || '-',
            })),
            vouchers: vouchers.map(v => ({
                id: v.id,
                date: v.date,
                amount: parseFloat(v.amount.toString()),
                notes: v.note,
            })),
            summary: {
                totalTrips,
                totalFees,
                grandTotal: totalTrips + totalFees,
                totalVouchers,
                balance: (totalTrips + totalFees) - totalVouchers,
            },
        };
    }

    /**
     * Bank Account Report
     */
    async getBankReport(accountId: string, from?: string, to?: string) {
        const account = await this.prisma.bankAccount.findUnique({
            where: { id: accountId },
            include: { bank: true },
        });

        if (!account) {
            throw new Error('الحساب البنكي غير موجود');
        }

        // Calculate opening balance
        let openingBalance = parseFloat(account.openingBalance.toString());

        if (from) {
            // Get all vouchers before the start date
            const vouchersBefore = await this.prisma.voucher.findMany({
                where: {
                    bankAccountId: accountId,
                    date: { lt: new Date(from) },
                },
            });

            vouchersBefore.forEach((v) => {
                if (v.type === 'RECEIPT') {
                    openingBalance += parseFloat(v.amount.toString());
                } else {
                    openingBalance -= parseFloat(v.amount.toString());
                }
            });
        }

        // Get vouchers in the date range
        const voucherWhere: Prisma.VoucherWhereInput = {
            bankAccountId: accountId,
        };

        if (from || to) {
            voucherWhere.date = {};
            if (from) voucherWhere.date.gte = new Date(from);
            if (to) voucherWhere.date.lte = new Date(to);
        }

        const vouchers = await this.prisma.voucher.findMany({
            where: voucherWhere,
            orderBy: { date: 'asc' },
        });

        const transactions = vouchers.map((v) => ({
            id: v.id,
            type: v.type.toLowerCase(),
            amount: parseFloat(v.amount.toString()),
            note: v.note,
            date: v.date,
            code: v.code,
            partyName: v.partyName,
        }));

        return {
            account,
            openingBalance,
            transactions,
        };
    }

    /**
     * Income Statement
     */
    async getIncomeStatement(from?: string, to?: string) {
        // Default to current month if no dates provided
        const now = new Date();
        const startDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Calculate previous period (same length)
        const periodLength = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - periodLength);
        const prevEndDate = new Date(startDate.getTime() - 1);

        // Get current period data
        const currentData = await this.calculatePeriodData(startDate, endDate);

        // Get previous period data for comparison
        const previousData = await this.calculatePeriodData(prevStartDate, prevEndDate);

        return {
            period: {
                from: startDate,
                to: endDate,
            },
            current: currentData,
            previous: previousData,
            comparison: {
                revenueChange: this.calculatePercentageChange(previousData.totalRevenue, currentData.totalRevenue),
                expensesChange: this.calculatePercentageChange(previousData.totalExpenses, currentData.totalExpenses),
                netIncomeChange: this.calculatePercentageChange(previousData.netIncome, currentData.netIncome),
            },
        };
    }

    private async calculatePeriodData(startDate: Date, endDate: Date) {
        // Load income statement settings
        let settings = await this.prisma.incomeStatementSettings.findUnique({
            where: { id: 'single_row' },
        });

        // If no settings exist, create default (all templates and categories)
        if (!settings) {
            const templates = await this.prisma.invoiceItemTemplate.findMany({
                where: { isActive: true },
                select: { id: true },
            });
            const categories = await this.prisma.expenseCategory.findMany({
                select: { id: true },
            });

            settings = await this.prisma.incomeStatementSettings.create({
                data: {
                    id: 'single_row',
                    revenueItemTemplateIds: templates.map(t => t.id),
                    expenseCategoryIds: categories.map(c => c.id),
                },
            });
        }

        // Get selected template descriptions for revenue filtering
        const selectedTemplates = await this.prisma.invoiceItemTemplate.findMany({
            where: {
                id: { in: settings.revenueItemTemplateIds },
                isActive: true,
            },
            select: { description: true },
        });

        const selectedDescriptions = selectedTemplates.map(t => t.description);

        // Calculate revenue from SELECTED invoice items grouped by description
        const invoiceItems = await this.prisma.invoiceItem.findMany({
            where: {
                invoice: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                description: {
                    in: selectedDescriptions,
                },
            },
        });

        // Group revenue by description
        const revenueByDescription: { [key: string]: number } = {};
        let totalRevenue = 0;

        invoiceItems.forEach((item) => {
            const amount = parseFloat(item.amount.toString());
            const description = item.description;

            if (!revenueByDescription[description]) {
                revenueByDescription[description] = 0;
            }
            revenueByDescription[description] += amount;
            totalRevenue += amount;
        });

        const revenueArray = Object.entries(revenueByDescription).map(([description, amount]) => ({
            description,
            amount,
            percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
        }));

        // Calculate expenses from SELECTED categories only
        const vouchers = await this.prisma.voucher.findMany({
            where: {
                type: 'PAYMENT',
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                categoryId: {
                    in: settings.expenseCategoryIds,
                },
            },
            include: {
                category: true,
            },
        });

        const expensesByCategory: { [key: string]: number } = {};
        let totalExpenses = 0;

        vouchers.forEach((v) => {
            const amount = parseFloat(v.amount.toString());
            const categoryName = v.category?.name || 'غير مصنف';

            if (!expensesByCategory[categoryName]) {
                expensesByCategory[categoryName] = 0;
            }
            expensesByCategory[categoryName] += amount;
            totalExpenses += amount;
        });

        const expensesArray = Object.entries(expensesByCategory).map(([name, amount]) => ({
            category: name,
            amount,
            percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        }));

        return {
            revenue: revenueArray,
            totalRevenue,
            expenses: expensesArray,
            totalExpenses,
            netIncome: totalRevenue - totalExpenses,
        };
    }

    private calculatePercentageChange(oldValue: number, newValue: number): number {
        if (oldValue === 0) return newValue > 0 ? 100 : 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }

    /**
     * General Journal Report
     */
    async getGeneralJournal(from?: string, to?: string) {
        const where: Prisma.LedgerEntryWhereInput = {};

        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }

        const entries = await this.prisma.ledgerEntry.findMany({
            where,
            orderBy: [
                { createdAt: 'asc' },
                { id: 'asc' }
            ],
        });

        const totalDebits = entries.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
        const totalCredits = totalDebits; // In double-entry, debits always equal credits

        // Translate account names asynchronously
        const translatedEntries = await Promise.all(
            entries.map(async (entry) => ({
                id: entry.id,
                date: entry.createdAt,
                description: entry.description || 'قيد محاسبي',
                debitAccount: await this.translateAccountName(entry.debitAccount),
                creditAccount: await this.translateAccountName(entry.creditAccount),
                amount: parseFloat(entry.amount.toString()),
                reference: entry.sourceId || '-',
                type: entry.sourceType || 'MANUAL',
            }))
        );

        return {
            period: {
                from: from ? new Date(from) : null,
                to: to ? new Date(to) : null,
            },
            entries: translatedEntries,
            summary: {
                totalDebits,
                totalCredits,
                entryCount: entries.length,
            },
        };
    }

    /**
     * Trial Balance Report
     */
    async getTrialBalance(asOf?: string) {
        const where: Prisma.LedgerEntryWhereInput = {};

        if (asOf) {
            where.createdAt = { lte: new Date(asOf) };
        }

        const entries = await this.prisma.ledgerEntry.findMany({
            where,
        });

        // Group by account
        const accountBalances: { [key: string]: { debit: number; credit: number } } = {};

        entries.forEach(entry => {
            const amount = parseFloat(entry.amount.toString());

            // Debit account
            if (!accountBalances[entry.debitAccount]) {
                accountBalances[entry.debitAccount] = { debit: 0, credit: 0 };
            }
            accountBalances[entry.debitAccount].debit += amount;

            // Credit account
            if (!accountBalances[entry.creditAccount]) {
                accountBalances[entry.creditAccount] = { debit: 0, credit: 0 };
            }
            accountBalances[entry.creditAccount].credit += amount;
        });

        // Convert to array and calculate balances with async translation
        const accounts = await Promise.all(
            Object.entries(accountBalances).map(async ([accountCode, balances]) => {
                const balance = balances.debit - balances.credit;
                return {
                    accountCode,
                    accountName: await this.translateAccountName(accountCode),
                    debit: balances.debit,
                    credit: balances.credit,
                    balance: Math.abs(balance),
                    balanceType: balance >= 0 ? 'debit' : 'credit',
                };
            })
        );

        // Sort by account code
        accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

        // Calculate totals
        const totalDebits = accounts.reduce((sum, acc) => sum + acc.debit, 0);
        const totalCredits = accounts.reduce((sum, acc) => sum + acc.credit, 0);
        const difference = Math.abs(totalDebits - totalCredits);

        return {
            asOfDate: asOf ? new Date(asOf) : new Date(),
            accounts,
            totals: {
                totalDebits,
                totalCredits,
                isBalanced: difference < 0.01, // Allow for floating point errors
                difference,
            },
        };
    }

    /**
     * Customs Report
     */
    async getCustomsReport(from?: string, to?: string, types?: string[]) {
        const where: Prisma.InvoiceWhereInput = {};

        // Date filter
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        // Type filter
        if (types && types.length > 0) {
            where.type = { in: types as any };
        }

        const invoices = await this.prisma.invoice.findMany({
            where,
            include: {
                customer: {
                    select: { name: true },
                },
            },
            orderBy: { date: 'asc' },
        });

        const totalAmount = invoices.reduce(
            (sum, inv) => sum + parseFloat(inv.total.toString()),
            0,
        );

        return {
            period: {
                from: from ? new Date(from) : null,
                to: to ? new Date(to) : null,
            },
            filters: {
                types: types || ['IMPORT', 'EXPORT', 'TRANSIT', 'FREE'],
            },
            invoices: invoices.map(invoice => ({
                id: invoice.id,
                date: invoice.date,
                customerName: invoice.customer.name,
                declarationNo: invoice.customsNo || '-',
                type: invoice.type,
                total: parseFloat(invoice.total.toString()),
            })),
            summary: {
                totalCount: invoices.length,
                totalAmount,
            },
        };
    }

    /**
     * Translate account codes to Arabic names
     */
    private async translateAccountName(accountCode: string): Promise<string> {
        // Handle static translations first
        const staticTranslations: { [key: string]: string } = {
            'cash': 'النقدية',
            'treasury': 'الخزنة',
            'bank': 'البنك',
            'accounts_receivable': 'العملاء (المدينون)',
            'accounts_payable': 'الموردون (الدائنون)',
            'revenue': 'الإيرادات',
            'revenue:customs': 'إيرادات التخليص الجمركي',
            'revenue:services': 'إيرادات الخدمات',
            'revenue:import': 'إيرادات الاستيراد',
            'revenue:export': 'إيرادات التصدير',
            'revenue:transit': 'إيرادات الترانزيت',
            'revenue:free': 'إيرادات حرة',
            'expense': 'المصروفات',
            'expense:salaries': 'مصروف الرواتب',
            'expense:rent': 'مصروف الإيجار',
            'expense:utilities': 'مصروف المرافق',
            'expense:maintenance': 'مصروف الصيانة',
            'expense:shipping': 'مصروف الشحن',
            'expense:agent_fees': 'عمولات الوكلاء',
            'assets': 'الأصول',
            'liabilities': 'الخصوم',
            'equity': 'حقوق الملكية',
        };

        if (staticTranslations[accountCode]) {
            return staticTranslations[accountCode];
        }

        // Handle dynamic account codes with IDs
        if (accountCode.startsWith('customer:')) {
            const customerId = accountCode.split(':')[1];
            const customer = await this.prisma.customer.findUnique({
                where: { id: customerId },
                select: { name: true },
            });
            return customer ? `العميل: ${customer.name}` : 'عميل';
        }

        if (accountCode.startsWith('bank:')) {
            const bankAccountId = accountCode.split(':')[1];
            const bankAccount = await this.prisma.bankAccount.findUnique({
                where: { id: bankAccountId },
                select: { accountNo: true, bank: { select: { name: true } } },
            });
            return bankAccount ? `بنك: ${bankAccount.bank.name} - ${bankAccount.accountNo}` : 'بنك';
        }

        if (accountCode.startsWith('agent:')) {
            const agentId = accountCode.split(':')[1];
            const agent = await this.prisma.agent.findUnique({
                where: { id: agentId },
                select: { name: true },
            });
            return agent ? `الوكيل: ${agent.name}` : 'وكيل';
        }

        if (accountCode.startsWith('expense:') && accountCode.includes('-')) {
            // This is an expense category ID (UUID format)
            const categoryId = accountCode.split(':')[1];
            const category = await this.prisma.expenseCategory.findUnique({
                where: { id: categoryId },
                select: { name: true },
            });
            return category ? `مصروف: ${category.name}` : 'مصروف';
        }

        // Return as-is if no translation found
        return accountCode;
    }
}
