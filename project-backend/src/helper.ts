import fs from 'fs';
import { getData } from './dataStore';
import {
  QuestionAnswer,
  User,
  Quiz,
  DataStore,
  QuizSession,
  PlayerResults,
  QuestionScoreAndRank,
  Submission,
  STATE_QUESTION_COUNTDOWN,
  STATE_END,
  STATE_ANSWER_SHOW,
  STATE_FINAL_RESULTS,
  STATE_QUESTION_OPEN,
  STATE_QUESTION_CLOSE,
  ACTION_NEXT_QUESTION,
  ACTION_SKIP_COUNTDOWN,
  ACTION_GO_TO_ANSWER,
  ACTION_GO_TO_FINAL_RESULTS,
  ACTION_END,
  SessionQuestion,
  TimerData,
  QuizQuestion,
  SessionQuestionResults,
  FinalSessionResults
} from './interfaces';

import HTTPError from 'http-errors';
import { createHash } from 'crypto';

const MIN_QUESTION_LENGTH = 5;
const MAX_QUESTION_LENGTH = 50;
const MAX_QUIZ_DURATION = 3 * 60; // 3 minutes * 60 seconds
const MIN_QUESTION_POINTS = 1;
const MAX_QUESTION_POINTS = 10;
const MIN_TIME_ALLOWED = 0;
const MIN_ANSWERS = 2;
const MAX_ANSWERS = 6;
const MIN_ANSWER_LENGTH = 1;
const MAX_ANSWER_LENGTH = 30;
const MIN_PASSWORD_LENGTH = 8;
const MIN_AUTH_NAME_LENGTH = 2;
const MAX_AUTH_NAME_LENGTH = 20;
const MIN_NEWPOSITION = 0;
const MIN_QUIZ_NAME_LENGTH = 3;
const MAX_QUIZ_NAME_LENGTH = 30;
const QUESTION_COUNTDOWN_TIME = 3 * 1000; // 3 seconds

// This file contains the helper functions used

/**
 * Given a user token and the data, identifies a matching user from token, returning an error
 * if there is no user found.
 *
 * @param {string} token - Unique authenticated user token
 * @param {DataStore} data - Data from datastore
 *
 * @returns {User} - User from token
 */
export function getAuthUser(token: string, data: DataStore): User {
  const validToken = data.userSessions.find(userSession => userSession.token === token);
  if (!validToken) {
    throw HTTPError(401, 'Invalid user token');
  }

  return data.users.find(user => user.userId === validToken.userId);
}

/**
 *
 * @param {number} quizId - Unique quiz identifier
 * @param {User} user - full user details
 * @param {DataStore} data - Data from datastore
 *
 * @returns {Quiz} - full quiz details object
 */
export function getAdminQuiz(quizId: number, user: User, data: DataStore): Quiz {
  const quiz = (data.quizzes.find(quiz => quiz.quizId === quizId));
  if (!quiz) {
    throw HTTPError(403, 'Invalid quizId');
  } else if (!user.quizIds.includes(quizId)) {
    throw HTTPError(403, 'Quiz does not belong to given user');
  }

  return quiz;
}

/**
 * Used in auth.js, checks if the password inputted is valid
 * @param {string} password  - User's password
 * @returns {boolean}        - Returns true if the password is valid, else false
 */
export function authIsValidPassword(password: string): boolean {
  // regex pattern matching expression, atleast 1 number and 1 letter
  const numExists = /\d/.test(password);
  const letterExists = /[a-zA-Z]/.test(password);

  return password.length >= MIN_PASSWORD_LENGTH && numExists && letterExists;
}

/**
 * Creates a Hash object and returns the inputted string's SHA256 hash in base 64
 * @param {string} password - User's password
 * @returns {string} - password's hash
 */
export const hash = (password: string) : string => {
  return createHash('sha256').update(password).digest('base64');
};

/**
 * Used in auth.js, checks if the inputted name is valid
 * @param {string} name     - User's Name
 * @returns {boolean}       - Returns true if the name is valid, else false
 */
export function authIsValidName(name: string): boolean {
// Regex for only contains a-z, A-Z, hyphen, apostrophe, whitespace.
  const validChars = /^[a-zA-Z-' ]+$/.test(name);

  return validChars && name.length >= MIN_AUTH_NAME_LENGTH && name.length <= MAX_AUTH_NAME_LENGTH;
}

/**
 * Helper function used in quiz.js, checks if user has the quiz name inputted
 *
 * @param {integer} authUserId - The ID of the it checkoauthenticated user.
 * @param {string} name - The name or title of the quiz.
 *
 * @returns {boolean} - returns either an error object or false
 */
export function quizIsNameAlreadyUsedByUser(authUserId: number, name: string): boolean {
  const data = getData();
  for (const quiz of data.quizzes) {
    if (quiz.quizOwnerId.includes(authUserId) && quiz.name === name) {
      return true;
    }
  }
  return false;
}

export function timeInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Helper function used in quiz.ts to assign a randomised colour to each answer
 *
 * @returns {string} - returns the name of the colour assigned to the answer
 */
export function randomColour(colours: string[]): string {
  const index = getRandom(0, colours.length - 1);
  const colour = colours[index];
  colours.splice(index, 1); // Remove the selected colour from the array
  return colour;
}

/**
 * Helper function for randomColour to return a random integer within a specified range
 *
 * @param {integer} min - minimum value of the range
 * @param {integer} max - maximum value of the range
 *
 * @returns {integer} - a random number within the specified range
 */
function getRandom(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Helper function to check whether the question parameters are valid
 *
 * @param {integer} quizId - Unique quiz identifier
 * @param {string} question - Question string
 * @param {integer} points - Number of points for the question
 * @param {integer} duration - Duration of the question
 * @param  {QuestionAnswer[]} answersArray - An array containing the answers for the question
 */
export function validQuestionParams(quizId: number, question: string, points: number, duration: number, answersArray: QuestionAnswer[], questionId?: number, thumbnailUrl?: string) {
  const data = getData();
  const quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);
  if (question.length < MIN_QUESTION_LENGTH || question.length > MAX_QUESTION_LENGTH) {
    throw HTTPError(400, `Question length is less than ${MIN_QUESTION_LENGTH} or greater than ${MAX_QUESTION_LENGTH} chars`);
  }

  if (duration <= MIN_TIME_ALLOWED) {
    throw HTTPError(400, `Quiz duration must be greater than ${MIN_TIME_ALLOWED}`);
  }

  if (points < MIN_QUESTION_POINTS || points > MAX_QUESTION_POINTS) {
    throw HTTPError(400, `Points for question must be betweeen ${MIN_QUESTION_POINTS} and ${MAX_QUESTION_POINTS}`);
  }

  let totalDuration;
  const targetQuestion = quiz.questions.find(quizquestion => quizquestion.questionId === questionId);
  if (targetQuestion) {
    totalDuration = quiz.duration - targetQuestion.duration + duration;
  } else {
    totalDuration = quiz.duration + duration;
  }

  if (totalDuration > MAX_QUIZ_DURATION) {
    throw HTTPError(400, `Quiz Duration exceeds ${MAX_QUIZ_DURATION} seconds`);
  }

  if (answersArray.length < MIN_ANSWERS || answersArray.length > MAX_ANSWERS) {
    throw HTTPError(400, `Cannot have less than ${MIN_ANSWERS} or more than ${MAX_ANSWERS} answers`);
  }

  let correctA = 0;
  for (const answers of answersArray) {
    if (answers.answer.length < MIN_ANSWER_LENGTH || answers.answer.length > MAX_ANSWER_LENGTH) {
      throw HTTPError(400, `Length of answers must be between ${MIN_ANSWER_LENGTH} and ${MAX_ANSWER_LENGTH} characters`);
    } else if (answers.correct) {
      correctA++;
    }
  }

  if (correctA === 0) {
    throw HTTPError(400, 'Atleast one answer must be correct');
  }

  const duplicate = new Set(answersArray.map(dupe => dupe.answer));
  if (duplicate.size < answersArray.length) {
    throw HTTPError(400, 'Duplicate answers are not allowed');
  }

  if (thumbnailUrl) {
    validUrl(thumbnailUrl);
  }
}

/**
 * Helper function to check whether the given parameters are valid for a question
 *
 * @param {DataStore} data - Data from datastore
 * @param {integer} quizId - Unique quiz identifier
 * @param {string} authUserId - Unique user identifier
 * @param {integer} questionId - Unique question identifier
 * @param {integer} newPosition - New position for moved question
 */
export function errorCasesForUpdateAndMoveQuestion(data: DataStore, quizId: number, authUserId: number, questionId: number, newPosition?: number) {
  // Check if given quiz exists
  const quiz = data.quizzes.find(quizzes => quizzes.quizId === quizId);

  const targetQuestion = quiz.questions.find(quizquestion => quizquestion.questionId === questionId);

  if (!targetQuestion) {
    throw HTTPError(400, 'Question Id does not refer to a valid question within this quiz');
  }

  const MAX_NEWPOSITION = quiz.questions.length - 1;
  if (newPosition < MIN_NEWPOSITION || newPosition > MAX_NEWPOSITION) {
    throw HTTPError(400, `NewPosition is less than ${MIN_NEWPOSITION}, or greater than ${MAX_NEWPOSITION}`);
  }

  const questionIndex = quiz.questions.findIndex(quizquestion => quizquestion.questionId === questionId);
  if (newPosition === questionIndex) {
    throw HTTPError(400, 'NewPosition is the position of the current question');
  }
}

/**
 * Checks if the given name and description for a quiz is valid
 *
 * @param {string} name - quiz Name
 * @param {string} description - quiz Description
 */
export function nameDescriptionErrorCheck(name?: string, description?: string) {
  if (name || name === '') {
    if (name.length < MIN_QUIZ_NAME_LENGTH || name.length > MAX_QUIZ_NAME_LENGTH) {
      throw HTTPError(400, 'Name must be between 3 and 30 characters long.');
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      throw HTTPError(400, 'Name contains characters other that alphanumeric and spaces.');
    }
  }

  if (description) {
    if (description.length > 100) {
      throw HTTPError(400, 'Description is more than 100 characters in length.');
    }
  }
}

/**
 * Helper function to get the session details given session id
 * @param {number} sessionId - the unique id of a session
 * @param {DataStore} data - data from the dataStore
 * @returns {session} - an object containing all the details of a session
 */
export function getQuizSession(sessionId: number, data: DataStore): QuizSession {
  const session = data.quizSessions.find(session => session.quizSessionId === sessionId);
  if (!session) {
    throw HTTPError(400, 'Invalid quiz sessionId');
  }

  return session;
}

/**
 * Updates the state of a given quiz session that is in Lobby state according to the command given.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 * @param {string} action - Action command
 */
export function quizSessionStateLobby(session: QuizSession, timerData: TimerData, action: string) {
  if (action === ACTION_NEXT_QUESTION) {
    quizSessionNextQuestion(session, timerData);
  } else if (action === ACTION_END) {
    quizSessionEnd(session, timerData);
  } else {
    throw HTTPError(400, 'Action provided is invalid or cannot be applied in the current state');
  }
}

/**
 * Updates the state of a given quiz session that is in Question Countdown state according to the command given.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 * @param {string} action - Action command
 */
export function quizSessionStateQuestionCountdown(session: QuizSession, timerData: TimerData, action: string) {
  if (action === ACTION_SKIP_COUNTDOWN) {
    quizSessionSkipCountdown(session, timerData);
  } else if (action === ACTION_END) {
    quizSessionEnd(session, timerData);
  } else {
    throw HTTPError(400, 'Action provided is invalid or cannot be applied in the current state');
  }
}

/**
 * Updates the state of a given quiz session that is in Question Open state according to the command given.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 * @param {string} action - Action command
 */
export function quizSessionStateQuestionOpen(session: QuizSession, timerData: TimerData, action: string) {
  if (action === ACTION_GO_TO_ANSWER) {
    quizSessionGoToAnswer(session, timerData);
  } else if (action === ACTION_END) {
    quizSessionEnd(session, timerData);
  } else {
    throw HTTPError(400, 'Action provided is invalid or cannot be applied in the current state');
  }
}

/**
 * Updates the state of a given quiz session that is in Question Close state according to the command given.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 * @param {string} action - Action command
 */
export function quizSessionStateQuestionClose(session: QuizSession, timerData: TimerData, action: string) {
  if (action === ACTION_NEXT_QUESTION) {
    quizSessionNextQuestion(session, timerData);
  } else if (action === ACTION_GO_TO_ANSWER) {
    quizSessionGoToAnswer(session, timerData);
  } else if (action === ACTION_GO_TO_FINAL_RESULTS) {
    quizSessionGoToFinalResults(session);
  } else if (action === ACTION_END) {
    quizSessionEnd(session, timerData);
  } else {
    throw HTTPError(400, 'Action provided is invalid or cannot be applied in the current state');
  }
}

/**
 * Updates the state of a given quiz session that is in Answer Show state according to the command given.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 * @param {string} action - Action command
 */
export function quizSessionStateAnswerShow(session: QuizSession, timerData: TimerData, action: string) {
  if (action === ACTION_NEXT_QUESTION) {
    quizSessionNextQuestion(session, timerData);
  } else if (action === ACTION_GO_TO_FINAL_RESULTS) {
    quizSessionGoToFinalResults(session);
  } else if (action === ACTION_END) {
    quizSessionEnd(session, timerData);
  } else {
    throw HTTPError(400, 'Action provided is invalid or cannot be applied in the current state');
  }
}

/**
 * Updates the state of a given quiz session that is in Final Results state according to the command given.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 * @param {string} action - Action command
 */
export function quizSessionStateFinalResults(session: QuizSession, timerData: TimerData, action: string) {
  if (action === ACTION_END) {
    quizSessionEnd(session, timerData);
  } else {
    throw HTTPError(400, 'Action provided is invalid or cannot be applied in the current state');
  }
}

/**
 * Updates the state of a given quiz session when the next question command is called.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 */
function quizSessionNextQuestion(session: QuizSession, timerData: TimerData) {
  session.state = STATE_QUESTION_COUNTDOWN;

  // If there is no next question, go to final results
  if (session.atQuestion !== 0) {
    const nextQuestionIndex = session.atQuestion;
    const question = session.metadata.questions[nextQuestionIndex];
    if (!question) {
      quizSessionGoToFinalResults(session);
      return;
    }
  }

  // Sets a new timer for the question countdown to end after 3 seconds
  session.atQuestion++;
  const timer = timerData.timers.find(timer => timer.quizSessionId === session.quizSessionId);
  timer.timeoutId = setTimeout(() => quizSessionSkipCountdown(session, timerData), QUESTION_COUNTDOWN_TIME);
}

/**
 * Updates the state of a given quiz session when the skip countdown command is called.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 */
function quizSessionSkipCountdown(session: QuizSession, timerData: TimerData) {
  // Clear timer from question countdown
  const oldTimer = timerData.timers.find(timer => timer.quizSessionId === session.quizSessionId);
  if (oldTimer) {
    clearTimeout(oldTimer.timeoutId);
  }

  session.state = STATE_QUESTION_OPEN;

  // Find the question the session is currently on
  const questionIndex = session.atQuestion - 1;
  const question = session.metadata.questions[questionIndex];

  // Add a new session question
  const newSessionQuestion: SessionQuestion = {
    questionId: question.questionId,
    startTime: timeInSeconds(),
    submissions: [],
    correctPlayersId: []
  };
  session.sessionQuestion.push(newSessionQuestion);

  // Sets a new timer for the question to close after the question duration
  const duration = question.duration * 1000;
  const newTimer = timerData.timers.find(timer => timer.quizSessionId === session.quizSessionId);
  newTimer.timeoutId = setTimeout(() => quizSessionCloseQuestion(session), duration);
}

/**
 * Updates the state of a given quiz session when the close question command is called.
 *
 * @param {QuizSession} session - Quiz session
 */
function quizSessionCloseQuestion(session: QuizSession) {
  session.state = STATE_QUESTION_CLOSE;
  calculatePlayerPoints(session);
}

/**
 * Updates the state of a given quiz session when the end command is called.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 */
function quizSessionEnd(session: QuizSession, timerData: TimerData) {
  session.state = STATE_END;
  session.atQuestion = 0;

  // Clears any active timers for the quiz session
  const timer = timerData.timers.find(timer => timer.quizSessionId === session.quizSessionId);
  if (timer) {
    clearTimeout(timer.timeoutId);
  }
}

/**
 * Updates the state of a given quiz session when the go to answer command is called.
 *
 * @param {QuizSession} session - Quiz session
 * @param {TimerData} timerData - Timer data
 */
function quizSessionGoToAnswer(session: QuizSession, timerData: TimerData) {
  // Calculate points if they haven't been calculated yet
  if (session.state !== STATE_QUESTION_CLOSE) {
    calculatePlayerPoints(session);
  }
  session.state = STATE_ANSWER_SHOW;

  // Clear timer for the question to close after question duration
  const timer = timerData.timers.find(timer => timer.quizSessionId === session.quizSessionId);
  if (timer) {
    clearTimeout(timer.timeoutId);
  }
}

/**
 * Updates the state of a given quiz session when the go to final results command is called.
 *
 * @param {QuizSession} session - Quiz session
 */
function quizSessionGoToFinalResults(session: QuizSession) {
  session.state = STATE_FINAL_RESULTS;
  session.atQuestion = 0;
}

/**
 * Helper function to create a random combination of characters from a string
 *
 * @param {string} options - string of characters to choose from
 * @param {number} length - number of characters to choose
 * @returns
 */
export function getRandomCombo(options: string[], length: number): string {
  let res = '';
  const limit = options.length - length;
  while (options.length > limit) {
    const randIndex = Math.floor(Math.random() * options.length);
    const randChar = options[randIndex];
    options.splice(randIndex, 1);
    res = res + randChar;
  }
  return res;
}

/**
 * Returns the quiz session from the given playerId, throwing an error if the player does not exist.
 *
 * @param {number} playerId - Unique player id
 * @param {DataStore} data - Data from dataStore
 *
 * @returns {QuizSession} - Quiz session object
 */
export function getQuizSessionFromPlayerId(playerId: number, data: DataStore): QuizSession {
  const quizSession = data.quizSessions.find(session => {
    return session.players.some(player => player.playerId === playerId);
  });

  if (!quizSession) {
    throw HTTPError(400, 'Invalid playerId');
  }
  return quizSession;
}
/**
 * checks if a url is in a valid format
 * @param {string} url
 */
export function validUrl(url: string) {
  if (!/^((http|https):\/\/)/.test(url)) {
    throw HTTPError(400, 'url does not start with http:// or https:// ');
  }
  if (!/\.(png|jpg|jpeg)$/i.test(url)) {
    throw HTTPError(400, 'url has incorrect file format ');
  }
}

/**
 * Calculates the player points in a session.
 *
 * @param {QuizSession} session - Quiz session
 */
function calculatePlayerPoints(session: QuizSession) {
  // Find the question the session is currently on
  const questionIndex = session.atQuestion - 1;
  const question = session.sessionQuestion[questionIndex];
  const questionPoints = session.metadata.questions[questionIndex].points;

  // Calculate score for each correct submission and add to each submission and total score for player
  let personNum = 1;
  for (const playerId of question.correctPlayersId) {
    const playerScore = questionPoints * (1 / personNum);

    const submission = question.submissions.find(submission => submission.playerId === playerId);
    submission.score = playerScore;

    const player = session.players.find(player => player.playerId === playerId);
    player.score += playerScore;
    personNum++;
  }
}

/**
 * Returns the question metadata from the given quiz session, throwing an error if the question
 * does not exist.
 *
 * @param {QuizSession} session - Quiz session
 * @param {number} questionIndex - Index of the question
 *
 * @returns {QuizQuestion} - Quiz question
 */
export function checkValidQuestionPosition(session: QuizSession, questionIndex: number): QuizQuestion {
  const questionData = session.metadata.questions[questionIndex];
  if (!questionData) {
    throw HTTPError(400, 'Question position is not valid for the session this player is in');
  }

  return questionData;
}

/**
 * Checks if the given answer ids are valid for the question and not duplicates of one another.
 *
 * @param {Array<QuestionAnswer>} answerData - The answer data from a question
 * @param {Array<number>} answerIds - The answer ids submitted
 */
export function checkValidAnswerIds(answerData: QuestionAnswer[], answerIds: number[]) {
  const duplicateCheck: number[] = [];

  for (const answerId of answerIds) {
    // Checks if answer id is valid for given question
    const answer = answerData.find(answer => answer.answerId === answerId);
    if (!answer) {
      throw HTTPError(400, 'AnswerId is not valid for this particular question');
    }

    // Checks if duplicate answerIds have been provided
    if (duplicateCheck.includes(answerId)) {
      throw HTTPError(400, 'Duplicate answerIds provided');
    }
    duplicateCheck.push(answerId);
  }
}

/**
 * Returns the question id, a list of the correct players, the average answer time and the
 * percent correct for a given question in a quiz session.
 *
 * @param {QuizSession} session - Quiz session
 * @param {number} questionIndex - Index of the question
 *
 * @returns {SessionQuestionResults} - Question results for the session
 */
export function getQuestionResults(session: QuizSession, questionIndex: number): SessionQuestionResults {
  const question = session.sessionQuestion[questionIndex];

  const playersCorrectList = getCorrectPlayersList(session, question);
  const averageAnswerTime = getAverageAnswerTime(question);
  const percentCorrect = Math.round((playersCorrectList.length / session.players.length) * 100);

  const questionResults = {
    questionId: question.questionId,
    playersCorrectList: playersCorrectList,
    averageAnswerTime: averageAnswerTime,
    percentCorrect: percentCorrect
  };

  return questionResults;
}

/**
 * Creates an array of player names who got the question correct, sorted in ascending order
 *
 * @param {QuizSession} session - Quiz session
 * @param {SessionQuestion} question - Session question
 *
 * @returns {Array<string>} - An array containing names of the players correct
 */
function getCorrectPlayersList(session: QuizSession, question: SessionQuestion): string[] {
  const playersCorrectList: string[] = [];

  // Get player name from correctPlayersId array and sort alphabetically
  for (const playerId of question.correctPlayersId) {
    const player = session.players.find(player => player.playerId === playerId);
    playersCorrectList.push(player.name);
  }
  playersCorrectList.sort();

  return playersCorrectList;
}

/**
 * Finds the rounded average answer time of the question for all players who attempted.
 *
 * @param {SessionQuestion} question - Session question
 *
 * @returns {number} - Average answer time
 */
function getAverageAnswerTime(question: SessionQuestion): number {
  // Creates an array of the answer times of all submissions
  const answerTimes = question.submissions.map(result => {
    return result.answerTime;
  });

  // Finds the rounded average answer time of the question for all players who attempted
  let averageAnswerTime = 0;
  if (answerTimes.length !== 0) {
    averageAnswerTime = Math.round(answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length);
  }

  return averageAnswerTime;
}

/**
 * Write data on player score and rank to a file, and returns filename
 *
 * @param {number} quizId  - unique quizId
 * @param {number} sessionId - unique sessionId
 * @param {QuizSession} session - All information about a quiz Session
 * @param {PlayerResults[]} currentResults - Player scores and ranks for each question
 *
 * @returns {string} FileName - File name unique to quiz and session
 */
export function writeFile(quizId: number, sessionId: number, session: QuizSession, currentResults: PlayerResults[]): string {
  let header = 'Player';
  for (let i = 1; i <= session.sessionQuestion.length; i++) {
    header += `,question${i}score,question${i}rank`;
  }
  header += '\n';

  let csvData = header;

  for (const playerResults of currentResults) {
    const playerName = playerResults.playerName;
    let scoresAndRanks = '';

    for (const question of playerResults.questionScoreAndRank) {
      scoresAndRanks += `${question.score},${question.rank},`;
    }

    csvData += `${playerName},${scoresAndRanks}\n`;
  }

  const fileName = `quiz_${quizId}_session_${sessionId}.csv`;

  fs.writeFileSync('public/' + fileName, csvData, 'utf8');

  return fileName;
}

/**
 * Write all relevant information about a player and their quiz results in the CSV Format
 *
 * @param {QuizSession} session - All Information about a quiz session
 *
 * @returns {PlayerResults[]} PlayerResults - The name, score and rank of a player for each quiz  question
 */
export function writeFinalResultsInCSVFormat (session: QuizSession): PlayerResults[] {
  let currentResults: PlayerResults[] = [];

  for (const player of session.players) {
    const playerId = player.playerId;
    const questionScoreAndRank: QuestionScoreAndRank[] = [];

    for (const question of session.sessionQuestion) {
      const orderedSubmissions = question.submissions.sort((a, b) => b.score - a.score);
      const playerSubmission = orderedSubmissions.find(submission => submission.playerId === playerId);

      if (playerSubmission) {
        calculatePlayerRankAndScore(orderedSubmissions, playerSubmission, questionScoreAndRank);
      } else {
        const playerScoreAndRank: QuestionScoreAndRank = {
          score: 0,
          rank: 0
        };

        questionScoreAndRank.push(playerScoreAndRank);
      }
    }

    const playerResults: PlayerResults = {
      playerName: player.name,
      questionScoreAndRank: questionScoreAndRank
    };

    currentResults.push(playerResults);
  }

  currentResults = currentResults.sort((a, b) => a.playerName.localeCompare(b.playerName));

  return currentResults;
}

/**
 * Calculates and pushes each players score and rank into questionScoreAndRank array
 *
 * @param {Submission[]} orderedSubmissions
 * @param {Submission} playerSubmission
 * @param {QuestionScoreAndRank[]} questionScoreAndRank
 */
function calculatePlayerRankAndScore (orderedSubmissions: Submission[], playerSubmission: Submission, questionScoreAndRank: QuestionScoreAndRank[]) {
  let score = 0;
  let rank = 1;
  let prevScore = orderedSubmissions[0].score;
  for (const submission of orderedSubmissions) {
    if (submission.score < prevScore) {
      rank++;
      prevScore = submission.score;
    }

    score = submission.score;

    if (submission === playerSubmission) {
      const playerScoreAndRank: QuestionScoreAndRank = {
        score: Math.round(score),
        rank
      };
      questionScoreAndRank.push(playerScoreAndRank);
    }
  }
}

/** Gets the final quiz session results for a session.
 *
 * @param {QuizSession} session - Quiz session
 *
 * @returns {FinalSessionResults} - Object containining an array of users ranked by score and question results
 */
export function getFinalSessionResults(session: QuizSession): FinalSessionResults {
  let usersRankedByScore = [];
  const totalQuestionResults = [];

  // Round the score
  usersRankedByScore = session.players.map(player => ({
    ...player,
    score: Math.round(player.score)
  }));

  // Ranks users by score
  usersRankedByScore.sort((a, b) => b.score - a.score);
  usersRankedByScore = usersRankedByScore.map(({ playerId, ...rest }) => rest);

  // Get the question results for every question
  for (let i = 0; i < session.sessionQuestion.length; i++) {
    totalQuestionResults.push(getQuestionResults(session, i));
  }

  const finalSessionResults: FinalSessionResults = {
    usersRankedByScore: usersRankedByScore,
    questionResults: totalQuestionResults
  };

  return finalSessionResults;
}
