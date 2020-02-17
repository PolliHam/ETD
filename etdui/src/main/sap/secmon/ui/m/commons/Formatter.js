jQuery.sap.declare("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.secmon.ui.m.commons.Formatter = {

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),

    /**
     * converts a base64 GUID into hex format
     */
    guidFormatter : function(base64Id) {
        return sap.secmon.ui.m.commons.Formatter.oCommons.base64ToHex(base64Id);
    },

    patternTypeYesNoFormatter : function(patternType, sYes, sNo) {
        if (patternType === "ANOMALY") {
            return sYes;
        } else {
            return sNo;
        }
    },

    /**
     * Show to user if a post-processing job is scheduled or not
     * 
     * @param {string}
     *            sProcessingStatus - Indicates if post-processing job is scheduled
     * @param {string}
     *            sYes - Display Yes to user
     * @param {string}
     *            sNo - Display No to user
     */
    patternProcessingYesNoFormatter : function(sProcessingStatus, sYes, sNo) {
        if (sProcessingStatus > 0) {
            return sYes;
        } else {
            return sNo;
        }
    },

    patternTypeFormatter : function(patternType, sAnomalyPattern) {
        if (patternType === "ANOMALY") {
            return sAnomalyPattern;
        } else {
            return "";
        }
    },

    countFormatter : function(text, count) {
        if (count !== null && count !== undefined) {
            return sap.secmon.ui.commons.Formatter.i18nText(text, count);
        } else {
            return sap.secmon.ui.commons.Formatter.i18nText(text, 0);
        }
    },

    countArrayFormatter : function(text, array) {
        if (array !== null && array !== undefined) {
            return sap.secmon.ui.commons.Formatter.i18nText(text, array.length);
        } else {
            return sap.secmon.ui.commons.Formatter.i18nText(text, 0);
        }
    },

    enumFormatter : function(oEnums, sKey) {
        if (oEnums && oEnums.keyValueMap && oEnums.keyValueMap[sKey] !== null && oEnums.keyValueMap[sKey] !== undefined) {
            return oEnums.keyValueMap[sKey];
        }
        return sKey;
    },

    /**
     * truncate a text up to length characters. The text will be appended with an ellipsis.
     */
    truncateText : function(sText, nlength) {
        var length = nlength || 30;
        if (sText && sText.length > length) {
            return sText.substr(0, length) + "...";
        }
        return sText;
    },

    textWithOptionalParam : function(sValue, sOptionalValue) {
        if (sValue === undefined || sValue === null) {
            return "null";
        }
        if (sOptionalValue && sValue.length > 0) {
            return sValue + " (" + sOptionalValue + ")";
        }
        return sValue;
    },

};
