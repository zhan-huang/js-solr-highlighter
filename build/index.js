"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.highlightByQuery = exports.isStopWord = exports.STOP_WORDS = void 0;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const text_annotator_1 = require("text-annotator");
const STOP_WORDS = ['a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 's', 'such', 't', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with'];
exports.STOP_WORDS = STOP_WORDS;
function isStopWord(string) {
  return STOP_WORDS.includes(string.toLowerCase());
}
exports.isStopWord = isStopWord;
// validFields are those parsed as fields. If undefined, all will be parsed as fields if they are like x:x
// highlightedFields are those among validFields whose values will be highlighted. If undefined, the values of all valid fields will be highlighted
function highlightByQuery(query, content, options = {}) {
  // can allow more options of text-annotator***
  const {
    validFields,
    highlightAll,
    highlightClass,
    highlightedFields,
    highlightIdPattern,
    caseSensitive
  } = options;
  const searchFunc = highlightAll === undefined || highlightAll ? 'searchAll' : 'search';
  let words = [];
  const lucene = require('lucene');
  // [\+\-\!\(\)\{\}\[\]\^\"\?\:\\\&\|\'\/\s\*\~]
  const esc = (s, c) => {
    const regex = new RegExp(c, 'g');
    return s.replace(regex, char => {
      return '\\' + char;
    });
  };
  const unesc = (s, c) => {
    const regex = new RegExp('\\\\([' + c + '])', 'g');
    return s.replace(regex, (match, char) => {
      return char;
    });
  };
  // escape invalid fields
  let q = query;
  const fieldVals = [];
  const fieldVals2 = [];
  // /([^:\s]+):([^:\s]+)/g
  // deal with cases like xxx:xxx, xxx: xxx
  const regex = /([^(\s]+):\s?([^\s)"]+)/g;
  let res;
  while ((res = regex.exec(q)) !== null) {
    const field = res[1];
    const fieldVal = res[0];
    if (validFields !== undefined && !validFields.includes(field)) {
      fieldVals2.push(fieldVal);
    }
  }
  // /([a-zA-Z]+)(\s+):(\s+)([a-zA-Z]+)/g
  // deal with cases like xxx:"xxx", xxx:"xxx
  const regex2 = /([^\s(]+):\s?("[^"]+"?[^)])/g;
  while ((res = regex2.exec(q)) !== null) {
    const field = res[1];
    const fieldVal = res[0];
    if (validFields === undefined || validFields.includes(field)) {
      // remove invalid "
      if (res[2].startsWith('"') && !res[2].endsWith('"')) {
        fieldVals.push([fieldVal, res[1] + ':' + res[2].substring(1)]);
      } else if (!res[2].startsWith('"') && res[2].endsWith('"')) {
        fieldVals.push(fieldVal, res[1] + ':' + res[2].substring(0, res[2].length - 1));
      }
    } else {
      fieldVals2.push(fieldVal);
    }
  }
  fieldVals.forEach(fv => {
    q = q.replace(fv[0], fv[1]);
  });
  fieldVals2.forEach(fv => {
    q = q.replace(fv, esc(fv, ':'));
  });
  q = esc(q, '/');
  // parse the query
  const ast = lucene.parse(q);
  // add terms to be highlighted
  const {
    start,
    left,
    right,
    operator
  } = ast;
  const addTerm = (words, term, quoted) => {
    term = unesc(term, ':');
    term = unesc(term, '/');
    // if quoted, should change nothing inside
    if (quoted) {
      return words.concat([term]);
    } else {
      // remove any char that is neither letter nor number at the start and end of each term
      const terms = term.split(/\s/).map(t => t.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, ''));
      return words.concat(terms);
    }
  };
  const astString = JSON.stringify(ast);
  const allOperators = astString.match(/"operator":"([^(,)]+)"/g);
  const allFields = astString.match(/"field":"([^(,)]+)"/g);
  // the !left.quoted condition is not elegant***
  if (allOperators && allOperators.every(operator => operator === '"operator":"<implicit>"') && allFields && allFields.every(field => field === '"field":"<implicit>"') && !left.quoted) {
    words = addTerm(words, q, false);
  } else {
    const allParentheses = astString.match(/"parenthesized":true/g);
    if (highlightedFields !== undefined && !highlightedFields.includes('<implicit>')) {
      highlightedFields.push('<implicit>');
    }
    const canHighlight = field => highlightedFields === undefined ? field : highlightedFields.includes(field);
    // not an elegant solution***
    if (!canHighlight(left.field) && operator === '<implicit>' && right && right.field === '<implicit>' && !allParentheses) {
      words = addTerm(words, q, true);
    } else {
      if (start !== 'NOT') {
        if (canHighlight(left.field)) {
          words = addTerm(words, left.term, left.quoted);
        } else {
          if (left.left && canHighlight(left.left.field)) {
            words = addTerm(words, left.left.term, left.left.quoted);
          }
          if (left.operator !== 'NOT' && left.right && canHighlight(left.right.field)) {
            words = addTerm(words, left.right.term, left.right.quoted);
          }
        }
      }
      if (operator !== 'NOT' && right) {
        if (canHighlight(right.field)) {
          words = addTerm(words, right.term, right.quoted);
        } else if ((!right.right || !canHighlight(right.right.field)) && right.left && canHighlight(right.left.field)) {
          words = addTerm(words, right.left.term, right.left.quoted);
        }
      }
    }
  }
  // highlight one word by another
  // some filters may be moved up***
  words = words.filter(word => word.length && !isStopWord(word) && !['AND', 'OR', 'NOT'].includes(word));
  let newContent = content;
  if (words.length) {
    const highlighter = new text_annotator_1.default({
      content
    });
    words.forEach(word => {
      let res = highlighter[searchFunc](word, {
        directSearchOptions: {
          caseSensitive: caseSensitive !== undefined && caseSensitive
        }
      });
      res = searchFunc === 'search' ? [res] : res;
      res.forEach(highlightIndex => {
        const loc = highlighter.highlights[highlightIndex].loc;
        const text = highlighter.stripedHTML;
        const fixVaild = c => {
          const letters = /^[0-9a-zA-Z]+$/;
          return !c.match(letters);
        };
        // make sure we do not highlight part of a word
        // this logic may be moved up***
        const prevCharValid = loc[0] === 0 || fixVaild(text.charAt(loc[0] - 1));
        const nextCharValid = loc[1] === text.length - 1 || fixVaild(text.charAt(loc[1]));
        if (prevCharValid && nextCharValid) {
          newContent = highlighter.highlight(highlightIndex, {
            highlightIdPattern,
            highlightClass
          });
        }
      });
    });
  }
  return newContent;
}
exports.highlightByQuery = highlightByQuery;