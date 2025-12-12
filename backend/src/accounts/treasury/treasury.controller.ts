import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TreasuryService } from './treasury.service';
import { SetOpeningBalanceDto, QueryTransactionsDto, UpdateTreasurySettingsDto } from './dto/treasury.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
// UserRole no longer needed - using isAdmin flag

@ApiTags('Treasury')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('treasury')
export class TreasuryController {
    constructor(private readonly treasuryService: TreasuryService) { }

    @Post('opening-balance')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Set opening balance (once only)' })
    setOpeningBalance(
        @Body() dto: SetOpeningBalanceDto,
        @CurrentUser() user: any,
    ) {
        return this.treasuryService.setOpeningBalance(dto, user.id);
    }

    @Get('balance')
    @ApiOperation({ summary: 'Get current treasury balance' })
    getBalance() {
        return this.treasuryService.getBalance();
    }

    @Get('transactions')
    @ApiOperation({ summary: 'Get treasury transactions' })
    getTransactions(@Query() query: QueryTransactionsDto) {
        return this.treasuryService.getTransactions(query);
    }

    @Get('report')
    @ApiOperation({ summary: 'Get treasury report' })
    getReport(@Query('from') from?: string, @Query('to') to?: string) {
        return this.treasuryService.getReport(from, to);
    }

    @Patch('settings')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Update treasury settings' })
    updateSettings(@Body() dto: UpdateTreasurySettingsDto) {
        return this.treasuryService.updateSettings(dto.preventNegativeTreasury ?? false);
    }
}
