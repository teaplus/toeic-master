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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { RoleAdminCheck } from 'src/auth/guards/admin.guard';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

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

  // Để thêm các routes admin khác sau này
}
