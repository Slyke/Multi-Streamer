const HealthController = ({ server, settings, httpsCredentials, version, logger }) => {
  const retr = {};

  const jwtUtils = require('../utils/jwt');
  const authCheck = require('../middlewares/authenticated_check');

  retr.init = () => {
    logger.debug('HealthController:init()');
  };

  retr.healthCheck = ({ userToken }) => {
    const baseHealthResults = {
      server: "online",
      api: true,
      jwtValid: jwtUtils.validateJwt({ givenJwt: userToken, httpsCredentials, logger }),
      authenticated: authCheck({ userToken, httpsCredentials, logger }),
      credentials: {
        cert: httpsCredentials.cert,
        ca: httpsCredentials.ca
      },
      version
    };

    return new Promise((resolveHealth, rejectHealth) => {
      logger.log('HealthController:healthCheck()');
      return resolveHealth(baseHealthResults);
    });
  };

  retr.healthCheckNoLog = ({ userToken }) => {
    const baseHealthResults = {
      server: "online",
      api: true,
      authenticated: jwtUtils.validateJwt({ givenJwt: userToken, httpsCredentials, logger }),
      credentials: {
        cert: httpsCredentials.certificate,
        ca: httpsCredentials.ca
      },
      version
    };

    return new Promise((resolveHealth, rejectHealth) => {
      return resolveHealth(baseHealthResults);
    });
  };

  return retr;
}
module.exports = HealthController;
