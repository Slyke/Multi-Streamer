const validateJwtGate = ({ server, httpsCredentials, logger } = {}) => {
  const jwt = require('jsonwebtoken');
  return (req, res, next) => {
    req.jwtAuthenticated = false;
    const userToken = req.cookies['auth_token'] || req.headers['auth_token'];
    let decoded = {};
    try {
      decoded = jwt.verify(userToken, httpsCredentials.cert);
    } catch (err) {
      return res.status(401).send({
        caller: 'validateJwtGate()',
        reason: 'Invalid token',
        type: 'catch'
      });
    }
    try {
      if (decoded.userId > 0 && decoded?.username?.length > 2) {
        if (decoded.mfaRequired && !decoded.mfaValidated) {
          req.jwtAuthenticated = false;
          return res.status(401).send({
            caller: 'validateJwtGate()',
            reason: 'Malformed token',
            type: 'raised'
          });
        } else {
          req.jwtAuthenticated = true;
          req.jwtDecode = decoded;
        }
      }
      next();
    } catch (err) {
      logger.error(err);
      return res.status(500).send({
        caller: 'validateJwtGate()',
        reason: 'Server error',
        errorStack: err,
        type: 'catch'
      });
    }
  };
};

module.exports = validateJwtGate;
