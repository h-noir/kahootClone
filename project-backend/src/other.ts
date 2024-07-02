import { getTimers, setData } from './dataStore';
import { EmptyObject } from './interfaces';

/**
 * Reset the state of the application back to the start.
 *
 * @param - no parameters
 *
 * @returns {} - returns an empty object
 */
export function clear(): EmptyObject {
  const timerData = getTimers();
  for (const timer of timerData.timers) {
    clearTimeout(timer.timeoutId);
  }
  timerData.timers = [];

  setData({
    users: [],
    quizzes: [],
    latestUserId: 0,
    latestQuizId: 0,
    latestQuizSessionId: 0,
    latestPlayerId: 0,
    userSessions: [],
    quizSessions: [],
  });

  return {};
}
