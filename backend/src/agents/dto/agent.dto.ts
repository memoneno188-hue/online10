import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    IsArray,
    IsEnum,
    IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BalanceSide } from '@prisma/client';

// Agent DTOs
export class CreateAgentDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'اسم الوكيل مطلوب' })
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    vessels?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    openingBalance?: number;

    @ApiPropertyOptional({ enum: BalanceSide })
    @IsOptional()
    @IsEnum(BalanceSide)
    openingSide?: BalanceSide;
}

export class UpdateAgentDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    vessels?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    openingBalance?: number;

    @ApiPropertyOptional({ enum: BalanceSide })
    @IsOptional()
    @IsEnum(BalanceSide)
    openingSide?: BalanceSide;
}

// Trip DTOs
export class CreateTripDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'الوكيل مطلوب' })
    agentId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    vesselId?: string;

    @ApiProperty()
    @IsDateString()
    date: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty({ message: 'عدد النوالين مطلوب' })
    quantity: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty({ message: 'سعر الوحدة مطلوب' })
    unitPrice: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateTripDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    vesselId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    quantity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    unitPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    notes?: string;
}

// Additional Fee DTOs
export class CreateAdditionalFeeDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'الوكيل مطلوب' })
    agentId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    vesselId?: string;

    @ApiProperty()
    @IsDateString()
    date: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'نوع الرسوم مطلوب' })
    feeType: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsNumber()
    quantity?: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty({ message: 'المبلغ مطلوب' })
    amount: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    policyNo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    details?: string;
}

export class UpdateAdditionalFeeDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    vesselId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    feeType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    quantity?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    amount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    policyNo?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    details?: string;
}

export class QueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    agentId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({ default: 20 })
    @IsOptional()
    @IsNumber()
    limit?: number;
}
