



function jsonToTable(file){

    fetch('https://karmck.github.io/greensscraper/'+file)
    .then(response => response.json())
    .then((data) => {
        console.log(data);
        //Get the headers from JSON data
        var headers = Object.keys(data[0]);

        //Prepare html header
        var headerRowHTML = '<thead><tr></th><th>';
        for (var i = 0; i < headers.length; i++) {
            headerRowHTML += '<th>' + headers[i] + '</th>';
        }
        headerRowHTML += '</tr></thead>';

        //Prepare all the employee records as HTML
        var allRecordsHTML = '<tbody>';
        for (var i = 0; i < data.length; i++) {

            //Prepare html row
            allRecordsHTML += '<tr><td>+</td>';
            for (var j = 0; j < headers.length; j++) {
                var header = headers[j];
                allRecordsHTML += '<td>' + data[i][header] + '</td>';
            }
            allRecordsHTML += '</tr>';

        }
        allRecordsHTML += '</tbody>';

        //Append the table header and all records
        var table = document.getElementById("display_json_data");
        table.innerHTML = headerRowHTML + allRecordsHTML;
    })
    .then(() => {
        $(document).ready(function () {
            var table = $('#display_json_data').DataTable({
                // dom: 'lpftrip',
                deferRender: true,
                rowReorder: {
                    selector: 'td:nth-child(2)'
                },
                responsive: {
                    details: {
                        // type: 'column',
                        display: $.fn.dataTable.Responsive.display.childRowImmediate,
                        type: 'inline'
                        // type: ''
                    }
                },
                order: [[5, "desc"]],
                pageLength: 50,
                columnDefs: [
                    {
                        className: 'dtr-control',
                        orderable: false,
                        targets: 0
                    },
                    { responsivePriority: 1, targets: 2 },
                    { responsivePriority: 2, targets: 5 },
                    { responsivePriority: 3, targets: 3 },
                    { responsivePriority: 4, targets: 6 },
                    { responsivePriority: 5, targets: 1 }
                ],
                fixedHeader: {
                    header: true,
                    footer: false
                },
            });
        });
    });

}

