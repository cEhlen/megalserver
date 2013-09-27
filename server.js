  var watch = require('watch')
  , bunyan = require('bunyan')
  , config = require('./config')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')
  , spawn = require('child_process').spawn;

function treeSync (root) {
  var s = fs.lstatSync(root);
  s.name = root;
  if (!s.isDirectory()) return s;
  var children = fs.readdirSync(root);
  s.children = [];
  var names = [];
  for (var i = 0, l = children.length; i < l; i ++) {
    var child = treeSync(path.join(root, children[i]));
	if(!child.isDirectory()) {
		child.name = children[i].substring(0,children[i].lastIndexOf('.'));
		if(child.name === 'application'){
			continue;
		}
		child.path = path.join(root, children[i]);
		if(names.indexOf(child.name) === -1){
			s.children.push(child);
			names.push(child.name);
		}
	} else{
		child.name = children[i];
		child.path = path.join(root, children[i]);
		s.children.push(child);
	}	
  }
  return s;
}

var runMegaL = function (path) {
  log.info("Running Megal for path " + path);
  megal = spawn('java', ['-cp', 'megal:megal/megal-0.0.1-SNAPSHOT.jar:megal/lib/*.jar', "megal.Tool", path]);
  console.log(megal);
  megal.stdout.on('data', function (data) {
    log.info('MegaModel execution: ' + data);
  });
  megal.stderr.on('data', function (data) {
    log.warn('Error executing mega model! ' + data + ' ' + path);
  });
  megal.on('close', function (code) {
    log.info('MegaModel done ' + code);
  });
};

var log = bunyan.createLogger({name: 'megal-server'});

log.info('Watching directory ' + config.watchDir);
watch.createMonitor(config.watchDir, function (monitor) {
  monitor.on('created', function (f, stat) {
    if(config.megaLRegExp.test(f)) {
      log.info('Megamodel added. Start processing ' + f);
      runMegaL(f);
    }
  });
});

var recursiveTreeview = function (obj, path, id) {
  var text = '';
  if(obj.children && obj.children.length > 0) {
    if(id === 0) {
      text += '<li><input type="checkbox" checked="checked" id="item-' + id + '">';
    } else {
      text += '<li><input type="checkbox" id="item-' + id + '">';
    }
    text += '<label for="item-' + id + '">' + obj.name + "</label><ul>";
    for (var i = 0; i < obj.children.length; i++) {
      text += recursiveTreeview(obj.children[i], path + '/' + obj.name, ++id);
    };
    text += '</ul></li>';
  } else {
    text += '<li><a href="#" class="megalLink" data-path="/files' + path + '/' + obj.name + '.json">'+obj.name+'</a></li>'
  }
  return text;
}

var nRecursiveTreeview = function (obj, path, id, lookup) {
  var text = '';
  if(obj.children && obj.children.length > 0) {
    // Directory
  } else {
    // Object
    
    text += '<li><a href="#" class="megalLink" data-path="/files' + path + '/' + obj.name + '">'+obj.name+'</a></li>'
  }
  return text;
}

var simpleTemplate = function (data, callback) {
  var rawJSON = treeSync(config.watchDir);
  var tree = recursiveTreeview(rawJSON, '', 0);
  var html = data.replace("---[[TREEVIEW]]---", tree);
  callback(html);
  
};

var filesRoute = /\/files\/(.*)/;

http.createServer(function (req, res) {
  if(req.url === '/') {
    fs.readFile('templates/main.html', {encoding: 'utf8'}, function (err, data) {
      if(err) {
        res.writeHead(500);
        res.end(JSON.stringify(err));
        return;
      }
      res.writeHead(200);
      simpleTemplate(data, function (test) {
        res.end(test);
      });
    });
  } else if (filesRoute.test(req.url)) {
    var path = filesRoute.exec(req.url);
    var stream = fs.createReadStream('./' + path[1]);
    stream.on('error', function(err) {
		res.writeHead(404);
		res.end('404');
	});
	stream.pipe(res);
  } else {
    res.writeHead(404);
    res.end('404');
  }
}).listen(config.port);
log.info('Server listening on port ' + config.port);