class Logger {
    constructor(moduleName) {
        // Extracting the first 2 levels of the file path
        this.filename = moduleName.split(/[\\\/]/).splice(-2).join('/');
    }
    info(method, text) {
        console.log(`${this.filename} | ${method} | ${text}`);
    }
    error(method, text) {
        console.error(`${this.filename} | ${method} | ${text}`);
    }
}

module.exports = Logger;
