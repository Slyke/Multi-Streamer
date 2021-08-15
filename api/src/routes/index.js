const registerRouteHooks = ({ server, settings, httpsCredentials, version, logger } = {}) => {
  const healthRoutes = require('./health');
  healthRoutes({ server, settings, httpsCredentials, version, logger });

  const loginRoutes = require('./login');
  loginRoutes({ server, settings, httpsCredentials, version, logger });

  const youtubeRoutes = require('./youtube');
  youtubeRoutes({ server, settings, httpsCredentials, version, logger });

  const debugRoutes = require('./debug');
  debugRoutes({ server, settings, httpsCredentials, version, logger });

};

module.exports = registerRouteHooks;