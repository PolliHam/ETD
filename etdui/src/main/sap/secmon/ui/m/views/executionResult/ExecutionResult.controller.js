jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.views.executionResult.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.InvestigationCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.alerts.AlertsBaseController");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.alertsfs.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.AlertTriggerFormatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");

/*-
 *  Reusable view for displaying an execution result. Create the view and 
 *  call bindExecutionResult on this controller.
 */
sap.secmon.ui.m.commons.alerts.AlertsBaseController.extend("sap.secmon.ui.m.views.executionResult.ExecutionResult", {

    MARK_AS_TEST_RESULT_SERVICE : "/sap/secmon/services/ui/m/patternExecution/markAsTestResult.xsjs",

    /**
     * @memberOf sap.secmon.ui.m.patternfs.view.ExecutionResult
     */
    constructor : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.executionResultId = null;
        this.oInvestigationCreator = new sap.secmon.ui.m.commons.InvestigationCreator();
        this.oModel = null;
    },

    onInit : function() {
        sap.secmon.ui.m.commons.alerts.AlertsBaseController.prototype.onInit.call(this);

        // set i18n model of execution result.
        var i18nModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/views/executionResult/i18n/UIText.hdbtextbundle"
        });
        this.getView().setModel(i18nModel, "i18n");

        // set i18nAlert model
        this.i18nAlertModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle"
        });
        this.getView().setModel(this.i18nAlertModel, "i18nAlert");

        this.enableButtonsIfExactlyOneRowIsSelected(this.getAlertsTable(), [ "analyzeButton" ]);
        this.enableButtonsIfAtLeastOneRowIsSelected(this.getAlertsTable(), [ "updateAlertsBtn", "startInvestBtn", "addToInvestBtn", "markAsTestResultButton" ]);

        var fnNavigation = function() {
            // do nothing
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "alertsTable", sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTALERTS_SERVICE, fnNavigation, [], [ this
                .getComponent().getModel() ]);
    },

    /*-
     *  Binds an execution result to the view
     *  The following modes are expected to exist on the parent of this view:
     *  
     *  'enums'      : containing the required enums. Must contain the enums of object
     *                  sap.secmon.services.ui.m.invest/Investigation
     */
    bindExecutionResult : function(oModel, sExecutionResultId, fnNavigateToPatternExecutionResult) {
        this.fnNavigateToPatternExecutionResult = fnNavigateToPatternExecutionResult;
        this.clearTableSelectionAndDisableButtons(this.getAlertsTable(), [ "analyzeButton", "updateAlertsBtn", "startInvestBtn", "addToInvestBtn" ]);
        this.oModel = oModel;
        this.getView().setModel(oModel);
        // reset previous binding context
        this.getView().unbindElement();
        // update binding context
        this.executionResultId = sExecutionResultId;
        var sPath = "/PatternExecutionResult(X'" + this.executionResultId + "')";
        this.getView().bindElement(sPath);
        var that = this;

        var fnShowTriggerFields = function() {
            var bHasTrigger = that.getView().getBindingContext().getProperty("TriggeringExecutionId") !== null;
            that.getView().byId("TriggerLabel").setVisible(bHasTrigger);
            that.getView().byId("TriggerLink").setVisible(bHasTrigger);
        };

        if (this.getView().getBindingContext()) {
            // data already available
            fnShowTriggerFields();
        } else {
            this.getView().getElementBinding().attachChange(function() {
                fnShowTriggerFields();
            }, this);
        }
    },

    getAlertsTable : function() {
        return this.getView().byId("alertsTable");
    },

    updateOfAlertsFinished : function() {
        this.oModel.refresh();
    },

    addToInvestigationFinished : function() {
        this.oModel.refresh();
    },

    startInvestigationFinished : function() {
        this.oModel.refresh();
    },

    /**
     * Eventhandler: Opens investigation UI
     */
    onInvestigationClicked : function(oEvent) {
        var alertIdBase64 = oEvent.getSource().getBindingContext().getProperty("AlertId");
        var alertId = this.oCommons.base64ToHex(alertIdBase64);
        sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
            target : {
                semanticObject : "AlertDetails",
                action : "show"
            },
            params : {
                alert : alertId,
                tab : "Investigations"
            }
        });
    },

    onTriggerClicked : function(oEvent) {
        var sExecutionIdBase64 = oEvent.getSource().getBindingContext().getProperty("TriggeringExecutionId");
        var sExecutionId = this.oCommons.base64ToHex(sExecutionIdBase64);
        if (this.fnNavigateToPatternExecutionResult) {
            this.fnNavigateToPatternExecutionResult.call(this.getComponent(), sExecutionId);
        }
    },

    onNavBack : function() {
        window.history.go(-1);
    },

    onMarkAsTestResult : function() {
        var sText = this.getView().getModel("i18n").getProperty("ConfirmDelete");
        var that = this;
        sap.m.MessageBox.confirm(sText, {
            onClose : function(sAction) {
                if (sAction === sap.m.MessageBox.Action.OK) {
                    that.markAsTestResult();
                }
            }
        });
    },

    markAsTestResult : function() {
        var sRequestUrl = this.MARK_AS_TEST_RESULT_SERVICE + "?id=" + this.executionResultId;
        var that = this;
        this.oRequestUtils.postRequest(sRequestUrl, null, this.getComponent().getCsrfToken(), function() {
            that.oModel.refresh();
        });
    },

    onPressHelp : function() {
        window.open("/sap/secmon/help/0d6a17a3d4d046d4b1c97c3cc88facfa.html");
    }

});
