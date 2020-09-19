var knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: "/var/mail/mail_db.sqlite"
    }
});
module.exports = knex;