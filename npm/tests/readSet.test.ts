import { describe, it } from "mocha"
import { assert } from "chai";
import { ReadSet } from "../src/readSet";

describe('ReadSet', () => {
  it('test1', () => {
    let rs = new ReadSet();
    assert.equal(rs.toJson(), '[]');
    assert.equal(rs.toString(), '');
  })
  it('test1', () => {
    let rs = new ReadSet('1');
    assert.equal(rs.toJson(), '[[1,1]]');
    assert.equal(rs.toString(), '1');
  })

});