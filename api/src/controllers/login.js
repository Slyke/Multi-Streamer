const LoginController = ({ server, settings, httpsCredentials, version, logger }) => {
  const retr = {};

  const jwtUtils = require('../utils/jwt');
  const authCheck = require('../middlewares/authenticated_check');
  const UserAccountsService = require('../services/userAccountsService');

  const userAccountsService = UserAccountsService({ server, settings, version, logger });

  retr.init = () => {
    logger.debug('LoginController:init()');
  };

  retr.login = ({ username, hashedPassword }) => {
    return new Promise((resolve, reject) => {
      try {
        return userAccountsService.checkUsernameAndPassword({ username, hashedPassword }).then((user) => {
          if (user.userId > 0) {
            const signedUserData = jwtUtils.signJwt({ data: user, httpsCredentials, logger });
            return resolve({
              token: signedUserData,
              mfaValidated: user.mfaRequired ? false : null,
              ...user
            });
          }
          return reject({
            caller: 'LoginController::login()',
            reason: 'Bad user',
            errorStack: err,
            type: 'raised'
          });
        }).catch((err) => {
          return reject({
            caller: 'LoginController::login()',
            reason: 'Auth failed',
            errorStack: err,
            type: 'reject'
          });
        });
      } catch (err) {
        logger.error('LoginController::login(): Error');
        logger.error(err);
        return reject({
          caller: 'LoginController::login()',
          reason: 'LoginController::login(): Error',
          errorStack: err,
          type: 'catch'
        });
      }
    });
  };

  retr.mfa = ({ userToken, totp }) => {
    return new Promise((resolve, reject) => {
      try {
        if (!userToken || !totp) {
          return reject({
            caller: 'LoginController::mfa()',
            reason: 'Missing params',
            type: 'raised'
          });
        }
        const decodedJwt = jwtUtils.validateJwt({ givenJwt: userToken, httpsCredentials, logger });
        if (decodedJwt.userId > 0 && decodedJwt?.username?.length > 2) {
          return userAccountsService.checkTotp({ username: decodedJwt?.username, userId: decodedJwt?.userId, enteredTopt: totp }).then((otpResult) => {
            if (otpResult.mfaValidated) {
              const signedOtpData = jwtUtils.signJwt({ data: otpResult, httpsCredentials, logger });
              return resolve({
                token: signedOtpData,
                ...otpResult
              });
            }
            return reject({
              caller: 'LoginController::mfa()',
              reason: 'Invalid OTP',
              type: 'raised'
            });
          }).catch((err) => {
            return reject({
              caller: 'LoginController::mfa()',
              reason: 'OTP failed',
              errorStack: err,
              type: 'reject'
            });
          });
        }

        return reject({
          caller: 'LoginController::mfa()',
          reason: 'Invalid account',
          type: 'raised'
        });
      } catch (err) {
        logger.error('LoginController::mfa(): Error');
        logger.error(err);
        return reject({
          caller: 'LoginController::mfa()',
          reason: 'LoginController::mfa(): Error',
          errorStack: err,
          type: 'catch'
        });
      }
    });
  };

  return retr;
}
module.exports = LoginController;
