import isEmail from 'validator/lib/isEmail';
import { getData, setData } from './dataStore';
import { nanoid } from 'nanoid';
import { authIsValidPassword, authIsValidName, getAuthUser } from './helper';
import { Token, UserDetails, EmptyObject, Quiz } from './interfaces';
import HTTPError from 'http-errors';
import { hash } from './helper';

/**
 * Register a user with an email, password, and names, then returns their authUserId value.
 *
 * @param {string} email            - user's email address
 * @param {string} password         - user's password
 * @param {string} nameFirst        - user's first name
 * @param {string} nameLast         - user's last name
 *
 * @returns {token: string}    - an object which contains the authenticated user token
 */
export function adminAuthRegister(email: string, password: string, nameFirst: string, nameLast: string): Token {
  // error checking
  if (!isEmail(email)) {
    throw HTTPError(400, 'Invalid email format');
  }
  if (!authIsValidPassword(password)) {
    throw HTTPError(400, 'Invalid password');
  }
  if (!authIsValidName(nameFirst) || !authIsValidName(nameLast)) {
    throw HTTPError(400, 'Invalid first or last name');
  }

  // checking if email is used by other user
  const data = getData();

  if (data.users.length > 0) {
    if (data.users.some(user => user.userEmail.toLowerCase() === email.toLowerCase())) {
      throw HTTPError(400, 'Email is used by another user');
    }
  }

  // create the new user and push onto array of users
  const newUser = {
    userId: data.latestUserId + 1,
    nameFirst: nameFirst,
    nameLast: nameLast,
    userEmail: email,
    userNewPassword: hash(password),
    userOldPasswords: [] as string[],
    numSuccessfulLogins: 1,
    numFailedPasswordsSinceLastLogin: 0,
    quizIds: [] as number[],
    trash: [] as Quiz[],
  };

  data.latestUserId++;
  data.users.push(newUser);

  const userToken = nanoid();
  data.userSessions.push({ token: userToken, userId: newUser.userId });
  setData(data);

  return { token: userToken };
}

/**
 * Given a registered user's email and password returns their authUserId value.
 *
 *
 * @param {string} email        - user's email address
 * @param {string} password     - user's password
 *
 * @returns {token: string}    - an object which contains the authenticated user token
 */
export function adminAuthLogin(email: string, password: string): Token {
  const data = getData();
  // finding if data has a user with email entered (case insensitive)
  const user = data.users.find(users => users.userEmail.toLowerCase() === email.toLowerCase());
  // return error if no matching email is found
  if (!user) {
    throw HTTPError(400, 'Invalid email entered');
  }

  // if password entered is incorrect, increment numFailedPasswordsSinceLastLogin,
  // push onto data and return error
  if (hash(password) !== user.userNewPassword) {
    user.numFailedPasswordsSinceLastLogin++;
    setData(data);
    throw HTTPError(400, 'Invalid password entered');
  }

  // if user with matching email and password is found, increment the numSuccessfulLogins,
  // reset numFailedPasswordsSinceLastLogin and return the token
  user.numSuccessfulLogins++;
  user.numFailedPasswordsSinceLastLogin = 0;
  // generate new user session
  const userToken = nanoid();
  data.userSessions.push({ token: userToken, userId: user.userId });
  setData(data);
  return { token: userToken };
}

/**
 * Logs out and admin user who has an active session
 *
 * @param {string} token - Unique authenticated user token
 *
 * @returns {}    - an empty object
 */
export function adminAuthLogout(token: string): EmptyObject {
  const data = getData();

  const userSessionIndex = data.userSessions.findIndex(userSession => userSession.token === token);
  if (userSessionIndex === -1) {
    throw HTTPError(401, 'Invalid user token');
  }

  data.userSessions.splice(userSessionIndex, 1);

  setData(data);
  return {};
}

/**
 * Given an admin user's authUserId, return details about the user.
 * "name" is the first and last name concatenated with a single space
 * between them.
 *
 * @param {string} token - Unique authenticated user token
 *
 * @returns {user: {userId: integer, name: string, email: string, numSuccessfulLogins:
 *  integer, numFailedPasswordsSinceLastLogin: integer}} - An object containing details
 *  on the admin user
 */
export function adminUserDetails(token: string): UserDetails {
  const data = getData();
  const user = getAuthUser(token, data);

  return {
    user: {
      userId: user.userId,
      name: user.nameFirst + ' ' + user.nameLast,
      email: user.userEmail,
      numSuccessfulLogins: user.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin: user.numFailedPasswordsSinceLastLogin,
    }
  };
}

/**
 * Given an admin user's authUserId and a set of properties,
 * update the properties of this logged in admin user.
 *
 * @param {string} token - Unique authenticated user token
 * @param {string} email - Admin user email
 * @param {string} nameFirst - Admin user's first name
 * @param {string} nameLast - Admin user's last name
 *
 * @returns {} - empty object
 */
export function adminUserDetailsUpdate(token: string, email: string, nameFirst: string, nameLast: string): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);

  // error checks if email is in valid format
  if (!isEmail(email)) {
    throw HTTPError(400, 'Invalid email format');
  }
  // error checks if email is used by another user
  const emailExists = data.users.find(users => users.userEmail.toLowerCase() === email.toLowerCase());
  if (emailExists && emailExists.userId !== user.userId) {
    throw HTTPError(400, 'Email is used by another user');
  }
  // error checks if name is valid
  if (!authIsValidName(nameFirst) || !authIsValidName(nameLast)) {
    throw HTTPError(400, 'Invalid first or last name');
  }

  // update user details
  user.userEmail = email;
  user.nameFirst = nameFirst;
  user.nameLast = nameLast;
  setData(data);
  return {};
}

/**
 * Given details relating to a password change, update the password of a
 * logged in user.
 *
 * @param {string} token - Unique authenticated user token
 * @param {string} oldPassword - The user's old password
 * @param {string} newPassword - The user's new password
 *
 * @returns {} - empty object
*/
export function adminUserPasswordUpdate(token: string, oldPassword: string, newPassword: string): EmptyObject {
  const data = getData();
  const user = getAuthUser(token, data);

  // Checks if the old password given is correct
  if (user.userNewPassword !== hash(oldPassword)) {
    throw HTTPError(400, 'Old password is not the correct old password');
  }

  // Checks if the old password and the new password match exactly
  if (oldPassword === newPassword) {
    throw HTTPError(400, 'Old password and new password match exactly');
  }

  // Checks if new password has already been used before by user
  if (user.userOldPasswords.includes(hash(newPassword))) {
    throw HTTPError(400, 'New password has already been used before by user');
  }

  // Checks if password is in a valid format (over 8 characters, contains at least one number and
  // letter)
  if (!authIsValidPassword(newPassword)) {
    throw HTTPError(400, 'New password is less than 8 characters or does not contain at least one number and letter');
  }

  // Updates user's old passwords array and new password
  user.userOldPasswords.push(hash(oldPassword));
  user.userNewPassword = hash(newPassword);
  setData(data);

  return {};
}
