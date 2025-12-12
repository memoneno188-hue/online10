import { Module } from '@nestjs/common';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from './treasury.service';
import { LedgerModule } from '../../ledger/ledger.module';

@Module({
    imports: [LedgerModule],
    controllers: [TreasuryController],
    providers: [TreasuryService],
    exports: [TreasuryService],
})
export class TreasuryModule { }
