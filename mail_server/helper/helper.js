class helper {
    random_string(length) {
        let radom13chars = function () {
            return Math.random().toString(16).substring(2, 15)
        }
        let loops = Math.ceil(length / 13)
        return new Array(loops).fill(radom13chars).reduce((string, func) => {
            return string + func()
        }, '').substring(0, length)
    }
    base_encode(main_string) {
        return Buffer.from(main_string).toString("base64");
    }

    base_decode(main_string) {
        let buff = new Buffer.from(main_string, 'base64');
        return buff.toString('ascii');
    }
    getFileExtension(filename) {
        var ext = /^.+\.([^.]+)$/.exec(filename);
        return ext == null ? "" : ext[1];
    }
    validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
}
module.exports = new helper();