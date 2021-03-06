const { sqllize } = require('nelreina-node-utils');
const fs = require('fs');
const Events = require('events');
const { promisify } = require('util');
const converter = require('json2csv');

const { invokeSQLCmd } = sqllize;
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);

const toCSV = data => {
  const quotes = '';
  const del = '\t';
  const csv = converter({ data, quotes, del });
  // const lines = csv.split('\n');
  // lines[0] = lines[0].replaceAll('|', '#');
  // this.emit('log', 'total lines ' + lines.length);
  // const text = lines.join('\n');
  return csv;
};

class DataExtract extends Events {
  async run(mssql, options) {
    const { ext, DIR_OUTPUT, DIR_SQLSTMTS } = options;
    let text;
    const sqlFiles = await readDir(DIR_SQLSTMTS);
    this.emit('log', JSON.stringify(sqlFiles));
    const promises = [];
    sqlFiles.forEach(file => {
      promises.push(
        this.extract(file, ext, DIR_SQLSTMTS, mssql, text, DIR_OUTPUT)
      );
    });
    return await Promise.all(promises);
  }

  async extract(file, ext, DIR_SQLSTMTS, mssql, text, DIR_OUTPUT) {
    const fileName = `${file.replace('.sql', '')}.${ext}`;
    const query = await readFile(`${DIR_SQLSTMTS}/${file}`);
    this.emit('log', 'extracting data...');
    const data = await invokeSQLCmd(mssql, query.toString());
    this.emit('log', 'extract finished ');
    this.emit('log', 'extracted ' + data.length + ' rows');
    if (ext === 'csv') {
      this.emit('log', 'converting data to csv...');
      text = toCSV(data);
      this.emit('log', 'convert to csv done');
    } else {
      text = JSON.stringify(data, null, 2);
    }
    this.emit('log', `writing ${fileName} file...`);
    await writeFile(`${DIR_OUTPUT}/${fileName}`, text);
    this.emit('log', `write ${fileName} file done`);
    return text;
  }
}
module.exports = DataExtract;
