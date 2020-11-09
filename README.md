# @dkh-dev/app

_Simple server app_

## Example

```javascript
'use strict'

const App = require('@dkh-dev/app')


const app = new App()

app.get({
    '/': () => 'Hello from @dkh-dev/app',
    '/about': () => 'Copyright (c) 2019, dangkyokhoang',
})

app.start()
```

## Reference

### Configurations

> Note: The default app is shipped with default configurations to make it work out of the box.

`app.yaml`

```dart
server:
    port: <int> [8080]

    keep_alive_timeout: <int> [5000]
    max_body_size: <int> [1000]

logger:
    info: <String> [production ? data/info.log : stdout] // info log
    error: <String> [production ? data/error.log : stderr] // error log
    debug: <String> [production ? null : stdout] // debug log
    <name>: <String> // logger.<name>()
    // request: data/request.log
    // database: data/database.log

database:
    hostname: <String> [localhost]
    port: <int> [27017]

    name: <String>

    user: <String>
    password: <String>

    pool_size: <int> [1]
    ignore_undefined: <bool> [true]

validator:
    strict: <bool> [true]
    remove_additional: <bool> [true]

key:
    size: <int> [64] // must be equal or greater than id size
    encoding: <String> [base64]
    collection_name: <String> [keys]
```

### App

- `app.db: <Db>`

    ```typescript
    class Db {
      Promise<void> connect() // connects to MongoDB

      Collection get <collection>() // returns a MongoDB Collection
      // db.users.find()
      // db.products.insertOne()

      void close() // closes the database client
    }
    ```

- `app.logger: <Logger>`

    ```typescript
    class Logger {
      void info() // logs to info log file in production environment
                  //   or to console in development environment

      void error()

      void debug() // logs to console in development enviroment;
                    //   does nothing in production environment

      void <name>() // user-defined log stream
      // logger.request(`requesting ${ url }`)
      // logger.database(`querying ${ collection }`)
    }
    ```

- `app.lock()` — locks paths; requires `authorization: <key>` to unlock

    ```javascript
    app.lock([
      '/admin',
    ])
    ```

- `app.use()` — applies middlewares

    ```javascript
    app.use({
      '/': log,

      // middlewares are fail-safe
      // feel free to throw an error from inside
      '/error': () => {
        throw Error('user wants me to fail')
      },
    })
    ```

- `app.schema` — defines schemas or registers validator middlewares

    ```javascript
    app.schema({
      // definition schemas

      story: {
        definitions: {
          id: { type: 'string', maxLength: 20 },
          contents: { type: 'string', maxLength: 1000 },
        },
      },

      // validator middlewares
      // keys starting with '/' are paths

      '/duplicate': {
        type: 'array',
        items: { type: 'integer' },
      },

      '/stories/create': {
        type: 'object',
        properties: {
          contents: { $ref: 'story#/definitions/contents' },
        },
        additionalProperties: false,
      },
    })
    ```

- `app.get()` — registers `GET` handlers

    ```javascript
    app.get({
      '/': home,

      // the return value will be used as the response
      '/random': () => Math.random(),

      // async values work
      '/hello': () => Promise.resolve('hello'),

      // and so do streams
      '/data': () => fs.createReadStream('data.txt'),

      // still you can send response explicitly
      '/write': (request, response) => {
        response.write('text')
      },

      // handlers are fail-safe
      // feel free to throw an error from inside
      '/error': () => {
        throw Error('user has requested an error')
      },
    })
    ```

- `app.post()` — registers `POST` handlers

    ```javascript
    const { HttpError } = require('@dkh-dev/app')

    app.post({
      '/unlock': () => true,

      // what you post is what you get
      '/duplicate' ({ body }) => duplicate(body),

      // handlers are fail-safe
      '/error': ({ body: { code } }) => {
        throw new HttpError(code, `http error`)
      }
    })
    ```

### Commands

- `npx keygen` — generates a key to unlock locked paths

    ```bash
    $ npx keygen --scope '/root /admin' --comment 'root'
    $ npx keygen -s /admin -m admin
    ```
