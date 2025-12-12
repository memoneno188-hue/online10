import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import {
    CreateAgentDto,
    UpdateAgentDto,
    CreateTripDto,
    UpdateTripDto,
    CreateAdditionalFeeDto,
    UpdateAdditionalFeeDto,
    QueryDto,
} from './dto/agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// UserRole no longer needed - using isAdmin flag

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agents')
export class AgentsController {
    constructor(private readonly agentsService: AgentsService) { }

    // ============ AGENTS ============

    @Post()
    @Roles('ACCOUNTANT', 'ADMIN')
    @ApiOperation({ summary: 'Create agent' })
    createAgent(@Body() dto: CreateAgentDto) {
        return this.agentsService.createAgent(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all agents' })
    findAllAgents(@Query() query: QueryDto) {
        return this.agentsService.findAllAgents(query);
    }

    // ============ TRIPS ============

    @Post('trips')
    @Roles('ACCOUNTANT', 'ADMIN')
    @ApiOperation({ summary: 'Create trip' })
    createTrip(@Body() dto: CreateTripDto) {
        return this.agentsService.createTrip(dto);
    }

    @Get('trips')
    @ApiOperation({ summary: 'Get all trips' })
    findAllTrips(@Query() query: QueryDto) {
        return this.agentsService.findAllTrips(query);
    }

    @Patch('trips/:id')
    @Roles('ACCOUNTANT', 'ADMIN')
    @ApiOperation({ summary: 'Update trip' })
    updateTrip(@Param('id') id: string, @Body() dto: UpdateTripDto) {
        return this.agentsService.updateTrip(id, dto);
    }

    @Delete('trips/:id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete trip' })
    removeTrip(@Param('id') id: string) {
        return this.agentsService.removeTrip(id);
    }

    // ============ ADDITIONAL FEES ============

    @Post('fees')
    @Roles('ACCOUNTANT', 'ADMIN')
    @ApiOperation({ summary: 'Create additional fee' })
    createFee(@Body() dto: CreateAdditionalFeeDto) {
        return this.agentsService.createAdditionalFee(dto);
    }

    @Get('fees')
    @ApiOperation({ summary: 'Get all additional fees' })
    findAllFees(@Query() query: QueryDto) {
        return this.agentsService.findAllFees(query);
    }

    @Patch('fees/:id')
    @Roles('ACCOUNTANT', 'ADMIN')
    @ApiOperation({ summary: 'Update additional fee' })
    updateFee(@Param('id') id: string, @Body() dto: UpdateAdditionalFeeDto) {
        return this.agentsService.updateFee(id, dto);
    }

    @Delete('fees/:id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete additional fee' })
    removeFee(@Param('id') id: string) {
        return this.agentsService.removeFee(id);
    }

    // ============ AGENTS (specific routes must come AFTER trips/fees) ============

    @Get(':id/statement')
    @ApiOperation({ summary: 'Get agent statement' })
    getAgentStatement(
        @Param('id') id: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.agentsService.getAgentStatement(id, startDate, endDate);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get one agent' })
    findOneAgent(@Param('id') id: string) {
        return this.agentsService.findOneAgent(id);
    }

    @Patch(':id')
    @Roles('ACCOUNTANT', 'ADMIN')
    @ApiOperation({ summary: 'Update agent' })
    updateAgent(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
        return this.agentsService.updateAgent(id, dto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Delete agent' })
    removeAgent(@Param('id') id: string) {
        return this.agentsService.removeAgent(id);
    }
}
