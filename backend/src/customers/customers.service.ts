import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomersDto } from './dto/customer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
    constructor(private prisma: PrismaService) { }

    async create(createCustomerDto: CreateCustomerDto) {
        // Check if customer with same name exists
        const existing = await this.prisma.customer.findUnique({
            where: { name: createCustomerDto.name },
        });

        // If customer exists and is not deleted, throw error
        if (existing && !existing.deletedAt) {
            throw new ConflictException('هذا الاسم مُسجَّل مسبقًا');
        }

        // If customer exists but is deleted, restore and update it
        if (existing && existing.deletedAt) {
            const data: any = {
                phone: createCustomerDto.phone,
                email: createCustomerDto.email,
                address: createCustomerDto.address,
                type: createCustomerDto.type,
                deletedAt: null,
                isActive: true,
            };

            if (createCustomerDto.openingBalance !== undefined) {
                data.openingBalance = new Prisma.Decimal(createCustomerDto.openingBalance);
                data.openingSide = createCustomerDto.openingSide;
            }

            return this.prisma.customer.update({
                where: { id: existing.id },
                data,
            });
        }

        // Create new customer
        const data: Prisma.CustomerCreateInput = {
            name: createCustomerDto.name,
            phone: createCustomerDto.phone,
            email: createCustomerDto.email,
            address: createCustomerDto.address,
            type: createCustomerDto.type,
        };

        if (createCustomerDto.openingBalance !== undefined) {
            data.openingBalance = new Prisma.Decimal(createCustomerDto.openingBalance);
            data.openingSide = createCustomerDto.openingSide;
        }

        return this.prisma.customer.create({ data });
    }

    async findAll(query: QueryCustomersDto) {
        const { q, type, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.CustomerWhereInput = {
            deletedAt: null,
            isActive: true,
        };

        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
            ];
        }

        if (type) {
            where.type = type;
        }

        const [customers, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.customer.count({ where }),
        ]);

        return {
            data: customers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
        });

        if (!customer || customer.deletedAt) {
            throw new NotFoundException('العميل غير موجود');
        }

        return customer;
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto) {
        await this.findOne(id);

        return this.prisma.customer.update({
            where: { id },
            data: updateCustomerDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        // Soft delete
        return this.prisma.customer.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async restore(id: string) {
        return this.prisma.customer.update({
            where: { id },
            data: { deletedAt: null },
        });
    }

    async getStats() {
        const total = await this.prisma.customer.count({
            where: { deletedAt: null, isActive: true },
        });

        const byType = await this.prisma.customer.groupBy({
            by: ['type'],
            where: { deletedAt: null, isActive: true },
            _count: true,
        });

        return {
            total,
            export: byType.find((t) => t.type === 'EXPORT')?._count || 0,
            import: byType.find((t) => t.type === 'IMPORT')?._count || 0,
            transit: byType.find((t) => t.type === 'TRANSIT')?._count || 0,
            free: byType.find((t) => t.type === 'FREE')?._count || 0,
        };
    }
}
