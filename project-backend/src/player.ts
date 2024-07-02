import { getData, setData } from './dataStore';

import {
  checkValidAnswerIds,
  checkValidQuestionPosition,
  getFinalSessionResults,
  getQuestionResults,
  getQuizSession,
  getQuizSessionFromPlayerId,
  getRandomCombo,
  timeInSeconds
} from './helper';

import {
  EmptyObject,

  PlayerId,
  Player,
  PlayerStatus,
  Submission,
  CurrentQuestionInfo,
  STATE_END,
  STATE_QUESTION_COUNTDOWN,
  SessionQuestionResults,
  FinalSessionResults,
  Message,
  ACTION_NEXT_QUESTION,
  STATE_LOBBY,
  STATE_QUESTION_OPEN,
  STATE_ANSWER_SHOW,
  STATE_FINAL_RESULTS,
} from './interfaces';

import HTTPError from 'http-errors';
import { adminQuizSessionStateUpdate } from './quiz';

const MAX_MESSAGE_LENGTH = 100;
const MIN_MESSAGE_LENGTH = 1;

/**
 * Allows a guest player to join a session
 *
 * @param {number} sessionId - SessionId of quiz session to be joined
 * @param {string} name - Name of player
 * @returns {PlayerId}
 */
export function playerJoin(sessionId: number, name: string): PlayerId {
  const data = getData();
  const quizSession = getQuizSession(sessionId, data);

  // Checks if quiz session exists and is in the lobby state
  if (quizSession.state !== STATE_LOBBY) {
    throw HTTPError(400, 'Quiz is not in Lobby state');
  }

  // Checks if a name is provided and generates a random one if name is empty
  const alphabet: string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const numbers: string[] = '1234567890'.split('');
  if (name === '') {
    let uniqueNameFound = false;
    while (!uniqueNameFound) {
      name = getRandomCombo(alphabet, 5) + getRandomCombo(numbers, 3);
      if (!quizSession.players.find(player => player.name === name)) {
        uniqueNameFound = true;
      }
    }
  } else if (quizSession.players.find(player => player.name === name)) {
    throw HTTPError(400, 'Duplicate name. Pick a different name');
  }

  // Creates new player and adds it to session's players array
  data.latestPlayerId++;
  const newPlayer: Player = {
    playerId: data.latestPlayerId,
    name: name,
    score: 0,
  };

  quizSession.players.push(newPlayer);

  // Start quiz when autoStartNum reached
  if (quizSession.autoStartNum === quizSession.players.length) {
    adminQuizSessionStateUpdate(quizSession.sessionOwnerToken, quizSession.metadata.quizId,
      quizSession.quizSessionId, ACTION_NEXT_QUESTION);
  }

  setData(data);
  return { playerId: newPlayer.playerId };
}

/**
 * Gets the status of the session a player is in.
 *
 * @param {number} playerId - Player ID of player to be looked up
 * @returns {PlayerStatus}
 */
export function playerStatus(playerId: number): PlayerStatus {
  const data = getData();
  const quizSession = getQuizSessionFromPlayerId(playerId, data);

  // Returns relevant information for the session the player is in
  return {
    state: quizSession.state,
    numQuestions: quizSession.metadata.questions.length,
    atQuestion: quizSession.atQuestion,
  };
}

/**
 * Allow the current player to submit answer(s) to the currently active question. Question position starts at 1.
 * An answer can be re-submitted once first selection is made, as long as game is in the right state.
 *
 * @param {number} playerId - Unique player id
 * @param {number} questionPosition - Position of the question the answer is submitted for
 * @param {<Array>number} answerIds - Array of answer ids being submitted
 *
 * @returns {} - Empty object
 */
export function playerQuestionSubmitAnswer(playerId: number, questionPosition: number, answerIds: number[]): EmptyObject {
  const data = getData();
  const quizSession = getQuizSessionFromPlayerId(playerId, data);

  // Checks question position is valid for the quiz session
  const questionIndex = questionPosition - 1;
  const questionData = checkValidQuestionPosition(quizSession, questionIndex);

  // Checks if quiz session is in QUESTION OPEN state
  if (quizSession.state !== STATE_QUESTION_OPEN) {
    throw HTTPError(400, 'Session is not in QUESTION_OPEN state');
  }

  // Checks if quiz session is at the given question position
  if (quizSession.atQuestion !== questionPosition) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }

  // Checks if at least 1 answer was submitted
  if (answerIds.length === 0) {
    throw HTTPError(400, 'At least 1 answer must be submitted');
  }

  const answerData = questionData.answers;
  checkValidAnswerIds(answerData, answerIds);
  const question = quizSession.sessionQuestion[questionIndex];

  // If player has submitted answer already, remove previous submission
  const submission = question.submissions.find(submission => submission.playerId === playerId);
  if (submission) {
    question.submissions = question.submissions.filter(submissions => submissions.playerId !== playerId);

    // If previous answer was correct, remove player from correct players list
    if (question.correctPlayersId.includes(playerId)) {
      question.correctPlayersId = question.correctPlayersId.filter(playerIds => playerIds !== playerId);
    }
  }

  // Create a new submission and push to submissions array
  const newSubmission: Submission = {
    playerId: playerId,
    answerTime: (Date.now() / 1000) - question.startTime,
    answerIds: answerIds,
    score: 0
  };
  question.submissions.push(newSubmission);

  // If answer submitted is correct, push to correct players list
  const correctAnswers = answerData.filter(answer => answer.correct).map(answer => answer.answerId).sort();
  answerIds.sort();
  if (JSON.stringify(correctAnswers) === JSON.stringify(answerIds)) {
    question.correctPlayersId.push(playerId);
  }

  setData(data);
  return {};
}

/**
 * Retrieves info about the current question that a player is on
 *
 * @param {number} playerId - Player ID to be referenced
 * @param {number} questionPosition - Determines which question will be "looked up"
 *
 * @returns
 */
export function playerCurrQuestionInfo(playerId: number, questionPosition: number): CurrentQuestionInfo {
  const data = getData();
  const quizSession = getQuizSessionFromPlayerId(playerId, data);
  const currQuestion = checkValidQuestionPosition(quizSession, questionPosition - 1);
  const sessionState = quizSession.state;

  // Error checking
  if (quizSession.atQuestion !== questionPosition) {
    throw HTTPError(400, 'Quiz session is not currently on questionPosition');
  } else if (
    sessionState === STATE_LOBBY ||
    sessionState === STATE_END ||
    sessionState === STATE_QUESTION_COUNTDOWN ||
    sessionState === STATE_FINAL_RESULTS) {
    throw HTTPError(400, 'Will not work with quizSession in current state');
  }

  const currQuestionInfo: CurrentQuestionInfo = {
    questionId: currQuestion.questionId,
    question: currQuestion.question,
    duration: currQuestion.duration,
    thumbnailUrl: currQuestion.thumbnailUrl,
    points: currQuestion.points,
    answers: currQuestion.answers.map(answer => ({
      answerId: answer.answerId,
      answer: answer.answer,
      colour: answer.colour
    })),
  };
  return currQuestionInfo;
}

export function playerQuestionResults(playerId: number, questionPosition: number): SessionQuestionResults {
  const data = getData();
  const quizSession = getQuizSessionFromPlayerId(playerId, data);

  // Checks question position is valid for the quiz session
  const questionIndex = questionPosition - 1;
  checkValidQuestionPosition(quizSession, questionIndex);

  // Checks if quiz session is in ANSWER SHOW state
  if (quizSession.state !== STATE_ANSWER_SHOW) {
    throw HTTPError(400, 'Session is not in ANSWER_SHOW state');
  }

  // Checks if quiz session is at the given question position
  if (quizSession.atQuestion !== questionPosition) {
    throw HTTPError(400, 'Session is not yet up to this question');
  }

  return getQuestionResults(quizSession, questionIndex);
}

export function playerSendChatMessage(playerId: number, messageBody: string): EmptyObject {
  const data = getData();
  const quizSession = getQuizSessionFromPlayerId(playerId, data);

  if (messageBody.length < MIN_MESSAGE_LENGTH || messageBody.length > MAX_MESSAGE_LENGTH) {
    throw HTTPError(400, 'Message body is less than 1 character or more than 100 characters');
  }

  const player = quizSession.players.find(player => player.playerId === playerId);

  quizSession.messages.push({
    playerName: player.name,
    playerId,
    messageBody,
    timeSent: timeInSeconds(),
  });

  setData(data);
  return {};
}

/**
 * Get the final results for a whole session a player is playing in
 * @param {number} playerId - Unique player id
 * @returns {Array} FinalSessionResults[] - An Array including relevant information of sessions final results
 */
export function playerSessionFinalResults(playerId: number): FinalSessionResults {
  const data = getData();
  const session = getQuizSessionFromPlayerId(playerId, data);

  if (session.state !== STATE_FINAL_RESULTS) {
    throw HTTPError(400, 'Session is not in FINAL_RESULTS state');
  }

  return getFinalSessionResults(session);
}

/**
 * Return all messages that are in the same session as the player, in the order they were sent
 *
 * @param playerId - unique player id
 *
 * @returns {Message[]} - an array containing the list of messages
 */
export function playerChatView(playerId: number): { messages: Message[] } {
  const data = getData();
  const quizSession = getQuizSessionFromPlayerId(playerId, data);

  const chatMessages = structuredClone(quizSession.messages);

  setData(data);
  return { messages: chatMessages };
}
