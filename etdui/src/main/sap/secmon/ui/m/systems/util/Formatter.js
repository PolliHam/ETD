jQuery.sap.declare("sap.secmon.ui.m.systems.util.Formatter");

sap.secmon.ui.m.systems.util.Formatter = {

    systemTypeFormatter : function(systemType) {
        switch (systemType) {
        case "JAVA":
            return "Java";

        default:
            return systemType;
        }
    },

    timeLabelFormatter : function(utc) {
        if (utc === true || utc === 'true') {
            // text="{i18n>MEventTrend_Time}:"
            return this.getModel("i18n").getProperty("MEventTrend_UTCTime") + ':';
        } else {
            // text="{i18n>MEventTrend_UTCTime}:"
            return this.getModel("i18n").getProperty("MEventTrend_Time") + ':';
        }
    },

    nextDayEnabled : function(utc, day) {
        var endOfSelectedDay = new Date();
        endOfSelectedDay.setTime(day.getTime());
        var latestAllowedDate = new Date(); // today
        if (utc === true) {
            endOfSelectedDay.setUTCHours(23, 59, 59);
            latestAllowedDate.setUTCHours(23, 59, 58); // end of day
        } else {
            endOfSelectedDay.setHours(23, 59, 59);
            latestAllowedDate.setHours(23, 59, 58); // end of day
        }
        return endOfSelectedDay < latestAllowedDate;
    }
};
