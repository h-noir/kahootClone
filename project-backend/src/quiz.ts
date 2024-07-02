import { port, url } from './config.json';
import { getData, getTimers, setData } from './dataStore';

import {
  quizIsNameAlreadyUsedByUser,
  randomColour,
  validQuestionParams,
  errorCasesForUpdateAndMoveQuestion,
  getAuthUser,
  nameDescriptionErrorCheck,
  getQuizSession,
  quizSessionStateLobby,
  quizSessionStateQuestionCountdown,
  quizSessionStateQuestionOpen,
  quizSessionStateQuestionClose,
  quizSessionStateAnswerShow,
  quizSessionStateFinalResults,
  getAdminQuiz,
  validUrl,
  writeFile,
  writeFinalResultsInCSVFormat,
  getFinalSessionResults,
  timeInSeconds,
} from './helper';

import {
  QuizId,
  EmptyObject,
  Quiz,
  QuizList,
  QuizInfo,
  QuestionId,
  QuizQuestion,
  QuestionAnswer,
  NewQuestionId,
  SessionId,
  QuizSession,
  Timer,
  QuizStatus,
  ViewSessions,
  FinalSessionResults,
  UrlCSV,
  STATE_LOBBY,
  STATE_QUESTION_COUNTDOWN,
  STATE_QUESTION_OPEN,
  STATE_QUESTION_CLOSE,
  STATE_ANSWER_SHOW,
  STATE_FINAL_RESULTS,
  STATE_END,
} from './interfaces';

import HTTPError from 'http-errors';

const MAX_QUIZ_DURATION = 3 * 60;
const MAX_AUTOSTARTNUM = 50;
const MAX_SESSION_NUM = 10;

/**
 * Provide a list of all quizzes that are owned by the currently logged in user.
 *
 * @param {string} token - Unique authenticated user token
 *
 * @returns {{quizzes: Array <{quizId: number, name: string }>}} - An array of quiz objects
 *
*/
export function adminQuizList(token: string): QuizList {
  const data = getData();
  const user = getAuthUser(token, data);

  const quizIds = user.quizIds;

  // For each quiz in the quizIds array, use the id to extract its name,
  // save them into an object and push it into the array to be returned
  const quizzesToList = quizIds.map(quizId => {
    const quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
    return { quizId: quizId, name: quiz.name };
  });

  return { quizzes: quizzesToList };
}

/**
  * Given basic details about a new quiz, create one for the logged in user.
  *
  * @param {string} token - Unique authenticated user token
  * @param {string} name - Quiz name
  * @param {string} description - Quiz description
  *
  * @returns {quizId: integer} - Unique identifier for quiz
*/
export function adminQuizCreate(token: string, name: string, description: string): QuizId {
  const data = getData();
  const user = getAuthUser(token, data);
  nameDescriptionErrorCheck(name, description);

  if (quizIsNameAlreadyUsedByUser(user.userId, name) === true) {
    throw HTTPError(400, 'Name is already used by the current logged in user for another quiz.');
  }

  // Create the quiz object with initialized quizId
  const newquiz : Quiz = {
    quizId: data.latestQuizId + 1,
    name: name,
    timeCreated: timeInSeconds(),
    timeLastEdited: timeInSeconds(),
    description: description,
    quizOwnerId: [user.userId],
    usersAccessed: [user.userId],
    questions: [],
    questionIds: [],
    duration: 0,
    latestQuestionId: 0,
    latestAnswerId: 0,
    quizSessionIds: [],
  };

  user.quizIds.push(data.latestQuizId + 1);
  data.latestQuizId++;
  data.quizzes.push(newquiz);
  setData(data);

  return {
    quizId: newquiz.quizId
  };
}

/**
  * Given a particular quiz, permanently remove the quiz.
  *
  * @param {string} token - Unique authenticated user token
  * @param {integer} quizId - Unique quiz id
  *
  * @returns {} - Empty object
*/
export function adminQuizRemove(token: string, quizId: number, v2: boolean): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  if (v2) {
    for (const quizSessionId of quiz.quizSessionIds) {
      const quizSession = data.quizSessions.find(quizSession => quizSession.quizSessionId === quizSessionId);
      if (quizSession.state !== STATE_END) {
        throw HTTPError(400, 'A session for this quiz is not in END state');
      }
    }
  }

  quiz.timeLastEdited = timeInSeconds();
  user.trash.push(quiz);
  // Removing quiz from data.quizzes
  data.quizzes = data.quizzes.filter(quizzes => quizzes.quizId !== quizId);
  // Removing quiz id from give user's quiz list
  user.quizIds = user.quizIds.filter((quizIds: number) => quizIds !== quizId);
  setData(data);

  return {};
}

/**
 * Get all of the relevant information about the current quiz v1.
 *
 * @param {string} token - Unique authenticated user token
 * @param {integer} quizId - Unique quiz id
 *
 * @returns {{
*  quizId: integer,
*  name: string,
*  timeCreated: integer,
*  timeLastEdited: integer,
*  description: string,
*  numQuestions: integer,
*  question: Array<QuizQuestion>,
*  duration: integer
* }} - A quiz object
*/
export function adminQuizInfo(token: string, quizId: number, v2: boolean): QuizInfo {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  // Creates an array containing all the information of the questions for the quiz
  const questionsInfo = quiz.questions.map(question => {
    const questionDetails: QuizQuestion = {
      questionId: question.questionId,
      question: question.question,
      duration: question.duration,
      points: question.points,
      answers: question.answers.map(answer => ({
        answerId: answer.answerId,
        answer: answer.answer,
        colour: answer.colour,
        correct: answer.correct
      }))
    };

    if (v2 && question.thumbnailUrl !== undefined) {
      questionDetails.thumbnailUrl = question.thumbnailUrl;
    }
    return questionDetails;
  });

  // An object containing the quizId, name, timeCreated, timeLastEdited, description,
  // numQuestions, questions, duration and thumbnailUrl of the quiz
  const quizInfo: QuizInfo = {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.questions.length,
    questions: questionsInfo,
    duration: quiz.duration
  };
  if (v2 && quiz.thumbnailUrl !== undefined) {
    quizInfo.thumbnailUrl = quiz.thumbnailUrl;
  }

  return quizInfo;
}

/**
 * Update the name of the relevant quiz.
 *
 * @param {string} token - Unique authenticated user token
 * @param {integer} quizId - Unique quiz id
 * @param {string} name - Unique quiz name
 *
 * @returns {} - An empty object
 */
export function adminQuizNameUpdate(token: string, quizId: number, name: string): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  // validating the new quiz name
  nameDescriptionErrorCheck(name);

  // if new name the same as existing name, do nothing and return
  if (name === quiz.name) {
    return {};
  }

  // checking if logged in user already owns a quiz with the new name
  if (quizIsNameAlreadyUsedByUser(user.userId, name)) {
    throw HTTPError(400, 'User already owns quiz with given name');
  }

  // updating quiz name and saving it
  quiz.name = name;
  // updating timeLastEdited
  quiz.timeLastEdited = timeInSeconds();
  setData(data);

  return {};
}

/**
 * Update the description of the relevant quiz.
 *
 * @param {string} token - Unique authenticated user token
 * @param {integer} quizId - The unique quiz id
 * @param {string} description - A description of the quiz
 *
 * @returns {} - empty object
 */
export function adminQuizDescriptionUpdate(token: string, quizId: number, description: string): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);

  // Return an error if description is more than 100 characters
  nameDescriptionErrorCheck(undefined, description);

  const quiz = getAdminQuiz(quizId, user, data);

  // If no errors exists, change description
  quiz.description = description;
  quiz.timeLastEdited = timeInSeconds();
  setData(data);
  return {};
}

/**
 * Returns all quizzes in the trash for a given user
 *
 * @param {string} token - Unique authenticated user token
 *
 * @returns {{quizzes: Array <{quizId: number, name: string }>}} - An array of quiz objects
 *
*/
export function adminQuizTrashView(token: string): QuizList {
  const data = getData();
  const user = getAuthUser(token, data);

  // Adds all quizzes in trash under the given user to an array
  const quizzesInTrash = user.trash.map(quiz => ({ quizId: quiz.quizId, name: quiz.name }));

  return { quizzes: quizzesInTrash };
}

/**
 * Restores a specified deleted quiz from trash into quizzes
 *
 * @param {string} token - Unique authenticated user token
 * @param {number} quizId - quizId of trashed quiz to be restored
 *
 * @returns {} - Empty object
 *
*/
export function adminQuizTrashRestore(token: string, quizId: number): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);

  let quiz = (user.trash.find(quiz => quiz.quizId === quizId));
  if (!quiz) {
    quiz = data.quizzes.find(quiz => quiz.quizId === quizId);
    if (!quiz) {
      throw HTTPError(403, 'Invalid quizId');
    } else if (quiz.quizOwnerId.includes(user.userId)) {
      throw HTTPError(400, 'Quiz is not currently in trash');
    } else {
      throw HTTPError(403, 'Quiz is not owned by given user');
    }
  }

  if (quizIsNameAlreadyUsedByUser(user.userId, quiz.name)) {
    throw HTTPError(400, 'Quiz name of the restored quiz is already used by another active quiz');
  }

  // Restoring quiz back into quizzes and removing it from trash
  data.quizzes.push(quiz);
  user.quizIds.push(quizId);
  user.trash = user.trash.filter(quiz => quiz.quizId !== quizId);
  setData(data);
  return {};
}

/**
 * Permanently delete specific quizzes currently sitting in the trash
 *
 * @param {string} token - Unique authenticated user token
 * @param {Array<integer>} quizIds - Array containing quizIds
 *
 * @returns {} - Empty object
 */
export function adminQuizTrashEmpty(token: string, quizIds: number[]): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);

  for (const quizId of quizIds) {
    // Checks if any of the quizzes are not in the trash
    const quiz = (data.quizzes.find(quiz => quiz.quizId === quizId));
    if (quiz) {
      throw HTTPError(400, 'One or more quizIds not in trash');
    }

    // Checks if any of the quizzes don't belong to the user
    if (!user.trash.find(quiz => quiz.quizId === quizId)) {
      throw HTTPError(403, 'Invalid quizId');
    }
  }

  // Permanently deletes the specified quizzes from the trash
  for (const quizId of quizIds) {
    user.trash = user.trash.filter(quizzes => quizzes.quizId !== quizId);
  }

  setData(data);
  return {};
}

/**
 * Transfer ownership of a quiz to a different user based on their email
 *
 * @param {string} token - Unique authenticated user token
 * @param {string} email - Unique useremail
 * @param {integer} quizId - The uniique quiz id
 *
 * @returns {} - empty object
 */
export function adminQuizTransfer(token: string, userEmail: string, quizId: number, v2: boolean): EmptyObject {
  const data = getData();
  const user1 = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user1, data);

  const user2 = data.users.find(users => users.userEmail.toLowerCase() === userEmail.toLowerCase());
  if (!user2) {
    throw HTTPError(400, 'Invalid email entered');
  }

  if (user2.userId === user1.userId) {
    throw HTTPError(400, 'email entered cannot be the current user');
  }

  if (quizIsNameAlreadyUsedByUser(user2.userId, quiz.name)) {
    throw HTTPError(400, 'target user already owns a quiz with the same name');
  }

  // Checks if a session for this quiz is not in END state if it is v2
  if (v2) {
    for (const quizSessionId of quiz.quizSessionIds) {
      const quizSession = data.quizSessions.find(quizSession => quizSession.quizSessionId === quizSessionId);
      if (quizSession.state !== STATE_END) {
        throw HTTPError(400, 'A session for this quiz is not in END state');
      }
    }
  }

  // Removing quiz id from current user's quiz list
  user1.quizIds = user1.quizIds.filter((quizIds: number) => quizIds !== quizId);

  // Removing current user id from the the quiz's quizOwnerId list:
  quiz.quizOwnerId = quiz.quizOwnerId.filter((authUserIds: number) => authUserIds !== user1.userId);

  // Adding quiz id to the target user's quiz list
  user2.quizIds.push(quizId);

  // Adding targer user id to the quiz's quizOwnerId list
  quiz.quizOwnerId.push(user2.userId);

  // update timeLastEdited for the quiz
  quiz.timeLastEdited = timeInSeconds();

  setData(data);
  return {};
}

/**
 * Create a new stub question for a particular quiz.
 *
 * @param {integer} quizId - The unique quiz id
 * @param {string} token - Unique authenticated user token
 * @param {array} quizQuestion - an array containing the necessary information
 *    to create a quiz question: question, duration of the question, points for
 *    the question, and an array containing the answers for that question.
 *
 * @returns {questionId: integer} - a unique id for the new question created
 */
export function adminQuizQuestionCreate(quizId: number, token: string, questionBody: QuizQuestion): QuestionId {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  const { question, points, duration, answers, thumbnailUrl } = questionBody;

  validQuestionParams(quizId, question, points, duration, answers, undefined, thumbnailUrl);

  const colours = ['blue', 'red', 'orange', 'green', 'yellow', 'purple'];
  const newAnswers: QuestionAnswer[] = answers.map(answer => ({
    answerId: ++quiz.latestAnswerId,
    answer: answer.answer,
    correct: answer.correct,
    colour: randomColour(colours),
  }));

  const newQuestion: QuizQuestion = {
    questionId: ++quiz.latestQuestionId,
    question: question,
    points: points,
    duration: duration,
    thumbnailUrl: thumbnailUrl,
    answers: newAnswers,
    timeCreated: timeInSeconds(),
    timeLastEdited: timeInSeconds(),
  };

  quiz.questions.push(newQuestion);
  quiz.timeLastEdited = timeInSeconds();
  quiz.questionIds.push(quiz.latestQuestionId);
  quiz.duration = quiz.duration + duration;
  setData(data);
  return { questionId: newQuestion.questionId };
}

/**
 * Update the relevant details of a particular question within a quiz.
 *
 * @param {integer} quizId
 * @param {string} token
 * @param {integer} questionId
 * @param {QuizQuestion} questionBody
 * @returns {} - Empty Object
 */
export function adminQuizQuestionUpdate(quizId: number, token: string, questionId: number, questionBody: QuizQuestion): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  errorCasesForUpdateAndMoveQuestion(data, quizId, user.userId, questionId);

  const { question, points, duration, answers, thumbnailUrl } = questionBody;

  validQuestionParams(quizId, question, points, duration, answers, questionId, thumbnailUrl);

  const colours = ['blue', 'red', 'orange', 'green', 'yellow', 'purple'];
  let latestAnswerId = 0;
  const newAnswersArray: QuestionAnswer[] = answers.map(answer => ({
    answerId: ++latestAnswerId,
    answer: answer.answer,
    correct: answer.correct,
    colour: randomColour(colours),
  }));

  const targetQuestion = quiz.questions.find(quizquestion => quizquestion.questionId === questionId);
  const oldTargetQuestionDuration = targetQuestion.duration;

  targetQuestion.question = question;
  targetQuestion.points = points;
  targetQuestion.duration = duration;
  quiz.duration = quiz.duration - oldTargetQuestionDuration + duration;
  targetQuestion.answers = newAnswersArray;
  targetQuestion.thumbnailUrl = thumbnailUrl;
  targetQuestion.timeLastEdited = timeInSeconds();
  quiz.timeLastEdited = timeInSeconds();

  setData(data);
  return {};
}

/**
 * Delete a particular question from a quiz
 *
 * @param {string} token - Unique authenticated user token
 * @param {integer} quizId - Unique quiz id
 * @param {integer} questionId - Unique quiz question id
 *
 * @returns {} - Empty object
 */
export function adminQuizQuestionDelete(token: string, quizId: number, questionId: number, v2: boolean): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  // Checks if question with given questionId exists
  const question = (quiz.questions.find(question => question.questionId === questionId));
  if (!question) {
    throw HTTPError(400, 'Invalid questionId');
  }

  // Checks if a session for this quiz is not in END state if it is v2
  if (v2) {
    for (const quizSessionId of quiz.quizSessionIds) {
      const quizSession = data.quizSessions.find(quizSession => quizSession.quizSessionId === quizSessionId);
      if (quizSession.state !== STATE_END) {
        throw HTTPError(400, 'A session for this quiz is not in END state');
      }
    }
  }

  // Removing question from quiz, changing the duration and timeLastEdited
  quiz.questions = quiz.questions.filter(questions => questions.questionId !== questionId);
  quiz.duration -= question.duration;
  quiz.questionIds = quiz.questionIds.filter(questionIds => questionIds !== questionId);
  quiz.timeLastEdited = timeInSeconds();

  setData(data);
  return {};
}

/**
 * Move a question from one particular position in the quiz to another.
 *
 * @param {integer} quizId - Unique quiz id
 * @param {string} token - Unique authenticated user token
 * @param {integer} questionId - Unique question id
 * @param {integer} newPosition - New position for question to be moved
 *
 * @returns {} - Empty object
 */
export function adminQuizQuestionMove(quizId: number, token: string, questionId: number, newPosition: number): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  errorCasesForUpdateAndMoveQuestion(data, quizId, user.userId, questionId, newPosition);

  const questionIndex = quiz.questions.findIndex(quizquestion => quizquestion.questionId === questionId);
  const [targetQuestion] = quiz.questions.splice(questionIndex, 1);
  quiz.questions.splice(newPosition, 0, targetQuestion);
  quiz.timeLastEdited = timeInSeconds();
  setData(data);
  return {};
}

/**
 * A particular question gets duplicated to immediately after where the source question is.
 *
 * @param {string} token - Unique authenticated user token
 * @param {number} quizId - Unique quiz id
 * @param {number} questionId - Unique questionId
 *
 * @returns { newQuestionId: integer } - New question id for the duplicated question
 */
export function adminQuizQuestionDuplicate(token: string, quizId: number, questionId: number): NewQuestionId {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  // Checks if question with given questionId exists
  const question = (quiz.questions.find(question => question.questionId === questionId));
  if (!question) {
    throw HTTPError(400, 'Invalid questionId');
  }

  // checks if the duration of the duplicate question will exceed 3 minutes for the quiz
  // returns an error and the duplicate question will not be created.
  const totalDuration = quiz.duration + question.duration;

  if (totalDuration > MAX_QUIZ_DURATION) {
    throw HTTPError(400, `Quiz Duration exceeds ${MAX_QUIZ_DURATION} seconds, duplicate question will not be created.`);
  }

  const duplicateQuestion = structuredClone(question);
  duplicateQuestion.questionId = ++quiz.latestQuestionId;
  duplicateQuestion.timeCreated = timeInSeconds();
  duplicateQuestion.timeLastEdited = timeInSeconds();
  quiz.timeLastEdited = timeInSeconds();
  quiz.duration = totalDuration;

  duplicateQuestion.answers.map(answer => {
    answer.answerId = ++quiz.latestAnswerId;
    return answer;
  });

  const questionIndex = quiz.questions.findIndex(question => question.questionId === questionId);
  quiz.questions.splice(questionIndex + 1, 0, duplicateQuestion);

  setData(data);

  return { newQuestionId: duplicateQuestion.questionId };
}

/**
 * Starts a new session for a quiz.
 *
 * @param {string} token - Unique authenticated user token
 * @param {number} quizId - Unique quiz id
 * @param {number} autoStartNum - Number of people to autostart the quiz
 *
 * @returns { sessionId: number } - Unique session id
 */
export function adminQuizSessionStart(token: string, quizId: number, autoStartNum: number): SessionId {
  const data = getData();
  const timerData = getTimers();
  const user = getAuthUser(token, data);

  // Checks if the quiz is in the trash
  if (user.trash.find(quiz => quiz.quizId === quizId)) {
    throw HTTPError(400, 'Quiz is in trash');
  }

  const quiz = getAdminQuiz(quizId, user, data);

  // Checks if autoStartNumber is greater than 50
  if (autoStartNum > MAX_AUTOSTARTNUM) {
    throw HTTPError(400, 'Number to auto start quiz is greater than 50');
  }

  // Checks if the number of sessions not in END state that currently exist for this quiz is less than 10
  let numSessionsNotEnd = 0;
  for (const quizSessionId of quiz.quizSessionIds) {
    const quizSession = data.quizSessions.find(quizSession => quizSession.quizSessionId === quizSessionId);
    if (quizSession.state !== STATE_END) {
      numSessionsNotEnd++;
    }
  }
  if (numSessionsNotEnd === MAX_SESSION_NUM) {
    throw HTTPError(400, 'A maximum of 10 sessions that are not in END state currently exist for this quiz');
  }

  // Checks if the quiz has questions
  if (quiz.questions.length === 0) {
    throw HTTPError(400, 'Quiz does not have any questions');
  }

  // Creates a new quiz session with the relevant information
  const quizInfo: QuizInfo = adminQuizInfo(token, quizId, true);
  const newQuizSession: QuizSession = {
    quizSessionId: ++data.latestQuizSessionId,
    autoStartNum: autoStartNum,
    state: STATE_LOBBY,
    atQuestion: 0,
    players: [],
    sessionQuestion: [],
    messages: [],
    metadata: quizInfo,
    sessionOwnerToken: token
  };
  data.quizSessions.push(newQuizSession);
  quiz.quizSessionIds.push(newQuizSession.quizSessionId);

  // Creates a new timer data for the quiz session
  const newTimer: Timer = {
    quizSessionId: newQuizSession.quizSessionId,
    timeoutId: null,
  };
  timerData.timers.push(newTimer);

  setData(data);
  return { sessionId: newQuizSession.quizSessionId };
}

/**
 * Update the state of a particular quiz session by sending an action command.
 *
 * @param {string} token - Unique authenticated user token
 * @param {number} quizId - Unique quiz id
 * @param {number} sessionId - Unique session id
 * @param {string} action - Action command
 *
 * @returns {} - Empty object
 */
export function adminQuizSessionStateUpdate(token: string, quizId: number, sessionId: number, action: string): EmptyObject {
  const data = getData();
  const timerData = getTimers();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  // Checks if session with given sessionId exists
  if (!quiz.quizSessionIds.includes(sessionId)) {
    throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
  }
  const session = getQuizSession(sessionId, data);

  if (session.state === STATE_LOBBY) {
    quizSessionStateLobby(session, timerData, action);
  } else if (session.state === STATE_QUESTION_COUNTDOWN) {
    quizSessionStateQuestionCountdown(session, timerData, action);
  } else if (session.state === STATE_QUESTION_OPEN) {
    quizSessionStateQuestionOpen(session, timerData, action);
  } else if (session.state === STATE_QUESTION_CLOSE) {
    quizSessionStateQuestionClose(session, timerData, action);
  } else if (session.state === STATE_ANSWER_SHOW) {
    quizSessionStateAnswerShow(session, timerData, action);
  } else if (session.state === STATE_FINAL_RESULTS) {
    quizSessionStateFinalResults(session, timerData, action);
  } else if (session.state === STATE_END) {
    throw HTTPError(400, 'Action provided is invalid or cannot be applied in the current state');
  }

  setData(data);
  return {};
}

/**
 * Get the status of a particular quiz session.
 *
 * @param {string} token - Unique authenticated user token
 * @param {number} quizId - Unique quiz id
 * @param {number} sessionId - Unique session id
 *
 * @returns {QuizStatus} - Status for the quiz session
 */
export function adminQuizSessionStatus(token: string, quizId: number, sessionId: number): QuizStatus {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  if (!quiz.quizSessionIds.includes(sessionId)) {
    throw HTTPError(400, 'Session id does not refer to a valid session in the quiz');
  }
  const session = getQuizSession(sessionId, data);

  const playerNames: string[] = session.players.map(player => player.name);
  playerNames.sort();

  const quizStatus: QuizStatus = {
    state: session.state,
    atQuestion: session.atQuestion,
    players: playerNames,
    metadata: session.metadata,
  };

  return quizStatus;
}

/**
 * View the list if active and inactive sessions for a quiz
 *
 * @param {string} token - Unique authenticated user token
 * @param {number} quizId - Unique quiz id
 *
 * @returns {ViewSessions} - An object containing the active and inactive sessions
 */
export function adminQuizSessionView(token: string, quizId: number): ViewSessions {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  const inactiveQuizzes = [];
  const activeQuizzes = [];

  for (const sessionId of quiz.quizSessionIds) {
    const session = data.quizSessions.find(session => session.quizSessionId === sessionId);
    if (session.state === STATE_END) {
      inactiveQuizzes.push(sessionId);
    } else {
      activeQuizzes.push(sessionId);
    }
  }

  const viewSessionsArray: ViewSessions = {
    activeSessions: activeQuizzes.sort((a, b) => a - b),
    inactiveSessions: inactiveQuizzes.sort((a, b) => a - b)
  };

  return viewSessionsArray;
}

/**
 * Get the final results for all players for a completed quiz session
 *
 * @param {number} quizid - Unique quiz id
 * @param {number} sessionId - Unique session id
 * @param {string} token - Unique authenticated user token
 *
 * @returns {Array<FinalSessionResults>} - An Array including relevant information of sessions final results
 */
export function adminQuizSessionFinalResults(quizId: number, sessionId: number, token: string): FinalSessionResults {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  if (!quiz.quizSessionIds.includes(sessionId)) {
    throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
  }
  const session = getQuizSession(sessionId, data);

  if (session.state !== STATE_FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  return getFinalSessionResults(session);
}

/**
 * Given a valid image url, it updates the thumbnail for a quiz
 *
 * @param {string} token - Unique authenticated user token
 * @param {number} quizId - Unique quiz id
 * @param {string} url - URL of the quiz thumbnail
 *
 * @returns {EmptyObject} - Empty object
 */
export function adminQuizThumbnailUpdate(token: string, quizId: number, url: string): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);
  const quiz = getAdminQuiz(quizId, user, data);

  validUrl(url);

  quiz.thumbnailUrl = url;

  setData(data);
  return {};
}

/**
 * Get the a link to the final results (in CSV format) for all players for a completed quiz session
 *
 * @param {number} quizId - unique quizId
 * @param {number} sessionId - unique sessionId
 * @param {string} token - Unique authenticated user token
 *
 * @returns {string} - Returns a url string unique to session and quiz
 */
export function adminQuizResultsCSV(quizId: number, sessionId: number, token: string): UrlCSV {
  const data = getData();
  const user = getAuthUser(token, data);

  const quiz = getAdminQuiz(quizId, user, data);

  if (!quiz.quizSessionIds.includes(sessionId)) {
    throw HTTPError(400, 'Session id does not refer to a valid session in the quiz');
  }

  const session = getQuizSession(sessionId, data);

  if (session.state !== STATE_FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  const currentResults = writeFinalResultsInCSVFormat(session);
  const fileName = writeFile(quizId, sessionId, session, currentResults);

  return { url: url + port + `/${fileName}` };
}
