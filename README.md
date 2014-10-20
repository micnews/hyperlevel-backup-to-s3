## SYNOPSIS
Backup [level-hyper](https://www.npmjs.org/package/level-hyper) database and upload result to Amazon S3

## USAGE

Setup:

```js
var level = require('level-hyper');
var backupHyper = require('hyperlevel-backup-to-s3');

var db = level(config.path);
var backup = backupHyper(db);
```

Trigger backup:

```js
backup('mybackup-1', {
  accessKey: awsAccessKeyId,
  secretKey: awsSecretAccessKey,
  bucket: awsBucket
}, function(err, result) {
  console.log(result); // { uploaded: "backup-mybackup-1.tar.gz" }
});
```

Nice backup name example:

```js
var dateFormat = require('dateformat');
var name = 'database1-' + dateFormat(new Date(), 'yyyymmdd-hMMss');

backup(name, conf, function(err, result) {
  console.log(result); // { uploaded: "backup-database1-20141020-102450.tar.gz" }
});
```

##LICENSE

MIT
