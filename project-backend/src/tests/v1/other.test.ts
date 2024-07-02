import {
  requestClear,
  requestAdminAuthRegister,
  requestAdminUserDetails,
  requestAdminQuizCreate,
  requestAdminQuizList,
  requestAdminQuizInfo,
} from '../../requestHelper';

import {
  Token,
  QuizId
} from '../../interfaces';

import HTTPError from 'http-errors';

beforeEach(() => {
  requestClear();
});

describe('DELETE, /v1/clear', () => {
  test('Correct return object', () => {
    const response = requestClear();
    expect(response).toStrictEqual({});
  });

  test('Clearing no users and quizzes', () => {
    const response = requestClear();
    expect(response).toStrictEqual({});
  });

  test('Clearing user and quiz', () => {
    const user: Token = requestAdminAuthRegister('johnappleseed@gmail.com', 'password123', 'John', 'Appleseed') as Token;
    const quiz: QuizId = requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

    const response = requestClear();
    expect(response).toStrictEqual({});

    expect(() => requestAdminUserDetails(user.token)).toThrow(HTTPError[401]);
    expect(() => requestAdminQuizList(user.token)).toThrow(HTTPError[401]);
    expect(() => requestAdminQuizInfo(user.token, quiz.quizId)).toThrow(HTTPError[401]);
  });

  test('Clearing multiple users and quizzes', () => {
    const user1: Token = requestAdminAuthRegister('johnappleseed@gmail.com', 'password123', 'John', 'Appleseed') as Token;
    const user2: Token = requestAdminAuthRegister('janeappleseed@gmail.com', 'password123', 'Jane', 'Appleseed') as Token;
    const quiz1: QuizId = requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description 1') as QuizId;
    const quiz2: QuizId = requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description 2') as QuizId;
    const quiz3: QuizId = requestAdminQuizCreate(user1.token, 'Quiz 3', 'Description 3') as QuizId;
    const quiz4: QuizId = requestAdminQuizCreate(user2.token, 'Quiz 4', 'Description 4') as QuizId;
    const quiz5: QuizId = requestAdminQuizCreate(user2.token, 'Quiz 5', 'Description 5') as QuizId;

    const response = requestClear();
    expect(response).toStrictEqual({});

    expect(() => requestAdminUserDetails(user1.token)).toThrow(HTTPError[401]);
    expect(() => requestAdminUserDetails(user2.token)).toThrow(HTTPError[401]);
    expect(() => requestAdminQuizList(user1.token)).toThrow(HTTPError[401]);
    expect(() => requestAdminQuizList(user2.token)).toThrow(HTTPError[401]);
    expect(() => requestAdminQuizInfo(user1.token, quiz1.quizId)).toThrow(HTTPError[401]);
    expect(() => requestAdminQuizInfo(user1.token, quiz2.quizId)).toThrow(HTTPError[401]);
    expect(() => requestAdminQuizInfo(user1.token, quiz3.quizId)).toThrow(HTTPError[401]);
    expect(() => requestAdminQuizInfo(user2.token, quiz4.quizId)).toThrow(HTTPError[401]);
    expect(() => requestAdminQuizInfo(user2.token, quiz5.quizId)).toThrow(HTTPError[401]);
  });
});
