jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.namespace.util.ODataErrorHandler");

sap.ui.controller("sap.secmon.ui.m.namespace.view.CreateNamespaceDialog", {

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    oDialog : null,
    fnSuccessCallback : null,
    NAMESPACE_MODEL: "nameSpaceModel",

    onInit : function() {

    },

    /**
     * Opens pop up for creating a new namespace
     * 
     */
    openDialog : function(oParentView, fnSuccessCallback) {
        this.oParentView = oParentView;
        this.fnSuccessCallback = fnSuccessCallback;

        if (!this.oDialog) {
            var sPrefix = this.oParentView.getId();
            this.oDialog = sap.ui.xmlfragment(sPrefix, "sap.secmon.ui.m.namespace.view.CreateNamespaceDialog", this);
            oParentView.addDependent(this.oDialog);
        }

        var oModel;
        oModel = new sap.ui.model.json.JSONModel({
            nameSpaceIsValid : true
        });
        this.oDialog.setModel(oModel, this.NAMESPACE_MODEL);

        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();

    },

    /**
     * Eventhandler: creates new namespace.
     */
    onCreate : function(oEvent) {

        var controller = this;

        // set focus on Button is needed it ensure that on mobile device the
        // value of the inputField is used
        this.oDialog.focus("Add_But");

        var oI18nModel = this.oParentView.getModel("i18n");
        var oNewNameSpaceModel = this.oDialog.getModel(this.NAMESPACE_MODEL);
        var sNameSpace = oNewNameSpaceModel.getData().NameSpace;
        if (!this.checkNameSpace(sNameSpace)) {
            return;
        }

        // Dummy GUID. OData expects an entry for every field and validates the format. Will be replaced on server with unique one.
        var oNewNameSpace = {
            Id : "0000000000000000",
            NameSpace : sNameSpace.trim()
        };
        var oNamespaceModel = this.oParentView.getModel();
        oNamespaceModel.setHeaders({
            "content-type" : "application/json;charset=utf-8"
        });
        oNamespaceModel.create('/SystemNamespace', oNewNameSpace, {
            success : function() {
                sap.m.MessageToast.show(oI18nModel.getProperty("NS_Create_Success"));
                controller.oDialog.close();
            },
            error : function(e) {
                var elementFocus = controller.oDialog.getParent().byId("NamespaceInput");
                sap.secmon.ui.m.namespace.util.ODataErrorHandler.showAlert(e.response, oI18nModel, elementFocus);
            }
        });
        if (controller.fnSuccessCallback) {
            controller.fnSuccessCallback();
        }
    },

    checkNameSpace : function(sNameSpace) {
        var sNameSpaceIsValid = sNameSpace && sNameSpace.indexOf("http://") === 0 &&
            !sNameSpace.includes(" ");
        this.oDialog.getModel(this.NAMESPACE_MODEL).setProperty("/nameSpaceIsValid", sNameSpaceIsValid);
        return sNameSpaceIsValid;
    },

    /**
     * Eventhandler: Closes dialog.
     */
    onCancel : function(oEvent) {
        this.oDialog.close();
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.oParentView));
    },

});
