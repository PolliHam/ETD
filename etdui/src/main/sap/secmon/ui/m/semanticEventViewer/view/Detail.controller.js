jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationUtils");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.semanticEventViewer.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.InvestigationAddendum");
jQuery.sap.require("sap.secmon.ui.m.commons.semanticEvents.LogDetailHelper");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.semanticEventViewer.view.Detail", {

    entityName : "SemanticEventViewer",
    constructor : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        sap.ui.core.mvc.Controller.apply(this, arguments);
    },
    onInit : function() {
        var langModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/commons/semanticEvents/i18n/UIText.hdbtextbundle"
        });
        this.model = this.getComponent().getModel();
        this.oInvestigationAddendum = new sap.secmon.ui.m.commons.InvestigationAddendum();
        this.getView().setModel(langModel, "lang");
        this.getComponent().getNavigationVetoCollector().register(function() {
            return true;
        }, this);
        this.getRouter().attachRouteMatched(function(oEvent) {
            // when detail navigation occurs, update the binding context
            if (oEvent.getParameter("name") === this.entityName) {
                var oArguments = oEvent.getParameter("arguments");
                var entityName = oArguments[this.entityName];
                var entityPath = "/" + entityName;
                var params = oArguments["?query"] || {};
                if (params.hasOwnProperty("fullscreen") && params.fullscreen === "true") {
                    this.adaptBackButtonToFullscreenMode();
                }

                this.getView().bindElement(entityPath, {
                    expand : "UserPseudonyms,UserPseudonyms/Sentences"
                // expand : "EventDescription"
                });

                var page = this.getView().byId("LogsShowDetail");
                var logDetailHelper = new sap.secmon.ui.m.commons.semanticEvents.LogDetailHelper();

                logDetailHelper.rebindData(page.getContent()[0], {
                    "Id" : entityPath.substr(entityPath.indexOf("Id=X'") + 5, 32),
                    "Timestamp" : entityPath.substr(entityPath.indexOf("datetime'") + 9, 28)
                });
                if (!this.getView().getBindingContext()) {
                    page.setBusy(true);
                    this.getComponent().getModel().attachRequestCompleted(unsetBinding, this);

                } else {
                    page.setBusy(false);
                }

            }
            function unsetBinding() {
                page.setBusy(false);
                this.getComponent().getModel().detachRequestCompleted(unsetBinding, this);
            }
        }, this);
    },
    onAnomalyClicked : function(oEvent) {
        var context = oEvent.oSource.getBindingContext();
        var id = null;
        if (context) {
            id = context.getModel().getProperty(context.getPath() + "/CorrelationId");
            if (id) {
                sap.secmon.ui.m.commons.NavigationService.openAnomalyDetail(id);
            }
        }
    },
    handleAddToInvestigationPressed : function(oEvent) {
        var bindingContext = this.getView().getBindingContext();
        var semanticEventId = null;
        if (!bindingContext) {
            return;
        }
        semanticEventId = bindingContext.getObject().Id;
        var that = this;
        this.oInvestigationAddendum.showGeneralInvestigationAddendumDialog([ {
            ObjectType : 'EVENT',
            ObjectId : semanticEventId
        } ], this.getView(), function() {
        }, that.oCommons.getXCSRFToken);
    },

    getContentContainer : function() {
        return this.getView().byId("LogsShowDetail");
    },

    adaptBackButtonToFullscreenMode : function() {
        // full screen mode: back button is always shown and back performs a
        // browser back
        var controller = this;
        var oPage = this.getView().byId("LogsShowDetail");
        oPage.setShowNavButton(true);
        oPage.detachNavButtonPress(this.onNavBack, this);
        oPage.attachNavButtonPress(function() {
            controller.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
                window.history.go(-1);
            });
        });
    },

    /**
     * Back navigation when running on phone devices.
     */
    onNavBack : function() {
        var oRouter = this.getRouter();
        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            sap.secmon.ui.m.commons.NavigationUtils.myNavBack(oRouter, "main");
        });
    },

    onBackButtonPressed : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    }

});
