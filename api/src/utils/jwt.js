const jwt = require('jsonwebtoken');

const validateJwt = ({ givenJwt, httpsCredentials, logger }) => {
  try {
    const decoded = jwt.verify(givenJwt, httpsCredentials.cert, { algorithm: 'RS256' });
    return decoded;
  } catch(err) {
    console.debug(err);
    return false;
  }
};

const signJwt = ({ data, httpsCredentials, expiresIn = 3600, logger }) => {
  try {
    const wasSigned = jwt.sign(data, httpsCredentials.key, { expiresIn, algorithm: 'RS256' });
    return wasSigned;
  } catch(err) {
    logger.error('signJwt: Error');
    logger.error(err);
    return false
  }
};

module.exports = {
  validateJwt,
  signJwt
};
