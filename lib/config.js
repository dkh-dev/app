'use strict'

const fs = require('fs')

const argv = require('@dkh-dev/argv')
const yaml = require('js-yaml')


const configFile = argv.c || argv.config || 'config.yaml'
const config = yaml.safeLoad(fs.readFileSync(configFile))

module.exports = config
