import {
  Body,
  // BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,

  // Request,
  Post,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { TestService } from './test.service';
import { RoleAdminCheck } from 'src/auth/guards/admin.guard';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';
import { Test } from './entities/test.entity';
import { UpdateTestDto } from './dto/UpdateTest.dto';
import { Part } from './entities/part.entity';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('list')
  async findAll(
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('partNumber') partNumber?: string,
    @Query('level') level?: string,
  ): Promise<{
    tests: Test[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const pageNumber = page ? parseInt(page) : 1;
    const limitNumber = limit ? parseInt(limit) : 10;
    const partNumberValue = partNumber ? parseInt(partNumber) : undefined;

    return this.testService.getListTest(
      type,
      pageNumber,
      limitNumber,
      search,
      partNumberValue,
      level,
    );
  }

  @Get('part')
  async getListPart(): Promise<Part[]> {
    return this.testService.getListPart();
  }

  @Get('part/:id')
  async getPart(@Param('id') id: number): Promise<Part> {
    return this.testService.findPartById(id);
  }

  @Get('test-history/:id')
  async getTestHistory(@Param('id') id: number) {
    return this.testService.testHistory(id);
  }

  @Post('submit/:testSessionId')
  async submitTest(
    @Param('id') id: number,
    @Param('testSessionId') testSessionId: number,
  ) {
    return this.testService.checkAnswer(testSessionId);
  }

  @UseGuards(AccessTokenGuard, RoleAdminCheck)
  @Post('create')
  async createTest(@Body('data') data: any) {
    // console.log('data', JSON.stringify(data, null, 2));
    return await this.testService.createTest(data);
  }

  @UseGuards(AccessTokenGuard, RoleAdminCheck)
  @Post('create-part')
  async createPart(@Body('data') data: any) {
    const test = await this.testService.createPartOfTest(data);
    return { message: 'Part created successfully', test };
  }

  @Post('update')
  async updateTest(@Body() updateTestDto: UpdateTestDto) {
    return await this.testService.updateTest(updateTestDto);
  }

  //Started test

  @UseGuards(AccessTokenGuard)
  @Post('start')
  async startTest(
    @Body()
    body: {
      user_id: number;
      test_id?: number;
      part_id?: number;
      timeRemaining: number;
    },
  ) {
    const testSession = await this.testService.createTestSession(
      body.user_id,
      body.test_id,
      body.part_id,
      body.timeRemaining * 60,
    );
    return testSession;
  }

  @UseGuards(AccessTokenGuard, RoleAdminCheck)
  @Delete('delete/:id')
  async deleteTest(@Param('id') id: number) {
    return await this.testService.deleteTest(id);
  }

  // @UseGuards(AccessTokenGuard)
  // @Get('result/:id')
  // async getResult(@Param('id') id: number) {
  //   return await this.testService.getResult(id);
  // }

  // @Get(':id/questions')
  // async getTestQuestions(@Param('id', ParseIntPipe) testId: number) {
  //   return this.testService.getTestQuestions(testId);
  // }

  @UseGuards(AccessTokenGuard)
  @Get('result/:id')
  async getResult(@Param('id', ParseIntPipe) id: number) {
    return this.testService.getTestQuestions(id);
  }

  @UseGuards(AccessTokenGuard)
  @Post('save-answer')
  async saveAnswer(
    @Body()
    body: {
      testId: number;
      testSessionId: number;
      questionId: number;
      answerId: number;
      timeRemaining: number;
    },
  ) {
    const { testId, testSessionId, questionId, answerId, timeRemaining } = body;
    return this.testService.saveAnswer(
      testId,
      testSessionId,
      questionId,
      answerId,
      timeRemaining,
    );
  }

  @Get('test-session-responses/:id')
  async getTestSessionResponses(@Param('id') id: number) {
    return this.testService.getTestSessionResponses(id);
  }

  @Get('test-review/:id')
  async getTestReview(@Param('id') id: number) {
    return this.testService.getTestReview(id);
  }

  @Get('recommended-level/:userId')
  async getRecommendedLevel(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('partNumber', ParseIntPipe) partNumber?: number,
  ) {
    return await this.testService.getRecommendedLevel(
      userId,
      page,
      limit,
      search,
      type,
      partNumber,
    );
  }

  @Get('statistics')
  async getTestStatistics(): Promise<{ type: string; count: number }[]> {
    return this.testService.getTestStatistics();
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<Test> {
    return this.testService.findById(id);
  }
}
