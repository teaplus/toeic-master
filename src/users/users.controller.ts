import {
  Body,
  // BadRequestException,
  Controller,
  Get,
  Post,
  // Request,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UserWithStats } from './dto/profile.dto';

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
}
