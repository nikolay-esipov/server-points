import {accessValues, IConfigUrls, IUser} from "./IServerConfig";
import IHTTPResponse from "./IHTTPResponse";
// @ts-ignore
import {ServerResponse, IncomingMessage} from "http";

interface IClient {
    req: IncomingMessage;
    res: ServerResponse;
    protocol: string;
    fullUrl: string;
    identUrl: IConfigUrls;
    hostName: string;
    redirect?: string;
    body: string | undefined | {[fieldName: string]: string};
    originalUrl: string;
    contentType: string;
    method: string;
    ip: string;
    params: {};
    cookie: {};
    fields: {
        [fieldName: string]: string
    }[];
    files: {};
    user: IUser;
    methodApp?: {
        appName: string,
        methodName: string,
    },

    accessLevel?: accessValues,
    accessLevelOnly?: accessValues,
    getTokenName(): string
    sendJson(HTTPResponse: IHTTPResponse): void;
    sendStatus(HTTPResponse: IHTTPResponse): void;
    sendText(HTTPResponse: IHTTPResponse): void;
    sendFile(filePath: string): void;
}

export = IClient;