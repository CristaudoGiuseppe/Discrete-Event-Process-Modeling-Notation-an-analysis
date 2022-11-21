!function(f,a,c){var s,l=256,p="random",d=c.pow(l,6),g=c.pow(2,52),y=2*g,h=l-1;function n(n,t,r){function e(){for(var n=u.g(6),t=d,r=0;n<g;)n=(n+r)*l,t*=l,r=u.g(1);for(;y<=n;)n/=2,t/=2,r>>>=1;return(n+r)/t}var o=[],i=j(function n(t,r){var e,o=[],i=typeof t;if(r&&"object"==i)for(e in t)try{o.push(n(t[e],r-1))}catch(n){}return o.length?o:"string"==i?t:t+"\0"}((t=1==t?{entropy:!0}:t||{}).entropy?[n,S(a)]:null==n?function(){try{var n;return s&&(n=s.randomBytes)?n=n(l):(n=new Uint8Array(l),(f.crypto||f.msCrypto).getRandomValues(n)),S(n)}catch(n){var t=f.navigator,r=t&&t.plugins;return[+new Date,f,r,f.screen,S(a)]}}():n,3),o),u=new m(o);return e.int32=function(){return 0|u.g(4)},e.quick=function(){return u.g(4)/4294967296},e.double=e,j(S(u.S),a),(t.pass||r||function(n,t,r,e){return e&&(e.S&&v(e,u),n.state=function(){return v(u,{})}),r?(c[p]=n,t):n})(e,i,"global"in t?t.global:this==c,t.state)}function m(n){var t,r=n.length,u=this,e=0,o=u.i=u.j=0,i=u.S=[];for(r||(n=[r++]);e<l;)i[e]=e++;for(e=0;e<l;e++)i[e]=i[o=h&o+n[e%r]+(t=i[e])],i[o]=t;(u.g=function(n){for(var t,r=0,e=u.i,o=u.j,i=u.S;n--;)t=i[e=h&e+1],r=r*l+i[h&(i[e]=i[o=h&o+t])+(i[o]=t)];return u.i=e,u.j=o,r})(l)}function v(n,t){return t.i=n.i,t.j=n.j,t.S=n.S.slice(),t}function j(n,t){for(var r,e=n+"",o=0;o<e.length;)t[h&o]=h&(r^=19*t[h&o])+e.charCodeAt(o++);return S(t)}function S(n){return String.fromCharCode.apply(0,n)}if(j(c.random(),a),"object"==typeof module&&module.exports){module.exports=n;try{s=require("crypto")}catch(n){}}else"function"==typeof define&&define.amd?define(function(){return n}):c["seed"+p]=n}("undefined"!=typeof self?self:this,[],Math);
var rand = Object.create(null);
rand.LOG4 = Math.log(4.0);
rand.SG_MAGICCONST = 1.0 + Math.log(4.5);

rand.exponential = function (lambda) {
  if (arguments.length != 1) {                         // ARG_CHECK
    throw new SyntaxError("exponential() must "     // ARG_CHECK
        + " be called with 'lambda' parameter"); // ARG_CHECK
  }                                                   // ARG_CHECK
  var r = rand.gen();
  return -Math.log(r) / lambda;
};

rand.gamma = function (alpha, beta) {
  if (arguments.length != 2) {                         // ARG_CHECK
    throw new SyntaxError("gamma() must be called"  // ARG_CHECK
        + " with alpha and beta parameters"); // ARG_CHECK
  }                                                   // ARG_CHECK
  /* Based on Python 2.6 source code of random.py.
   */
  if (alpha > 1.0) {
    var ainv = Math.sqrt(2.0 * alpha - 1.0);
    var bbb = alpha - rand.LOG4;
    var ccc = alpha + ainv;
    while (true) {
      var u1 = rand.gen();
      if ((u1 < 1e-7) || (u > 0.9999999)) {
        continue;
      }
      var u2 = 1.0 - rand.gen();
      var v = Math.log(u1 / (1.0 - u1)) / ainv;
      var x = alpha * Math.exp(v);
      var z = u1 * u1 * u2;
      var r = bbb + ccc * v - x;
      if ((r + rand.SG_MAGICCONST - 4.5 * z >= 0.0) || (r >= Math.log(z))) {
        return x * beta;
      }
    }
  } else if (alpha == 1.0) {
    var u = rand.gen();
    while (u <= 1e-7) {
      u = rand.gen();
    }
    return - Math.log(u) * beta;
  } else {
    while (true) {
      var u = rand.gen();
      var b = (Math.E + alpha) / Math.E;
      var p = b * u;
      if (p <= 1.0) {
        var x = Math.pow(p, 1.0 / alpha);
      } else {
        var x = - Math.log((b - p) / alpha);
      }
      var u1 = rand.gen();
      if (p > 1.0) {
        if (u1 <= Math.pow(x, (alpha - 1.0))) {
          break;
        }
      } else if (u1 <= Math.exp(-x)) {
        break;
      }
    }
    return x * beta;
  }

};

rand.normal = function (mu, sigma) {
  if (arguments.length != 2) {                          // ARG_CHECK
    throw new SyntaxError("normal() must be called"  // ARG_CHECK
        + " with mu and sigma parameters");      // ARG_CHECK
  }                                                    // ARG_CHECK
  var z = rand.lastNormal;
  rand.lastNormal = NaN;
  if (!z) {
    var a = rand.gen() * 2 * Math.PI;
    var b = Math.sqrt(-2.0 * Math.log(1.0 - rand.gen()));
    z = Math.cos(a) * b;
    rand.lastNormal = Math.sin(a) * b;
  }
  return mu + z * sigma;
};

rand.pareto = function (alpha) {
  if (arguments.length != 1) {                         // ARG_CHECK
    throw new SyntaxError("pareto() must be called" // ARG_CHECK
        + " with alpha parameter");             // ARG_CHECK
  }                                                   // ARG_CHECK
  var u = rand.gen();
  return 1.0 / Math.pow((1 - u), 1.0 / alpha);
};

rand.weibull = function (alpha, beta) {
  if (arguments.length != 2) {                         // ARG_CHECK
    throw new SyntaxError("weibull() must be called" // ARG_CHECK
        + " with alpha and beta parameters");    // ARG_CHECK
  }                                                   // ARG_CHECK
  var u = 1.0 - rand.gen();
  return alpha * Math.pow(-Math.log(u), 1.0 / beta);
};

rand.triangular = function (lower, upper, mode) {
  // http://en.wikipedia.org/wiki/Triangular_distribution
  if (arguments.length != 3) {
    throw new SyntaxError("triangular() must be called"
        + " with 3 parameters (lower, upper and mode)");
  }
  if (!(lower < upper && lower <= mode && mode <= upper)) {
    throw new SyntaxError("The lower, upper and mode parameters " +
        "must satisfy the conditions l < U and l <= m <= u!");
  }
  var c = (mode - lower) / (upper - lower);
  var u = rand.gen();
  if (u <= c) {
    return lower + Math.sqrt(u * (upper - lower) * (mode - lower));
  } else {
    return upper - Math.sqrt((1 - u) * (upper - lower) * (upper - mode));
  }
};

rand.uniform = function (lower, upper) {
  if (arguments.length === 1) {
    throw new SyntaxError("uniform(lower, upper) must be called"
        + " 1. with lower and upper parameters [e.g., uniform(lower, upper)] or "
        + " 2. without any parameter [e.g., uniform()]");
  } else if (arguments.length >= 2) {
    return lower + rand.gen() * (upper - lower);
  } else {
    return rand.gen();
  }
};
/***
 Added by Gerd Wagner (20160921)
 */
rand.uniformInt = function (lower, upper) {
  if (arguments.length != 2 ||
      !(Number.isInteger(lower) && Number.isInteger(upper))) {
    throw new SyntaxError("uniformInt() must be called"
        + " with lower and upper integer values!");
  }
  return lower + Math.floor( rand.gen() * (upper - lower + 1));
};

rand.frequency = function (freqMap) {
  if (typeof freqMap !== "object") {
    throw new SyntaxError("rand.frequency() must be called"
        + " with a frequency map argument!");
  }
  var probabilities = Object.values( freqMap);
  if (math.sum( probabilities) !== 1 ) {
    throw new SyntaxError("rand.frequency(): rel. frequency values " +
        "do not add up to 1!");
  }
  var cumProb=0;
  var cumProbs = probabilities.map( function (p) {
    cumProb += p;
    return cumProb;
  });
  var valueStrings = Object.keys( freqMap);
  var valuesAreNumeric = !isNaN( parseInt( valueStrings[0]));
  var randX = rand.gen();
  for (let i=0; i <= cumProbs.length; i++) {
    if (randX < cumProbs[i])
      return valuesAreNumeric ? parseInt(valueStrings[i]) : valueStrings[i];
  }
};

/**
 * Shuffles array in place using the Fisher-Yates shuffle algorithm
 * @param {Array} a - An array of items to be shuffled
 */
rand.shuffleArray = function (a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i -= 1) {
    j = Math.floor( rand.gen() * (i + 1) );
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
};

const util = {
  /*******************************************************************************
   * Create option elements from an array list of option text strings
   * and insert them into a selection list element
   * @param {object} selEl  A select(ion list) element
   * @param {Array<string>} strings  An array list of strings
   ******************************************************************************/
  fillSelectWithOptionsFromStringList( selEl, strings) {
    for (let i=0; i < strings.length; i++) {
      let el = document.createElement("option");
      el.textContent = `(${i}) ${strings[i]}`;
      el.value = i;
      selEl.add( el, null);
    }
  },
  // the progress indication is indeterminate if there is no value
  createProgressBarEl( title, value) {
    const progressContainerEl = document.createElement("div"),
        progressEl = document.createElement("progress"),
        progressLabelEl = document.createElement("label"),
        progressInfoEl = document.createElement("p");
    progressEl.id = "progress";
    // values between 0 and 1
    if (value !== undefined) progressEl.value = value;  // initial value
    progressLabelEl.for = "progress";
    progressLabelEl.textContent = title;
    progressContainerEl.id = "progress-container";
    progressContainerEl.appendChild( progressLabelEl);
    progressContainerEl.appendChild( progressEl);
    progressContainerEl.appendChild( progressInfoEl);
    return progressContainerEl
  },
  createExpandablePanel({id, heading, hint, borderColor}) {
    const uiPanelEl = document.createElement("details"),
          headEl = document.createElement("summary");
    uiPanelEl.id = id;
    uiPanelEl.className = "expandablePanel";
    if (borderColor) uiPanelEl.style.borderColor = borderColor;
    headEl.innerHTML = heading;
    if (hint) headEl.title = hint;
    uiPanelEl.appendChild( headEl);
    uiPanelEl.style.overflowX = "auto";  // horizontal scrolling
    return uiPanelEl;
  },
  /*******************************************************************************
   * Generate a file from text
   * @param {string} filename - Name of the file
   * @param {string} text - Content of the file
   ******************************************************************************/
  generateTextFile( filename, text) {
    var data, aElem, url;
    data = new Blob( [text], {type: "text/plain"});
    url = window.URL.createObjectURL(data);
    aElem = document.createElement("a");
    aElem.setAttribute( "style", "display: none");
    aElem.setAttribute( "href", url);
    aElem.setAttribute( "download", filename);
    document.body.appendChild( aElem);
    aElem.click();
    window.URL.revokeObjectURL( url);
    aElem.remove();
  },
  // from https://stackoverflow.com/questions/5646279/get-object-class-from-string-name-in-javascript/53199720
  getClass( name){
    var Class=null;
    if (name.match(/^[a-zA-Z0-9_]+$/)) {
      // proceed only if the name is a single word string
      Class = eval( name);
    } else {  // not a name
      throw new Error("getClass requires a single word string as argument!");
    }
    return Class;
    // Alternative solution: Class = this[name];
  },
  getSuperClassOf( C) {
    return Object.getPrototypeOf( C);
  },
  loadScript( fileURL) {
    return new Promise( function (resolve, reject) {
      const scriptEl = document.createElement("script");
      scriptEl.src = fileURL;
      scriptEl.onload = resolve;
      scriptEl.onerror = function () {
        reject( new Error(`Script load error for ${fileURL}`));
      };
      document.head.append( scriptEl);
      console.log(`${fileURL} loaded.`);
    });
  },
  loadCSS( fileURL) {
    return new Promise( function (resolve, reject) {
      const linkEl = document.createElement("link");
      linkEl.href = fileURL;
      linkEl.rel = "stylesheet";
      linkEl.type = "text/css";
      linkEl.onload = resolve;
      linkEl.onerror = function () {
        reject( new Error(`CSS load error for ${fileURL}`));
      };
      document.head.append( linkEl);
      console.log(`${fileURL} loaded.`);
    });
  }
}
/*******************************************************************************
 * Math/Statistics Library for OESCore
 *
 * @copyright Copyright 2020 Gerd Wagner
 *   Chair of Internet Technology, Brandenburg University of Technology, Germany.
 * @license The MIT License (MIT)
 * @author Gerd Wagner
 ******************************************************************************/

/****************************************************************
 ****************************************************************/
const math = {};
/**
 * Compute the Cartesian Product of an array of arrays
 * From https://stackoverflow.com/a/36234242/2795909
 * @param {Array} arr - An array of arrays of values to be combined
 */
math.cartesianProduct = function (arr) {
  return arr.reduce( function (a,b) {
    return a.map( function (x) {
      return b.map( function (y) {
        return x.concat(y);
      })
    }).reduce( function (a,b) {return a.concat(b)}, [])
  }, [[]])
};
/**
 * Round a decimal number to decimalPlaces
 * @param {number} x - the number to round
 * @param {number} d - decimal places
 */
math.round = function (x,d) {
  var roundingFactor = Math.pow(10, d);
  return Math.round((x + Number.EPSILON) * roundingFactor) / roundingFactor;
};
/**
 * Compute the sum of an array of numbers
 * @param {Array} data - An array of numbers
 */
math.sum = function (data) {
  function add( a, b) {return a + b;}
  return data.reduce( add, 0);
};
/**
 * Compute the max/min of an array of numbers
 * @param {Array} data - An array of numbers
 */
math.max = function (data) {
  return Math.max( ...data);
};
math.min = function (data) {
  return Math.min( ...data);
};
/**
 * Compute the arithmetic mean of an array of numbers
 * @param {Array} data - An array of numbers
 */
math.mean = function (data) {
  return math.sum( data) / data.length;
};
/**
 * Compute the standard deviation of an array of numbers
 * @param {Array} data - An array of numbers
 */
math.stdDev = function (data) {
  var m = math.mean( data);
  return Math.sqrt( data.reduce( function (acc, x) {
    return acc + Math.pow( x - m, 2);}, 0) / (data.length - 1));
};
// Returns a random number between min (inclusive) and max (exclusive)
math.getUniformRandomNumber = function (min, max) {
  return Math.random() * (max - min) + min;
}
// Returns a random integer between min (included) and max (included)
math.getUniformRandomInteger = function (min, max) {
  return Math.floor( Math.random() * (max - min + 1)) + min;
}
/**
 * Compute the confidence interval of an array of numbers. Based on
 *   Efron, B. (1985). Bootstrap confidence intervals for a class of parametric
 *   problems. Biometrika, 72(1), 45-58.
 * @param {Array<number>} data - An array of numbers
 * @param {number} samples - Number of bootstrap samples (default 10000)
 * @param {number} alpha - Confidence interval to estimate [0,1] (default 0.95)
 * @returns {{lowerBound:number, upperBound:number}} Lower and upper bound of confidence interval
 */
math.confInt = function ( data, samples, alpha ) {
  var n = samples || 10000;
  var p = alpha || 0.95;
  var mu = Array( n );
  var m = math.mean( data );
  var len = data.length;
  // Calculate bootstrap samples
  for (let i = 0; i < n; i++) {
    let t = 0;
    for (let j = 0; j < len; j++) {
      t += data[ Math.floor( Math.random() * len ) ];
    }
    mu[ i ] = ( t / len ) - m;
  }
  // Sort in ascending order
  mu.sort((a,b) => a - b);
  // Return the lower and upper confidence interval
  return {
    lowerBound: m - mu[ Math.floor( Math.min( n - 1,
        n * ( 1 - ( ( 1 - p ) / 2 ) ) ) ) ],
    upperBound: m - mu[ Math.floor( Math.max( 0, n * ( ( 1 - p ) / 2 ) ) ) ]
  };
};
/**
 * Define summary statistics record
 */
math.stat = Object.create( null);
math.stat.summary = {
  average: {label:"Average", f: math.mean},
  stdDev: {label:"Std.dev.", f: math.stdDev},
  min: {label:"Minimum", f: math.min},
  max: {label:"Maximum", f: math.max},
  confIntLowerBound: {label: "CI Lower", f: function ( data ) {
      math.stat.CurrentCI = math.confInt( data ); // {lowerBound: x, upperBound: y}
      return math.stat.CurrentCI.lowerBound;
  }},
  confIntUpperBound: {label: "CI Upper", f: function () {
      return math.stat.CurrentCI.upperBound;
  }}
};
var idb=function(e){"use strict";let t,n;const r=new WeakMap,o=new WeakMap,s=new WeakMap,a=new WeakMap,i=new WeakMap;let c={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return o.get(e);if("objectStoreNames"===t)return e.objectStoreNames||s.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return p(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function u(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(n||(n=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(f(this),t),p(r.get(this))}:function(...t){return p(e.apply(f(this),t))}:function(t,...n){const r=e.call(f(this),t,...n);return s.set(r,t.sort?t.sort():[t]),p(r)}}function d(e){return"function"==typeof e?u(e):(e instanceof IDBTransaction&&function(e){if(o.has(e))return;const t=new Promise((t,n)=>{const r=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",s),e.removeEventListener("abort",s)},o=()=>{t(),r()},s=()=>{n(e.error||new DOMException("AbortError","AbortError")),r()};e.addEventListener("complete",o),e.addEventListener("error",s),e.addEventListener("abort",s)});o.set(e,t)}(e),n=e,(t||(t=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some(e=>n instanceof e)?new Proxy(e,c):e);var n}function p(e){if(e instanceof IDBRequest)return function(e){const t=new Promise((t,n)=>{const r=()=>{e.removeEventListener("success",o),e.removeEventListener("error",s)},o=()=>{t(p(e.result)),r()},s=()=>{n(e.error),r()};e.addEventListener("success",o),e.addEventListener("error",s)});return t.then(t=>{t instanceof IDBCursor&&r.set(t,e)}).catch(()=>{}),i.set(t,e),t}(e);if(a.has(e))return a.get(e);const t=d(e);return t!==e&&(a.set(e,t),i.set(t,e)),t}const f=e=>i.get(e);const l=["get","getKey","getAll","getAllKeys","count"],D=["put","add","delete","clear"],v=new Map;function b(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!=typeof t)return;if(v.get(t))return v.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,o=D.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!o&&!l.includes(n))return;const s=async function(e,...t){const s=this.transaction(e,o?"readwrite":"readonly");let a=s.store;r&&(a=a.index(t.shift()));const i=await a[n](...t);return o&&await s.done,i};return v.set(t,s),s}return c=(e=>({...e,get:(t,n,r)=>b(t,n)||e.get(t,n,r),has:(t,n)=>!!b(t,n)||e.has(t,n)}))(c),e.deleteDB=function(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",()=>t()),p(n).then(()=>{})},e.openDB=function(e,t,{blocked:n,upgrade:r,blocking:o,terminated:s}={}){const a=indexedDB.open(e,t),i=p(a);return r&&a.addEventListener("upgradeneeded",e=>{r(p(a.result),e.oldVersion,e.newVersion,p(a.transaction))}),n&&a.addEventListener("blocked",()=>n()),i.then(e=>{s&&e.addEventListener("close",()=>s()),o&&e.addEventListener("versionchange",()=>o())}).catch(()=>{}),i},e.unwrap=f,e.wrap=p,e}({});

/*******************************************************************************
 * EventList maintains an ordered list of events
 * @copyright Copyright 2015-2016 Gerd Wagner
 *   Chair of Internet Technology, Brandenburg University of Technology, Germany.
 * @license The MIT License (MIT)
 * @author Gerd Wagner
 ******************************************************************************/
class EventList {
  constructor(a) {
    this.events = Array.isArray(a) ? a : [];
  }
  add(e) {
    this.events.push( e);
    this.events.sort( (e1, e2) => e1.occTime - e2.occTime);
  }
  sort() {
    this.events.sort( (e1, e2) => e1.occTime - e2.occTime);
  }
  getNextOccurrenceTime() {
    if (this.events.length > 0) return this.events[0].occTime;
    else return 0;
  }
  getNextEvent() {
    if (this.events.length > 0) return this.events[0];
    else return null;
  }
  isEmpty() {
    return (this.events.length <= 0);
  }
  removeNextEvents() {
    var nextTime=0, nextEvents=[];
    if (this.events.length === 0) return [];
    nextTime = this.events[0].occTime;
    while (this.events.length > 0 && this.events[0].occTime === nextTime) {
      nextEvents.push( this.events.shift());
    }
    return nextEvents;
  }
  containsEventOfType( evtType) {
    return this.events.some( evt => evt.constructor.name === evtType);
  }
  getActivityEndEvent( acty) {
    return this.events.find( evt => evt.constructor.name === "aCTIVITYeND" && evt.activity === acty);
  }
  toString() {
    var str="";
    if (this.events.length > 0) {
      str = this.events.reduce( function (serialization, e) {
        return serialization +", "+ e.toString();
      }, "");
      str = str.slice(1);
    }
    return str;
  }
  clear() {this.events.length = 0;}
}

/**
 * Predefined class for creating enumerations as special JS objects.
 * @copyright Copyright 2014-20 Gerd Wagner, Chair of Internet Technology,
 *   Brandenburg University of Technology, Germany.
 * @license The MIT License (MIT)
 * @author Gerd Wagner
 * @class
 * @param {string} name  The name of the new enumeration data type.
 * @param {array} enumArg  The labels array or code list map of the enumeration
 *
 * An eNUMERATION has the following properties:
 * name          the name of the enumeration
 * labels        a list of label strings such that enumLabel = labels[enumIndex-1]
 * enumLitNames  a list of normalized names of enumeration literals
 * codeList      a map of code/name pairs
 * MAX           the size of the enumeration
 */
/* globals eNUMERATION */

class eNUMERATION {
  constructor(name, enumArg) {
    var lbl="", LBL="";
    if (typeof name !== "string") {
      throw new Error("The first constructor argument of an enumeration must be a string!");
    }
    this.name = name;
    if (Array.isArray(enumArg)) {
      // a simple enum defined by a list of labels
      if (!enumArg.every( n => (typeof n === "string"))) {
        throw new Error("A list of enumeration labels as the second " +
            "constructor argument must be an array of strings!");
      }
      this.labels = enumArg;
      this.enumLitNames = this.labels;
    } else if (typeof enumArg === "object" && Object.keys(enumArg).length > 0) {
      // a code list defined by a map
      if (!Object.keys(enumArg).every( code => (typeof enumArg[code] === "string"))) {
        throw new Error("All values of a code list map must be strings!");
      }
      this.codeList = enumArg;
      // use codes as the names of enumeration literals
      this.enumLitNames = Object.keys( this.codeList);
      this.labels = this.enumLitNames.map( c => `${enumArg[c]} (${c})`);
    } else {
      throw new Error(
          "Invalid Enumeration constructor argument: " + enumArg);
    }
    this.MAX = this.enumLitNames.length;
    // generate the enumeration literals by capitalizing/normalizing the names
    for (let i=1; i <= this.enumLitNames.length; i++) {
      // replace " " and "-" with "_"
      lbl = this.enumLitNames[i-1].replace(/( |-)/g, "_");
      // convert to array of words, capitalize them, and re-convert
      LBL = lbl.split("_").map(function (lblPart) {
        return lblPart.toUpperCase();
      }).join("_");
      // assign enumeration index
      this[LBL] = i;
    }
    // protect the enumeration from change attempts
    Object.freeze(this);
    // add new enumeration to the population of all enumerations
    eNUMERATION[this.name] = this;
  }
  /*****************************************************************************
   Check if a value represents an enumeration literal or a valid index
   *****************************************************************************/
  isValidEnumLitOrIndex( v) {
    return Number.isInteger(v) && v > 0 && v < this.MAX;
  }
  /*****************************************************************************
   * Serialize a list of enum. literals/indexes as a list of enum. literal names
   *****************************************************************************/
  enumIndexesToNames( a) {
    if (!Array.isArray(a)) throw new Error("The argument must be an Array!");
    return a.map( enumInt => this.enumLitNames[enumInt-1], this).join(", ");
  }
}
