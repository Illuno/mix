const child_process = require("child_process");
const preludeLs = require("prelude-ls");
const fs = require("fs");
const path = require("path");
const optimist = require("optimist");
const chokidar = require("chokidar");
const glob = require("glob");
const co = require("co");
const clone = require("clone");
const deepExtend = require("deep-extend");
const nodeUuid = require("node-uuid");
const cliSpinner = require("cli-spinner");
const bluebird = require("bluebird");
const Module = require("module");
const daemonize2 = require("daemonize2");
const cycle = require("./cycle");
const daemonAction = null;

module.exports.init = function (it) {
  var log, ref$, ref1$, configPath, hostPath;
  import$(process, child_process);
  import$(global, preludeLs);
  if (process.argv.indexOf("--daemon") >= 0) {
    log = fs.openSync("mix.log", "a+");
    each(function (key) {
      return (global[key] = function () {
        fs.write(log, [].join.call(arguments, " "));
        return fs.write(log, "\n");
      });
    })(["log", "info", "warn", "error"]);
  } else if (typeof window != "undefined" && window !== null) {
    if (console.log.apply) {
      each(function (key) {
        return (window[key] = function () {
          return console[key].apply(console, arguments);
        });
      })(["log", "info", "warn", "error"]);
    } else {
      each(function (key) {
        return (window[key] = console[key]);
      })(["log", "info", "warn", "error"]);
    }
  } else {
    global.log = console.log;
    global.info = console.info;
    global.warn = console.warn;
    global.error = console.error;
  }
  bluebird.config({
    longStackTraces: true,
  });
  import$(global, {
    co: co,
    fs: ((fs.path = path), fs),
    uuid: nodeUuid.v4,
    glob: glob,
    extend: deepExtend,
    clone: clone,
    Promise: bluebird,
    promise: function () {
      return (function (func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor(),
          result = func.apply(child, args),
          t;
        return (t = typeof result) == "object" || t == "function"
          ? result || child
          : child;
      })(Promise, arguments, function () {});
    },
    promisify: bluebird.promisify,
    promisifyAll: bluebird.promisifyAll,
    watcher: chokidar,
    pathify: function (it) {
      return Module.globalPaths.push(it);
    },
  });
  import$(global, cycle);
  Obj.compact = function (it) {
    return pairsToObj(
      filter(function (it) {
        return it[1] !== undefined;
      })(objToPairs(it))
    );
  };
  global.spin = function* (line, command) {
    var spinner;
    spinner = new cliSpinner.Spinner(line + " %s");
    spinner.start();
    if (command) {
      yield ex(command);
      spinner.stop(true);
      if (line) {
        info(line);
      }
    }
    spinner.done = function () {
      spinner.stop(true);
      if (line) {
        return info(line);
      }
    };
    return spinner;
  };
  global.ex = function (command, options) {
    return new Promise(function (resolve, reject) {
      return process.exec(command, function (error, result) {
        if (error) {
          return reject(error);
        }
        return resolve(result.toString());
      });
    });
  };
  global.exec = function (command, options) {
    return process.execSync(command).toString();
  };
  global.spawn = function (command, options) {
    options == null && (options = {});
    options.stdio == null && (options.stdio = "inherit");
    return new Promise(function (resolve, reject) {
      var words;
      words = command.match(/[^"'\s]+|"[^"]+"|'[^'']+'/g);
      return process
        .spawn(head(words), tail(words), options)
        .on("close", resolve);
    });
  };
  global.mix = {
    config: {
      color: true,
    },
    task: [
      last(
        ((ref1$ = (ref$ = optimist.argv).$0), delete ref$.$0, ref1$).split(" ")
      ),
    ].concat(((ref1$ = (ref$ = optimist.argv)._), delete ref$._, ref1$)),
    option: pairsToObj(
      map(function (it) {
        return [camelize(it[0]), it[1]];
      })(objToPairs(optimist.argv))
    ),
  };
  if (mix.task[0] === "./node_modules/mix/run.js") {
    mix.task.shift();
  }
  global.projectRoot = it || mix.option.projectRoot || process.cwd();
  if (fs.existsSync(projectRoot + "/lib")) {
    pathify(fs.realpathSync(projectRoot + "/lib"));
  }
  pathify(fs.realpathSync(projectRoot + "/node_modules"));
  if ((ref$ = mix.task[0]) === "start" || ref$ === "stop") {
    daemonAction = mix.task.shift();
  }
  if (fs.existsSync((configPath = projectRoot + "/mix.js"))) {
    extend(mix.config, require(configPath));
  }
  if (fs.existsSync((hostPath = projectRoot + "/host.js"))) {
    extend(mix.config, require(hostPath));
  }
  mix.config = recycle(mix.config);
  global.color = function (c, v) {
    return (mix.config.color && "\x1b[38;5;" + c + "m" + v + "\x1b[0m") || v;
  };
  global.debounce = function () {
    var wait, func, timeout;
    if (arguments.length < 1) {
      return;
    }
    wait = 1;
    if (isType("Function", arguments[0])) {
      func = arguments[0];
    } else {
      wait = arguments[0];
    }
    if (arguments.length > 1) {
      if (isType("Function", arguments[1])) {
        func = arguments[1];
      } else {
        wait = arguments[1];
      }
    }
    timeout = null;
    return function () {
      var args,
        this$ = this;
      args = arguments;
      clearTimeout(timeout);
      return (timeout = setTimeout(function () {
        timeout = null;
        return func.apply(this$, args);
      }, wait));
    };
  };
  import$(this, mix);
  return this;
};
const arrayReplace = function (it, a, b) {
  var index;
  index = it.indexOf(a);
  if (index > -1) {
    it.splice(index, 1, b);
  }
  return it;
};
module.exports.run = function () {
  var taskModules, taskModule, task, daemon, argv, child;
  taskModules = pairsToObj(
    map(function (it) {
      return [
        camelize(
          fs.path.basename(it).replace(RegExp(fs.path.extname(it) + "$"), "")
        ),
        it,
      ];
    })(
      glob
        .sync(projectRoot + "/node_modules/mix*/task/*.js")
        .concat(glob.sync(projectRoot + "/task/*.js"))
    )
  );
  if (process.argv.indexOf("--daemon") >= 0) {
    mix.task.shift();
  }
  if (!mix.task[0] || !taskModules[camelize(mix.task[0])]) {
    if (!keys(taskModules).length) {
      info("No tasks defined");
      process.exit();
    }
    info("Tasks:");
    each(function (it) {
      return info("  " + it);
    })(keys(taskModules));
    process.exit();
  }
  taskModule = new Module.Module();
  taskModule.paths = [
    projectRoot + "/node_modules",
    projectRoot + "/lib",
    __dirname + "/../lib",
  ];
  if (fs.existsSync(__dirname + "/../node_modules")) {
    taskModule.paths.push(__dirname + "/../node_modules");
  }
  taskModule._compile(
    fs.readFileSync(taskModules[camelize(mix.task[0])]).toString(),
    taskModules[camelize(mix.task[0])]
  );
  taskModule = taskModule.exports;
  if (
    !(mix.task[1] && (task = taskModule[camelize(mix.task[1].toString())])) &&
    !(task = taskModule[camelize(mix.task[0])])
  ) {
    info("Subtasks:");
    each(function (it) {
      return info("  " + dasherize(it));
    })(
      filter(function (it) {
        return it !== camelize(mix.task[0]);
      })(keys(taskModule))
    );
    process.exit();
  }
  if (daemonAction) {
    daemon = daemonize2.setup({
      main: __dirname + "/../run.js",
      name: "MIX: " + projectRoot + " [" + mix.task[0] + "]",
      pidfile:
        "/tmp/mix-" +
        fs.path.basename(projectRoot) +
        "-" +
        mix.task[0] +
        ".pid",
      argv: process.argv.slice(2).concat(["--daemon"]),
      cwd: projectRoot,
    });
    daemon.on("error", function () {
      return info.apply(null, arguments);
    });
    daemon[daemonAction]();
    process.exit();
  }
  if (mix.option.watch && taskModule.watch) {
    process.argv.shift();
    process.argv.shift();
    argv = mix.task.concat(process.argv);
    arrayReplace(argv, "--watch", "--supervised");
    for (;;) {
      child = process.spawnSync(
        fs.path.resolve("node_modules/.bin/mix"),
        argv,
        {
          stdio: "inherit",
        }
      );
      if (child.error) {
        info(child.error);
        process.exit();
      }
      if (child.signal === "SIGINT") {
        info("old, bro.");
        process.exit();
      }
    }
  } else if (mix.option.supervised) {
    watcher
      .watch(taskModule.watch || [], {
        persistent: true,
        ignoreInitial: true,
      })
      .on("all", function (event, path) {
        info("Change detected in '" + path + "'...");
        return process.exit();
      });
  }
  return co(
    task.apply(
      null,
      (mix.task[1] &&
        Array.slice.call(
          mix.task,
          (taskModule[camelize(mix.task[1].toString())] && 2) || 1,
          mix.task.length
        )) ||
        []
    )
  )["catch"](function (it) {
    return error(it.stack || it);
  });
};
function import$(obj, src) {
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
