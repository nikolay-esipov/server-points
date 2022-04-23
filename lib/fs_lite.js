const {promises: Fs} = require('fs');

module.exports = {
    async exists_file(path) {
        try {
            await Fs.access(path)
            return true
        } catch {
            return false
        }
    },
    async file_names(path_to) {
        try {
            return await Fs.readdir(path_to);
        } catch {
            return false
        }
    }
}