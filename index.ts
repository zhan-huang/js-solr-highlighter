// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import TextAnnotator from 'text-annotator'

type HighlightOptions = {
  validFields?: string[],
  highlightAll?: boolean,
  highlightClass?: string,
  highlightedFields?: string[],
  highlightIdPattern?: string,
  caseSensitive?: boolean
}

const STOP_WORDS = [
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'if',
  'in',
  'into',
  'is',
  'it',
  'no',
  'not',
  'of',
  'on',
  'or',
  's',
  'such',
  't',
  'that',
  'the',
  'their',
  'then',
  'there',
  'these',
  'they',
  'this',
  'to',
  'was',
  'will',
  'with',
]

function isStopWord(string: string): boolean {
  return STOP_WORDS.includes(string.toLowerCase())
}

// validFields are those parsed as fields. If undefined, all will be parsed as fields if they are like x:x
// highlightedFields are those among validFields whose values will be highlighted. If undefined, the values of all valid fields will be highlighted
function highlightByQuery(query: string, content: string, options: HighlightOptions = {}): string {
  // can allow more options of text-annotator***
  const {
    validFields,
    highlightAll,
    highlightClass,
    highlightedFields,
    highlightIdPattern,
    caseSensitive,
  } = options
  const searchFunc =
    highlightAll === undefined || highlightAll ? 'searchAll' : 'search'

  let words: string[] = []

  const lucene = require('lucene')
  // [\+\-\!\(\)\{\}\[\]\^\"\?\:\\\&\|\'\/\s\*\~]
  const esc = (s: string, c: string) => {
    const regex = new RegExp(c, 'g')
    return s.replace(regex, (char) => {
      return '\\' + char
    })
  }
  const unesc = (s: string, c: string) => {
    const regex = new RegExp('\\\\([' + c + '])', 'g')
    return s.replace(regex, (match, char) => {
      return char
    })
  }

  // escape invalid fields
  let q = query
  const fieldVals = []
  const fieldVals2 = []
  // /([^:\s]+):([^:\s]+)/g
  // deal with cases like xxx:xxx, xxx: xxx
  const regex = /([^(\s]+):\s?([^\s)"]+)/g
  let res: RegExpExecArray | null
  while ((res = regex.exec(q)) !== null) {
    const field = res[1]
    const fieldVal = res[0]
    if (validFields !== undefined && !validFields.includes(field)) {
      fieldVals2.push(fieldVal)
    }
  }
  // /([a-zA-Z]+)(\s+):(\s+)([a-zA-Z]+)/g
  // deal with cases like xxx:"xxx", xxx:"xxx
  const regex2 = /([^\s(]+):\s?("[^"]+"?[^)])/g
  while ((res = regex2.exec(q)) !== null) {
    const field = res[1]
    const fieldVal = res[0]
    if (validFields === undefined || validFields.includes(field)) {
      // remove invalid "
      if (res[2].startsWith('"') && !res[2].endsWith('"')) {
        fieldVals.push([fieldVal, res[1] + ':' + res[2].substring(1)])
      } else if (!res[2].startsWith('"') && res[2].endsWith('"')) {
        fieldVals.push(
          fieldVal,
          res[1] + ':' + res[2].substring(0, res[2].length - 1)
        )
      }
    } else {
      fieldVals2.push(fieldVal)
    }
  }
  fieldVals.forEach((fv) => {
    q = q.replace(fv[0], fv[1])
  })
  fieldVals2.forEach((fv) => {
    q = q.replace(fv, esc(fv, ':'))
  })
  q = esc(q, '/')

  // parse the query
  const ast = lucene.parse(q)

  // add terms to be highlighted
  const { start, left, right, operator } = ast
  const addTerm = (words: string[], term: string, quoted: boolean) => {
    term = unesc(term, ':')
    term = unesc(term, '/')
    // if quoted, should change nothing inside
    if (quoted) {
      return words.concat([term])
    } else {
      // remove any char that is neither letter nor number at the start and end of each term
      const terms = term
        .split(/\s/)
        .map((t) =>
          t.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9\*]+$/, '')
        )
      return words.concat(terms)
    }
  }
  const astString = JSON.stringify(ast)
  const allOperators = astString.match(/"operator":"([^(,)]+)"/g)
  const allFields = astString.match(/"field":"([^(,)]+)"/g)
  // the !left.quoted condition is not elegant***
  if (
    allOperators &&
    allOperators.every((operator) => operator === '"operator":"<implicit>"') &&
    allFields &&
    allFields.every((field) => field === '"field":"<implicit>"') &&
    !left.quoted
  ) {
    words = addTerm(words, q, false)
  } else {
    const allParentheses = astString.match(/"parenthesized":true/g)
    if (
      highlightedFields !== undefined &&
      !highlightedFields.includes('<implicit>')
    ) {
      highlightedFields.push('<implicit>')
    }
    const canHighlight = (field: string) =>
      highlightedFields === undefined
        ? field
        : highlightedFields.includes(field)

    // not an elegant solution***
    if (
      !canHighlight(left.field) &&
      operator === '<implicit>' &&
      right &&
      right.field === '<implicit>' &&
      !allParentheses
    ) {
      words = addTerm(words, q, true)
    } else {
      if (start !== 'NOT') {
        if (canHighlight(left.field)) {
          words = addTerm(words, left.term, left.quoted)
        } else {
          if (left.left && canHighlight(left.left.field)) {
            words = addTerm(words, left.left.term, left.left.quoted)
          }
          if (
            left.operator !== 'NOT' &&
            left.right &&
            canHighlight(left.right.field)
          ) {
            words = addTerm(words, left.right.term, left.right.quoted)
          }
        }
      }
      if (operator !== 'NOT' && right) {
        if (canHighlight(right.field)) {
          words = addTerm(words, right.term, right.quoted)
        } else if (
          (!right.right || !canHighlight(right.right.field)) &&
          right.left &&
          canHighlight(right.left.field)
        ) {
          words = addTerm(words, right.left.term, right.left.quoted)
        }
      }
    }
  }

  // some filters may be moved up***
  words = words.filter(
    (word) =>
      word.length && !isStopWord(word) && !['AND', 'OR', 'NOT'].includes(word)
  )
  for (let i = 0; i < words.length; i++) {
    if (words[i].endsWith('*')) {
      words[i] = words[i].slice(0, words[i].length - 1)
      let index = content.indexOf(words[i]) + words[i].length;
      while(content[index] !== ' ' && index !== content.length - 1) {
        words[i] += content[index]
        index++
      }
    }
  }

  // highlight one word by another
  let newContent = content
  if (words.length) {
    const highlighter = new TextAnnotator({
      content,
    })
    words.forEach((word) => {
      let res = highlighter[searchFunc](word, {
        directSearchOptions: {
          caseSensitive: caseSensitive !== undefined && caseSensitive,
        },
      })
      res = searchFunc === 'search' ? [res] : res
      res.forEach((highlightIndex: number) => {
        const loc = highlighter.highlights[highlightIndex].loc
        const text = highlighter.stripedHTML

        const fixVaild = (c: string) => {
          const letters = /^[0-9a-zA-Z]+$/
          return !c.match(letters)
        }
        // make sure we do not highlight part of a word
        // this logic may be moved up***
        const prevCharValid = loc[0] === 0 || fixVaild(text.charAt(loc[0] - 1))
        const nextCharValid =
          loc[1] === text.length - 1 || fixVaild(text.charAt(loc[1]))
        if (prevCharValid && nextCharValid) {
          newContent = highlighter.highlight(highlightIndex, {
            highlightIdPattern,
            highlightClass,
          })
        }
      })
    })
  }
  return newContent
}

export { STOP_WORDS, isStopWord, highlightByQuery }
