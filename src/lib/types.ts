export type Difficulty = "easy" | "medium" | "hard";

export type Category =
  | "combinational"
  | "sequential"
  | "fsm"
  | "arithmetic"
  | "memory"
  | "protocols";

export type SubmissionStatus =
  | "idle"
  | "running"
  | "PASSED"
  | "PARTIAL"
  | "FAILED"
  | "COMPILATION_ERROR"
  | "RUNTIME_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "OUTPUT_LIMIT_EXCEEDED"
  | "INVALID_SUBMISSION"
  | "JUDGE_ERROR"
  | "SYSTEM_ERROR"
  | "error";

export interface TestResult {
  name: string;
  passed: boolean;
  expected?: string;
  received?: string;
  message?: string;
}

export interface AchievementInfo {
  slug: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface CommunitySolution {
  id: number;
  title: string;
  content: string;
  code: string;
  tags: string[];
  username: string;
  displayName: string | null;
  upvotes: number;
  createdAt: string;
}

export interface SubmissionResult {
  status: SubmissionStatus;
  compilationMessage?: string;
  tests: TestResult[];
  score: number;
  testsPassed: number;
  testsTotal: number;
  executionTime: number;
  waveformId?: string;
  xpEarned: number;
  xpTotal: number;
  level: number;
  progressStatus: string | null;
  achievementsUnlocked: AchievementInfo[];
  submittedBy?: string;
  submittedByDisplay?: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  language: string;
  description: string;
  inputDescription: string;
  outputDescription: string;
  constraints: string[];
  examples: ProblemExample[];
  starterCode: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  referenceSolution?: string;
  publicTestCases?: PublicTestCase[];
  publicTestbenches?: PublicTestbench[];
  companyTags?: string[];
  acceptanceRate?: number;
  solvedCount?: number;
  locked?: boolean;
}

export interface ProblemExample {
  title: string;
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemListResponse {
  problems: Problem[];
  total: number;
}

export interface SubmissionRequest {
  problemSlug: string;
  language: string;
  code: string;
  testbenchCode?: string;
}

export interface User {
  id: string | number;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  xp: number;
  level: number;
  solvedCount: number;
  isAdmin?: boolean;
}

export interface DashboardData {
  problemsSolved: number;
  problemsAttempted: number;
  currentStreak: number;
  xp: number;
  level: number;
  xpInCurrentLevel: number;
  xpForNext: number;
  rank: number;
  totalSubmissions: number;
  successRate: number;
  difficultyStats: DifficultyStats[];
  recentSubmissions: DashboardSubmission[];
  categoryProgress: CategoryProgress[];
  languageProgress: LanguageProgress[];
  problemProgress: ProblemProgressItem[];
  recentAchievements: DashboardAchievement[];
  personalBests: PersonalBests;
  learningProgress: DashboardLearningProgress;
}

export interface DashboardLearningProgress {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  progressPercent: number;
  conceptsMastered: number;
  conceptsInProgress: number;
  recentLessons: { slug: string; title: string; completedAt: string }[];
}

export interface DashboardSubmission {
  id: number;
  problemSlug: string;
  problemTitle: string;
  difficulty: string;
  score: number;
  status: string;
  createdAt: string;
}

export interface CategoryProgress {
  category: string;
  solved: number;
  total: number;
}

export interface LanguageProgress {
  language: string;
  solved: number;
  total: number;
}

export interface ProblemProgressItem {
  problemId: number;
  slug: string;
  title: string;
  difficulty: string;
  status: string;
  bestScore: number;
  attempts: number;
}

export interface DifficultyStats {
  difficulty: string;
  solved: number;
  total: number;
  xp: number;
}

export interface DashboardAchievement {
  slug: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string;
}

export interface PersonalBests {
  bestScore: number;
  fastestAccepted: number | null;
  mostDifficult: string | null;
  longestStreak: number;
}

export interface Achievement {
  slug: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progressCurrent: number;
  progressTarget: number;
}

export interface UserAchievementsResponse {
  achievements: Achievement[];
  totalUnlocked: number;
  totalAvailable: number;
}

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "text-success bg-success/10 border-success/20",
  medium: "text-warning bg-warning/10 border-warning/20",
  hard: "text-error bg-error/10 border-error/20",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  combinational: "Combinational Logic",
  sequential: "Sequential Logic",
  fsm: "FSM",
  arithmetic: "Arithmetic",
  memory: "Memory",
  protocols: "Protocols",
};

export interface WaveformSignalChange {
  time: number;
  value: string;
}

export interface WaveformSignal {
  name: string;
  width: number;
  changes: WaveformSignalChange[];
}

export interface WaveformData {
  waveformId: string;
  format: string;
  duration: number;
  timescale: string;
  fileSize: number;
  signalCount: number;
  signals: WaveformSignal[];
}

export type WaveformDisplayMode = "binary" | "hex" | "decimal";

export interface LearningPathSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  moduleCount: number;
}

export interface LearningPathDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  modules: LearningModuleDetail[];
}

export interface LearningModuleDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedMinutes: number;
  orderIndex: number;
  status?: string;
  hasQuiz: boolean;
}

export interface LessonDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  estimatedMinutes: number;
  orderIndex: number;
  status: string;
  prerequisitesMet: boolean;
  prerequisites: { slug: string; title: string }[];
  hasQuiz: boolean;
  relatedProblems: { slug: string; title: string; difficulty: string; category: string }[];
  prevLesson: { slug: string; title: string } | null;
  nextLesson: { slug: string; title: string } | null;
  module: { slug: string; title: string } | null;
  path: { slug: string; title: string } | null;
}

export interface QuizQuestion {
  id: number;
  question: string;
  questionType: string;
  options: string;
  orderIndex: number;
}

export interface QuizDetail {
  id: number;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  passed: boolean;
  results: {
    question: string;
    correct: boolean;
    correctAnswer: string;
    explanation: string;
  }[];
  xpEarned: number;
}

export interface LearningProgressData {
  paths: LearningPathProgress[];
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export interface LearningPathProgress {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  modules: LearningModuleProgress[];
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

export interface LearningModuleProgress {
  id: number;
  slug: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: LessonProgressItem[];
  completedLessons: number;
  totalLessons: number;
}

export interface LessonProgressItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedMinutes: number;
  orderIndex: number;
  status: string;
  prerequisitesMet: boolean;
}

export interface ConceptMastery {
  slug: string;
  name: string;
  category: string;
  masteryScore: number;
  level: string;
  solvedCount: number;
  failedCount: number;
}

export interface LearningRecommendations {
  nextLesson: {
    slug: string;
    title: string;
    moduleSlug: string;
    moduleTitle: string;
    pathSlug: string;
    pathTitle: string;
  } | null;
  practiceProblem: {
    slug: string;
    title: string;
    difficulty: string;
  } | null;
  weakConcept: {
    slug: string;
    name: string;
    masteryScore: number;
  } | null;
  reason: string;
}

export type LessonStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export const LESSON_STATUS_COLORS: Record<LessonStatus, string> = {
  NOT_STARTED: "text-text-dim bg-surface border-border",
  IN_PROGRESS: "text-warning bg-warning/10 border-warning/20",
  COMPLETED: "text-accent bg-accent/10 border-accent/20",
};

export const MASTERY_LEVEL_COLORS: Record<string, string> = {
  beginner: "text-text-dim",
  developing: "text-warning",
  proficient: "text-info",
  mastered: "text-accent",
};

export type AITask =
  | "explain_code"
  | "explain_error"
  | "debug_submission"
  | "hint"
  | "explain_waveform"
  | "ask";

export interface AIChatRequest {
  task: AITask;
  problemSlug?: string;
  submissionId?: number;
  code?: string;
  compilerError?: string;
  waveformId?: string;
  lessonSlug?: string;
  userQuestion?: string;
  hintLevel?: number;
  conceptTags?: string[];
}

export interface AIChatResponse {
  response: string;
  model: string;
  tokensUsed: number;
  conversationId: number | null;
}

export interface AIConversationSummary {
  id: number;
  taskType: string;
  problemId: number | null;
  lessonId: number | null;
  createdAt: string;
}

export interface AIConversationDetail {
  id: number;
  taskType: string;
  messages: AIMessageItem[];
}

export interface AIMessageItem {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

export interface AIFeedbackRequest {
  messageId?: number;
  rating: "helpful" | "not_helpful";
  comment?: string;
  taskType?: string;
}

export interface PublicTestCase {
  name: string;
  description: string;
  input: string;
  expected: string;
}

export interface PublicTestbench {
  name: string;
  testbench: string;
  language: string;
}

export interface ProblemSubmission {
  id: number;
  score: number;
  status: string;
  testsPassed: number;
  testsTotal: number;
  executionTime: number;
  language: string;
  code: string;
  createdAt: string;
}

export interface Discussion {
  id: number;
  content: string;
  username: string;
  displayName: string | null;
  upvotes: number;
  isSolution: boolean;
  replyCount: number;
  replies: DiscussionReply[];
  createdAt: string;
}

export interface DiscussionReply {
  id: number;
  content: string;
  username: string;
  displayName: string | null;
  upvotes: number;
  isSolution: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  displayName: string | null;
  xp: number;
  level: number;
  solvedCount: number;
  progress: number;
  streak: number;
  achievements: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalUsers: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserRankResponse {
  rank: number;
  xp: number;
  level: number;
  solvedCount: number;
  progress: number;
  streak: number;
  achievements: number;
}

export interface DailyChallenge {
  date: string;
  problem: Problem;
  streak: number;
  bonusXp: number;
  solvedToday: boolean;
  participantsCount: number;
}

export interface ContestProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
  solvedCount: number;
}

export interface Contest {
  id: string;
  slug: string;
  title: string;
  edition: number;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: "upcoming" | "active" | "past";
  registered: boolean;
  registeredCount: number;
  sponsor?: {
    name: string;
    logo?: string;
    tagline: string;
  };
  problems: ContestProblem[];
}

export interface ContestLeaderboardEntry {
  rank: number;
  username: string;
  displayName: string | null;
  score: number;
  finishTimeSeconds: number;
  problemsSolved: number;
  penaltyMinutes: number;
}
