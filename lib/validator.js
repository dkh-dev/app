'use strict'

const defineLazyProperty = require('./utils/define-lazy-property')

const Ajv = (() => {
  try {
    const Ajv = require('ajv')

    return Ajv
  } catch (error) {
    return null
  }
})()

class Validator {
  constructor(config) {
    this.config = config
  }

  /**
   * Validates data with a schema.
   * @param {(string|object)} schema
   * @param {*} data
   */
  validate(schema, data) {
    const validate = data => this.ajv.validate(schema, data)

    return this.execute(validate, this.ajv, data)
  }

  /**
   * Returns a validator.
   * @param {object} schema
   */
  compile(schema) {
    const validate = this.ajv.compile(schema)

    return data => this.execute(validate, validate, data)
  }

  add(id, schema) {
    this.ajv.addSchema(schema, id)

    return this
  }

  /**
   * @param {function} validate
   * @param {*} instance
   * @param {*} data
   */
  execute(validate, instance, data) {
    const valid = validate(data)

    if (valid) {
      return
    }

    const { errors } = instance
    const message = this.ajv.errorsText(errors)
    const [ info ] = errors

    const error = Error(message)

    // show the first error only
    error.info = info

    throw error
  }
}

defineLazyProperty(Validator.prototype, 'ajv', {
  get() {
    if (!Ajv) {
      throw Error('missing peer dependency ajv')
    }

    const { strict, remove_additional: removeAdditional } = this.config

    return new Ajv({ strict, removeAdditional })
  },
})

module.exports = Validator
