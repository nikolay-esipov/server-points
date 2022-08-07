let error_html =
    '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '  <head>\n' +
    '    <meta charset="utf-8">\n' +
    '    <title>title</title>\n' +
    '  </head>\n' +
    '  <body>\n' +
    '  <script type="application/javascript"> window.error_date = error_date_temp;</script>\n' +
    '  <script dist="path_to_error_handler"></script>\n' +
    '  </body>\n' +
    '</html>';


module.exports = {
    set_path_to_error_agent(_path) {
        error_html = error_html.replace('dist="path_to_error_handler"', `src="${_path}"`)
    },
    get_html_container_error_agent() { //запускает в контексте экземпляра клиента, this = new custom-request
        let error_data = {
            status_code: this.status_code,
            status_message: this.status_message,
            url: this.req.originalUrl,
        }
        return error_html.replace('error_date_temp', JSON.stringify(error_data));
    }
}