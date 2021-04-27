

export function get_json(path: string, option = {}) {
  let opt = { url: path, type: "GET", dataType: "json" };
  for (let key in option)
    opt[key] = option[key];
  console.log("get_json:", path, JSON.stringify(option));
  let tStart = performance.now();
  return new Promise((resolve, reject) => {
    $('body').addClass('wait');
    opt['success'] = function (data, dataType) {
      console.log('get_json:', path, "succeeded.  time:", (performance.now() - tStart).toFixed(1), "ms");
      $('body').removeClass('wait');
      resolve(data);
    }
    opt['error'] = function (xhr, ts, es) {
      console.log('get_json:', path, "error.  time:", (performance.now() - tStart).toFixed(1), "ms");
      $('body').removeClass('wait');
      reject(ts);
    }
    $.ajax(opt);
  });
}

export function escape_html(str: string): string {
  return str.replace(/[&'`"<>]/g, function (match) {
    return {
      '&': '&amp;',
      "'": '&#X27;',
      '`': '&#x60;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;'
    }[match] || '';
  });
}