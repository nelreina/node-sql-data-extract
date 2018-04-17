require('dotenv').config();
const Sequelize = require('sequelize');
const path = require('path');
const moment = require('moment');
const { converters, sqllize } = require('nelreina-node-utils');
const Log4js = require('log4js');
const S = require('string');
const argv = require('minimist')(process.argv.slice(2));

S.extendPrototype();

const DataExtract = require('./data-extract');
Log4js.configure('./log4js.json');

const logger = Log4js.getLogger();
const { getConnectionObject } = sqllize;
const conn = getConnectionObject('mssql');
const { database, username, password, options: dboptions, dialect } = conn;
const opt = Object.assign({}, dboptions, { dialect });
const mssql = new Sequelize(database, username, password, opt);
logger.info('Start creating file...');
const { json, cp, lp } = argv;
const ext = json ? 'json' : 'csv';
let periodPath = '';
if (cp) {
  periodPath = moment().format('/YYYY/MM');
}
if (lp) {
  periodPath = moment()
    .subtract(1, 'months')
    .format('/YYYY/MM');
}

const DIR_OUTPUT =
  process.env.DIR_OUTPUT || path.resolve(__dirname, '../OUTPUT');
const DIR_SQLSTMTS =
  process.env.DIR_SQLSTMTS || path.resolve(__dirname, '../SQLSTMTS');

const options = { DIR_OUTPUT, DIR_SQLSTMTS, ext, periodPath };

(async () => {
  const de = new DataExtract(mssql, options);

  de.on('log', data => logger.info(data));
  try {
    await de.run();
  } catch (error) {
    logger.error(error);
  }
  // logger.info(ret);
  process.exit(0);
})();
