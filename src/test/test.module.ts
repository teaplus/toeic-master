import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from './entities/test.entity';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { Part } from './entities/part.entity';
import { Section } from './entities/section.entity';
import { Question } from './entities/question.entity';
import { Answer } from './entities/answer.entity';
import { TokensModule } from 'src/common/tokens/tokens.module';
import { TestSession } from './entities/test-session.entity';
import { Response } from './entities/response.entity';
import { PartScore } from './entities/part-score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Test,
      Part,
      Section,
      Question,
      Answer,
      TestSession,
      Response,
      PartScore,
    ]),
    TokensModule,
  ],
  controllers: [TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule {}
