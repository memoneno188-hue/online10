import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, UpdateVoucherDto, QueryVouchersDto } from './dto/voucher.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
// UserRole no longer needed - using isAdmin flag

@ApiTags('Vouchers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vouchers')
export class VouchersController {
    constructor(private readonly vouchersService: VouchersService) { }

    @Post()
    @Roles('ACCOUNTANT', 'ADMIN')
    @ApiOperation({ summary: 'Create voucher (receipt or payment)' })
    create(@Body() createVoucherDto: CreateVoucherDto, @CurrentUser() user: any) {
        return this.vouchersService.create(createVoucherDto, user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all vouchers' })
    findAll(@Query() query: QueryVouchersDto) {
        return this.vouchersService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get one voucher' })
    findOne(@Param('id') id: string) {
        return this.vouchersService.findOne(id);
    }

    @Patch(':id')
    @Roles('ACCOUNTANT', 'ADMIN')
    @ApiOperation({ summary: 'Update voucher' })
    update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
        return this.vouchersService.update(id, updateVoucherDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete voucher' })
    remove(@Param('id') id: string) {
        return this.vouchersService.remove(id);
    }
}
