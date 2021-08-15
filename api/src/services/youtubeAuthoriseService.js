const YoutubeAuthoriseService = ({ credentials, version, logger }) => {
  const fs = require('fs');
  const readline = require('readline');
  const { google } = require('googleapis');
  const OAuth2 = google.auth.OAuth2;

  const retr = {};

  const ytScopes = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly'
  ];

  retr.init = () => {
    logger.debug('YoutubeAuthoriseService:init()');
  };

  retr.createClient = ({ clientId, clientSecret, redirectUrl }) => {
    return oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
  };

  retr.authorise = ({ oauth2Client, token, checkToken }) => {
    return new Promise(async (resolve, reject) => {
      try {
        const oauth2Client = oauthClient ?? retr.createClient().oauth2Client;

        // The OAuth2 library seems to handle refreshing expired tokens automatically. It seems to only need the refresh_token string
        oauth2Client.credentials = token;

        if (!token) {
          const err = new Error('No token');
          return reject({
            caller: 'YoutubeAuthoriseService::authorise()',
            reason: 'No token',
            err: JSON.stringify(err, Object.getOwnPropertyNames(err))
          });
        }

        return resolve({ oauth2Client });
      } catch (err) {
        return reject({
          caller: 'YoutubeAuthoriseService::authorise()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  // This needs to be called if scopes change
  retr.generateNewToken = ({ oauth2Client, clientName }) => {
    return new Promise((resolve, reject) => {
      try {
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          state: `clientName=${clientName}`,
          scope: ytScopes
        });

        return resolve({ authUrl });
      } catch (err) {
        return reject({
          caller: 'YoutubeAuthoriseService::generateNewToken()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.grantNewToken = ({ oauth2Client, code }) => {
    return new Promise((resolve, reject) => {
      try {
        return oauth2Client.getToken(code, (err, token) => {
          if (err) {
            return reject({
              caller: 'YoutubeAuthoriseService::grantNewToken()',
              reason: '"err" is not null',
              type: 'raised',
              err: JSON.stringify(err, Object.getOwnPropertyNames(err))
            });
          }

          oauth2Client.credentials = token;
          return resolve({ oauth2Client, token });
        });
      } catch (err) {
        return reject({
          caller: 'YoutubeAuthoriseService::grantNewToken()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err)),
          type: 'catch'
        });
      }
    });
  };

  return retr;
}
module.exports = YoutubeAuthoriseService;
