type Range = [number, number];

export class ReadSet {
  private ranges: Range[] = [];

  constructor(str: string | undefined = undefined) {
    if (str) this.fromString(str);
  }

  clear() {
    this.ranges = [];
  }

  fromString(str: string) {
    let length = str.length;
    let start: number;
    let end: number;

    this.ranges = [];

    let s = str;
    while (true) {
      let m = s.match(/^\s+/);
      if (m) s = s.substr(m[0].length);
      if (s == "") break;

      m = s.match(/^\d+/);
      if (m) {
        start = parseInt(m[0]);
        s = s.substr(m[0].length);
      } else
        this.syntaxError(s, str);

      m = s.match(/^-\s*(\d+)/);
      if (m) {
        end = parseInt(m[1]);
        s = s.substr(m[0].length);
        this.add_range(start, end);
      } else {
        this.add_range(start, start);
      }
      m = s.match(/^\s+/);
      if (m) s = s.substr(m[0].length);
      if (s == "") break;
      m = s.match(/^,/);
      if (m) {
        s = s.substr(m[0].length);
        continue;
      }
      this.syntaxError(s, str);
    }
  }

  add_range(start: number, end: number | null = null) {
    if (!end) end = start;
    if (start <= end) {
      let s = start;
      let e = end;
      let new_ranges: Range[] = [];
      let r: Range | undefined = this.ranges.shift();
      while (r && r[1] < s - 1) {
        new_ranges.push(r);
        r = this.ranges.shift();
      }

      while (r && r[0] <= e + 1) {
        s = Math.min(s, r[0]);
        e = Math.max(e, r[1]);
        r = this.ranges.shift();
      }
      new_ranges.push([s, e]);

      while (r) {
        new_ranges.push(r);
        r = this.ranges.shift();
      }
      this.ranges = new_ranges;
    }
  }

  // @brief 領域を取り除く
  sub_range(start: number, end: number) {
    if (start <= end) {
      let s = start;
      let e = end;
      let new_ranges: Range[] = [];
      let r: Range | undefined = this.ranges.shift();
      while (r && r[1] < s) {
        new_ranges.push(r);
        r = this.ranges.shift();
      }

      while (r && r[0] <= e) {
        if (r[0] < s)
          new_ranges.push([r[0], s - 1]);
        if (e < r[1])
          new_ranges.push([e + 1, r[1]]);
        r = this.ranges.shift();
      }

      while (r) {
        new_ranges.push(r);
        r = this.ranges.shift();
      }
      this.ranges = new_ranges;
    }
  }

  syntaxError(offendingStr: string, allString: string): never {
    let pos = allString.length - offendingStr.length;
    throw Error(`ReadSet SyntaxError: at pos ${pos} of "${allString}", offending str:"${offendingStr}"`);
  }

  toString(): string {
    let s = "";
    for (let r of this.ranges) {
      if (s != "") s += ','
      if (r[0] == r[1])
        s += r[0];
      else
        s += r[0] + '-' + r[1];
    }
    return s;
  }

  toJson(): string {
    return JSON.stringify(this.ranges);
  }

  count(): number {
    let n = 0;
    for (let r of this.ranges)
      n += r[1] - r[0] + 1;
    return n;
  }

  includes(n: number): boolean {
    for (let r of this.ranges) {
      if (r[0] <= n && n <= r[1])
        return true;
    }
    return false;
  }
}