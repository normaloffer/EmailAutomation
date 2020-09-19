var express = require('express');
var router = express.Router();
var pagination = require('../helper/pagination');

router.post('/domains', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.send({ msg: "Please login first!!", status: 0, redirect_url: "/admin" });
        return;
    }
    let per_page = 10;
    pagination.perpage = per_page;
    var data = req.body;
    session.admin_data(req, (user_error, user_data) => {
        var table = "domains";
        var page = 1;
        if (typeof req.query.page !== "undefined") {
            page = req.query.page;
        }
        var offset = (Math.abs(page) - 1) * per_page;
        if (offset < 0) {
            offset = 0;
        }
        var query = knex(table);
        if (data.table_search.trim() != "") {
            query.where('name', 'LIKE', '%' + data.table_search + '%')
        }
        var query_counnt = query;
        query_counnt.clone().count("*").then((total_rows) => {
            let paginate_ui = pagination.getAllPageLinks(Math.ceil(total_rows[0].count / per_page), Math.abs(page));
            var main_ht_data = "";
            query.select("*").offset(offset).limit(per_page).then((data_result) => {
                var serial_number = offset;
                for (var element of data_result) {
                    serial_number++;
                    main_ht_data += '<tr> ' +
                        '<td>' + serial_number + '</td> ' +
                        '<td>' + element.name + '</td> ' +
                        '<td>' +
                            '<a style="margin-left: 10px;" class="btn btn-danger" href="/admin/domains/add?enc_id=' + element.id + '"><i class="fa fa-pencil"></i></a>' +
                        '</td>'
                    '</tr>';
                }
                res.send({
                    status: 1,
                    main_data: main_ht_data,
                    paginate_data: paginate_ui
                });
            });
        });
    });
});


router.post('/users', function (req, res, next) {
    if (!session.is_admin(req)) {
        res.send({ msg: "Please login first!!", status: 0, redirect_url: "/admin" });
        return;
    }
    let per_page = 10;
    pagination.perpage = per_page;
    var data = req.body;
    session.admin_data(req, (user_error, user_data) => {
        var table = "users";
        var page = 1;
        if (typeof req.query.page !== "undefined") {
            page = req.query.page;
        }
        var offset = (Math.abs(page) - 1) * per_page;
        if (offset < 0) {
            offset = 0;
        }
        var query = knex(table);
        if (data.table_search.trim() != "") {
            query.where('users.email', 'LIKE', '%' + data.table_search + '%')
        }
        var query_counnt = query;
        query_counnt.clone().count("*").then((total_rows) => {
            let paginate_ui = pagination.getAllPageLinks(Math.ceil(total_rows[0].count / per_page), Math.abs(page));
            var main_ht_data = "";
            query.select("users.*",function () {
                this.column('name').from('domains').whereRaw('domains.id=users.domain_id').as('domain_name')
            }).offset(offset).limit(per_page).then((data_result) => {
                var serial_number = offset;
                for (var element of data_result) {
                    serial_number++;
                    main_ht_data += '<tr> ' +
                        '<td>' + serial_number + '</td> ' +
                        '<td>' + element.email + '</td> ' +
                        '<td>' + element.domain_name + '</td> ' +
                        '<td>' +
                            '<a style="margin-left: 10px;" class="btn btn-danger" href="/admin/users/add?enc_id=' + element.id + '"><i class="fa fa-pencil"></i></a>' +
                        '</td>'
                    '</tr>';
                }
                res.send({
                    status: 1,
                    main_data: main_ht_data,
                    paginate_data: paginate_ui
                });
            });
        });
    });
});

module.exports = router;