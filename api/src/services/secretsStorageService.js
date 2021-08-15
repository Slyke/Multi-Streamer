const SecretsStorageService = ({ settings, version, logger }) => {
  const fs = require('fs');
  const path = require('path');

  const retr = {};

  retr.init = () => {
    logger.debug('SecretsStorageService:init()');
  };

  retr.storeCredentials = ({ credentials, name, userId, credentialsType }) => {
    return new Promise((resolve, reject) => {
      try {
        const userCredentialsPath = path.join(settings.paths.userTokenCredential, `user_${userId}.json`);
        if (!fs.existsSync(userCredentialsPath)) {
          fs.writeFileSync(userCredentialsPath, JSON.stringify({}));
        }

        return fs.readFile(userCredentialsPath, (err, data) => {
            const jsonCred = JSON.parse(data);

            if (!jsonCred.users) jsonCred.users = {};
            if (!jsonCred.users[userId]) jsonCred.users[userId] = {};
            if (!jsonCred.users[userId][credentialsType]) jsonCred.users[userId][credentialsType] = {};
            if (!jsonCred.users[userId][credentialsType][name]) jsonCred.users[userId][credentialsType][name] = {};

            jsonCred.users[userId][credentialsType][name].credentials = credentials;
            jsonCred.users[userId][credentialsType][name].generatedTime = Date.now();

            fs.writeFileSync(userCredentialsPath, JSON.stringify(jsonCred, null, 2));
            return resolve({ success: true });
        });
      } catch (err) {
        return reject({
          caller: 'SecretsStorageService::storeCredentials()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.retrieveCredentials = ({ name, userId, credentialsType }) => {
    return new Promise((resolve, reject) => {
      try {
        const userCredentialsPath = path.join(settings.paths.userTokenCredential, `user_${userId}.json`);
        if (!fs.existsSync(userCredentialsPath)) {
          return reject({
            caller: 'SecretsStorageService::retrieveCredentials()',
            reason: `credential file for user ${userId} doesn't exist`,
            promise: 'raised',
            err: JSON.stringify(err, Object.getOwnPropertyNames(err))
          });
        }

        return fs.readFile(userCredentialsPath, (err, data) => {
            const jsonCred = JSON.parse(data);
            const credentials = jsonCred?.users?.[userId]?.[credentialsType]?.[name];

            if (credentials) {
              return resolve({ credentials, success: true });
            }

            return reject({ success: false, reason: 'Not found' });
        });
      } catch (err) {
        return reject({
          caller: 'SecretsStorageService::retrieveCredentials()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.storeToken = ({ token, name, userId, tokenType }) => {
    return new Promise((resolve, reject) => {
      try {
        const userCredentialsPath = path.join(settings.paths.userTokenCredential, `user_${userId}.json`);
        if (!fs.existsSync(userCredentialsPath)) {
          fs.writeFile(userCredentialsPath, JSON.stringify({}));
        }

        return fs.readFile(userCredentialsPath, (err, data) => {
            const jsonCred = JSON.parse(data);

            if (!jsonCred.users) jsonCred.users = {};
            if (!jsonCred.users[userId]) jsonCred.users[userId] = {};
            if (!jsonCred.users[userId][tokenType]) jsonCred.users[userId][tokenType] = {};
            if (!jsonCred.users[userId][tokenType][name]) jsonCred.users[userId][tokenType][name] = {};

            jsonCred.users[userId][tokenType][name].token = token;
            jsonCred.users[userId][tokenType][name].generatedTime = Date.now();

            fs.writeFileSync(userCredentialsPath, JSON.stringify(jsonCred));
            return resolve({ success: true });
        });
      } catch (err) {
        return reject({
          caller: 'SecretsStorageService::storeToken()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  return retr;
}
module.exports = SecretsStorageService;
