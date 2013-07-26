var watch = require('watch')
  , bunyan = require('bunyan')
  , config = require('./config');

var log = bunyan.createLogger({name: 'megal-server'});

log.info('Watching directory ' + config.watchDir);
watch.createMonitor(config.watchDir, function (monitor) {
  monitor.on('created', function (f, stat) {
    if(config.megaLRegExp.test(f)) {
      log.info('Megamodel added. Start processing.');
      
    }
  });
});