// datalist link proccess
function listActionProccess(link) {
    var method = link.attr('data-method');
    if(typeof(method) === 'undefined' || method.trim() === '') {
        method = 'GET';
    }
    
    var url = link.attr("href");
    var list = link.parents(".datalist");
    var link_item = link;
    var ids = getDataListCheckedIds(list); 
    
    if(!ids.length) {
        swal({
            title: 'Please select at least 1 row in the list',
            text: '',
            type: 'error',
            allowOutsideClick: true,
            confirmButtonText: "OK"
        });
        return;
    }
    
    $.ajax({
        url: url,
        method: method,
        data: {
            'authenticity_token': AUTH_TOKEN,
            'format': 'json',
            'ids': ids
        }
    }).done(function( result ) {
        swal({
            title: result.message,
            text: '',
            type: result.type,
            allowOutsideClick: true,
            confirmButtonText: "OK"
        });
        
        // find outer datalist if exists
        if(link_item.parents('.datalist').length) {
            datalistFilter(link_item.parents('.datalist'));
        }
    });
}

// action
function getDataListCheckedIds(list) {
    var ids = list.find("input[name='ids[]']:checked").map(
        function () { return this.value; }
    ).get();
    
    return ids;
}

// checkDatalistCheckAllState
function checkDatalistCheckAllState(list) {
    var check_all_box = list.find('.datalist-checkbox-all');
    var ids = getDataListCheckedIds(list);
    
    if(ids.length) {
        check_all_box.prop('checked', true);
    } else {
        check_all_box.prop('checked', false);
    }
}

// Add to keywords
function removeFromKeywords(list, id) {
    var new_keywords = [];
    var listid = list.attr('data-id');
    
    // check if entry exist keyword groups
    keywords[listid].forEach(function(entry) {
        var exist = false;
        
        // check if entry exist keyword group entries
        entry.forEach(function(entry2) {            
            if(entry2.id == id) {
                exist = true;
            }
        });
        
        if(!exist) {
            new_keywords.push(entry);
        }
    });
    keywords[listid] = new_keywords;
}

// removeDatalistSearchItem
function removeDatalistSearchItem(list, id) {
    var item = $('[data-id="' + id + '"]');
    
    // if is checkable list
    if(item.length) {
        checkCheckableItem($('[data-id="' + id + '"]'));
    } else {
        // if it is keyword
        removeFromKeywords(list, id);
    }
}

// Generate unique id
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

// Add to keywords
function addToKeywords(list, item) {
    var id = list.attr('data-id');
    
    if(typeof(item) == 'undefined') {
        // get default keyword
        item = list.find(".datalist-search-helper ul li").eq(0).find("a .keyword");        
    }
    
    // get item values
    var name = item.attr("name");
    var text = item.attr("text");
    var value = item.html();
    
    item = {id: guid(), name: name, text: '<span class="ktext">' + value + '</span>', value: value, label: text};
    
    // Check if exists
    var exist = false;
    keywords[id].forEach(function(entry) {
        var inserted = false;
        entry.forEach(function(entry2) {
            if(entry2.name == item.name) {
                exist = true;
                if(entry2.text == item.text) {
                    inserted = true;
                }
            } else {
                inserted = true;
            }
        });
        
        if(!inserted) {
            entry.push(item);
        }
    });
    
    // add to keywords
    if(!exist) {
        keywords[id].push([item]);
    }
    
    // console.log(keywords[id]);
    datalistFilter(list);
    
    // clear current input
    list.find(".datalist-search-input").val("");
    list.find(".datalist-search-helper").hide();
}

// toggleDatalistSearchHelper
function toggleDatalistSearchHelper(list) {
    var keyword = list.find(".datalist-search-input").val();
    var helper = list.find(".datalist-search-helper");
    
    // Toggle helper box
    if(keyword.trim() !== '') {
        helper.show();
    } else {
        helper.hide();
    }
    
    // Update keyword field
    helper.find('.keyword').html(keyword);
}

// check checkable li item
function checkCheckableItem(li) {
    if(li.hasClass('checked')) {
        li.removeClass('checked');
    } else {            
        li.addClass('checked');
    }
}

function getUrlParameter(url, sParam) {
    var sPageURL = decodeURIComponent(url.split('?')[1]),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

// Add item to list search
function addItemToListSearch(list, ors, label) {
    var box = list.find('.list-search-items');
    var html = '';
    var texts = [];
    var ids = [];
    
    ors.forEach(function(entry) {
        texts.push(entry.text);
        ids.push(entry.id);
    });
    
    html = '<div class="btn-group btn-group-solid list-search-item" data-ids="' + ids.join(',') + '">' +
        '<button type="button" class="btn btn-sm green-meadow">' +
            label +
        '</button>' +
        '<button type="button" class="btn btn-sm grey">' +
            texts.join(' <span class="or-cond">' + LANG_OR +'</span> ') +
        '</button>' +
        '<button type="button" class="btn btn-sm grey cancel-button"><i class="fa fa-close"></i></button>' +
    '</div>';
    
    box.append(html);
}

// Add filters to list search items
function addItemsToListSearch(list, items, label) {
    items.forEach(function(ors) {
        addItemToListSearch(list, ors, label);
    });
}

// Get values from checkable list items
function getValuesFromCheckableList(items) {
    var conditions = [];
    var ors = [];
    items.each(function() {
        var id = $(this).attr('data-id');
        var name = $(this).attr('name');
        var value = $(this).attr('value');
        var text = $(this).find('a').html();
        var checked = $(this).hasClass('checked');
        
        // Push conditions to ors array
        if(typeof(name) !== 'undefined' && name.trim() !== '') {
            if(checked) {
                if(typeof(text) == 'undefined') {
                    text = '';
                }
                ors.push({'id': id, 'name': name, 'value': value, 'text': text.trim()});
            }
        }
        
        // Check if end of ors
        if($(this).hasClass('divider') && ors.length) {
            conditions.push(ors);
            ors = [];
        }
    });
    // Add last one
    if(ors.length) {
        conditions.push(ors);
    }
    
    return conditions;
}

// Filter all datalists in current page
function datalistFilterAll() {
    $('.datalist').each(function() {
        datalistFilter($(this));
    });
}

// Filter a datalist
function datalistFilter(list, page) {
    var url = list.attr('data-url');
    var id = list.attr('data-id');
    
    // check page
    if(typeof(page) == 'undefined') {
        page = 1;
    }
    
    // save current page
    list.attr('data-page', page);
    
    // Clear list search
    list.find('.list-search-items').html('');
    
    // Filters
    var filters = getValuesFromCheckableList(list.find('.datalist-filters li'));
    addItemsToListSearch(list, filters, '<i class="fa fa-filter"></i>');
    
    // Columns
    var columns = getValuesFromCheckableList(list.find('.datalist-columns-select li'));
    
    // Keywords
    if(typeof(keywords[id]) == 'undefined') {
        keywords[id] = [];
    }
    keywords[id].forEach(function(entry) {
        addItemToListSearch(list, entry, entry[0].label);
    });
    
    // ajax update custom sort
	if(datalists[id] && datalists[id].readyState != 4){
		datalists[id].abort();
	}
    datalists[id] = $.ajax({
        url: url,
        method: 'POST',
        data: {
            'authenticity_token': AUTH_TOKEN,
            'filters': filters,
            'columns': columns,
            'keywords': keywords[id],
            'page': page
        },
    }).done(function( html ) {
        list.find(".datalist-container" ).html( html );
    });
}

var datalists = {};
var keywords = {};
// Main js execute when loaded page
$(document).ready(function() {
    // Filter all datalists in first load
    datalistFilterAll();
    
    // Filters group link click    
    $(document).on('click', '.btn-group-checkable .dropdown-menu>li>a', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var li = $(this).parents('li');
        
        checkCheckableItem(li);
    });
    
    // Filter when click checkable items
    $(document).on('click', '.btn-group-checkable .dropdown-menu>li>a', function() {
        var list = $(this).parents('.datalist');
        datalistFilter(list);
    });
    
    // Change page
    $(document).on("click", ".datalist .pagination a", function(e) {
        var url = $(this).attr("href");
        var list = $(this).parents('.datalist');
        var page = getUrlParameter(url, 'page');
        
        datalistFilter(list, page);

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });
    
    // Remove item from search list
    $(document).on("click", ".list-search-item .cancel-button", function() {
        var item = $(this).parents('.list-search-item');
        var ids = item.attr('data-ids');
        var list = $(this).parents('.datalist');
        
        ids.split(",").forEach(function(id) {
            // checkCheckableItem($('[data-id="' + id + '"]'));
            removeDatalistSearchItem(list, id);
        });
        
        datalistFilter(list);
    });
    
    // Datalist search input
    $(document).on("keyup focus", ".datalist-search-input", function(e) {
        var list = $(this).parents('.datalist');
        toggleDatalistSearchHelper(list);
        
        var code = e.which;
        if(code==13) e.preventDefault();
        if(code==13){
            // add keyword to list
            addToKeywords(list);
        }
    });
    
    // Datalist search helper click
    $(document).on("click", ".datalist-search-helper ul li a", function() {
        var list = $(this).parents('.datalist');
        var keyword = $(this).find(".keyword");
        
        addToKeywords(list, keyword);
    });
    
    // Hide datalist helper
    $(document).mouseup(function (e)
    {
        var container = $(".list-filters-search");
        var helper = $(".datalist-search-helper");
        
        // if the target of the click isn't the container...
        if (!container.is(e.target) && container.has(e.target).length === 0) // ... nor a descendant of the container
        {
            helper.hide();
        }
    });
    
    // Check all list click
    $(document).on('click', '.datalist-checkbox-all', function() {
        var list = $(this).parents('.datalist');
        var item = $(this);        
        var checked = item.is(':checked');
        
        if(checked) {
            list.find('.datalist-row-checkbox').prop('checked', true);
        } else {
            list.find('.datalist-row-checkbox').prop('checked', false);
        }
    });
    
    // Check row checkbox
    $(document).on('click', '.datalist-row-checkbox', function() {
        var list = $(this).parents('.datalist');
        
        checkDatalistCheckAllState(list);
    });
    
    // List action
    // Datalist action link with message return
    $(document).on('click', '.datalist-list-action ul li a', function(e) {
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        
        listActionProccess($(this));
    });
});