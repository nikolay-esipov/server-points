interface IHTTPResponse {
    statusCode: number,
    statusMessage: string,
    body?: string
}

export = IHTTPResponse;