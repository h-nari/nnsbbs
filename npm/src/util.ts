

export function get_json(path, option = {}) {
  let opt = { url: path, type: "GET", dataType: "json" };
  for (let key in option)
    opt[key] = option[key];
  console.log("get_json:", path, JSON.stringify(option));
  let tStart = performance.now();
  return new Promise((resolve, reject) => {
    opt['success'] = function (data, dataType) {
      console.log('get_json:', path, "succeeded.  time:", (performance.now() - tStart).toFixed(1),"ms");
      resolve(data);
    }
    opt['error'] = function (xhr, ts, es) {
      console.log('get_json:', path, "error.  time:", (performance.now() - tStart).toFixed(1),"ms");
      reject(ts);
    }
    $.ajax(opt);
  });
}