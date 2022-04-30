let error_html =
    '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '  <head>\n' +
    '    <meta charset="utf-8">\n' +
    '    <title>title</title>\n' +
    '    <link rel="stylesheet" href="style.css">\n' +
    '  </head>\n' +
    '  <body>\n' +
    '  <script type="application/javascript"> window.error_status_code = "error_status_code_value"; window.error_status_message = "error_status_message_value";</script>\n' +
    '  <script src="path_to_error_handler"></script>\n' +
    '  </body>\n' +
    '</html>';


module.exports = {
    set_path_to_error_agent(_path) {
        error_html = error_html.replace('src="path_to_error_handler"', `src="${_path}"`)
    },
    get_html_container_error_agent() {
        return error_html.replace('error_status_code_value', this.status_code).replace('error_status_message_value', this.status_message)
    }
}