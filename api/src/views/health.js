const HealthView = ({ server, settings, httpsCredentials, version, logger } = {}) => {
  const HealthController = require('../controllers/health');
  const retr = {};

  const healthController = HealthController({ server, settings, httpsCredentials, version, logger });

  retr.init = () => {
    healthController.init();
  };

  retr.health = (req, res, next) => {
    const userToken = req.cookies['auth_token'] || req.headers['auth_token'];
    healthController.healthCheck({ userToken }).then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send(result);
    });
  };

  retr.healthCheckNoLog = (req, res, next) => {
    const userToken = req.cookies['auth_token'] || req.headers['auth_token'];
    healthController.healthCheckNoLog({ userToken }).then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send(result);
    });
  };

  return retr;
};

module.exports = HealthView;
