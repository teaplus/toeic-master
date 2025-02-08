import {
  Controller,
  Get,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  ParseIntPipe,
  Post,
  Res,
  Header,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RoleAdminCheck } from 'src/auth/guards/admin.guard';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
// import { CreateUserByAdminDto } from './dto/create-user.dto';
import { StatsPeriod } from './dto/stats.enum';
import { Response } from 'express';

@Controller('admin')
@UseGuards(RoleAdminCheck)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User Management Routes
  @Get('users')
  async getUsers(@Query() query: UserQueryDto) {
    return this.adminService.getAllUsers(query.page, query.limit, query.search);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, updateStatusDto.isActive);
  }

  @Delete('users/:id')
  @HttpCode(204)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteUser(id);
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    return await this.adminService.getDashboardStats();
  }

  @Get('reports/user-performance')
  async getUserPerformanceReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.adminService.getUserPerformanceReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('user-progress/:userId')
  async getUserProgressDetails(@Param('userId', ParseIntPipe) userId: number) {
    return await this.adminService.getUserProgressDetails(userId);
  }

  @Get('stats/history')
  async getStatsHistory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.adminService.getStatsByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('create-user')
  async createUser(@Body() createUserDto: any) {
    console.log('createUserDto', createUserDto);
    return this.adminService.createUser(createUserDto);
  }

  @Get('stats/:period')
  async getStatsByPeriod(
    @Param('period') period: StatsPeriod,
    @Query('year') year?: number,
  ) {
    return this.adminService.getStatsByPeriod(period, year);
  }

  @Get('export-csv/:type')
  @Header('Content-Type', 'text/csv')
  async exportCsv(
    @Param('type') type: 'users' | 'tests',
    @Res() res: Response,
  ) {
    const { filename, stream } = await this.adminService.generateCsvFile(type);

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    stream.pipe(res);
  }
}
