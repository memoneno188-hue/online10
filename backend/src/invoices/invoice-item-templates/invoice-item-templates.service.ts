import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceItemTemplateDto, UpdateInvoiceItemTemplateDto } from './dto/invoice-item-template.dto';

@Injectable()
export class InvoiceItemTemplatesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.invoiceItemTemplate.findMany({
            where: { isActive: true },
            orderBy: { description: 'asc' },
        });
    }

    async search(query: string) {
        return this.prisma.invoiceItemTemplate.findMany({
            where: {
                isActive: true,
                description: {
                    contains: query,
                    mode: 'insensitive',
                },
            },
            orderBy: { description: 'asc' },
            take: 10,
        });
    }

    async create(createDto: CreateInvoiceItemTemplateDto) {
        return this.prisma.invoiceItemTemplate.create({
            data: createDto,
        });
    }

    async update(id: string, updateDto: UpdateInvoiceItemTemplateDto) {
        return this.prisma.invoiceItemTemplate.update({
            where: { id },
            data: updateDto,
        });
    }

    async remove(id: string) {
        return this.prisma.invoiceItemTemplate.delete({
            where: { id },
        });
    }
}
