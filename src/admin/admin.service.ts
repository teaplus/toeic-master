import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from 'src/users/user.entity';
import { TestSession } from 'src/test/entities/test-session.entity';
import { Test, TestType } from 'src/test/entities/test.entity';
import { TestSessionStatus } from 'src/test/entities/test-session.entity';
import { MoreThanOrEqual } from 'typeorm';
import { DailyStat } from 'src/admin/entities/daily-stat.entity';
import { Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { UsersService } from 'src/users/users.service';
import { CreateUserByAdminDto } from './dto/create-user.dto';
import { StatsPeriod } from './dto/stats.enum';
import { Readable } from 'stream';
import { format } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CsvRow {
  [key: string]: string | number;
}

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
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect(
        'user.testSessions',
        'testSession',
        'testSession.status = :status',
        { status: TestSessionStatus.COMPLETED },
      );

    if (search) {
      queryBuilder.where(
        'LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.fullName) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    const skip = (page - 1) * limit;
    const [users, total] = await queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const enrichedUsers = users.map((user) => {
      const completedTests = user.testSessions || [];
      const latestTest =
        completedTests.length > 0
          ? completedTests.reduce((latest, current) =>
              latest.completedAt > current.completedAt ? latest : current,
            )
          : null;

      const highestScore =
        completedTests.length > 0
          ? Math.max(...completedTests.map((test) => test.total_score || 0))
          : 0;

      return {
        ...this.sanitizeUser(user),
        latestTestDate: latestTest?.completedAt || null,
        latestTestScore: latestTest?.total_score || 0,
        highestScore: highestScore,
      };
    });

    return {
      users: enrichedUsers,
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
    const { password, testSessions, ...result } = user;
    return result;
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Tính toán các mốc thời gian
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Đầu tuần (Chủ nhật)

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const quarterStart = new Date(
      today.getFullYear(),
      Math.floor(today.getMonth() / 3) * 3,
      1,
    );

    const yearStart = new Date(today.getFullYear(), 0, 1);

    // Lấy thống kê của ngày hôm qua từ database
    const yesterdayStats = await this.dailyStatRepository.findOne({
      where: { date: yesterday },
    });

    // Luôn tính toán realtime cho ngày hôm nay
    const [totalSystemUsers, newUsersToday] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: {
          created_at: MoreThanOrEqual(today),
        },
      }),
    ]);

    // Lấy thống kê bài test hoàn thành theo các khoảng thời gian
    const [todayStats, weeklyStats, monthlyStats, quarterlyStats, yearlyStats] =
      await Promise.all([
        // Today stats
        this.testSessionRepository
          .createQueryBuilder('test_session')
          .leftJoin('test_session.test', 'test')
          .select([
            'COUNT(DISTINCT test_session.id) as completedTests',
            'AVG(test_session.total_score) as averageScore',
          ])
          .where('test_session.status = :status', {
            status: TestSessionStatus.COMPLETED,
          })
          .andWhere('test_session.completedAt >= :today', { today })
          .andWhere('test.type IN (:...types)', {
            types: [TestType.MINI_TEST, TestType.FULL_TEST],
          })
          .getRawOne(),

        // Weekly stats
        this.testSessionRepository.count({
          where: {
            status: TestSessionStatus.COMPLETED,
            completedAt: MoreThanOrEqual(weekStart),
          },
        }),

        // Monthly stats
        this.testSessionRepository.count({
          where: {
            status: TestSessionStatus.COMPLETED,
            completedAt: MoreThanOrEqual(monthStart),
          },
        }),

        // Quarterly stats
        this.testSessionRepository.count({
          where: {
            status: TestSessionStatus.COMPLETED,
            completedAt: MoreThanOrEqual(quarterStart),
          },
        }),

        // Yearly stats
        this.testSessionRepository.count({
          where: {
            status: TestSessionStatus.COMPLETED,
            completedAt: MoreThanOrEqual(yearStart),
          },
        }),
      ]);

    // Lấy người có điểm cao nhất mọi thời điểm
    const allTimeTopScorer = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .select([
        'user.id as userId',
        'user.fullName as fullName',
        'user.email as email',
        'test_session.total_score as highestScore',
        'test.name as testName',
        'test_session.completedAt as completedAt',
      ])
      .leftJoin('test_session.user', 'user')
      .leftJoin('test_session.test', 'test')
      .where('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .orderBy('test_session.total_score', 'DESC')
      .limit(1)
      .getRawOne();

    // Lấy điểm cao nhất của mỗi user và phân tích phân bổ
    const userHighestScores = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .select([
        'user.id as userId',
        'MAX(test_session.total_score) as highestScore',
      ])
      .leftJoin('test_session.user', 'user')
      .where('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .groupBy('user.id')
      .getRawMany();

    const scoreRanges = [
      { min: 0, max: 250, label: '0-250' },
      { min: 251, max: 550, label: '251-550' },
      { min: 551, max: 750, label: '551-750' },
      { min: 751, max: 990, label: '751-990' },
    ];

    const distribution = scoreRanges.map((range) => ({
      range: range.label,
      count: userHighestScores.filter(
        (score) =>
          score.highestscore >= range.min && score.highestscore <= range.max,
      ).length,
      percentage: 0,
    }));

    const totalScoredUsers = userHighestScores.length;
    distribution.forEach((item) => {
      item.percentage =
        totalScoredUsers > 0
          ? Math.round((item.count / totalScoredUsers) * 100)
          : 0;
    });

    console.log('allTimeTopScorer', allTimeTopScorer);
    console.log('todayStats', todayStats);

    // Lấy top 5 bài test phổ biến nhất
    const popularTests = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .select([
        'test.id as testId',
        'test.name as testName',
        'test.type as testType',
        'test.total_score as maxScore',
        'COUNT(DISTINCT test_session.id) as totalAttempts',
        'AVG(test_session.total_score) as averageScore',
        'MAX(test_session.total_score) as highestScore',
      ])
      .leftJoin('test_session.test', 'test')
      .where('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .andWhere('test.type IN (:...types)', {
        types: [TestType.MINI_TEST, TestType.FULL_TEST, TestType.PART_TEST],
      })
      .groupBy('test.id')
      .addGroupBy('test.name')
      .addGroupBy('test.type')
      .addGroupBy('test.total_score')
      .orderBy('totalAttempts', 'DESC')
      .limit(5)
      .getRawMany();

    const formattedPopularTests = popularTests.map((test) => ({
      id: test.testid,
      name: test.testname,
      type: test.testtype,
      maxScore: test.maxscore || 990,
      totalAttempts: parseInt(test.totalattempts),
      averageScore: Math.round(test.averagescore) || 0,
      highestScore: Math.round(test.highestscore) || 0,
    }));

    const todayStatsData = {
      date: today,
      totalUsers: totalSystemUsers,
      newUsers: newUsersToday,
      completedTests: parseInt(todayStats?.completedtests) || 0,
      averageScore: Math.round(todayStats?.averagescore) || 0,
      topScorerId: allTimeTopScorer?.userid,
      topScore: Math.round(allTimeTopScorer?.highestscore) || 0,
      topScorer: allTimeTopScorer
        ? {
            userId: allTimeTopScorer.userid,
            fullName: allTimeTopScorer.fullname,
            email: allTimeTopScorer.email,
            highestScore: Math.round(allTimeTopScorer.highestscore),
            testName: allTimeTopScorer.testname,
            achievedAt: allTimeTopScorer.completedat,
          }
        : null,
      completedTestsStats: {
        weekly: weeklyStats,
        monthly: monthlyStats,
        quarterly: quarterlyStats,
        yearly: yearlyStats,
      },
      scoreDistribution: distribution,
      popularTests: formattedPopularTests,
    };

    return {
      todayStats: todayStatsData,
      yesterdayStats,
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
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userInfo } = user;

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
      .andWhere('test.type != :type', { type: TestType.PART_TEST })
      .orderBy('test_session.completed_at', 'DESC')
      .limit(15)
      .getRawMany();

    console.log('testSessions', testSessions);

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

    const userStats = await this.usersService.getUserStats(userId);
    return {
      user: userInfo,
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
      testSessions: testSessions,
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
      totalUsers: stats.todayStats.totalUsers,
      newUsers: stats.todayStats.newUsers,
      completedTests: stats.todayStats.completedTests,
      averageScore: stats.todayStats.averageScore,
      topScorerId: stats.todayStats.topScorerId,
      topScore: stats.todayStats.topScore,
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

  @Cron('59 23 * * *') // Chạy lúc 23:59 mỗi ngày
  async saveDailyStats() {
    const stats = await this.getDashboardStats();

    // Lưu thống kê của ngày hôm nay vào database
    await this.dailyStatRepository.save({
      date: stats.todayStats.date,
      totalUsers: stats.todayStats.totalUsers,
      newUsers: stats.todayStats.newUsers,
      completedTests: stats.todayStats.completedTests,
      averageScore: stats.todayStats.averageScore,
      topScorerId: stats.todayStats.topScorerId,
      topScore: stats.todayStats.topScore,
    });
  }

  async createUser(
    createUserDto: CreateUserByAdminDto,
  ): Promise<Partial<User>> {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email,
    );
    console.log('existingUser', existingUser);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Tạo user mới với trạng thái đã active
    const newUser = await this.usersService.create({
      ...createUserDto,
      is_activated: true, // User được tạo bởi admin mặc định đã active
      role: 'common',
    });

    return this.usersService.sanitizeUserByAdmin(newUser);
  }

  async getStatsByPeriod(
    period: StatsPeriod,
    year: number = new Date().getFullYear(),
  ) {
    const queryBuilder = this.testSessionRepository
      .createQueryBuilder('test_session')
      .where('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      });

    switch (period) {
      case StatsPeriod.WEEK:
        return this.getWeeklyStats(queryBuilder, year);
      case StatsPeriod.MONTH:
        return this.getMonthlyStats(queryBuilder, year);
      case StatsPeriod.QUARTER:
        return this.getQuarterlyStats(queryBuilder, year);
      case StatsPeriod.YEAR:
        return this.getYearlyStats(queryBuilder);
    }
  }

  private async getWeeklyStats(
    queryBuilder: SelectQueryBuilder<TestSession>,
    year: number,
  ) {
    const stats = await queryBuilder
      .select([
        'EXTRACT(WEEK FROM test_session.completedAt) as week',
        'COUNT(test_session.id) as total',
        'AVG(test_session.total_score) as averageScore',
      ])
      .andWhere('EXTRACT(YEAR FROM test_session.completedAt) = :year', { year })
      .groupBy('week')
      .orderBy('week', 'ASC')
      .getRawMany();

    return stats.map((stat) => ({
      period: `Week ${stat.week}`,
      total: parseInt(stat.total),
      averageScore: Math.round(stat.averagescore),
    }));
  }

  private async getMonthlyStats(
    queryBuilder: SelectQueryBuilder<TestSession>,
    year: number,
  ) {
    const stats = await queryBuilder
      .select([
        'EXTRACT(MONTH FROM test_session.completedAt) as month',
        'COUNT(test_session.id) as total',
        'AVG(test_session.total_score) as averageScore',
      ])
      .andWhere('EXTRACT(YEAR FROM test_session.completedAt) = :year', { year })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    return stats.map((stat) => ({
      period: `Month ${stat.month}`,
      total: parseInt(stat.total),
      averageScore: Math.round(stat.averagescore),
    }));
  }

  private async getQuarterlyStats(
    queryBuilder: SelectQueryBuilder<TestSession>,
    year: number,
  ) {
    const stats = await queryBuilder
      .select([
        'EXTRACT(QUARTER FROM test_session.completedAt) as quarter',
        'COUNT(test_session.id) as total',
        'AVG(test_session.total_score) as averageScore',
      ])
      .andWhere('EXTRACT(YEAR FROM test_session.completedAt) = :year', { year })
      .groupBy('quarter')
      .orderBy('quarter', 'ASC')
      .getRawMany();

    return stats.map((stat) => ({
      period: `Q${stat.quarter}`,
      total: parseInt(stat.total),
      averageScore: Math.round(stat.averagescore),
    }));
  }

  private async getYearlyStats(queryBuilder: SelectQueryBuilder<TestSession>) {
    const stats = await queryBuilder
      .select([
        'EXTRACT(YEAR FROM test_session.completedAt) as year',
        'COUNT(test_session.id) as total',
        'AVG(test_session.total_score) as averageScore',
      ])
      .groupBy('year')
      .orderBy('year', 'ASC')
      .getRawMany();

    return stats.map((stat) => ({
      period: `Year ${stat.year}`,
      total: parseInt(stat.total),
      averageScore: Math.round(stat.averagescore),
    }));
  }

  async generateCsvFile(
    type: 'users' | 'tests',
  ): Promise<{ filename: string; stream: Readable }> {
    // Lấy dữ liệu từ query trực tiếp thay vì dùng getList
    const data =
      type === 'users'
        ? await this.userRepository
            .createQueryBuilder('user')
            .select([
              'user.id as id',
              'user.fullName as fullName',
              'user.email as email',
              'user.created_at as registrationDate',
              'COUNT(DISTINCT test_session.id) as totalTests',
              'AVG(test_session.total_score) as averageScore',
            ])
            .leftJoin('user.testSessions', 'test_session')
            .groupBy('user.id')
            .getRawMany()
        : await this.testRepository
            .createQueryBuilder('test')
            .select([
              'test.id as id',
              'test.name as title',
              'test.type as type',
              'COUNT(DISTINCT test_session.id) as totalAttempts',
              'AVG(test_session.total_score) as averageScore',
            ])
            .leftJoin('test.testSessions', 'test_session')
            .groupBy('test.id')
            .getRawMany();

    // Định nghĩa headers cho từng loại
    const headers =
      type === 'users'
        ? [
            'ID',
            'Full Name',
            'Email',
            'Registration Date',
            'Total Tests',
            'Average Score',
          ]
        : ['ID', 'Title', 'Type', 'Total Attempts', 'Average Score'];

    const fields =
      type === 'users'
        ? [
            'id',
            'fullname',
            'email',
            'registrationdate',
            'totaltests',
            'averagescore',
          ]
        : ['id', 'title', 'type', 'totalattempts', 'averagescore'];

    // Tạo stream để ghi dữ liệu
    const stream = new Readable({
      read() {
        // Implementation required but not used
      },
    });

    // Ghi header
    stream.push(headers.join(',') + '\n');

    // Ghi dữ liệu
    data.forEach((item: any) => {
      const row = fields
        .map((field) => {
          let value = item[field];

          // Format date với kiểm tra
          if (field === 'registrationDate' && value) {
            try {
              const date = new Date(value);
              if (date.toString() !== 'Invalid Date') {
                value = format(date, 'dd/MM/yyyy HH:mm:ss');
              }
            } catch {
              value = ''; // hoặc giá trị mặc định khác
            }
          }

          // Xử lý các giá trị có dấu phẩy
          if (typeof value === 'string' && value.includes(',')) {
            value = `"${value}"`;
          }

          return value || ''; // Trả về chuỗi rỗng nếu value là null/undefined
        })
        .join(',');

      stream.push(row + '\n');
    });

    // Kết thúc stream
    stream.push(null);

    // Tạo tên file với timestamp
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `${type}_report_${timestamp}.csv`;

    return {
      filename,
      stream,
    };
  }
}
