// custom_prototype/ResultArray.js
class ResultArray extends Array {
  isEmpty() {
    return this.length === 0;
  }

  isNotEmpty(){
    return this.length > 0;
  }
}

module.exports = ResultArray;