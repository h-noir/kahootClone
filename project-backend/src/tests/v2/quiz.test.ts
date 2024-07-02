import {
  requestClear,
  requestAdminAuthRegister,
  v2requestAdminQuizList,
  v2requestAdminQuizCreate,
  v2requestAdminQuizInfo,
  v2requestAdminQuizRemove,
  v2requestAdminQuizNameUpdate,
  v2requestAdminQuizDescriptionUpdate,
  v2requestAdminQuizTrashView,
  v2requestAdminQuizTrashRestore,
  v2requestAdminQuizTrashEmpty,
  v2requestAdminQuizTransfer,
  v2requestAdminQuizQuestionCreate,
  v2requestAdminQuizQuestionUpdate,
  v2requestAdminQuizQuestionDelete,
  v2requestAdminQuizQuestionMove,
  v2requestAdminQuizQuestionDuplicate,
  requestAdminQuizSessionStart,
  requestQuizThumbnailUpdate,
} from '../../requestHelper';

import {
  Token,
  QuizId,
  QuizInfo,
  QuizList,
  QuestionAnswer,
  QuestionId,
  QuizQuestion,
  NewQuestionId
} from '../../interfaces';

import HTTPError from 'http-errors';

const URL = 'https://assets.coingecko.com/coins/images/32163/large/HAPPYCAT.jpg';
const URL2 = 'https://assets.coingecko.com/coins/images/36687/large/MochiCat.png';

beforeEach(() => {
  requestClear();
});

describe('GET, /v2/admin/quiz/list', () => {
  let token: string;
  beforeEach(() => {
    token = requestAdminAuthRegister('test@gmail.com', 'password1', 'Test', 'User').token;
  });
  describe('Error cases, expecting an error', () => {
    test('Testing error case of invalid token', () => {
      v2requestAdminQuizCreate(token, 'Test Quiz', 'Test description');
      expect(() => v2requestAdminQuizList(token + 'InvalidToken')).toThrow(HTTPError[401]);
    });
  });

  describe('Success cases', () => {
    test('Testing basic functionality', () => {
      const quizId = v2requestAdminQuizCreate(token, 'Test Quiz', 'Test description').quizId;
      expect(v2requestAdminQuizList(token)).toStrictEqual({
        quizzes: [
          {
            quizId: quizId,
            name: 'Test Quiz',
          },
        ]
      });
    });

    test('Testing multiple quizzes', () => {
      const quizId1 = v2requestAdminQuizCreate(token, 'Test Quiz 1', 'description').quizId;
      const quizId2 = v2requestAdminQuizCreate(token, 'Test Quiz 2', 'description').quizId;
      const quizId3 = v2requestAdminQuizCreate(token, 'Test Quiz 3', 'description').quizId;
      const quizId4 = v2requestAdminQuizCreate(token, 'Test Quiz 4', 'description').quizId;

      const quizzes = v2requestAdminQuizList(token).quizzes;
      expect(quizzes.length === 4);
      expect(quizzes).toEqual(expect.arrayContaining(
        [
          {
            quizId: quizId1,
            name: 'Test Quiz 1',
          },
          {
            quizId: quizId2,
            name: 'Test Quiz 2',
          },
          {
            quizId: quizId3,
            name: 'Test Quiz 3',
          },
          {
            quizId: quizId4,
            name: 'Test Quiz 4',
          },
        ]
      ));
    });

    test('Testing for when user has no quizzes', () => {
      expect(v2requestAdminQuizList(token)).toStrictEqual({
        quizzes: []
      });
    });

    test('Testing multiple users with multiple quizzes', () => {
      const userId1 = requestAdminAuthRegister('User1@gmail.com', 'password1', 'Userone', 'Userone').token;
      const userId2 = requestAdminAuthRegister('User2@gmail.com', 'password1', 'Usertwo', 'Usertwo').token;

      const quizId1 = v2requestAdminQuizCreate(userId1, 'Test Quiz1', 'This is quiz num 1').quizId;
      const quizId2 = v2requestAdminQuizCreate(userId1, 'Test Quiz2', 'This is quiz num 2').quizId;
      const quizId3 = v2requestAdminQuizCreate(userId2, 'Test Quiz3', 'This is quiz num 3').quizId;
      const quizId4 = v2requestAdminQuizCreate(userId2, 'Test Quiz4', 'This is quiz num 4').quizId;

      let quizzes = v2requestAdminQuizList(userId2).quizzes;
      expect(quizzes.length === 2);
      expect(quizzes).toEqual(expect.arrayContaining(
        [
          {
            quizId: quizId3,
            name: 'Test Quiz3',
          },
          {
            quizId: quizId4,
            name: 'Test Quiz4',
          },
        ]
      ));

      quizzes = v2requestAdminQuizList(userId1).quizzes;
      expect(quizzes.length === 4);
      expect(quizzes).toEqual(expect.arrayContaining(
        [
          {
            quizId: quizId1,
            name: 'Test Quiz1',
          },
          {
            quizId: quizId2,
            name: 'Test Quiz2',
          },
        ]
      ));
    });
  });
});

describe('POST, /v2/admin/quiz', () => {
  let user1: Token;
  let user2: Token;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('BATBeast@email.com', 'iL0v3B3ll3', 'Prince', 'Adam') as Token;
    user2 = requestAdminAuthRegister('Belle123@email.com', 'iL0v3B3aSt', 'Princess', 'Belle') as Token;
  });

  describe('Correct status code and return value', () => {
    test('Valid inputs', () => {
      const quiz = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'description');
      expect(quiz).toStrictEqual({ quizId: expect.any(Number) });
    });

    test('Description < 100 chars', () => {
      const quiz = v2requestAdminQuizCreate(user1.token, 'Quiz 1', '');
      expect(quiz).toStrictEqual({ quizId: expect.any(Number) });
    });

    test('Multiple Users can create a quiz, even if it has the same name.', () => {
      const quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description.');
      const quiz2 = v2requestAdminQuizCreate(user2.token, 'Quiz 1', 'Description.');
      const quiz3 = v2requestAdminQuizCreate(user1.token, 'Quiz 3', 'Description.');

      expect(quiz1).toStrictEqual({ quizId: expect.any(Number) });
      expect(quiz2).toStrictEqual({ quizId: expect.any(Number) });
      expect(quiz3).toStrictEqual({ quizId: expect.any(Number) });
    });
  });

  describe('Error Cases', () => {
    test('Token does not exist', () => {
      expect(() => v2requestAdminQuizCreate(user1.token + 'InvalidToken', 'Quiz 1', 'description')).toThrow(HTTPError[401]);
    });

    test('Current logged in user has another quiz of inputted quiz name', () => {
      const quiz = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description.');
      expect(quiz).toStrictEqual({ quizId: expect.any(Number) });
      expect(() => v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description.')).toThrow(HTTPError[400]);
    });

    test.each([
      'ME',
      'Never G0nna Give You Up Never G0nna Let You D0wn',
    ])('Invalid Name, Longer than 30 or shorter than 3 chars', (name) => {
      expect(() => v2requestAdminQuizCreate(user1.token, name, 'Description.')).toThrow(HTTPError[400]);
    });

    test('Invalid Name, Contains strange characters', () => {
      expect(() => v2requestAdminQuizCreate(user1.token, '/[]**@<>&|#$~Git!😔101', 'Description.')).toThrow(HTTPError[400]);
    });

    test('Description more than 100 characters', () => {
      const description = '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901';
      expect(() => v2requestAdminQuizCreate(user1.token, 'Quiz 1', description)).toThrow(HTTPError[400]);
    });
  });
});

describe('DELETE, /v2/admin/quiz/{quizid}', () => {
  let token: string;
  let quizId: number;
  beforeEach(() => {
    const response = requestAdminAuthRegister('test@gmail.com', 'password1', 'Test', 'User');
    token = (response as Token).token;
    quizId = v2requestAdminQuizCreate(token, 'Test Quiz', 'Test description').quizId;
  });
  describe('Error cases, expecting an error', () => {
    test('Testing error case of invalid token', () => {
      expect(() => v2requestAdminQuizRemove(token + 'InvalidToken', quizId)).toThrow(HTTPError[401]);
    });

    test('Testing error case of invalid quizId', () => {
      expect(() => v2requestAdminQuizRemove(token, quizId + 1)).toThrow(HTTPError[403]);
    });

    test('Testing error case user not owning quiz', () => {
      const userId1 = requestAdminAuthRegister('anotherUser@gmail.com', 'password1', 'Different', 'Person');
      expect(() => v2requestAdminQuizRemove(userId1.token, quizId)).toThrow(HTTPError[403]);
    });

    test('Testsing error case of quiz not being in end state', () => {
      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      v2requestAdminQuizQuestionCreate(quizId, token, 'Question', 5, 10, answers, URL);
      requestAdminQuizSessionStart(token, quizId, 0);
      expect(() => v2requestAdminQuizRemove(token, quizId)).toThrow(HTTPError[400]);
    });
  });

  describe('Success cases', () => {
    test('Testing correct return values when removing one quiz', () => {
      expect(v2requestAdminQuizRemove(token, quizId)).toStrictEqual({});
      expect(() => v2requestAdminQuizInfo(token, quizId)).toThrow(HTTPError[403]);
    });

    test('Removing one quiz from multiple quizzes', () => {
      const quizId1 = v2requestAdminQuizCreate(token, 'Test Quiz1', 'Test description').quizId;
      const quizId2 = v2requestAdminQuizCreate(token, 'Test Quiz2', 'Test description').quizId;
      const quizId3 = v2requestAdminQuizCreate(token, 'Test Quiz3', 'Test description').quizId;
      const quizId4 = v2requestAdminQuizCreate(token, 'Test Quiz4', 'Test description').quizId;

      expect(v2requestAdminQuizRemove(token, quizId1)).toStrictEqual({});
      expect(() => v2requestAdminQuizInfo(token, quizId1)).toThrow(HTTPError[403]);

      const listedQuizzes = (v2requestAdminQuizList(token)).quizzes;
      expect(listedQuizzes.length === 3);
      expect(listedQuizzes).toEqual(expect.arrayContaining(
        [
          {
            quizId: quizId2,
            name: 'Test Quiz2',
          },
          {
            quizId: quizId3,
            name: 'Test Quiz3',
          },
          {
            quizId: quizId4,
            name: 'Test Quiz4',
          },
        ]
      ));
    });

    test('Removing multiple quizzes from multiple quizzes with multiple users', () => {
      const userId1 = requestAdminAuthRegister('testEmail@gmail.com', 'password1', 'Test', 'User').token;
      const userId2 = requestAdminAuthRegister('anotherUser@gmail.com', 'password1', 'Different', 'Person').token;

      const quizId1 = v2requestAdminQuizCreate(userId1, 'Test Quiz1', 'Test description').quizId;
      const quizId2 = v2requestAdminQuizCreate(userId1, 'Test Quiz2', 'Test description').quizId;
      const quizId3 = v2requestAdminQuizCreate(userId1, 'Test Quiz3', 'Test description').quizId;
      const quizId4 = v2requestAdminQuizCreate(userId2, 'Test Quiz4', 'Test description').quizId;
      const quizId5 = v2requestAdminQuizCreate(userId2, 'Test Quiz5', 'Test description').quizId;
      const quizId6 = v2requestAdminQuizCreate(userId2, 'Test Quiz6', 'Test description').quizId;

      expect(v2requestAdminQuizRemove(userId2, quizId4)).toStrictEqual({});
      expect(v2requestAdminQuizRemove(userId2, quizId5)).toStrictEqual({});
      expect(v2requestAdminQuizRemove(userId1, quizId1)).toStrictEqual({});
      expect(v2requestAdminQuizRemove(userId1, quizId2)).toStrictEqual({});

      expect((v2requestAdminQuizList(userId1) as QuizList).quizzes).toStrictEqual(
        [
          {
            quizId: quizId3,
            name: 'Test Quiz3',
          },
        ]
      );

      expect((v2requestAdminQuizList(userId2) as QuizList).quizzes).toStrictEqual(
        [
          {
            quizId: quizId6,
            name: 'Test Quiz6',
          },

        ]
      );

      expect(() => v2requestAdminQuizInfo(userId1, quizId1)).toThrow(HTTPError[403]);
      expect(() => v2requestAdminQuizInfo(userId1, quizId2)).toThrow(HTTPError[403]);
      expect(() => v2requestAdminQuizInfo(userId2, quizId4)).toThrow(HTTPError[403]);
      expect(() => v2requestAdminQuizInfo(userId2, quizId5)).toThrow(HTTPError[403]);
    });
  });
});

describe('GET, /v2/admin/quiz/{quizid}', () => {
  describe('Error Cases', () => {
    test('Empty database', () => {
      expect(() => v2requestAdminQuizInfo('InvalidToken', 1)).toThrow(HTTPError[401]);
    });

    test('Invalid userId, userId does not exist', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = v2requestAdminQuizCreate(user.token, 'Quiz 1', 'Description 1');
      expect(() => v2requestAdminQuizInfo(user.token + 'InvalidToken', quiz.quizId)).toThrow(HTTPError[401]);
    });

    test('Invalid quizId, quizId does not exist', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = v2requestAdminQuizCreate(user.token, 'Quiz 1', 'Description 1');
      expect(() => v2requestAdminQuizInfo(user.token, quiz.quizId + 1)).toThrow(HTTPError[403]);
    });

    test('Invalid quizId, quizId is not owned by given user', () => {
      const user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'OneFirst', 'OneLast');
      const user2 = requestAdminAuthRegister('user2@gmail.com', 'password123', 'TwoFirst', 'TwoLast');
      const user3 = requestAdminAuthRegister('user3@gmail.com', 'password123', 'ThreeFirst', 'ThreeLast');
      const quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description 1');
      const quiz2 = v2requestAdminQuizCreate(user2.token, 'Quiz 2', 'Description 2');

      expect(() => v2requestAdminQuizInfo(user1.token, quiz2.quizId)).toThrow(HTTPError[403]);
      expect(() => v2requestAdminQuizInfo(user2.token, quiz1.quizId)).toThrow(HTTPError[403]);
      expect(() => v2requestAdminQuizInfo(user3.token, quiz1.quizId)).toThrow(HTTPError[403]);
      expect(() => v2requestAdminQuizInfo(user3.token, quiz2.quizId)).toThrow(HTTPError[403]);
    });
  });

  describe('Success Cases', () => {
    test('Correct return object', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description');
      requestQuizThumbnailUpdate(user.token, quiz.quizId, URL);

      const response = v2requestAdminQuizInfo(user.token, quiz.quizId);
      expect(response).toStrictEqual({
        quizId: expect.any(Number),
        name: expect.any(String),
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: expect.any(String),
        numQuestions: 0,
        questions: [],
        duration: 0,
        thumbnailUrl: URL
      });
    });

    test('Returning quiz information for multiple users and quizzes', () => {
      const user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'OneFirst', 'OneLast');
      const user2 = requestAdminAuthRegister('user2@gmail.com', 'password123', 'TwoFirst', 'TwoLast');
      const quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description 1');
      const quiz2 = v2requestAdminQuizCreate(user2.token, 'Quiz 2', 'Description 2');
      const quiz3 = v2requestAdminQuizCreate(user2.token, 'Quiz 3', 'Description 3');
      requestQuizThumbnailUpdate(user1.token, quiz1.quizId, URL);
      requestQuizThumbnailUpdate(user2.token, quiz2.quizId, URL);

      const response1 = v2requestAdminQuizInfo(user1.token, quiz1.quizId);
      const response2 = v2requestAdminQuizInfo(user2.token, quiz2.quizId);
      const response3 = v2requestAdminQuizInfo(user2.token, quiz3.quizId);

      expect(response1).toStrictEqual({
        quizId: quiz1.quizId,
        name: 'Quiz 1',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Description 1',
        numQuestions: 0,
        questions: [],
        duration: 0,
        thumbnailUrl: URL
      });

      expect(response2).toStrictEqual({
        quizId: quiz2.quizId,
        name: 'Quiz 2',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Description 2',
        numQuestions: 0,
        questions: [],
        duration: 0,
        thumbnailUrl: URL
      });

      expect(response3).toStrictEqual({
        quizId: quiz3.quizId,
        name: 'Quiz 3',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Description 3',
        numQuestions: 0,
        questions: [],
        duration: 0
      });
    });

    test('Returning correct quiz, question and answer information', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description');
      requestQuizThumbnailUpdate(user.token, quiz.quizId, URL);

      const answers1 = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const answers2 = [
        { answer: 'Answer 1', correct: false },
        { answer: 'Answer 2', correct: true }
      ];

      const question1 = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question 1', 5, 10, answers1, URL);
      const question2 = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question 2', 5, 10, answers2, URL);

      const expectedAnswer1 = [
        {
          answerId: expect.any(Number),
          answer: 'Answer 1',
          colour: expect.any(String),
          correct: true
        },
        {
          answerId: expect.any(Number),
          answer: 'Answer 2',
          colour: expect.any(String),
          correct: false
        }
      ];

      const expectedAnswer2 = [
        {
          answerId: expect.any(Number),
          answer: 'Answer 1',
          colour: expect.any(String),
          correct: false
        },
        {
          answerId: expect.any(Number),
          answer: 'Answer 2',
          colour: expect.any(String),
          correct: true
        }
      ];

      const expectedQuestions = [
        {
          questionId: question1.questionId,
          question: 'Question 1',
          duration: 10,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer1
        },
        {
          questionId: question2.questionId,
          question: 'Question 2',
          duration: 10,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer2
        }
      ];

      const response = v2requestAdminQuizInfo(user.token, quiz.quizId);
      expect(response).toStrictEqual({
        quizId: quiz.quizId,
        name: 'Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Description',
        numQuestions: 2,
        questions: expectedQuestions,
        duration: 20,
        thumbnailUrl: URL
      });
    });
  });
});

describe('PUT, /v2/admin/quiz/{quizid}/name', () => {
  describe('Error Cases', () => {
    test('Testing error when invalid token', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = v2requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;
      expect(() => v2requestAdminQuizNameUpdate(userId + 'InvalidToken', quizId, 'Updated Quiz Name')).toThrow(HTTPError[401]);
    });

    test('Testing error when invalid quizId', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = v2requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;
      expect(() => v2requestAdminQuizNameUpdate(userId, quizId + 1, 'Updated Quiz Name')).toThrow(HTTPError[403]);
    });

    test('Testing error when user does not own supplied quiz', () => {
      const userId1 = requestAdminAuthRegister('test@email.com', 'password1', 'Testone', 'Userone').token;
      const userId2 = requestAdminAuthRegister('test1@email.com', 'password1', 'Testtwo', 'Usertwo').token;
      const quizId = v2requestAdminQuizCreate(userId1, 'Test Quiz', 'Test description').quizId;
      expect(() => v2requestAdminQuizNameUpdate(userId2, quizId, 'Updated Quiz Name')).toThrow(HTTPError[403]);
    });

    test('Updating quiz name with invalid characters in new name', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = v2requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;
      expect(() => v2requestAdminQuizNameUpdate(userId, quizId, 'Name.')).toThrow(HTTPError[400]);
    });

    test('Testing invalid name length and edge cases', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = v2requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;
      expect(() => v2requestAdminQuizNameUpdate(userId, quizId, 'AB')).toThrow(HTTPError[400]);
    });

    test('Testing error when two users own quizzes with the same name and duplicate name', () => {
      const userId1 = requestAdminAuthRegister('test@email.com', 'password1', 'Testone', 'Userone').token;
      const userId2 = requestAdminAuthRegister('test1@email.com', 'password1', 'Testtwo', 'Usertwo').token;

      v2requestAdminQuizCreate(userId1, 'Quiz1', 'Test description');
      v2requestAdminQuizCreate(userId2, 'Quiz1', 'Test description');
      const quizId3 = v2requestAdminQuizCreate(userId2, 'Quiz2', 'Test description').quizId;

      expect(() => v2requestAdminQuizNameUpdate(userId2, quizId3, 'Quiz1')).toThrow(HTTPError[400]);
    });

    test('Testing error when quizName is already used by the current logged in user', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const doubledUpName = 'Test Quiz 1';

      v2requestAdminQuizCreate(userId, doubledUpName, 'Test description');
      const quizId2 = v2requestAdminQuizCreate(userId, 'Test Quiz2', 'Test description').quizId;

      expect(() => v2requestAdminQuizNameUpdate(userId, quizId2, doubledUpName)).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('Testing correct return type when there is no error', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = v2requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;

      expect(v2requestAdminQuizNameUpdate(userId, quizId, 'Updated Quiz Name')).toStrictEqual({});
      expect(v2requestAdminQuizInfo(userId, quizId).timeLastEdited).toStrictEqual(expect.any(Number));
    });
    test('Testing that name update is saved', () => {
      const newName = 'Updated Name';
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = v2requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;

      expect(v2requestAdminQuizNameUpdate(userId, quizId, newName)).toStrictEqual({});
      const listedQuizzes = (v2requestAdminQuizList(userId) as QuizList).quizzes;
      expect(listedQuizzes).toStrictEqual(
        [
          {
            quizId: quizId,
            name: newName,
          },
        ]
      );
    });

    test('Updating quiz name when user owns multiple quizzes', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId1 = v2requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;
      const quizId2 = v2requestAdminQuizCreate(userId, '10 questions about water', 'An amazing quiz - NY Times').quizId;
      const quizId3 = v2requestAdminQuizCreate(userId, 'Trivia on Australia', 'Australia').quizId;

      expect(v2requestAdminQuizNameUpdate(userId, quizId1, 'Updated Name')).toStrictEqual({});
      const listedQuizzes = (v2requestAdminQuizList(userId) as QuizList).quizzes;
      expect(listedQuizzes.length === 3);
      expect(listedQuizzes).toEqual(expect.arrayContaining(
        [
          {
            quizId: quizId1,
            name: 'Updated Name',
          },
          {
            quizId: quizId2,
            name: '10 questions about water',
          },
          {
            quizId: quizId3,
            name: 'Trivia on Australia',
          },
        ]
      ));
    });

    test('Testing when two users own quizzes with the same name', () => {
      const userId1 = requestAdminAuthRegister('test@email.com', 'password1', 'Testone', 'Userone').token;
      const userId2 = requestAdminAuthRegister('test1@email.com', 'password1', 'Testtwo', 'Usertwo').token;
      v2requestAdminQuizCreate(userId1, 'Quiz Name', 'Test description');
      const quizId2 = v2requestAdminQuizCreate(userId2, 'Quiz Name', 'Test description').quizId;

      expect(v2requestAdminQuizNameUpdate(userId2, quizId2, 'Updated Quiz Name')).toStrictEqual({});
      const listedQuizzes = (v2requestAdminQuizList(userId2) as QuizList).quizzes;
      expect(listedQuizzes).toStrictEqual(
        [
          {
            quizId: quizId2,
            name: 'Updated Quiz Name',
          }
        ]
      );
    });

    test('Updating quiz name when there are multiple users owning multiple quizzes', () => {
      const userId1 = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const userId2 = requestAdminAuthRegister('bob@email.com', 'password1', 'Bob', 'User').token;
      const quizId1 = v2requestAdminQuizCreate(userId1, 'Test Quiz', 'Test description').quizId;
      const quizId2 = v2requestAdminQuizCreate(userId1, '10 questions about water', 'An amazing quiz - NY Times').quizId;
      const quizId3 = v2requestAdminQuizCreate(userId1, 'Trivia on Australia', 'Australia').quizId;
      const quizId4 = v2requestAdminQuizCreate(userId2, 'Cool Quiz', 'Cool quiz description').quizId;
      const quizId5 = v2requestAdminQuizCreate(userId2, '1531 quiz', 'Description').quizId;
      const quizId6 = v2requestAdminQuizCreate(userId2, 'Wowowowowowow', 'wowowow').quizId;

      expect(v2requestAdminQuizNameUpdate(userId2, quizId4, 'Updated Name')).toStrictEqual({});
      let listedQuizzes = (v2requestAdminQuizList(userId1) as QuizList).quizzes;
      expect(listedQuizzes.length === 3);
      expect(listedQuizzes).toEqual(expect.arrayContaining(
        [
          {
            quizId: quizId1,
            name: 'Test Quiz',
          },
          {
            quizId: quizId2,
            name: '10 questions about water',
          },
          {
            quizId: quizId3,
            name: 'Trivia on Australia',
          },
        ]
      ));

      listedQuizzes = (v2requestAdminQuizList(userId2) as QuizList).quizzes;
      expect(listedQuizzes.length === 4);
      expect(listedQuizzes).toEqual(expect.arrayContaining(
        [
          {
            quizId: quizId4,
            name: 'Updated Name',
          },
          {
            quizId: quizId5,
            name: '1531 quiz',
          },
          {
            quizId: quizId6,
            name: 'Wowowowowowow',
          },
        ]
      ));
    });

    test('Testing boundary conditions for valid names', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = v2requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;

      expect(v2requestAdminQuizNameUpdate(userId, quizId, 'quizName thats thirty chars aa')).toStrictEqual({});
      const listedQuizzes = (v2requestAdminQuizList(userId) as QuizList).quizzes;
      expect(listedQuizzes).toStrictEqual(
        [
          {
            quizId: quizId,
            name: 'quizName thats thirty chars aa',
          }
        ]
      );
    });

    test('Do nothing when new name is the same as existing name', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = v2requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;

      expect(v2requestAdminQuizNameUpdate(userId, quizId, 'Test Quiz')).toStrictEqual({});
      const listedQuizzes = (v2requestAdminQuizList(userId) as QuizList).quizzes;
      expect(listedQuizzes).toStrictEqual(
        [
          {
            quizId: quizId,
            name: 'Test Quiz',
          }
        ]
      );
    });
  });
});

describe('PUT, /v2/admin/quiz/{quizid}/description', () => {
  let user1: Token;
  let user2: Token;
  let quiz1: QuizId;
  let quiz2: QuizId;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('BATBeast@email.com', 'iL0v3B3ll3', 'Prince', 'Adam') as Token;
    user2 = requestAdminAuthRegister('Belle123@email.com', 'iL0v3B3aSt', 'Princess', 'Belle') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'description.') as QuizId;
    quiz2 = v2requestAdminQuizCreate(user2.token, 'Quiz 2', 'description') as QuizId;
  });

  describe('Correct status code and return value', () => {
    test.each([
      '',
      '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
    ])('Valid Descriptions even with empty string, <= 100 characters', (description) => {
      const descUpd = v2requestAdminQuizDescriptionUpdate(user1.token, quiz1.quizId, description);
      expect(descUpd).toStrictEqual({});

      const quizInfo = v2requestAdminQuizInfo(user1.token, quiz1.quizId);
      expect(quizInfo.description).toStrictEqual(description);
      expect(quizInfo.timeLastEdited).toStrictEqual(expect.any(Number));
    });

    test('Token and UserId exists', () => {
      const descUpd = v2requestAdminQuizDescriptionUpdate(user1.token, quiz1.quizId, 'Git Building Blocks.');
      expect(descUpd).toStrictEqual({});

      const quizInfo = v2requestAdminQuizInfo(user1.token, quiz1.quizId);
      expect(quizInfo.description).toStrictEqual('Git Building Blocks.');
      expect(quizInfo.timeLastEdited).toStrictEqual(expect.any(Number));
    });
  });

  describe('Error cases', () => {
    test('Description more than 100 characters', () => {
      const description = '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901';
      expect(() => v2requestAdminQuizDescriptionUpdate(user1.token, quiz1.quizId, description)).toThrow(HTTPError[400]);
    });

    test('Token does not exist', () => {
      expect(() => v2requestAdminQuizDescriptionUpdate(user1.token + 'InvalidToken', quiz2.quizId, 'Git Building Blocks.')).toThrow(HTTPError[401]);
    });

    test('QuizId does not exist', () => {
      const quizIdSum = quiz1.quizId + quiz2.quizId;
      expect(() => v2requestAdminQuizDescriptionUpdate(user1.token, quizIdSum, 'Git Building Blocks.')).toThrow(HTTPError[403]);
    });

    test('QuizId not owned by User', () => {
      expect(() => v2requestAdminQuizDescriptionUpdate(user1.token, quiz2.quizId, 'Git Building Blocks.')).toThrow(HTTPError[403]);
    });
  });
});

describe('GET, /v2/admin/quiz/trash', () => {
  let userToken: string;
  let quizId: number;
  beforeEach(() => {
    const response = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User');
    userToken = (response as Token).token;
    quizId = v2requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description').quizId;
    v2requestAdminQuizRemove(userToken, quizId);
  });

  describe('Error Cases', () => {
    test('Return error when invalid token', () => {
      expect(() => v2requestAdminQuizTrashView(userToken + 'InvalidToken')).toThrow(HTTPError[401]);
    });
  });

  describe('Success Cases', () => {
    test('User with no trashed quizzes', () => {
      const userToken1 = requestAdminAuthRegister('test1@email.com', 'password1', 'TestOne', 'UserOne').token;
      expect((v2requestAdminQuizTrashView(userToken1)).quizzes).toStrictEqual([]);
    });

    test('Correct return for one user and one quiz', () => {
      expect((v2requestAdminQuizTrashView(userToken)).quizzes).toStrictEqual([
        {
          quizId: quizId,
          name: 'Test Quiz',
        }
      ]);
    });

    test('Mix of trashed quizzes and non trashed quizzes', () => {
      v2requestAdminQuizCreate(userToken, 'Test Quiz1', 'Test description1');
      expect((v2requestAdminQuizTrashView(userToken)).quizzes).toStrictEqual([
        {
          quizId: quizId,
          name: 'Test Quiz',
        }
      ]);
    });

    test('Multiple trashed quizzes', () => {
      const quizId1 = v2requestAdminQuizCreate(userToken, 'Test Quiz1', 'Test description1').quizId;
      v2requestAdminQuizRemove(userToken, quizId1);
      const quizId2 = v2requestAdminQuizCreate(userToken, 'Test Quiz2', 'Test description2').quizId;
      v2requestAdminQuizRemove(userToken, quizId2);

      const trashedQuizzes = (v2requestAdminQuizTrashView(userToken)).quizzes;
      expect(trashedQuizzes).toEqual(expect.arrayContaining([
        {
          quizId: quizId,
          name: 'Test Quiz',
        },
        {
          quizId: quizId1,
          name: 'Test Quiz1',
        },
        {
          quizId: quizId2,
          name: 'Test Quiz2',
        }
      ]));
      expect(trashedQuizzes.length).toStrictEqual(3);
    });

    test('Mix of multiple trashed quizzes and untrashed quizzes from multiple users', () => {
      // Creating 3 quizzes for anotherUser and removing 2
      const anotherUser = requestAdminAuthRegister('test1@email.com', 'password2', 'TestOne', 'UserTwo').token;

      const quizId1 = v2requestAdminQuizCreate(anotherUser, 'Test Quiz1', 'Test description1').quizId;
      const quizId2 = v2requestAdminQuizCreate(anotherUser, 'Test Quiz2', 'Test description2').quizId;
      const quizId3 = v2requestAdminQuizCreate(anotherUser, 'Test Quiz3', 'Test description3').quizId;

      v2requestAdminQuizRemove(anotherUser, quizId2);
      v2requestAdminQuizRemove(anotherUser, quizId3);

      // Creating 2 more quizzes for original user and removing one more quiz
      const quizId4 = v2requestAdminQuizCreate(userToken, 'Test Quiz4', 'Test description4').quizId;
      const quizId5 = v2requestAdminQuizCreate(userToken, 'Test Quiz5', 'Test description5').quizId;

      v2requestAdminQuizRemove(userToken, quizId5);

      let trashedQuizzes = (v2requestAdminQuizTrashView(userToken)).quizzes;
      expect(trashedQuizzes).toEqual(expect.arrayContaining([
        {
          quizId: quizId,
          name: 'Test Quiz',
        },
        {
          quizId: quizId5,
          name: 'Test Quiz5',
        },
      ]));
      expect(trashedQuizzes.length).toStrictEqual(2);

      trashedQuizzes = (v2requestAdminQuizTrashView(anotherUser)).quizzes;
      expect(trashedQuizzes).toEqual(expect.arrayContaining([
        {
          quizId: quizId2,
          name: 'Test Quiz2',
        },
        {
          quizId: quizId3,
          name: 'Test Quiz3',
        },
      ]));
      expect(trashedQuizzes.length).toStrictEqual(2);

      // Checking non trashed quizzes
      let unTrashedQuizzes = (v2requestAdminQuizList(anotherUser)).quizzes;
      expect(unTrashedQuizzes).toStrictEqual([
        {
          quizId: quizId1,
          name: 'Test Quiz1',
        },
      ]);

      unTrashedQuizzes = (v2requestAdminQuizList(userToken)).quizzes;
      expect(unTrashedQuizzes).toStrictEqual([
        {
          quizId: quizId4,
          name: 'Test Quiz4',
        },
      ]);
    });
  });
});

describe('POST, /v2/admin/quiz/{quizid}/restore', () => {
  let userToken: string;
  let quizId: number;
  beforeEach(() => {
    const response = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User');
    userToken = (response as Token).token;
    quizId = v2requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description').quizId;
    v2requestAdminQuizRemove(userToken, quizId);
  });

  describe('Error Cases', () => {
    test('Quiz name of the restored quiz is already used by another active quiz', () => {
      v2requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description');
      expect(() => v2requestAdminQuizTrashRestore(userToken, quizId)).toThrow(HTTPError[400]);
    });

    test('Invalid quizId', () => {
      expect(() => v2requestAdminQuizTrashRestore(userToken, quizId + 1)).toThrow(HTTPError[403]);
    });

    test('Quiz ID refers to a quiz that is not currently in the trash', () => {
      const quizId1 = v2requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description').quizId;
      expect(() => v2requestAdminQuizTrashRestore(userToken, quizId1)).toThrow(HTTPError[400]);
    });

    test('Tnvalid token', () => {
      expect(() => v2requestAdminQuizTrashRestore(userToken + 'InvalidToken', quizId)).toThrow(HTTPError[401]);
    });

    test('Empty token', () => {
      expect(() => v2requestAdminQuizTrashRestore('', quizId)).toThrow(HTTPError[401]);
    });

    test('User does not own trashed quiz', () => {
      const userToken1 = requestAdminAuthRegister('test1@email.com', 'password1', 'TestOne', 'UserOne').token;
      expect(() => v2requestAdminQuizTrashRestore(userToken1, quizId)).toThrow(HTTPError[403]);
    });

    test('User does not own untrashed quiz', () => {
      const userToken1 = requestAdminAuthRegister('test1@email.com', 'password1', 'TestOne', 'UserOne').token;
      const quizId1 = v2requestAdminQuizCreate(userToken1, 'Test Quiz1', 'Test description1').quizId;
      expect(() => v2requestAdminQuizTrashRestore(userToken, quizId1)).toThrow(HTTPError[403]);
    });
  });

  describe('Success Cases', () => {
    test('Basic functionality', () => {
      expect(v2requestAdminQuizTrashRestore(userToken, quizId)).toStrictEqual({});
      expect(v2requestAdminQuizList(userToken)).toStrictEqual({
        quizzes: [
          {
            quizId: quizId,
            name: 'Test Quiz',
          },
        ]
      });
      expect(v2requestAdminQuizTrashView(userToken)).toStrictEqual({
        quizzes: []
      });
    });

    test('Restoring multiple quizzes when muliple quizzes in trash and multiple users', () => {
      const anotherUser = requestAdminAuthRegister('test1@email.com', 'password1', 'TestOne', 'UserOne').token;

      // Creating one more quiz of original user and removing it
      const quizId1 = v2requestAdminQuizCreate(userToken, 'Test Quiz1', 'Test description').quizId;
      v2requestAdminQuizRemove(userToken, quizId1);

      // Creating 2 more quizzes of new user and removing them
      const quizId2 = v2requestAdminQuizCreate(anotherUser, 'Test Quiz2', 'Test description').quizId;
      const quizId3 = v2requestAdminQuizCreate(anotherUser, 'Test Quiz3', 'Test description').quizId;
      v2requestAdminQuizRemove(anotherUser, quizId2);
      v2requestAdminQuizRemove(anotherUser, quizId3);

      // Restoring the removed quiz for original user
      v2requestAdminQuizTrashRestore(userToken, quizId1);
      expect(v2requestAdminQuizList(userToken)).toStrictEqual({
        quizzes: [
          {
            quizId: quizId1,
            name: 'Test Quiz1',
          },
        ]
      });

      // Checking the quiz has been removed from trash
      expect((v2requestAdminQuizTrashView(userToken)).quizzes).toStrictEqual([
        {
          quizId: quizId,
          name: 'Test Quiz',
        },
      ]);

      // Checking that new user's trash is unaffected
      const trashQuizzes = (v2requestAdminQuizTrashView(anotherUser)).quizzes;
      expect(trashQuizzes).toEqual(expect.arrayContaining([
        {
          quizId: quizId2,
          name: 'Test Quiz2',
        },
        {
          quizId: quizId3,
          name: 'Test Quiz3',
        }
      ]));
      expect(trashQuizzes.length).toStrictEqual(2);
    });

    test('Restoring quiz when multiple quizzes in trash', () => {
      const quizId1 = v2requestAdminQuizCreate(userToken, 'Test Quiz1', 'Test description').quizId;
      v2requestAdminQuizRemove(userToken, quizId1);
      v2requestAdminQuizTrashRestore(userToken, quizId1);
      expect(v2requestAdminQuizList(userToken)).toStrictEqual({
        quizzes: [
          {
            quizId: quizId1,
            name: 'Test Quiz1',
          },
        ]
      });
      expect((v2requestAdminQuizTrashView(userToken)).quizzes).toStrictEqual([
        {
          quizId: quizId,
          name: 'Test Quiz',
        },
      ]);
    });
  });
});

describe('DELETE, /v2/admin/quiz/trash/empty', () => {
  describe('Error Cases', () => {
    test('Empty database', () => {
      expect(() => v2requestAdminQuizTrashEmpty('InvalidToken', '[1]')).toThrow(HTTPError[401]);
    });

    test('Invalid token, token does not exist', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description');
      v2requestAdminQuizRemove(user.token, quiz.quizId);

      expect(() => v2requestAdminQuizTrashEmpty(user.token + 1, `[${quiz.quizId}]`)).toThrow(HTTPError[401]);
    });

    test('One or more quizIds not in trash', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz1 = v2requestAdminQuizCreate(user.token, 'Quiz 1', 'Description 1');
      const quiz2 = v2requestAdminQuizCreate(user.token, 'Quiz 2', 'Description 2');
      const quiz3 = v2requestAdminQuizCreate(user.token, 'Quiz 3', 'Description 3');
      v2requestAdminQuizRemove(user.token, quiz1.quizId);
      v2requestAdminQuizRemove(user.token, quiz2.quizId);

      expect(() => v2requestAdminQuizTrashEmpty(user.token, `[${quiz1.quizId}, ${quiz2.quizId}, ${quiz3.quizId}]`)).toThrow(HTTPError[400]);
    });

    test('One or more quizIds does not belong to user', () => {
      const user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const user2 = requestAdminAuthRegister('user2@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description 1');
      const quiz2 = v2requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description 2');
      const quiz3 = v2requestAdminQuizCreate(user2.token, 'Quiz 3', 'Description 3');
      v2requestAdminQuizRemove(user1.token, quiz1.quizId);
      v2requestAdminQuizRemove(user1.token, quiz2.quizId);
      v2requestAdminQuizRemove(user2.token, quiz3.quizId);

      expect(() => v2requestAdminQuizTrashEmpty(user1.token, `[${quiz1.quizId}, ${quiz2.quizId}, ${quiz3.quizId}]`)).toThrow(HTTPError[403]);
    });
  });

  describe('Success Cases', () => {
    test('Correct return object', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description');
      v2requestAdminQuizRemove(user.token, quiz.quizId);

      const response = v2requestAdminQuizTrashEmpty(user.token, `[${quiz.quizId}]`);
      expect(response).toStrictEqual({});
    });

    test('Empty one quiz from trash', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description');
      v2requestAdminQuizRemove(user.token, quiz.quizId);

      const response = v2requestAdminQuizTrashEmpty(user.token, `[${quiz.quizId}]`);
      expect(response).toStrictEqual({});

      const trashList: QuizList = v2requestAdminQuizTrashView(user.token) as QuizList;
      expect(trashList.quizzes).toStrictEqual([]);

      const quizList: QuizList = v2requestAdminQuizList(user.token) as QuizList;
      expect(quizList.quizzes).toStrictEqual([]);
    });

    test('Empty all quizzes from trash', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz1 = v2requestAdminQuizCreate(user.token, 'Quiz 1', 'Description 1');
      const quiz2 = v2requestAdminQuizCreate(user.token, 'Quiz 2', 'Description 2');
      v2requestAdminQuizRemove(user.token, quiz1.quizId);
      v2requestAdminQuizRemove(user.token, quiz2.quizId);

      const response = v2requestAdminQuizTrashEmpty(user.token, `[${quiz1.quizId}, ${quiz2.quizId}]`);
      expect(response).toStrictEqual({});

      const list: QuizList = v2requestAdminQuizTrashView(user.token) as QuizList;
      expect(list.quizzes).toStrictEqual([]);
    });

    test('Empty some quizzes from trash', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz1 = v2requestAdminQuizCreate(user.token, 'Quiz 1', 'Description 1');
      const quiz2 = v2requestAdminQuizCreate(user.token, 'Quiz 2', 'Description 2');
      const quiz3 = v2requestAdminQuizCreate(user.token, 'Quiz 3', 'Description 3');
      v2requestAdminQuizRemove(user.token, quiz1.quizId);
      v2requestAdminQuizRemove(user.token, quiz2.quizId);
      v2requestAdminQuizRemove(user.token, quiz3.quizId);

      const response = v2requestAdminQuizTrashEmpty(user.token, `[${quiz1.quizId}, ${quiz2.quizId}]`);
      expect(response).toStrictEqual({});

      const expectedList = [
        {
          quizId: quiz3.quizId,
          name: 'Quiz 3'
        }
      ];
      const list: QuizList = v2requestAdminQuizTrashView(user.token) as QuizList;
      expect(list.quizzes).toStrictEqual(expectedList);
    });

    test('Emptying some quizzes from trash from multiple users', () => {
      const user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const user2 = requestAdminAuthRegister('user2@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description 1');
      const quiz2 = v2requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description 2');
      const quiz3 = v2requestAdminQuizCreate(user1.token, 'Quiz 3', 'Description 3');
      const quiz4 = v2requestAdminQuizCreate(user2.token, 'Quiz 4', 'Description 4');
      const quiz5 = v2requestAdminQuizCreate(user2.token, 'Quiz 5', 'Description 5');
      v2requestAdminQuizRemove(user1.token, quiz1.quizId);
      v2requestAdminQuizRemove(user1.token, quiz2.quizId);
      v2requestAdminQuizRemove(user1.token, quiz3.quizId);
      v2requestAdminQuizRemove(user2.token, quiz4.quizId);
      v2requestAdminQuizRemove(user2.token, quiz5.quizId);

      const response1 = v2requestAdminQuizTrashEmpty(user1.token, `[${quiz1.quizId}, ${quiz3.quizId}]`);
      expect(response1).toStrictEqual({});

      const response2 = v2requestAdminQuizTrashEmpty(user2.token, `[${quiz4.quizId}]`);
      expect(response2).toStrictEqual({});

      const expectedList1 = [
        {
          quizId: quiz2.quizId,
          name: 'Quiz 2'
        }
      ];
      const list1: QuizList = v2requestAdminQuizTrashView(user1.token) as QuizList;
      expect(list1.quizzes).toStrictEqual(expectedList1);

      const expectedList2 = [
        {
          quizId: quiz5.quizId,
          name: 'Quiz 5'
        }
      ];
      const list2: QuizList = v2requestAdminQuizTrashView(user2.token) as QuizList;
      expect(list2.quizzes).toStrictEqual(expectedList2);
    });
  });
});

describe('POST, /v2/admin/quiz/transfer', () => {
  let user1: Token;
  let user2: Token;
  let quiz1: QuizId;
  let quiz2: QuizId;

  beforeEach(() => {
    user1 = requestAdminAuthRegister('happycats@gmail.com', 'Cats4lyfe!!!', 'Hello', 'Kitty') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Cats', 'How much do you know about cats') as QuizId;

    user2 = requestAdminAuthRegister('theLittlePrince@gmail.com', 'myRose123.1', 'Little', 'Prince') as Token;
    quiz2 = v2requestAdminQuizCreate(user2.token, 'roses', 'Which is the best rose') as QuizId;
  });

  describe('Success Cases', () => {
    test('valid inputs', () => {
      const result = v2requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz1.quizId);
      const user2Dets: QuizList = v2requestAdminQuizList(user2.token) as QuizList;
      const user1Dets: QuizList = v2requestAdminQuizList(user1.token) as QuizList;

      expect(user2Dets.quizzes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ quizId: quiz1.quizId })
        ])
      );

      expect(user1Dets.quizzes).toEqual(
        expect.not.arrayContaining([quiz1.quizId])
      );
      expect(result).toStrictEqual({});
    });

    test('moving quiz multiple times', () => {
      const user3: Token = requestAdminAuthRegister('helllooo@email.com', 'blaharj12.', 'Bananas', 'Pyjamas') as Token;
      v2requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz1.quizId);
      v2requestAdminQuizTransfer(user2.token, 'helllooo@email.com', quiz2.quizId);
      const result = v2requestAdminQuizTransfer(user2.token, 'helllooo@email.com', quiz1.quizId);
      const user2Dets: QuizList = v2requestAdminQuizList(user2.token) as QuizList;
      const user3Dets: QuizList = v2requestAdminQuizList(user3.token) as QuizList;

      expect(user3Dets.quizzes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ quizId: quiz1.quizId }),
        ])
      );

      expect(user3Dets.quizzes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ quizId: quiz2.quizId }),
        ])
      );

      expect(user2Dets.quizzes).toEqual(
        expect.not.arrayContaining([quiz1.quizId])
      );

      expect(user2Dets.quizzes).toEqual(
        expect.not.arrayContaining([quiz2.quizId])
      );

      expect(result).toStrictEqual({});
    });
  });

  describe('Error Cases', () => {
    test('Invalid Token', () => {
      expect(() => v2requestAdminQuizTransfer(user1.token + 'InvalidToken', 'theLittlePrince@gmail.com', quiz1.quizId)).toThrow(HTTPError[401]);
    });

    test('invalid quizId', () => {
      expect(() => v2requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz1.quizId + 67890456)).toThrow(HTTPError[403]);
    });

    test('User does not own the quiz', () => {
      expect(() => v2requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz2.quizId)).toThrow(HTTPError[403]);
    });

    test('useremail entered is not a real user', () => {
      expect(() => v2requestAdminQuizTransfer(user1.token, 'example.email@gmail.com', quiz1.quizId)).toThrow(HTTPError[400]);
    });

    test('useremail is the current logged in user', () => {
      expect(() => v2requestAdminQuizTransfer(user1.token, 'happycats@gmail.com', quiz1.quizId)).toThrow(HTTPError[400]);
    });

    test('Quiz ID refers to a quiz that has a name that is already used by the target user', () => {
      v2requestAdminQuizCreate(user2.token, 'Cats', 'what is my favourite car') as QuizId;
      expect(() => v2requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz1.quizId)).toThrow(HTTPError[400]);
    });

    test('Any session for this quiz is not in END state', () => {
      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question', 5, 10, answers, URL);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      expect(() => v2requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz1.quizId)).toThrow(HTTPError[400]);
    });
  });
});

describe('POST, /v2/admin/quiz/question', () => {
  let quiz1: QuizId;
  let user1: Token;

  beforeEach(() => {
    user1 = requestAdminAuthRegister('happycats@gmail.com', 'Cats4lyfe!!!', 'Hello', 'Kitty') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Cats', 'How much do you know about cats') as QuizId;
  });

  describe('Success Cases', () => {
    test('Create one question', () => {
      const answers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: 'naps', correct: true },
      ];

      const result = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do cats love the most?', 5, 10, answers, URL);
      expect(result).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('question with 6 answers', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: true },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: false },
        { answer: 'Niemohi', correct: false },
        { answer: 'Zigjuhok', correct: false },
      ];

      const result1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 6, 8, answer1, URL);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('all true answers', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: true },
        { answer: 'Kecihiwa', correct: true },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: true },
      ];

      const result1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 6, 8, answer1, URL);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('question string is exactly 5 chars', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: true },
        { answer: 'Nazivzik', correct: false },
        { answer: 'Fikjujhe', correct: false },
      ];

      const result1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'City!', 6, 8, answer1, URL);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('question string is exactly 50 chars', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: true },
        { answer: 'Nazivzik', correct: false },
        { answer: 'Fikjujhe', correct: false },
      ];

      const result1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'NMDVJTIPYCLNKFRUMWIBUUUBAFCFOYSDVPTQKYRYDVBJSEBFMH', 6, 8, answer1, URL);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('1 point awarded to question', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: true },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: false },
        { answer: 'Fikjujhe', correct: false },
      ];

      const result1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1, URL);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('10 points awarded to question', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: false },
      ];

      const result1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 10, 8, answer1, URL);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('answer strings are 1 or 30 characters', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'H', correct: false },
        { answer: 'New York City is the answer.', correct: true },
      ];

      const result1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1, URL);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('Duplicate answer strings for Different questions', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: false },
      ];

      const answer2: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: false },
      ];

      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 10, 8, answer1, URL);
      const result2 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city', 6, 10, answer2, URL);
      expect(result2).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('duration of quiz is exactly 3 minutes', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: false },
      ];

      const answer2: QuestionAnswer[] = [
        { answer: 'Bepjemar', correct: true },
        { answer: 'Tegkeninu', correct: false },
      ];

      const answer3: QuestionAnswer[] = [
        { answer: 'Ohedinfi', correct: false },
        { answer: 'Hafeuvi', correct: false },
        { answer: 'Cohawpeb', correct: true },
      ];

      const answer4: QuestionAnswer[] = [
        { answer: 'Pidumec', correct: false },
        { answer: 'Hipahe', correct: true },
      ];

      const answer5: QuestionAnswer[] = [
        { answer: 'Basewom', correct: true },
        { answer: 'Eclomsul', correct: false },
      ];

      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 10, 20, answer1, URL);
      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city', 6, 20, answer2, URL);
      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best citys', 6, 50, answer3, URL);
      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'yipeee', 6, 40, answer4, URL);
      const result5 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'hii whats your fav colour', 6, 50, answer5, URL);

      expect(result5).toStrictEqual({ questionId: expect.any(Number) });
    });
  });

  describe('Error Cases', () => {
    test('All answers are false', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: false },
        { answer: 'Fikjujhe', correct: false },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1, URL)).toThrow(HTTPError[400]);
    });

    test('one answer inputted', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: true },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1, URL)).toThrow(HTTPError[400]);
    });

    test('7 answers inputted', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: false },
        { answer: 'Kijojhi', correct: false },
        { answer: 'Mutodavu', correct: false },
        { answer: 'Hiniafi', correct: false },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1, URL)).toThrow(HTTPError[400]);
    });

    test('timeAllowed is negative', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, -8, answer1, URL)).toThrow(HTTPError[400]);
    });

    test('points awarded are less than 1', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 0, 8, answer1, URL)).toThrow(HTTPError[400]);
    });

    test('points awarded are more than 10', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 11, 8, answer1, URL)).toThrow(HTTPError[400]);
    });

    test('length of answer is less than 1', () => {
      const answer1: QuestionAnswer[] = [
        { answer: '', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 5, 8, answer1, URL)).toThrow(HTTPError[400]);
    });

    test('answer strings are duplicates', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Jaljuemi', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Kecihiwa', correct: false },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 5, 8, answer1, URL)).toThrow(HTTPError[400]);
    });

    test('duration of quiz is more than 3 minutes', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: false },
      ];

      const answer2: QuestionAnswer[] = [
        { answer: 'Bepjemar', correct: true },
        { answer: 'Tegkeninu', correct: false },
      ];

      const answer3: QuestionAnswer[] = [
        { answer: 'Ohedinfi', correct: false },
        { answer: 'Hafeuvi', correct: false },
        { answer: 'Cohawpeb', correct: true },
      ];

      const answer4: QuestionAnswer[] = [
        { answer: 'Pidumec', correct: false },
        { answer: 'Hipahe', correct: true },
      ];

      const answer5: QuestionAnswer[] = [
        { answer: 'Basewom', correct: true },
        { answer: 'Eclomsul', correct: false },
      ];

      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 10, 20, answer1, URL);
      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city', 6, 30, answer2, URL);
      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best citys', 6, 60, answer3, URL);
      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'yipeee', 6, 40, answer4, URL);
      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'hii whats your fav colour', 6, 31, answer5, URL)).toThrow(HTTPError[400]);
    });

    test('Invalid Token', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Jaljuemi', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Geadodi', correct: false },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, '456789', 'Best city in the world', 5, 8, answer1, URL)).toThrow(HTTPError[401]);
    });

    test('Invalid quizId', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Jaljuemi', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Geoduek', correct: false },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(567890, user1.token, 'Best city in the world', 5, 8, answer1, URL)).toThrow(HTTPError[403]);
    });

    test('user does not own the quiz', () => {
      const user2: Token = requestAdminAuthRegister('emuse@gmail.com', '7dsheZvbJ.', 'Princess', 'Peach') as Token;
      const quiz2: QuizId = v2requestAdminQuizCreate(user2.token, 'Books', 'i am nerD') as QuizId;
      const answer1: QuestionAnswer[] = [
        { answer: 'Jaljuemi', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Pudhubpe', correct: false },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz2.quizId, user1.token, 'Best city in the world', 5, 8, answer1, URL)).toThrow(HTTPError[403]);
    });

    test('thumbnail url is empty string', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1, '   ')).toThrow(HTTPError[400]);
    });

    test('thumbnail url does not begin with "http://" or "https://"', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1, 'urlblhablhanlha.jpg')).toThrow(HTTPError[400]);
    });

    test('thumbnail url does not end with "jpg", "jpeg" or "png"', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1, 'http://urlblhablhanlha.haha')).toThrow(HTTPError[400]);
    });
  });

  describe('Checking quiz properties updated correctly', () => {
    test('Quiz time last edited is updated ', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Jaljuemi', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Pudhubpe', correct: false },
      ];

      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 8, 5, answer1, URL);

      const result1: QuizInfo = v2requestAdminQuizInfo(user1.token, quiz1.quizId) as QuizInfo;
      const quizTimeEdited = result1.timeLastEdited;
      expect(quizTimeEdited).toStrictEqual(expect.any(Number));
    });
  });
});

describe('PUT, /v2/admin/quiz/{quizid}/question/{questionid}', () => {
  let user1: Token;
  let quiz1: QuizId;
  let quizquestion1: QuestionId;
  let answers: QuestionAnswer[];

  beforeEach(() => {
    user1 = requestAdminAuthRegister('BATBeast@email.com', 'iL0v3B3ll3', 'Prince', 'Adam') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'description.') as QuizId;
    answers = [
      { answer: 'their humans', correct: false },
      { answer: 'naps', correct: true },
      { answer: 'food', correct: false },
    ];
    quizquestion1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do cats love the most?', 5, 5, answers, URL) as QuestionId;
  });

  describe('Success Cases', () => {
    test('Changing all values', () => {
      const newAnswers = [
        { answer: 'H', correct: false },
        { answer: 'HelloHelloHelloHelloHello', correct: true },
        { answer: 'food', correct: false },
      ];

      const updatedquizquestion1 = v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'HelloH', 6, 180, newAnswers, URL2);
      expect(updatedquizquestion1).toStrictEqual({});
      const expectedAnswer = [
        {
          answerId: expect.any(Number),
          answer: 'H',
          colour: expect.any(String),
          correct: false
        },
        {
          answerId: expect.any(Number),
          answer: 'HelloHelloHelloHelloHello',
          colour: expect.any(String),
          correct: true
        },
        {
          answerId: expect.any(Number),
          answer: 'food',
          colour: expect.any(String),
          correct: false
        },
      ];

      const expectedQuestions = [
        {
          questionId: quizquestion1.questionId,
          question: 'HelloH',
          duration: 180,
          thumbnailUrl: URL2,
          points: 6,
          answers: expectedAnswer,
        },
      ];

      const response = v2requestAdminQuizInfo(user1.token, quiz1.quizId);
      expect(response).toStrictEqual({
        quizId: quiz1.quizId,
        name: 'Quiz 1',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'description.',
        numQuestions: 1,
        questions: expectedQuestions,
        duration: 180
      });
    });
  });

  describe('Error Cases', () => {
    test('Question ID does not exist', () => {
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId + 1, 'What do cats love the most?', 5, 5, answers, URL)).toThrow(HTTPError[400]);
    });

    test.each([
      '',
      'HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloH'
    ])('Question String < 5 or > 50 chars in length', (questionString) => {
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, questionString, 5, 5, answers, URL)).toThrow(HTTPError[400]);
    });

    test('Question has less than 2 answers', () => {
      const lessAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false }
      ];
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, lessAnswers, URL)).toThrow(HTTPError[400]);
    });

    test('Question has more than 6 answers', () => {
      const moreAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: 'naps', correct: true },
        { answer: 'food', correct: false },
        { answer: 'playing games', correct: false },
        { answer: 'walking', correct: false },
        { answer: 'fighting', correct: false },
        { answer: 'meowing', correct: false }
      ];
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, moreAnswers, URL)).toThrow(HTTPError[400]);
    });

    test('Time Allowed is negative', () => {
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, -5, answers, URL)).toThrow(HTTPError[400]);
    });

    test('Time Allowed exceeds 3 minutes', () => {
      v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do cats hate the most?', 5, 100, answers, URL);
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 81, answers, URL)).toThrow(HTTPError[400]);
    });

    test.each([
      0,
      11
    ])('Points awarded are < 1 or > 10', (points) => {
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', points, 5, answers, URL)).toThrow(HTTPError[400]);
    });

    test('Answer string is less than 1 char long', () => {
      const tooShortAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: '', correct: true }
      ];
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, tooShortAnswers, URL)).toThrow(HTTPError[400]);
    });

    test('Answer string is more than 30 chars long', () => {
      const tooLongAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: 'HelloHelloHelloHelloHelloHelloH', correct: true }
      ];
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, tooLongAnswers, URL)).toThrow(HTTPError[400]);
    });

    test('Duplicate answer string', () => {
      const duplicateAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: 'their humans', correct: true }
      ];
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, duplicateAnswers, URL)).toThrow(HTTPError[400]);
    });

    test('No correct answers', () => {
      const falseAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: 'food', correct: false }
      ];
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, falseAnswers, URL)).toThrow(HTTPError[400]);
    });

    test('Invalid Token', () => {
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token + 'Invalid Token', quizquestion1.questionId, 'What do cats love the most?', 5, 5, answers, URL)).toThrow(HTTPError[401]);
    });

    test('Invalid Quiz ID', () => {
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId + 1, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, answers, URL)).toThrow(HTTPError[403]);
    });

    test('User does not own quiz', () => {
      const user2: Token = requestAdminAuthRegister('Belle123@email.com', 'iL0v3B3aSt', 'Princess', 'Belle') as Token;
      expect(() => v2requestAdminQuizQuestionUpdate(quiz1.quizId, user2.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, answers, URL)).toThrow(HTTPError[403]);
    });
  });
});

describe('DELETE, /v2/admin/quiz/{quizid}/question/{questionid}', () => {
  describe('Error Cases', () => {
    test('Empty database', () => {
      expect(() => v2requestAdminQuizQuestionDelete('InvalidToken', 1, 1)).toThrow(HTTPError[401]);
    });

    test('Invalid userId, userId does not exist', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers, URL) as QuestionId;

      expect(() => v2requestAdminQuizQuestionDelete(user.token + 1, quiz.quizId, question.questionId)).toThrow(HTTPError[401]);
    });

    test('Invalid quizId, quizId does not exist', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers, URL) as QuestionId;

      expect(() => v2requestAdminQuizQuestionDelete(user.token, quiz.quizId + 1, question.questionId)).toThrow(HTTPError[403]);
    });

    test('Invalid quizId, quizId is not owned by given user', () => {
      const user1: Token = requestAdminAuthRegister('user1@gmail.com', 'password123', 'OneFirst', 'OneLast') as Token;
      const user2: Token = requestAdminAuthRegister('user2@gmail.com', 'password123', 'TwoFirst', 'TwoLast') as Token;
      const quiz1: QuizId = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description 1') as QuizId;
      const quiz2: QuizId = v2requestAdminQuizCreate(user2.token, 'Quiz 2', 'Description 2') as QuizId;

      const answers1 = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const answers2 = [
        { answer: 'Answer 1', correct: false },
        { answer: 'Answer 2', correct: true }
      ];
      const question1: QuestionId = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 1', 5, 10, answers1, URL) as QuestionId;
      const question2: QuestionId = v2requestAdminQuizQuestionCreate(quiz2.quizId, user2.token, 'Question 2', 5, 10, answers2, URL) as QuestionId;

      expect(() => v2requestAdminQuizQuestionDelete(user1.token, quiz2.quizId, question2.questionId)).toThrow(HTTPError[403]);
      expect(() => v2requestAdminQuizQuestionDelete(user2.token, quiz1.quizId, question1.questionId)).toThrow(HTTPError[403]);
    });

    test('Invalid questionId, questionId does not exist', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers, URL) as QuestionId;

      expect(() => v2requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId + 1)).toThrow(HTTPError[400]);
    });

    test('Any session for this quiz is not in END state', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers, URL) as QuestionId;

      requestAdminQuizSessionStart(user.token, quiz.quizId, 0);
      expect(() => v2requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId)).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('Correct return object', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers, URL) as QuestionId;

      const response = v2requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId);
      expect(response).toStrictEqual({});
    });

    test('Question deleted successfully', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers, URL) as QuestionId;

      const response = v2requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId);
      expect(response).toStrictEqual({});

      const info: QuizInfo = v2requestAdminQuizInfo(user.token, quiz.quizId) as QuizInfo;
      expect(info.questions).toStrictEqual([]);
    });

    test('Multiple questions deleted successfully', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = v2requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers1 = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const answers2 = [
        { answer: 'Answer 1', correct: false },
        { answer: 'Answer 2', correct: true }
      ];
      const answers3 = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question1: QuestionId = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question 1', 5, 10, answers1, URL) as QuestionId;
      const question2: QuestionId = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question 2', 5, 10, answers2, URL) as QuestionId;
      const question3: QuestionId = v2requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question 3', 5, 10, answers3, URL) as QuestionId;

      const response1 = v2requestAdminQuizQuestionDelete(user.token, quiz.quizId, question2.questionId);
      expect(response1).toStrictEqual({});

      const expectedAnswer1 = [
        {
          answerId: expect.any(Number),
          answer: 'Answer 1',
          colour: expect.any(String),
          correct: true
        },
        {
          answerId: expect.any(Number),
          answer: 'Answer 2',
          colour: expect.any(String),
          correct: false
        }
      ];
      const expectedAnswer3 = [
        {
          answerId: expect.any(Number),
          answer: 'Answer 1',
          colour: expect.any(String),
          correct: true
        },
        {
          answerId: expect.any(Number),
          answer: 'Answer 2',
          colour: expect.any(String),
          correct: false
        }
      ];

      const expectedQuestions1 = [
        {
          questionId: question1.questionId,
          question: 'Question 1',
          duration: 10,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer1
        },
        {
          questionId: question3.questionId,
          question: 'Question 3',
          duration: 10,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer3
        }
      ];
      const info1: QuizInfo = v2requestAdminQuizInfo(user.token, quiz.quizId) as QuizInfo;
      expect(info1.questions).toEqual(expect.arrayContaining(expectedQuestions1));
      expect(info1.questions.length).toStrictEqual(2);

      const response2 = v2requestAdminQuizQuestionDelete(user.token, quiz.quizId, question3.questionId);
      expect(response2).toStrictEqual({});

      const expectedQuestions2 = [
        {
          questionId: question1.questionId,
          question: 'Question 1',
          duration: 10,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer1
        }
      ];
      const info2: QuizInfo = v2requestAdminQuizInfo(user.token, quiz.quizId) as QuizInfo;
      expect(info2.questions).toStrictEqual(expectedQuestions2);

      const response3 = v2requestAdminQuizQuestionDelete(user.token, quiz.quizId, question1.questionId);
      expect(response3).toStrictEqual({});

      const info3: QuizInfo = v2requestAdminQuizInfo(user.token, quiz.quizId) as QuizInfo;
      expect(info3.questions).toStrictEqual([]);
    });

    test('Removing questions from different quizzes', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz1: QuizId = v2requestAdminQuizCreate(user.token, 'Quiz 1', 'Description 1') as QuizId;
      const quiz2: QuizId = v2requestAdminQuizCreate(user.token, 'Quiz 2', 'Description 2') as QuizId;

      const answers1 = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const answers2 = [
        { answer: 'Answer 1', correct: false },
        { answer: 'Answer 2', correct: true }
      ];
      const answers3 = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question1: QuestionId = v2requestAdminQuizQuestionCreate(quiz1.quizId, user.token, 'Question 1', 5, 10, answers1, URL) as QuestionId;
      const question2: QuestionId = v2requestAdminQuizQuestionCreate(quiz1.quizId, user.token, 'Question 2', 5, 10, answers2, URL) as QuestionId;
      const question3: QuestionId = v2requestAdminQuizQuestionCreate(quiz2.quizId, user.token, 'Question 3', 5, 10, answers3, URL) as QuestionId;

      const response1 = v2requestAdminQuizQuestionDelete(user.token, quiz1.quizId, question1.questionId);
      expect(response1).toStrictEqual({});

      const expectedAnswer2 = [
        {
          answerId: expect.any(Number),
          answer: 'Answer 1',
          colour: expect.any(String),
          correct: false
        },
        {
          answerId: expect.any(Number),
          answer: 'Answer 2',
          colour: expect.any(String),
          correct: true
        }
      ];

      const expectedQuestions1 = [
        {
          questionId: question2.questionId,
          question: 'Question 2',
          duration: 10,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer2
        }
      ];
      const info1: QuizInfo = v2requestAdminQuizInfo(user.token, quiz1.quizId) as QuizInfo;
      expect(info1.questions).toStrictEqual(expectedQuestions1);

      const response2 = v2requestAdminQuizQuestionDelete(user.token, quiz1.quizId, question2.questionId);
      expect(response2).toStrictEqual({});

      const info2: QuizInfo = v2requestAdminQuizInfo(user.token, quiz1.quizId) as QuizInfo;
      expect(info2.questions).toStrictEqual([]);

      const response3 = v2requestAdminQuizQuestionDelete(user.token, quiz2.quizId, question3.questionId);
      expect(response3).toStrictEqual({});

      const info3: QuizInfo = v2requestAdminQuizInfo(user.token, quiz2.quizId) as QuizInfo;
      expect(info3.questions).toStrictEqual([]);
    });
  });
});

describe('PUT, /v2/admin/quiz/{quizid}/question/{questionid}/move', () => {
  let user1: Token;
  let quiz1: QuizId;
  let quizquestion1: QuestionId;
  let quizquestion2: QuestionId;
  let quizquestion3: QuestionId;
  let answers: QuestionAnswer[];
  beforeEach(() => {
    user1 = requestAdminAuthRegister('BATBeast@email.com', 'iL0v3B3ll3', 'Prince', 'Adam') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'description.') as QuizId;
    answers = [
      { answer: 'their humans', correct: false },
      { answer: 'naps', correct: true },
    ];
    quizquestion1 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do cats love the most?', 5, 5, answers, URL) as QuestionId;
    quizquestion2 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do dogs love the most?', 5, 5, answers, URL) as QuestionId;
    quizquestion3 = v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do babies love the most?', 5, 5, answers, URL) as QuestionId;
  });

  describe('Success Cases', () => {
    test('New Position is 0', () => {
      const movequizquestion2 = v2requestAdminQuizQuestionMove(quiz1.quizId, user1.token, quizquestion2.questionId, 0);
      expect(movequizquestion2).toStrictEqual({});

      const expectedAnswer = [
        {
          answerId: expect.any(Number),
          answer: 'their humans',
          colour: expect.any(String),
          correct: false
        },
        {
          answerId: expect.any(Number),
          answer: 'naps',
          colour: expect.any(String),
          correct: true
        },
      ];

      const expectedQuestions = [
        {
          questionId: quizquestion2.questionId,
          question: 'What do dogs love the most?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer,
        },
        {
          questionId: quizquestion1.questionId,
          question: 'What do cats love the most?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer,
        },
        {
          questionId: quizquestion3.questionId,
          question: 'What do babies love the most?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer,
        }
      ];

      const response = v2requestAdminQuizInfo(user1.token, quiz1.quizId);
      expect(response).toStrictEqual({
        quizId: quiz1.quizId,
        name: 'Quiz 1',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'description.',
        numQuestions: 3,
        questions: expectedQuestions,
        duration: 15
      });
    });

    test('New Position is n - 1', () => {
      const movequizquestion1 = v2requestAdminQuizQuestionMove(quiz1.quizId, user1.token, quizquestion1.questionId, 2);
      expect(movequizquestion1).toStrictEqual({});

      const expectedAnswer = [
        {
          answerId: expect.any(Number),
          answer: 'their humans',
          colour: expect.any(String),
          correct: false
        },
        {
          answerId: expect.any(Number),
          answer: 'naps',
          colour: expect.any(String),
          correct: true
        },
      ];

      const expectedQuestions = [
        {
          questionId: quizquestion2.questionId,
          question: 'What do dogs love the most?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer,
        },
        {
          questionId: quizquestion3.questionId,
          question: 'What do babies love the most?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer,
        },
        {
          questionId: quizquestion1.questionId,
          question: 'What do cats love the most?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: expectedAnswer,
        }
      ];

      const response = v2requestAdminQuizInfo(user1.token, quiz1.quizId);
      expect(response).toStrictEqual({
        quizId: quiz1.quizId,
        name: 'Quiz 1',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'description.',
        numQuestions: 3,
        questions: expectedQuestions,
        duration: 15
      });
    });
  });

  describe('Error Cases', () => {
    test('Question ID does not exist', () => {
      expect(() => v2requestAdminQuizQuestionMove(quiz1.quizId, user1.token, quizquestion1.questionId + quizquestion2.questionId + quizquestion3.questionId, 1)).toThrow(HTTPError[400]);
    });

    test.each([
      -1,
      3
    ])('New Position is < 0 or > n-1', (newPosition) => {
      expect(() => v2requestAdminQuizQuestionMove(quiz1.quizId, user1.token, quizquestion1.questionId, newPosition)).toThrow(HTTPError[400]);
    });

    test('New Position is current Position', () => {
      expect(() => v2requestAdminQuizQuestionMove(quiz1.quizId, user1.token, quizquestion1.questionId, 0)).toThrow(HTTPError[400]);
    });

    test('Invalid Token', () => {
      expect(() => v2requestAdminQuizQuestionMove(quiz1.quizId, user1.token + 'InvalidToken', quizquestion1.questionId, 1)).toThrow(HTTPError[401]);
    });

    test('Invalid Quiz ID', () => {
      expect(() => v2requestAdminQuizQuestionMove(quiz1.quizId + 1, user1.token, quizquestion1.questionId, 1)).toThrow(HTTPError[403]);
    });

    test('User does not own quiz', () => {
      const user2: Token = requestAdminAuthRegister('Belle123@email.com', 'iL0v3B3aSt', 'Princess', 'Belle') as Token;
      expect(() => v2requestAdminQuizQuestionMove(quiz1.quizId, user2.token, quizquestion1.questionId, 1)).toThrow(HTTPError[403]);
    });
  });
});

describe('POST, /v2/admin/quiz/{quizid}/question/{questionid}/duplicate', () => {
  let userToken: string;
  let quizId: number;
  let questionId: number;
  let answers: QuestionAnswer[];
  beforeEach(() => {
    const response = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User');
    userToken = (response as Token).token;

    quizId = v2requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description').quizId;

    answers = [
      { answer: 'their humans', correct: false },
      { answer: 'naps', correct: true },
    ];
    questionId = v2requestAdminQuizQuestionCreate(quizId, userToken, 'Hello?', 5, 5, answers, URL).questionId;
  });

  describe('Error Cases', () => {
    test('Invalid Token', () => {
      expect(() => v2requestAdminQuizQuestionDuplicate(userToken + 'InvalidToken', quizId, questionId)).toThrow(HTTPError[401]);
    });

    test('Invalid quizID', () => {
      expect(() => v2requestAdminQuizQuestionDuplicate(userToken, quizId + 1, questionId)).toThrow(HTTPError[403]);
    });

    test('Invalid questionId', () => {
      expect(() => v2requestAdminQuizQuestionDuplicate(userToken, quizId, questionId + 1)).toThrow(HTTPError[400]);
    });

    test('User does not own quiz', () => {
      const userToken2 = (requestAdminAuthRegister('test2@email.com', 'password1', 'Test', 'User') as Token).token;
      expect(() => v2requestAdminQuizQuestionDuplicate(userToken2, quizId, questionId)).toThrow(HTTPError[403]);
    });

    test('Duplicate quiz exceeds max quiz duration', () => {
      v2requestAdminQuizQuestionCreate(quizId, userToken, 'Helloooo?', 5, 60, answers, URL);
      v2requestAdminQuizQuestionCreate(quizId, userToken, 'Hiiiii?', 5, 80, answers, URL);
      v2requestAdminQuizQuestionCreate(quizId, userToken, 'ello000', 5, 35, answers, URL);
      expect(() => v2requestAdminQuizQuestionDuplicate(userToken, quizId, questionId)).toThrow(HTTPError[400]);
    });
  });

  describe('Success Case', () => {
    test('Duplicates with only one question', () => {
      const responseQuestionDuplicate = v2requestAdminQuizQuestionDuplicate(userToken, quizId, questionId);
      const questionId2 = (responseQuestionDuplicate as NewQuestionId).newQuestionId;
      expect(responseQuestionDuplicate).toStrictEqual({ newQuestionId: expect.any(Number) });

      const responseQuizQuestionInfo: QuizQuestion[] = (v2requestAdminQuizInfo(userToken, quizId) as QuizInfo).questions;
      expect(responseQuizQuestionInfo).toStrictEqual([
        {
          questionId: questionId,
          question: 'Hello?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: [
            { answer: 'their humans', answerId: expect.any(Number), colour: expect.any(String), correct: false },
            { answer: 'naps', answerId: expect.any(Number), colour: expect.any(String), correct: true },
          ]
        },
        {
          questionId: questionId2,
          question: 'Hello?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: [
            { answer: 'their humans', answerId: expect.any(Number), colour: expect.any(String), correct: false },
            { answer: 'naps', answerId: expect.any(Number), colour: expect.any(String), correct: true },
          ]
        },

      ]);
    });

    test('Duplicates with multiple questions', () => {
      // create new question
      const newQuestion = v2requestAdminQuizQuestionCreate(quizId, userToken, 'Heyooo?', 1, 1, answers, URL);
      const questionId2 = (newQuestion as QuestionId).questionId;

      // duplicate first question
      const responseQuestionDuplicate = v2requestAdminQuizQuestionDuplicate(userToken, quizId, questionId);
      const questionId3 = (responseQuestionDuplicate as NewQuestionId).newQuestionId;
      expect(responseQuestionDuplicate).toStrictEqual({ newQuestionId: expect.any(Number) });

      const responseQuizQuestionInfo: QuizQuestion[] = (v2requestAdminQuizInfo(userToken, quizId) as QuizInfo).questions;
      expect(responseQuizQuestionInfo).toStrictEqual([
        {
          questionId: questionId,
          question: 'Hello?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: [
            { answer: 'their humans', answerId: expect.any(Number), colour: expect.any(String), correct: false },
            { answer: 'naps', answerId: expect.any(Number), colour: expect.any(String), correct: true },
          ]
        },
        {
          questionId: questionId3,
          question: 'Hello?',
          duration: 5,
          thumbnailUrl: URL,
          points: 5,
          answers: [
            { answer: 'their humans', answerId: expect.any(Number), colour: expect.any(String), correct: false },
            { answer: 'naps', answerId: expect.any(Number), colour: expect.any(String), correct: true },
          ]
        },
        {
          questionId: questionId2,
          question: 'Heyooo?',
          duration: 1,
          thumbnailUrl: URL,
          points: 1,
          answers: [
            { answer: 'their humans', answerId: expect.any(Number), colour: expect.any(String), correct: false },
            { answer: 'naps', answerId: expect.any(Number), colour: expect.any(String), correct: true },
          ]
        }
      ]);
    });
  });
});
