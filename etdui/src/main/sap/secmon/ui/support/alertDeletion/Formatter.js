jQuery.sap.declare("sap.secmon.ui.support.alertDeletion.Formatter");

sap.secmon.ui.support.alertDeletion.Formatter = {

    dateLabelFormatter : function(utc) {
        if (utc === true || utc === 'true') {
            return this.getModel("i18n").getProperty("AlertDel_olderUTC_XLBL");
        } else {
            return this.getModel("i18n").getProperty("AlertDel_older_XLBL");
        }
    }
};
