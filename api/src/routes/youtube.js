const registerYoutubeRoutes = ({ server, settings, httpsCredentials, version, logger } = {}) => {
  const AuthGate = require('../middlewares/authenticated_gate');
  const authGate = AuthGate({ server, httpsCredentials, logger });
  const YoutubeView = require('../views/youtube');

  const youtubeView = YoutubeView({ server, settings, httpsCredentials, version, logger });

  youtubeView.init();

  server.get('/youtube/check-token', authGate, (req, res, next) => {
    youtubeView.checkToken(req, res, next);
  });

  server.post('/youtube/request-auth-token', authGate, (req, res, next) => {
    youtubeView.requestAuthToken(req, res, next);
  });

  server.post('/youtube/grant-auth-token', authGate, (req, res, next) => {
    youtubeView.grantAuthToken(req, res, next);
  });

  server.get('/youtube/grant-auth-token', authGate, (req, res, next) => {
    youtubeView.grantAuthToken(req, res, next);
  });
};

module.exports = registerYoutubeRoutes;
