const localApi = require('../models/local/api.js');
const backupApi = require('../models/backup/api.js');
const fct = require('../fct.js');

exports.init = (tablename,batchsize,dayLimit) => {
  return new Promise(async function (resolve, reject) {
    try {
      let rows,i = 0,size=0,nowDate = new Date();

      do {
        rows = await backupApi.getMulti(tablename,{},i,i+batchsize);
        await localApi.loadMulti(tablename,rows);
        i += batchsize;
        size += rows.length;

      } while (rows.length > 0 && fct.dateDifferenceSec(nowDate,new Date(rows[rows.length - 1].dateadded)) < dayLimit*24*60*60)

      rows = await localApi.getMulti(tablename,{});
      console.log('Finished '+tablename+' init. Updated ' + size + ' rows. Now in db: ' + rows.length + '.');
      resolve();
    } catch (e) { reject(e); }
  });
}

exports.update = (tablename, count) => {
  return new Promise(async function (resolve, reject) {
    try {
      let rows;

      rows = await backupApi.getMulti(tablename,{},0,count);
      await localApi.loadMulti(tablename,rows);

      console.log('Finished update of '+tablename+'.');
      resolve();
    } catch (e) { reject(e); }
  });
}
