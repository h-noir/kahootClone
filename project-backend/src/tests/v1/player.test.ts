import {
  requestClear,
  requestAdminAuthRegister,
  requestAdminQuizSessionStart,
  requestPlayerJoin,
  v2requestAdminQuizCreate,
  v2requestAdminQuizQuestionCreate,
  requestPlayerStatus,
  v2requestAdminQuizInfo,
  requestPlayerQuestionResults,
  requestPlayerQuestionSubmitAnswer,
  requestAdminQuizSessionStateUpdate,
  requestAdminQuizSessionStatus,
  requestPlayerSendChatMessage,
  requestPlayerChatView,
  requestPlayerCurrQuestionInfo,
  requestPlayerSessionFinalResults,
  sleepSync,
} from '../../requestHelper';

import {
  PlayerId,
  QuestionAnswer,
  QuestionId,
  QuizId,
  QuizInfo,
  SessionId,
  SessionQuestionResults,
  Token,
  FinalSessionResults
} from '../../interfaces';

import HTTPError from 'http-errors';

import {
  ACTION_END,
  ACTION_GO_TO_ANSWER,
  ACTION_NEXT_QUESTION,
  ACTION_SKIP_COUNTDOWN,
  ACTION_GO_TO_FINAL_RESULTS,
  STATE_ANSWER_SHOW,
  STATE_LOBBY,
  STATE_QUESTION_COUNTDOWN,
  STATE_QUESTION_OPEN
} from '../../interfaces';
import { timeInSeconds } from '../../helper';

const URL = 'https://assets.coingecko.com/coins/images/32163/large/HAPPYCAT.jpg';

beforeEach(() => {
  requestClear();
});

describe('POST, /v1/player/join', () => {
  let user1: string;
  let quiz: number;
  let sessionId: number;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('test@gmail.com', 'password1', 'Test', 'User').token;
    quiz = v2requestAdminQuizCreate(user1, 'Quiz 1', 'description').quizId;
    const answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    v2requestAdminQuizQuestionCreate(quiz, user1, 'Question 1', 5, 10, answers, URL);
    sessionId = requestAdminQuizSessionStart(user1, quiz, 2).sessionId;
  });
  describe('Error cases', () => {
    test('Name is used by another user', () => {
      requestPlayerJoin(sessionId, 'Name');
      expect(() => requestPlayerJoin(sessionId, 'Name')).toThrow(HTTPError[400]);
    });

    test('session id is not valid', () => {
      expect(() => requestPlayerJoin(sessionId + 1, 'Name')).toThrow(HTTPError[400]);
    });

    test('Session not in LOBBY state', () => {
      // Will auto start quiz with two people
      requestPlayerJoin(sessionId, 'Name');
      requestPlayerJoin(sessionId, 'Name1');
      expect(() => requestPlayerJoin(sessionId, 'Name2')).toThrow(HTTPError[400]);
    });
  });

  describe('Success cases', () => {
    test('Basic functionality and correct return type', () => {
      expect(requestPlayerJoin(sessionId, 'Name')).toStrictEqual({ playerId: expect.any(Number) });
      expect(requestAdminQuizSessionStatus(user1, quiz, sessionId).players).toStrictEqual(['Name']);
    });

    test('Multiple players', () => {
      const sessionId1 = requestAdminQuizSessionStart(user1, quiz, 5).sessionId;
      requestPlayerJoin(sessionId1, 'Name');
      requestPlayerJoin(sessionId1, 'Name1');
      requestPlayerJoin(sessionId1, 'Name2');
      requestPlayerJoin(sessionId1, 'Name3');

      expect(requestAdminQuizSessionStatus(user1, quiz, sessionId1).players).toStrictEqual(['Name', 'Name1', 'Name2', 'Name3']);
    });

    test('Testing random name generated when no name provided', () => {
      expect(requestPlayerJoin(sessionId, '')).toStrictEqual({ playerId: expect.any(Number) });
      const generatedName = requestAdminQuizSessionStatus(user1, quiz, sessionId).players;
      expect(generatedName).toStrictEqual([expect.any(String)]);

      const namePattern = /^[a-zA-Z]{5}\d{3}$/;
      expect(generatedName[0]).toMatch(namePattern);
    });

    test('Autostart', () => {
      requestPlayerJoin(sessionId, 'Name');
      requestPlayerJoin(sessionId, 'Name1');
      expect(requestAdminQuizSessionStatus(user1, quiz, sessionId).state).toStrictEqual(STATE_QUESTION_COUNTDOWN);
    });
  });
});

describe('PUT, /v1/player/{playerid}/question/{questionposition}/answer', () => {
  let user1: Token;
  let quiz1: QuizId;
  let answers1: QuestionAnswer[];
  let answers2: QuestionAnswer[];
  let question1: QuestionId;
  let question2: QuestionId;
  let session1: SessionId;
  let player1: PlayerId;
  let player2: PlayerId;
  let answerId1: number;
  let answerId2: number;
  let answerId3: number;
  let answerId4: number;

  beforeEach(() => {
    user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description') as QuizId;

    answers1 = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    answers2 = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: true }
    ];
    question1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 1', 5, 5, answers1, URL) as QuestionId;
    question2 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 2', 5, 5, answers2, URL) as QuestionId;

    session1 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;
    player1 = requestPlayerJoin(session1.sessionId, 'Player 1') as PlayerId;
    player2 = requestPlayerJoin(session1.sessionId, 'Player 2') as PlayerId;

    const info: QuizInfo = v2requestAdminQuizInfo(user1.token, quiz1.quizId) as QuizInfo;
    answerId1 = info.questions[0].answers[0].answerId;
    answerId2 = info.questions[0].answers[1].answerId;
    answerId3 = info.questions[1].answers[0].answerId;
    answerId4 = info.questions[1].answers[1].answerId;

    requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
    requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
  });

  describe('Error Cases', () => {
    test('Invalid playerId, player does not exist', () => {
      expect(() => requestPlayerQuestionSubmitAnswer(player2.playerId + 1, question1.questionId, [answerId1])).toThrow(HTTPError[400]);
    });

    test('Invalid question position for quiz session', () => {
      expect(() => requestPlayerQuestionSubmitAnswer(player1.playerId, 0, [answerId1])).toThrow(HTTPError[400]);
      expect(() => requestPlayerQuestionSubmitAnswer(player1.playerId, 5, [answerId1])).toThrow(HTTPError[400]);
    });

    test('Session is not in QUESTION_OPEN state', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      expect(() => requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1])).toThrow(HTTPError[400]);
    });

    test('Session is not up to question', () => {
      expect(() => requestPlayerQuestionSubmitAnswer(player1.playerId, question2.questionId, [answerId1])).toThrow(HTTPError[400]);
    });

    test('Invalid answerId for question', () => {
      expect(() => requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId3])).toThrow(HTTPError[400]);
    });

    test('Duplicate answerIds provided', () => {
      expect(() => requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1, answerId1])).toThrow(HTTPError[400]);
    });

    test('Less than 1 answerId provided', () => {
      expect(() => requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [])).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('Player answer submitted successfully', () => {
      expect(requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1])).toStrictEqual({});
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      expect(requestPlayerQuestionResults(player1.playerId, question1.questionId).playersCorrectList).toStrictEqual(['Player 1']);
    });

    test('Player answer resubmitted successfully', () => {
      expect(requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1])).toStrictEqual({});
      expect(requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId2])).toStrictEqual({});
      expect(requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1])).toStrictEqual({});

      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      expect(requestPlayerQuestionResults(player1.playerId, question1.questionId).playersCorrectList).toStrictEqual(['Player 1']);
    });

    test('Submit answers for multiple questions', () => {
      expect(requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1])).toStrictEqual({});
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      expect(requestPlayerQuestionResults(player1.playerId, question1.questionId).playersCorrectList).toStrictEqual(['Player 1']);

      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
      expect(requestPlayerQuestionSubmitAnswer(player1.playerId, question2.questionId, [answerId3])).toStrictEqual({});

      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      expect(requestPlayerQuestionResults(player1.playerId, question2.questionId).playersCorrectList).toStrictEqual([]);
    });

    test('Multiple players submit answers successfully', () => {
      expect(requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId2])).toStrictEqual({});
      expect(requestPlayerQuestionSubmitAnswer(player2.playerId, question1.questionId, [answerId1])).toStrictEqual({});

      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      expect(requestPlayerQuestionResults(player1.playerId, question1.questionId).playersCorrectList).toStrictEqual(['Player 2']);
    });

    test('Player submits multiple answers successfully', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);

      expect(requestPlayerQuestionSubmitAnswer(player1.playerId, question2.questionId, [answerId3, answerId4])).toStrictEqual({});
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      expect(requestPlayerQuestionResults(player1.playerId, question2.questionId).playersCorrectList).toStrictEqual(['Player 1']);
    });
  });
});

describe('GET, /v1/player/{playerid}/question/{questionposition}/results', () => {
  let user1: Token;
  let quiz1: QuizId;
  let answers: QuestionAnswer[];
  let question1: QuestionId;
  let question2: QuestionId;
  let session1: SessionId;
  let player1: PlayerId;
  let player2: PlayerId;
  let answerId1: number;
  let answerId2: number;
  let startTime: number;

  beforeEach(() => {
    user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description') as QuizId;
    answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];

    question1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 1', 5, 5, answers, URL) as QuestionId;
    question2 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 2', 5, 5, answers, URL) as QuestionId;
    session1 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;
    player1 = requestPlayerJoin(session1.sessionId, 'Player 1') as PlayerId;
    player2 = requestPlayerJoin(session1.sessionId, 'Player 2') as PlayerId;

    const info: QuizInfo = v2requestAdminQuizInfo(user1.token, quiz1.quizId) as QuizInfo;
    answerId1 = info.questions[0].answers[0].answerId;
    answerId2 = info.questions[0].answers[1].answerId;

    requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
    requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
    startTime = timeInSeconds();
  });

  describe('Error Cases', () => {
    beforeEach(() => {
      requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1]);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
    });

    test('Invalid playerId, playerId does not exist', () => {
      expect(() => requestPlayerQuestionResults(player2.playerId + 1, question1.questionId)).toThrow(HTTPError[400]);
    });

    test('Invalid question position for quiz session', () => {
      expect(() => requestPlayerQuestionResults(player1.playerId, 0)).toThrow(HTTPError[400]);
      expect(() => requestPlayerQuestionResults(player1.playerId, 5)).toThrow(HTTPError[400]);
    });

    test('Session is not in ANSWER_SHOW state', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      expect(() => requestPlayerQuestionResults(player1.playerId, question1.questionId)).toThrow(HTTPError[400]);
    });

    test('Session is not up to question', () => {
      expect(() => requestPlayerQuestionResults(player1.playerId, question2.questionId)).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('1 player correct, 1 player did not submit', () => {
      const answerTime = timeInSeconds() - startTime;
      requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1]);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);

      const expectedResults: SessionQuestionResults = {
        questionId: question1.questionId,
        playersCorrectList: ['Player 1'],
        averageAnswerTime: expect.any(Number),
        percentCorrect: 50
      };
      const response = requestPlayerQuestionResults(player1.playerId, question1.questionId);
      expect(response).toStrictEqual(expectedResults);

      expect(response.averageAnswerTime).toBeGreaterThanOrEqual(answerTime);
      expect(response.averageAnswerTime).toBeLessThanOrEqual(answerTime + 1);
    });

    test('1 player correct, 1 player incorrect', () => {
      const answerTime = timeInSeconds() - startTime;
      requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1]);
      requestPlayerQuestionSubmitAnswer(player2.playerId, question1.questionId, [answerId2]);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);

      const expectedResults: SessionQuestionResults = {
        questionId: question1.questionId,
        playersCorrectList: ['Player 1'],
        averageAnswerTime: expect.any(Number),
        percentCorrect: 50
      };
      const response = requestPlayerQuestionResults(player1.playerId, question1.questionId);
      expect(response).toStrictEqual(expectedResults);

      expect(response.averageAnswerTime).toBeGreaterThanOrEqual(answerTime);
      expect(response.averageAnswerTime).toBeLessThanOrEqual(answerTime + 1);
    });

    test('Both players correct', () => {
      const answerTime = timeInSeconds() - startTime;
      requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1]);
      requestPlayerQuestionSubmitAnswer(player2.playerId, question1.questionId, [answerId1]);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);

      const expectedResults: SessionQuestionResults = {
        questionId: question1.questionId,
        playersCorrectList: ['Player 1', 'Player 2'],
        averageAnswerTime: expect.any(Number),
        percentCorrect: 100
      };
      const response = requestPlayerQuestionResults(player1.playerId, question1.questionId);
      expect(response).toStrictEqual(expectedResults);

      expect(response.averageAnswerTime).toBeGreaterThanOrEqual(answerTime);
      expect(response.averageAnswerTime).toBeLessThanOrEqual(answerTime + 1);
    });

    test('No players submitted', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);

      const expectedResults: SessionQuestionResults = {
        questionId: question1.questionId,
        playersCorrectList: [],
        averageAnswerTime: 0,
        percentCorrect: 0
      };
      const response = requestPlayerQuestionResults(player1.playerId, question1.questionId);
      expect(response).toStrictEqual(expectedResults);
    });
  });
});

describe('GET, /v1/player/{playerid}/question/{questionposition}', () => {
  let user: string;
  let quiz: number;
  let question1: number;
  let question2: number;
  let sessionId: number;
  let playerId: number;
  let playerId1: number;
  beforeEach(() => {
    user = requestAdminAuthRegister('test@gmail.com', 'password1', 'Test', 'User').token;
    quiz = v2requestAdminQuizCreate(user, 'Quiz 1', 'description').quizId;
    const answers1 = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];

    const answers2 = [
      { answer: 'Another answer 1', correct: true },
      { answer: 'Another answer 2', correct: false }
    ];
    question1 = v2requestAdminQuizQuestionCreate(quiz, user, 'Question 1', 5, 10, answers1, URL).questionId;
    question2 = v2requestAdminQuizQuestionCreate(quiz, user, 'Question 2', 2, 2, answers2, URL).questionId;
    sessionId = requestAdminQuizSessionStart(user, quiz, 0).sessionId;
    playerId = requestPlayerJoin(sessionId, 'Name').playerId;
    playerId1 = requestPlayerJoin(sessionId, 'Name1').playerId;
    requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_NEXT_QUESTION);
    requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_SKIP_COUNTDOWN);
  });
  describe('Error cases', () => {
    test('Player ID does not exist', () => {
      expect(() => requestPlayerCurrQuestionInfo(playerId + 2, 1)).toThrow(HTTPError[400]);
    });

    test('Invalid question position', () => {
      expect(() => requestPlayerCurrQuestionInfo(playerId, 3)).toThrow(HTTPError[400]);
    });

    test('Session is not on question', () => {
      expect(() => requestPlayerCurrQuestionInfo(playerId, 2)).toThrow(HTTPError[400]);
    });

    test('Session is in LOBBY, QUESTION_COUNTDOWN or END state', () => {
      const sessionId1 = requestAdminQuizSessionStart(user, quiz, 2).sessionId;
      const playerId1 = requestPlayerJoin(sessionId1, 'Name').playerId;
      expect(() => requestPlayerCurrQuestionInfo(playerId1, 0)).toThrow(HTTPError[400]);
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId1, ACTION_NEXT_QUESTION);
      expect(() => requestPlayerCurrQuestionInfo(playerId1, 1)).toThrow(HTTPError[400]);
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId1, ACTION_END);
      expect(() => requestPlayerCurrQuestionInfo(playerId1, 1)).toThrow(HTTPError[400]);
    });
  });

  describe('Success cases', () => {
    test('Basic functionality and correct return', () => {
      expect(requestPlayerCurrQuestionInfo(playerId, 1)).toStrictEqual({
        questionId: question1,
        question: 'Question 1',
        duration: 10,
        thumbnailUrl: URL,
        points: 5,
        answers: [
          {
            answerId: 1,
            answer: 'Answer 1',
            colour: expect.any(String)
          },
          {
            answerId: 2,
            answer: 'Answer 2',
            colour: expect.any(String)
          }
        ]
      });
    });

    test('Test for next question', () => {
      expect(requestPlayerCurrQuestionInfo(playerId, 1)).toStrictEqual({
        questionId: question1,
        question: 'Question 1',
        duration: 10,
        thumbnailUrl: URL,
        points: 5,
        answers: [
          {
            answerId: 1,
            answer: 'Answer 1',
            colour: expect.any(String)
          },
          {
            answerId: 2,
            answer: 'Answer 2',
            colour: expect.any(String)
          }
        ]
      });
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_SKIP_COUNTDOWN);
      expect(requestPlayerCurrQuestionInfo(playerId, 2)).toStrictEqual({
        questionId: question2,
        question: 'Question 2',
        duration: 2,
        thumbnailUrl: URL,
        points: 2,
        answers: [
          {
            answerId: 3,
            answer: 'Another answer 1',
            colour: expect.any(String)
          },
          {
            answerId: 4,
            answer: 'Another answer 2',
            colour: expect.any(String)
          }
        ]
      });
    });

    test('Testing multiple players', () => {
      expect(requestPlayerCurrQuestionInfo(playerId, 1)).toStrictEqual({
        questionId: question1,
        question: 'Question 1',
        duration: 10,
        thumbnailUrl: URL,
        points: 5,
        answers: [
          {
            answerId: 1,
            answer: 'Answer 1',
            colour: expect.any(String)
          },
          {
            answerId: 2,
            answer: 'Answer 2',
            colour: expect.any(String)
          }
        ]
      });
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_SKIP_COUNTDOWN);
      expect(requestPlayerCurrQuestionInfo(playerId1, 2)).toStrictEqual({
        questionId: question2,
        question: 'Question 2',
        duration: 2,
        thumbnailUrl: URL,
        points: 2,
        answers: [
          {
            answerId: 3,
            answer: 'Another answer 1',
            colour: expect.any(String)
          },
          {
            answerId: 4,
            answer: 'Another answer 2',
            colour: expect.any(String)
          }
        ]
      });
    });
  });
});

describe('GET, /v1/player/{playerid}', () => {
  let user: string;
  let quiz: number;
  let sessionId: number;
  let playerId: number;
  const statusAtQ0Lobby = {
    state: STATE_LOBBY,
    numQuestions: 3,
    atQuestion: 0,
  };

  const statusAtQ1QuestionCountdown = {
    state: STATE_QUESTION_COUNTDOWN,
    numQuestions: 3,
    atQuestion: 1,
  };

  beforeEach(() => {
    user = requestAdminAuthRegister('test@gmail.com', 'password1', 'Test', 'User').token;
    quiz = v2requestAdminQuizCreate(user, 'Quiz 1', 'description').quizId;
    const answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    v2requestAdminQuizQuestionCreate(quiz, user, 'Question 1', 5, 10, answers, URL);
    v2requestAdminQuizQuestionCreate(quiz, user, 'Question 2', 5, 10, answers, URL);
    v2requestAdminQuizQuestionCreate(quiz, user, 'Question 3', 5, 10, answers, URL);
    sessionId = requestAdminQuizSessionStart(user, quiz, 3).sessionId;
    playerId = requestPlayerJoin(sessionId, 'Name').playerId;
  });

  describe('Error cases', () => {
    test('Player ID does not exist', () => {
      expect(() => requestPlayerStatus(playerId + 1)).toThrow(HTTPError[400]);
    });
  });

  describe('Success cases', () => {
    test('Correct return and basic functionality', () => {
      expect(requestPlayerStatus(playerId)).toStrictEqual(statusAtQ0Lobby);
    });

    test('Works with two users in different sessions in different states', () => {
      const sessionId1 = requestAdminQuizSessionStart(user, quiz, 3).sessionId;
      const playerId1 = requestPlayerJoin(sessionId1, 'Name1').playerId;
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId1, ACTION_NEXT_QUESTION);
      expect(requestPlayerStatus(playerId)).toStrictEqual(statusAtQ0Lobby);

      expect(requestPlayerStatus(playerId1)).toStrictEqual(statusAtQ1QuestionCountdown);
    });

    test('Works when two users in same session', () => {
      const playerId1 = requestPlayerJoin(sessionId, 'Name1').playerId;
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_NEXT_QUESTION);
      expect(requestPlayerStatus(playerId)).toStrictEqual(statusAtQ1QuestionCountdown);

      expect(requestPlayerStatus(playerId1)).toStrictEqual(statusAtQ1QuestionCountdown);
    });

    test('Correctly shows changing state and atQuestion number', () => {
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_NEXT_QUESTION);
      expect(requestPlayerStatus(playerId)).toStrictEqual(statusAtQ1QuestionCountdown);
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_SKIP_COUNTDOWN);
      expect(requestPlayerStatus(playerId)).toStrictEqual(
        {
          state: STATE_QUESTION_OPEN,
          numQuestions: 3,
          atQuestion: 1,
        }
      );
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_GO_TO_ANSWER);
      expect(requestPlayerStatus(playerId)).toStrictEqual(
        {
          state: STATE_ANSWER_SHOW,
          numQuestions: 3,
          atQuestion: 1,
        }
      );
      requestAdminQuizSessionStateUpdate(user, quiz, sessionId, ACTION_NEXT_QUESTION);
      expect(requestPlayerStatus(playerId)).toStrictEqual(
        {
          state: STATE_QUESTION_COUNTDOWN,
          numQuestions: 3,
          atQuestion: 2,
        }
      );
    });
  });
});

describe('POST, /v1/player/{playerid}/chat', () => {
  let user1: string;
  let quiz: number;
  let sessionId: number;
  let player1: PlayerId;
  let player2: PlayerId;

  beforeEach(() => {
    user1 = requestAdminAuthRegister('test@gmail.com', 'password1', 'Test', 'User').token;
    quiz = v2requestAdminQuizCreate(user1, 'Quiz 1', 'description').quizId;
    const answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    v2requestAdminQuizQuestionCreate(quiz, user1, 'Question 1', 5, 10, answers, URL);
    sessionId = requestAdminQuizSessionStart(user1, quiz, 2).sessionId;
    player1 = requestPlayerJoin(sessionId, 'Player 1') as PlayerId;
    player2 = requestPlayerJoin(sessionId, 'Player 2') as PlayerId;
  });

  describe('Error Cases', () => {
    test('PlayerId does not exit', () => {
      expect(() => requestPlayerSendChatMessage(player1.playerId + player2.playerId, 'hello')).toThrow(HTTPError[400]);
    });

    test('Message less than 1 char', () => {
      expect(() => requestPlayerSendChatMessage(player1.playerId, '')).toThrow(HTTPError[400]);
    });

    test('Message greater than 100 chars', () => {
      expect(() => requestPlayerSendChatMessage(player1.playerId, ('a'.repeat(101)))).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('One player sends one message', () => {
      expect(requestPlayerSendChatMessage(player1.playerId, 'Hello')).toStrictEqual({});

      expect(requestPlayerChatView(player1.playerId)).toStrictEqual({
        messages: [
          {
            messageBody: 'Hello',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number)
          }
        ]
      });
    });
    test('Multiple players sends multiple messages', () => {
      requestPlayerSendChatMessage(player1.playerId, 'Hello');
      requestPlayerSendChatMessage(player2.playerId, 'Hey');
      requestPlayerSendChatMessage(player1.playerId, 'How are u going :)');

      expect(requestPlayerChatView(player1.playerId)).toStrictEqual({
        messages: [
          {
            messageBody: 'Hello',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number)
          },
          {
            messageBody: 'Hey',
            playerId: player2.playerId,
            playerName: 'Player 2',
            timeSent: expect.any(Number)
          },
          {
            messageBody: 'How are u going :)',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number)
          },

        ]
      });
    });
  });
});

describe('GET, /v1/admin/quiz/{quizid}/session/{sessionid}/results', () => {
  let user1: Token;
  let quiz1: QuizId;
  let answers: QuestionAnswer[];
  let question1: QuestionId;
  let question2: QuestionId;
  let session1: SessionId;
  let player1: PlayerId;
  let player2: PlayerId;
  let answerId1: number;
  let answerId3: number;
  let answerId4: number;
  let startTime: number;
  let finalSessionResults: FinalSessionResults;

  beforeEach(() => {
    user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description') as QuizId;
    answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    question1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 1', 5, 0.5, answers, URL) as QuestionId;
    question2 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 2', 5, 0.5, answers, URL) as QuestionId;
    session1 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;
    player1 = requestPlayerJoin(session1.sessionId, 'Anthony Bridgerton') as PlayerId;
    player2 = requestPlayerJoin(session1.sessionId, 'Kate Bridgerton') as PlayerId;

    const info: QuizInfo = v2requestAdminQuizInfo(user1.token, quiz1.quizId) as QuizInfo;
    answerId1 = info.questions[0].answers[0].answerId;
    answerId3 = info.questions[1].answers[0].answerId;
    answerId4 = info.questions[1].answers[1].answerId;

    // get to 'Question_open'
    requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
    requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
    startTime = timeInSeconds();
  });

  describe('Success Cases', () => {
    test('Valid inputs', () => {
      // player 2 and player 1 both answer correctly, but 0.1s apart
      const answerTime1 = timeInSeconds() - startTime;
      requestPlayerQuestionSubmitAnswer(player2.playerId, question1.questionId, [answerId1]);
      sleepSync(0.1 * 1000);
      requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1]);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);

      // next question
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
      startTime = timeInSeconds();

      // player 2 answers correctly, player 1 doesn't
      const answerTime2 = timeInSeconds() - startTime;
      requestPlayerQuestionSubmitAnswer(player2.playerId, question2.questionId, [answerId3]);
      requestPlayerQuestionSubmitAnswer(player1.playerId, question2.questionId, [answerId4]);

      // see final results
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);

      finalSessionResults = requestPlayerSessionFinalResults(player1.playerId);
      const expectedfinalSessionResults: FinalSessionResults = {
        usersRankedByScore: [
          {
            name: 'Kate Bridgerton',
            score: 10
          },
          {
            name: 'Anthony Bridgerton',
            score: 3
          }
        ],
        questionResults: [
          {
            questionId: question1.questionId,
            playersCorrectList: [
              'Anthony Bridgerton',
              'Kate Bridgerton'
            ],
            averageAnswerTime: expect.any(Number),
            percentCorrect: 100
          },
          {
            questionId: question2.questionId,
            playersCorrectList: [
              'Kate Bridgerton'
            ],
            averageAnswerTime: expect.any(Number),
            percentCorrect: 50
          }
        ]
      };
      expect(finalSessionResults).toStrictEqual(expectedfinalSessionResults);

      expect(finalSessionResults.questionResults[0].averageAnswerTime).toBeGreaterThanOrEqual(answerTime1);
      expect(finalSessionResults.questionResults[0].averageAnswerTime).toBeLessThanOrEqual(answerTime1 + 1);
      expect(finalSessionResults.questionResults[1].averageAnswerTime).toBeGreaterThanOrEqual(answerTime2);
      expect(finalSessionResults.questionResults[1].averageAnswerTime).toBeLessThanOrEqual(answerTime2 + 1);
    });
  });

  describe('Error Cases', () => {
    test('playerid is not valid session in quiz', () => {
      expect(() => requestPlayerSessionFinalResults(player1.playerId + player2.playerId)).toThrow(HTTPError[400]);
    });

    test('session is not in final results state', () => {
      expect(() => requestPlayerSessionFinalResults(player1.playerId)).toThrow(HTTPError[400]);
    });
  });
});

describe('GET, /v1/player/{playerid}/chat', () => {
  let user1: string;
  let quiz: number;
  let sessionId: number;
  let player1: PlayerId;
  let player2: PlayerId;

  beforeEach(() => {
    user1 = requestAdminAuthRegister('test@gmail.com', 'password1', 'Test', 'User').token;
    quiz = v2requestAdminQuizCreate(user1, 'Quiz 1', 'description').quizId;
    const answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    v2requestAdminQuizQuestionCreate(quiz, user1, 'Question 1', 5, 10, answers, URL);
    sessionId = requestAdminQuizSessionStart(user1, quiz, 3).sessionId;
    player1 = requestPlayerJoin(sessionId, 'Player 1') as PlayerId;
    player2 = requestPlayerJoin(sessionId, 'Player 2') as PlayerId;
  });

  describe('Success Cases', () => {
    test('one message', () => {
      requestPlayerSendChatMessage(player1.playerId, 'hiii');
      const result = requestPlayerChatView(player1.playerId);
      const expectedResults = {
        messages: [
          {
            messageBody: 'hiii',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number),
          }
        ]
      };

      expect(result).toStrictEqual(expectedResults);
    });

    test('multiple messages from multiple users', () => {
      requestPlayerSendChatMessage(player1.playerId, 'hiii');
      requestPlayerSendChatMessage(player2.playerId, 'hello player 1');
      requestPlayerSendChatMessage(player1.playerId, 'i am the best');
      const result = requestPlayerChatView(player1.playerId);
      const expectedResults = {
        messages: [
          {
            messageBody: 'hiii',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number),
          },
          {
            messageBody: 'hello player 1',
            playerId: player2.playerId,
            playerName: 'Player 2',
            timeSent: expect.any(Number),
          },
          {
            messageBody: 'i am the best',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number),
          }
        ]
      };
      expect(result).toStrictEqual(expectedResults);
    });
  });

  describe('Viewing chat in different states', () => {
    test('viewing chat after session ends', () => {
      requestPlayerSendChatMessage(player1.playerId, 'hiii');
      requestPlayerSendChatMessage(player2.playerId, 'hello player 1');
      requestPlayerSendChatMessage(player1.playerId, 'i am the best');
      requestAdminQuizSessionStateUpdate(user1, quiz, sessionId, ACTION_END);
      const result = requestPlayerChatView(player1.playerId);
      const expectedResults = {
        messages: [
          {
            messageBody: 'hiii',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number),
          },
          {
            messageBody: 'hello player 1',
            playerId: player2.playerId,
            playerName: 'Player 2',
            timeSent: expect.any(Number),
          },
          {
            messageBody: 'i am the best',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number),
          }
        ]
      };
      expect(result).toStrictEqual(expectedResults);
    });

    test('viewing chat during open question', () => {
      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      v2requestAdminQuizQuestionCreate(quiz, user1, 'Question 2', 5, 10, answers, URL);
      requestAdminQuizSessionStateUpdate(user1, quiz, sessionId, ACTION_NEXT_QUESTION);
      requestPlayerSendChatMessage(player1.playerId, 'hiii');
      requestPlayerSendChatMessage(player2.playerId, 'hello player 1');
      requestAdminQuizSessionStateUpdate(user1, quiz, sessionId, ACTION_SKIP_COUNTDOWN);
      requestPlayerSendChatMessage(player1.playerId, 'i am the best');
      const result = requestPlayerChatView(player1.playerId);
      const expectedResults = {
        messages: [
          {
            messageBody: 'hiii',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number),
          },
          {
            messageBody: 'hello player 1',
            playerId: player2.playerId,
            playerName: 'Player 2',
            timeSent: expect.any(Number),
          },
          {
            messageBody: 'i am the best',
            playerId: player1.playerId,
            playerName: 'Player 1',
            timeSent: expect.any(Number),
          }
        ]
      };
      expect(result).toStrictEqual(expectedResults);
    });
  });

  describe('Error Cases', () => {
    test('invalid playerid', () => {
      expect(() => requestPlayerChatView(player1.playerId + 3)).toThrow(HTTPError[400]);
    });
  });
});
