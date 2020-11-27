var express = require('express');
var router = express.Router();
var shell = require('node-exec');

let postfix_queue = async function () {
    try {
        return shell.run("/var/postfix_queue_log.sh").then(function (result) {
            return JSON.parse(result.result);
        });
    } catch (e) {
        console.log(e);
        return 0;
    }
}

router.get('/', function (req, res, next) {
    if (session.is_admin(req)) {
        res.redirect('/admin/dashboard');
        return;
    }
    res.render('admin/login', {
        title: 'Login',
        query: req.query
    });
});

router.get('/logout', function (req, res, next) {
    session.logout_admin(res);
    res.redirect("/admin");
});

router.get('/dashboard', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.redirect("/admin");
        return;
    }
    session.admin_data(req, async (user_error, user_data) => {
          console.log(user_error);
        let count_data = await knex.raw("SELECT (SELECT COUNT(*) FROM domains) as domain_count,(SELECT COUNT(*) FROM users) as user_count FROM admins WHERE uuid='"+user_data[0].uuid+"'");
        let result = await postfix_queue();
        let count_d = {
            domains:count_data[0].domain_count,
            users:count_data[0].user_count,
            active_queue:'',
            bounced_queue:''
        }
        if(result != 0){
            count_d.active_queue = result.active;
            count_d.bounced_queue = result.bounced;
        }
        res.render('admin/dashboard/dashboard', {
            title: 'Admin Dashboard',
            user_data: user_data[0],
            data_query: req.query,
            count_d:count_d,
            active_side_menu: req.url.split('?')[0].split('/')
        });
    });
});

router.get('/profile', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.redirect("/admin");
        return;
    }
    session.admin_data(req, (user_error, user_data) => {
        res.render('admin/dashboard/profile/profile', {
            title: 'Profile info',
            user_data: user_data[0],
            data_query: req.query,
            active_side_menu: req.url.split('?')[0].split('/')
        });
    });
});

router.get('/profile/update_profile', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.redirect("/admin");
        return;
    }
    session.admin_data(req, (user_error, user_data) => {
        res.render('admin/dashboard/profile/update_profile', {
            title: 'Update Profile',
            user_data: user_data[0],
            data_query: req.query,
            active_side_menu: req.url.split('?')[0].split('/')
        });
    });
});

router.get('/profile/change_password', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.redirect("/admin");
        return;
    }
    session.admin_data(req, (user_error, user_data) => {
        res.render('admin/dashboard/profile/change_password', {
            title: 'Change Password',
            user_data: user_data[0],
            data_query: req.query,
            active_side_menu: req.url.split('?')[0].split('/')
        });
    });
});

router.get('/domains', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.redirect('/admin');
        return;
    }
    session.admin_data(req, (user_error, user_data) => {
        res.render('admin/domains/domains', {
            data_query: req.query,
            user_data: user_data[0],
            active_side_menu: req.url.split('?')[0].split('/'),
            title: 'Domains'
        });
    });
});

router.get('/domains/add', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.redirect('/user');
        return;
    }
    var is_enc;
    let main_title;
    let main_enc_id;
    if (typeof req.query.enc_id === "undefined") {
        main_title = "Add Domain";
        main_enc_id = 0;
        is_enc = false;
    } else {
        is_enc = true;
        main_title = "Update Domain";
        main_enc_id = req.query.enc_id;
    }
    session.admin_data(req, (user_error, user_data) => {
        knex.from('domains').select("*").where('id', main_enc_id).then((result) => {
            if (typeof req.query.enc_id !== "undefined") {
                if (result.length === 0) {
                    res.redirect("/admin/domains");
                    return;
                }
            }
            res.render('admin/domains/add', {
                is_enc: is_enc,
                user_data: user_data[0],
                enc_data: result[0],
                data_query: req.query,
                title: main_title,
                active_side_menu: req.url.split('?')[0].split('/')
            });
        });
    });
});

router.get('/users', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.redirect('/admin');
        return;
    }
    session.admin_data(req, (user_error, user_data) => {
        res.render('admin/users/users', {
            data_query: req.query,
            user_data: user_data[0],
            active_side_menu: req.url.split('?')[0].split('/'),
            title: 'Users'
        });
    });
});

router.get('/users/add', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.redirect('/user');
        return;
    }
    var is_enc;
    let main_title;
    let main_enc_id;
    if (typeof req.query.enc_id === "undefined") {
        main_title = "Add Users";
        main_enc_id = 0;
        is_enc = false;
    } else {
        is_enc = true;
        main_title = "Update User";
        main_enc_id = req.query.enc_id;
    }
    session.admin_data(req, (user_error, user_data) => {
        knex.from('users').select("*").where('id', main_enc_id).then((result) => {
            if (typeof req.query.enc_id !== "undefined") {
                if (result.length === 0) {
                    res.redirect("/admin/users");
                    return;
                }
            }
            knex("domains").select("*").then((domains) => {
                res.render('admin/users/add', {
                    is_enc: is_enc,
                    user_data: user_data[0],
                    enc_data: result[0],
                    data_query: req.query,
                    title: main_title,
                    domains: domains,
                    active_side_menu: req.url.split('?')[0].split('/')
                });
            });
        });
    });
});



router.get('/mail_queue', async function (req, res, next) {
    if (!session.is_admin(req)) {
        res.redirect('/admin');
        return;
    }
    session.admin_data(req, async (user_error, user_data) => {
        let result = await postfix_queue();
        res.render('admin/mail_queue/mail_queue', {
            data_query: req.query,
            user_data: user_data[0],
            active_side_menu: req.url.split('?')[0].split('/'),
            result_data: result,
            title: 'Mail Queue'
        });
    });
});

module.exports = router;
