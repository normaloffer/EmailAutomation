if (window.XMLHttpRequest) {
    var xhr = new XMLHttpRequest();
} else {
    var xhr = new ActiveXObject("Microsoft.XMLHTTP");
}
$('form[sbform="true"]').submit(function (e) {
    e.preventDefault();
    var url = $(this).attr("url");
    var save_id = $(this).attr("saveid");
    var submit_button = $(this).find("button[type=submit]");
    var btn_text = submit_button.text();
    submit_button.attr("disabled", "disabled");
    submit_button.text('Working..');

    $.ajax({
        url: "/" + url,
        data: $(this).serialize(),
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        success: function (rsp) {
            if (rsp.status == 1) {
                $(save_id).show();
                $(save_id).html('<div class="alert alert-success"> <strong>Success!</strong> ' + rsp.msg + '</div>');
                setTimeout(function () {
                    $(save_id).hide();
                }, 2000);
            }
            if (rsp.redirect_url != "") {
                setTimeout(function () {
                    window.location.href = rsp.redirect_url;
                }, 2000);
            }
            if (rsp.status == 0) {
                $(save_id).html('<div class="alert alert-danger"> <strong>Error!</strong> ' + rsp.msg + '</div>');
            }
            submit_button.removeAttr("disabled");
            submit_button.text(btn_text);
        }, error: function (err) {
            console.log(err);
        }
    });
});

$('form[sbfileform="true"]').submit(function (e) {
    e.preventDefault();
    var url = $(this).attr("url");
    var save_id = $(this).attr("saveid");
    var submit_button = $(this).find("button[type=submit]");
    var btn_text = submit_button.text();
    submit_button.attr("disabled", "disabled");
    submit_button.text('Working..');

    let data = new FormData(document.querySelector("#myform"));
    $.ajax({
        url:  "/" + url,
        data: data,
        method: "POST",
        processData: false,
        contentType: false,
        success: function (rsp) {
            if (rsp.status == 1) {
                $(save_id).show();
                $(save_id).html('<div class="alert alert-success"> <strong>Success!</strong> ' + rsp.msg + '</div>');
                setTimeout(function () {
                    $(save_id).hide();
                }, 2000);
            }
            if (rsp.redirect_url != "") {
                setTimeout(function () {
                    window.location.href = rsp.redirect_url;
                }, 2000);
            }
            if (rsp.status == 0) {
                $(save_id).html('<div class="alert alert-danger"> <strong>Error!</strong> ' + rsp.msg + '</div>');
            }
            submit_button.removeAttr("disabled");
            submit_button.text(btn_text);
        }, error: function (err) {
            console.log(err);
        }
    });
});


function get_data_pagination(page = null) {
    var e = $("#paginate_form");
    var url = e.attr("data-url");
    if (page == null) {
        var paginate = "";
    } else {
        var paginate = "?page=" + page;
    }
    $.ajax({
        url: "/" + url + paginate,
        data: $(e).serialize(),
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        success: function (rsp) {
            if (rsp.main_data == "") {
                $("thead").css('display', 'none');
                $("#get_paginate_data").html('<span style="display: block; text-align: center; padding: 50px; font-size: 16px; ">No Data To Show</span>');
            } else {
                $("thead").css('display', 'contents');
                $("#get_paginate_data").html(rsp.main_data);
                $("#total_sent_emails").text(rsp.total_count);
            }
            $("#paginate_rows").html(rsp.paginate_data);
        }
    });
    return false;
}
function get_paginate_result(e,id) {
    get_data_pagination(id);
}



$('button[validation_work_btn="true"]').click(function (e) {
    e.preventDefault();
    var main_btn = $(this);
    main_btn.attr("disabled", "disabled");
    main_btn.text("Proccessing...");
    $.ajax({
        url: "/admin_action/sending_proccess",
        data: { quantity: $("#email_number").val(),campaign_id:$("#campaigns_queue").val() },
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        success: function (rsp) {
            if (rsp.status == 0) {
                main_btn.removeAttr("disabled");
                main_btn.text("Start Proccess");
                alert(rsp.msg);
            } else {
                $("#done_conditiondgsdfg").hide();
                $("#verification_rpoccessxgsdf").show();
                $("#main_proccessing_boxy").html('<div class="form-group text-center" id="verification_rpoccessxgsdf"><img src="/assets/images/loading.gif" width="150" ></div>');
            }
        }, error: function (err) {
            alert("Some Error Occured..!");
        }
    });
});

function delete_t_d(e, url, main_id) {
    var e_dt = e;
    var delete_sure = confirm("Are you sure to delete this?");
    if (delete_sure == true) {
        $.ajax({
            url: "/" + url,
            data: { enc_id: main_id },
            method: "POST",
            contentType: "application/x-www-form-urlencoded",
            success: function (rsp) {
                if (rsp.status == 1) {
                    e_dt.closest("tr").remove();
                }
                if (rsp.status == 0) {
                    alert(rsp.msg);
                }
            }, error: function (err) {
                console.log(err);
            }
        });
    }
};
function remove_all_non_leads(){
    var delete_sure = confirm("Are you sure to delete all leads?");
    if (delete_sure == true) {
        $.ajax({
            url: "/user_action/remove_all_non_leads",
            data: { },
            method: "POST",
            contentType: "application/x-www-form-urlencoded",
            success: function (rsp) {
                if (rsp.status == 1) {
                    window.location = '';
                }
                if (rsp.status == 0) {
                    alert(rsp.msg);
                }
            }, error: function (err) {
                console.log(err);
            }
        });
    }
}

function deleteall_logs(){
    var x = confirm("Are you sure to delete all?");
    if(x){
        $.ajax({
            url: "/admin_action/remove_all_log_data",
            data: { },
            method: "POST",
            contentType: "application/x-www-form-urlencoded",
            success: function (rsp) {
                if (rsp.status == 0) {
                    alert(rsp.msg);
                }
                if(rsp.status == 1){
                    window.location = '';
                }
            }, error: function (err) {
                console.log(err);
            }
        });
    }
}

function auto_login_admin_users(id){
    $.ajax({
        url: "/admin_action/auto_login_users",
        data: { enc_id:id },
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        success: function (rsp) {
            if (rsp.status == 0) {
                alert(rsp.msg);
            }
            if(rsp.status == 1){
                window.open('/user','_blank');
            }
        }, error: function (err) {
            console.log(err);
        }
    });
}

function campaign_queue_data(e,type,id){
    $.ajax({
        url: "/user_action/handle_campaign_queue",
        data: { enc_id:id },
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        success: function (rsp) {
            if (rsp.status == 0) {
                alert(rsp.msg);
            }
            if(rsp.status == 1){
                if(type == 'start'){
                    e.classList.remove("btn-success");
                    e.classList.add("btn-warning");
                    e.setAttribute("onclick",'return campaign_queue_data(this,\'stop\',\''+id+'\')');
                    e.querySelector("i").classList.remove("fa-eercast");
                    e.querySelector("i").classList.add("fa-refresh");
                    e.querySelector("i").classList.add("fa-spin");
                }
                if(type == 'stop'){
                    e.classList.remove("btn-warning");
                    e.classList.add("btn-success");
                    e.setAttribute("onclick",'return campaign_queue_data(this,\'start\',\''+id+'\')');
                    e.querySelector("i").classList.remove("fa-refresh");
                    e.querySelector("i").classList.add("fa-eercast");
                    e.querySelector("i").classList.remove("fa-spin");
                }
            }
        }, error: function (err) {
            console.log(err);
        }
    });
}