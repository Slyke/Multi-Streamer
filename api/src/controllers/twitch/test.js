// https://github.com/twitchdev/authentication-node-sample/blob/main/index.js
const clientId = 'd1jbeaau29luc8eyblqhkoi4qhvyfk';
const clientSecret = 'qf02yef4cau21bwa9sqk3aupbyl0a5';

const passport       = require("passport");
const twitchStrategy = require("passport-twitch").Strategy;
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

const main = async () => {
  console.log('a')
  passport.initialize();
  // passport.session();
  passport.use('twitch', new OAuth2Strategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: "http://127.0.0.1:3000/auth/twitch/callback",
    scope: "user_read",
    state: true
  },
  (accessToken, refreshToken, profile, done) => {
    console.log(1111, {
      accessToken,
      refreshToken,
      profile
    })
      
    return done(null, profile);
  }));
  console.log('z')
  await passport.authenticate('twitch', { scope: 'user_read' });
  await passport.authenticate('twitch', { successRedirect: '/', failureRedirect: '/' });
};

main();