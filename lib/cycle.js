const objectPath = require("object-path");
module.exports.decycle = function (object, replacer) {
  const objects = new WeakMap();
  return (function () {
    function derez(value, path) {
      var ref$, p, nu, i$, len$, i, element, name, item;
      if (replacer) {
        value = replacer(value);
      }
      if (
        (ref$ = {}.toString.call(value).slice(8, -1)) === "Object" ||
        ref$ === "Array"
      ) {
        if ((p = objects.get(value))) {
          return {
            $ref: p,
          };
        }
        objects.set(value, path);
        if ({}.toString.call(value).slice(8, -1) === "Array") {
          nu = [];
          for (i$ = 0, len$ = value.length; i$ < len$; ++i$) {
            i = i$;
            element = value[i$];
            nu[i] = derez(element, path + "." + i);
          }
        } else {
          nu = {};
          for (name in value) {
            item = value[name];
            nu[name] = derez(item, path + "." + name);
          }
        }
        return nu;
      }
      return value;
    }
    return derez;
  })()(object, "$");
};

module.exports.recycle = function recycle($) {
  (function () {
    function rez(value) {
      var ref$,
        i$,
        len$,
        i,
        element,
        path,
        name,
        item,
        results$ = [],
        results1$ = [];
      if (
        (ref$ = {}.toString.call(value).slice(8, -1)) === "Object" ||
        ref$ === "Array"
      ) {
        if ({}.toString.call(value).slice(8, -1) === "Array") {
          for (i$ = 0, len$ = value.length; i$ < len$; ++i$) {
            i = i$;
            element = value[i$];
            if ({}.toString.call(element).slice(8, -1) === "Object") {
              if (
                {}.toString.call((path = element.$ref)).slice(8, -1) ===
                "String"
              ) {
                results$.push((value[i] = objectPath.get($, path)));
              } else {
                results$.push(rez(element));
              }
            }
          }
          return results$;
        } else {
          for (name in value) {
            item = value[name];
            if ({}.toString.call(item).slice(8, -1) === "Object") {
              if (
                {}.toString.call((path = item.$ref)).slice(8, -1) === "String"
              ) {
                results1$.push(
                  (value[name] = objectPath.get($, /\$\.(.*)/.exec(path)[1]))
                );
              } else {
                results1$.push(rez(item));
              }
            }
          }
          return results1$;
        }
      }
    }
    return rez;
  })()($);
  return $;
};
