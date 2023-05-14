import {accessValues, IConfigUrls} from "./IServerConfig";
import IHTTPResponse from "./IHTTPResponse";
// @ts-ignore
import {IncomingMessage} from "http";

interface IClient {
    req: IncomingMessage;
    protocol: string;
    fullUrl: string;
    identUrl: IConfigUrls;
    hostName: string;
    originalUrl: string;
    contentType: string;
    method: string;
    ip: string;
    params: {};
    cookie: {};
    fields: {};
    files: {};
    methodApp?: {
        appName: string,
        methodName: string,
    },
    accessLevel?: accessValues,
    accessLevelOnly?: accessValues,
    send(HTTPResponse: IHTTPResponse): void;
    sendFile(filePath: string): void;
}

export = IClient;