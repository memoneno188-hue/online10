import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
    CreateEmployeeDto,
    UpdateEmployeeDto,
    QueryEmployeesDto,
} from './dto/employee.dto';
import {
    CreatePayrollRunDto,
    UpdatePayrollRunDto,
    ApprovePayrollRunDto,
    QueryPayrollRunsDto,
} from './dto/payroll-run.dto';

@Injectable()
export class PayrollService {
    constructor(private prisma: PrismaService) { }

    // ============ EMPLOYEES ============

    async createEmployee(dto: CreateEmployeeDto) {
        // Check for duplicate name
        const existing = await this.prisma.employee.findFirst({
            where: {
                name: dto.name,
                deletedAt: null,
            },
        });

        if (existing) {
            throw new BadRequestException('يوجد موظف بنفس الاسم بالفعل');
        }

        return this.prisma.employee.create({
            data: {
                name: dto.name,
                department: dto.department,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                baseSalary: new Prisma.Decimal(dto.baseSalary),
                allowances: dto.allowances ? new Prisma.Decimal(dto.allowances) : new Prisma.Decimal(0),
                status: dto.status || 'ACTIVE',
            },
        });
    }

    async findAllEmployees(query: QueryEmployeesDto) {
        const { q, status, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.EmployeeWhereInput = {
            deletedAt: null,
        };

        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { department: { contains: q, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status;
        }

        const [employees, total] = await Promise.all([
            this.prisma.employee.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.employee.count({ where }),
        ]);

        return {
            data: employees,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOneEmployee(id: string) {
        const employee = await this.prisma.employee.findUnique({
            where: { id },
        });

        if (!employee || employee.deletedAt) {
            throw new NotFoundException('الموظف غير موجود');
        }

        return employee;
    }

    async updateEmployee(id: string, dto: UpdateEmployeeDto) {
        await this.findOneEmployee(id);

        // Check for duplicate name (excluding current employee)
        if (dto.name) {
            const existing = await this.prisma.employee.findFirst({
                where: {
                    name: dto.name,
                    deletedAt: null,
                    NOT: { id },
                },
            });

            if (existing) {
                throw new BadRequestException('يوجد موظف بنفس الاسم بالفعل');
            }
        }

        return this.prisma.employee.update({
            where: { id },
            data: {
                name: dto.name,
                department: dto.department,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                baseSalary: dto.baseSalary ? new Prisma.Decimal(dto.baseSalary) : undefined,
                allowances: dto.allowances !== undefined ? new Prisma.Decimal(dto.allowances) : undefined,
                status: dto.status,
            },
        });
    }

    async removeEmployee(id: string) {
        await this.findOneEmployee(id);

        await this.prisma.employee.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return { message: 'تم حذف الموظف بنجاح' };
    }

    // ============ PAYROLL RUNS ============

    async createPayrollRun(dto: CreatePayrollRunDto) {
        // Check if payroll run already exists for this month
        const monthDate = new Date(dto.month);
        const existingRun = await this.prisma.payrollRun.findFirst({
            where: {
                month: monthDate,
            },
        });

        if (existingRun) {
            throw new ConflictException('يوجد كشف رواتب لهذا الشهر بالفعل');
        }

        // If items not provided, auto-generate from active employees
        let itemsData = dto.items;

        if (!itemsData || itemsData.length === 0) {
            const activeEmployees = await this.prisma.employee.findMany({
                where: {
                    status: 'ACTIVE',
                    deletedAt: null,
                },
            });

            if (activeEmployees.length === 0) {
                throw new BadRequestException('لا يوجد موظفين نشطين لإنشاء كشف الرواتب');
            }

            itemsData = activeEmployees.map(emp => ({
                employeeId: emp.id,
                base: parseFloat(emp.baseSalary.toString()),
                allowances: parseFloat(emp.allowances.toString()),
                deductions: 0,
            }));
        }

        // Calculate total net
        let totalNet = 0;
        const items = itemsData.map((item) => {
            const net = item.base + item.allowances - item.deductions;
            totalNet += net;
            return {
                employeeId: item.employeeId,
                base: new Prisma.Decimal(item.base),
                allowances: new Prisma.Decimal(item.allowances),
                deductions: new Prisma.Decimal(item.deductions),
                net: new Prisma.Decimal(net),
            };
        });

        return this.prisma.payrollRun.create({
            data: {
                month: monthDate,
                status: 'DRAFT',
                totalNet: new Prisma.Decimal(totalNet),
                items: {
                    create: items,
                },
            },
            include: {
                items: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
    }

    async findAllPayrollRuns(query: QueryPayrollRunsDto) {
        const { status, month, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.PayrollRunWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (month) {
            const monthDate = new Date(month);
            where.month = monthDate;
        }

        const [runs, total] = await Promise.all([
            this.prisma.payrollRun.findMany({
                where,
                skip,
                take: limit,
                include: {
                    items: {
                        include: {
                            employee: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.payrollRun.count({ where }),
        ]);

        return {
            data: runs,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOnePayrollRun(id: string) {
        const run = await this.prisma.payrollRun.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        employee: true,
                    },
                },
            },
        });

        if (!run) {
            throw new NotFoundException('كشف الرواتب غير موجود');
        }

        return run;
    }

    async updatePayrollRun(id: string, dto: UpdatePayrollRunDto) {
        const run = await this.findOnePayrollRun(id);

        if (run.status !== 'DRAFT') {
            throw new BadRequestException('لا يمكن تعديل كشف رواتب معتمد');
        }

        // Delete old items
        await this.prisma.payrollItem.deleteMany({
            where: { runId: id },
        });

        // Calculate new total
        let totalNet = 0;
        const items = dto.items.map((item) => {
            const net = item.base + item.allowances - item.deductions;
            totalNet += net;
            return {
                employeeId: item.employeeId,
                base: new Prisma.Decimal(item.base),
                allowances: new Prisma.Decimal(item.allowances),
                deductions: new Prisma.Decimal(item.deductions),
                net: new Prisma.Decimal(net),
            };
        });

        return this.prisma.payrollRun.update({
            where: { id },
            data: {
                month: dto.month ? new Date(dto.month) : undefined,
                totalNet: new Prisma.Decimal(totalNet),
                items: {
                    create: items,
                },
            },
            include: {
                items: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
    }

    async deletePayrollRun(id: string) {
        const run = await this.findOnePayrollRun(id);

        if (run.status !== 'DRAFT') {
            throw new BadRequestException('لا يمكن حذف كشف رواتب معتمد');
        }

        await this.prisma.payrollRun.delete({
            where: { id },
        });

        return { message: 'تم حذف كشف الرواتب بنجاح' };
    }

    async removePayrollRun(id: string) {
        return this.deletePayrollRun(id);
    }

    async approvePayrollRun(id: string, dto: ApprovePayrollRunDto, userId: string) {
        const run = await this.findOnePayrollRun(id);

        if (run.status === 'APPROVED') {
            throw new BadRequestException('كشف الرواتب معتمد بالفعل');
        }

        // Determine payment method (default to CASH if not specified)
        const paymentMethod = dto.paymentMethod || 'CASH';
        const bankAccountId = paymentMethod === 'BANK_TRANSFER' ? dto.bankAccountId : null;

        // Check treasury/bank balance
        const totalAmount = parseFloat(run.totalNet.toString());

        if (paymentMethod === 'CASH') {
            const settings = await this.prisma.appSetting.findUnique({
                where: { id: 'single_row' },
            });

            if (settings?.preventNegativeTreasury) {
                const treasury = await this.prisma.treasury.findUnique({
                    where: { id: 'single_row' },
                });

                const currentBalance = treasury?.currentBalance
                    ? parseFloat(treasury.currentBalance.toString())
                    : 0;

                if (currentBalance < totalAmount) {
                    throw new BadRequestException('الرصيد غير كافٍ في الخزنة');
                }
            }
        } else if (paymentMethod === 'BANK_TRANSFER' && bankAccountId) {
            const settings = await this.prisma.appSetting.findUnique({
                where: { id: 'single_row' },
            });

            if (settings?.preventNegativeBank) {
                const account = await this.prisma.bankAccount.findUnique({
                    where: { id: bankAccountId },
                });

                if (!account) {
                    throw new NotFoundException('الحساب البنكي غير موجود');
                }

                const currentBalance = parseFloat(account.currentBalance.toString());
                if (currentBalance < totalAmount) {
                    throw new BadRequestException('الرصيد غير كافٍ في الحساب البنكي');
                }
            }
        }

        // Create payment voucher for each employee
        const voucherIds: string[] = [];

        for (const item of run.items) {
            const employeeAmount = parseFloat(item.net.toString());

            // Generate voucher code
            const year = new Date().getFullYear().toString().slice(-2);
            const count = await this.prisma.voucher.count({
                where: {
                    type: 'PAYMENT',
                    date: {
                        gte: new Date(new Date().getFullYear(), 0, 1),
                        lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59),
                    },
                },
            });
            const sequence = (count + 1).toString().padStart(4, '0');
            const code = `PY-${year}-${sequence}`;

            // Create voucher
            const voucher = await this.prisma.voucher.create({
                data: {
                    code,
                    type: 'PAYMENT',
                    partyType: 'EMPLOYEE',
                    partyId: item.employeeId,
                    partyName: item.employee.name,
                    method: paymentMethod,
                    bankAccountId,
                    amount: new Prisma.Decimal(employeeAmount),
                    note: `راتب ${format(new Date(run.month), 'MM/yyyy')}`,
                    date: new Date(),
                    createdBy: userId,
                },
            });

            voucherIds.push(voucher.id);

            // Update payroll item with voucher ID
            await this.prisma.payrollItem.update({
                where: { id: item.id },
                data: { voucherId: voucher.id },
            });

            // Update treasury or bank account
            if (paymentMethod === 'CASH') {
                const treasury = await this.prisma.treasury.findUnique({
                    where: { id: 'single_row' },
                });

                const currentBalance = treasury?.currentBalance
                    ? parseFloat(treasury.currentBalance.toString())
                    : 0;

                const newBalance = currentBalance - employeeAmount;

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
                        type: 'OUT',
                        amount: new Prisma.Decimal(employeeAmount),
                        note: `راتب ${item.employee.name}`,
                        balanceAfter: new Prisma.Decimal(newBalance),
                        voucherId: voucher.id,
                        createdBy: userId,
                    },
                });
            } else if (bankAccountId) {
                const account = await this.prisma.bankAccount.findUnique({
                    where: { id: bankAccountId },
                });

                if (account) {
                    const currentBalance = parseFloat(account.currentBalance.toString());
                    const newBalance = currentBalance - employeeAmount;

                    await this.prisma.bankAccount.update({
                        where: { id: bankAccountId },
                        data: {
                            currentBalance: new Prisma.Decimal(newBalance),
                        },
                    });
                }
            }
        }

        // Update payroll run status
        return this.prisma.payrollRun.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
                approvedBy: userId,
            },
            include: {
                items: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
    }

    async unapprovePayrollRun(id: string) {
        const run = await this.findOnePayrollRun(id);

        if (run.status !== 'APPROVED') {
            throw new BadRequestException('كشف الرواتب غير معتمد');
        }

        // TODO: Delete vouchers and restore treasury
        // This is a simplified version

        return this.prisma.payrollRun.update({
            where: { id },
            data: {
                status: 'DRAFT',
                approvedAt: null,
                approvedBy: null,
            },
            include: {
                items: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
    }
}
