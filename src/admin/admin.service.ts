import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { TestSession } from 'src/test/entities/test-session.entity';
import { Test, TestType } from 'src/test/entities/test.entity';
import { TestSessionStatus } from 'src/test/entities/test-session.entity';
import { MoreThanOrEqual } from 'typeorm';
import { DailyStat } from 'src/admin/entities/daily-stat.entity';
import { Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TestSession)
    private readonly testSessionRepository: Repository<TestSession>,
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(DailyStat)
    private readonly dailyStatRepository: Repository<DailyStat>,
    private readonly usersService: UsersService,
  ) {}

  // User Management
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ users: Partial<User>[]; total: number; totalPages: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'LOWER(user.email) LIKE LOWER(:search) OR LOWER("fullName") LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    const skip = (page - 1) * limit;
    const [users, total] = await queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      users: users.map((user) => this.sanitizeUser(user)),
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.is_activated = isActive;
    return this.userRepository.save(user);
  }

  async deleteUser(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.softDelete(userId);
  }

  private sanitizeUser(user: User): Partial<User> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async getDashboardStats() {
    // Lấy ngày hôm nay (bắt đầu từ 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Kiểm tra xem đã có thống kê của ngày hôm nay chưa
    const todayStats = await this.dailyStatRepository.findOne({
      where: { date: today },
    });

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStats = await this.dailyStatRepository.findOne({
      where: { date: yesterday },
    });

    console.log('yesterdayStats', yesterdayStats);

    // Nếu đã có thống kê hôm nay, trả về luôn
    if (todayStats) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const topScorer = todayStats.topScorerId
        ? await this.userRepository.findOne({
            where: { id: todayStats.topScorerId },
          })
        : null;

      return {
        todayStats,
        yesterdayStats,
      };
    }

    // Nếu chưa có, tính toán thống kê mới
    const [totalUsers, newUsersToday] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: {
          created_at: MoreThanOrEqual(today),
        },
      }),
    ]);

    const testStats = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .leftJoin('test_session.test', 'test')
      .select([
        'COUNT(DISTINCT test_session.id) as completedTests',
        'AVG(test_session.total_score) as averageScore',
        'test.type as testType',
      ])
      .where('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .andWhere('test.type IN (:...types)', {
        types: [TestType.MINI_TEST, TestType.FULL_TEST],
      })
      .groupBy('test.type')
      .getRawOne();

    const topScorer = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .select([
        'user.id as userId',
        'user.fullName as fullName',
        'user.email as email',
        'MAX(test_session.total_score) as highestScore',
        'test.name as testName',
      ])
      .leftJoin('test_session.user', 'user')
      .leftJoin('test_session.test', 'test')
      .where('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .groupBy('user.id')
      .addGroupBy('test.name')
      .orderBy('highestScore', 'DESC')
      .limit(1)
      .getRawOne();
    // Lưu thống kê mới vào database
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newStats = await this.dailyStatRepository.save({
      date: today,
      totalUsers,
      newUsers: newUsersToday,
      completedTests: parseInt(testStats.completedtests) || 0,
      averageScore: Math.round(testStats.averagescore) || 0,
      topScorerId: topScorer?.userid,
      topScore: Math.round(topScorer?.highestscore) || 0,
    });

    return {
      totalUsers,
      newUsersToday,
      completedTests: parseInt(testStats.completedtests) || 0,
      averageScore: Math.round(testStats.averagescore) || 0,
      topScorer: topScorer
        ? {
            userId: topScorer.userid,
            fullName: topScorer.fullname,
            email: topScorer.email,
            highestScore: Math.round(topScorer.highestscore),
            testName: topScorer.testname,
          }
        : null,
    };
  }

  async getUserPerformanceReport(startDate?: Date, endDate?: Date) {
    const queryBuilder = this.testSessionRepository
      .createQueryBuilder('test_session')
      .leftJoinAndSelect('test_session.user', 'user')
      .leftJoinAndSelect('test_session.test', 'test')
      .where('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      });

    if (startDate) {
      queryBuilder.andWhere('test_session.completed_at >= :startDate', {
        startDate,
      });
    }
    if (endDate) {
      queryBuilder.andWhere('test_session.completed_at <= :endDate', {
        endDate,
      });
    }

    const sessions = await queryBuilder
      .orderBy('user.id')
      .addOrderBy('test_session.completed_at', 'DESC')
      .getMany();

    // Group by user and calculate statistics
    const userStats = new Map();

    sessions.forEach((session) => {
      if (!userStats.has(session.user.id)) {
        userStats.set(session.user.id, {
          userId: session.user.id,
          userName: session.user.fullName,
          email: session.user.email,
          testsCompleted: 0,
          averageScore: 0,
          highestScore: 0,
          totalScore: 0,
          lastTestDate: null,
        });
      }

      const stats = userStats.get(session.user.id);
      stats.testsCompleted++;
      stats.totalScore += session.total_score;
      stats.averageScore = Math.round(stats.totalScore / stats.testsCompleted);
      stats.highestScore = Math.max(stats.highestScore, session.total_score);
      stats.lastTestDate = stats.lastTestDate || session.completedAt;
    });

    return Array.from(userStats.values());
  }

  async getUserProgressDetails(userId: number) {
    // Get all completed test sessions for user
    const testSessions = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .select([
        'test_session.id',
        'test_session.completed_at',
        'test_session.total_score',
        'test_session.listening_score',
        'test_session.reading_score',
        'test.id',
        'test.name',
        'test.type',
      ])
      .leftJoin('test_session.test', 'test')
      .where('test_session.user.id = :userId', { userId })
      .andWhere('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .orderBy('test_session.completed_at', 'DESC')
      .getRawMany();

    // Calculate overview stats
    const userStatsOverview = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .select([
        'COUNT(DISTINCT test_session.id) as totalTests',
        'AVG(test_session.total_score) as averageScore',
        'MAX(test_session.total_score) as highestScore',
        'AVG(test_session.listening_score) as avgListening',
        'AVG(test_session.reading_score) as avgReading',
      ])
      .where('test_session.user.id = :userId', { userId })
      .andWhere('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .getRawOne();

    // Get total test sessions count
    const totalSessions = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .where('test_session.user.id = :userId', { userId })
      .getCount();

    // Get in-progress test sessions count
    const inProgressSessions = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .where('test_session.user.id = :userId', { userId })
      .andWhere('test_session.status = :status', {
        status: TestSessionStatus.IN_PROGRESS,
      })
      .getCount();

    // Get completed test sessions count
    const completedSessions = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .where('test_session.user.id = :userId', { userId })
      .andWhere('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .getCount();

    // Group test sessions by type
    const sessionsByType = testSessions.reduce((acc, session) => {
      const type = session.test_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push({
        id: session.test_session_id,
        testId: session.test_id,
        testName: session.test_name,
        completedAt: session.test_session_completed_at,
        totalScore: session.test_session_total_score,
        listeningScore: session.test_session_listening_score,
        readingScore: session.test_session_reading_score,
      });
      return acc;
    }, {});

    const userStats = await this.usersService.getUserStats(userId);
    return {
      overview: {
        totalTests: userStatsOverview.totalTests,
        averageScore: Math.round(userStatsOverview.averagescore || 0),
        highestScore: Math.round(userStatsOverview.highestscore || 0),
        averageListening: Math.round(userStatsOverview.avglistening || 0),
        averageReading: Math.round(userStatsOverview.avgreading || 0),
        totalSessions,
        inProgressSessions,
        completedSessions,
      },
      testSessions: sessionsByType,
      stats: userStats,
    };
  }

  async updateDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Lấy thống kê trong ngày
    const stats = await this.getDashboardStats();

    // Lưu vào bảng daily_stats
    await this.dailyStatRepository.save({
      date: today,
      totalUsers: stats.totalUsers,
      newUsers: stats.newUsersToday,
      completedTests: stats.completedTests,
      averageScore: stats.averageScore,
      topScorerId: stats.topScorer?.userId,
      topScore: stats.topScorer?.highestScore,
    });
  }

  // Lấy thống kê theo khoảng thời gian
  async getStatsByDateRange(startDate: Date, endDate: Date) {
    return await this.dailyStatRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: {
        date: 'ASC',
      },
    });
  }

  @Cron('0 0 * * *') // Chạy lúc 00:00 mỗi ngày
  async handleDailyStats() {
    await this.updateDailyStats();
  }
}
