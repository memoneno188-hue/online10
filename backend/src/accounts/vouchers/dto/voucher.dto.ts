import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsOptional,
    IsNumber,
    IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VoucherType, PartyType, PaymentMethod } from '@prisma/client';

export class CreateVoucherDto {
    @ApiProperty({ enum: VoucherType })
    @IsEnum(VoucherType)
    type: VoucherType;

    @ApiProperty({ enum: PartyType })
    @IsEnum(PartyType)
    partyType: PartyType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    partyId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    partyName?: string;

    @ApiProperty({ enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    method: PaymentMethod;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bankAccountId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty({ message: 'المبلغ مطلوب' })
    amount: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    note?: string;

    @ApiProperty()
    @IsDateString()
    date: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    categoryId?: string;
}

export class UpdateVoucherDto {
    @ApiPropertyOptional({ enum: PartyType })
    @IsOptional()
    @IsEnum(PartyType)
    partyType?: PartyType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    partyId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    partyName?: string;

    @ApiPropertyOptional({ enum: PaymentMethod })
    @IsOptional()
    @IsEnum(PaymentMethod)
    method?: PaymentMethod;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bankAccountId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    date?: string;
}

export class QueryVouchersDto {
    @ApiPropertyOptional({ enum: VoucherType })
    @IsOptional()
    @IsEnum(VoucherType)
    type?: VoucherType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @IsNumber()
    limit?: number;
}
