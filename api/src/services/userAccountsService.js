const UserAccountService = ({ server, settings, httpsCredentials, version, logger }) => {
  const { authenticator, totp } = require('otplib');
  const retr = {};

  retr.checkUsernameAndPassword = ({ username, hashedPassword }) => {
    return new Promise((resolve, reject) => {
      try {
        const getEnvAdmin = require('../utils/getEnvUser');
        const envAdmin = getEnvAdmin();
        if (envAdmin.username) {
          if (
            envAdmin.username === username
            && envAdmin.hashedPassword === hashedPassword
          ) {
            envAdmin.mfaRequired = false;
            envAdmin.hashedPassword = '';
            delete envAdmin.hashedPassword;
            if (envAdmin.mfaPsk) {
              envAdmin.mfaRequired = true;
            }

            envAdmin.mfaPsk = '';
            delete envAdmin.mfaPsk;

            return resolve(envAdmin);
          }
        }


        return reject(false);
      } catch (err) {
        logger.error('UserAccountService::checkUsernameAndPassword(): Error checking login state');
        logger.error(err);
        return reject(false);
      }
    });
  };

  retr.checkTotp = ({ username, userId, enteredTopt }) => {
    return new Promise((resolve, reject) => {
      try {
        const getEnvAdmin = require('../utils/getEnvUser');
        const envAdmin = getEnvAdmin();
        if (envAdmin.username) {
          if (
            envAdmin.username === username
            && envAdmin.userId === userId
          ) {
            const isValid = totp.generate(envAdmin.mfaPsk) === enteredTopt;

            envAdmin.mfaRequired = true;
            envAdmin.mfaValidated = isValid;
            envAdmin.hashedPassword = '';
            delete envAdmin.hashedPassword;
            envAdmin.mfaPsk = '';
            delete envAdmin.mfaPsk;

            return resolve(envAdmin);
          }
        }


        return reject(false);
      } catch (err) {
        logger.error('UserAccountService::checkTotp(): OTP error');
        logger.error(err);
        return reject(false);
      }
    });
  };

  return retr;
}
module.exports = UserAccountService;
