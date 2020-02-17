/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.secmon.ui.browse.utils = {};

sap.secmon.ui.browse.utils.CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
sap.secmon.ui.browse.utils.XCSRFToken = "";

sap.secmon.ui.browse.utils.createApplicationContextModelSync = function() {
    if (!sap.ui.getCore().getModel('applicationContext')) {
        var oDeferred = $.Deferred();
        var oCommons = this.oCommons;
        $.ajax({
            url : encodeURI("/sap/secmon/services/common/ApplicationContext.xsjs"),
            async : false,
            type : "GET",
            success : function(data, textStatus, XMLHttpRequest) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(data);
                sap.ui.getCore().setModel(oModel, 'applicationContext');
                oDeferred.resolve(oModel);
            },
            error : function(xhr, textStatus, errorThrown) {
                oDeferred.reject();
                alert(oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
            }
        });
        return oDeferred.promise();
    }
},

sap.secmon.ui.browse.utils.postJSon = function(url, body, async) {
    if (sap.secmon.ui.browse.utils.XCSRFToken === "") {
        sap.secmon.ui.browse.utils.XCSRFToken = sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
    }

    return $.ajax({
        url : url,
        async : async !== undefined ? async : true,
        type : "POST",
        contentType : "application/json;charset=utf-8",
        data : body,
        beforeSend : function(xhr) {
            xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
        },
    // success : function(data, textStatus, XMLHttpRequest) {
    // var originLocation =
    // XMLHttpRequest.getResponseHeader("x-sap-origin-location");
    // var loginHeader = XMLHttpRequest.getResponseHeader("x-sap-login-page");
    // if (loginHeader !== null && originLocation !== null) {
    // document.location.reload(true);
    // }
    // },
    // fail : function(xhr, textStatus, errorThrown) {
    // if (textStatus === "error") {
    // if (xhr.status === 403) { // Forbidden
    // if (xhr.getResponseHeader("X-CSRF-Token")) {
    // var that = this;
    // sap.secmon.ui.browse.utils.XCSRFToken =
    // sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
    // $.ajax(that);
    // return;
    // }
    // }
    // console.log(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
    // }
    // }
    }).done(function(data, textStatus, XMLHttpRequest) {
        var originLocation = XMLHttpRequest.getResponseHeader("x-sap-origin-location");
        var loginHeader = XMLHttpRequest.getResponseHeader("x-sap-login-page");
        if (loginHeader !== null && originLocation !== null) {
            document.location.reload(true);
        }
    }).fail(function(xhr, textStatus, errorThrown) {
        if (textStatus === "error") {
            if (xhr.status === 403) { // Forbidden
                if (xhr.getResponseHeader("X-CSRF-Token")) {
                    var that = this;
                    sap.secmon.ui.browse.utils.XCSRFToken = sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                    $.ajax(that);
                    return;
                }
            }
            console.log(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
        }
    });
};

sap.secmon.ui.browse.utils.putJSon = function(url, body) {
    if (sap.secmon.ui.browse.utils.XCSRFToken === "") {
        sap.secmon.ui.browse.utils.XCSRFToken = sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
    }

    return $.ajax({
        url : url,
        async : true,
        type : "PUT",
        contentType : "application/json;charset=utf-8",
        data : body,
        beforeSend : function(xhr) {
            xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
        },
        success : function(data, textStatus, XMLHttpRequest) {
            var originLocation = XMLHttpRequest.getResponseHeader("x-sap-origin-location");
            var loginHeader = XMLHttpRequest.getResponseHeader("x-sap-login-page");
            if (loginHeader !== null && originLocation !== null) {
                document.location.reload(true);
            }
        },
        fail : function(xhr, textStatus, errorThrown) {
            if (textStatus === "error") {
                if (xhr.status === 403) { // Forbidden
                    if (xhr.getResponseHeader("X-CSRF-Token")) {
                        var that = this;
                        sap.secmon.ui.browse.utils.XCSRFToken = sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                        $.ajax(that);
                        return;
                    }
                }
                console.log(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
            }
        }
    });
};
sap.secmon.ui.browse.utils.deleteHttp = function(url, body) {
    if (sap.secmon.ui.browse.utils.XCSRFToken === "") {
        sap.secmon.ui.browse.utils.XCSRFToken = sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
    }

    return $.ajax({
        url : url,
        async : true,
        type : "DELETE",
        contentType : "application/json;charset=utf-8",
        data : body,
        beforeSend : function(xhr) {
            xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
        },
        success : function(data, textStatus, XMLHttpRequest) {
            var originLocation = XMLHttpRequest.getResponseHeader("x-sap-origin-location");
            var loginHeader = XMLHttpRequest.getResponseHeader("x-sap-login-page");
            if (loginHeader !== null && originLocation !== null) {
                document.location.reload(true);
            }
        },
        fail : function(xhr, textStatus, errorThrown) {
            if (textStatus === "error") {
                if (xhr.status === 403) { // Forbidden
                    if (xhr.getResponseHeader("X-CSRF-Token")) {
                        var that = this;
                        sap.secmon.ui.browse.utils.XCSRFToken = sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                        $.ajax(that);
                        return;
                    }
                }
                console.log(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
            }
        }
    });
};

sap.secmon.ui.browse.utils.getXCSRFToken = function() {
    return $.ajax({
        url : "/sap/secmon/services/token.xsjs",
        async : false,
        type : "GET",
        beforeSend : function(xhr) {
            xhr.setRequestHeader("X-CSRF-Token", "Fetch");
        },
        success : function(data, textStatus, XMLHttpRequest) {

        },
        error : function(xhr, textStatus, errorThrown) {
            console.log(textStatus + " " + errorThrown);
        }
    });
};

sap.secmon.ui.browse.utils.isTypeNumber = function(dataType) {
    switch (dataType) {
    case sap.secmon.ui.browse.Constants.C_DATA_TYPE.INTEGER:
    case sap.secmon.ui.browse.Constants.C_DATA_TYPE.BIG_INTEGER:
    case sap.secmon.ui.browse.Constants.C_DATA_TYPE.DOUBLE:
    case sap.secmon.ui.browse.Constants.C_DATA_TYPE.NUMBER:
        return true;
    default:
        return false;
    }
};

// new sap.ui.model.type.Date({source: {pattern: "YYYY-MM-ddTHH:mm:ssZ"}, ..
sap.secmon.ui.browse.utils.formatDateTime = function(dVal) {
    // format of UTC time without millisec and with Z for UTC
    var oDateTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
        pattern : "yyyy-MM-ddTHH:mm:ss"
    });

    // timezoneOffset is in hours convert to milliseconds
    var TZOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    // format date and time to strings offsetting to GMT
    return oDateTimeFormat.format(new Date(dVal.getTime() + TZOffsetMs)) + "Z";
};

sap.secmon.ui.browse.utils.formatISODateTime =
        function(d) {
            // YYYY-MM-DDThh:mm:ss
            return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + 'T' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) +
                    ':' + ('0' + d.getSeconds()).slice(-2);
        };

sap.secmon.ui.browse.utils.isInteger = function(n) {
    return typeof (n) === "number" && n === +n && Math.round(n) === n;
    // return Math.floor(x) === x;
};

/*
 * Converts a given date object to a date string of format YYYY-MM-DD Example: 20140717 The date string refers to local time zone.
 */
sap.secmon.ui.browse.utils.getDateAsYyyymmdd = function(date) {
    var month = date.getMonth() + 1;
    month = month.toString().length === 1 ? "0" + month : month;
    var day = date.getDate();
    day = day.toString().length === 1 ? "0" + day : day;
    var todayYyyymmdd = date.getFullYear() + "-" + month + "-" + day;
    // the getFullYear method returns e.g. 2012
    return todayYyyymmdd;
};

// /*
// * Converts a given date object to a date string of format YYYY-MM-DD
// Example:
// * 20140717 The date string refers to local time zone.
// */
// function getDateAsYyyy_mm_dd(date) {
// var month = date.getMonth() + 1;
// month = month.toString().length === 1 ? "0" + month : month;
// var day = date.getDate();
// day = day.toString().length === 1 ? "0" + day : day;
// var todayYyyymmdd = date.getFullYear() + "-" + month + "-" + day;
// // the getFullYear method returns e.g. 2012
// return todayYyyymmdd;
// };

/*
 * Converts a given date object to a date string of format YYYY-MM-DD Example: 20140717 The date string refers to time zone UTC.
 */
sap.secmon.ui.browse.utils.getDateAsYyyymmddUTC = function(date) {
    var month = date.getUTCMonth() + 1;
    month = month.toString().length === 1 ? "0" + month : month;
    var day = date.getUTCDate();
    day = day.toString().length === 1 ? "0" + day : day;
    var todayYyyymmdd = date.getUTCFullYear() + "-" + month + "-" + day;
    // the getFullYear method returns e.g. 2012
    return todayYyyymmdd;
};

/*
 * Extracts the hour and minutes of given date Object in format HH:MM and local time zone.
 */
sap.secmon.ui.browse.utils.getTimeAsHHMMSS = function(date) {
    var hours = date.getHours();
    hours = hours.toString().length === 1 ? "0" + hours : hours;
    var minutes = date.getMinutes();
    minutes = minutes.toString().length === 1 ? "0" + minutes : minutes;
    var seconds = date.getSeconds();
    seconds = seconds.toString().length === 1 ? "0" + seconds : seconds;
    return hours + "" + minutes + "" + seconds;
};

/*
 * Extracts the hour and minutes of given date Object format HH:MM and UTC.
 */
sap.secmon.ui.browse.utils.getTimeAsHHMMSSUTC = function(date) {
    var hours = date.getUTCHours();
    hours = hours.toString().length === 1 ? "0" + hours : hours;
    var minutes = date.getUTCMinutes();
    minutes = minutes.toString().length === 1 ? "0" + minutes : minutes;
    var seconds = date.getUTCSeconds();
    seconds = seconds.toString().length === 1 ? "0" + seconds : seconds;
    return hours + ":" + minutes + ":" + seconds;
};

sap.secmon.ui.browse.utils.getSelectedPeriod = function(value, bUTC) {
    if (value.operator === "BETWEEN") {
        var dFrom = new Date(Date.parse(value.searchTerms[0]));
        var dTo = new Date(Date.parse(value.searchTerms[1]));
        var sFrom = sap.secmon.ui.commons.Formatter.dateFormatterEx(bUTC, dFrom);
        sFrom = sFrom.includes("UTC") ? sFrom.substr(0, sFrom.indexOf("UTC")) : sFrom.substr(0, sFrom.indexOf("GMT"));
        var sTo = sap.secmon.ui.commons.Formatter.dateFormatterEx(bUTC, dTo);
        return oTextBundle.getText("MM_TIT_EVENTSERIES", [ sFrom, sTo ]);
    } else {
        return oTextBundle.getText("Interpret_" + value.searchTerms[0]);
    }
};

sap.secmon.ui.browse.utils.mapUI2Query = function(startSubset, workspace, operation, aDimensions, aMeasures, bRequestEnum) {

    var oQuery = {};

    var oWorkspaceCopy = $.extend(true, {}, workspace);

    oQuery.operation = operation;

    // if (oWorkspaceCopy.context !== undefined) {
    // oQuery.context = oWorkspaceCopy.context;
    // }

    if (oWorkspaceCopy.period !== undefined) {
        oQuery.period = oWorkspaceCopy.period;
    }

    if (oWorkspaceCopy.now !== undefined) {
        oQuery.now = oWorkspaceCopy.now;
    }

    if (!(aDimensions === undefined || aDimensions === null || aDimensions.length <= 0)) {
        oQuery.dimensions = aDimensions;
    }

    var aaUsedDatasets = {};
    var aSubsets2Visit = [];
    var reSubset = /Path\d+\.Subset\d+/g;

    if (operation === sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.CREATE_CHART || operation === sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.CREATE_PATTERN) {
        oQuery.measures = [];
        var oQueryMeasure = {};

        $.each(aMeasures, function(index, oMeasure) {

            oQueryMeasure = $.extend(true, {}, oMeasure);
            oQueryMeasure.dataSets = [];
            aaUsedDatasets = {};
            aSubsets2Visit = [];
            reSubset = /Path\d+\.Subset\d+/g;
            if (oQueryMeasure.startDatasets && reSubset.exec(oQueryMeasure.startDatasets[0].name) !== null) {
                aSubsets2Visit.push(oQueryMeasure.startDatasets[0].name);
                sap.secmon.ui.browse.utils.visitSubset(aSubsets2Visit, oWorkspaceCopy, oQueryMeasure, aaUsedDatasets);
            }

            oQuery.measures.push(oQueryMeasure);
        });

    } else {
        if (!$.isEmptyObject(aMeasures)) {
            oQuery.measures = aMeasures;
        }
        if (operation === sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_FILTER_VALUES) {
            oQuery.requestEnum = bRequestEnum || false;
        }
        oQuery.dataSets = [];
        aSubsets2Visit.push(startSubset);

        var aPathItems = [];
        var sPathLuid;
        var iPathIdx;

        if (reSubset.exec(startSubset) !== null) {
            aPathItems = startSubset.split(".")[0].split("Path");
            sPathLuid = aPathItems[1];
            iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceCopy);
            oQuery.context = oWorkspaceCopy.paths[iPathIdx].context || oWorkspaceCopy.context;

            sap.secmon.ui.browse.utils.visitSubset(aSubsets2Visit, oWorkspaceCopy, oQuery, aaUsedDatasets);
        } else {
            aPathItems = startSubset.split("Path");
            sPathLuid = aPathItems[1];
            iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceCopy);
            oQuery.context = (oWorkspaceCopy.paths[iPathIdx] ? oWorkspaceCopy.paths[iPathIdx].context : oWorkspaceCopy.context) || oWorkspaceCopy.context;
        }
        oQuery.startDatasets = [ {
            name : startSubset
        } ];
    }

    return oQuery;
};

sap.secmon.ui.browse.utils.visitSubset = function(aSubsets2Visit, workspace, oQuery, aaUsedDatasets) {

    // Path1.Subset1, Path1.Subset2...
    var aBuf = aSubsets2Visit[0].split(".");
    var aPath = aBuf[0].split("Path");
    var aSubset = aBuf[1].split("Subset");

    var sPathLuid = aPath[1];
    var sStartSubsetLuid = aSubset[1];

    var iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, workspace);
    var iStartSubsetIdx = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(sStartSubsetLuid, iPathIdx, workspace);

    // oQuery.context = workspace.paths[iPathIdx].context ||
    // workspace.context;

    var oDataSet = {};
    oDataSet.name = aSubsets2Visit[0];
    oDataSet.context = workspace.paths[iPathIdx].context || workspace.context;
    oDataSet.filters = [];
    oDataSet.dependsOn = [];

    if (aaUsedDatasets.hasOwnProperty(aSubsets2Visit[0]) !== true && workspace.paths[iPathIdx].filters.length > 0) {
        aaUsedDatasets[aSubsets2Visit[0]] = "";

        for (var i = iStartSubsetIdx; i >= 0; i--) {
            if (workspace.paths[iPathIdx].filters[i].isFieldRef === 1) {
                var oDependsOn = {};
                oDependsOn.key = workspace.paths[iPathIdx].filters[i].key;
                var aBufRefDS = workspace.paths[iPathIdx].filters[i].valueRange.searchTerms[0].split(".");
                oDependsOn.dependsOnKey = workspace.paths[iPathIdx].filters[i].valueRange.searchTermRefKeys[0];
                if (workspace.paths[iPathIdx].filters[i].valueRange.exclude !== undefined) {
                    oDependsOn.exclude = workspace.paths[iPathIdx].filters[i].valueRange.exclude;
                }
                if (workspace.paths[iPathIdx].filters[i].valueRange.operator !== undefined) {
                    oDependsOn.operator = workspace.paths[iPathIdx].filters[i].valueRange.operator;
                } else {
                    oDependsOn.operator = '=';
                }
                oDependsOn.dataSet = aBufRefDS[0] + "." + aBufRefDS[1];
                oDataSet.dependsOn.push(oDependsOn);

                if (aaUsedDatasets.hasOwnProperty(oDependsOn.dataSet) !== true) {
                    aSubsets2Visit.push(oDependsOn.dataSet);
                }

            } else {
                var oFilter = {};
                oFilter.key = workspace.paths[iPathIdx].filters[i].key;
                oFilter.or = workspace.paths[iPathIdx].filters[i].or;
                oFilter.roleIndependent = workspace.paths[iPathIdx].filters[i].roleIndependent;
                oFilter.valueRange = $.extend({}, workspace.paths[iPathIdx].filters[i].valueRange);
                if (workspace.paths[iPathIdx].filters[i].valueRange.operator === "IN VALUE LIST") {
                    oFilter.valueRange.searchTerms = [];
                    workspace.paths[iPathIdx].filters[i].valueRange.searchTerms.forEach(function(x) {
                        oFilter.valueRange.searchTerms.push(x.key);
                    });
                }

                if (oFilter.valueRange.operator === 'LIKE') {
                    oFilter.valueRange.searchTerms[0] = oFilter.valueRange.searchTerms[0].replace(/\*/g, "%");
                }
                oDataSet.filters.push(oFilter);
            }
        }
        // filters are in the same order as shown in UI (important for OR operator)
        oDataSet.filters.reverse();

        oQuery.dataSets.push(oDataSet);
    }

    aSubsets2Visit.splice(0, 1);

    if (aSubsets2Visit.length > 0) {
        sap.secmon.ui.browse.utils.visitSubset(aSubsets2Visit, workspace, oQuery, aaUsedDatasets);
    }

};

sap.secmon.ui.browse.utils.getArtifactIdxByLuid = function(luid, workspace) {

    var iArtifactIndex = -1;
    for (var i = 0, maxLen = workspace.artifacts.length; i < maxLen; i++) {
        if (workspace.artifacts[i].luid == luid) {
            iArtifactIndex = i;
            break;
        }
    }
    return iArtifactIndex;
};

sap.secmon.ui.browse.utils.getPathIdxByLuid = function(luid, workspace) {

    for (var i = 0, maxLen = workspace.paths.length; i < maxLen; i++) {
        if (workspace.paths[i].luid == luid) {
            return i;
        }
    }
};

sap.secmon.ui.browse.utils.getSubsetIdxByLuid = function(luid, pathIdx, workspace) {

    for (var i = 0, maxLen = workspace.paths[pathIdx].filters.length; i < maxLen; i++) {
        if (workspace.paths[pathIdx].filters[i].luid == luid) {
            return i;
        }
    }
};

sap.secmon.ui.browse.utils.getSubsetCountItems = function(luid, pathIdx, workspace) {
    for (var i = 0, maxLen = workspace.paths[pathIdx].filters.length; i < maxLen; i++) {
        if (workspace.paths[pathIdx].filters[i].luid === +luid) {
            return workspace.paths[pathIdx].filters[i].count;
        }
    }
};

sap.secmon.ui.browse.utils.getPathCountItems = function(luid, workspace) {
    for (var i = 0, maxLen = workspace.paths.length; i < maxLen; i++) {
        if (workspace.paths[i].luid === +luid) {
            return workspace.paths[i].count;
        }
    }
};
sap.secmon.ui.browse.utils.findWhereUsedAsRef = function(recursive, subset, workspace) {

    var aaUsages = {};
    sap.secmon.ui.browse.utils.findUsagesByRef(subset, workspace, aaUsages);

    if (recursive) {
        for ( var currSubset in aaUsages) {
            if (aaUsages.hasOwnProperty(currSubset)) {
                if (!aaUsages[currSubset].visited) {
                    sap.secmon.ui.browse.utils.findUsagesByRef(currSubset, workspace, aaUsages);
                    aaUsages[currSubset].visited = true;
                }
            }
        }
    }

    return aaUsages;
};

sap.secmon.ui.browse.utils.findUsagesByRef = function(subset, workspace, aaUsages) {

    for (var i = 0, maxLen = workspace.paths.length; i < maxLen; i++) {
        for (var j = 0, jmaxLen = workspace.paths[i].filters.length; j < jmaxLen; j++) {
            if (workspace.paths[i].filters[j].isFieldRef === 1) {
                if (workspace.paths[i].filters[j].valueRange.searchTerms[0].indexOf(subset) >= 0) {
                    var foundSubset = "Path" + workspace.paths[i].luid + ".Subset" + workspace.paths[i].filters[j].luid;
                    if (aaUsages.hasOwnProperty(foundSubset) !== true) {
                        aaUsages[foundSubset] = {};
                        aaUsages[foundSubset].pathIdx = i;
                        aaUsages[foundSubset].subsetIdx = j;
                        aaUsages[foundSubset].pathLuid = workspace.paths[i].luid;
                        aaUsages[foundSubset].subsetLuid = workspace.paths[i].filters[j].luid;
                        aaUsages[foundSubset].visited = false;
                    }
                }
            }
        }
    }
};

sap.secmon.ui.browse.utils.findDependentSubsets = function(subset, workspace) {

    var aaDepSubsets = {};
    fnVisitPathDependency(subset, workspace, aaDepSubsets);
    return aaDepSubsets;

    function fnVisitRefDependency(workspace, sCurrSubset) {
        var aaUsages = {};
        if (aaDepSubsets.hasOwnProperty(sCurrSubset)) {
            if (!aaDepSubsets[sCurrSubset].visitedAsRefDep) {
                sap.secmon.ui.browse.utils.findUsagesByRef(sCurrSubset, workspace, aaUsages);
                aaDepSubsets[sCurrSubset].visitedAsRefDep = true;
                for ( var sFoundSubset in aaUsages) {
                    if (aaUsages.hasOwnProperty(sFoundSubset)) {
                        fnVisitPathDependency(sFoundSubset, workspace, aaDepSubsets);
                    }
                }
            }
        }
    }

    function fnVisitPathDependency(subset, workspace, aaDepSubsets) {
        // Path1.Subset1, Path1.Subset2...
        var aBuf = subset.split(".");
        var aPath = aBuf[0].split("Path");
        var aSubset = aBuf[1].split("Subset");

        var sPathLuid = aPath[1];
        var sSubsetLuid = aSubset[1];

        var iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, workspace);
        var iSubsetIdx = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(sSubsetLuid, iPathIdx, workspace);

        for (var i = iSubsetIdx, iMaxLen = workspace.paths[iPathIdx].filters.length; i < iMaxLen; i++) {
            var sFoundSubset = "Path" + sPathLuid + ".Subset" + workspace.paths[iPathIdx].filters[i].luid;
            if (!aaDepSubsets.hasOwnProperty(sFoundSubset)) {
                aaDepSubsets[sFoundSubset] = {};
                aaDepSubsets[sFoundSubset].pathIdx = iPathIdx;
                aaDepSubsets[sFoundSubset].subsetIdx = i;
                aaDepSubsets[sFoundSubset].pathLuid = sPathLuid;
                aaDepSubsets[sFoundSubset].subsetLuid = workspace.paths[iPathIdx].filters[i].luid;
                aaDepSubsets[sFoundSubset].visitedAsRefDep = false;
                aaDepSubsets[sFoundSubset].visitedAsPathDep = false;
                fnVisitRefDependency(workspace, sFoundSubset);
            } else if (!aaDepSubsets[sFoundSubset].visitedAsPathDep) {
                aaDepSubsets[sFoundSubset].visitedAsPathDep = true;
            }
        }
    }
};

/**
 * Returns the Local Unique Identifier
 * 
 * @param aObjects
 *            array of objects each of which contains aproperty called "luid" of type int
 * @returns {Number}
 */
sap.secmon.ui.browse.utils.generateLuid = function(aObjects) {
    var len = aObjects.length;
    if (len === 0) {
        return 1;
    }

    var i = 0;
    var iMax = 100;
    var bFound = true;
    while (bFound && i++ < iMax) {
        // search in the whole list of current LUIDs
        bFound = false;
        for (var j = 0; j < len; j++) {
            if (i === aObjects[j].luid) {
                bFound = true;
                break;
            }
        }
        if (!bFound) {
            return i;
        }
    }

    return -1;
};

sap.secmon.ui.browse.utils.path2Id = function(sBindingPath) {

    var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
    var aPathItems;
    var idxPath;
    var sPathLuid;

    // sBindingPath format => /paths/1/filters/2 || /paths/0
    if (sBindingPath.indexOf("/filters/") > -1) {
        aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        sPathLuid = oWorkspaceData.paths[idxPath].luid;
        var sSubsetLuid = oWorkspaceData.paths[idxPath].filters[idxSubset].luid;

        return "Path" + sPathLuid + ".Subset" + sSubsetLuid;
    } else {
        aPathItems = sBindingPath.split("/paths/");
        idxPath = parseInt(aPathItems[1]);

        sPathLuid = oWorkspaceData.paths[idxPath].luid;

        return "Path" + sPathLuid;
    }
};

sap.secmon.ui.browse.utils.formatByThousands = function(sInput, sSeparator) {
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(sInput)) {
        sInput = sInput.replace(pattern, "$1" + sSeparator + "$2");
    }
    return sInput;
};

sap.secmon.ui.browse.utils.getController = function() {
    return sap.ui.getCore().byId('idShell--shlMain').getParent().getController();
};

sap.secmon.ui.browse.utils.getView = function() {
    return sap.ui.getCore().byId('idShell');
};

sap.secmon.ui.browse.utils.generateGUID = function() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).toUpperCase();
};

sap.secmon.ui.browse.utils.generateNameSuffix = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 3; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};

sap.secmon.ui.browse.utils.readOriginalNamespaces = function(fnCallback) {

    var oNamespaceListModel = new sap.ui.model.odata.ODataModel("/" + sap.secmon.ui.browse.Constants.C_ODATA_NAMESPACE.URL + "/" + sap.secmon.ui.browse.Constants.C_ODATA_NAMESPACE.SERVICE, {
        json : true,
        defaultCountMode : sap.ui.model.odata.CountMode.Inline
    });

    oNamespaceListModel.read('/' + sap.secmon.ui.browse.Constants.C_ODATA_NAMESPACE.RESOURCE, {
        async : false,
        success : function(oData) {
            fnCallback.call(this, true, oData.results);
        },
        error : function(oError) {
            fnCallback.call(this, false, oError);
        }
    });
};

sap.secmon.ui.browse.utils.isReadOnly = function(sNamespace, fnSave) {

    if (sNamespace === "") {
        fnSave.call(this, false);
    } else {
        var bReadOnly = true;
        var oNamespaceListModel = new sap.ui.model.odata.ODataModel("/" + sap.secmon.ui.browse.Constants.C_ODATA_NAMESPACE.URL + "/" + sap.secmon.ui.browse.Constants.C_ODATA_NAMESPACE.SERVICE, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });

        oNamespaceListModel.read('/' + sap.secmon.ui.browse.Constants.C_ODATA_NAMESPACE.RESOURCE, {
            async : false,
            success : function(data) {
                $.each(data.results, function(idx, oResult) {
                    if (oResult.NameSpace === sNamespace) {
                        bReadOnly = false;
                        return false;
                    }
                });
                fnSave.call(this, bReadOnly);
            },
            error : function() {
                fnSave.call(this, bReadOnly);
            }
        });
    }
};

sap.secmon.ui.browse.utils.getPatternsByTrigger = function(sPatternId) {

    return JSON.parse($.ajax({
        url : sap.secmon.ui.browse.Constants.C_USAGES_TRIGGER_PATH + sPatternId,
        async : false,
        type : "GET",
        success : function(data, textStatus, XMLHttpRequest) {

        },
        error : function(xhr, textStatus, errorThrown) {
            console.log(textStatus + " " + errorThrown);
        }
    }).responseText);
};

// Sort the field list (searchable attributes) according to the hierarchy
// E.g.: Username<Roles>, UsernameDomain<Role> so only
// @param aFieldList: an array of fields, is sorted inline
sap.secmon.ui.browse.utils.sortFieldList = function(aFieldList) {

    var C_REX_ROLES = /(Acting|Actor|Initiating|Initiator|Intermediary|Reporter|Target|Targeting|Targeted)/;
    // sort the array inline (mutate it)
    aFieldList.sort(function(a1, a2) {
        // return a1.name.localeCompare(a1.name);
        var a1Prefix = a1.name.split(C_REX_ROLES)[0];
        var a2Prefix = a2.name.split(C_REX_ROLES)[0];

        if (a1Prefix < a2Prefix) {
            return -1;
        }
        if (a1Prefix > a2Prefix) {
            return +1;
        }
        return 0;
    });

    return aFieldList;
};

sap.secmon.ui.browse.utils.downloadZipfile = function(url, query) {

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onload = function() {
        if (this.status !== 200) {
            // throw ("BU_MSG_Download_ZIP_Failed");
            jQuery.sap.require("sap.ui.commons.MessageBox");
            sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_Download_ZIP_Failed"), sap.ui.commons.MessageBox.Icon.ERROR, "Error");
        }

        // file name is stored in this header. E.g.:
        // filename = 'data.zip'
        var contentDispo = xhr.getResponseHeader('Content-Disposition');
        var fnm = contentDispo.substring(contentDispo.indexOf("filename =") + 12, contentDispo.length - 1);

        var zip = new Blob([ this.response ], {
            type : xhr.getResponseHeader('Content-Type')
        });

        var downloadLink = document.createElement("a");
        downloadLink.href = (window.URL || window.webkitURL).createObjectURL(zip);
        downloadLink.download = fnm;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    xhr.send(JSON.stringify(query));
};

function getTimeRangeInMilliseconds(oValueRange) {
    if (oValueRange.operator === "BETWEEN") {
        return Date.parse(oValueRange.searchTerms[1]) - Date.parse(oValueRange.searchTerms[0]);
    }
    return sap.secmon.ui.browse.Constants.C_REL_TIME_LIST[oValueRange.searchTerms[0]];    
}

sap.secmon.ui.browse.utils.checkTimeRangesConsistency = function(oWorkspaceData) {
    var aTimeRanges = [], iTimeRange, iPeriod;

    oWorkspaceData.paths.forEach(function(oPath) {
        oPath.filters.forEach(function(oFilter) {
            if (oFilter.key === "53CDE6090DC572EEE10000000A4CF109") {
                aTimeRanges.push(getTimeRangeInMilliseconds(oFilter.valueRange));                
            }
        });           
    });

    iTimeRange = Math.max.apply(null, aTimeRanges);
    iPeriod = getTimeRangeInMilliseconds(oWorkspaceData.period);

    if (iTimeRange > iPeriod) {
        this.getController()
            .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_TRInconsistency"));       
    }    
};

sap.secmon.ui.browse.utils.checkWorkspaceTimeRange = function(oWorkspaceData) {
    var iPeriod, iFrequency = 0, sPatternName;

    this.checkTimeRangesConsistency(oWorkspaceData);
    
    iPeriod = getTimeRangeInMilliseconds(oWorkspaceData.period);

    oWorkspaceData.artifacts.forEach(function(oArtifact){
        if (oArtifact.type === "Pattern" && oArtifact.frequency > iFrequency) {
            iFrequency = oArtifact.frequency * 60 * 1000;
            sPatternName = oArtifact.name;
        }
    });     
    
    if (iFrequency > 0 && iPeriod > 2 * iFrequency) {        
        this.getController()
            .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_TooLongWorkspaceTR", sPatternName) + " " + 
                oTextBundle.getText("BU_MSG_TRRecommendation"));
        return;
    }
    if (iFrequency >= iPeriod) {
        this.getController()
            .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_FrequencyGEWorkspaceTR", sPatternName));
    }
};

sap.secmon.ui.browse.utils.checkPatternFrequency = function(oPattern) {
    var aTimeRanges = [], iTimeRange = 0, iFrequency, bTimeRangeSubset = true;

    iFrequency = oPattern.frequency * 60 * 1000;

    if (iFrequency < 5 * 60 * 1000) {
        this.getController()
            .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_FrequencyBelow5Min", oPattern.name));    
    }

    oPattern.measures.forEach(function(oMeasure) {
        if (oMeasure.dataSets) {
            oMeasure.dataSets.forEach(function(oDataSet) {
                oDataSet.filters.forEach(function(oFilter) {
                    if (oFilter.key === "53CDE6090DC572EEE10000000A4CF109") {
                        aTimeRanges.push(getTimeRangeInMilliseconds(oFilter.valueRange));                              
                    }
                });
            });
        }
    });

    if (aTimeRanges.length === 0) {
        bTimeRangeSubset = false;
        iTimeRange = getTimeRangeInMilliseconds(oPattern.period);
        if (iFrequency >= iTimeRange) {
            this.getController()
                .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_FrequencyGEWorkspaceTR", oPattern.name));
            return;
        }        
    } else {
        iTimeRange = Math.max.apply(null, aTimeRanges);
        if (iFrequency >= iTimeRange) {
            this.getController()
                .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_FrequencyGESubsetTR", oPattern.name));
            return;
        }
    }

    if (iFrequency > 0 && iTimeRange > 2 * iFrequency) {
        if (bTimeRangeSubset) {
            this.getController()
                .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_TooLongSubsetTR", oPattern.name) + " " + 
                    oTextBundle.getText("BU_MSG_TRRecommendation"));  
        } else {
            this.getController()
                .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_TooLongWorkspaceTR", oPattern.name) + " " + 
                    oTextBundle.getText("BU_MSG_TRRecommendation"));       
        }           
    }
};

sap.secmon.ui.browse.utils.checkSubsetTimeRange = function(oValueRange, sWorkspaceContext, oWorkspaceData) {
    var iTimeRange = 0, sPath, iFrequency = 0, sPatternName, iPeriod;

    sPath = sWorkspaceContext.split(".")[0];

    iTimeRange = getTimeRangeInMilliseconds(oValueRange);
    iPeriod = getTimeRangeInMilliseconds(oWorkspaceData.period);

    if (iTimeRange > iPeriod) {
        this.getController()
            .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_TRInconsistency"));       
    }

    oWorkspaceData.artifacts.forEach(function(oArtifact) {
        if (oArtifact.type === "Pattern") {
            oArtifact.measures.forEach(function(oMeasure) {
                if (oMeasure.dataSets) {
                    oMeasure.dataSets.forEach(function(oDataSet) {
                        if (oDataSet.name.includes(sPath)) {
                            iFrequency = oArtifact.frequency * 60 * 1000;
                            sPatternName = oArtifact.name;
                        }
                    });
                }
            });
        }
    });
    
    if (iFrequency > 0 && iTimeRange > 2 * iFrequency) {
        this.getController()
            .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_TooLongSubsetTR", sPatternName) + " " + 
                oTextBundle.getText("BU_MSG_TRRecommendation"));
        return;
    }
    if (iFrequency >= iTimeRange) {
        this.getController()
            .reportNotification(sap.ui.core.MessageType.Warning, oTextBundle.getText("BU_MSG_FrequencyGESubsetTR", sPatternName));       
    }
};

String.prototype.splice = function(idx, rem, s) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};