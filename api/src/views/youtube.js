const YoutubeView = ({ server, settings, httpsCredentials, version, logger } = {}) => {
  const YoutubeAuthorise = require('../controllers/youtubeAuthorise');
  const retr = {};

  const youtubeAuthorise = YoutubeAuthorise({ server, settings, httpsCredentials, version, logger });

  retr.init = () => {
    youtubeAuthorise.init();
  };

  retr.checkToken = (req, res, next) => {
    const clientName = req.body['clientName'] || 'default';

    youtubeAuthorise.requestAuthToken({ clientSecret, clientId, redirectUrl, clientName, userId }).then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send(err);
    });
  };

  retr.requestAuthToken = (req, res, next) => {
    const clientSecret = req.body['clientSecret'];
    const clientId = req.body['clientId'];
    const clientName = req.body['clientName'] || 'default';
    const userId = req.jwtDecode.userId;
    const redirectUrl = `http://${req.headers.host}/youtube/grant-auth-token`;

    youtubeAuthorise.requestAuthToken({ clientSecret, clientId, redirectUrl, clientName, userId }).then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send(err);
    });
  };

  retr.grantAuthToken = (req, res, next) => {
    const code = req.query['code'] || req.body['code'];
    const clientName = req.query['clientName'] || req.body['clientName'] || 'default';
    const scope = req.query['scope'] || req.body['scope'] || 'default';
    const userId = req.jwtDecode.userId;
    const redirectUrl = `${req.headers.host}/youtube/grant-auth-token`;

    youtubeAuthorise.grantAuthToken({ code, scope, clientName, userId, redirectUrl }).then((result) => {
      return res.send(result);
    }).catch((err) => {
      logger.error(err);
      return res.status(500).send(err);
    });
  };

  return retr;
};

module.exports = YoutubeView;
