# customs-request

## Installation

### Using npm:

```bash
$ npm install customs-request
```

## Configuration

- ### main_dir `string`
  Директория относительно которой будут находиться все файлы проекта, корень проекта - _задается абсолютным путем_.
- ### error_pages_dir `string`
  Директория для страниц ошибок имя страницы должно соответствовать коду ошибки - _задается абсолютным путем_.
    - 404.html
    - 503.html
    - 401.html
    - ...

- ### urls `array`
  Указать можно путь к директории, файлу или имя приложению и его метод. Ограничение для директории/приложения
  распространяется на все вложенные файлы и директории/методы, при условии, если вложенный файл или директория/метод не
  указаны отдельно, в таком случае действует указанные ограничение.
    - `objekt`
        - **value** `string` путь относительно _main_dir_ | имя приложение | имя приложение и метода.
        - **access_level** **|** **access_level_only** `number` уровень доступа урал: main admin - 0, admin - 1, user -
          2, не подтвержденный user - 3. Если **access_level**: урл будет доступен от указанного до наивысшего. **
          access_level_only**: Только указанный. Если access_level не указан доступно для всех посетителей.
        - **app** `boolean` является ли приложением, если false или не указан, значит это путь к директории/файлу

- ### path_to_app_dir `string`
  путь к коллекции пользовательских приложений
    - Уровень доступа к приложению или конкретному методу приложения устанавливается в конфиге.
    - Вызов метода: `/app_name/method_name?`.
    - ### db `object`: представление базы данных, объект с методами:
        - `register_user()`
            - Аргументы:
                - `object`
                    - email* `string`
                    - password*  `string`,
                    - token* `string`,
                    - user_level* `string`,
                    - ... ( other_field)`string`,

            - Возвращает:
                - `string` id юзера в случае успеха
                    - ИЛИ
                - `boolean` false в противном случае
                  <br><br/>
        - `update_user_field()`
            - Аргументы:
                - field_name* `string`
                - new_value*  `string`,
                - user_id* `string`,

            - Возвращает:
                - `boolean`
                    - **true** поле в таблице users обновлено успешно
                    - **false** ошибка обновления
                      <br><br/>
        - `get_users()`
            - Возвращает:
                - `array` массив строк из таблицы users
                    - `object`
                        - email* `string`
                        - password*  `string`,
                        - token* `string`,
                        - user_level* `string`,
                        - ... ( other_field)`string`,
                - **ИЛИ**
                - `boolean` false в противном случае

### Пример файла config

```js
// server.config.js

const path = require("path");
const db = require('./db'); //Объект с метадами для записи и чтения таблицы users в БД.
const config = {
    main_dir: path.join(__dirname, '/src/assets'), // main project directory. Use full path - __dirname, 'current_dir'
    error_pages_dir: path.join(__dirname, '/src/assets/pages_errors'), // directory with error pages: 404.html, 401.html, ..., .
    urls: [
        {
            value: '/sys_app',
            access_level: 1,
            app: true
            // Доступны все методы приложения sys_app для пользователей с уровнем 1, 0 (admin, main_admin)
        },
        {
            value: '/sys_app/list_users',
            access_level: 2,
            app: true
            // Метод list_users приложения sys_app доступен  пользователей с уровнем 2, 1, 0 (user, admin, main_admin)
        },
        {
            value: '/users',
            access_level_only: 2,
            app: true
            // Директория users доступно только level 2 (user)
        },
        {
            value: '/users/img_publick',
            app: true
            // Директория users доступно только level 2 (user), но под дириктория img_publick доступна всем 
        },
        {
            value: '/users/statistic.json',
            access_level: 1,
            app: true
            // Директория users доступно только level 2 (user), 
            // но файл /users/statistic.json' доступен level 1, 0 (admin, main_admin)
        },
        {
            value: '/free_app',
            app: true,
            // Приложение free_app доступно всем
        },
        {
            value: '/free_app/num_call',
            access_level: 1,
            app: true,
            // Приложение free_app доступно всем, но его метод num_call доступен только 1 и 0 - admin, main_admin
        },
    ],
    path_to_app_dir: path.join(__dirname, './apps'),
    db

    // db.register_user()
    // db.update_user_field()
    // db.get_users()
}

module.exports = config


```

## REST API

### Регистрация пользователя

**Метод POST:** `/ident/register_user?`

```js
//Клиент для регистрации должен придоставить форму с обязательными полями:

body = {
    email: 'name@email.com',
    password: '123_password',
    answer_antibot: "Фраза отвте на антибот",
    id_task_antibot: "KYT76K",
}

response = "ок"
```

**Порядок:**

- Клиент
    1) запрашивает задание антибот или пользуется ранее запрошенным (у каждого решения **два** использования)
    2) представляет пустую форму пользователю для регистрации
    3) после ввода отправляет запрос на сервер, ответ:
        - 200 ок - все ок
        - 401 email_taken _- занят уже_
        - 401 email_syntax_error _- не правильный синтаксис у e-mail_
        - 401 password_syntax_error _- не правильный синтаксис у password_
        - 401 check_bot_error _- не прошел проверку на бот_

### Авторизация пользователя

**Метод POST:** `/ident/auth_user?`

```js
//Клиент для авторизации должен придоставить форму с полями:

body = {
    email: 'name@email.com',
    password: '123_password',
    answer_antibot: "Фраза отвте на антибот",
    id_task_antibot: "KYT76K",
}

response = "ок"
```

**Порядок:**

- Клиент
    1) запрашивает задание антибот или пользуется ранее запрошенным (у каждого решения **два** использования)
    2) представляет пустую форму пользователю для авторизации
    3) после ввода отправляет запрос на сервер, ответ:
        - 200 ок - все ок установлен новый токен
        - 401 auth_error _- не верный логи или пароль_
        - 401 check_bot_error _- не прошел проверку на бот_

### Проверка e-mail

**Метод GET:** `/ident/exist_user?`

```js
//Клиент для авторизации должен придоставить форму с полями:

body = {
    email: 'name@email.com',
    answer_antibot: "Фраза отвте на антибот",
    id_task: "KYT76K",
}
```

**Порядок:**

- Клиент
    1) запрашивает задание антибот или пользуется ранее запрошенным (у каждого решения **два** использования)
    2) представляет пустую форму пользователю для авторизации
    3) после ввода отправляет запрос на сервер, ответ:

        - 200 ок - все ок
        - 401 email_taken _- занят уже_
        - 401 email_syntax_error _- не правильный синтаксис у e-mail_
        - 401 password_syntax_error _- не правильный синтаксис у password_
        - 401 check_bot_error _- не прошел проверку на бот_

### Получить задания для антибот

**Метод GET:** `/ident/get_antibot_task?`

```js
// Сервер присылает задачку на антибот в виде ссылки н картинку и номер задачи, ответ можно использовать два раза:

response = {
    task: "ссылка на картинку с заданием",
    id_task: "KYT76K",
}
```

**Порядок:**

- Клиент запрашивает задание антибот (у каждого решения **два** использования):
    - 200 ок _- все ок_

## Usage

```js

// server.js

const Client = require('customs-request');
const config = require('./config');
Client.set_config(config);

//...

async function handlerServer(request, response) {
    let client = new Client(request, response);
    await client.init();
}

//...
```

## Data Base

### users

- id
- email
- password
- token
- level

## Customs API

Ваши API должны находится в директории указанной в **config.path_to_app_dir**. Имя файла это имя API, и метод
соответственно имя метода по которым клиент будет вызывать ваше API. Уровни доступа необходимо прописать в config.

### Аргументы для ваших API:

- `object`
    - user `object`
        - user_id* `string`,
        - user_level* `string`,
    - apps `object: <app collection customs-request>`
    - request `object: node.js<http.IncomingMessage>`
    - response `object: node.js<http.ServerResponse>`

### Custom метод должен Возвращать:

Статус код и статус сообщение уже определены, так же их можно изменить через response, кроме это можно отправить ответ
или просто вернуть его из метода. Если метод ни чего не send и не return, тогда, code 200, send пустая строка

- `string(JSON)`: Данные, для отправки клиенту

## License

[MIT](LICENSE)