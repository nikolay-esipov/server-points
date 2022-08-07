
ereer - `register_user()`
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
