import {
  requestClear,
  requestAdminAuthRegister,
  requestAdminQuizList,
  requestAdminQuizCreate,
  requestAdminQuizRemove,
  requestAdminQuizInfo,
  requestAdminQuizNameUpdate,
  requestAdminQuizDescriptionUpdate,
  requestAdminQuizTrashView,
  requestAdminQuizTrashRestore,
  requestAdminQuizTrashEmpty,
  requestAdminQuizTransfer,
  requestAdminQuizQuestionCreate,
  requestAdminQuizQuestionUpdate,
  requestAdminQuizQuestionDelete,
  requestAdminQuizQuestionMove,
  requestAdminQuizQuestionDuplicate,
  v2requestAdminQuizQuestionCreate,
  v2requestAdminQuizCreate,
  v2requestAdminQuizRemove,
  v2requestAdminQuizInfo,
  requestAdminQuizSessionStart,
  requestAdminQuizSessionStateUpdate,
  requestAdminQuizSessionStatus,
  requestPlayerJoin,
  requestPlayerQuestionSubmitAnswer,
  requestAdminQuizSessionFinalResults,
  sleepSync,
  requestAdminQuizSessionView,
  requestQuizThumbnailUpdate,
  requestAdminQuizResultsCSV,
  requestAdminQuizLoadResultsCSV
} from '../../requestHelper';

import {
  Token,
  QuizId,
  QuizInfo,
  QuizList,
  QuestionAnswer,
  QuestionId,
  QuizQuestion,
  NewQuestionId,
  SessionId,
  PlayerId,
  ViewSessions,
  QuizStatus,
  FinalSessionResults,
  STATE_LOBBY,
  STATE_QUESTION_COUNTDOWN,
  STATE_QUESTION_OPEN,
  STATE_QUESTION_CLOSE,
  STATE_ANSWER_SHOW,
  STATE_FINAL_RESULTS,
  STATE_END,
  ACTION_NEXT_QUESTION,
  ACTION_SKIP_COUNTDOWN,
  ACTION_GO_TO_ANSWER,
  ACTION_GO_TO_FINAL_RESULTS,
  ACTION_END,
} from '../../interfaces';

import HTTPError from 'http-errors';
import { timeInSeconds } from '../../helper';

const URL = 'https://assets.coingecko.com/coins/images/32163/large/HAPPYCAT.jpg';

beforeEach(() => {
  requestClear();
});

describe('GET, /v1/admin/quiz/list', () => {
  let token: string;
  beforeEach(() => {
    const response = requestAdminAuthRegister('test@gmail.com', 'password1', 'Test', 'User');
    token = (response as Token).token;
  });

  describe('Success cases', () => {
    test('Testing basic functionality', () => {
      const quizId = requestAdminQuizCreate(token, 'Test Quiz', 'Test description').quizId;

      expect(requestAdminQuizList(token)).toStrictEqual({
        quizzes: [
          {
            quizId: quizId,
            name: 'Test Quiz',
          },
        ]
      });
    });
  });
});

describe('POST, /v1/admin/quiz', () => {
  let user1: Token;
  let user2: Token;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('BATBeast@email.com', 'iL0v3B3ll3', 'Prince', 'Adam') as Token;
    user2 = requestAdminAuthRegister('Belle123@email.com', 'iL0v3B3aSt', 'Princess', 'Belle') as Token;
  });

  describe('Correct status code and return value', () => {
    test('Valid inputs', () => {
      const quiz = requestAdminQuizCreate(user1.token, 'Quiz 1', 'description');
      expect(quiz).toStrictEqual({ quizId: expect.any(Number) });
    });

    test('Multiple Users can create a quiz, even if it has the same name.', () => {
      const quiz1 = requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description.');
      const quiz2 = requestAdminQuizCreate(user2.token, 'Quiz 1', 'Description.');

      expect(quiz1).toStrictEqual({ quizId: expect.any(Number) });
      expect(quiz2).toStrictEqual({ quizId: expect.any(Number) });
    });
  });

  describe('Error Cases', () => {
    test('Current logged in user has another quiz of inputted quiz name', () => {
      const quiz = requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description.');
      expect(quiz).toStrictEqual({ quizId: expect.any(Number) });
      expect(() => requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description.')).toThrow(HTTPError[400]);
    });

    test.each([
      'ME',
      'Never G0nna Give You Up Never G0nna Let You D0wn',
    ])('Invalid Name, Longer than 30 or shorter than 3 chars', (name) => {
      expect(() => requestAdminQuizCreate(user1.token, name, 'Description.')).toThrow(HTTPError[400]);
    });

    test('Invalid Name, Contains strange characters', () => {
      expect(() => requestAdminQuizCreate(user1.token, '/[]**@<>&|#$~Git!😔101', 'Description.')).toThrow(HTTPError[400]);
    });

    test('Description more than 100 characters', () => {
      const description = '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901';
      expect(() => requestAdminQuizCreate(user1.token, 'Quiz 1', description)).toThrow(HTTPError[400]);
    });
  });
});

describe('DELETE, /v1/admin/quiz/{quizid}', () => {
  let token: string;
  let quizId: number;
  beforeEach(() => {
    const response = requestAdminAuthRegister('test@gmail.com', 'password1', 'Test', 'User');
    token = (response as Token).token;
    quizId = requestAdminQuizCreate(token, 'Test Quiz', 'Test description').quizId;
  });
  describe('Error cases, expecting an error', () => {
    test('Testing error case of invalid quizId', () => {
      expect(() => requestAdminQuizRemove(token, quizId + 1)).toThrow(HTTPError[403]);
    });

    test('Testing error case user not owning quiz', () => {
      const userId1 = requestAdminAuthRegister('anotherUser@gmail.com', 'password1', 'Different', 'Person');
      expect(() => requestAdminQuizRemove(userId1.token, quizId)).toThrow(HTTPError[403]);
    });
  });

  describe('Success cases', () => {
    test('Testing correct return values when removing one quiz', () => {
      expect(requestAdminQuizRemove(token, quizId)).toStrictEqual({});
      expect(() => requestAdminQuizInfo(token, quizId)).toThrow(HTTPError[403]);
    });
  });
});

describe('GET, /v1/admin/quiz/{quizid}', () => {
  describe('Error Cases', () => {
    test('Invalid token, token does not exist', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = requestAdminQuizCreate(user.token, 'Quiz', 'Description');
      expect(() => requestAdminQuizInfo(user.token + 'InvalidToken', quiz.quizId)).toThrow(HTTPError[401]);
    });

    test('Invalid quizId, quizId does not exist', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = requestAdminQuizCreate(user.token, 'Quiz', 'Description');
      expect(() => requestAdminQuizInfo(user.token, quiz.quizId + 1)).toThrow(HTTPError[403]);
    });

    test('Invalid quizId, quizId is not owned by given user', () => {
      const user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'OneFirst', 'OneLast');
      const user2 = requestAdminAuthRegister('user2@gmail.com', 'password123', 'TwoFirst', 'TwoLast');
      const quiz = requestAdminQuizCreate(user1.token, 'Quiz', 'Description');

      expect(() => requestAdminQuizInfo(user2.token, quiz.quizId)).toThrow(HTTPError[403]);
    });
  });

  describe('Success Cases', () => {
    test('Returning correct quiz information', () => {
      const user = requestAdminAuthRegister('user1@gmail.com', 'password123', 'OneFirst', 'OneLast');
      const quiz = requestAdminQuizCreate(user.token, 'Quiz', 'Description');
      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question = requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers);

      const expectedAnswer = [
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
      const expectedQuestions = [
        {
          questionId: question.questionId,
          question: 'Question',
          duration: 10,
          points: 5,
          answers: expectedAnswer
        }
      ];

      const response = requestAdminQuizInfo(user.token, quiz.quizId);
      expect(response).toStrictEqual({
        quizId: quiz.quizId,
        name: 'Quiz',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Description',
        numQuestions: 1,
        questions: expectedQuestions,
        duration: 10
      });
    });
  });
});

describe('PUT, /v1/admin/quiz/{quizid}/name', () => {
  describe('Error Cases', () => {
    test('Testing error when invalid quizId', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;
      expect(() => requestAdminQuizNameUpdate(userId, quizId + 1, 'Updated Quiz Name')).toThrow(HTTPError[403]);
    });

    test('Testing error when user does not own supplied quiz', () => {
      const userId1 = requestAdminAuthRegister('test@email.com', 'password1', 'Testone', 'Userone').token;
      const userId2 = requestAdminAuthRegister('test1@email.com', 'password1', 'Testtwo', 'Usertwo').token;
      const quizId = requestAdminQuizCreate(userId1, 'Test Quiz', 'Test description').quizId;
      expect(() => requestAdminQuizNameUpdate(userId2, quizId, 'Updated Quiz Name')).toThrow(HTTPError[403]);
    });

    test('Testing name with invalid char', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;
      expect(() => requestAdminQuizNameUpdate(userId, quizId, 'Name.')).toThrow(HTTPError[400]);
    });

    test('Testing invalid length', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;
      expect(() => requestAdminQuizNameUpdate(userId, quizId, 'AB')).toThrow(HTTPError[400]);
    });

    test('Testing error when two users own quizzes with the same name and duplicate name', () => {
      const userId1 = requestAdminAuthRegister('test@email.com', 'password1', 'Testone', 'Userone').token;
      const userId2 = requestAdminAuthRegister('test1@email.com', 'password1', 'Testtwo', 'Usertwo').token;

      requestAdminQuizCreate(userId1, 'Quiz1', 'Test description');
      requestAdminQuizCreate(userId2, 'Quiz1', 'Test description');
      const quizId3 = requestAdminQuizCreate(userId2, 'Quiz2', 'Test description').quizId;

      expect(() => requestAdminQuizNameUpdate(userId2, quizId3, 'Quiz1')).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('Testing correct return type when there is no error', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;

      expect(requestAdminQuizNameUpdate(userId, quizId, 'Updated Quiz Name')).toStrictEqual({});
      expect(requestAdminQuizInfo(userId, quizId).timeLastEdited).toStrictEqual(expect.any(Number));
    });

    test('Do nothing when new name is the same as existing name', () => {
      const userId = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
      const quizId = requestAdminQuizCreate(userId, 'Test Quiz', 'Test description').quizId;

      expect(requestAdminQuizNameUpdate(userId, quizId, 'Test Quiz')).toStrictEqual({});
      const listedQuizzes = (requestAdminQuizList(userId) as QuizList).quizzes;
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

describe('PUT, /v1/admin/quiz/{quizid}/description', () => {
  let user1: Token;
  let user2: Token;
  let quiz1: QuizId;
  let quiz2: QuizId;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('BATBeast@email.com', 'iL0v3B3ll3', 'Prince', 'Adam') as Token;
    user2 = requestAdminAuthRegister('Belle123@email.com', 'iL0v3B3aSt', 'Princess', 'Belle') as Token;
    quiz1 = requestAdminQuizCreate(user1.token, 'Quiz 1', 'description.') as QuizId;
    quiz2 = requestAdminQuizCreate(user2.token, 'Quiz 2', 'description') as QuizId;
  });

  describe('Correct status code and return value', () => {
    test('All valid params', () => {
      const descUpd = requestAdminQuizDescriptionUpdate(user1.token, quiz1.quizId, 'Git Building Blocks.');
      expect(descUpd).toStrictEqual({});

      const quizInfo = requestAdminQuizInfo(user1.token, quiz1.quizId);
      expect(quizInfo.description).toStrictEqual('Git Building Blocks.');
      expect(quizInfo.timeLastEdited).toStrictEqual(expect.any(Number));
    });
  });

  describe('Error cases', () => {
    test('Description more than 100 characters', () => {
      const description = '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901';
      expect(() => requestAdminQuizDescriptionUpdate(user1.token, quiz1.quizId, description)).toThrow(HTTPError[400]);
    });

    test('Token does not exist', () => {
      expect(() => requestAdminQuizDescriptionUpdate(user1.token + 'InvalidToken', quiz2.quizId, 'Git Building Blocks.')).toThrow(HTTPError[401]);
    });

    test('QuizId does not exist', () => {
      const quizIdSum = quiz1.quizId + quiz2.quizId;
      expect(() => requestAdminQuizDescriptionUpdate(user1.token, quizIdSum, 'Git Building Blocks.')).toThrow(HTTPError[403]);
    });

    test('QuizId not owned by User', () => {
      expect(() => requestAdminQuizDescriptionUpdate(user1.token, quiz2.quizId, 'Git Building Blocks.')).toThrow(HTTPError[403]);
    });
  });
});

describe('GET, /v1/admin/quiz/trash', () => {
  let userToken: string;
  let quizId: number;
  beforeEach(() => {
    const response = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User');
    userToken = (response as Token).token;
    quizId = requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description').quizId;
    requestAdminQuizRemove(userToken, quizId);
  });

  describe('Success Cases', () => {
    test('User with no trashed quizzes', () => {
      const userToken1 = requestAdminAuthRegister('test1@email.com', 'password1', 'TestOne', 'UserOne').token;
      expect((requestAdminQuizTrashView(userToken1)).quizzes).toStrictEqual([]);
    });

    test('Correct return for one user and one quiz', () => {
      expect((requestAdminQuizTrashView(userToken)).quizzes).toStrictEqual([
        {
          quizId: quizId,
          name: 'Test Quiz',
        }
      ]);
    });
  });
});

describe('POST, /v1/admin/quiz/{quizid}/restore', () => {
  let userToken: string;
  let quizId: number;
  beforeEach(() => {
    userToken = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User').token;
    quizId = requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description').quizId;
    requestAdminQuizRemove(userToken, quizId);
  });

  describe('Error Cases', () => {
    test('Quiz name of the restored quiz is already used by another active quiz', () => {
      requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description');
      expect(() => requestAdminQuizTrashRestore(userToken, quizId)).toThrow(HTTPError[400]);
    });

    test('Invalid quizId', () => {
      expect(() => requestAdminQuizTrashRestore(userToken, quizId + 1)).toThrow(HTTPError[403]);
    });

    test('Quiz ID refers to a quiz that is not currently in the trash', () => {
      const quizId1 = requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description').quizId;
      expect(() => requestAdminQuizTrashRestore(userToken, quizId1)).toThrow(HTTPError[400]);
    });

    test('User does not own untrashed quiz', () => {
      const userToken1 = requestAdminAuthRegister('test1@email.com', 'password1', 'TestOne', 'UserOne').token;
      const quizId1 = requestAdminQuizCreate(userToken1, 'Test Quiz1', 'Test description1').quizId;
      expect(() => requestAdminQuizTrashRestore(userToken, quizId1)).toThrow(HTTPError[403]);
    });
  });

  describe('Success Cases', () => {
    test('Basic functionality', () => {
      expect(requestAdminQuizTrashRestore(userToken, quizId)).toStrictEqual({});
      expect(requestAdminQuizList(userToken)).toStrictEqual(
        {
          quizzes: [
            {
              quizId: quizId,
              name: 'Test Quiz',
            },
          ]
        }
      );
      expect(requestAdminQuizTrashView(userToken)).toStrictEqual(
        {
          quizzes: []
        }
      );
    });
  });
});

describe('DELETE, /v1/admin/quiz/trash/empty', () => {
  describe('Error Cases', () => {
    test('Empty database', () => {
      expect(() => requestAdminQuizTrashEmpty('InvalidToken', '[1]')).toThrow(HTTPError[401]);
    });

    test('One or more quizIds not in trash', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz1 = requestAdminQuizCreate(user.token, 'Quiz 1', 'Description 1');
      const quiz2 = requestAdminQuizCreate(user.token, 'Quiz 2', 'Description 2');
      requestAdminQuizRemove(user.token, quiz1.quizId);

      expect(() => requestAdminQuizTrashEmpty(user.token, `[${quiz1.quizId}, ${quiz2.quizId}]`)).toThrow(HTTPError[400]);
    });

    test('One or more quizIds does not belong to user', () => {
      const user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const user2 = requestAdminAuthRegister('user2@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz1 = requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description 1');
      const quiz2 = requestAdminQuizCreate(user2.token, 'Quiz 2', 'Description 2');
      requestAdminQuizRemove(user1.token, quiz1.quizId);
      requestAdminQuizRemove(user2.token, quiz2.quizId);

      expect(() => requestAdminQuizTrashEmpty(user1.token, `[${quiz1.quizId}, ${quiz2.quizId}]`)).toThrow(HTTPError[403]);
    });
  });

  describe('Success Cases', () => {
    test('Trash emptied successfully', () => {
      const user = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast');
      const quiz = requestAdminQuizCreate(user.token, 'Quiz', 'Description');
      requestAdminQuizRemove(user.token, quiz.quizId);

      const response = requestAdminQuizTrashEmpty(user.token, `[${quiz.quizId}]`);
      expect(response).toStrictEqual({});

      const trashList: QuizList = requestAdminQuizTrashView(user.token) as QuizList;
      expect(trashList.quizzes).toStrictEqual([]);

      const quizList: QuizList = requestAdminQuizList(user.token) as QuizList;
      expect(quizList.quizzes).toStrictEqual([]);
    });
  });
});

describe('POST, /v1/admin/quiz/transfer', () => {
  let user1: Token;
  let user2: Token;
  let quiz1: QuizId;
  let quiz2: QuizId;

  beforeEach(() => {
    user1 = requestAdminAuthRegister('happycats@gmail.com', 'Cats4lyfe!!!', 'Hello', 'Kitty') as Token;
    quiz1 = requestAdminQuizCreate(user1.token, 'Cats', 'How much do you know about cats') as QuizId;

    user2 = requestAdminAuthRegister('theLittlePrince@gmail.com', 'myRose123.1', 'Little', 'Prince') as Token;
    quiz2 = requestAdminQuizCreate(user2.token, 'roses', 'Which is the best rose') as QuizId;
  });

  describe('Success Cases', () => {
    test('valid inputs', () => {
      const result = requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz1.quizId);
      const user2Dets: QuizList = requestAdminQuizList(user2.token) as QuizList;
      const user1Dets: QuizList = requestAdminQuizList(user1.token) as QuizList;

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
      requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz1.quizId);
      requestAdminQuizTransfer(user2.token, 'helllooo@email.com', quiz2.quizId);
      const result = requestAdminQuizTransfer(user2.token, 'helllooo@email.com', quiz1.quizId);
      const user2Dets: QuizList = requestAdminQuizList(user2.token) as QuizList;
      const user3Dets: QuizList = requestAdminQuizList(user3.token) as QuizList;

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
      expect(() => requestAdminQuizTransfer(user1.token + 'InvalidToken', 'theLittlePrince@gmail.com', quiz1.quizId)).toThrow(HTTPError[401]);
    });

    test('invalid quizId', () => {
      expect(() => requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz1.quizId + 67890456)).toThrow(HTTPError[403]);
    });

    test('User does not own the quiz', () => {
      expect(() => requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz2.quizId)).toThrow(HTTPError[403]);
    });

    test('useremail entered is not a real user', () => {
      expect(() => requestAdminQuizTransfer(user1.token, 'example.email@gmail.com', quiz1.quizId)).toThrow(HTTPError[400]);
    });

    test('useremail is the current logged in user', () => {
      expect(() => requestAdminQuizTransfer(user1.token, 'happycats@gmail.com', quiz1.quizId)).toThrow(HTTPError[400]);
    });

    test('Quiz ID refers to a quiz that has a name that is already used by the target user', () => {
      requestAdminQuizCreate(user2.token, 'Cats', 'what is my favourite car') as QuizId;
      expect(() => requestAdminQuizTransfer(user1.token, 'theLittlePrince@gmail.com', quiz1.quizId)).toThrow(HTTPError[400]);
    });
  });
});

describe('POST, /v1/admin/quiz/question', () => {
  let quiz1: QuizId;
  let user1: Token;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('happycats@gmail.com', 'Cats4lyfe!!!', 'Hello', 'Kitty') as Token;
    quiz1 = requestAdminQuizCreate(user1.token, 'Cats', 'How much do you know about cats') as QuizId;
  });

  describe('Success Cases', () => {
    test('Create one question', () => {
      const answers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: 'naps', correct: true },
      ];

      const result = requestAdminQuizQuestionCreate(
        quiz1.quizId,
        user1.token,
        'What do cats love the most?',
        5,
        10,
        answers
      );

      expect(result).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('Create multiple questions', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: true },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: false },
      ];

      const answer2: QuestionAnswer[] = [
        { answer: 'Zujepzip', correct: true },
        { answer: 'Madcetib', correct: false },
        { answer: 'Fuwaneb', correct: false },
      ];

      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 6, 8, answer1);
      const result2 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city', 6, 10, answer2);
      expect(result2).toStrictEqual({ questionId: expect.any(Number) });
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

      const result1 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 6, 8, answer1);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('all true answers', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: true },
        { answer: 'Kecihiwa', correct: true },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: true },
      ];

      const result1 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 6, 8, answer1);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('question string is exactly 5 chars', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: true },
        { answer: 'Nazivzik', correct: false },
        { answer: 'Fikjujhe', correct: false },
      ];

      const result1 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'City!', 6, 8, answer1);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('question string is exactly 50 chars', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: true },
        { answer: 'Nazivzik', correct: false },
        { answer: 'Fikjujhe', correct: false },
      ];

      const result1 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'NMDVJTIPYCLNKFRUMWIBUUUBAFCFOYSDVPTQKYRYDVBJSEBFMH', 6, 8, answer1);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('1 point awarded to question', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: true },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: false },
        { answer: 'Fikjujhe', correct: false },
      ];

      const result1 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('10 points awarded to question', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Fikjujhe', correct: false },
      ];

      const result1 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 10, 8, answer1);
      expect(result1).toStrictEqual({ questionId: expect.any(Number) });
    });

    test('answer strings are 1 or 30 characters', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'H', correct: false },
        { answer: 'New York City is the answer.', correct: true },
      ];

      const result1 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1);
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

      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 10, 8, answer1);
      const result2 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city', 6, 10, answer2);
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

      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 10, 20, answer1);
      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city', 6, 20, answer2);
      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best citys', 6, 50, answer3);
      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'yipeee', 6, 40, answer4);
      const result5 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'hii whats your fav colour', 6, 50, answer5);

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

      expect(() => requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1)).toThrow(HTTPError[400]);
    });

    test('one answer inputted', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: true },
      ];

      expect(() => requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1)).toThrow(HTTPError[400]);
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

      expect(() => requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, 8, answer1)).toThrow(HTTPError[400]);
    });

    test('timeAllowed is negative', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 1, -8, answer1)).toThrow(HTTPError[400]);
    });

    test('points awarded are less than 1', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 0, 8, answer1)).toThrow(HTTPError[400]);
    });

    test('points awarded are more than 10', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Hiujage', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 11, 8, answer1)).toThrow(HTTPError[400]);
    });

    test('length of answer is less than 1', () => {
      const answer1: QuestionAnswer[] = [
        { answer: '', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
      ];

      expect(() => requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 5, 8, answer1)).toThrow(HTTPError[400]);
    });

    test('answer strings are duplicates', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Jaljuemi', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Kecihiwa', correct: false },
      ];

      expect(() => requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 5, 8, answer1)).toThrow(HTTPError[400]);
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

      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 10, 20, answer1);
      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city', 6, 30, answer2);
      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best citys', 6, 60, answer3);
      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'yipeee', 6, 40, answer4);
      expect(() => requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'hii whats your fav colour', 6, 31, answer5)).toThrow(HTTPError[400]);
    });
  });

  test('Invalid quizId', () => {
    const answer1: QuestionAnswer[] = [
      { answer: 'Jaljuemi', correct: false },
      { answer: 'Kecihiwa', correct: false },
      { answer: 'Nazivzik', correct: true },
      { answer: 'Geoduek', correct: false },
    ];

    expect(() => requestAdminQuizQuestionCreate(567890, user1.token, 'Best city in the world', 5, 8, answer1)).toThrow(HTTPError[403]);
  });

  test('user does not own the quiz', () => {
    const user2: Token = requestAdminAuthRegister('emuse@gmail.com', '7dsheZvbJ.', 'Princess', 'Peach') as Token;
    const quiz2: QuizId = requestAdminQuizCreate(user2.token, 'Books', 'i am nerD') as QuizId;
    const answer1: QuestionAnswer[] = [
      { answer: 'Jaljuemi', correct: false },
      { answer: 'Kecihiwa', correct: false },
      { answer: 'Nazivzik', correct: true },
      { answer: 'Pudhubpe', correct: false },
    ];

    expect(() => requestAdminQuizQuestionCreate(quiz2.quizId, user1.token, 'Best city in the world', 5, 8, answer1)).toThrow(HTTPError[403]);
  });

  describe('Checking quiz properties updated correctly', () => {
    test('Quiz time last edited is updated ', () => {
      const answer1: QuestionAnswer[] = [
        { answer: 'Jaljuemi', correct: false },
        { answer: 'Kecihiwa', correct: false },
        { answer: 'Nazivzik', correct: true },
        { answer: 'Pudhubpe', correct: false },
      ];

      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Best city in the world', 8, 5, answer1);

      const result1: QuizInfo = requestAdminQuizInfo(user1.token, quiz1.quizId) as QuizInfo;
      const quizTimeEdited = result1.timeLastEdited;
      expect(quizTimeEdited).toStrictEqual(expect.any(Number));
    });
  });
});

describe('PUT, /v1/admin/quiz/{quizid}/question/{questionid}', () => {
  let user1: Token;
  let quiz1: QuizId;
  let quizquestion1: QuestionId;
  let answers: QuestionAnswer[];

  beforeEach(() => {
    user1 = requestAdminAuthRegister('BATBeast@email.com', 'iL0v3B3ll3', 'Prince', 'Adam') as Token;
    quiz1 = requestAdminQuizCreate(user1.token, 'Quiz 1', 'description.') as QuizId;
    answers = [
      { answer: 'their humans', correct: false },
      { answer: 'naps', correct: true },
      { answer: 'food', correct: false },
    ];
    quizquestion1 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do cats love the most?', 5, 5, answers) as QuestionId;
  });

  describe('Success Cases', () => {
    test('Changing all values', () => {
      const newAnswers = [
        { answer: 'H', correct: false },
        { answer: 'HelloHelloHelloHelloHello', correct: true },
        { answer: 'food', correct: false },
      ];

      const updatedquizquestion1 = requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'HelloH', 6, 180, newAnswers);
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
          points: 6,
          answers: expectedAnswer,
        },
      ];

      const response = requestAdminQuizInfo(user1.token, quiz1.quizId);
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
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId + 1, 'What do cats love the most?', 5, 5, answers)).toThrow(HTTPError[400]);
    });

    test.each([
      '',
      'HelloHelloHelloHelloHelloHelloHelloHelloHelloHelloH'
    ])('Question String < 5 or > 50 chars in length', (questionString) => {
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, questionString, 5, 5, answers)).toThrow(HTTPError[400]);
    });

    test('Question has less than 2 answers', () => {
      const lessAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false }
      ];
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, lessAnswers)).toThrow(HTTPError[400]);
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
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, moreAnswers)).toThrow(HTTPError[400]);
    });

    test('Time Allowed is negative', () => {
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, -5, answers)).toThrow(HTTPError[400]);
    });

    test('Time Allowed exceeds 3 minutes', () => {
      requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do cats hate the most?', 5, 100, answers);
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 81, answers)).toThrow(HTTPError[400]);
    });

    test.each([
      0,
      11
    ])('Points awarded are < 1 or > 10', (points) => {
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', points, 5, answers)).toThrow(HTTPError[400]);
    });

    test('Answer string is less than 1 char long', () => {
      const tooShortAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: '', correct: true }
      ];
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, tooShortAnswers)).toThrow(HTTPError[400]);
    });

    test('Answer string is more than 30 chars long', () => {
      const tooLongAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: 'HelloHelloHelloHelloHelloHelloH', correct: true }
      ];
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, tooLongAnswers)).toThrow(HTTPError[400]);
    });

    test('Duplicate answer string', () => {
      const duplicateAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: 'their humans', correct: true }
      ];
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, duplicateAnswers)).toThrow(HTTPError[400]);
    });

    test('No correct answers', () => {
      const falseAnswers: QuestionAnswer[] = [
        { answer: 'their humans', correct: false },
        { answer: 'food', correct: false }
      ];
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, falseAnswers)).toThrow(HTTPError[400]);
    });

    test('Invalid Quiz ID', () => {
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId + 1, user1.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, answers)).toThrow(HTTPError[403]);
    });

    test('User does not own quiz', () => {
      const user2: Token = requestAdminAuthRegister('Belle123@email.com', 'iL0v3B3aSt', 'Princess', 'Belle') as Token;
      expect(() => requestAdminQuizQuestionUpdate(quiz1.quizId, user2.token, quizquestion1.questionId, 'What do cats love the most?', 5, 5, answers)).toThrow(HTTPError[403]);
    });
  });
});

describe('DELETE, /v1/admin/quiz/{quizid}/question/{questionid}', () => {
  describe('Error Cases', () => {
    test('Invalid token, token does not exist', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers) as QuestionId;

      expect(() => requestAdminQuizQuestionDelete(user.token + 1, quiz.quizId, question.questionId)).toThrow(HTTPError[401]);
    });

    test('Invalid quizId, quizId does not exist', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers) as QuestionId;

      expect(() => requestAdminQuizQuestionDelete(user.token, quiz.quizId + 1, question.questionId)).toThrow(HTTPError[403]);
    });

    test('Invalid quizId, quizId is not owned by given user', () => {
      const user1: Token = requestAdminAuthRegister('user1@gmail.com', 'password123', 'OneFirst', 'OneLast') as Token;
      const user2: Token = requestAdminAuthRegister('user2@gmail.com', 'password123', 'TwoFirst', 'TwoLast') as Token;
      const quiz: QuizId = requestAdminQuizCreate(user1.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = requestAdminQuizQuestionCreate(quiz.quizId, user1.token, 'Question', 5, 10, answers) as QuestionId;

      expect(() => requestAdminQuizQuestionDelete(user2.token, quiz.quizId, question.questionId)).toThrow(HTTPError[403]);
    });

    test('Invalid questionId, questionId does not exist', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers) as QuestionId;

      expect(() => requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId + 1)).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('Question deleted successfully', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const quiz: QuizId = requestAdminQuizCreate(user.token, 'Quiz', 'Description') as QuizId;

      const answers = [
        { answer: 'Answer 1', correct: true },
        { answer: 'Answer 2', correct: false }
      ];
      const question: QuestionId = requestAdminQuizQuestionCreate(quiz.quizId, user.token, 'Question', 5, 10, answers) as QuestionId;

      const response = requestAdminQuizQuestionDelete(user.token, quiz.quizId, question.questionId);
      expect(response).toStrictEqual({});

      const info: QuizInfo = requestAdminQuizInfo(user.token, quiz.quizId) as QuizInfo;
      expect(info.questions).toStrictEqual([]);
    });
  });
});

describe('PUT, /v1/admin/quiz/{quizid}/question/{questionid}/move', () => {
  let user1: Token;
  let quiz1: QuizId;
  let quizquestion1: QuestionId;
  let quizquestion2: QuestionId;
  let quizquestion3: QuestionId;
  let answers: QuestionAnswer[];
  beforeEach(() => {
    user1 = requestAdminAuthRegister('BATBeast@email.com', 'iL0v3B3ll3', 'Prince', 'Adam') as Token;
    quiz1 = requestAdminQuizCreate(user1.token, 'Quiz 1', 'description.') as QuizId;
    answers = [
      { answer: 'their humans', correct: false },
      { answer: 'naps', correct: true },
    ];
    quizquestion1 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do cats love the most?', 5, 5, answers) as QuestionId;
    quizquestion2 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do dogs love the most?', 5, 5, answers) as QuestionId;
    quizquestion3 = requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'What do babies love the most?', 5, 5, answers) as QuestionId;
  });

  describe('Success Cases', () => {
    test('Successful params', () => {
      const movequizquestion2 = requestAdminQuizQuestionMove(quiz1.quizId, user1.token, quizquestion2.questionId, 0);
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
          points: 5,
          answers: expectedAnswer,
        },
        {
          questionId: quizquestion1.questionId,
          question: 'What do cats love the most?',
          duration: 5,
          points: 5,
          answers: expectedAnswer,
        },
        {
          questionId: quizquestion3.questionId,
          question: 'What do babies love the most?',
          duration: 5,
          points: 5,
          answers: expectedAnswer,
        }
      ];

      const response = requestAdminQuizInfo(user1.token, quiz1.quizId);
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
      expect(() => requestAdminQuizQuestionMove(quiz1.quizId, user1.token, quizquestion1.questionId + quizquestion2.questionId + quizquestion3.questionId, 1)).toThrow(HTTPError[400]);
    });

    test.each([
      -1,
      3
    ])('New Position is < 0 or > n-1', (newPosition) => {
      expect(() => requestAdminQuizQuestionMove(quiz1.quizId, user1.token, quizquestion1.questionId, newPosition)).toThrow(HTTPError[400]);
    });

    test('New Position is current Position', () => {
      expect(() => requestAdminQuizQuestionMove(quiz1.quizId, user1.token, quizquestion1.questionId, 0)).toThrow(HTTPError[400]);
    });

    test('Invalid Quiz ID', () => {
      expect(() => requestAdminQuizQuestionMove(quiz1.quizId + 1, user1.token, quizquestion1.questionId, 1)).toThrow(HTTPError[403]);
    });

    test('User does not own quiz', () => {
      const user2: Token = requestAdminAuthRegister('Belle123@email.com', 'iL0v3B3aSt', 'Princess', 'Belle') as Token;
      expect(() => requestAdminQuizQuestionMove(quiz1.quizId, user2.token, quizquestion1.questionId, 1)).toThrow(HTTPError[403]);
    });
  });
});

describe('POST, /v1/admin/quiz/{quizid}/question/{questionid}/duplicate', () => {
  let userToken: string;
  let quizId: number;
  let questionId: number;
  let answers: QuestionAnswer[];
  beforeEach(() => {
    const response = requestAdminAuthRegister('test@email.com', 'password1', 'Test', 'User');
    userToken = (response as Token).token;

    quizId = requestAdminQuizCreate(userToken, 'Test Quiz', 'Test description').quizId;

    answers = [
      { answer: 'their humans', correct: false },
      { answer: 'naps', correct: true },
    ];
    questionId = requestAdminQuizQuestionCreate(quizId, userToken, 'Hello?', 5, 5, answers).questionId;
  });

  describe('Error Cases', () => {
    test('Invalid quizID', () => {
      expect(() => requestAdminQuizQuestionDuplicate(userToken, quizId + 1, questionId)).toThrow(HTTPError[403]);
    });

    test('Invalid questionId', () => {
      expect(() => requestAdminQuizQuestionDuplicate(userToken, quizId, questionId + 1)).toThrow(HTTPError[400]);
    });

    test('User does not own quiz', () => {
      const userToken2 = (requestAdminAuthRegister('test2@email.com', 'password1', 'Test', 'User') as Token).token;
      expect(() => requestAdminQuizQuestionDuplicate(userToken2, quizId, questionId)).toThrow(HTTPError[403]);
    });

    test('Duplicate quiz exceeds max quiz duration', () => {
      requestAdminQuizQuestionCreate(quizId, userToken, 'Helloooo?', 5, 60, answers);
      requestAdminQuizQuestionCreate(quizId, userToken, 'Hiiiii?', 5, 80, answers);
      requestAdminQuizQuestionCreate(quizId, userToken, 'ello000', 5, 35, answers);
      expect(() => requestAdminQuizQuestionDuplicate(userToken, quizId, questionId)).toThrow(HTTPError[400]);
    });
  });

  describe('Success Case', () => {
    test('Duplicates question successfully', () => {
      const responseQuestionDuplicate = requestAdminQuizQuestionDuplicate(userToken, quizId, questionId);
      const questionId2 = (responseQuestionDuplicate as NewQuestionId).newQuestionId;
      expect(responseQuestionDuplicate).toStrictEqual({ newQuestionId: expect.any(Number) });

      const responseQuizQuestionInfo: QuizQuestion[] = (requestAdminQuizInfo(userToken, quizId) as QuizInfo).questions;
      expect(responseQuizQuestionInfo).toStrictEqual([
        {
          questionId: questionId,
          question: 'Hello?',
          duration: 5,
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
          points: 5,
          answers: [
            { answer: 'their humans', answerId: expect.any(Number), colour: expect.any(String), correct: false },
            { answer: 'naps', answerId: expect.any(Number), colour: expect.any(String), correct: true },
          ]
        },

      ]);
    });
  });
});

describe('POST, /v1/admin/quiz/{quizid}/session/start', () => {
  let user1: Token;
  let quiz1: QuizId;
  let answers: QuestionAnswer[];
  beforeEach(() => {
    user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description') as QuizId;
    answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question', 5, 10, answers, URL);
  });

  describe('Error Cases', () => {
    test('Invalid token, token does not exist', () => {
      expect(() => requestAdminQuizSessionStart(user1.token + 'InvalidToken', quiz1.quizId, 0)).toThrow(HTTPError[401]);
    });

    test('Invalid quizId, quizId does not exist', () => {
      expect(() => requestAdminQuizSessionStart(user1.token, quiz1.quizId + 1, 0)).toThrow(HTTPError[403]);
    });

    test('Invalid quizId, quizId is not owned by given user', () => {
      const user2: Token = requestAdminAuthRegister('user2@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      expect(() => requestAdminQuizSessionStart(user2.token, quiz1.quizId, 0)).toThrow(HTTPError[403]);
    });

    test('Invalid autoStartNum, autoStartNum greater than 50', () => {
      expect(() => requestAdminQuizSessionStart(user1.token, quiz1.quizId, 51)).toThrow(HTTPError[400]);
    });

    test('Maximum of 10 sessions that are not in END state currently exist for this quiz', () => {
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
      expect(() => requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0)).toThrow(HTTPError[400]);
    });

    test('Quiz has no questions', () => {
      const quiz2 = v2requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description') as QuizId;
      expect(() => requestAdminQuizSessionStart(user1.token, quiz2.quizId, 0)).toThrow(HTTPError[400]);
    });

    test('Quiz is in trash', () => {
      v2requestAdminQuizRemove(user1.token, quiz1.quizId);
      expect(() => requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0)).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('Correct return object', () => {
      const quizSessionId: SessionId = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;
      expect(quizSessionId).toStrictEqual({ sessionId: expect.any(Number) });
    });

    test('Valid autoStartNum, autoStartNum less than 50', () => {
      const quizSessionId: SessionId = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 49) as SessionId;
      expect(quizSessionId).toStrictEqual({ sessionId: expect.any(Number) });
    });
  });
});

describe('PUT, /v1/admin/quiz/{quizid}/session/{sessionid}', () => {
  let user1: Token;
  let quiz1: QuizId;
  let answers: QuestionAnswer[];
  let session1: SessionId;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description') as QuizId;
    answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 1', 5, 2, answers, URL);
    v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 2', 5, 2, answers, URL);
    session1 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0);
  });

  describe('Error Cases', () => {
    test('Invalid token, token does not exist', () => {
      expect(() => requestAdminQuizSessionStateUpdate(user1.token + 'InvalidToken', quiz1.quizId, session1.sessionId, ACTION_END)).toThrow(HTTPError[401]);
    });

    test('Invalid quizId, quizId does not exist', () => {
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId + 1, session1.sessionId, ACTION_END)).toThrow(HTTPError[403]);
    });

    test('User does not own quiz', () => {
      const user2: Token = requestAdminAuthRegister('user2@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      expect(() => requestAdminQuizSessionStateUpdate(user2.token, quiz1.quizId, session1.sessionId, ACTION_END)).toThrow(HTTPError[403]);
    });

    test('Invalid sessionId, sessionId does not exist', () => {
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId + 1, ACTION_END)).toThrow(HTTPError[400]);
    });

    test('Action provided is not a valid Action enum', () => {
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, 'Invalid Enum')).toThrow(HTTPError[400]);
    });

    test('LOBBY -> ACTION_GO_TO_FINAL_RESULTS (Invalid action)', () => {
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS)).toThrow(HTTPError[400]);
    });

    test('ACTION_END -> ACTION_GO_TO_ANSWER (Invalid action)', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_END);
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER)).toThrow(HTTPError[400]);
    });

    test('QUESTION_COUNTDOWN -> ACTION_GO_TO_FINAL_RESULTS (Invalid action)', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS)).toThrow(HTTPError[400]);
    });

    test('QUESTION_OPEN -> ACTION_NEXT_QUESTION (Invalid action)', () => {
      const quiz2: QuizId = v2requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description') as QuizId;
      v2requestAdminQuizQuestionCreate(quiz2.quizId, user1.token, 'Question 1', 5, 1, answers, URL);
      const session2: SessionId = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;

      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_SKIP_COUNTDOWN);
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_NEXT_QUESTION)).toThrow(HTTPError[400]);
    });

    test('QUESTION_CLOSE -> ACTION_SKIP_COUNTDOWN (Invalid action)', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
      sleepSync(2 * 1000);
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN)).toThrow(HTTPError[400]);
    });

    test('FINAL_RESULTS -> ACTION_SKIP_COUNTDOWN (Invalid action)', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN)).toThrow(HTTPError[400]);
    });

    test('ANSWER_SHOW -> ACTION_GO_TO_ANSWER (Invalid action)', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      expect(() => requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER)).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('Correct return type', () => {
      expect(requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION)).toStrictEqual({});
    });

    test('Works with multiple sessions by one user', () => {
      const quiz2 = v2requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description') as QuizId;
      v2requestAdminQuizQuestionCreate(quiz2.quizId, user1.token, 'Question', 5, 10, answers, URL);
      const session2 = requestAdminQuizSessionStart(user1.token, quiz2.quizId, 0);

      expect(requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION)).toStrictEqual({});
      expect(requestAdminQuizSessionStateUpdate(user1.token, quiz2.quizId, session2.sessionId, ACTION_NEXT_QUESTION)).toStrictEqual({});
      expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_QUESTION_COUNTDOWN);
      expect(requestAdminQuizSessionStatus(user1.token, quiz2.quizId, session2.sessionId).state).toStrictEqual(STATE_QUESTION_COUNTDOWN);
    });

    test('Works with multiple sessions by different users', () => {
      const user2 = requestAdminAuthRegister('user2@gmail.com', 'password123', 'UserSecond', 'UserSecondLast') as Token;
      const quiz2 = v2requestAdminQuizCreate(user2.token, 'Quiz 2', 'Description') as QuizId;
      v2requestAdminQuizQuestionCreate(quiz2.quizId, user2.token, 'Question', 5, 10, answers, URL);
      const session2 = requestAdminQuizSessionStart(user2.token, quiz2.quizId, 0);

      expect(requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION)).toStrictEqual({});
      expect(requestAdminQuizSessionStateUpdate(user2.token, quiz2.quizId, session2.sessionId, ACTION_NEXT_QUESTION)).toStrictEqual({});
      expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_QUESTION_COUNTDOWN);
      expect(requestAdminQuizSessionStatus(user2.token, quiz2.quizId, session2.sessionId).state).toStrictEqual(STATE_QUESTION_COUNTDOWN);
    });

    test('Next question action at last question will go to final results', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_FINAL_RESULTS);
    });

    test('Question countdown time is 3 seconds', () => {
      const quiz2: QuizId = v2requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description') as QuizId;
      v2requestAdminQuizQuestionCreate(quiz2.quizId, user1.token, 'Question 1', 5, 1, answers, URL);
      const session2: SessionId = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;

      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_NEXT_QUESTION);
      sleepSync(3 * 1000);
      expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session2.sessionId).state).toStrictEqual(STATE_QUESTION_OPEN);
    });

    describe('All valid actions for LOBBY', () => {
      test('ACTION_NEXT_QUESTION', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_QUESTION_COUNTDOWN);
      });

      test('ACTION_END', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_END);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_END);
      });
    });

    describe('All valid actions for QUESTION_COUNTDOWN', () => {
      test('ACTION_SKIP_COUNTDOWN', () => {
        const quiz2: QuizId = v2requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description') as QuizId;
        v2requestAdminQuizQuestionCreate(quiz2.quizId, user1.token, 'Question 1', 5, 1, answers, URL);
        const session2: SessionId = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;

        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_SKIP_COUNTDOWN);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session2.sessionId).state).toStrictEqual(STATE_QUESTION_OPEN);
      });

      test('ACTION_END', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_END);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_END);
      });
    });

    describe('All valid actions for QUESTION_OPEN', () => {
      test('ACTION_GO_TO_ANSWER', () => {
        const quiz2: QuizId = v2requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description') as QuizId;
        v2requestAdminQuizQuestionCreate(quiz2.quizId, user1.token, 'Question 1', 5, 1, answers, URL);
        const session2: SessionId = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;

        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_SKIP_COUNTDOWN);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_GO_TO_ANSWER);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session2.sessionId).state).toStrictEqual(STATE_ANSWER_SHOW);
      });

      test('Wait question to close', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
        sleepSync(2 * 1000);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_QUESTION_CLOSE);
      });

      test('ACTION_END', () => {
        const quiz2: QuizId = v2requestAdminQuizCreate(user1.token, 'Quiz 2', 'Description') as QuizId;
        v2requestAdminQuizQuestionCreate(quiz2.quizId, user1.token, 'Question 1', 5, 1, answers, URL);
        const session2: SessionId = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;

        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_SKIP_COUNTDOWN);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session2.sessionId, ACTION_END);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session2.sessionId).state).toStrictEqual(STATE_END);
      });
    });

    describe('All valid actions for QUESTION_CLOSE', () => {
      test('ACTION_NEXT_QUESTION', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
        sleepSync(2 * 1000);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_QUESTION_COUNTDOWN);
      });

      test('ACTION_GO_TO_ANSWER', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
        sleepSync(2 * 1000);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_ANSWER_SHOW);
      });

      test('ACTION_GO_TO_FINAL_RESULTS', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
        sleepSync(2 * 1000);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_FINAL_RESULTS);
      });

      test('ACTION_END', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
        sleepSync(2 * 1000);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_END);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_END);
      });
    });

    describe('All valid actions for ANSWER_SHOW', () => {
      test('ACTION_NEXT_QUESTION', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_QUESTION_COUNTDOWN);
      });

      test('ACTION_GO_TO_FINAL_RESULTS', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_FINAL_RESULTS);
      });

      test('ACTION_END', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_END);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_END);
      });
    });

    describe('All valid actions for FINAL_RESULTS', () => {
      test('ACTION_END', () => {
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
        requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_END);
        expect(requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId).state).toStrictEqual(STATE_END);
      });
    });
  });
});

describe('GET, /v1/admin/quiz/{quizid}/session/{sessionid}', () => {
  let user1: Token;
  let quiz1: QuizId;
  let answers: QuestionAnswer[];
  let session1: SessionId;
  let quizInfo: QuizInfo;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description') as QuizId;
    answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 1', 5, 10, answers, URL);
    v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question 2', 5, 10, answers, URL);
    session1 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 4) as SessionId;
    requestAdminQuizSessionStart(user1.token, quiz1.quizId, 4);
    quizInfo = v2requestAdminQuizInfo(user1.token, quiz1.quizId) as QuizInfo;
    requestPlayerJoin(session1.sessionId, 'player1');
    requestPlayerJoin(session1.sessionId, 'player2');
    requestPlayerJoin(session1.sessionId, 'player3');
  });

  describe('Success Cases', () => {
    test('correct inputs', () => {
      const result = requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId);
      const expectedStatus: QuizStatus = {
        state: STATE_LOBBY,
        atQuestion: 0,
        players: ['player1', 'player2', 'player3'],
        metadata: quizInfo,
      };
      expect(result).toStrictEqual(expectedStatus);
    });

    test('quiz is in different states', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      const result = requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId);

      const expectedStatus: QuizStatus = {
        state: STATE_QUESTION_COUNTDOWN,
        atQuestion: 1,
        players: ['player1', 'player2', 'player3'],
        metadata: quizInfo,
      };
      expect(result).toStrictEqual(expectedStatus);
    });
  });

  describe('Error Cases', () => {
    test('sessionid is not valid session in quiz', () => {
      expect(() => requestAdminQuizSessionStatus(user1.token, quiz1.quizId, session1.sessionId + 2)).toThrow(HTTPError[400]);
    });

    test('token is invalid', () => {
      expect(() => requestAdminQuizSessionStatus(user1.token + 'Invalid Token', quiz1.quizId, session1.sessionId)).toThrow(HTTPError[401]);
    });

    test('invalid quizId', () => {
      expect(() => requestAdminQuizSessionStatus(user1.token, quiz1.quizId + 3, session1.sessionId)).toThrow(HTTPError[403]);
    });

    test('user does not own quiz', () => {
      const user2: Token = requestAdminAuthRegister('user2@gmail.com', 'password123', 'Userirst', 'Userast') as Token;
      const quiz2: QuizId = v2requestAdminQuizCreate(user2.token, 'Quiz 2', 'Description') as QuizId;
      expect(() => requestAdminQuizSessionStatus(user1.token, quiz2.quizId, session1.sessionId)).toThrow(HTTPError[403]);
    });
  });
});

describe('GET, /v1/admin/quiz/{quizid}/sessions', () => {
  let user1: Token;
  let quiz1: QuizId;
  let answers: QuestionAnswer[];
  let id1: SessionId, id2: SessionId, id3: SessionId, id4: SessionId;

  beforeEach(() => {
    user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description') as QuizId;
    answers = [
      { answer: 'Answer 1', correct: true },
      { answer: 'Answer 2', correct: false }
    ];
    v2requestAdminQuizQuestionCreate(quiz1.quizId, user1.token, 'Question', 5, 10, answers, URL);
    id1 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 0) as SessionId;
    id2 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 3) as SessionId;
    id3 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 2) as SessionId;
    id4 = requestAdminQuizSessionStart(user1.token, quiz1.quizId, 5) as SessionId;
  });

  describe('Success cases', () => {
    test('valid inputs, all sessions are active', () => {
      const result = requestAdminQuizSessionView(user1.token, quiz1.quizId);
      const expectedArray: ViewSessions = {
        activeSessions: [id1.sessionId, id2.sessionId, id3.sessionId, id4.sessionId],
        inactiveSessions: [],
      };

      expect(result).toStrictEqual(expectedArray);
    });

    test('valid inputs, mixed states for sessions', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, id1.sessionId, ACTION_END);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, id2.sessionId, ACTION_NEXT_QUESTION);
      const result = requestAdminQuizSessionView(user1.token, quiz1.quizId);
      const expectedArray: ViewSessions = {
        activeSessions: [id2.sessionId, id3.sessionId, id4.sessionId],
        inactiveSessions: [id1.sessionId],
      };

      expect(result).toStrictEqual(expectedArray);
    });

    test('valid inputs, all sessions are inactive', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, id1.sessionId, ACTION_END);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, id2.sessionId, ACTION_END);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, id3.sessionId, ACTION_END);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, id4.sessionId, ACTION_END);

      const result = requestAdminQuizSessionView(user1.token, quiz1.quizId);
      const expectedArray: ViewSessions = {
        activeSessions: [],
        inactiveSessions: [id1.sessionId, id2.sessionId, id3.sessionId, id4.sessionId],
      };

      expect(result).toStrictEqual(expectedArray);
    });
  });

  describe('Error cases', () => {
    test('invalid token', () => {
      expect(() => requestAdminQuizSessionView(user1.token + 'token', quiz1.quizId)).toThrow(HTTPError[401]);
    });

    test('user is not owner of the quiz', () => {
      const user2: Token = requestAdminAuthRegister('user2@gmail.com', 'password123', 'UseFirst', 'UsrLast') as Token;
      expect(() => requestAdminQuizSessionView(user2.token, quiz1.quizId)).toThrow(HTTPError[403]);
    });

    test('invalid quizId', () => {
      expect(() => requestAdminQuizSessionView(user1.token, quiz1.quizId + 10)).toThrow(HTTPError[403]);
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

      finalSessionResults = requestAdminQuizSessionFinalResults(quiz1.quizId, session1.sessionId, user1.token);
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
    test('Sessionid is not valid session in quiz', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
      expect(() => requestAdminQuizSessionFinalResults(quiz1.quizId, session1.sessionId + 1, user1.token)).toThrow(HTTPError[400]);
    });

    test('session is not in final results state', () => {
      expect(() => requestAdminQuizSessionFinalResults(quiz1.quizId, session1.sessionId, user1.token)).toThrow(HTTPError[400]);
    });

    test('token is invalid', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
      expect(() => requestAdminQuizSessionFinalResults(quiz1.quizId, session1.sessionId, user1.token + 'Invalid Token')).toThrow(HTTPError[401]);
    });

    test('invalid quizId', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
      expect(() => requestAdminQuizSessionFinalResults(quiz1.quizId + 1, session1.sessionId, user1.token)).toThrow(HTTPError[403]);
    });

    test('user does not own quiz', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
      const user2: Token = requestAdminAuthRegister('user2@gmail.com', 'password123', 'Userirst', 'Userast') as Token;
      const quiz2: QuizId = v2requestAdminQuizCreate(user2.token, 'Quiz 2', 'Description') as QuizId;
      expect(() => requestAdminQuizSessionFinalResults(quiz2.quizId, session1.sessionId, user1.token)).toThrow(HTTPError[403]);
    });
  });
});

describe('PUT, /v1/admin/quiz/{quizid}/thumbnail', () => {
  let user1: Token;
  let quiz1: QuizId;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('user1@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
    quiz1 = v2requestAdminQuizCreate(user1.token, 'Quiz 1', 'Description') as QuizId;
  });

  describe('Error cases', () => {
    test('Invalid token', () => {
      expect(() => requestQuizThumbnailUpdate(user1.token + 'invalid', quiz1.quizId, URL)).toThrow(HTTPError[401]);
    });

    test('Invalid quizId', () => {
      expect(() => requestQuizThumbnailUpdate(user1.token, quiz1.quizId + 1, URL)).toThrow(HTTPError[403]);
    });

    test.each([
      { test: 'no http:// or https://', url: 'choco.com/image.png' },
      { test: 'letters infront https://', url: 'heyhttps://choco.com/image.png' },
      { test: 'letters infront http://', url: 'heyhttp://choco.com/image.png' },
      { test: 'wrong form http://', url: 'htshehlp//://choco.com/image.png' },
    ])("'testing '$test'", ({ url }) => {
      expect(() => requestQuizThumbnailUpdate(user1.token, quiz1.quizId, url)).toThrow(HTTPError[400]);
    });

    test.each([
      { test: 'no extension', url: ' https://choco.com/image' },
      { test: 'invalid extension', url: ' https://choco.com/image.pdf' },
      { test: 'invalid extension', url: ' https://choco.com/image.png.pdf' },
    ])("'testing '$test'", ({ url }) => {
      expect(() => requestQuizThumbnailUpdate(user1.token, quiz1.quizId, url)).toThrow(HTTPError[400]);
    });
  });

  describe('Success cases', () => {
    test('updating thumbnail of a quiz', () => {
      requestQuizThumbnailUpdate(user1.token, quiz1.quizId, URL);
      const responseQuizInfo = v2requestAdminQuizInfo(user1.token, quiz1.quizId) as QuizInfo;

      expect(responseQuizInfo.thumbnailUrl).toEqual(URL);
    });
  });
});

describe('GET, /v1/admin/quiz/{quizid}/session/{sessionid}/results/csv', () => {
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
    player1 = requestPlayerJoin(session1.sessionId, 'Kate Bridgerton') as PlayerId;
    player2 = requestPlayerJoin(session1.sessionId, 'Anthony Bridgerton') as PlayerId;

    const info: QuizInfo = v2requestAdminQuizInfo(user1.token, quiz1.quizId) as QuizInfo;
    answerId1 = info.questions[0].answers[0].answerId;
    answerId3 = info.questions[1].answers[0].answerId;
    answerId4 = info.questions[1].answers[1].answerId;

    // get to 'Question_open'
    requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
    requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
  });

  describe('Success Cases', () => {
    test('Valid inputs', () => {
      // player 1 answers but player 2 doesn't
      requestPlayerQuestionSubmitAnswer(player1.playerId, question1.questionId, [answerId1]);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      // next question
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_NEXT_QUESTION);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_SKIP_COUNTDOWN);
      // player 2 answers correctly, player 1 doesn't
      requestPlayerQuestionSubmitAnswer(player2.playerId, question2.questionId, [answerId3]);
      requestPlayerQuestionSubmitAnswer(player1.playerId, question2.questionId, [answerId4]);
      // see final results
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);

      const response = requestAdminQuizResultsCSV(quiz1.quizId, session1.sessionId, user1.token);
      const urlSplit = response.url.split('/').pop();
      const csvData = requestAdminQuizLoadResultsCSV(urlSplit);
      expect(csvData.data).toStrictEqual('Player,question1score,question1rank,question2score,question2rank\nAnthony Bridgerton,0,0,5,1,\nKate Bridgerton,5,1,0,2,\n');
    });
  });

  describe('Error Cases', () => {
    test('Sessionid is not valid session in quiz', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
      expect(() => requestAdminQuizResultsCSV(quiz1.quizId, session1.sessionId + 1, user1.token)).toThrow(HTTPError[400]);
    });

    test('session is not in final results state', () => {
      expect(() => requestAdminQuizResultsCSV(quiz1.quizId, session1.sessionId, user1.token)).toThrow(HTTPError[400]);
    });

    test('token is invalid', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
      expect(() => requestAdminQuizResultsCSV(quiz1.quizId, session1.sessionId, user1.token + 'Invalid Token')).toThrow(HTTPError[401]);
    });

    test('invalid quizId', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
      expect(() => requestAdminQuizResultsCSV(quiz1.quizId + 1, session1.sessionId, user1.token)).toThrow(HTTPError[403]);
    });

    test('user does not own quiz', () => {
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_ANSWER);
      requestAdminQuizSessionStateUpdate(user1.token, quiz1.quizId, session1.sessionId, ACTION_GO_TO_FINAL_RESULTS);
      const user2: Token = requestAdminAuthRegister('user2@gmail.com', 'password123', 'Userirst', 'Userast') as Token;
      const quiz2: QuizId = v2requestAdminQuizCreate(user2.token, 'Quiz 2', 'Description') as QuizId;
      expect(() => requestAdminQuizResultsCSV(quiz2.quizId, session1.sessionId, user1.token)).toThrow(HTTPError[403]);
    });
  });
});
