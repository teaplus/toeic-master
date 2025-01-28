import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateAnswerDto {
  @IsOptional()
  id?: number;

  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  is_correct: boolean;
}

class UpdateQuestionDto {
  @IsOptional()
  id?: number;

  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAnswerDto)
  answers?: UpdateAnswerDto[];
}

class UpdatePartDto {
  @IsOptional()
  id?: number;

  @IsNotEmpty()
  name: string;

  @IsOptional()
  description: string;

  @IsNotEmpty()
  partNumber: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionDto)
  questions?: UpdateQuestionDto[];
}

class UpdateSectionDto {
  @IsOptional()
  id?: number;

  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePartDto)
  parts?: UpdatePartDto[];
}

export class UpdateTestDto {
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  total_score: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSectionDto)
  sections?: UpdateSectionDto[];
}

export class SubmitTestDto {
  parts: part[];
}

class part {
  part_id: number;
  answers: {
    questionId: number;
    answerId: number;
  }[];
}
