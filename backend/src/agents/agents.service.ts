import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import {
    CreateAgentDto,
    UpdateAgentDto,
    CreateTripDto,
    UpdateTripDto,
    CreateAdditionalFeeDto,
    UpdateAdditionalFeeDto,
    QueryDto,
} from './dto/agent.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgentsService {
    constructor(
        private prisma: PrismaService,
        private ledger: LedgerService,
    ) { }

    // ============ AGENTS ============

    async createAgent(dto: CreateAgentDto) {
        const existing = await this.prisma.agent.findUnique({
            where: { name: dto.name },
        });

        // If agent exists and is not deleted, throw error
        if (existing && !existing.deletedAt) {
            throw new ConflictException('هذا الاسم مُسجَّل مسبقاً');
        }

        // If agent exists but was deleted, restore it
        if (existing && existing.deletedAt) {
            // Delete old vessels
            await this.prisma.vessel.deleteMany({
                where: { agentId: existing.id },
            });

            // Update the agent
            const data: any = {
                deletedAt: null,
                isActive: true,
            };

            if (dto.openingBalance !== undefined) {
                data.openingBalance = new Prisma.Decimal(dto.openingBalance);
                data.openingSide = dto.openingSide;
            }

            const agent = await this.prisma.agent.update({
                where: { id: existing.id },
                data,
            });

            // Create new vessels if provided
            if (dto.vessels && dto.vessels.length > 0) {
                await this.prisma.vessel.createMany({
                    data: dto.vessels.map((name) => ({
                        agentId: agent.id,
                        name,
                    })),
                });
            }

            return this.prisma.agent.findUnique({
                where: { id: agent.id },
                include: { vessels: true },
            });
        }

        // Create new agent
        const data: Prisma.AgentCreateInput = {
            name: dto.name,
        };

        if (dto.openingBalance !== undefined) {
            data.openingBalance = new Prisma.Decimal(dto.openingBalance);
            data.openingSide = dto.openingSide;
        }

        const agent = await this.prisma.agent.create({
            data,
        });

        // Create vessels if provided
        if (dto.vessels && dto.vessels.length > 0) {
            await this.prisma.vessel.createMany({
                data: dto.vessels.map((name) => ({
                    agentId: agent.id,
                    name,
                })),
            });
        }

        return this.prisma.agent.findUnique({
            where: { id: agent.id },
            include: { vessels: true },
        });
    }

    async findAllAgents(query: QueryDto) {
        const { q, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AgentWhereInput = {
            deletedAt: null,
            isActive: true,
        };

        if (q) {
            where.name = { contains: q, mode: 'insensitive' };
        }

        const [agents, total] = await Promise.all([
            this.prisma.agent.findMany({
                where,
                skip,
                take: limit,
                include: {
                    vessels: true,
                    _count: {
                        select: {
                            trips: true,
                            additionalFees: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.agent.count({ where }),
        ]);

        return {
            data: agents,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOneAgent(id: string) {
        const agent = await this.prisma.agent.findUnique({
            where: { id },
            include: {
                vessels: true,
                _count: {
                    select: {
                        trips: true,
                        additionalFees: true,
                    },
                },
            },
        });

        if (!agent || agent.deletedAt) {
            throw new NotFoundException('الوكيل غير موجود');
        }

        return agent;
    }

    async updateAgent(id: string, dto: UpdateAgentDto) {
        await this.findOneAgent(id);

        const updateData: any = {};

        if (dto.name !== undefined) {
            updateData.name = dto.name;
        }

        if (dto.openingBalance !== undefined) {
            updateData.openingBalance = new Prisma.Decimal(dto.openingBalance);
        }

        if (dto.openingSide !== undefined) {
            updateData.openingSide = dto.openingSide;
        }

        const agent = await this.prisma.agent.update({
            where: { id },
            data: updateData,
        });

        // Update vessels if provided
        if (dto.vessels) {
            // Delete existing vessels
            await this.prisma.vessel.deleteMany({
                where: { agentId: id },
            });

            // Create new vessels
            if (dto.vessels.length > 0) {
                await this.prisma.vessel.createMany({
                    data: dto.vessels.map((name) => ({
                        agentId: id,
                        name,
                    })),
                });
            }
        }

        return this.prisma.agent.findUnique({
            where: { id },
            include: { vessels: true },
        });
    }

    async removeAgent(id: string) {
        await this.findOneAgent(id);

        // Check if agent has trips or fees
        const count = await this.prisma.trip.count({
            where: { agentId: id },
        });

        const feesCount = await this.prisma.additionalFee.count({
            where: { agentId: id },
        });

        if (count > 0 || feesCount > 0) {
            throw new ConflictException('لا يمكن حذف الوكيل لوجود عمليات مرتبطة به');
        }

        await this.prisma.agent.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        return { message: 'تم حذف الوكيل بنجاح' };
    }

    // ============ TRIPS ============

    async createTrip(dto: CreateTripDto) {
        const agent = await this.findOneAgent(dto.agentId);

        const totalAmount = dto.quantity * dto.unitPrice;

        const trip = await this.prisma.trip.create({
            data: {
                agentId: dto.agentId,
                vesselId: dto.vesselId,
                date: new Date(dto.date),
                quantity: dto.quantity,
                unitPrice: new Prisma.Decimal(dto.unitPrice),
                totalAmount: new Prisma.Decimal(totalAmount),
                notes: dto.notes,
            },
            include: {
                agent: true,
                vessel: true,
            },
        });

        // Create ledger entry (credit to agent)
        await this.ledger.createEntry({
            sourceType: 'TRIP',
            sourceId: trip.id,
            debitAccount: 'expense:shipping',
            creditAccount: `agent:${dto.agentId}`,
            amount: totalAmount,
            description: `رحلة ${agent.name}`,
        });

        return trip;
    }

    async findAllTrips(query: QueryDto) {
        const { agentId, from, to, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.TripWhereInput = {};

        if (agentId) where.agentId = agentId;
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        const [trips, total] = await Promise.all([
            this.prisma.trip.findMany({
                where,
                skip,
                take: limit,
                include: {
                    agent: true,
                    vessel: true,
                },
                orderBy: { date: 'desc' },
            }),
            this.prisma.trip.count({ where }),
        ]);

        return {
            data: trips,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateTrip(id: string, dto: UpdateTripDto) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) throw new NotFoundException('الرحلة غير موجودة');

        const quantity = dto.quantity !== undefined ? dto.quantity : trip.quantity;
        const unitPrice = dto.unitPrice !== undefined ? dto.unitPrice : parseFloat(trip.unitPrice.toString());
        const totalAmount = quantity * unitPrice;

        return this.prisma.trip.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
                unitPrice: dto.unitPrice ? new Prisma.Decimal(dto.unitPrice) : undefined,
                totalAmount: new Prisma.Decimal(totalAmount),
            },
            include: {
                agent: true,
                vessel: true,
            },
        });
    }

    async removeTrip(id: string) {
        const trip = await this.prisma.trip.findUnique({ where: { id } });
        if (!trip) throw new NotFoundException('الرحلة غير موجودة');

        await this.prisma.trip.delete({ where: { id } });
        return { message: 'تم حذف الرحلة بنجاح' };
    }

    // ============ ADDITIONAL FEES ============

    async createAdditionalFee(dto: CreateAdditionalFeeDto) {
        const agent = await this.findOneAgent(dto.agentId);

        const fee = await this.prisma.additionalFee.create({
            data: {
                agentId: dto.agentId,
                vesselId: dto.vesselId,
                date: new Date(dto.date),
                feeType: dto.feeType,
                quantity: dto.quantity || 1,
                amount: new Prisma.Decimal(dto.amount),
                policyNo: dto.policyNo,
                details: dto.details,
            },
            include: {
                agent: true,
                vessel: true,
            },
        });

        // Create ledger entry
        await this.ledger.createEntry({
            sourceType: 'ADDITIONAL_FEE',
            sourceId: fee.id,
            debitAccount: 'expense:agent_fees',
            creditAccount: `agent:${dto.agentId}`,
            amount: dto.amount,
            description: `${dto.feeType} - ${agent.name}`,
        });

        return fee;
    }

    async findAllFees(query: QueryDto) {
        const { agentId, from, to, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.AdditionalFeeWhereInput = {};

        if (agentId) where.agentId = agentId;
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        const [fees, total] = await Promise.all([
            this.prisma.additionalFee.findMany({
                where,
                skip,
                take: limit,
                include: {
                    agent: true,
                    vessel: true,
                },
                orderBy: { date: 'desc' },
            }),
            this.prisma.additionalFee.count({ where }),
        ]);

        return {
            data: fees,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async updateFee(id: string, dto: UpdateAdditionalFeeDto) {
        const fee = await this.prisma.additionalFee.findUnique({ where: { id } });
        if (!fee) throw new NotFoundException('الرسوم غير موجودة');

        return this.prisma.additionalFee.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
                amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
            },
            include: {
                agent: true,
                vessel: true,
            },
        });
    }

    async removeFee(id: string) {
        const fee = await this.prisma.additionalFee.findUnique({ where: { id } });
        if (!fee) throw new NotFoundException('الرسوم غير موجودة');

        await this.prisma.additionalFee.delete({ where: { id } });
        return { message: 'تم حذف الرسوم بنجاح' };
    }

    // ============ AGENT STATEMENT ============

    async getAgentStatement(agentId: string, startDate?: string, endDate?: string) {
        // Verify agent exists
        const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
        });

        if (!agent) {
            throw new NotFoundException('الوكيل غير موجود');
        }

        // Build date filter
        const dateFilter: any = {};
        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) dateFilter.date.gte = new Date(startDate);
            if (endDate) dateFilter.date.lte = new Date(endDate);
        }

        // Get trips
        const trips = await this.prisma.trip.findMany({
            where: {
                agentId,
                ...dateFilter,
            },
            include: {
                vessel: true,
            },
            orderBy: { date: 'asc' },
        });

        // Get additional fees with vessel data
        const fees = await this.prisma.additionalFee.findMany({
            where: {
                agentId,
                ...dateFilter,
            },
            include: {
                vessel: true,
            },
            orderBy: { date: 'asc' },
        });

        // Get payment vouchers (سندات صرف) for this agent
        const voucherQuery = {
            where: {
                partyType: 'AGENT',
                partyId: agentId,
                type: 'PAYMENT',
                ...dateFilter,
            },
            orderBy: { date: 'asc' as const },
        };

        console.log('=== Agent Statement Debug ===');
        console.log('Agent ID:', agentId);
        console.log('Date Filter:', dateFilter);
        console.log('Voucher Query:', JSON.stringify(voucherQuery, null, 2));

        const vouchers = await this.prisma.voucher.findMany(voucherQuery);

        console.log('Vouchers found:', vouchers.length);
        if (vouchers.length > 0) {
            console.log('First voucher:', vouchers[0]);
        }

        // Also check ALL vouchers for this agent (no date filter)
        const allVouchers = await this.prisma.voucher.findMany({
            where: {
                partyType: 'AGENT',
                partyId: agentId,
                type: 'PAYMENT',
            },
        });
        console.log('Total vouchers for agent (all dates):', allVouchers.length);

        // Calculate summary
        const totalTrips = trips.reduce((sum, trip) => sum + parseFloat(trip.totalAmount.toString()), 0);
        const totalFees = fees.reduce((sum, fee) => sum + parseFloat(fee.amount.toString()), 0);
        const totalVouchers = vouchers.reduce((sum, v) => sum + parseFloat(v.amount.toString()), 0);

        return {
            agent: {
                id: agent.id,
                name: agent.name,
            },
            trips: trips.map(trip => ({
                id: trip.id,
                date: trip.date,
                quantity: trip.quantity,
                totalAmount: parseFloat(trip.totalAmount.toString()),
                notes: trip.notes,
                vessel: trip.vessel ? {
                    id: trip.vessel.id,
                    name: trip.vessel.name,
                } : null,
            })),
            fees: fees.map(fee => ({
                id: fee.id,
                date: fee.date,
                feeType: fee.feeType,
                quantity: fee.quantity || 1,
                amount: parseFloat(fee.amount.toString()),
                vessel: fee.vessel ? {
                    id: fee.vessel.id,
                    name: fee.vessel.name,
                } : null,
            })),
            vouchers: vouchers.map(v => ({
                id: v.id,
                date: v.date,
                amount: parseFloat(v.amount.toString()),
                notes: v.note,
                counterparty: v.partyName || 'غير محدد',
            })),
            summary: {
                totalCredit: totalTrips + totalFees, // What agent should receive
                totalDebit: totalVouchers,            // What was paid to agent
                balance: (totalTrips + totalFees) - totalVouchers,
            },
        };
    }
}
