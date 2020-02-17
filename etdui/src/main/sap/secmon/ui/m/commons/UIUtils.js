jQuery.sap.declare("sap.secmon.ui.m.commons.UIUtils");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");

jQuery.sap.require("sap.m.MessageBox");

sap.secmon.ui.m.commons.UIUtils = function() {

    this.showAlert = function(oParenView, sText) {
        var bCompact = !!oParenView.$().closest(".sapUiSizeCompact").length;
        sap.m.MessageBox.alert(sText, {
            styleClass : bCompact ? "sapUiSizeCompact" : "",
            title: sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
        });
    };
};
