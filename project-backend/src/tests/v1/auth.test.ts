import {
  requestClear,
  requestAdminAuthRegister,
  requestAdminAuthLogin,
  requestAdminAuthLogout,
  requestAdminUserDetails,
  requestAdminUserDetailsUpdate,
  requestAdminUserPasswordUpdate,
} from '../../requestHelper';

import { Token } from '../../interfaces';
import HTTPError from 'http-errors';

beforeEach(() => {
  requestClear();
});

describe('POST, /v1/admin/auth/register', () => {
  describe('Error cases, expecting an error', () => {
    test('Email is used by another user', () => {
      const response = requestAdminAuthRegister('franklin@saint.com', 'brickBybrick1', 'Franklin', 'Saint');
      expect(response).toStrictEqual({ token: expect.any(String) });

      expect(() => requestAdminAuthRegister('franklin@saint.com', 'helohelo1', 'Hamish', 'Mclean')).toThrow(HTTPError[400]);
    });

    test('Invalid email address', () => {
      expect(() => requestAdminAuthRegister('Joe Smith <email@example.com>', 'brickBybrick1', 'Franklin', 'Saint')).toThrow(HTTPError[400]);
    });

    test('Invalid name, contains strange characters', () => {
      expect(() => requestAdminAuthRegister('hamish@email.com', 'brickBybrick1', 'So😛🤥jnk$$jn21', 'Saint')).toThrow(HTTPError[400]);
      expect(() => requestAdminAuthRegister('hamish@email.com', 'brickBybrick1', 'Franklin', 'So😛🤥jnk$$jn21')).toThrow(HTTPError[400]);
    });

    test.each([
      'H',
      "--' --Heyo12345hiii",
    ])('Invalid Name, Longer than 20 or shorter than 2 chars', (name) => {
      expect(() => requestAdminAuthRegister('hamish@email.com', 'brickBybrick1', name, 'Saint')).toThrow(HTTPError[400]);
      expect(() => requestAdminAuthRegister('hamish@email.com', 'brickBybrick1', 'Franklin', name)).toThrow(HTTPError[400]);
    });

    test.each([
      'Heyo123',
      'iamscared',
      '123456789',
    ])('Invalid Password, less than 8 characters or does not contain 1 letter and 1 number', (password) => {
      expect(() => requestAdminAuthRegister('hamish@email.com', password, 'Franklin', 'Saint')).toThrow(HTTPError[400]);
    });
  });

  describe('Success cases', () => {
    test('Correct return object', () => {
      const response = requestAdminAuthRegister('franklin@saint.com', 'brickBybrick1', 'Franklin', 'Saint');
      expect(response).toStrictEqual({ token: expect.any(String) });
    });

    test('Valid Email address', () => {
      const response = requestAdminAuthRegister('email@example.com', 'brickBybrick1', 'Franklin', 'Saint');
      expect(response).toStrictEqual({ token: expect.any(String) });
    });

    test('Unique user ID', () => {
      const response1 = requestAdminAuthRegister('franklin@saint.com', 'brickBybrick1', 'Franklin', 'Saint');
      const response2 = requestAdminAuthRegister('franklin1@saint.com', 'helohelo1', 'Hamish', 'Mclean');
      const response3 = requestAdminAuthRegister('franklin2@saint.com', 'helohelo1', 'Dexter', 'Morgan');

      expect(response1).not.toStrictEqual(response2);
      expect(response2).not.toStrictEqual(response3);
      expect(response1).not.toStrictEqual(response3);
    });

    test.each([
      'Ha',
      'Hello',
      'MichealMichealMichea'
    ])('Valid Name, 2 <= length <= 20', (name) => {
      const response1 = requestAdminAuthRegister('hamish@email.com', 'brickBybrick1', name, 'Saint');
      const response2 = requestAdminAuthRegister('hamish2@email.com', 'brickBybrick12', 'Franklin', name);

      expect(response1).toStrictEqual({ token: expect.any(String) });
      expect(response2).toStrictEqual({ token: expect.any(String) });
    });

    test.each([
      'Hamish--haha',
      "heyyooo'ss",
    ])('Valid Name, Contains valid characters', (name) => {
      const response1 = requestAdminAuthRegister('hamish@email.com', 'brickBybrick1', name, 'Saint');
      const response2 = requestAdminAuthRegister('hamish2@email.com', 'brickBybrick12', 'Franklin', name);

      expect(response1).toStrictEqual({ token: expect.any(String) });
      expect(response2).toStrictEqual({ token: expect.any(String) });
    });

    test.each([
      'Sec12pas',
      'Password12has*%$weirdchars1',
      'passwordhas12🤣🥩EEmoji'
    ])('Valid Password, more than or equal to 8 characters and contains 1 letter and 1 number ', (password) => {
      const response = requestAdminAuthRegister('hamish@email.com', password, 'Franklin', 'Saint');
      expect(response).toStrictEqual({ token: expect.any(String) });
    });
  });
});

describe('POST, /v1/admin/auth/login', () => {
  // register users before each test
  let authUser1: Token;
  beforeEach(() => {
    authUser1 = requestAdminAuthRegister('Flynn.Rider@email.com', 'smoulder12.', 'Flynn', 'Rider') as Token;
    requestAdminAuthRegister('Rapunzel.golden@gmail.com', 'Dreamer4ever!', 'Rapunzel', 'Disney');
    requestAdminAuthRegister('example@gmail.com', 'hello!!2345', 'John', 'Doe');
  });

  describe('Success Cases', () => {
    test('Correct Inputs', () => {
      expect(requestAdminAuthLogin('example@gmail.com', 'hello!!2345')).toStrictEqual({ token: expect.any(String) });
    });

    test('Case Sensitivity in Valid Email inputs', () => {
      expect(requestAdminAuthLogin('FLYNN.RIDER@email.com', 'smoulder12.')).toStrictEqual({ token: expect.any(String) });
    });
  });

  describe('Error Cases, expecting an error', () => {
    test('Valid Email and Invalid Password', () => {
      expect(() => requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder12')).toThrow(HTTPError[400]);
    });

    test('Invalid Email and Valid Password', () => {
      expect(() => requestAdminAuthLogin(' Rapunzel.golden@gmail.com', 'Dreamer4ever!')).toThrow(HTTPError[400]);
    });

    test('Mix and Match User Emails and Passwords', () => {
      expect(() => requestAdminAuthLogin('example@gmail.com', 'Dreamer4ever!')).toThrow(HTTPError[400]);
    });
  });

  describe('Checking for Updated Properties', () => {
    test('Correctly obtains numFailedPasswords', () => {
      expect(() => requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder12')).toThrow(HTTPError[400]);
      expect(() => requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder2.')).toThrow(HTTPError[400]);
      expect(() => requestAdminAuthLogin('Flynn.Rider@email.com', 'smouder12.')).toThrow(HTTPError[400]);
      expect(() => requestAdminAuthLogin('Flynn.Rider@email.com', 'moulder12.')).toThrow(HTTPError[400]);

      const userDets = requestAdminUserDetails(authUser1.token);
      const expectedUserDetails = {
        user: {
          userId: expect.any(Number),
          name: 'Flynn Rider',
          email: 'Flynn.Rider@email.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 4,
        }
      };
      expect(userDets).toStrictEqual(expectedUserDetails);
    });

    test('Correctly obtains reset numFailedPasswords', () => {
      // failed logins
      expect(() => requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder12')).toThrow(HTTPError[400]);
      expect(() => requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder2.')).toThrow(HTTPError[400]);
      expect(() => requestAdminAuthLogin('Flynn.Rider@email.com', 'smouder12.')).toThrow(HTTPError[400]);
      expect(() => requestAdminAuthLogin('Flynn.Rider@email.com', 'moulder12.')).toThrow(HTTPError[400]);
      // successfull login
      requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder12.');

      const userDets = requestAdminUserDetails(authUser1.token);
      const expectedUserDetails = {
        user: {
          userId: expect.any(Number),
          name: 'Flynn Rider',
          email: 'Flynn.Rider@email.com',
          numSuccessfulLogins: 2,
          numFailedPasswordsSinceLastLogin: 0,
        }
      };
      expect(userDets).toStrictEqual(expectedUserDetails);
    });

    test('Correcly obtains updated numSuccessful Logins', () => {
      requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder12.');
      requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder12.');

      const userDets = requestAdminUserDetails(authUser1.token);
      const expectedUserDetails = {
        user: {
          userId: expect.any(Number),
          name: 'Flynn Rider',
          email: 'Flynn.Rider@email.com',
          numSuccessfulLogins: 3,
          numFailedPasswordsSinceLastLogin: 0,
        }
      };
      expect(userDets).toStrictEqual(expectedUserDetails);
    });
  });
});

describe('POST, /v1/admin/auth/logout', () => {
  let responseRegister: Token;
  beforeEach(() => {
    responseRegister = requestAdminAuthRegister('Flynn.Rider@email.com', 'smoulder12.', 'Flynn', 'Rider');
  });

  describe('Success cases', () => {
    test('Logouts out the only usersession', () => {
      const userToken = responseRegister as Token;
      const responseLogout = requestAdminAuthLogout(userToken.token);
      expect(responseLogout).toStrictEqual({});

      expect(() => requestAdminUserDetails(userToken.token)).toThrow(HTTPError[401]);
    });

    test('Logouts out only one user session from same user', () => {
      // login again
      const responseLogin = requestAdminAuthLogin('Flynn.Rider@email.com', 'smoulder12.');
      const userToken1 = responseRegister as Token;
      const userToken2 = responseLogin as Token;

      // log out from first session only
      const responseLogout = requestAdminAuthLogout(userToken1.token);
      expect(responseLogout).toStrictEqual({});

      const responseUserDetails = requestAdminUserDetails(userToken2.token);
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

describe('GET, /v1/admin/user/details', () => {
  let user1: Token;
  beforeEach(() => {
    user1 = requestAdminAuthRegister('walter.white@gmail.com', 'WheresthemoneySkyl3r', 'Walter', 'White') as Token;
  });

  describe('Success Cases', () => {
    test('Correct return object', () => {
      const response = requestAdminUserDetails(user1.token);
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
      const response = requestAdminUserDetails(user1.token);
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

      const response1 = requestAdminUserDetails(user1.token);
      expect(response1).toStrictEqual({
        user: {
          userId: expect.any(Number),
          name: 'Walter White',
          email: 'walter.white@gmail.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0,
        }
      });

      const response2 = requestAdminUserDetails(user2.token);
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

describe('PUT, /v1/admin/user/details', () => {
  let authUser1: Token, authUser2: Token, authUser3: Token;
  beforeEach(() => {
    authUser1 = requestAdminAuthRegister('Flynn.Rider@email.com', 'smoulder12.', 'Flynn', 'Rider') as Token;
    authUser2 = requestAdminAuthRegister('Rapunzel.golden@gmail.com', 'Dreamer4ever!', 'Rapunzel', 'Disney') as Token;
    authUser3 = requestAdminAuthRegister('example@gmail.com', 'hello!!2345', 'John', 'Doe') as Token;
    requestAdminAuthRegister('elsa.queen@gmail.com', 'letItGaur*09', 'Queen', 'Elsa') as Token;
  });

  describe('Success Cases', () => {
    test('Correct Inputs', () => {
      requestAdminUserDetailsUpdate(authUser1.token, 'Flynn.Rider@email.com', 'Eugene', 'Fitzherbet');

      const userDets = requestAdminUserDetails(authUser1.token);
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
      expect(() => requestAdminUserDetailsUpdate(authUser2.token, 'Flynn.Rider@email.com', 'Rapunzel', 'Fitzherbet')).toThrow(HTTPError[400]);
    });

    test('Email does not satisfy validator', () => {
      expect(() => requestAdminUserDetailsUpdate(authUser2.token, 'plainaddress', 'Rapunzel', 'Disney')).toThrow(HTTPError[400]);
    });

    test('Invalid Characters in Name - emojis', () => {
      expect(() => requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'John', 'So😛🤥jnkjn21')).toThrow(HTTPError[400]);
      expect(() => requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'So😛🤥jnkjn21', 'Doe')).toThrow(HTTPError[400]);
    });

    test('Invalid Characters in Name', () => {
      expect(() => requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'John', 'Sorry&&Not(^sorry')).toThrow(HTTPError[400]);
      expect(() => requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'Sorry&&Not(^sorry', 'Doe')).toThrow(HTTPError[400]);
    });

    test('Invalid Name, less than 2 characters', () => {
      expect(() => requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'John', 'H')).toThrow(HTTPError[400]);
      expect(() => requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'H', 'Doe')).toThrow(HTTPError[400]);
    });

    test('Invalid Name, more than 20 characters', () => {
      expect(() => requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'John', 'testingcharacters21!!')).toThrow(HTTPError[400]);
      expect(() => requestAdminUserDetailsUpdate(authUser3.token, 'example@gmail.com', 'testingcharacters21!!', 'Doe')).toThrow(HTTPError[400]);
    });
  });
});

describe('PUT, /v1/admin/user/password', () => {
  describe('Error Cases', () => {
    test('Old password is not the correct old password', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password1', 'UserFirst', 'UserLast') as Token;
      expect(() => requestAdminUserPasswordUpdate(user.token, 'password123', 'password2')).toThrow(HTTPError[400]);
    });

    test('Old password and new password match exactly', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password1', 'UserFirst', 'UserLast') as Token;
      expect(() => requestAdminUserPasswordUpdate(user.token, 'password1', 'password1')).toThrow(HTTPError[400]);
    });

    test('New password has already been used before by user', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password1', 'UserFirst', 'UserLast') as Token;
      requestAdminUserPasswordUpdate(user.token, 'password1', 'password2');
      expect(() => requestAdminUserPasswordUpdate(user.token, 'password2', 'password1')).toThrow(HTTPError[400]);
    });

    test('New password is less than 8 characters or does not contain at least one number and letter', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      expect(() => requestAdminUserPasswordUpdate(user.token, 'password123', 'invalid')).toThrow(HTTPError[400]);
    });
  });

  describe('Success Cases', () => {
    test('Valid password input, correct return object', () => {
      const user: Token = requestAdminAuthRegister('user@gmail.com', 'password123', 'UserFirst', 'UserLast') as Token;
      const response = requestAdminUserPasswordUpdate(user.token, 'password123', 'password1');
      expect(response).toStrictEqual({});
    });
  });
});
