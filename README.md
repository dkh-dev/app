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

> Don't worry if these configurations are overwhelming to you. The default app is shipped with default configurations to make it work out of the box.

`config.yaml`
```dart
server:
    port: <int> [8080]

    ssl_port: <int> [4343]
    ssl_certificate: <String> // ssl certificate file path
    ssl_certificate_key: <String> // ssl certificate key file path

    post_max_size: <int> [1000]

    keep_alive_timeout: <int> [5000]

logger:
    info: <String> [data/info.log] // info log file path
    error: <String> [data/error.log] // error log file path
    <name>: <String> // logger.<name>() file path
    // request: data/request.log
    // database: data/database.log

database:
    hostname: <String> [localhost]
    port: <int> [27017]

    name: <String>

    user: <String>
    password: <String>
    authentication_database: <String> [.name]

key:
    secret: <String>

    size: <int> [96] // must be equal or greater than id size
    id_size: <int> [32]
    encoding: <String> [base64]
```

### App

- `app.db: <Db>` — a `Db` instance
    ```typescript
    class Db {
        // Promise<void> connect() // connects to MongoDB

        Collection get <collection>() // returns MongoDB Collection
        // db.session.createIndex()
        // db.user.find()
        // db.cart.updateOne()

        // void close() // closes the database client
    }
    ```

- `app.logger: <Logger>` — a `Logger` instance
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

- `app.lock()` — locks routes; requires `authorization: <key>` to unlock
    ```javascript
    // this works only if config.key is set
    // otherwise, locked routes are always open
    app.lock([
        '/unlock-me',
        '/unlock-me-too',
    ])
    ```

- `app.use()` — applies middlewares
    ```javascript
    app.use({
        '/*': logThisRequest,

        // middlewares are fail-safe, feel free to throw an error from inside
        '/should-fail': () => {
            throw Error('user wants me to fail')
        },
    })
    ```

- `app.get()` — registers `GET` handlers
    ```javascript
    app.get({
        '/': homePage,

        // there's no need to use res.send() explicitly
        //   as the return value will be used as the response
        '/random-number': () => Math.random(),
        // even async values work
        '/greet-async': () => Promise.resolve('hello'),
        // and so do streams
        '/data': () => fs.createReadStream('data.txt'),

        // still you can send response explicitly
        '/send-explicitly': (_, res) => {
            res.send({ explicit: true })
        },

        // handlers are fail-safe, feel free to throw an error from inside
        '/gimme-an-error': () => {
            throw Error('user has requested an error')
        },
    })
    ```

- `app.post()` — registers `POST` handlers
    ```javascript
    const HttpError = require('@dkh-dev/app/lib/http-error')

    // ...

    app.post({
        '/unlock-me': () => ({
            unlocked: true,
            message: 'your authentication key works',
        }),

        // what you post is what you get
        '/copy' ({ body }) => body,

        // handlers are fail-safe
        '/gimme-an-error/specific-code': ({ body: { code } }) => {
            throw new HttpError(code, `user has requested a ${ code } error`)
        }
    })
    ```

### Commands

- `npx keygen` — generates a key to unlock locked routes
