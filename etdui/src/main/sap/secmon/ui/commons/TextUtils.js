jQuery.sap.declare("sap.secmon.ui.commons.TextUtils");
sap.secmon.ui.commons.TextUtils = {

    /*
     * Only call this function in exceptional cases where the i18n model is not available.
     */
    getText : function(sResourceBundleUrl, sTextKey) {
        var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
        var oTextBundle = jQuery.sap.resources({
            url : sResourceBundleUrl,
            locale : sLocale
        });
        return oTextBundle.getText(sTextKey);
    }

};
