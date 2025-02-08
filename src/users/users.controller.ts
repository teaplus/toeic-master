import {
  Body,
  // BadRequestException,
  Controller,
  Get,
  Post,
  // Request,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UserWithStats } from './dto/profile.dto';
import {
  TestSession,
  TestSessionStatus,
} from 'src/test/entities/test-session.entity';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  // @UseGuards(AccessTokenGuard)
  @Get('profile/:id')
  async getProfile(@Param('id') id: number): Promise<Partial<UserWithStats>> {
    const user = await this.usersService.findById(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const analysisScores = await this.usersService.getUserStats(id);
    // console.log(userStats);
    // Loại bỏ thông tin nhạy cảm
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userProfile } = user;

    return {
      ...userProfile,
      testHistory: {
        recent: user.testStats.recentTests.slice(0, 5).map((test) => ({
          id: test.id,
          testId: test.test?.id,
          testName: test.test?.name,
          type: test.test?.type,
          score: test.total_score,
          completedAt: test.completedAt,
          status: test.status,
        })),
        stats: {
          totalFullTests: user.testStats.totalFullTests,
          totalMiniTests: user.testStats.totalMiniTests,
          totalPracticeTests: user.testStats.totalPracticeTests,
          averageScore: user.testStats.averageScore,
          highestScore: user.testHistory.stats.highestScore,
          // progress: userStats.progress,
          analysisScores: analysisScores.analysisScores,
        },
      },
    };
  }

  @UseGuards(AccessTokenGuard)
  @Post('update-profile')
  async updateProfile(
    @Body() body: { data: Partial<User> },
  ): Promise<Partial<User>> {
    return this.usersService.updateUser(body.data);
  }

  @UseGuards(AccessTokenGuard)
  @Get('test-history/:id')
  async getTestHistory(
    @Param('id') id: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status: TestSessionStatus = TestSessionStatus.COMPLETED,
  ): Promise<{
    data: TestSession[];
    total: number;
    page: number;
    pages: number;
  }> {
    const pageNumber = page ? page : 1;
    const limitNumber = limit ? limit : 10;

    return this.usersService.getUserTestHistory(
      id,
      pageNumber,
      limitNumber,
      status,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Get('analyze-part-scores/:id')
  async analyzePartScores(@Param('id') id: number): Promise<any> {
    return this.usersService.analyzePartScores(id);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }
}
