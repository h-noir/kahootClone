// This file defines the interfaces used in this project

// Empty object type
export type EmptyObject = Record<string, never>;

// TimeoutId type
export type TimeoutId = ReturnType<typeof setTimeout> | null;

// State string constants
export const STATE_LOBBY = 'LOBBY';
export const STATE_QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN';
export const STATE_QUESTION_OPEN = 'QUESTION_OPEN';
export const STATE_QUESTION_CLOSE = 'QUESTION_CLOSE';
export const STATE_ANSWER_SHOW = 'ANSWER_SHOW';
export const STATE_FINAL_RESULTS = 'FINAL_RESULTS';
export const STATE_END = 'END';

// Action string constants
export const ACTION_NEXT_QUESTION = 'NEXT_QUESTION';
export const ACTION_SKIP_COUNTDOWN = 'SKIP_COUNTDOWN';
export const ACTION_GO_TO_ANSWER = 'GO_TO_ANSWER';
export const ACTION_GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS';
export const ACTION_END = 'END';

// dataStore.ts interfaces
export interface UserSession {
  token: string;
  userId: number;
}

export interface QuestionAnswer {
  answerId?: number;
  answer: string;
  correct: boolean;
  colour?: string;
}

export interface QuizQuestion {
  questionId?: number;
  question: string;
  duration: number;
  thumbnailUrl?: string;
  points: number;
  answers: QuestionAnswer[];
  timeCreated?: number;
  timeLastEdited?: number;
}

export interface Quiz {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  quizOwnerId: number[];
  usersAccessed: number[];
  questions: QuizQuestion[];
  questionIds: number[];
  duration: number;
  thumbnailUrl?: string;
  latestQuestionId: number;
  latestAnswerId: number;
  quizSessionIds: number[];
}

export interface Player {
  playerId: number;
  name: string;
  score: number;
}

export interface PlayerStatus {
  state: string;
  numQuestions: number;
  atQuestion: number;
}

export interface Submission {
  playerId: number;
  answerTime: number;
  answerIds: number[];
  score: number | null;
}

export interface UsersRankedByScore {
  name: string;
  score: number;
}

export interface SessionQuestionResults {
  questionId: number;
  playersCorrectList: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

export interface FinalSessionResults {
  usersRankedByScore: UsersRankedByScore[];
  questionResults: SessionQuestionResults[];
}

export interface SessionQuestion {
  questionId: number;
  startTime: number;
  submissions: Submission[];
  correctPlayersId: number[];
}

export interface Message {
  messageBody: string;
  playerId: number;
  playerName: string;
  timeSent: number;
}

export interface QuizInfo {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: QuizQuestion[];
  duration: number;
  thumbnailUrl?: string;
}

export interface QuizSession {
  quizSessionId: number;
  autoStartNum: number;
  state: string;
  atQuestion: number;
  players: Player[];
  sessionQuestion: SessionQuestion[];
  messages: Message[];
  metadata: QuizInfo;
  sessionOwnerToken: string;
}

export interface ViewSessions {
  activeSessions: number[];
  inactiveSessions: number[];
}

export interface QuizStatus {
  state: string;
  atQuestion: number;
  players: string[];
  metadata: QuizInfo;
}

export interface User {
  userId: number;
  nameFirst: string;
  nameLast: string;
  userEmail: string;
  userNewPassword: string;
  userOldPasswords: string[];
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  quizIds: number[];
  trash: Quiz[];
}

export interface DataStore {
  users: User[];
  quizzes: Quiz[];
  latestUserId: number;
  latestQuizId: number;
  latestQuizSessionId: number;
  latestPlayerId: number;
  userSessions: UserSession[];
  quizSessions: QuizSession[];
}

// auth.ts and quiz.ts interfaces
export interface Token {
  token: string;
}

export interface QuizId {
  quizId: number;
}

export interface QuestionId {
  questionId: number;
}

export interface NewQuestionId {
  newQuestionId: number;
}

export interface SessionId {
  sessionId: number;
}

export interface PlayerId {
  playerId: number;
}

export interface UrlCSV {
  url: string;
}

export interface CSVData {
  data: string;
}

export interface QuestionScoreAndRank {
  score: number;
  rank: number;
}

export interface PlayerResults {
  playerName: string;
  questionScoreAndRank: QuestionScoreAndRank[]
}

export interface UserDetails {
  user: {
    userId: number;
    name: string;
    email: string;
    numSuccessfulLogins: number;
    numFailedPasswordsSinceLastLogin: number;
  }
}

export interface QuizList {
  quizzes: Array<{quizId: number, name: string}>;
}

export interface Timer {
  quizSessionId: number;
  timeoutId: TimeoutId;
}

export interface TimerData {
  timers: Timer[];
}

export interface AnswerInfo {
  answerId: number,
  answer: string,
  colour: string
}

export interface CurrentQuestionInfo {
  questionId: number,
  question: string,
  duration: number,
  thumbnailUrl: string
  points: number,
  answers: AnswerInfo[]
}
