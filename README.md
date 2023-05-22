# server-points
Простой сервер на nodejs с авторизацией по токену, поддержкой уровней доступа, и поддержкой сервера разработки.
Вся настройка сервера осуществляется в конфиге. При работе с devServer файлы конфигурации vue.config.js или webpack.config.js
должны экспортировать async function.

```ts

// server.ts

import {startServer} from 'server-points';
import config from './server.config';

(async _=> {
    config = await prepareConfig(config);
    await startServer(config);
})()

```

## Installation

### Using npm:

```bash
$ npm install server-points
```

## Configuration

- ### pathToRootDir `string`*
  Корневая директория относительно которой будут находиться все файлы проекта: index.html, css, js, картинки, шаблоны,
  страницы ... и т.д. - _задается абсолютным путем_.

- ### pathToApps `string`
  Путь к директории с файлами приложений.

- ### accessAreas `array`*
  Массив Областей доступа.
    - **area** `objekt`* - объект типа IAccessAreas, Области доступа
        - **urls** `array`*
            - **url** `object`*
                - **value** `string` может быть в двух вариантах:

                1. Путь относительно корневой директории _pathToRootDir_ к файлу или директории. Например: _
                   /assets/users/images/avatar/main.img_
                2. Имя приложения и метода. Например: _/api_name/method_name_

                - **app**  `object | boolean` - может быть объектом или true. Если не указано значит урл всегда путь к
                  файлу
                    - **appName**
                    - **methodName**
                - **maxFileSize** `number` - максимальный размер файла в байтах для этого урла
        - **accessLevel** `'free' | 'close' | number` Устанавливает уровень доступа урла от 0, где 0 самый высокий
          уровень доступа. Например, при уровне урла 2 и при минимальном уровне 4 доступ будет у 2, 1 и 0.
        - **accessLevelOnly** `'free' | 'close' | number` Устанавливает уровень доступа урла от, 0 где 0 самый высокий
          уровень доступа. Например, при уровне урла 2 и при минимальном уровне 4 доступ будет только у 2.

- ### getUserByToken `function`*
  Функция типа IGetUserByToken. Должна возвращать объект типа IUser по токену или false если токен не
  корректный или не передан.

- ### tokenName `string`*
  Имя cookie ключа для токена авторизации.

- ### port `number`
  Номер порта если не указан берется из process.env.PORT или 3033.

- ### devRoutersRgExp `RegExp[]`
  Массив регулярных выражений для определения урлов для devServer, при совпадении будет перенаправлен на текущий сервер
  - server-point .

## APPS
Методы получают аргумент типа IClient. Все файлы .js расположенные в директории pathToApps и экспортирующие объекты будут инициализированы.

## Пример файла config
```js
// server.config.ts
import path from "path";
import DB from "/db";

enum accessLevels {
    'system' = 0,
    'superAdmin' = 1,
    'admin' = 2,
    'user' = 3,
    'free' = 'free',
    'close' = 'close',
}

const Config: IUserConfig = {
    pathToRootDir: path.join(__dirname, './projects/maysite'),
    pathToApps: path.join(__dirname, './projects/apps'),
    async getUserByToken(token: string | undefined): IUser {
        const user: IUser = await DB.cash.getLevelByToken(token);
        if (typeof user.accessLevel === 'number' && user.accessLevel >= 0) return user;
        return false;
    },
    tokenName: 'may_secret_key_token_name',
    accessAreas: [
        {
            accessLevel: accessLevels.superAdmin,
            urls: [
                {
                    value: '/mayApp/secret_method',
                    app: true
                },
                {
                    value: '/assets/images/superImages',
                },
            ]
        },
        {
            accessLevel: accessLevels.admin,
            urls: [
                {
                    value: '/mayApp',
                    app: true
                    // все методы приложения mayApp кроме super_admin_method будут доступны для admin и выше
                },
                {
                    value: '/assets/images',
                    // все файлы и папки в /assets/images кроме /assets/images/superImages будут доступны для admin и выше
                },
            ]
        },
        {
            accessLevelOnly: accessLevels.admin,
            urls: []
        },
        {
            accessLevel: accessLevels.user,
            urls: [
                {
                    value: '/may_api/set_admin',
                    app: true
                },
            ]
        },
        {
            accessLevel: accessLevels.free,
            urls: [
                {
                    value: '/dir1/dir2/blabla?value=1&value2=2',
                    app: {
                        appName: 'appWork',
                        methodName: 'resolve',
                    }
                },
                {
                    value: '/dir3/dir4/anyfile.txt',
                    app: {
                        appName: 'appWork',
                        methodName: 'resolve',
                    }
                },
                // Оба урла будут обработаны приложением appWork, методом resolve  
            ]
        },
    ],
    port: 3000,
}

export = Config


```

## License

[MIT](LICENSE)