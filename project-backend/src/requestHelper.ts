import request, { HttpVerb } from 'sync-request-curl';
import { port, url } from './config.json';
import { IncomingHttpHeaders } from 'http';
import HTTPError from 'http-errors';

import {
  QuestionAnswer,
  QuizQuestion,
  EmptyObject,
  Token,
  UserDetails,
  QuizList,
  QuizId,
  QuizInfo,
  QuestionId,
  NewQuestionId,
  SessionId,
  ViewSessions,
  QuizStatus,
  PlayerId,
  FinalSessionResults,
  SessionQuestionResults,
  CurrentQuestionInfo,
  PlayerStatus,
  Message,
  UrlCSV,
  CSVData
} from './interfaces';

const SERVER_URL = `${url}:${port}`;

export function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

const requestHelper = (method: HttpVerb, path: string, payload: object = {}, headers: IncomingHttpHeaders = {}) => {
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method.toUpperCase())) {
    qs = payload;
  } else {
    json = payload;
  }

  const url = SERVER_URL + path;
  const res = request(method, url, { qs, json, headers });

  let responseBody;
  try {
    responseBody = JSON.parse(res.body.toString());
  } catch (err) {
    if (res.statusCode === 200) {
      throw HTTPError(500,
        `Non-jsonifiable body despite code 200: '${res.body}'.\nCheck that you are not doing res.json(undefined) instead of res.json({}), e.g. in '/clear'`
      );
    }
    responseBody = { error: `Failed to parse JSON: '${err.message}'` };
  }

  const errorMessage = `[${res.statusCode}] ` + responseBody?.error || responseBody || 'No message specified!';
  switch (res.statusCode) {
    case 400: // BAD_REQUEST
    case 401: // UNAUTHORIZED
      throw HTTPError(res.statusCode, errorMessage);
    case 404: // NOT_FOUND
      throw HTTPError(res.statusCode, `Cannot find '${url}' [${method}]\nReason: ${errorMessage}\n\nHint: Check that your server.ts have the correct path AND method`);
    case 500: // INTERNAL_SERVER_ERROR
      throw HTTPError(res.statusCode, errorMessage + '\n\nHint: Your server crashed. Check the server log!\n');
    default:
      if (res.statusCode !== 200) {
        throw HTTPError(res.statusCode, errorMessage + `\n\nSorry, no idea! Look up the status code ${res.statusCode} online!\n`);
      }
  }
  return responseBody;
};

// ------------------------------------------------------------------- //
//                            V2 REQUESTS                              //
// ------------------------------------------------------------------- //

export const v2requestAdminAuthLogout = (token: string): EmptyObject => {
  return requestHelper('POST', '/v2/admin/auth/logout', { }, { token });
};

export const v2requestAdminUserDetails = (token: string): UserDetails => {
  return requestHelper('GET', '/v2/admin/user/details', { }, { token });
};

export const v2requestAdminUserDetailsUpdate = (token: string, email: string, nameFirst: string, nameLast: string): EmptyObject => {
  return requestHelper('PUT', '/v2/admin/user/details/', { email, nameFirst, nameLast }, { token });
};

export const v2requestAdminUserPasswordUpdate = (token: string, oldPassword: string, newPassword: string): EmptyObject => {
  return requestHelper('PUT', '/v2/admin/user/password', { oldPassword, newPassword }, { token });
};

export const v2requestAdminQuizList = (token: string): QuizList => {
  return requestHelper('GET', '/v2/admin/quiz/list', {}, { token: token });
};

export const v2requestAdminQuizCreate = (token: string, name: string, description: string) => {
  return requestHelper('POST', '/v2/admin/quiz', { name, description }, { token });
};

export const v2requestAdminQuizInfo = (token: string, quizid: number): QuizInfo => {
  return requestHelper('GET', `/v2/admin/quiz/${quizid}`, {}, { token });
};

export const v2requestAdminQuizRemove = (token: string, quizId: number): EmptyObject => {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizId}`, {}, { token: token });
};

export const v2requestAdminQuizNameUpdate = (token: string, quizid: number, name: string): EmptyObject => {
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/name`, { name }, { token: token });
};

export const v2requestAdminQuizDescriptionUpdate = (token: string, quizid: number, description: string) => {
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/description`, { description }, { token });
};

export const v2requestAdminQuizTrashView = (token: string): QuizList => {
  return requestHelper('GET', '/v2/admin/quiz/trash', {}, { token: token });
};

export const v2requestAdminQuizTrashRestore = (token: string, quizid: number): EmptyObject => {
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/restore`, {}, { token: token });
};

export const v2requestAdminQuizTrashEmpty = (token: string, quizIds: string): EmptyObject => {
  return requestHelper('DELETE', '/v2/admin/quiz/trash/empty', { quizIds }, { token });
};

export const v2requestAdminQuizTransfer = (token: string, userEmail: string, quizid: number): EmptyObject => {
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/transfer`, { userEmail }, { token });
};

export const v2requestAdminQuizQuestionCreate = (quizid: number, token: string, question: string, points: number, duration: number, answers: QuestionAnswer[], thumbnailUrl: string): QuestionId => {
  const questionBody: QuizQuestion = {
    question: question,
    duration: duration,
    thumbnailUrl: thumbnailUrl,
    points: points,
    answers: answers
  };
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/question`, { questionBody }, { token });
};

export const v2requestAdminQuizQuestionUpdate = (quizid: number, token: string, questionid: number, question: string, points: number, duration: number, answers: QuestionAnswer[], thumbnailUrl: string): Response => {
  const questionBody: QuizQuestion = {
    question: question,
    duration: duration,
    thumbnailUrl: thumbnailUrl,
    points: points,
    answers: answers,
  };
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/question/${questionid}`, { questionBody }, { token });
};

export const v2requestAdminQuizQuestionDelete = (token: string, quizid: number, questionid: number): EmptyObject => {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizid}/question/${questionid}`, {}, { token });
};

export const v2requestAdminQuizQuestionMove = (quizId: number, token: string, questionId: number, newPosition: number) => {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}/move`, { newPosition }, { token });
};

export const v2requestAdminQuizQuestionDuplicate = (token: string, quizid: number, questionid: number): NewQuestionId => {
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/question/${questionid}/duplicate`, {}, { token });
};

// ------------------------------------------------------------------- //
//                            V1 REQUESTS                              //
// ------------------------------------------------------------------- //

// other.ts
export const requestClear = (): EmptyObject => {
  return requestHelper('DELETE', '/v1/clear', {});
};

// auth.ts
export const requestAdminAuthRegister = (email: string, password: string, nameFirst: string, nameLast: string): Token => {
  return requestHelper('POST', '/v1/admin/auth/register', { email, password, nameFirst, nameLast });
};

export const requestAdminAuthLogin = (email: string, password: string): Token => {
  return requestHelper('POST', '/v1/admin/auth/login', { email, password });
};

export const requestAdminAuthLogout = (token: string): EmptyObject => {
  return requestHelper('POST', '/v1/admin/auth/logout', { token });
};

export const requestAdminUserDetails = (token: string): UserDetails => {
  return requestHelper('GET', '/v1/admin/user/details', { token });
};

export const requestAdminUserDetailsUpdate = (token: string, email: string, nameFirst: string, nameLast: string): EmptyObject => {
  return requestHelper('PUT', '/v1/admin/user/details/', { token, email, nameFirst, nameLast });
};

export const requestAdminUserPasswordUpdate = (token: string, oldPassword: string, newPassword: string): EmptyObject => {
  return requestHelper('PUT', '/v1/admin/user/password', { token, oldPassword, newPassword });
};

// quiz.ts
export const requestAdminQuizList = (token: string): QuizList => {
  return requestHelper('GET', '/v1/admin/quiz/list', { token });
};

export const requestAdminQuizCreate = (token: string, name: string, description: string): QuizId => {
  return requestHelper('POST', '/v1/admin/quiz', { token, name, description });
};

export const requestAdminQuizRemove = (token: string, quizId: number): EmptyObject => {
  return requestHelper('DELETE', `/v1/admin/quiz/${quizId}`, { token });
};

export const requestAdminQuizInfo = (token: string, quizid: number): QuizInfo => {
  return requestHelper('GET', `/v1/admin/quiz/${quizid}`, { token });
};

export const requestAdminQuizNameUpdate = (token: string, quizid: number, name: string): EmptyObject => {
  return requestHelper('PUT', `/v1/admin/quiz/${quizid}/name`, { token, name });
};

export const requestAdminQuizDescriptionUpdate = (token: string, quizId: number, description: string): EmptyObject => {
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/description`, { token, description });
};

export const requestAdminQuizTrashView = (token: string): QuizList => {
  return requestHelper('GET', '/v1/admin/quiz/trash', { token });
};

export const requestAdminQuizTrashRestore = (token: string, quizid: number): EmptyObject => {
  return requestHelper('POST', `/v1/admin/quiz/${quizid}/restore`, { token });
};

export const requestAdminQuizTrashEmpty = (token: string, quizIds: string): EmptyObject => {
  return requestHelper('DELETE', '/v1/admin/quiz/trash/empty', { token, quizIds });
};

export const requestAdminQuizTransfer = (token: string, userEmail: string, quizid: number): EmptyObject => {
  return requestHelper('POST', `/v1/admin/quiz/${quizid}/transfer`, { token, userEmail });
};

export const requestAdminQuizQuestionCreate = (quizid: number, token: string, question: string, points: number, duration: number, answers: QuestionAnswer[]): QuestionId => {
  const questionBody: QuizQuestion = {
    question: question,
    duration: duration,
    points: points,
    answers: answers,
  };
  return requestHelper('POST', `/v1/admin/quiz/${quizid}/question`, { token, questionBody });
};

export const requestAdminQuizQuestionUpdate = (quizid: number, token: string, questionid: number, question: string, points: number, duration: number, answers: QuestionAnswer[]): EmptyObject => {
  const questionBody: QuizQuestion = {
    question: question,
    duration: duration,
    points: points,
    answers: answers,
  };
  return requestHelper('PUT', `/v1/admin/quiz/${quizid}/question/${questionid}`, { token, questionBody });
};

export const requestAdminQuizQuestionDelete = (token: string, quizid: number, questionid: number): EmptyObject => {
  return requestHelper('DELETE', `/v1/admin/quiz/${quizid}/question/${questionid}`, { token });
};

export const requestAdminQuizQuestionMove = (quizId: number, token: string, questionId: number, newPosition: number): EmptyObject => {
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/question/${questionId}/move`, { token, newPosition });
};

export const requestAdminQuizQuestionDuplicate = (token: string, quizid: number, questionid: number): NewQuestionId => {
  return requestHelper('POST', `/v1/admin/quiz/${quizid}/question/${questionid}/duplicate`, { token });
};

export const requestAdminQuizSessionStart = (token: string, quizid: number, autoStartNum: number): SessionId => {
  return requestHelper('POST', `/v1/admin/quiz/${quizid}/session/start`, { autoStartNum }, { token });
};

export const requestAdminQuizSessionStateUpdate = (token: string, quizid: number, sessionid: number, action: string): EmptyObject => {
  return requestHelper('PUT', `/v1/admin/quiz/${quizid}/session/${sessionid}`, { action }, { token });
};

export const requestAdminQuizSessionStatus = (token: string, quizid: number, sessionid: number): QuizStatus => {
  return requestHelper('GET', `/v1/admin/quiz/${quizid}/session/${sessionid}`, { }, { token });
};

export const requestAdminQuizSessionView = (token: string, quizid: number): ViewSessions => {
  return requestHelper('GET', `/v1/admin/quiz/${quizid}/sessions`, { }, { token });
};

export const requestPlayerJoin = (sessionId: number, name: string): PlayerId => {
  return requestHelper('POST', '/v1/player/join/', { sessionId, name });
};

export const requestAdminQuizSessionFinalResults = (quizid: number, sessionid: number, token: string): FinalSessionResults => {
  return requestHelper('GET', `/v1/admin/quiz/${quizid}/session/${sessionid}/results`, { }, { token });
};

export const requestPlayerStatus = (playerid: number): PlayerStatus => {
  return requestHelper('GET', `/v1/player/${playerid}`, {});
};

export const requestPlayerQuestionSubmitAnswer = (playerid: number, questionposition: number, answerIds: number[]): EmptyObject => {
  return requestHelper('PUT', `/v1/player/${playerid}/question/${questionposition}/answer`, { answerIds });
};

export const requestPlayerCurrQuestionInfo = (playerid: number, questionposition: number): CurrentQuestionInfo => {
  return requestHelper('GET', `/v1/player/${playerid}/question/${questionposition}`, {});
};

export const requestQuizThumbnailUpdate = (token: string, quizid: number, imgUrl: string) => {
  return requestHelper('PUT', `/v1/admin/quiz/${quizid}/thumbnail`, { imgUrl }, { token });
};

export const requestPlayerQuestionResults = (playerid: number, questionposition: number): SessionQuestionResults => {
  return requestHelper('GET', `/v1/player/${playerid}/question/${questionposition}/results`);
};

export const requestPlayerSendChatMessage = (playerid: number, messageBody: string) => {
  return requestHelper('POST', `/v1/player/${playerid}/chat`, { message: { messageBody } });
};

export const requestPlayerSessionFinalResults = (playerid: number): FinalSessionResults => {
  return requestHelper('GET', `/v1/player/${playerid}/results`);
};

export const requestPlayerChatView = (playerid: number): Message => {
  return requestHelper('GET', `/v1/player/${playerid}/chat`, {});
};

export const requestAdminQuizResultsCSV = (quizid: number, sessionid: number, token: string): UrlCSV => {
  return requestHelper('GET', `/v1/admin/quiz/${quizid}/session/${sessionid}/results/csv`, { }, { token });
};

export const requestAdminQuizLoadResultsCSV = (fileName: string): CSVData => {
  return requestHelper('GET', '/v1/admin/quiz/load/results/csv', { fileName });
};
