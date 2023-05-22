import {IGetUserByToken} from "../rules/IIdentApp";

declare function require(name: string): any;

const formidable = require('formidable');
const cookie = require('cookie');
const {pipeline} = require('node:stream/promises');
const fs = require('node:fs');

import {isExist} from 'fslite'
// @ts-ignore
import {ServerResponse, IncomingMessage} from "http";
// @ts-ignore
import mime from 'mime'
// @ts-ignore
import path from "path";
import IClient from "../rules/IClient";
import IHTTPResponse from "../rules/IHTTPResponse";
import {accessValues, IConfig, IConfigUrls, IUser} from "../rules/IServerConfig";
// @ts-ignore
import * as Buffer from "buffer";

let getUserByToken: IGetUserByToken
let config: IConfig
let tokenName: string = 'auth'

class Client implements IClient {
    public static readonly REG_EXP_IS_DIR = /(?:\/[_а-яА-Яa-zA-Z0-9-]+\/$)|(?:^\/$)/
    public static readonly REG_EXP_BAD = /(?:\.{2,})|(?:\/{2,})/g
    public static readonly REG_EXP_SYNTAX = /^(?:\/[а-яА-Яa-zA-Z0-9-_%]+)*(?:\/[а-яА-Яa-zA-Z0-9-#_.%]+)+(?:\\??.*)$/

    public static setConfig(aConfig: IConfig): void {
        getUserByToken = aConfig.getUserByToken
        tokenName = aConfig.tokenName || tokenName
        config = aConfig
    }

    private configUrl: string = '';
    public req = IncomingMessage;
    public res = ServerResponse;
    public ip: string;
    public protocol: string;
    public body: string | undefined | {[fieldName: string]: string};
    public fullUrl: string = '';
    public originalUrl: string = '';
    public redirect?: string = ''
    public contentType: string;
    public method: string;
    public hostName: string;
    public fields: {
        [fieldName: string]: string
    }[] = [];
    public files: {} = {};
    public params: {} = {};
    public cookie: {} = {};
// @ts-ignore
    public user: IUser;
    public methodApp?: {
        appName: string,
        methodName: string,
    };
    public accessLevel?: accessValues;
    public accessLevelOnly?: accessValues;
    public identUrl: IConfigUrls = {};

    constructor(request: IncomingMessage, response: ServerResponse) {
        this.ip = request.headers['x-forwarded-for'];
        this.protocol = request.headers['x-forwarded-proto'];
        this.hostName = request.headers['host'];
        this.contentType = request.headers['content-type'];
        this.method = request.method.toLowerCase();
        this.req = request
        this.res = response
    }

    public getTokenName() {
        return tokenName
    }

    private async checkBody() {
        let bodyStr = await new Promise((resolve, reject) => {
            let body = '';
            this.req.on('data', (chunk: Buffer) => {
                body += chunk.toString();
            });
            this.req.on('end', () => {
                resolve(body);
            });

            this.req.on('error', (error: string) => {
                console.log(error)
                reject(false);
            });
        });
        if (typeof bodyStr === 'string') {
            try {
                this.body = JSON.parse(bodyStr)
            } catch (e) {
                this.body = bodyStr
            }
        }
        return true
    };

    public async checkUrl() {
        if (Client.REG_EXP_BAD.test(this.req.url)) {
            await this.send({statusCode: 400, statusMessage: 'syntax_error'});
            return false
        }
        if (/\/$/.test(this.req.url)) {
            this.originalUrl = '/index.html'
        } else {
            this.originalUrl = this.req.url;
        }
        return true;
    }

    async sendIndexHtml() {

    }

    public async matchUrl() {
        let curr_url: string | boolean = false;
        const {urls} = config;
        for (const url in urls) {
            let regUrl = new RegExp(`^${url}.*`, 'i');
            if (regUrl.test(this.originalUrl) && (!curr_url || url.length > curr_url.length)) {
                this.identUrl = urls[url];
                curr_url = url;
                this.methodApp = urls[url].app;
                this.accessLevel = urls[url].accessLevel;
                this.accessLevelOnly = urls[url].accessLevelOnly;
                this.configUrl = url;
            }
        }
        if (curr_url === false) {
            await this.send({statusCode: 404, statusMessage: 'not_found'});
            return false
        }
        return true;
    }

    private async checkFormData() {
        if (this.method === 'post' && this.contentType === 'multipart/form-data') {
            await new Promise((resolve, reject) => {
                const formData = formidable({
                    maxFileSize: this.identUrl.maxFileSize || (50 * 1024 * 1024),
                });
                formData.parse(this.req, (err: Error, fields: [], files: []) => {
                    if (err) {
                        console.log("-> err", err);
                        reject(false);
                        return;
                    }
                    this.fields = fields
                    this.files = files
                    resolve(true)
                });

            })
        }
        return true
    }

    private resolveUrl() {
        if (this.originalUrl === this.configUrl) this.redirect = this.identUrl.redirect;
        else this.redirect = config.redirects?.find(redirect => {
            if (typeof redirect.origin === "string") redirect.origin = [redirect.origin];
            return redirect.origin.some(url => url === this.originalUrl)
        })?.target

        this.fullUrl = `${this.protocol}://${this.hostName}${this.req.url}`;
        const urlApi = new URL(this.fullUrl);
        // @ts-ignore
        this.params = Object.fromEntries(urlApi.searchParams.entries());
        return true
    }

    private async checkAccess() {
        if (this.req.headers['cookie']) this.cookie = cookie.parse(this.req.headers['cookie']);
        // @ts-ignore
        const user = this.user = await getUserByToken(this.cookie[tokenName]);
        if (this.accessLevel === 'free') return true;
        if (this.accessLevel === 'close') {
            await this.send({
                statusCode: 404,
                statusMessage: 'url_closed'
            })
        }
        if (user && typeof user.level === "number") {
            if (!this.accessLevelOnly) this.accessLevelOnly = user.level;
            // @ts-ignore
            if (user.level <= this.accessLevel && user.level === this.accessLevelOnly) {
                return true;
            }
        }
        await this.send({
            statusCode: 401,
            statusMessage: 'Unauthorized'
        })
        return false
    }

    private async checkFile() {
        const file = path.join(config.pathToRootDir, (this.redirect || this.originalUrl));
        if (await isExist(file)) {
            await this.sendFile(file)
        } else {
            await this.send({
                statusCode: 404,
                statusMessage: 'file_not_found'
            })
        }
    }

    private async checkMethodApp() {
        if (this.methodApp) {
            let {methodName, appName} = this.methodApp;
            if (!methodName) methodName = this.originalUrl.split('/')[2];
            try {
                // @ts-ignore
                await config.apps[appName][methodName](this);
                if (!this.req.writableEnded) {
                    await this.send({
                        statusCode: 404,
                        statusMessage: 'method_not_end'
                    })
                }
            } catch (e) {
                console.log(e);
                await this.send({
                    statusCode: 404,
                    statusMessage: 'method_not_found'
                })
            }
            return false
        }
        return true
    }

    public async send(HTTPResponse: IHTTPResponse) {
        this.res.statusCode = HTTPResponse.statusCode;
        this.res.statusMessage = HTTPResponse.statusMessage;
        this.res.end(HTTPResponse.body || '');
    }

    public async sendFile(filePath: string) {
        const extname = path.extname(filePath);
        const contentType = mime.getType(extname);
        this.res.setHeader('Content-Type', contentType);
        try {
            await pipeline(
                fs.createReadStream(filePath),
                this.res,
            );
        } catch (e) {
            console.log(e);
            await this.send({
                statusCode: 500,
                statusMessage: 'error_reading_file'
            })
        }
    }

    async init() {
        await this.checkUrl() &&
        await this.matchUrl() &&
        await this.checkAccess() &&
        this.resolveUrl() &&
        await this.checkFormData() &&
        await this.checkBody() &&
        await this.checkMethodApp() &&
        await this.checkFile()
    }
}

export = Client
