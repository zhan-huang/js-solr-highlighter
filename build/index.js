"use strict";
exports.__esModule = true;
exports.highlightByQuery = exports.isStopWord = exports.STOP_WORDS = void 0;
var text_annotator_1 = require("text-annotator");
var STOP_WORDS = [
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "if",
    "in",
    "into",
    "is",
    "it",
    "no",
    "not",
    "of",
    "on",
    "or",
    "s",
    "such",
    "t",
    "that",
    "the",
    "their",
    "then",
    "there",
    "these",
    "they",
    "this",
    "to",
    "was",
    "will",
    "with",
];
exports.STOP_WORDS = STOP_WORDS;
function isStopWord(string) {
    return STOP_WORDS.includes(string.toLowerCase());
}
exports.isStopWord = isStopWord;
function highlightByQuery(query, content, _a) {
    var _b = _a === void 0 ? {} : _a, validFields = _b.validFields, highlightAll = _b.highlightAll, highlightClass = _b.highlightClass, highlightedFields = _b.highlightedFields, highlightIdPattern = _b.highlightIdPattern, caseSensitive = _b.caseSensitive;
    var searchFunc = highlightAll === undefined || highlightAll ? "searchAll" : "search";
    var words = [];
    var lucene = require("lucene");
    var esc = function (s, c) {
        var regex = new RegExp(c, "g");
        return s.replace(regex, function (char) {
            return "\\" + char;
        });
    };
    var unesc = function (s, c) {
        var regex = new RegExp("\\\\([" + c + "])", "g");
        return s.replace(regex, function (match, char) {
            return char;
        });
    };
    var q = query;
    var fieldVals = [];
    var fieldVals2 = [];
    var regex = /([^(\s]+):\s?([^\s)"]+)/g;
    var res;
    while ((res = regex.exec(q)) !== null) {
        var field = res[1];
        var fieldVal = res[0];
        if (validFields !== undefined && !validFields.includes(field)) {
            fieldVals2.push(fieldVal);
        }
    }
    var regex2 = /([^\s(]+):\s?("[^"]+"?[^)])/g;
    while ((res = regex2.exec(q)) !== null) {
        var field = res[1];
        var fieldVal = res[0];
        if (validFields === undefined || validFields.includes(field)) {
            if (res[2].startsWith('"') && !res[2].endsWith('"')) {
                fieldVals.push([fieldVal, res[1] + ":" + res[2].substring(1)]);
            }
            else if (!res[2].startsWith('"') && res[2].endsWith('"')) {
                fieldVals.push(fieldVal, res[1] + ":" + res[2].substring(0, res[2].length - 1));
            }
        }
        else {
            fieldVals2.push(fieldVal);
        }
    }
    fieldVals.forEach(function (fv) {
        q = q.replace(fv[0], fv[1]);
    });
    fieldVals2.forEach(function (fv) {
        q = q.replace(fv, esc(fv, ":"));
    });
    q = esc(q, "/");
    var ast = lucene.parse(q);
    var start = ast.start, left = ast.left, right = ast.right, operator = ast.operator;
    var addTerm = function (words, term, quoted) {
        term = unesc(term, ":");
        term = unesc(term, "/");
        if (quoted) {
            return words.concat([term]);
        }
        else {
            var terms = term
                .split(/\s/)
                .map(function (t) {
                return t.replace(/^[^a-zA-Z0-9]+/, "").replace(/[^a-zA-Z0-9]+$/, "");
            });
            return words.concat(terms);
        }
    };
    var astString = JSON.stringify(ast);
    var allOperators = astString.match(/"operator":"([^(,)]+)"/g);
    var allFields = astString.match(/"field":"([^(,)]+)"/g);
    if (allOperators &&
        allOperators.every(function (operator) { return operator === '"operator":"<implicit>"'; }) &&
        allFields &&
        allFields.every(function (field) { return field === '"field":"<implicit>"'; }) &&
        !left.quoted) {
        words = addTerm(words, q, false);
    }
    else {
        var allParentheses = astString.match(/"parenthesized":true/g);
        if (highlightedFields !== undefined &&
            !highlightedFields.includes("<implicit>")) {
            highlightedFields.push("<implicit>");
        }
        var canHighlight = function (field) {
            return highlightedFields === undefined
                ? field
                : highlightedFields.includes(field);
        };
        if (!canHighlight(left.field) &&
            operator === "<implicit>" &&
            right &&
            right.field === "<implicit>" &&
            !allParentheses) {
            words = addTerm(words, q, true);
        }
        else {
            if (start !== "NOT") {
                if (canHighlight(left.field)) {
                    words = addTerm(words, left.term, left.quoted);
                }
                else {
                    if (left.left && canHighlight(left.left.field)) {
                        words = addTerm(words, left.left.term, left.left.quoted);
                    }
                    if (left.operator !== "NOT" &&
                        left.right &&
                        canHighlight(left.right.field)) {
                        words = addTerm(words, left.right.term, left.right.quoted);
                    }
                }
            }
            if (operator !== "NOT" && right) {
                if (canHighlight(right.field)) {
                    words = addTerm(words, right.term, right.quoted);
                }
                else if ((!right.right || !canHighlight(right.right.field)) &&
                    right.left &&
                    canHighlight(right.left.field)) {
                    words = addTerm(words, right.left.term, right.left.quoted);
                }
            }
        }
    }
    words = words.filter(function (word) {
        return word.length && !isStopWord(word) && !["AND", "OR", "NOT"].includes(word);
    });
    var newContent = content;
    if (words.length) {
        var highlighter_1 = new text_annotator_1["default"]({
            content: content
        });
        words.forEach(function (word) {
            var res = highlighter_1[searchFunc](word, {
                directSearchOptions: {
                    caseSensitive: caseSensitive !== undefined && caseSensitive
                }
            });
            res = searchFunc === "search" ? [res] : res;
            res.forEach(function (highlightIndex) {
                var loc = highlighter_1.highlights[highlightIndex].loc;
                var text = highlighter_1.stripedHTML;
                var fixVaild = function (c) {
                    var letters = /^[0-9a-zA-Z]+$/;
                    return !c.match(letters);
                };
                var prevCharValid = loc[0] === 0 || fixVaild(text.charAt(loc[0] - 1));
                var nextCharValid = loc[1] === text.length - 1 || fixVaild(text.charAt(loc[1]));
                if (prevCharValid && nextCharValid) {
                    newContent = highlighter_1.highlight(highlightIndex, {
                        highlightIdPattern: highlightIdPattern,
                        highlightClass: highlightClass
                    });
                }
            });
        });
    }
    return newContent;
}
exports.highlightByQuery = highlightByQuery;
//# sourceMappingURL=index.js.map