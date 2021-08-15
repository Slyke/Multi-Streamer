const TwitchAuthoriseService = ({ credentials, version, logger }) => {
  const fs = require('fs');
  const readline = require('readline');
  const passport = require("passport");
  const twitchStrategy = require("passport-twitch").Strategy;

  const retr = {};

  const tScopes = [
    'channel:manage:broadcast',
    'bits:read',
    'channel:read:stream_key'
  ].join(' ');

  retr.init = () => {
    logger.debug('TwitchAuthoriseService:init()');

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
            caller: 'TwitchAuthoriseService::authorise()',
            reason: 'No token',
            err: JSON.stringify(err, Object.getOwnPropertyNames(err))
          });
        }

        return resolve({ oauth2Client });
      } catch (err) {
        return reject({
          caller: 'TwitchAuthoriseService::authorise()',
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
          scope: tScopes
        });

        return resolve({ authUrl });
      } catch (err) {
        return reject({
          caller: 'TwitchAuthoriseService::generateNewToken()',
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
            caller: 'TwitchAuthoriseService::cliEnterGrantCode()',
            reason: 'No code entered',
            promise: 'reject',
            err: JSON.stringify(err, Object.getOwnPropertyNames(err))
          });
        });
      } catch (err) {
        return reject({
          caller: 'TwitchAuthoriseService::cliEnterGrantCode()',
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
              caller: 'TwitchAuthoriseService::grantNewToken()',
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
          caller: 'TwitchAuthoriseService::grantNewToken()',
          err: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
      }
    });
  };

  return retr;
}
module.exports = TwitchAuthoriseService;
