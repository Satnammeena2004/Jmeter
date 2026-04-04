/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [1.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Login with alice@test.com"], "isController": false}, {"data": [1.0, 500, 1500, "Login with diana@test.com"], "isController": false}, {"data": [1.0, 500, 1500, "Login with eve@test.com"], "isController": false}, {"data": [1.0, 500, 1500, "Transaction Controller"], "isController": true}, {"data": [1.0, 500, 1500, "Dashboard for eve@test.com"], "isController": false}, {"data": [1.0, 500, 1500, "Login with charlie@test.com"], "isController": false}, {"data": [1.0, 500, 1500, "Dashboard for alice@test.com"], "isController": false}, {"data": [1.0, 500, 1500, "Login with bob@test.com"], "isController": false}, {"data": [1.0, 500, 1500, "Dashboard for charlie@test.com"], "isController": false}, {"data": [1.0, 500, 1500, "Dashboard for diana@test.com"], "isController": false}, {"data": [1.0, 500, 1500, "Dashboard for bob@test.com"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 600, 0, 0.0, 4.628333333333337, 1, 133, 3.0, 5.0, 6.0, 47.77000000000021, 29.473891044849438, 10.460688814044309, 6.551704419855578], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Login with alice@test.com", 100, 0, 0.0, 5.109999999999999, 2, 97, 4.0, 6.0, 8.899999999999977, 96.2099999999996, 5.0393065914130215, 1.75047007281798, 1.1318755039306592], "isController": false}, {"data": ["Login with diana@test.com", 100, 0, 0.0, 4.009999999999999, 2, 21, 4.0, 5.0, 7.0, 20.91999999999996, 5.09502216334641, 1.7702216653079943, 1.1443897437203852], "isController": false}, {"data": ["Login with eve@test.com", 100, 0, 0.0, 5.46, 2, 133, 4.0, 6.0, 6.0, 131.86999999999944, 4.912315174141573, 1.6870732426192465, 1.0937576754924596], "isController": false}, {"data": ["Transaction Controller", 500, 0, 0.0, 5.554000000000001, 2, 136, 4.0, 7.0, 8.949999999999989, 60.8900000000001, 24.58089572784032, 10.46891707327565, 6.556857916277469], "isController": true}, {"data": ["Dashboard for eve@test.com", 20, 0, 0.0, 2.75, 2, 6, 2.5, 4.0, 5.899999999999999, 6.0, 5.913660555884093, 2.335145161886458, 1.2569416210821998], "isController": false}, {"data": ["Login with charlie@test.com", 100, 0, 0.0, 5.750000000000002, 2, 131, 4.0, 6.0, 7.949999999999989, 130.16999999999956, 5.14853524172373, 1.8088252329712198, 1.1664650157030325], "isController": false}, {"data": ["Dashboard for alice@test.com", 20, 0, 0.0, 2.7, 2, 4, 3.0, 3.900000000000002, 4.0, 4.0, 5.002501250625312, 1.9858562093546772, 1.0640085667833916], "isController": false}, {"data": ["Login with bob@test.com", 100, 0, 0.0, 4.85, 2, 64, 4.0, 5.0, 7.0, 63.949999999999974, 5.0110242533573865, 1.7210225777961516, 1.1157358689116055], "isController": false}, {"data": ["Dashboard for charlie@test.com", 20, 0, 0.0, 2.5, 2, 4, 2.0, 3.0, 3.9499999999999993, 4.0, 6.995452955578874, 2.7882755115424973, 1.4879000524658972], "isController": false}, {"data": ["Dashboard for diana@test.com", 20, 0, 0.0, 2.55, 1, 5, 2.5, 3.0, 4.899999999999999, 5.0, 6.435006435006435, 2.55326476029601, 1.3683814953346203], "isController": false}, {"data": ["Dashboard for bob@test.com", 20, 0, 0.0, 2.45, 1, 4, 2.0, 3.900000000000002, 4.0, 4.0, 7.877116975187082, 3.1123843048444266, 1.674656606931863], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 600, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
