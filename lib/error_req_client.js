let error_html =
    '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '  <head>\n' +
    '    <meta charset="utf-8">\n' +
    '    <title>title</title>\n' +
    '    <link rel="stylesheet" href="style.css">\n' +
    '  </head>\n' +
    '  <body>\n' +
    '  <div id="data_error_name" data-error-name="client_data" ></div>\n' +
    '  <script src="path_to_error_handler"></script>\n' +
    '  </body>\n' +
    '</html>';


module.exports = {
    set_path_to_error_agent(_path) {
        error_html = error_html.replace('src="path_to_error_handler"', `src="${_path}"`)
    },
    get_container_error_agent() {
        let client_data = JSON.stringify({code: this.status_code, message: this.status_message});
        return error_html.replace('data-error-name="client_data"', `data-error-name="${client_data}"`)
    }
}