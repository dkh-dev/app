'use strict'

const { static: serve } = require('express')

class Assets {
  constructor(app) {
    this.app = app
  }

  activate() {
    const { settings: { routes: { assets } } } = this.app

    if (!assets) {
      return
    }

    const entries = Object.entries(assets)

    entries.forEach(([ path, options ]) => {
      if (Array.isArray(options)) {
        options.forEach(options => this.serve(path, options))
      } else {
        this.serve(path, options)
      }
    })
  }

  serve(path, setting) {
    const { middlewares } = this.app

    if (typeof setting === 'string') {
      const root = setting

      middlewares.mount(path, serve(root))
    } else {
      const { root, ...options } = setting

      middlewares.mount(path, serve(root, options))
    }
  }
}

module.exports = Assets
