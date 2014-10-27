var pathUtils = require('path');
var fs = require('fs');
var expect = require('chai').expect;

function StreamingS3(stream, accessKey, secretKey, opts, cb) {
  if (accessKey !== 'VALID') {
    return cb(new Error('upload failed'));
  }

  var fname = opts.Key;

  var path = pathUtils.resolve(__dirname, fname);
  var file = fs.createWriteStream(path, { flags: 'w' });

  stream.pipe(file);

  file.on('finish', function() {
    expect(fs.existsSync(path)).to.equal(true);
    fs.unlink(path);

    process.nextTick(function() {
      return cb(null);
    });
  });
}

module.exports = StreamingS3;
