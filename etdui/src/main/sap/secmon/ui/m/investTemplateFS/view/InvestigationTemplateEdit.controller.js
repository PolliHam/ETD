//jQuery.sap.declare("sap.secmon.ui.m.views.investigationTemplateFS.InvestigationTemplate");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.investTemplateFS.util.ODataErrorHandler");
jQuery.sap.require("sap.m.MessageBox");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.investTemplateFS.view.InvestigationTemplateEdit", {

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    oEditModel : null,

    onInit : function() {

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("edit").attachMatched(this.onRouteMatched, this);

        this.editModel = new sap.ui.model.json.JSONModel({
            PatternId : null,
            TemplateDescription : "",
            Description : "",
            Severity : null,
            Attack : null,
            ManagementVisibility : null,
            Comment : "",
            Id : null
        });
        this.getView().setModel(this.editModel, "editModel");

    },

    onRouteMatched : function(oEvent) {
        var controller = this;
        var oView = this.getView();
        var oArguments = oEvent.getParameter("arguments");
        var sPath = "/" + oArguments.id;
        var oModel = oView.getModel();
        oModel.createBindingContext(sPath, function(oContext) {
            oView.setBindingContext(oContext);
            var oObject = oContext.getObject();
            controller.editModel.setData(oObject);
            controller.editModel.refresh();
        }, true);

    },

    onSave : function(oEvent) {
        var controller = this;

        var input1 = this.getView().byId("templateName");
        var input2 = this.getView().byId("description");

        if (this.checkLength(input1) && this.checkLength(input2)) {
            saveTemplate();
        }

        function saveTemplate() {
            var data = controller.editModel.getData();
            // the user can select a pattern, and later remove the pattern. This results in a blank string
            if (!data.PatternId || data.PatternId.length === 0) {
                data.PatternId = null;
            }
            var hexId = controller.oCommons.base64ToHex(data.Id);
            var oModel = controller.getView().getModel();

            oModel.update("InvestigationTemplate(X'" + hexId + "')", data, {
                success : function(data) {
                    sap.m.MessageToast.show(controller.getText("Saved_MSG"));

                    sap.ui.core.UIComponent.getRouterFor(controller).navTo("display", {
                        id : "InvestigationTemplate(X'" + hexId + "')",
                    }, false);
                },
                error : function(oError) {
                    var oI18nModel = controller.getView().getModel("i18n");
                    var oI18nCommonModel = controller.getView().getModel("i18nCommon");
                    sap.secmon.ui.m.investTemplateFS.util.ODataErrorHandler.showAlert(oError, oI18nModel, oI18nCommonModel);
                }
            });
        }
    },

    onDisplay : function(oEvent) {
        var path = oEvent.getSource().getBindingContext().getPath();
        sap.ui.core.UIComponent.getRouterFor(this).navTo("display", {
            id : path.slice(1)
        }, false);
    },

    onCancel : function(oEvent) {
        var path = oEvent.getSource().getBindingContext().getPath();
        sap.ui.core.UIComponent.getRouterFor(this).navTo("display", {
            id : path.slice(1)
        }, true);
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onCheckLength : function(oEvent) {
        var input = oEvent.getSource();
        this.checkLength(input);
    },
    /**
     * workaround for standard input validation. The SAPUI5 validation seems to be broken
     * 
     * @param input
     *            a SAPUI5 control
     * @return true if input validation was successful (no restraints violated)
     */
    checkLength : function(oInput) {

        var value = oInput.getValue();
        if (!value || value.length === 0) {
            oInput.setValueState(sap.ui.core.ValueState.Error);
            oInput.setValueStateText(this.getText("NameMustNotBeEmpty_MSG"));
            return false;
        } else {
            oInput.setValueState(sap.ui.core.ValueState.None);
            oInput.setValueStateText("");
            return true;
        }
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/a36c4563b44448009e3545fe64130eca.html");
    },

});
