import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';

import {
  adminAuthRegister,
  adminAuthLogin,
  adminAuthLogout,
  adminUserDetails,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate,
} from './auth';

import {
  adminQuizList,
  adminQuizCreate,
  adminQuizRemove,
  adminQuizInfo,
  adminQuizNameUpdate,
  adminQuizDescriptionUpdate,
  adminQuizTrashView,
  adminQuizTrashRestore,
  adminQuizTrashEmpty,
  adminQuizTransfer,
  adminQuizQuestionCreate,
  adminQuizQuestionUpdate,
  adminQuizQuestionDelete,
  adminQuizQuestionMove,
  adminQuizQuestionDuplicate,
  adminQuizSessionStart,
  adminQuizSessionStateUpdate,
  adminQuizSessionStatus,
  adminQuizSessionView,
  adminQuizSessionFinalResults,
  adminQuizThumbnailUpdate,
  adminQuizResultsCSV
} from './quiz';

import { clear } from './other';

import {
  playerJoin,
  playerQuestionResults,
  playerQuestionSubmitAnswer,
  playerSendChatMessage,
  playerCurrQuestionInfo,
  playerStatus,
  playerSessionFinalResults,
  playerChatView,
} from './player';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// ------------------------------------------------------------------- //
//                            V2 REQUESTS                              //
// ------------------------------------------------------------------- //

app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const response = adminAuthLogout(token);
  res.json(response);
});

app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const response = adminUserDetails(token);
  res.json(response);
});

app.put('/v2/admin/user/details/', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { email, nameFirst, nameLast } = req.body;

  const response = adminUserDetailsUpdate(token, email, nameFirst, nameLast);
  res.json(response);
});

app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { oldPassword, newPassword } = req.body;

  const response = adminUserPasswordUpdate(token, oldPassword, newPassword);
  res.json(response);
});

app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const response = adminQuizList(token);
  res.json(response);
});

app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { name, description } = req.body;

  const response = adminQuizCreate(token, name, description);
  res.json(response);
});

app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const v2 = true;

  const response = adminQuizRemove(token, quizId, v2);
  res.json(response);
});

app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.headers.token as string;

  const response = adminQuizTrashView(token);
  res.json(response);
});

app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const v2 = true;

  const response = adminQuizInfo(token, quizId, v2);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const name = req.body.name.toString();

  const response = adminQuizNameUpdate(token, quizId, name);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const { description } = req.body;

  const response = adminQuizDescriptionUpdate(token, quizId, description);
  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);

  const response = adminQuizTrashRestore(token, quizId);
  res.json(response);
});

app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizIds = JSON.parse(req.query.quizIds as string);

  const response = adminQuizTrashEmpty(token, quizIds);
  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { userEmail } = req.body;
  const quizId = parseInt(req.params.quizid);
  const v2 = true;

  const response = adminQuizTransfer(token, userEmail, quizId, v2);
  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { questionBody } = req.body;
  const quizId = parseInt(req.params.quizid);

  const response = adminQuizQuestionCreate(quizId, token, questionBody);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const { questionBody } = req.body;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  const response = adminQuizQuestionUpdate(quizId, token, questionId, questionBody);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { newPosition } = req.body;

  const response = adminQuizQuestionMove(quizId, token, questionId, newPosition);
  res.json(response);
});

app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const v2 = true;

  const response = adminQuizQuestionDelete(token, quizId, questionId, v2);
  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizid = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);

  const response = adminQuizQuestionDuplicate(token, quizid, questionid);
  res.json(response);
});

// ------------------------------------------------------------------- //
//                            V1 REQUESTS                              //
// ------------------------------------------------------------------- //

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

// other.ts
app.delete('/v1/clear', (req: Request, res: Response) => {
  const response = clear();
  res.json(response);
});

// auth.ts
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  const { email, password, nameFirst, nameLast } = req.body;

  const response = adminAuthRegister(email, password, nameFirst, nameLast);
  res.json(response);
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  const response = adminAuthLogin(req.body.email, req.body.password);
  res.json(response);
});

app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const response = adminAuthLogout(req.body.token);
  res.json(response);
});

app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const token = req.query.token as string;

  const response = adminUserDetails(token);
  res.json(response);
});

app.put('/v1/admin/user/details/', (req: Request, res: Response) => {
  const { token, email, nameFirst, nameLast } = req.body;

  const response = adminUserDetailsUpdate(token, email, nameFirst, nameLast);
  res.json(response);
});

app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;

  const response = adminUserPasswordUpdate(token, oldPassword, newPassword);
  res.json(response);
});

// quiz.ts
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;

  const response = adminQuizList(token);
  res.json(response);
});

app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const { token, name, description } = req.body;

  const response = adminQuizCreate(token, name, description);
  res.json(response);
});

app.delete('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizId = parseInt(req.params.quizid);
  const v2 = false;

  const response = adminQuizRemove(token, quizId, v2);
  res.json(response);
});

app.get('/v1/admin/quiz/trash', (req: Request, res: Response) => {
  const token = req.query.token as string;

  const response = adminQuizTrashView(token);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizid', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizId = parseInt(req.params.quizid);
  const v2 = false;

  const response = adminQuizInfo(token, quizId, v2);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const token = req.body.token as string;
  const quizId = parseInt(req.params.quizid);
  const name = req.body.name.toString();

  const response = adminQuizNameUpdate(token, quizId, name);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const { token, description } = req.body;

  const response = adminQuizDescriptionUpdate(token, quizId, description);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  const token = req.body.token;
  const quizId = parseInt(req.params.quizid);

  const response = adminQuizTrashRestore(token, quizId);
  res.json(response);
});

app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizIds = JSON.parse(req.query.quizIds as string);

  const response = adminQuizTrashEmpty(token, quizIds);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  const { token, userEmail } = req.body;
  const quizId = parseInt(req.params.quizid);
  const v2 = false;

  const response = adminQuizTransfer(token, userEmail, quizId, v2);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const { token, questionBody } = req.body;
  const quizId = parseInt(req.params.quizid);

  const response = adminQuizQuestionCreate(quizId, token, questionBody);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const { token, questionBody } = req.body;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  const response = adminQuizQuestionUpdate(quizId, token, questionId, questionBody);
  res.json(response);
});

app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const v2 = false;

  const response = adminQuizQuestionDelete(token, quizId, questionId, v2);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { token, newPosition } = req.body;

  const response = adminQuizQuestionMove(quizId, token, questionId, newPosition);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const questionid = parseInt(req.params.questionid);
  const token = req.body.token as string;

  const response = adminQuizQuestionDuplicate(token, quizId, questionid);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const { autoStartNum } = req.body;

  const response = adminQuizSessionStart(token, quizId, autoStartNum);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const { action } = req.body;

  const response = adminQuizSessionStateUpdate(token, quizId, sessionId, action);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);

  const response = adminQuizSessionStatus(token, quizId, sessionId);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);

  const response = adminQuizSessionView(token, quizId);
  res.json(response);
});

app.post('/v1/player/join', (req: Request, res: Response) => {
  const { sessionId, name } = req.body;

  const response = playerJoin(sessionId, name);
  res.json(response);
});

app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  const response = playerCurrQuestionInfo(playerId, questionPosition);
  res.json(response);
});

app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const response = playerStatus(playerId);
  res.json(response);
});

app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  const { answerIds } = req.body;

  const response = playerQuestionSubmitAnswer(playerId, questionPosition, answerIds);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);

  const response = adminQuizSessionFinalResults(quizId, sessionId, token);
  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const url = req.body.imgUrl;

  const response = adminQuizThumbnailUpdate(token, quizId, url);
  res.json(response);
});

app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  const response = playerQuestionResults(playerId, questionPosition);
  res.json(response);
});

app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const messageBody = req.body.message.messageBody as string;

  const response = playerSendChatMessage(playerId, messageBody);
  res.json(response);
});

app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const response = playerSessionFinalResults(playerId);
  res.json(response);
});

app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  const response = playerChatView(playerId);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results/csv', (req: Request, res: Response) => {
  const token = req.headers.token as string;
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);

  const response = adminQuizResultsCSV(quizId, sessionId, token);
  res.json(response);
});

app.get('/v1/admin/quiz/load/results/csv', (req: Request, res: Response) => {
  const fileName = req.query.fileName?.toString();

  // Read the content of the CSV file
  fs.readFile('public/' + fileName, 'utf8', (err, data) => {
    if (err) {
    // Handle error if the file cannot be read
      console.error(err);
      return res.status(500).send('Error: Failed to read CSV file.');
    }

    // Send the CSV data in the response
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName); // Set the file name for the download
    const response = {
      data: data // Wrap the CSV data in an object
    };
    res.json(response); // Send the JSON response
  });
});

app.use(express.static('public'));

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

// app.use((req: Request, res: Response) => {
//   const error = `
//     Route not found - This could be because:
//       0. You have defined routes below (not above) this middleware in server.ts
//       1. You have not implemented the route ${req.method} ${req.path}
//       2. There is a typo in either your test or server, e.g. /posts/list in one
//          and, incorrectly, /post/list in the other
//       3. You are using ts-node (instead of ts-node-dev) to start your server and
//          have forgotten to manually restart to load the new changes
//       4. You've forgotten a leading slash (/), e.g. you have posts/list instead
//          of /posts/list in your server.ts or test file
//   `;
//   res.json({ error });
// });

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
