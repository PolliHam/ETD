jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.namespace.util.ODataErrorHandler");

sap.ui.core.mvc.Controller.extend("sap.secmon.ui.m.namespace.view.Namespaces", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.m.namespace.view.Master
     */
    onInit : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        // apply compact mode if touch is not supported
        if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
            this.getView().addStyleClass("sapUiSizeCompact");
        }

    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    /**
     * Eventhandler: Deletes Namespace
     */
    onDeleteNamespace : function(oEvent) {
        var controller = this;
        var selectedObject = oEvent.getSource().getBindingContext().getObject();

        var oI18nModel = controller.getView().getModel("i18n");

        var confirmationText = oI18nModel.getProperty("Conf_Delete_NS");
        var sNamespaceForDeletion = selectedObject.NameSpace;

        confirmationText = sap.secmon.ui.commons.Formatter.i18nText(confirmationText, sNamespaceForDeletion);

        sap.m.MessageBox.show(confirmationText, {
            title : controller.getView().getModel("i18nCommon").getProperty("Delete_TIT"),
            icon : sap.m.MessageBox.Icon.WARNING,
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.DELETE) {

                    var idNamespace = controller.oCommons.base64ToHex(selectedObject.Id);
                    var valuePath = "/SystemNamespace(X'" + idNamespace + "')";

                    var oNamespaceModel = controller.getView().getModel();
                    oNamespaceModel.remove(valuePath, null, function() {
                        sap.m.MessageToast.show(oI18nModel.getProperty("NS_Del_Success"));
                    }, function(e) {
                        sap.secmon.ui.m.namespace.util.ODataErrorHandler.showAlert(e.response, oI18nModel);
                    });
                }
            }
        });

    },

    /**
     * Eventhandler: Shows dialog for adding namespaces
     */
    onAddNamespace : function(oEvent) {
        var controller = this;

        // call dialog
        if (!this.oCreateNamespaceController) {
            this.oCreateNamespaceController = sap.ui.controller("sap.secmon.ui.m.namespace.view.CreateNamespaceDialog");
        }
        this.oCreateNamespaceController.openDialog(controller.getView());

        var namespaceInput = this.getView().byId("NamespaceInput");
        namespaceInput.focus();

    },

    onNavBack : function() {
        window.history.go(-1);
    }

});
