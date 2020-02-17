jQuery.sap.declare("sap.secmon.ui.m.alertsfs.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.AlertTriggerFormatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");

sap.secmon.ui.m.alertsfs.util.Formatter = {

    statusDropdownEnablementFormatter : function(key) {
        if (key !== "INVESTIG_TRIGGERED" && key !== "EXCLUDED_EXCEPTION") {
            // disabled all status <> INVESTIG_TRIGGERED / EXCLUDED_EXCEPTION
            return true;
        }
        return false;
    },

    InvestigationCountFormatter : function(iCount) {
        return iCount > 0;
    },

    /*-
     * Formatter for creating the alert message
     * Text field is bound against relation Details
     * @param aDetailPaths: array containing paths of Alert details.
     * Example: ["Details(DetailId=X'E71D8BC43F0D5A4E99A96693AEF5CD46',AlertId.AlertId=X'49D1E9928831774CB6E4CCD919031916')"]
     * @param patternType: patternType
     * @param alertMeasureContext
     * @param triggeringEventCount
     * @param alertId
     */

    triggeringTextWithLinksFormatter : function(aDetailPaths, patternType, alertMeasureContext, count, threshold, textInput) {
        var text = sap.secmon.ui.commons.AlertTriggerFormatter.alertTriggerFormatter.call(this, aDetailPaths, patternType, count, threshold, textInput);
        // link enabled: triggering or related events enabled
        var linkEnabled = sap.secmon.ui.m.alerts.util.Formatter.eventAsLinkFormatter.call(this, alertMeasureContext, patternType);
        // only show if triggering events are enabled
        if (linkEnabled === true && patternType !== 'ANOMALY') {
            // append a place holder which will be replaced with URL text
            text += " ({0})";
        }
        return text;
    },

    triggeringEventLinksFormatter : function(patternType, alertMeasureContext, alertId, linkText) {
        var linkEnabled = sap.secmon.ui.m.alerts.util.Formatter.eventAsLinkFormatter.call(this, alertMeasureContext, patternType);

        if (linkEnabled === false) {
            return [];
        } else {
            return [ {
                Text : linkText,
                Url : sap.secmon.ui.m.commons.NavigationService.triggeringEventURLForDisplayForm.call(this, alertId, 0)
            } ];
        }
    }

};
