jQuery.sap.declare("sap.secmon.ui.m.exemptions.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");

/**
 * Make some formatters globally available.
 */
sap.secmon.ui.m.exemptions.util.Formatter = {

    exemptionValidityFormatter : function(utc, validity, valid) {

        if (validity === "ACTIVE") {
            return sap.secmon.ui.commons.Formatter.i18nText(this.getModel("i18nCommon").getProperty("Exemption_Validity_Active"), sap.secmon.ui.commons.Formatter.dateFormatterEx(utc, valid));
        } else if (validity === "PLANNED") {
            return sap.secmon.ui.commons.Formatter.i18nText(this.getModel("i18nCommon").getProperty("Exemption_Validity_Planned"), sap.secmon.ui.commons.Formatter.dateFormatterEx(utc, valid));
        } else if (validity === "EXPIRED") {
            return sap.secmon.ui.commons.Formatter.i18nText(this.getModel("i18nCommon").getProperty("Exemption_Validity_Expired"), sap.secmon.ui.commons.Formatter.dateFormatterEx(utc, valid));
        }
    }

};
