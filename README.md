## SYNOPSIS
Backup level-hyper database and upload result to Amazon S3

## USAGE

Init:

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
}, function(err) {
  console.log('done');
});
```

