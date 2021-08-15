const registerLoginRoutes = ({ server, settings, httpsCredentials, version, logger } = {}) => {
  const LoginView = require('../views/login');

  const loginView = LoginView({ server, settings, httpsCredentials, version, logger });

  loginView.init();

  server.post('/login/auth', (req, res, next) => {
    loginView.login(req, res, next);
  });

  server.post('/login/logout', (req, res, next) => {
    loginView.logout(req, res, next);
  });

  server.post('/login/mfa', (req, res, next) => {
    loginView.mfa(req, res, next);
  });
};

module.exports = registerLoginRoutes;
