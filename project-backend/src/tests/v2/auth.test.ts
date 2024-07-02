import {
  requestClear,
  requestAdminAuthRegister,
  requestAdminAuthLogin,
  v2requestAdminAuthLogout,
  v2requestAdminUserDetails,
  v2requestAdminUserDetailsUpdate,
  v2requestAdminUserPasswordUpdate,
} from '../../requestHelper';

import { Token } from '../../interfaces';
import HTTPError from 'http-errors';

beforeEach(() => {
  requestClear();
});

describe('POST, /v2/admin/auth/logout', () => {
  let responseRegister: Token;
  beforeEach(() => {
    responseRegister = requestAdminAuthRegister('Flynn.Rider@email.com', 'smoulder12.', 'Flynn', 'Rider');
  });

  describe('Error case', () => {
    test('empty token', () => {
      expect(() => v2requestAdminAuthLogout('')).toThrow(HTTPError[401]);
    });

    test('Invalid Token', () => {
      const userToken = responseRegister as Token;
      expect(() => v2requestAdminAuthLogout(userToken.token + 'InvalidToken')).toThrow(HTTPError[401]);
    });
  });

  describe('Success cases', () => {
    test('Logouts out the only usersession', () => {
      const userToken = responseRegister as Token;
      const responseLogout = v2requestAdminAuthLogout(userToken.token);
      expect(responseLogout).toStrictEqual({});

      expect(() => v2requestAdminUserDetails(userToken.token)).toThrow(HTTPError[401]);
    });

    test('Logouts out only one user session from same user', () => {
      // login again
      const responseLogin = requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder12.');
      const userToken1 = responseRegister as Token;
      const userToken2 = responseLogin as Token;

      // log out from first session only
      const responseLogout = v2requestAdminAuthLogout(userToken1.token);
      expect(responseLogout).toStrictEqual({});

      const responseUserDetails = v2requestAdminUserDetails(userToken2.token);
      expect(responseUserDetails).toStrictEqual(
        {
          user: {
            userId: expect.any(Number),
            name: 'Flynn Rider',
            email: 'Flynn.Rider@email.com',
            numSuccessfulLogins: 2,
            numFailedPasswordsSinceLastLogin: 0,
          }
        }
      );
    });
  });
});

describe('GET, /v2/admin/user/details', () => {
  let user1: Token;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('walter.white@gmail.com', 'WheresthemoneySkyl3r', 'Walter', 'White') as Token;
  });

  describe('Error Cases', () => {
    test('Invalid Token', () => {
      expect(() => v2requestAdminUserDetails(user1.token + 'InvalidToken')).toThrow(HTTPError[401]);
    });
  });

  describe('Success Cases', () => {
    test('Correct return object', () => {
      const response = v2requestAdminUserDetails(user1.token);
      expect(response).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: expect.any(String),
          email: expect.any(String),
          numSuccessfulLogins: expect.any(Number),
          numFailedPasswordsSinceLastLogin: expect.any(Number),
        }
      });
    });

    test('Correct return details for one user', () => {
      const response = v2requestAdminUserDetails(user1.token);
      expect(response).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'Walter White',
          email: 'walter.white@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0,
        }
      });
    });

    test('Correct return details for mulitple users', () => {
      const user2: Token = requestAdminAuthRegister('franklin.saint@email.com', 'BrIckByBr1ick', 'Franklin', 'Saint') as Token;

      const response1 = v2requestAdminUserDetails(user1.token);
      expect(response1).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'Walter White',
          email: 'walter.white@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0,
        }
      });

      const response2 = v2requestAdminUserDetails(user2.token);
      expect(response2).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'Franklin Saint',
          email: 'franklin.saint@email.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0,
        }
      });
    });
  });
});

describe('PUT, /v2/admin/user/details', () => {
  let authUser1: Token, authUser2: Token, authUser3: Token;
  beforeEach(() => {
    authUser1 = requestAdminAuthRegister('Flynn.Rider@email.com', 'smoulder12.', 'Flynn', 'Rider') as Token;
    authUser2 = requestAdminAuthRegister('Rapunzel.golden@gmail.com', 'Dreamer4ever!', 'Rapunzel', 'Disney') as Token;
    authUser3 = requestAdminAuthRegister('example@gmail.com', 'hello!!2345', 'John', 'Doe') as Token;
    requestAdminAuthRegister('elsa.queen@gmail.com', 'letItGaur*09', 'Queen', 'Elsa') as Token;
  });

  describe('Success Cases', () => {
    test('Correct Inputs', () => {
      v2requestAdminUserDetailsUpdate(authUser1.token, 'Flynn.Rider@email.com', 'Eugene', 'Fitzherbet');

      const userDets = v2requestAdminUserDetails(authUser1.token);
      const expectedUserDetails = {
        user: {
          userId: expect.any(Number),
          name: 'Eugene Fitzherbet',
          email: 'Flynn.Rider@email.com',
          numSuccessfulLogins: expect.any(Number),
          numFailedPasswordsSinceLastLogin: expect.any(Number),
        }
      };
      expect(userDets).toStrictEqual(expectedUserDetails);
    });
  });

  describe('Error Cases, expecting an error', () => {
    test('Email is currently used by another user', () => {
      expect(() => v2requestAdminUserDetailsUpdate(authUser2.token, 'Flynn.Rider@email.com', 'Rapunzel', 'Fitzherbet')).toThrow(HTTPError[400]);
    });

    test('Email does not satisfy validator', () => {
      expect(() => v2requestAdminUserDetailsUpdate(authUser2.token, 'plainaddress', 'Rapunzel', 'Disney')).toThrow(HTTPError[400]);
    });

    test('Invalid Characters in Name - emojis', () => {
      expect(() => v2requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'John', 'So😛🤥jnkjn21')).toThrow(HTTPError[400]);
      expect(() => v2requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'So😛🤥jnkjn21', 'Doe')).toThrow(HTTPError[400]);
    });

    test('Invalid Characters in Name', () => {
      expect(() => v2requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'John', 'Sorry&&Not(^sorry')).toThrow(HTTPError[400]);
      expect(() => v2requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'Sorry&&Not(^sorry', 'Doe')).toThrow(HTTPError[400]);
    });

    test('Invalid Name, less than 2 characters', () => {
      expect(() => v2requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'John', 'H')).toThrow(HTTPError[400]);
      expect(() => v2requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'H', 'Doe')).toThrow(HTTPError[400]);
    });

    test('Invalid Name, more than 20 characters', () => {
      expect(() => v2requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'John', 'testingcharacters21!!')).toThrow(HTTPError[400]);
      expect(() => v2requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'testingcharacters21!!', 'Doe')).toThrow(HTTPError[400]);
    });

    test('Invalid Token', () => {
      expect(() => v2requestAdminUserDetailsUpdate(authUser1.token + 'InvalidToken', 'Flynn.Rider@email.com', 'Eugene', 'Fitzherbet')).toThrow(HTTPError[401]);
    });
  });
});

describe('PUT, /v2/admin/user/password', () => {
  describe('Error Cases', () => {
    test('Invalid Token, Token does not exist', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password1', 'UserFirst', 'UserLast') as Token;
      expect(() => v2requestAdminUserPasswordUpdate(user.token + 'InvalidToken', 'password1', 'password2')).toThrow(HTTPError[401]);
    });

    test('Old password is not the correct old password', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password1', 'UserFirst', 'UserLast') as Token;
      expect(() => v2requestAdminUserPasswordUpdate(user.token, 'password123', 'password2')).toThrow(HTTPError[400]);
    });

    test('Old password and new password match exactly', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password1', 'UserFirst', 'UserLast') as Token;
      expect(() => v2requestAdminUserPasswordUpdate(user.token, 'password1', 'password1')).toThrow(HTTPError[400]);
    });

    test('New password has already been used before by user', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password1', 'UserFirst', 'UserLast') as Token;
      v2requestAdminUserPasswordUpdate(user.token, 'password1', 'password2');
      v2requestAdminUserPasswordUpdate(user.token, 'password2', 'password3');
      v2requestAdminUserPasswordUpdate(user.token, 'password3', 'password4');

      expect(() => v2requestAdminUserPasswordUpdate(user.token, 'password4', 'password1')).toThrow(HTTPError[400]);
      expect(() => v2requestAdminUserPasswordUpdate(user.token, 'password4', 'password2')).toThrow(HTTPError[400]);
      expect(() => v2requestAdminUserPasswordUpdate(user.token, 'password4', 'password3')).toThrow(HTTPError[400]);
    });

    test.each([
      '7charas',
      '12345678',
      'abcdefgh',
    ])('New password is less than 8 characters or does not contain at least one number and letter', (password) => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      expect(() => v2requestAdminUserPasswordUpdate(user.token, 'password123', password)).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('Correct return object, successful update', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password1', 'UserFirst', 'UserLast') as Token;
      const response = v2requestAdminUserPasswordUpdate(user.token, 'password1', 'password2');

      expect(response).toStrictEqual({});
      expect(() => requestAdminAuthLogin('user@gmail.com', 'password1')).toThrow(HTTPError[400]);
      expect(requestAdminAuthLogin('user@gmail.com', 'password2')).toStrictEqual({ token: expect.any(String) });
    });

    test.each([
      '8characs',
      'password 1234 !',
    ])('Valid password input', (password) => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const response = v2requestAdminUserPasswordUpdate(user.token, 'password123', password);

      expect(response).toStrictEqual({});
      expect(() => requestAdminAuthLogin('user@gmail.com', 'password123')).toThrow(HTTPError[400]);
      expect(requestAdminAuthLogin('user@gmail.com', password)).toStrictEqual({ token: expect.any(String) });
    });
  });
});
