const {promises} = require('fs');
const {mkdir, readFile, writeFile} = promises;
const ident_db = require('../ident_db');
const path = require("path");
const sharp = require('sharp')
const {db} = require("../db");
const TikAPI = require("tikapi");


//
// Если метод возвращает данные, то статус: 200 ок, в остальных случаях
// статус и статус-код будут определенны СustomsRequest ом
// Методы должны возвращать следующие типы:

const URL = {
    // тип URL это Объект с двумя полями:
    type: 'url', // Название типа
    value: '/mainDri_resolvePath/any_pat/any_file.js' // относительный адрес к файлу
    //Позволяет обработать сам урл, изменить его например.
    //Так как дальнейшее управление будет передано экземпляру СustomsRequest - Кленту,
    //подразумевается, что по этому урлу будет файл, иначе 404, Not Found.
}

// Метод возвращает строку,
const STRING = `Response in JSON or Base64, Buffer, String, etc ...`

module.exports = {
    async get_user_prof(client) {
        let {user} = client;
        let res = await ident_db.get_users_for_public(user.user_id);
        return res
    },
    async change_user_nickname(client) {
        let {query, user, users} = client;
        let {new_nickname} = query;
        if (!new_nickname) return 'false';
        let full_user = this.load_user(client);

        let res = await ident_db.update_user_field('nickname', new_nickname, user.user_id);
        if (res) {
            full_user.nickname = new_nickname;
            return {nickname: new_nickname};
        }
        return 'false'
    },
    async get_subscription_set(client) {
        let user = await this.get_user_prof(client);
        if (user.subscription_name) return await ident_db.get_subscription_set(user.subscription_name);
        return [];
    },
    async get_games() {

    }
}