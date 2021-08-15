const LoginView = ({ server, settings, httpsCredentials, version, logger } = {}) => {
  const crypto = require('crypto');
  const LoginController = require('../controllers/login');
  const retr = {};

  const loginController = LoginController({ server, settings, httpsCredentials, version, logger });

  retr.init = () => {
    loginController.init();
  };

  retr.login = (req, res, next) => {
    const username = req.body['username'];
    if (req?.body['password']?.length !== 64) {
      return res.status(400).send({
        Error: 'Bad Passowrd.',
        Reason: 'Password must be a SHA256 hash, 64 characters long.'
      });
    }

    // Passwords are double hashed before checked or compared. The first hash happens client side.
    const hashedPassword = crypto.createHash('sha256').update(req.body['password']).digest('hex');
    req.body['password'] = '';

    loginController.login({ username, hashedPassword }).then((result) => {
      res.cookie('auth_token', result.token, {
        secure: process.env.NODE_ENV !== "development",
        httpOnly: true,
        expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      return res.send(result);
    }).catch((err) => {
      return res.status(500).send(err);
    });
  };

  retr.mfa = (req, res, next) => {
    const userToken = req.cookies['auth_token'] || req.headers['auth_token'];
    const totp = req.body['totp'];
    loginController.mfa({ userToken, totp }).then((result) => {
      res.cookie('auth_token', result.token, {
        secure: process.env.NODE_ENV !== "development",
        httpOnly: true,
        expiresIn: 3650 * 24 * 60 * 60 * 1000 // 10 years
      });
      return res.send(result);
    }).catch((err) => {
      return res.status(500).send(err);
    });
  };

  retr.logout = (req, res, next) => {
    res.cookie('auth_token', '', {
      secure: process.env.NODE_ENV !== "development",
      httpOnly: true,
      expiresIn: Date.now()
    });
    return res.send({
      logout: true,
      sucecss: true
    });
  };

  return retr;
};

module.exports = LoginView;
