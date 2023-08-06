const formidable = require('formidable');
const {pipeline} = require('node:stream/promises');
const fs = require('node:fs');
const mime = require('mime');

import IGetUserByToken from "../rules/IGetUserByToken";
import {isExist} from 'fslite'
import {ServerResponse, IncomingMessage} from "http";
import path from "path";
import IClient from "../rules/IClient";
import IHTTPResponse from "../rules/IHTTPResponse";
import {accessValues, IConfig, IConfigUrls, IUser} from "../rules/IServerConfig";
import * as Buffer from "buffer";

let config: IConfig
let getUserByToken: IGetUserByToken = async function (token): Promise<IUser | false> {
    return false
}

class Client implements IClient {
    public static readonly REG_EXP_BAD_URL = /(?:\.{2,})|(?:\/{2,})/g
    public static setConfig(aConfig: IConfig): void {
        getUserByToken = aConfig.getUserByToken || getUserByToken
        config = aConfig
    }

    private matchedUrl: string = '';
    public req: IncomingMessage;
    public res: ServerResponse;
    public ip: string | string[] | undefined;
    public protocol: string | string[] | undefined;
    public body: string | undefined | { [fieldName: string]: string };
    public fullUrl: string = '';
    public originalUrl: string | undefined;
    public contentType: string | undefined;
    public method: string | undefined;
    public hostName: string | undefined;
    public fields: {
        [fieldName: string]: string
    }[] = [];
    public files: {} = {};
    public params: {} = {};
    public cookie: {} = {};
    public user: IUser | false = false;
    public methodApp?: {
        appName: string,
        methodName: string,
    };
    public accessLevel?: accessValues;
    public accessLevelOnly?: accessValues;
    public identUrl: IConfigUrls = {};
    private noIndexHtml: boolean = config.noIndexHtml || false;

    constructor(request: IncomingMessage, response: ServerResponse) {
        this.ip = request.headers['x-forwarded-for'];
        this.protocol = request.headers['x-forwarded-proto'];
        this.hostName = request.headers['host'];
        this.contentType = request.headers['content-type'];
        this.method = request.method?.toLowerCase();
        this.req = request
        this.res = response
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
        if (this.req.url && Client.REG_EXP_BAD_URL.test(this.req.url)) {
            await this.send({statusCode: 400, statusMessage: 'syntax_error'});
            return false
        }
        if (this.req.url && /\/$/.test(this.req.url)) {
            this.originalUrl = '/index.html'
        } else {
            this.originalUrl = this.req.url;
        }
        return true;
    }

    public async matchUrl() {
        let curr_url: string | boolean = false;
        const {urls} = config;
        for (const url in urls) {
            let regUrl = new RegExp(`^${url}.*`, 'i');
            if (this.originalUrl && regUrl.test(this.originalUrl) && (!curr_url || url.length > curr_url.length)) {
                this.identUrl = urls[url];
                curr_url = url;
                this.methodApp = urls[url].app;
                this.accessLevel = urls[url].accessLevel;
                this.accessLevelOnly = urls[url].accessLevelOnly;
                this.matchedUrl = url;
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
        this.fullUrl = `https://${this.hostName}${this.req.url}`;
        const urlApi = new URL(this.fullUrl);
        this.params = Object.fromEntries(urlApi.searchParams.entries());
        return true
    }

    private async checkAccess() {
        if (this.accessLevel === 'free') return true;
        if (this.accessLevel === 'close') {
            await this.send({
                statusCode: 404,
                statusMessage: 'url_closed'
            })
        }
        const user: IUser | false = this.user = await getUserByToken(this.req.headers);
        if (user) {
            if (!this.accessLevelOnly) this.accessLevelOnly = user.level;
            if (this.accessLevel && user.level <= this.accessLevel && user.level === this.accessLevelOnly) {
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
        const file = path.join(config.pathToRootDir, (this.originalUrl || ''));
        if (await isExist(file)) {
            await this.sendFile(file)
        } 
        else if (!this.noIndexHtml) {
            const file = path.join(config.pathToRootDir, 'index.html');
            await this.sendFile(file)
        }
        else {
            await this.send({
                statusCode: 404,
                statusMessage: 'file_not_found'
            })
        }
    }

    private async checkMethodApp() {
        if (this.methodApp) {
            let {methodName, appName} = this.methodApp;
            try {
                // @ts-ignore
                await config.apps[appName][methodName](this);
                if (!this.res.writableEnded) {
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

    private async send(HTTPResponse: IHTTPResponse) {
        this.res.statusCode = HTTPResponse.statusCode;
        this.res.statusMessage = HTTPResponse.statusMessage;
        this.res.end(HTTPResponse.body || '');
    }

    public async sendJson(HTTPResponse: IHTTPResponse) {
        this.res.setHeader('Content-Type', 'application/json; charset=utf-8');
        await this.send(HTTPResponse);
    }

    public async sendText(HTTPResponse: IHTTPResponse) {
        this.res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        await this.send(HTTPResponse);
    }

    public async sendStatus(HTTPResponse: IHTTPResponse) {
        await this.send(HTTPResponse);
    }

    public async sendFile(filePath: string) {
        const extname = path.extname(filePath);
        let contentType = mime.getType(extname);
        contentType += '; charset=UTF-8';
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
