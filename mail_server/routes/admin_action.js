var express = require('express');
var router = express.Router();
const mkdirp = require('mkdirp');
router.post('/login', function (req, res, next) {
    if (session.is_admin(req)) {
        res.send({ msg: "You are already loggedin", status: 0, redirect_url: "/admin/dashboard" });
        return;
    }
    var data = req.body;
    if (data.email_address.trim() == "") {
        res.send({ msg: "Email Address is required", status: 0, redirect_url: "" });
    } else if (data.password.trim() == "") {
        res.send({ msg: "Password is required", status: 0, redirect_url: "" });
    } else {
        knex.from('admins').select("*").where('email', '=', data.email_address)
            .then((result) => {
                if (result.length == 0) {
                    res.send({ msg: "Email Not Found..!", status: 0, redirect_url: "" });
                } else {
                    if (result[0].password == data.password) {
                        if (result[0].status == 0) {
                            res.send({ msg: "This account is not active yet.", status: 0, redirect_url: "" });
                        } else {
                            session.set_admin_session(result[0].id, res);
                            res.send({ msg: "Login Success..!", status: 1, redirect_url: "/admin/dashboard" });
                        }
                    } else {
                        res.send({ msg: "Password is Wrong!!", status: 0, redirect_url: "" });
                    }
                }
            })
            .catch((err) => {
                console.log((err));
                res.send({ msg: "Some error occur..!", status: 0, redirect_url: "" });
            });
    }
});

router.post('/update_profile', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.send({ msg: "Please login first!!", status: 0, redirect_url: "/admin" });
        return;
    }
    var data = req.body;
    if (data.firstname.trim() == "") {
        res.send({ msg: "Firstname is required", status: 0, redirect_url: "" });
    } else if (data.lastname.trim() == "") {
        res.send({ msg: "Lastname is required", status: 0, redirect_url: "" });
    } else {
        session.admin_data(req, (user_error, user_data) => {
            knex("admins").where("id", user_data[0].id)
                .update({
                    firstname: data.firstname,
                    lastname: data.lastname
                }).then(function (count) {
                    res.send({ msg: "Profile Updated successfully..!", status: 1, redirect_url: "/admin/profile" });
                }).catch((err) => {
                    res.send({ msg: "Some error occurs!!", status: 1, redirect_url: DIR + "" });
                });
        });
    }
});

router.post('/change_password', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.send({ msg: "Please login first!!", status: 0, redirect_url: "/admin" });
        return;
    }
    var data = req.body;
    if (data.current_password.trim() == "") {
        res.send({ msg: "Current password is required", status: 0, redirect_url: "" });
    } else if (data.new_password.trim() == "") {
        res.send({ msg: "New password is required", status: 0, redirect_url: "" });
    } else if (data.confirm_password.trim() == "") {
        res.send({ msg: "Confirm password is required", status: 0, redirect_url: "" });
    } else {
        session.admin_data(req, (user_error, user_data) => {
            if (user_data[0].password == data.current_password) {
                if (data.new_password == data.confirm_password) {
                    knex("admins").where("id", user_data[0].id)
                        .update({
                            password: data.confirm_password
                        }).then(function (count) {
                            res.send({ msg: "Password changed successfully..!", status: 1, redirect_url: "/admin/profile" });
                        }).catch((err) => {
                            res.send({ msg: "Some error occurs!!", status: 1, redirect_url: DIR + "" });
                        });
                } else {
                    res.send({ msg: "Confirm Password does not match!!", status: 0, redirect_url: "" });
                }
            } else {
                res.send({ msg: "Current Password is wrong!!", status: 0, redirect_url: "" });
            }
        });
    }
});

router.post('/add_domain', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.send({ msg: "Please login first!!", status: 0, redirect_url: "/admin" });
        return;
    }
    session.admin_data(req, (user_error, user_data) => {
        var data = req.body;
        var today = new Date();
        let prepare_data = {
            name: data.name
        };
        if (typeof data.enc_id === 'undefined') {
            knex("domains").select("*").where('name', data.name).limit(1).then((result) => {
                if (result.length === 1) {
                    res.send({ msg: "Domain is already exist..!", status: 0, redirect_url: "" });
                } else {
                    knex("domains").insert(prepare_data).then(() => {
                        res.send({ msg: "Domain added Successfully..!", status: 1, redirect_url: "/admin/domains" });
                    });
                }
            });
        } else {
            knex("domains").select("*").where('id', data.enc_id).then((result) => {
                if (result.length === 0) {
                    res.send({ msg: "Domain is not found", status: 0, redirect_url: "" });
                } else {
                    knex("domains").update(prepare_data).where('id', data.enc_id).then(() => {
                        res.send({ msg: "Domain Updated Successfully..!", status: 1, redirect_url: "/admin/domains" });
                    });
                }
            });
        }
    });
});


router.post('/add_user', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.send({ msg: "Please login first!!", status: 0, redirect_url: "/admin" });
        return;
    }
    session.admin_data(req, (user_error, user_data) => {
        var data = req.body;
        let prepare_data = {
            email: data.email,
            domain_id:data.domain_id,
            password:data.password
        };
        var hostname = data.email.split('@')[1];
        var email_name = data.email.split('@')[0];
        var oldmask = process.umask(0);
        mkdirp.sync('/var/vmail/vhosts/'+hostname+'/'+email_name,'0777');
        process.umask(oldmask);
        if (typeof data.enc_id === 'undefined') {
            knex("users").select("*").where('email', data.email).where('domain_id',data.domain_id).limit(1).then((result) => {
                if (result.length === 1) {
                    res.send({ msg: "User is already exist..!", status: 0, redirect_url: "" });
                } else {
                    knex("users").insert(prepare_data).then(() => {
                        res.send({ msg: "User added Successfully..!", status: 1, redirect_url: "/admin/users" });
                    });
                }
            });
        } else {
            if (data.password.trim() == ""){
                delete prepare_data.password;
            }
            knex("users").select("*").where('id', data.enc_id).then((result) => {
                if (result.length === 0) {
                    res.send({ msg: "User is not found", status: 0, redirect_url: "" });
                } else {
                    knex("users").update(prepare_data).where('id', data.enc_id).then(() => {
                        res.send({ msg: "User Updated Successfully..!", status: 1, redirect_url: "/admin/users" });
                    });
                }
            });
        }
    });
});

module.exports = router;
