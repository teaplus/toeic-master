import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import {
  TestSession,
  TestSessionStatus,
} from 'src/test/entities/test-session.entity';
import { UserWithStats } from './dto/profile.dto';
import { TestType } from 'src/test/entities/test.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TestSession)
    private readonly testSessionRepository: Repository<TestSession>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    console.log('email', email);
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<Partial<UserWithStats>> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'testSessions',
        'testSessions.test',
        'testSessions.part',
        'testSessions.responses',
        'testSessions.partScores',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Tính toán thống kê
    const testStats = {
      totalFullTests: user.testSessions.filter(
        (t) => t.test?.type === 'FULL_TEST',
      ).length,
      totalMiniTests: user.testSessions.filter(
        (t) => t.test?.type === 'MINI_TEST',
      ).length,
      totalPracticeTests: user.testSessions.filter(
        (t) => t.test?.type === 'PART_TEST',
      ).length,
      averageScore: this.calculateAverageScore(user.testSessions),
      recentTests: user.testSessions
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, 5),
    };

    const highestScore = Math.max(
      ...user.testSessions
        .filter((test) => test.status === TestSessionStatus.COMPLETED)
        .map((test) => test.total_score || 0),
    );

    return {
      ...user,
      testStats,
      testHistory: {
        recent: testStats.recentTests.map((test) => ({
          id: test.id,
          testName: test.test?.name,
          type: test.test?.type,
          score: test.total_score,
          completedAt: test.completedAt,
          status: test.status,
        })),
        stats: {
          totalFullTests: testStats.totalFullTests,
          totalMiniTests: testStats.totalMiniTests,
          totalPracticeTests: testStats.totalPracticeTests,
          averageScore: testStats.averageScore,
          highestScore: highestScore,
          analysisScores: {
            listening: 0,
            reading: 0,
            grammar: 0,
            comprehension: 0,
          },
        },
      },
    };
  }

  private calculateAverageScore(testSessions: TestSession[]): number {
    const completedTests = testSessions.filter((t) => t.status === 'COMPLETED');
    if (completedTests.length === 0) return 0;

    const totalScore = completedTests.reduce(
      (sum, test) => sum + (test.total_score || 0),
      0,
    );
    return Math.round(totalScore / completedTests.length);
  }

  async create(userData: Partial<User>): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return this.userRepository.save({ ...userData, password: hashedPassword });
  }

  async activateUser(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('user chưa đăng ký');
    }
    await this.userRepository.update(user.id, { ...user, is_activated: true });
    return 'Successfull';
  }

  async updateUser(user: Partial<User>) {
    // await this.userRepository.save(user);
    const isUser = await this.findByEmail(user.email);
    if (!isUser) {
      throw new NotFoundException('invalid user');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, username, ...userData } = user;
    const userUpdate = { ...isUser, ...userData };
    if (isUser.email !== user.email || isUser.username !== user.username) {
      throw new NotFoundException('invalid user');
    }
    if (!isUser.username) {
      const userUpload = {
        ...userUpdate,
        username: user.username,
      };
      const userResponse = await this.userRepository.save(userUpload);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userData } = userResponse;
      return userData;
    }

    const userResponse = await this.userRepository.save(userUpdate);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userDataResponse } = userResponse;
    return userDataResponse;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async validateUsername(
    username: string,
    password: string,
  ): Promise<User | undefined> {
    const user = await this.findByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async getProfile(id: number): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ users: Partial<User>[]; total: number; totalPages: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.fullName) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    const skip = (page - 1) * limit;
    const [users, total] = await queryBuilder
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

    await this.userRepository.softDelete(userId); // Sử dụng soft delete
  }

  private sanitizeUser(user: User): Partial<User> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async sanitizeUserByAdmin(user: User): Promise<Partial<User>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
  public async createUserByAdmin(user: Partial<User>) {
    return this.userRepository.save(user);
  }

  async getUserStats(userId: number): Promise<{
    analysisScores: {
      listening: number;
      reading: number;
      grammar: number;
      comprehension: number;
    };
  }> {
    const testSessions = await this.testSessionRepository
      .createQueryBuilder('testSession')
      .leftJoinAndSelect('testSession.partScores', 'partScore')
      .leftJoinAndSelect('testSession.test', 'test')
      .where('testSession.user.id = :userId', { userId })
      .andWhere('testSession.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .orderBy('testSession.completedAt', 'DESC')
      .addGroupBy('testSession.id')
      .addGroupBy('test.id')
      .addGroupBy('partScore.id')
      .getMany();

    const partScores = testSessions.reduce((scores, session) => {
      return scores.concat(session.partScores || []);
    }, []);

    const maxScoresByPart = partScores.reduce((acc, score) => {
      if (!acc[score.partNumber] || acc[score.partNumber].score < score.score) {
        acc[score.partNumber] = score;
      }
      return acc;
    }, {});

    // const highestPartScores = Object.values(maxScoresByPart);
    // Calculate scores for each section
    const listeningParts = [1, 2, 3, 4];
    const readingParts = [5, 6, 7];
    const grammarParts = [5, 6];

    // Get total scores for each section
    const listeningScore = listeningParts.reduce((sum, part) => {
      const score = maxScoresByPart[part]?.score || 0;
      return sum + score;
    }, 0);

    const readingScore = readingParts.reduce((sum, part) => {
      const score = maxScoresByPart[part]?.score || 0;
      return sum + score;
    }, 0);

    const grammarScore = grammarParts.reduce((sum, part) => {
      const score = maxScoresByPart[part]?.score || 0;
      return sum + score;
    }, 0);

    // console.log('listeningScore', listeningScore);
    // console.log('readingScore', readingScore);
    // console.log('grammarScore', grammarScore);
    // Calculate percentages based on formulas
    const listeningPercentage = (listeningScore / 100) * 100;
    const readingPercentage = (readingScore / 100) * 100;
    const grammarPercentage = (grammarScore / 46) * 100;
    const comprehensionPercentage =
      ((listeningScore + readingScore) / 200) * 100;

    const scores = {
      listening: Math.round(listeningPercentage * 10) / 10,
      reading: Math.round(readingPercentage * 10) / 10,
      grammar: Math.round(grammarPercentage * 10) / 10,
      comprehension: Math.round(comprehensionPercentage * 10) / 10,
    };

    // console.log('scores', scores);

    return { analysisScores: scores };
  }

  async getUserTestHistory(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status: TestSessionStatus,
  ): Promise<{
    data: TestSession[];
    total: number;
    page: number;
    pages: number;
  }> {
    // Convert to numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const [data, total] = await this.testSessionRepository.findAndCount({
      where: {
        user: { id: userId },
        status: status,
      },
      relations: ['test', 'partScores'],
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      order: { completedAt: 'DESC' },
    });

    return {
      data,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    };
  }
  //lấy 10 bài test gần nhất.
  async analyzePartScores(userId: number) {
    // Get 10 most recent completed test sessions for the user
    const testSessions = await this.testSessionRepository.find({
      where: {
        user: { id: userId },
        status: TestSessionStatus.COMPLETED,
      },
      relations: ['partScores'],
      order: {
        completedAt: 'DESC',
      },
      take: 10,
    });

    // Initialize part score tracking
    const partScores = {
      part1: { total: 0, count: 0, maxScore: 6 },
      part2: { total: 0, count: 0, maxScore: 25 },
      part3: { total: 0, count: 0, maxScore: 39 },
      part4: { total: 0, count: 0, maxScore: 30 },
      part5: { total: 0, count: 0, maxScore: 30 },
      part6: { total: 0, count: 0, maxScore: 16 },
      part7: { total: 0, count: 0, maxScore: 54 },
    };

    // Aggregate scores for each part
    testSessions.forEach((session) => {
      console.log('session', session);
      if (session.partScores) {
        session.partScores.forEach((score) => {
          const partKey = `part${score.partNumber}` as keyof typeof partScores;
          partScores[partKey].total += score.score;
          partScores[partKey].count++;
        });
      }
    });

    // Calculate averages as percentages
    const averages = {
      part1:
        partScores.part1.count > 0
          ? Math.round(
              (partScores.part1.total /
                (partScores.part1.count * partScores.part1.maxScore)) *
                100,
            )
          : 0,
      part2:
        partScores.part2.count > 0
          ? Math.round(
              (partScores.part2.total /
                (partScores.part2.count * partScores.part2.maxScore)) *
                100,
            )
          : 0,
      part3:
        partScores.part3.count > 0
          ? Math.round(
              (partScores.part3.total /
                (partScores.part3.count * partScores.part3.maxScore)) *
                100,
            )
          : 0,
      part4:
        partScores.part4.count > 0
          ? Math.round(
              (partScores.part4.total /
                (partScores.part4.count * partScores.part4.maxScore)) *
                100,
            )
          : 0,
      part5:
        partScores.part5.count > 0
          ? Math.round(
              (partScores.part5.total /
                (partScores.part5.count * partScores.part5.maxScore)) *
                100,
            )
          : 0,
      part6:
        partScores.part6.count > 0
          ? Math.round(
              (partScores.part6.total /
                (partScores.part6.count * partScores.part6.maxScore)) *
                100,
            )
          : 0,
      part7:
        partScores.part7.count > 0
          ? Math.round(
              (partScores.part7.total /
                (partScores.part7.count * partScores.part7.maxScore)) *
                100,
            )
          : 0,
    };

    return {
      partAverages: averages,
      totalTests: testSessions.length,
    };
  }

  async getLeaderboard() {
    // Top 5 users có điểm cao nhất (mỗi user chỉ lấy điểm cao nhất)
    const topScorers = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .select([
        'DISTINCT ON (user.id) user.id as userId',
        'user.fullName as fullName',
        'user.avatar as avatar',
        'test_session.total_score as highestScore',
        'test.name as testName',
        'test_session.completedAt as achievedAt',
      ])
      .leftJoin('test_session.user', 'user')
      .leftJoin('test_session.test', 'test')
      .where('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .andWhere('test.type IN (:...types)', {
        types: [TestType.MINI_TEST, TestType.FULL_TEST],
      })
      .orderBy('user.id')
      .addOrderBy('test_session.total_score', 'DESC')
      .limit(5)
      .getRawMany();

    // Top 5 users hoạt động nhiều nhất (không thay đổi)
    const mostActive = await this.testSessionRepository
      .createQueryBuilder('test_session')
      .select([
        'user.id as userId',
        'user.fullName as fullName',
        'user.avatar as avatar',
        'COUNT(DISTINCT test_session.id) as totalTests',
        'AVG(test_session.total_score) as averageScore',
        'MAX(test_session.total_score) as highestScore',
      ])
      .leftJoin('test_session.user', 'user')
      .leftJoin('test_session.test', 'test')
      .where('test_session.status = :status', {
        status: TestSessionStatus.COMPLETED,
      })
      .andWhere('test.type IN (:...types)', {
        types: [TestType.MINI_TEST, TestType.FULL_TEST],
      })
      .groupBy('user.id')
      .addGroupBy('user.fullName')
      .addGroupBy('user.avatar')
      .orderBy('totalTests', 'DESC')
      .limit(5)
      .getRawMany();

    // Sort topScorers by highestScore after getting distinct users
    const sortedTopScorers = topScorers
      .sort((a, b) => b.highestscore - a.highestscore)
      .slice(0, 5);

    return {
      topScorers: sortedTopScorers.map((user) => ({
        userId: user.userid,
        fullName: user.fullname,
        avatar: user.avatar,
        highestScore: Math.round(user.highestscore),
        testName: user.testname,
        achievedAt: user.achievedat,
      })),
      mostActive: mostActive.map((user) => ({
        userId: user.userid,
        fullName: user.fullname,
        avatar: user.avatar,
        totalTests: parseInt(user.totaltests),
        averageScore: Math.round(user.averagescore),
        highestScore: Math.round(user.highestscore),
      })),
    };
  }
}
