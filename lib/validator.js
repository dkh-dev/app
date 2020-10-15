'use strict'

const Ajv = require('ajv')


class Validator {
  constructor(app) {
    this.app = app

    const { strict } = this.app.config

    this.ajv = new Ajv({ strict })

    this.validators = {}

    this.validator = path => req => {
      const validate = this.validators[ path ]

      validate(req)
    }
  }

  add(schema) {
    this.ajv.addSchema(schema)

    return this
  }

  register(path, schema) {
    const registered = this.validators.hasOwnProperty(path)

    if (!registered) {
      this.app.use({ [ path ]: this.validator(path) })
    }

    this.validators[ path ] = this.compile(schema)

    return this
  }

  compile(schema) {
    const validate = this.ajv.compile(schema)

    return data => {
      const valid = validate(data)

      if (valid) {
        return valid
      }

      const { errors } = validate
      const message = this.ajv.errorsText(errors)
      const [ info ] = errors

      const error = Error(message)

      error.info = info

      throw error
    }
  }
}

module.exports = Validator
