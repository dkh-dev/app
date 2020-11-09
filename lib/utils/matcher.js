'use strict'

const TEXT = 0
const WILDCARD = 1
const PARAM = 2

const parse = (path, exact = true) => {
  const definition = path
    .split('/')
    .map(value => {
      if (value === '*') {
        return { type: WILDCARD }
      }

      if (value.startsWith(':')) {
        return { type: PARAM, value: value.substr(1) }
      }

      return { type: TEXT, value }
    })

  if (!exact) {
    const [ { type, value } ] = definition.slice(-1)

    // ends with /
    if (type === TEXT && value === '') {
      definition.splice(-1, 1, { type: WILDCARD })
    }
  }

  return definition
}

const invalid = (length, exact, values) => {
  // verify length against definition's length
  if (values.length < length || (exact && values.length !== length)) {
    return true
  }

  // insecure values
  for (let i = 0; i < values.length; i++) {
    if (values[ i ] === '..' || values[ i ] === '...') {
      return true
    }
  }

  return false
}

const match = (definition, values) => {
  const params = {}

  for (let i = 0; i < definition.length; i++) {
    // eslint-disable-next-line default-case
    switch (definition[ i ].type) {
      case TEXT:
        if (values[ i ] !== definition[ i ].value) {
          return false
        }
        break
      case WILDCARD:
        break
      case PARAM:
        params[ definition[ i ].value ] = values[ i ]
        break
    }
  }

  return params
}

const matcher = (path, exact = true) => {
  const definition = parse(path, exact)

  return path => {
    const values = path.split('/')

    if (invalid(definition.length, exact, values)) {
      return false
    }

    return match(definition, values)
  }
}

module.exports = {
  parse,
  matcher,
  types: {
    TEXT,
    WILDCARD,
    PARAM,
  },
}
