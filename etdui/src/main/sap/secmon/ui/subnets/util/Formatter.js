/* globals oTextBundle */
jQuery.sap.declare("sap.secmon.ui.subnets.util.Formatter");

sap.secmon.ui.subnets.util.Formatter = {
    formatDiffVisible : function(vDiff) {
        return Array.isArray(vDiff) && vDiff.length > 0;
    },

    formatDiffInvisible : function(vDiff) {
        return !Array.isArray(vDiff) || vDiff.length === 0;
    },

    checkBoxEnabling : function(bDuplicate, aDiff) {
        return !!bDuplicate && sap.secmon.ui.subnets.util.Formatter.formatDiffVisible(aDiff);  
    },

    checkBoxTooltipFormatter : function(bDuplicate, aDiff) {
        if (!bDuplicate) {
            return oTextBundle.getText("Subnets_CannotOverwrite");
        }
        if (!sap.secmon.ui.subnets.util.Formatter.formatDiffVisible(aDiff)) {
            return oTextBundle.getText("Subnets_NoDiffs");
        }
        return oTextBundle.getText("Subnets_Overwrite");
    },

    formatLineErrors : function(aLines) {
        if (Array.isArray(aLines)) {
            // Normal errors, cannot be imported
            return aLines.join("\n");
        } else {
            // No error data
            return aLines;
        }
    }
};