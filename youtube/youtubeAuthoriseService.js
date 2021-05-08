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

    if (!credentials) {
      throw new Error('No credentials provided');
    }

    return {
      authorise: retr.authorise,
      generateNewToken: retr.generateNewToken,
      cliEnterGrantCode: retr.cliEnterGrantCode,
      grantNewToken: retr.grantNewToken
    };
  };

  retr.createClient = () => {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    return { oauth2Client };
  };

  retr.authorise = ({ oauthClient, token, checkToken }) => {
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
  retr.generateNewToken = (oauth2Client) => {
    return new Promise((resolve, reject) => {
      try {
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
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

  retr.cliEnterGrantCode = () => {
    return new Promise((resolve, reject) => {
      try {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question('Enter code from webpage: ', (code) => {
          rl.close();
          if (code) {
            return resolve({ code });
          }
          const err = new Error('No code entered');
          return reject({
            caller: 'YoutubeAuthoriseService::cliEnterGrantCode()',
            reason: 'No code entered',
            promise: 'reject',
            err: JSON.stringify(err, Object.getOwnPropertyNames(err))
          });
        });
      } catch (err) {
        return reject({
          caller: 'YoutubeAuthoriseService::cliEnterGrantCode()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  retr.grantNewToken = ({ oauthClient, code }) => {
    return new Promise((resolve, reject) => {
      try {
        return oauthClient.getToken(code, (err, token) => {
          if (err) {
            return reject({
              caller: 'YoutubeAuthoriseService::grantNewToken()',
              reason: '"err" is not null',
              promise: 'reject',
              err: JSON.stringify(err, Object.getOwnPropertyNames(err))
            });
          }

          oauthClient.credentials = token;
          return resolve({ oauth2Client: oauthClient, token });
        });
      } catch (err) {
        return reject({
          caller: 'YoutubeAuthoriseService::grantNewToken()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  return retr;
}
module.exports = YoutubeAuthoriseService;
