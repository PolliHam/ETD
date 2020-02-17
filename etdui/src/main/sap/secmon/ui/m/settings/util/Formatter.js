jQuery.sap.declare("sap.secmon.ui.m.settings.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");

sap.secmon.ui.m.settings.util.Formatter = {

    oEnumService : new sap.secmon.ui.commons.EnumService(),

    formatEventCount : function(count, unit) {
        var oTextModel = this.getModel("i18n");
        if (!oTextModel) {
            return count;
        }
        var sMessage;

        if (unit && unit.length > 0) {
            // {0}{1} Events selected for deletion
            sMessage = oTextModel.getProperty("MngEv_total_units_XLBL");
            return sap.secmon.ui.commons.Formatter.i18nText(sMessage, count, unit);
        } else {
            // {0} Events selected for deletion
            sMessage = oTextModel.getProperty("MngEv_total_XLBL");
            return sap.secmon.ui.commons.Formatter.i18nText(sMessage, count);
        }
    },

    formatOriginalEventCount : function(count, unit) {
        var oTextModel = this.getModel("i18n");
        if (!oTextModel) {
            return count;
        }
        var sMessage;

        if (unit && unit.length > 0) {
            // {0}{1} Events selected for deletion
            sMessage = oTextModel.getProperty("MngOREv_total_units_XLBL");
            return sap.secmon.ui.commons.Formatter.i18nText(sMessage, count, unit);
        } else {
            // {0} Events selected for deletion
            sMessage = oTextModel.getProperty("MngOREv_total_XLBL");
            return sap.secmon.ui.commons.Formatter.i18nText(sMessage, count);
        }
    },

    formatUnrecognizedEventCount : function(count, unit) {
        var oTextModel = this.getModel("i18n");
        if (!oTextModel) {
            return count;
        }
        var sMessage;

        if (unit && unit.length > 0) {
            // {0}{1} Events selected for deletion
            sMessage = oTextModel.getProperty("MngULEv_total_units_XLBL");
            return sap.secmon.ui.commons.Formatter.i18nText(sMessage, count, unit);
        } else {
            // {0} Events selected for deletion
            sMessage = oTextModel.getProperty("MngULEv_total_XLBL");
            return sap.secmon.ui.commons.Formatter.i18nText(sMessage, count);
        }
    },

    /**
     * Format an input field to look like a label: Add a colon
     */
    formatLabel : function(text) {
        if (text === undefined || text === null) {
            return "";
        }
        return text + ":";
    },

    /**
     * Format an input field to look like a label: Add a colon Addiionally, add an asterisk if not explicitly disabled.
     * 
     * @param text
     *            teyt to be appended with colon
     * @param bIsMandatory
     *            optional if set to false the asterisl is not prepended
     */
    formatMandatoryLabel : function(text, bIsMandatory) {
        if (text === undefined || text === null) {
            return "";
        }
        if (bIsMandatory === false) {
            return text + ":";
        }
        return '*' + text + ":";
    },

    formatBooleanToString : function(bBoolean) {
        if (bBoolean === true) {
            return "True";
        }
        return "False";
    },
    timeformatter : function(textDay, textHourMinutes, time) {
        var hours, minutes;
        if (time >= 1440) {
            return sap.secmon.ui.commons.Formatter.i18nText(textDay, Math.floor(time / 1440));
        } else {
            hours = Math.floor(time / 60);
            minutes = time % 60;
            return sap.secmon.ui.commons.Formatter.i18nText(textHourMinutes, hours, minutes);
        }
    },
    formatBooleanString : function(sBoolean) {
        if (!sBoolean || sBoolean.length === 0) {
            return false;
        }

        return sBoolean.toLowerCase() === 'true';
    },

    /**
     * extract server from Url: remove leading protocol and trailing port number
     */
    getHostFromUrl : function(sUrl) {
        var host = sUrl;

        var startPos = host.indexOf("://");
        if (startPos > 0) {
            host = host.substring(startPos + 3);
        }
        var endPos = host.lastIndexOf(":");
        if (endPos > 0) {
            host = host.substring(0, endPos);
        }
        return host;
    },

    formatPatternFilter : function(sNoFilter, sFilterName) {
        if (sFilterName === undefined || sFilterName === null) {
            return "";
        }
        if (sFilterName === "") {
            return sNoFilter;
        }
        return sFilterName;
    },

    /**
     * Determines if an input field ion the "Process Fields" tab (with enum values) may be set to editable: A new entry may be added. An existing entry may be edited or deleted if the value is flagged
     * as editable.
     * 
     * @param bEditable
     *            boolean. indicates whether the value is editable (info from backend).
     * @param bIsNew
     *            boolean. Indicates whether the value has not been persisted yet.
     */
    isEnumEntryEditable : function(bEditable, bIsNew) {
        var editable = bEditable === "true" || bEditable === true;
        var isNew = bIsNew === "true" || bIsNew === true;
        return (editable || isNew);
    },

    isMove : function(confParameter) {
        return !sap.secmon.ui.m.settings.util.Formatter.isNoMove(confParameter);
    },
    isNoMove : function(confParameter) {
        return confParameter === "DoNotMove";
    },

    retentionDate : function(utc, retentionPeriodInDays) {
        var now = new Date();
        var nowMS = now.getTime();
        var retentionDateMS = nowMS - (retentionPeriodInDays * 24 * 60 * 60 * 1000);
        var retentionDate = new Date(retentionDateMS);
        var returnValue = sap.secmon.ui.commons.Formatter.dateOnlyFormatter(utc, retentionDate, "medium") + " - " + sap.secmon.ui.commons.Formatter.dateOnlyFormatter(utc, now, "medium");
        if (utc) {
            returnValue += ' (UTC)';
        }
        return returnValue;
    },

    retentionPeriod : function(retentionDate, sFormat) {
        if (!retentionDate) {
            return '';
        }
        var now = new Date();
        var nowMS = now.getTime();
        var retentionDateMS = retentionDate.getTime();
        var timerangeMS = nowMS - retentionDateMS;
        var timerangeDays = Math.round(timerangeMS / (24 * 60 * 60 * 1000));
        return sap.secmon.ui.commons.Formatter.i18nText(sFormat, timerangeDays);
    }

};
