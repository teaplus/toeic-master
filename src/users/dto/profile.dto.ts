import { TestSession } from 'src/test/entities/test-session.entity';
import { User } from '../user.entity';

export class ProfileDTO {
  id: number;
  email: string;
  username: string;
  address: string;
  phoneNumber: string;
  totalFullTests: number;
  totalMiniTests: number;
  highestFullTestScore: number;
}

interface TestStats {
  totalFullTests: number;
  totalMiniTests: number;
  totalPracticeTests: number;
  averageScore: number;
  recentTests: TestSession[];
}

export interface UserWithStats extends User {
  testStats: TestStats;
  testHistory: {
    recent: any[];
    stats: {
      totalFullTests: number;
      totalMiniTests: number;
      totalPracticeTests: number;
      averageScore: number;
      highestScore: number;
      analysisScores: {
        listening: number;
        reading: number;
        grammar: number;
        comprehension: number;
      };
    };
  };
}
