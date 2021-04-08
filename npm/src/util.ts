

export function get_json(path, option = {}) {
  let opt = { url: path, type: "GET", dataType: "json" };
  for (let key in option)
    opt[key] = option[key];
  return new Promise((resolve, reject) => {
    opt['success'] = function (data, dataType) { resolve(data); }
    opt['error'] = function (xhr, ts, es) { reject(ts); }
    $.ajax(opt);
  });
}