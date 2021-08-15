const fs = require('fs');
const path = require('path');

let appVersion = require('../package.json').version;

let listenInterface = process.env?.API_INTERFACE ?? '0.0.0.0';
let listenPort = process.env?.API_PORT ?? '7576';
let listenSport = process.env?.API_PORT ?? '7577';
let wuiPort = process.env?.WUI_PORT ?? '3080';
let wuiSport = process.env?.WUI_SPORT ?? '3443';
let additionalCorsList = [];

process.on('SIGINT', () => {
  process.exit();
});

const processEnvVars = (envs) => {
  const { cors, CORS } = envs;

  try {
    additionalCorsList = [
      ...additionalCorsList,
      ...cors?.split(/[\s,]+/).map((c) => c && c.indexOf(':') < 0 ? `${c}:${wuiPort}` : (c || null)).filter((e) => e !== null) ?? [],
      ...cors?.split(/[\s,]+/).map((c) => c && c.indexOf(':') < 0 ? `${c}:${wuiSport}` : (c || null)).filter((e) => e !== null) ?? [],
    ];
    additionalCorsList = [
      ...additionalCorsList,
      ...CORS?.split(/[\s,]+/).map((c) => c && c.indexOf(':') < 0 ? `${c}:${wuiPort}` : (c || null)).filter((e) => e !== null) ?? [],
      ...CORS?.split(/[\s,]+/).map((c) => c && c.indexOf(':') < 0 ? `${c}:${wuiSport}` : (c || null)).filter((e) => e !== null) ?? []
    ];
  } catch (err) {
    console.error('processEnvVars: Error on cors:');
    console.error(err);
    process.exit(1);
  }
};

const init = () => {
  const logger = require('./logger')();
  
  logger.info(`MultiStreamer API Server has started. Version: '${appVersion}', Environment: '${process.env.NODE_ENV}'`);
  const settings = require('./settings')({ env: process.env.NODE_ENV, version: appVersion, logger });
  settings.cors.origins = [
    ...settings?.cors?.origins ?? [],
    ...additionalCorsList
  ];

  let httpsCredentials = {};
  try {
    const privateKey = fs.readFileSync(path.join(settings.paths.httpsCredentials, 'selfsigned.key'), 'utf8');
    const certificate = fs.readFileSync(path.join(settings.paths.httpsCredentials, 'selfsigned.crt'), 'utf8');
    const caPath = path.join(settings.paths.httpsCredentials, 'selfsigned.ca');
    httpsCredentials = {
      key: privateKey,
      cert: certificate
    };

    let ca = null;
    if (fs.existsSync(caPath)) {
      ca = fs.readFileSync(caPath);
      httpsCredentials.ca = ca;
    }
  } catch (err) {
    console.error('Could not load https credentials');
    console.error(err);
    process.exit(1);
  }

  const serverSetupPromise = require('./httpInit')({ logger, listenInterface, listenPort, listenSport, httpsCredentials, version: appVersion, settings });

  serverSetupPromise.then((runningServer) => {
    logger.info('Server ready.');
  }).catch((err) => {
    logger.error({ module: 'Main::Init()', section: 'serverSetupPromise', message: `${err}, stack: ${err.stack}` });
    process.exit(2);
  });
};

processEnvVars(process.env)
init();