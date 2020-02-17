jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.ODataErrorHandler");
sap.ui.controller("sap.secmon.ui.m.commons.dialogs.EditValueDialog", {

    oDialog : null,
    fnSuccessCallback : null,
    oParentView : null,

    onInit : function() {

    },

    openDialog : function(oParentView, oValueInfo, fnSuccessCallback) {
        this.oParentView = oParentView;
        this.fnSuccessCallback = fnSuccessCallback;

        this.oModel = new sap.ui.model.json.JSONModel(oValueInfo);
        if (!this.oDialog) {
            this.sDialogId = this.oParentView.createId("EditValueDialog");
            this.oDialog = sap.ui.xmlfragment(this.sDialogId, "sap.secmon.ui.m.commons.dialogs.EditValueDialog", this);
            oParentView.addDependent(this.oDialog);
            // set own i18n model
            var i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/ui/m/commons/dialogs/i18n/UIText.hdbtextbundle"
            });
            this.oDialog.setModel(i18nModel, "i18n");
        }
        this.oDialog.setModel(this.oModel);
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();
        var that = this;
        setTimeout(function() {
            that.byId("value").focus();
        }, 1000);
    },

    byId : function(sId) {
        return sap.ui.core.Fragment.byId(this.sDialogId, sId);
    },

    onDialogClose : function(oEvent) {
        this.oDialog.close();
    },

    onOk : function() {
        this.oDialog.close();
        var newValue = this.oModel.getData().Value;
        this.fnSuccessCallback(newValue);
    },

});
