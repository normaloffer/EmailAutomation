class pagination {
    perpage = 0;
    constructor() {
        this.perpage = 1;
    }
    getAllPageLinks(pages, current) {
        var output = '';
        if (pages > 0) {
            if (current == 1) {
                output += '<li class="disabled"><a>First</a></li>'
            } else {
                output += '<li><a href="javascript:;" onclick="get_paginate_result(this,1)">First</a></li>'
            }
            if((current-1) > 0){
                let pr_page = current-1;
                output += '<li><a href="javascript:;" onclick="get_paginate_result(this,'+pr_page+')" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a></li>'
            }
            var i = (Number(current) > 5 ? Number(current) - 4 : 1)
            if (i !== 1) {
                output += '<li class="disabled"><a>...</a></li>'
            }
            for (; i <= (Number(current) + 4) && i <= pages; i++) {
                if (i == current) {
                    output += '<li class="active"><a>'+i+'</a></li>'
                } else {
                    output += '<li><a href="javascript:;" onclick="get_paginate_result(this,'+i+')">'+i+'</a></li>'
                }
                if (i == Number(current) + 4 && i < pages) {
                    output += '<li class="disabled"><a>...</a></li>'
                }
            }
            if (pages >= (current+1)) {
                let n_page = current+1;
                output += '<li><a href="javascript:;" onclick="get_paginate_result(this,'+n_page+')" aria-label="Next"><span aria-hidden="true">&raquo;</span></a></li>';
            }
            if (current == pages) {
                output += '<li class="disabled"><a>Last</a></li>'
            } else {
                output += '<li><a href="javascript:;" onclick="get_paginate_result(this,'+pages+')">Last</a></li>'
            }
        }
        return output;
    }
}
module.exports = new pagination();