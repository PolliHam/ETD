//jQuery.sap.declare("sap.secmon.ui.m.views.investigationTemplateFS.InvestigationTemplate");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.investTemplateFS.view.InvestigationTemplateDisplay", {

    EXPORT_SERVICE : "/sap/secmon/services/replication/export.xsjs",
    NAMESPACE : "http://sap.com/secmon",

    EXPORT_UPSERT : "Upsert",
    EXPORT_DELETE : "Delete",

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    oEditModel : null,
    ajaxUtil : null,

    onInit : function(oEvent) {

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("display").attachMatched(this.onRouteMatched, this);
        this.ajaxUtil = new sap.secmon.ui.commons.AjaxUtil();

    },

    onRouteMatched : function(oEvent) {
        var oView = this.getView();
        var oArguments = oEvent.getParameter("arguments");
        var sPath = "/" + oArguments.id;
        var oModel = oView.getModel();
        oModel.createBindingContext(sPath, function(oContext) {
            oView.setBindingContext(oContext);
        }, true);

    },

    onSelect : function(oEvent) {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("display", {
            id : oEvent.getSource().getBindingContext().getPath().slice(1)
        }, false);
    },

    onEdit : function(oEvent) {
        var path = oEvent.getSource().getBindingContext().getPath();
        sap.ui.core.UIComponent.getRouterFor(this).navTo("edit", {
            id : path.slice(1)
        }, true);
    },

    onDelete : function(oEvent) {
        var path = oEvent.getSource().getBindingContext().getPath().slice(1);
        var controller = this;
        var confirmationText = this.getText("ConfDelete_MSG");
        sap.m.MessageBox.confirm(confirmationText, function(oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                deleteTemplate.call(controller, path);
            }
        });

        function deleteTemplate(path) {
            var controller = this;
            var oModel = controller.getView().getModel();
            var selectedTemplate = controller.getView().getBindingContext().getObject();
            var hexId = controller.oCommons.base64ToHex(selectedTemplate.Id);                    
            oModel.remove(path, {
                success : function(data) {
                    sap.m.MessageToast.show(controller.getText("Deleted_MSG"));
                    window.history.go(-1);
                    controller.doExport(hexId, selectedTemplate.TemplateDescription, controller.EXPORT_DELETE);
                },
                error : function(oError) {
                    var oI18nModel = controller.getView().getModel("i18n");
                    var oI18nCommonModel = controller.getView().getModel("i18nCommon");
                    sap.secmon.ui.m.investTemplateFS.util.ODataErrorHandler.showAlert(oError, oI18nModel, oI18nCommonModel);
                }
            });
        }
    },

    onExportPressed : function(oEvent) {
        var selectedTemplate = this.getView().getBindingContext().getObject();
        var hexId = this.oCommons.base64ToHex(selectedTemplate.Id);
        if (selectedTemplate) {
            this.doExport(hexId, selectedTemplate.TemplateDescription);
        }
    },

    /**
     * send an OData request to service export.xsjs.
     * 
     * @param hexId
     *            ID of investigation template in HEX format
     * @param templateDescription
     *            description of template
     * @param operation
     *            optional "upsert" or "delete". Defaults to "Upsert"
     */
    doExport : function(hexId, templateDescription, operation) {
        var that = this;
        var op = operation || this.EXPORT_UPSERT;
        var json = JSON.stringify({
            Id : hexId,
            ObjectType : "InvestigationTemplate",
            ObjectName : templateDescription,
            ObjectNamespace : this.NAMESPACE,
            Operation : op
        });
        this.ajaxUtil.postJson(this.EXPORT_SERVICE, json, {
            success : function() {
                sap.m.MessageToast.show(that.getText("Exported_MSG"));
            },
            fail : function(status, errorText) {
                if (operation !== that.EXPORT_DELETE || status === 400) {
                    sap.m.MessageBox.alert(errorText);
                }
            }
        });
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/a36c4563b44448009e3545fe64130eca.html");
    }

});
