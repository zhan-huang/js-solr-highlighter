import TextAnnotator from 'text-annotator'

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
  'with'
]

export default function highlightByQuery(query, content, options = {}) {
  const excludedFields =
    options.excludedFields === undefined ? [] : options.excludedFields

  let words = []

  const lucene = require('lucene')
  // possible: [\+\-\!\(\)\{\}\[\]\^\"\?\:\\\&\|\'\/\s\*\~]
  const esc = (s, c) => {
    const regex = new RegExp(c, 'g')
    return s.replace(regex, char => {
      return '\\' + char
    })
  }
  const unesc = (s, c) => {
    const regex = new RegExp('\\\\([' + c + '])', 'g')
    return s.replace(regex, (match, char) => {
      return char
    })
  }

  // escape invalid fields and char
  let q = query

  // possible: /([^:\s]+):([^:\s]+)/g
  const regex = /([^(][^:\s]+):([^:][^)]+)/g
  let res
  const fieldVals = []
  const fieldVals2 = []
  while ((res = regex.exec(q)) !== null) {
    const field = res[1].replace(/\(|\)/g, '')
    const fieldVal = res[1] + ':' + res[2]
    if (excludedFields.includes(field)) {
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

  fieldVals.forEach(fv => {
    q = q.replace(fv[0], fv[1])
  })
  fieldVals2.forEach(fv => {
    q = q.replace(fv, esc(fv, ':'))
  })
  q = esc(q, '/')

  // parse the query
  const ast = lucene.parse(q)
  const { start, left, right, operator } = ast

  // add terms to be highlighted
  const addTerm = (words, term, quoted) => {
    term = unesc(term, ':')
    term = unesc(term, '/')
    // if quoted, should change nothing inside
    if (quoted) {
      return words.concat([term])
    } else {
      // remove any char that is neither letter nor number at the start and end of each term
      const terms = term
        .split(/\s/)
        .map(t => t.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, ''))
      return words.concat(terms)
    }
  }

  const astString = JSON.stringify(ast)
  const allOperators = astString.match(/"operator":"([^(,)]+)"/g)
  const allFields = astString.match(/"field":"([^(,)]+)"/g)
  // the !left.quoted condition is not elegant
  if (
    allOperators &&
    allOperators.every(operator => operator === '"operator":"<implicit>"') &&
    allFields &&
    allFields.every(field => field === '"field":"<implicit>"') &&
    !left.quoted
  ) {
    words = addTerm(words, q, false)
  } else {
    const highlightedFields = ['TITLE', '<implicit>']
    const allParentheses = astString.match(/"parenthesized":true/g)
    // not an elegant solution
    if (
      !highlightedFields.includes(left.field) &&
      operator === '<implicit>' &&
      right &&
      right.field === '<implicit>' &&
      !allParentheses
    ) {
      words = addTerm(words, q, true)
    } else {
      if (start !== 'NOT') {
        if (highlightedFields.includes(left.field)) {
          words = addTerm(words, left.term, left.quoted)
        } else if (
          (!left.right || !highlightedFields.includes(left.right.field)) &&
          left.left &&
          highlightedFields.includes(left.left.field)
        ) {
          words = addTerm(words, left.left.term, left.left.quoted)
        }
      }
      if (operator !== 'NOT' && right) {
        if (highlightedFields.includes(right.field)) {
          words = addTerm(words, right.term, right.quoted)
        } else if (
          (!right.right || !highlightedFields.includes(right.right.field)) &&
          right.left &&
          highlightedFields.includes(right.left.field)
        ) {
          words = addTerm(words, right.left.term, right.left.quoted)
        }
      }
    }
  }

  // highlight one word by another
  // some filters may be moved above
  words = words.filter(
    word =>
      word.length &&
      !STOP_WORDS.includes(word.toLowerCase()) &&
      !['AND', 'OR', 'NOT'].includes(word)
  )
  let newContent = content
  if (words.length) {
    const highlighter = new TextAnnotator({
      content
    })
    words.forEach(word => {
      const highlightIndexes = highlighter.searchAll(word, {
        directSearchOptions: {
          caseSensitive: false
        }
      })
      highlightIndexes.forEach(highlightIndex => {
        const loc = highlighter.highlights[highlightIndex].loc
        const text = highlighter.stripedHTML

        const fixVaild = c => {
          const letters = /^[0-9a-zA-Z]+$/
          return !c.match(letters)
        }
        // make sure we do not highlight part of a word
        const prevCharValid = loc[0] === 0 || fixVaild(text.charAt(loc[0] - 1))
        const nextCharValid =
          loc[1] === text.length - 1 || fixVaild(text.charAt(loc[1]))
        if (prevCharValid && nextCharValid) {
          // highlight options can be made customised
          newContent = highlighter.highlight(highlightIndex, {
            content: newContent,
            returnContent: true,
            color: 'transparent',
            highlightClass: 'extra-bold'
          })
        }
      })
    })
  }
  return newContent
}
