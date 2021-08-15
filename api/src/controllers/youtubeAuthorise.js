const fs = require('fs');

const YoutubeAuthoriseController = ({ server, settings, httpsCredentials, version, logger }) => {
  const retr = {};

  const YoutubeAuthoriseService = require('../services/youtubeAuthoriseService');
  const SecretsStorageService = require('../services/secretsStorageService');

  const youtubeAuthoriseService = YoutubeAuthoriseService({ server, settings, version, logger });
  const secretsStorageService = SecretsStorageService({ server, settings, version, logger });

  const pendingGrants = {};

  retr.init = () => {
    logger.debug('YoutubeAuthorise:init()');
  };

  retr.authorise = ({ oauthClient, token, checkToken }) => {

  };
// let oauth2Client = null; // TODO: FIX
  retr.requestAuthToken = ({ clientSecret, clientId, redirectUrl, clientName, userId }) => {
    return new Promise((resolve, reject) => {
      try {
        const oauth2Client = youtubeAuthoriseService.createClient({ clientId, clientSecret, redirectUrl });
        console.log(3333, JSON.stringify(oauth2Client, null, 2))
        // oauth2Client = youtubeAuthoriseService.createClient({ clientId, clientSecret, redirectUrl });
        const generatedClientPromise = youtubeAuthoriseService.generateNewToken({ oauth2Client, clientName });

        const credentials = {
          clientId,
          clientSecret
        }

        return generatedClientPromise.then((generatedClient) => {
          return secretsStorageService.storeCredentials({ credentials, name: clientName, userId, credentialsType: 'youtube' }).then((stored) => {
            return resolve({ generatedClient, secretsSaved: stored });
          }).catch((storageFailed) => {
            return resolve({ generatedClient, storageFailed, secretsSaved: false });
          });
        }).catch((err) => {
          return reject({
            caller: 'YoutubeAuthoriseController::requestAuthToken()',
            reason: 'Bad generate',
            errorStack: err,
            type: 'reject'
          });
        });
      } catch (err) {
        return reject({
          caller: 'YoutubeAuthoriseController::requestAuthToken()',
          reason: 'Unhandled',
          errorStack: err,
          type: 'catch'
        });
      }
    });
  };

  retr.grantAuthToken = ({ code, scope, clientName, userId, redirectUrl }) => {
    return new Promise((resolve, reject) => {
      try {
        return secretsStorageService.retrieveCredentials({ name: clientName, userId, credentialsType: 'youtube' }).then((creds) => {
          const credentials = creds.credentials.credentials;
          const oauth2Client2 = youtubeAuthoriseService.createClient({ clientId: credentials.clientId, clientSecret: credentials.clientSecret, redirectUrl });
          console.log(1111, oauth2Client)
          console.log(2222, oauth2Client2)
          return youtubeAuthoriseService.grantNewToken({ oauth2Client, code }).then((grantedDetails) => {
            return secretsStorageService.storeToken({
              token: grantedDetails.token,
              name: clientName,
              userId,
              tokenType: 'youtube'
            }).then((res) => {
              return resolve({
                granted: true,
                tokenSaved: grantedDetails.token ? true : false
              });
            }).catch((err) => {
              return resolve({
                errorStack: err,
                tokenSaved: false,
                granted: true,
                ...grantedDetails
              });
            });
          }).catch((err) => {
            return reject({
              caller: 'YoutubeAuthoriseController::grantAuthToken()',
              reason: `Failed to grant token for clientName: '${clientName}'`,
              errorStack: err,
              type: 'reject'
            });
          });
        }).catch((err) => {
          return reject({
            caller: 'YoutubeAuthoriseController::grantAuthToken()',
            reason: `Credentials not found for clientName: '${clientName}'`,
            errorStack: err,
            type: 'reject'
          });
        });
      } catch (err) {
        return reject({
          caller: 'YoutubeAuthoriseController::grantAuthToken()',
          reason: 'Unhandled',
          errorStack: err,
          type: 'catch'
        });
      }
    });
  };

  return retr;
}
module.exports = YoutubeAuthoriseController;
