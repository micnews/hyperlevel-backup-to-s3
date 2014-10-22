var EE = require('events').EventEmitter;
var pathUtils = require('path');
var fs = require('fs');
var expect = require('chai').expect;

module.exports = {
  Uploader: function(opts) {
    var ee = new EE();

    function failed() {
      process.nextTick(function() {
        ee.emit('failed', new Error('upload failed'));
      });
    }

    function ok(stream) {
      var path = pathUtils.resolve(__dirname, opts.objectName);
      var file = fs.createWriteStream(path, { flags: 'w' });

      stream.pipe(file);

      file.on('finish', function() {
        expect(fs.existsSync(path)).to.equal(true);
        fs.unlink(path);

        process.nextTick(function() {
          ee.emit('completed', null);
        });
      });
    }

    if (opts.accessKey === 'VALID') {
      ok(opts.stream);
    } else {
      failed();
    }

    return ee;
  }
};
