jQuery.sap.declare("sap.secmon.ui.m.executionResultsfs.util.Formatter");

sap.secmon.ui.m.executionResultsfs.util.Formatter = {

    alertNumberFormatter : function(newAlertsCount, allAlertsCount) {
        return "" + newAlertsCount + "/" + allAlertsCount;
    },
    // According to problems to show a time series in charts in the underlying
    // view, which is used for the ui time is converted to number of seconds since 01-01-2010T00:00:00.00Z
    // The formatter converts this back to date objects and converts this a string of dates of the form (20xx-MM-DD)
    timeformatter : function(date) {
        return new Date((date + 1262304000) * 1000).toISOString().substr(0, 10);
    },
    convertToUnixTime : function(date) {
        return new Date((date + 1262304000) * 1000).getTime();
    },
    runtimeformatter : function(time) {
        return time / 1000;
    },
    averageFormatter : function(time, count) {
        return time / count;
    }

};
