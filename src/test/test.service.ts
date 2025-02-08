import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Test, TestLevel, TestType } from './entities/test.entity';
import { Repository } from 'typeorm';
import { Part } from './entities/part.entity';
import { Section } from './entities/section.entity';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { UpdateTestDto } from './dto/UpdateTest.dto';
import { TestSession, TestSessionStatus } from './entities/test-session.entity';
import { Response } from './entities/response.entity';
import { PartScore } from './entities/part-score.entity';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Part)
    private readonly partRepository: Repository<Part>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(TestSession)
    private readonly testSessionRepository: Repository<TestSession>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    @InjectRepository(PartScore)
    private readonly partScoreRepository: Repository<PartScore>,
  ) {}
  //CRUD Test

  async createTest(data: Partial<Test>): Promise<Test> {
    const queryRunner =
      this.testRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        name,
        type,
        total_score,
        total_questions,
        total_time,
        partNumber,
        sections,
        level,
      } = data;

      // Tạo test
      const test = this.testRepository.create({
        name,
        type,
        total_score,
        total_questions,
        total_time,
        partNumber,
        level,
      });
      await queryRunner.manager.save(test);

      // Tạo sections
      for (const sectionData of sections) {
        const { name: sectionName, type: sectionType, parts } = sectionData;

        // Tạo section
        const section = this.sectionRepository.create({
          name: sectionName,
          type: sectionType,
          test,
        });
        await queryRunner.manager.save(section);

        // Tạo parts
        for (const partData of parts) {
          const {
            partName,
            description,
            partNumber,
            questions,
            numberOfQuestions,
          } = partData;

          // Tạo part
          const part = this.partRepository.create({
            partName,
            description,
            partNumber,
            numberOfQuestions,
            section,
          });
          await queryRunner.manager.save(part);

          // Tạo questions và answers
          for (const questionData of questions) {
            const {
              content,
              type,
              audio_url,
              image_url,
              answers,
              number,
              passage,
              group,
            } = questionData;

            // Tạo question
            const question = this.questionRepository.create({
              content,
              type,
              audio_url,
              image_url,
              part,
              number,
              passage,
              group,
            });
            await queryRunner.manager.save(question);

            // Tạo answers cho question
            for (const answerData of answers) {
              const { content, is_correct } = answerData;

              const answer = this.answerRepository.create({
                content,
                is_correct,
                question,
              });
              await queryRunner.manager.save(answer);
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return test;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error creating test: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async createPartOfTest(data: Partial<Part>) {
    await this.partRepository.save(data);
  }

  async getListTest(
    type?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    partNumber?: number,
    level?: string,
  ): Promise<{
    tests: Test[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.testRepository.createQueryBuilder('test');
    // Add type filter if provided
    if (type) {
      queryBuilder.andWhere('test.type = :type', { type });
    }

    // Add search condition if provided
    if (search) {
      queryBuilder.andWhere('LOWER(test.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    // Add partNumber filter if provided
    if (partNumber) {
      queryBuilder.andWhere('test.partNumber = :partNumber', { partNumber });
    }

    // Add level filter if provided
    if (level) {
      queryBuilder.andWhere('test.level = :level', { level });
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count and tests with pagination
    const [tests, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      tests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getListPart(): Promise<Part[]> {
    return await this.partRepository.find({ relations: ['section'] });
  }

  async updateTest(updateTestDto: UpdateTestDto): Promise<Test> {
    const { id, name, total_score, sections } = updateTestDto;

    const test = await this.testRepository.findOne({
      where: { id },
      relations: ['sections'],
    });
    if (!test) {
      throw new NotFoundException(`Test with id ${id} not found`);
    }

    test.name = name;
    test.total_score = total_score;

    if (sections) {
      for (const sectionDto of sections) {
        let section: Section;

        if (sectionDto.id) {
          section = await this.sectionRepository.findOne({
            where: { id: sectionDto.id },
            relations: ['parts'],
          });
          if (!section)
            throw new NotFoundException(
              `Section with id ${sectionDto.id} not found`,
            );
        } else {
          section = this.sectionRepository.create();
        }

        section.name = sectionDto.name;

        if (sectionDto.parts) {
          for (const partDto of sectionDto.parts) {
            let part: Part;

            if (partDto.id) {
              part = await this.partRepository.findOne({
                where: { id: partDto.id },
                relations: ['questions'],
              });
              if (!part)
                throw new NotFoundException(
                  `Part with id ${partDto.id} not found`,
                );
            } else {
              part = this.partRepository.create();
            }

            part.partName = partDto.name;
            part.description = partDto.description;
            part.partNumber = partDto.partNumber;

            if (partDto.questions) {
              for (const questionDto of partDto.questions) {
                let question: Question;

                if (questionDto.id) {
                  question = await this.questionRepository.findOne({
                    where: { id: questionDto.id },
                    relations: ['answers'],
                  });
                  if (!question)
                    throw new NotFoundException(
                      `Question with id ${questionDto.id} not found`,
                    );
                } else {
                  question = this.questionRepository.create();
                }

                question.content = questionDto.content;
                question.type = questionDto.type;

                if (questionDto.answers) {
                  for (const answerDto of questionDto.answers) {
                    let answer: Answer;

                    if (answerDto.id) {
                      answer = await this.answerRepository.findOne({
                        where: { id: answerDto.id },
                      });
                      if (!answer)
                        throw new NotFoundException(
                          `Answer with id ${answerDto.id} not found`,
                        );
                    } else {
                      answer = this.answerRepository.create();
                    }

                    answer.content = answerDto.content;
                    answer.is_correct = answerDto.is_correct;

                    await this.answerRepository.save(answer);
                    if (!question.answers) question.answers = [];
                    question.answers.push(answer);
                  }
                }

                await this.questionRepository.save(question);
                if (!part.questions) part.questions = [];
                part.questions.push(question);
              }
            }

            await this.partRepository.save(part);
            if (!section.parts) section.parts = [];
            section.parts.push(part);
          }
        }

        await this.sectionRepository.save(section);
        if (!test.sections) test.sections = [];
        test.sections.push(section);
      }
    }

    return await this.testRepository.save(test);
  }

  async findById(id: number): Promise<Test> {
    // Validate id
    if (!id || isNaN(id)) {
      throw new BadRequestException('Invalid test ID');
    }

    const test = await this.testRepository.findOne({
      where: { id },
      relations: [
        'sections',
        'sections.parts',
        'sections.parts.questions',
        'sections.parts.questions.answers',
      ],
    });

    if (!test) {
      throw new NotFoundException(`Test with id ${id} not found`);
    }

    return test;
  }

  async findPartById(id: number): Promise<Part> {
    return await this.partRepository.findOne({
      where: { id },
      relations: ['questions'],
    });
  }

  async createTestSession(
    user_id: number,
    test_id: number,
    part_id: number,
    timeRemaining: number,
  ): Promise<TestSession> {
    if ((!test_id && !part_id) || (test_id && part_id)) {
      throw new Error(
        'Either test_id or part_id must be provided, but not both.',
      );
    }
    const session = await this.testSessionRepository.create({
      user: { id: user_id },
      test: test_id ? { id: test_id } : null,
      part: part_id ? { id: part_id } : null,
      startedAt: new Date(),
      status: TestSessionStatus.IN_PROGRESS,
      timeRemaining: timeRemaining,
    });
    return this.testSessionRepository.save(session);
  }

  async checkAnswer(testSession_id: number): Promise<any> {
    const queryRunner =
      this.testRepository.manager.connection.createQueryRunner();

    try {
      // Bắt đầu transaction
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const testSession = await queryRunner.manager.findOne(TestSession, {
        where: { id: testSession_id },
        relations: [
          'responses',
          'responses.answer',
          'responses.question',
          'test',
          'test.sections',
          'test.sections.parts',
          'test.sections.parts.questions',
          'test.sections.parts.questions.answers',
          'partScores',
        ],
      });

      if (!testSession) {
        throw new NotFoundException('Test session not found');
      }

      // console.log('testSession', testSession.status);
      if (testSession.status === TestSessionStatus.COMPLETED) {
        throw new BadRequestException('Test already completed');
      }

      // Tạo Map để ánh xạ từ question.id sang trạng thái isCorrect
      const responseMap = new Map();
      testSession.responses.forEach((response) => {
        responseMap.set(response.question.id, response.isCorrect);
      });

      // Tính điểm cho từng part
      const partScores = [];
      for (const section of testSession.test.sections) {
        for (const part of section.parts) {
          let correctAnswers = 0;

          // Đếm số câu đúng trong part
          part.questions.forEach((question) => {
            if (responseMap.get(question.id)) {
              correctAnswers++;
            }
          });

          // Tạo và lưu part score với số câu đúng
          const partScore = queryRunner.manager.create(PartScore, {
            testSession: testSession,
            part: part,
            partNumber: part.partNumber,
            score: correctAnswers, // Lưu trực tiếp số câu đúng
          });
          await queryRunner.manager.save(PartScore, partScore);
          partScores.push({
            partId: part.id,
            partName: part.partName,
            partNumber: part.partNumber,
            correctAnswers,
            totalQuestions: part.questions.length,
          });

          console.log(
            `Part ${part.partNumber}: ${correctAnswers}/${part.questions.length} correct answers`,
          );
        }
      }

      // Tính tổng số câu đúng
      // Tính điểm cho từng section
      const listeningCorrectAnswers = partScores
        .filter((part) => part.partNumber >= 1 && part.partNumber <= 4)
        .reduce((sum, part) => sum + part.correctAnswers, 0);

      // Calculate total correct answers for reading (parts 5-7)
      const readingCorrectAnswers = partScores
        .filter((part) => part.partNumber >= 5 && part.partNumber <= 7)
        .reduce((sum, part) => sum + part.correctAnswers, 0);

      let listeningScore = 0;
      let readingScore = 0;

      if (testSession.test.type === TestType.PART_TEST) {
        // If it's a PART_TEST, each correct answer is worth 5 points
        listeningScore = listeningCorrectAnswers * 5;
        readingScore = readingCorrectAnswers * 5;
      } else {
        // For full tests, calculate scores normally
        listeningScore = await this.getScore(
          listeningCorrectAnswers,
          'listening',
          testSession.test.type,
        );
        readingScore = await this.getScore(
          readingCorrectAnswers,
          'reading',
          testSession.test.type,
        );
      }

      // Cập nhật trạng thái test session
      const newTestSession = await this.testSessionRepository.findOne({
        where: { id: testSession_id },
        relations: ['responses'],
      });

      newTestSession.completedAt = new Date();
      newTestSession.status = TestSessionStatus.COMPLETED;
      newTestSession.listening_score = listeningScore;
      newTestSession.reading_score = readingScore;
      newTestSession.total_score = listeningScore + readingScore;
      await this.testSessionRepository.save(newTestSession);

      // Commit transaction trước khi return
      await queryRunner.commitTransaction();

      return {
        testSessionId: testSession.id,
        totalScore: testSession.total_score,
        partScores,
        completedAt: testSession.completedAt,
      };
    } catch (error) {
      // Chỉ rollback khi transaction đã được start
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      // Giải phóng queryRunner
      await queryRunner.release();
    }
  }

  async testHistory(user_id: number): Promise<TestSession[]> {
    return await this.testSessionRepository.find({
      where: { user: { id: user_id } },
      relations: ['user', 'test', 'test.sections'],
    });
  }

  async deleteTest(id: number): Promise<void> {
    await this.testRepository.delete(id);
  }

  private calculatePartScore(
    correctCount: number,
    totalQuestions: number,
  ): number {
    return Math.round((correctCount / totalQuestions) * 100);
  }

  private calculateTotalScore(partScores: PartScore[]): number {
    if (partScores.length === 0) return 0;
    const totalScore = partScores.reduce((sum, part) => sum + part.score, 0);
    return Math.round(totalScore / partScores.length);
  }

  async getResult(id: number): Promise<TestSession> {
    return await this.testSessionRepository.findOne({
      where: { id },
      relations: ['test', 'part'],
    });
  }

  async getScore(
    numberCorrect: number,
    type: string,
    typeTest: string,
  ): Promise<number> {
    if (typeTest === TestType.FULL_TEST) {
      const ReadingTableScore = new Map([
        [0, 5],
        [1, 5],
        [2, 5],
        [3, 10],
        [4, 15],
        [5, 20],
        [6, 25],
        [7, 30],
        [8, 35],
        [9, 40],
        [10, 45],
        [11, 50],
        [12, 55],
        [13, 60],
        [14, 65],
        [15, 70],
        [16, 75],
        [17, 80],
        [18, 85],
        [19, 90],
        [20, 95],
        [21, 100],
        [22, 105],
        [23, 110],
        [24, 115],
        [25, 120],
        [26, 125],
        [27, 130],
        [28, 135],
        [29, 140],
        [30, 145],
        [31, 150],
        [32, 155],
        [33, 160],
        [34, 165],
        [35, 170],
        [36, 175],
        [37, 180],
        [38, 185],
        [39, 190],
        [40, 195],
        [41, 200],
        [42, 205],
        [43, 210],
        [44, 215],
        [45, 220],
        [46, 225],
        [47, 230],
        [48, 235],
        [49, 240],
        [50, 245],
        [51, 250],
        [52, 255],
        [53, 260],
        [54, 265],
        [55, 270],
        [56, 275],
        [57, 280],
        [58, 285],
        [59, 290],
        [60, 295],
        [61, 300],
        [62, 305],
        [63, 310],
        [64, 315],
        [65, 320],
        [66, 325],
        [67, 330],
        [68, 335],
        [69, 340],
        [70, 345],
        [71, 350],
        [72, 355],
        [73, 360],
        [74, 365],
        [75, 370],
        [76, 375],
        [77, 380],
        [78, 385],
        [79, 390],
        [80, 395],
        [81, 400],
        [82, 405],
        [83, 410],
        [84, 415],
        [85, 420],
        [86, 425],
        [87, 430],
        [88, 435],
        [89, 440],
        [90, 445],
        [91, 450],
        [92, 455],
        [93, 460],
        [94, 465],
        [95, 470],
        [96, 475],
        [97, 480],
        [98, 485],
        [99, 490],
        [100, 495],
      ]);
      const ListeningTableScore = new Map([
        [0, 5],
        [1, 15],
        [2, 20],
        [3, 25],
        [4, 30],
        [5, 35],
        [6, 40],
        [7, 45],
        [8, 50],
        [9, 55],
        [10, 60],
        [11, 65],
        [12, 70],
        [13, 75],
        [14, 80],
        [15, 85],
        [16, 90],
        [17, 95],
        [18, 100],
        [19, 105],
        [20, 110],
        [21, 115],
        [22, 120],
        [23, 125],
        [24, 130],
        [25, 135],
        [26, 140],
        [27, 145],
        [28, 150],
        [29, 155],
        [30, 160],
        [31, 165],
        [32, 170],
        [33, 175],
        [34, 180],
        [35, 185],
        [36, 190],
        [37, 195],
        [38, 200],
        [39, 205],
        [40, 210],
        [41, 215],
        [42, 220],
        [43, 225],
        [44, 230],
        [45, 235],
        [46, 240],
        [47, 245],
        [48, 250],
        [49, 255],
        [50, 260],
        [51, 265],
        [52, 270],
        [53, 275],
        [54, 280],
        [55, 285],
        [56, 290],
        [57, 295],
        [58, 300],
        [59, 305],
        [60, 310],
        [61, 315],
        [62, 320],
        [63, 325],
        [64, 330],
        [65, 335],
        [66, 340],
        [67, 345],
        [68, 350],
        [69, 355],
        [70, 360],
        [71, 365],
        [72, 370],
        [73, 375],
        [74, 385],
        [75, 395],
        [76, 400],
        [77, 405],
        [78, 410],
        [79, 415],
        [80, 420],
        [81, 425],
        [82, 430],
        [83, 435],
        [84, 440],
        [85, 445],
        [86, 450],
        [87, 455],
        [88, 460],
        [89, 465],
        [90, 470],
        [91, 475],
        [92, 480],
        [93, 485],
        [94, 490],
        [95, 495],
        [96, 495],
        [97, 495],
        [98, 495],
        [99, 495],
      ]);
      if (type === 'reading') {
        return ReadingTableScore.get(numberCorrect) || 0;
      } else if (type === 'listening') {
        return ListeningTableScore.get(numberCorrect) || 0;
      }
      return 0;
    } else {
      const ListeningTableScore = new Map([
        [0, 5],
        [1, 10],
        [2, 10],
        [3, 15],
        [4, 15],
        [5, 20],
        [6, 25],
        [7, 30],
        [8, 40],
        [9, 50],
        [10, 60],
        [11, 70],
        [12, 80],
        [13, 90],
        [14, 100],
        [15, 110],
        [16, 120],
        [17, 130],
        [18, 140],
        [19, 150],
        [20, 160],
        [21, 170],
        [22, 180],
        [23, 190],
        [24, 200],
        [25, 210],
        [26, 220],
        [27, 230],
        [28, 240],
        [29, 250],
        [30, 260],
        [31, 270],
        [32, 280],
        [33, 290],
        [34, 300],
        [35, 310],
        [36, 320],
        [37, 330],
        [38, 340],
        [39, 350],
        [40, 360],
        [41, 370],
        [42, 380],
        [43, 390],
        [44, 400],
        [45, 410],
        [46, 420],
        [47, 430],
        [48, 440],
        [49, 480],
        [50, 495],
      ]);

      const ReadingTableScore = new Map([
        [0, 5],
        [1, 5],
        [2, 5],
        [3, 10],
        [4, 15],
        [5, 20],
        [6, 25],
        [7, 30],
        [8, 40],
        [9, 50],
        [10, 60],
        [11, 70],
        [12, 80],
        [13, 90],
        [14, 100],
        [15, 110],
        [16, 120],
        [17, 130],
        [18, 140],
        [19, 150],
        [20, 160],
        [21, 170],
        [22, 180],
        [23, 190],
        [24, 200],
        [25, 210],
        [26, 220],
        [27, 230],
        [28, 240],
        [29, 250],
        [30, 260],
        [31, 270],
        [32, 280],
        [33, 290],
        [34, 300],
        [35, 310],
        [36, 320],
        [37, 330],
        [38, 340],
        [39, 350],
        [40, 360],
        [41, 370],
        [42, 380],
        [43, 390],
        [44, 400],
        [45, 410],
        [46, 420],
        [47, 430],
        [48, 440],
        [49, 480],
        [50, 495],
      ]);

      if (type === 'reading') {
        return ReadingTableScore.get(numberCorrect) || 0;
      } else if (type === 'listening') {
        return ListeningTableScore.get(numberCorrect) || 0;
      }
      return 0;
    }
  }

  async getTestQuestions(testId: number): Promise<{
    testName: string;
    sections: {
      name: string;
      type: string;
      parts: {
        partName: string;
        partNumber: number;
        questions: {
          id: number;
          content: string;
          number: number;
          correctAnswer: {
            id: number;
            content: string;
          };
        }[];
      }[];
    }[];
  }> {
    const test = await this.testRepository.findOne({
      where: { id: testId },
      relations: [
        'sections',
        'sections.parts',
        'sections.parts.questions',
        'sections.parts.questions.answers',
      ],
      order: {
        sections: {
          parts: {
            partNumber: 'ASC',
            questions: {
              number: 'ASC',
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    return {
      testName: test.name,
      sections: test.sections.map((section) => ({
        name: section.name,
        type: section.type,
        parts: section.parts.map((part) => ({
          partName: part.partName,
          partNumber: part.partNumber,
          questions: part.questions.map((question) => {
            const correctAnswer = question.answers.find(
              (answer) => answer.is_correct,
            );
            return {
              id: question.id,
              content: question.content,
              number: question.number,
              correctAnswer: correctAnswer
                ? {
                    id: correctAnswer.id,
                    content: correctAnswer.content,
                  }
                : null,
            };
          }),
        })),
      })),
    };
  }

  async saveAnswer(
    testId: number,
    testSessionId: number,
    questionId: number,
    answerId: number,
    timeRemaining: number,
  ): Promise<{ message: string }> {
    const queryRunner =
      this.testRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    console.log('testSessionId', testSessionId);
    try {
      // Kiểm tra test session
      const testSession = await this.testSessionRepository.findOne({
        where: {
          id: testSessionId,
          test: { id: testId },
          status: TestSessionStatus.IN_PROGRESS,
        },
      });
      console.log('testSession', testSession);

      if (!testSession) {
        throw new NotFoundException('Test session not found or completed');
      }

      // Cập nhật thời gian còn lại
      await this.testSessionRepository.update(
        { id: testSessionId },
        {
          timeRemaining: timeRemaining,
        },
      );

      // Lấy đáp án đúng để kiểm tra
      const correctAnswer = await this.answerRepository.findOne({
        where: {
          question: { id: questionId },
          is_correct: true,
        },
      });

      if (!correctAnswer) {
        throw new NotFoundException('Correct answer not found');
      }

      // Kiểm tra câu trả lời đã tồn tại
      const existingResponse = await this.responseRepository.findOne({
        where: {
          testSession: { id: testSessionId },
          question: { id: questionId },
        },
      });

      const isCorrect = correctAnswer.id === answerId;

      if (existingResponse) {
        // Cập nhật câu trả lời cũ
        await this.responseRepository.update(existingResponse.id, {
          answer: { id: answerId },
          isCorrect: isCorrect,
        });
      } else {
        // Tạo câu trả lời mới
        const newResponse = this.responseRepository.create({
          testSession: testSession,
          question: { id: questionId },
          answer: { id: answerId },
          isCorrect: isCorrect,
        });
        await queryRunner.manager.save(Response, newResponse);
      }

      await queryRunner.commitTransaction();
      return { message: 'Answer saved successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTestSessionResponses(testSessionId: number): Promise<TestSession> {
    const testSession = await this.testSessionRepository.findOne({
      where: { id: testSessionId },
      relations: ['responses', 'responses.answer', 'responses.question'],
      select: {
        responses: {
          id: true,
          answer: {
            id: true,
            content: true,
          },
          question: {
            id: true,
            content: true,
          },
        },
      },
    });

    if (!testSession) {
      throw new NotFoundException('Test session not found');
    }

    return testSession;
  }

  async getTestReview(testSessionId: number): Promise<TestSession> {
    const testSession = await this.testSessionRepository.findOne({
      where: { id: testSessionId },
      relations: [
        'test',
        'test.sections',
        'test.sections.parts',
        'test.sections.parts.questions',
        'test.sections.parts.questions.answers',
        'responses',
        'responses.answer',
        'responses.question',
      ],
    });

    if (!testSession) {
      throw new NotFoundException('Test session not found');
    }

    // Map responses to questions
    const responseMap = new Map();
    testSession.responses?.forEach((response) => {
      if (response?.question?.id) {
        responseMap.set(response.question.id, response);
      }
    });

    // Add response data to questions if exists
    testSession.test?.sections?.forEach((section) => {
      section.parts?.forEach((part) => {
        part.questions?.forEach((question) => {
          if (question?.id) {
            question['userResponse'] = responseMap.get(question.id) || null;
          }
        });
      });
    });

    return testSession;
  }

  async getRecommendedLevel(
    userId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
    type?: string,
    partNumber?: number,
  ): Promise<{
    recommendedLevel: string;
    highestScore: number | null;
    message: string;
    recommendedTests: Test[];
    total: number;
    totalPages: number;
  }> {
    // Get highest score logic remains the same
    const highestScoreSession = await this.testSessionRepository.findOne({
      where: {
        user: { id: userId },
        status: TestSessionStatus.COMPLETED,
      },
      order: { total_score: 'DESC' },
    });

    const highestScore = highestScoreSession?.total_score ?? null;
    let recommendedLevel: string;
    let message: string;

    if (!highestScore) {
      recommendedLevel = TestLevel.EASY;
      message = 'As a new user, we recommend starting with easy level tests.';
    } else if (highestScore >= 500) {
      recommendedLevel = TestLevel.ADVANCED;
      message = `Based on your highest score of ${highestScore}, we recommend advanced level tests to challenge yourself.`;
    } else if (highestScore >= 255) {
      recommendedLevel = TestLevel.NORMAL;
      message = `With your highest score of ${highestScore}, normal level tests would be most suitable for your current level.`;
    } else {
      recommendedLevel = TestLevel.EASY;
      message = `With your highest score of ${highestScore}, we recommend practicing more with easy level tests to build a strong foundation.`;
    }

    // Create query builder for more complex filtering
    const queryBuilder = this.testRepository.createQueryBuilder('test');

    // Base condition for recommended level
    queryBuilder.where('test.level = :level', { level: recommendedLevel });

    // Add search condition if provided
    if (search) {
      queryBuilder.andWhere('LOWER(test.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    // Add type filter if provided (Mini test, Full test)
    if (type) {
      queryBuilder.andWhere('test.type = :type', { type });
    }

    // Add part number filter if provided
    if (partNumber) {
      queryBuilder.andWhere('test.partNumber = :partNumber', { partNumber });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count and tests
    const [recommendedTests, total] = await queryBuilder
      .orderBy('test.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      recommendedLevel,
      highestScore,
      message,
      recommendedTests,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTestStatistics(): Promise<{ type: string; count: number }[]> {
    return await this.testRepository
      .createQueryBuilder('test')
      .select('test.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('test.type')
      .getRawMany();
  }
}
