function cacheBustedUrl(file) {
    return './' + file + '?v=' + Date.now();
}

function readLastUpdatedTextFile(file) {

    fetch(cacheBustedUrl(file), { cache: 'no-store' })
        .then(response => response.text())
        .then(text => document.getElementById("lastUpdated").innerHTML = "Last updated: " + text)
}

function jsonToTable(file) {


    $(document).ready(function () {

        // Ensure jQuery AJAX doesn't cache GET requests
        $.ajaxSetup({ cache: false });

        if ($.fn.dataTable.isDataTable('#display_json_data')) {
            table = $('#display_json_data').DataTable();
        }
        else {
            table = $('#display_json_data').DataTable({
                ajax: {
                    url: cacheBustedUrl(file),
                    dataSrc: '',
                    cache: false,
                },
                columns: [
                    { data: 'Category' },
                    { data: 'Product' },
                    { data: 'Image' },
                    { data: 'NormalPrice' },
                    { data: 'Discount' },
                    { data: 'ActualPrice' },
                    { data: 'Savings' },
                ],
                dom: 'lpftrip',
                    deferRender: true,
                    rowReorder: {
                        selector: 'td:nth-child(2)'
                    },
                    responsive: {
                        details: {
                            type: 'column',
                            display: $.fn.dataTable.Responsive.display.childRowImmediate,
                            // type: 'inline'
                            // type: ''
                        }
                    },
                    order: [[4, "desc"]],
                    pageLength: 100,
                    columnDefs: [
                        { width: 20, targets:0 },
                        { width: 200, targets: 2 },
                        // {
                        //     className: 'dtr-control',
                        //     orderable: false,
                        //     targets: -1
                        // },
                        { responsivePriority: 1, targets: 0 },
                        { responsivePriority: 2, targets: 1 },
                        { responsivePriority: 3, targets: 4 },
                        { responsivePriority: 4, targets: 2 },
                        { responsivePriority: 5, targets: 5 }
                    ],
                    fixedHeader: {
                        header: true,
                        footer: false
                    },
            });
        }


        $("#allItemsLink").click(function () {
            requestUrl = cacheBustedUrl("data_general.json");
            table.ajax.url(requestUrl).load();
        });

        $("#drinksLink").click(function () {
            requestUrl = cacheBustedUrl("data_drinks.json");
            table.ajax.url(requestUrl).load();
        });

    });


}

