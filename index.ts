import TextAnnotator from "text-annotator";

const STOP_WORDS: string[] = [
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

function isStopWord(string: string): boolean {
  return STOP_WORDS.includes(string.toLowerCase());
}

interface HighlightByQueryOptions {
  validFields?: string[];
  highlightAll?: boolean;
  highlightClass?: string;
  highlightedFields?: string[];
  highlightIdPattern?: string;
  caseSensitive?: boolean;
}

// validFields are those parsed as fields. If undefined, all will be parsed as fields if they are like x:x
// highlightedFields are those among validFields whose values will be highlighted. If undefined, the values of all valid fields will be highlighted
// can allow more options of text-annotator***
function highlightByQuery(
  query: string,
  content: string,
  {
    validFields,
    highlightAll,
    highlightClass,
    highlightedFields,
    highlightIdPattern,
    caseSensitive,
  }: HighlightByQueryOptions = {}
): string {
  const searchFunc: string =
    highlightAll === undefined || highlightAll ? "searchAll" : "search";

  let words: string[] = [];

  const lucene: any = require("lucene");
  // [\+\-\!\(\)\{\}\[\]\^\"\?\:\\\&\|\'\/\s\*\~]
  const esc = (s: string, c: string): string => {
    const regex: any = new RegExp(c, "g");
    return s.replace(regex, (char) => {
      return "\\" + char;
    });
  };
  const unesc = (s: string, c: string): string => {
    const regex: any = new RegExp("\\\\([" + c + "])", "g");
    return s.replace(regex, (match, char) => {
      return char;
    });
  };

  // escape invalid fields
  let q: string = query;
  const fieldVals: any[] = [];
  const fieldVals2: string[] = [];
  // /([^:\s]+):([^:\s]+)/g
  // deal with cases like xxx:xxx, xxx: xxx
  const regex: any = /([^(\s]+):\s?([^\s)"]+)/g;
  let res: any;
  while ((res = regex.exec(q)) !== null) {
    const field: string = res[1];
    const fieldVal: string = res[0];
    if (validFields !== undefined && !validFields.includes(field)) {
      fieldVals2.push(fieldVal);
    }
  }
  // /([a-zA-Z]+)(\s+):(\s+)([a-zA-Z]+)/g
  // deal with cases like xxx:"xxx", xxx:"xxx
  const regex2: any = /([^\s(]+):\s?("[^"]+"?[^)])/g;
  while ((res = regex2.exec(q)) !== null) {
    const field: string = res[1];
    const fieldVal: string = res[0];
    if (validFields === undefined || validFields.includes(field)) {
      // remove invalid "
      if (res[2].startsWith('"') && !res[2].endsWith('"')) {
        fieldVals.push([fieldVal, res[1] + ":" + res[2].substring(1)]);
      } else if (!res[2].startsWith('"') && res[2].endsWith('"')) {
        fieldVals.push(
          fieldVal,
          res[1] + ":" + res[2].substring(0, res[2].length - 1)
        );
      }
    } else {
      fieldVals2.push(fieldVal);
    }
  }
  fieldVals.forEach((fv) => {
    q = q.replace(fv[0], fv[1]);
  });
  fieldVals2.forEach((fv) => {
    q = q.replace(fv, esc(fv, ":"));
  });
  q = esc(q, "/");

  // parse the query
  const ast: any = lucene.parse(q);

  // add terms to be highlighted
  const { start, left, right, operator } = ast;
  const addTerm = (words: string[], term: string, quoted: boolean) => {
    term = unesc(term, ":");
    term = unesc(term, "/");
    // if quoted, should change nothing inside
    if (quoted) {
      return words.concat([term]);
    } else {
      // remove any char that is neither letter nor number at the start and end of each term
      const terms: string[] = term
        .split(/\s/)
        .map((t) =>
          t.replace(/^[^a-zA-Z0-9]+/, "").replace(/[^a-zA-Z0-9]+$/, "")
        );
      return words.concat(terms);
    }
  };
  const astString: any = JSON.stringify(ast);
  const allOperators: any = astString.match(/"operator":"([^(,)]+)"/g);
  const allFields: any = astString.match(/"field":"([^(,)]+)"/g);
  // the !left.quoted condition is not elegant***
  if (
    allOperators &&
    allOperators.every((operator) => operator === '"operator":"<implicit>"') &&
    allFields &&
    allFields.every((field) => field === '"field":"<implicit>"') &&
    !left.quoted
  ) {
    words = addTerm(words, q, false);
  } else {
    const allParentheses: any = astString.match(/"parenthesized":true/g);
    if (
      highlightedFields !== undefined &&
      !highlightedFields.includes("<implicit>")
    ) {
      highlightedFields.push("<implicit>");
    }
    const canHighlight = (field: string): string | boolean =>
      highlightedFields === undefined
        ? field
        : highlightedFields.includes(field);

    // not an elegant solution***
    if (
      !canHighlight(left.field) &&
      operator === "<implicit>" &&
      right &&
      right.field === "<implicit>" &&
      !allParentheses
    ) {
      words = addTerm(words, q, true);
    } else {
      if (start !== "NOT") {
        if (canHighlight(left.field)) {
          words = addTerm(words, left.term, left.quoted);
        } else {
          if (left.left && canHighlight(left.left.field)) {
            words = addTerm(words, left.left.term, left.left.quoted);
          }
          if (
            left.operator !== "NOT" &&
            left.right &&
            canHighlight(left.right.field)
          ) {
            words = addTerm(words, left.right.term, left.right.quoted);
          }
        }
      }
      if (operator !== "NOT" && right) {
        if (canHighlight(right.field)) {
          words = addTerm(words, right.term, right.quoted);
        } else if (
          (!right.right || !canHighlight(right.right.field)) &&
          right.left &&
          canHighlight(right.left.field)
        ) {
          words = addTerm(words, right.left.term, right.left.quoted);
        }
      }
    }
  }

  // highlight one word by another
  // some filters may be moved up***
  words = words.filter(
    (word) =>
      word.length && !isStopWord(word) && !["AND", "OR", "NOT"].includes(word)
  );
  let newContent: string = content;
  if (words.length) {
    const highlighter: any = new TextAnnotator({
      content,
    });
    words.forEach((word) => {
      let res: any = highlighter[searchFunc](word, {
        directSearchOptions: {
          caseSensitive: caseSensitive !== undefined && caseSensitive,
        },
      });
      res = searchFunc === "search" ? [res] : res;
      res.forEach((highlightIndex) => {
        const loc: [number, number] =
          highlighter.highlights[highlightIndex].loc;
        const text: string = highlighter.stripedHTML;

        const fixVaild = (c: string): boolean => {
          const letters: any = /^[0-9a-zA-Z]+$/;
          return !c.match(letters);
        };
        // make sure we do not highlight part of a word
        // this logic may be moved up***
        const prevCharValid: boolean =
          loc[0] === 0 || fixVaild(text.charAt(loc[0] - 1));
        const nextCharValid: boolean =
          loc[1] === text.length - 1 || fixVaild(text.charAt(loc[1]));
        if (prevCharValid && nextCharValid) {
          newContent = highlighter.highlight(highlightIndex, {
            highlightIdPattern,
            highlightClass,
          });
        }
      });
    });
  }
  return newContent;
}

export { STOP_WORDS, isStopWord, highlightByQuery };
