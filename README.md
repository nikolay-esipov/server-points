# customs-request

## Installation

### Using npm:

```bash
$ npm install customs-request
```

## REST API

### Регистрация пользователя

**Метод POST:** `/ident/register_user?`

```js
//Клиент для регистрации должен придоставить форму с обязательными полями:

body = {
    email: 'name@email.com',
    password: '123_password',
    anti_bot_phrase: "Красным знаминем",
    id_task: "KYT76K",
}

// Если регистрация успешна:
// - вернет код 200, текст "ок"
// Иначе код 401

response = "ок"
```

**Порядок:**

- Клиент
    1) запрашивает задание антибот или пользуется ранее запрошенным (у каждого решения **два** использования)
    2) представляет пустую форму пользователю для регистрации
    3) после ввода отправляет запрос на сервер, ответ:
        - 200 ок - все ок
        - 401 e-mail taken _- занят уже_
        - 401 e-mail syntax error _- не правильный синтаксис у e-mail_
        - 401 password syntax error _- не правильный синтаксис у password_
        - 401 error check bot _- не прошел проверку на бот_

### Авторизация пользователя

**Метод POST:** `/ident/auth_user?`

```js
//Клиент для авторизации должен придоставить форму с полями:

body = {
    email: 'name@email.com',
    password: '123_password',
    anti_bot_phrase: "Красным знаминем",
    id_task: "KYT76K",
}

// Если авторизация удачна:
// - сервер запишит новый токен в заголовок
//    - из клиента нет доступа к токену
// - вернет код 200, текст "ок"
// Иначе код 401

response = "ок"
```

**Порядок:**

- Клиент
    1) запрашивает задание антибот или пользуется ранее запрошенным (у каждого решения **два** использования)
    2) представляет пустую форму пользователю для авторизации
    3) после ввода отправляет запрос на сервер, ответ:
        - 200 ок - все ок установлен новый токен
        - 401 auth error _- не верный логи или пароль_
        - 401 error check bot _- не прошел проверку на бот_

### Проверка e-mail

**Метод GET:** `/ident/exist_user?`

```js
//Клиент для авторизации должен придоставить форму с полями:

body = {
    email: 'name@email.com',
    anti_bot_phrase: "Красным знаминем",
    id_task: "KYT76K",
}
```

**Порядок:**

- Клиент
    1) запрашивает задание антибот или пользуется ранее запрошенным (у каждого решения **два** использования)
    2) представляет пустую форму пользователю для авторизации
    3) после ввода отправляет запрос на сервер, ответ:

        - 200 ок _- все ок_
        - 401 e-mail taken _- занят уже_
        - 401 e-mail syntax error _- не правильный синтаксис у e-mail_
        - 401 error check bot _- не прошел проверку на бот_

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

## Configuration

- ### main_dir `string`
  Директория относительно которой будут находиться все файлы проекта, корень проекта **- задается абсолютным путем**.
- ### error_pages_dir `string`
  Директория для страниц ошибок имя страницы должно соответствовать коду ошибки **- задается абсолютным путем**.
    - 404.html
    - 503.html
    - 401.html
    - ...

- ### urls `array` массив объектов url
    - Если _access_level_ не указан доступно для всех посетителей. Указать можно директорию, файл, приложения, метод
      приложения. Ограничение для директории/приложения распространяется на все вложенные файлы и директории/методы,
      если не указано отдельно вложенный файл или директории, в таком случае действует локальное ограничение.

        - `objekt`
            - **value** `string` путь относительно _main_dir_ | имя приложение | имя приложение и метода.
            - **access_level** **|** **access_level_only** `number` уровень доступа юзера: main admin - 0, admin - 1,
              user - 2, не подтвержденный user - 3. От указанного до наивысшего access_level | только указанный
              access_level_only
            - **app** `boolean` является ли приложением, если false или не указан, значит это путь к директории/файлу
- ### path_to_app_dir `string` путь к коллекции пользовательских приложений
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
            - `string` id юзера в случае успеха
                - ИЛИ
            - `boolean` false в противном случае
              <br><br/>
    - `get_users()`
        - Возвращает:
            - `array` массив строк из таблицы users
                - ИЛИ
            - `boolean` false в противном случае

## Пример файла config

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

## Customs API

Ваши API должны находится в директории указанной в **config.path_to_app_dir**. Имя файла это имя API, и метод
соответственно имя метода по которым клиент будет вызывать ваше API. Уровни доступа необходимо прописать в config.

### Аргументы будут переданы методам в Ваши API:

- `object`
    - user `object`
      - user_id
      - level
      - email
      - ... <other fields from table users\>
    - request `node.js<http.IncomingMessage>`
    - response `node.js<http.ServerResponse>`

### Custom метод должен Возвращать:

- `string(JSON)`: Данные выполнения метода, для отправки клиенту
    - ИЛИ
- `boolean`: Результат выполнения метода при отсутствии данных

## License

[MIT](LICENSE)