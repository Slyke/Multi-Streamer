const registerDebugRoutes = ({ server, settings, httpsCredentials, version, logger } = {}) => {
  server.post('/debug/signjwt', (req, res, next) => {
    const jwtUtils = require('../utils/jwt');
    const data = req.body['dataToSign'];

    return res.send({
      signedJwt: jwtUtils.signJwt({ data, httpsCredentials, logger })
    });
  });

  server.get('/debug/generateotppsk', (req, res, next) => {
    const { authenticator } = require('otplib');
    authenticator.options = { algorithm: 'sha512' }; // sha1, sha256, sha512
    const psk = authenticator.generateSecret();

    return res.send({
      generatedOtpPsk: psk
    });
  });

  server.post('/debug/generateotp', (req, res, next) => {
    const { totp } = require('otplib');
    const toptPsk = req.body['psk'];
    totp.options = { algorithm: 'sha512' }; // sha1, sha256, sha512
    const token = totp.generate(toptPsk);

    return res.send({
      generatedOtp: token
    });
  });
};

module.exports = registerDebugRoutes;
