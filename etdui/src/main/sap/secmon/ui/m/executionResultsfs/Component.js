// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.executionResultsfs.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ViewSettingsStyle.css");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.executionResultsfs.Component", {

    metadata : {
        name : "ExecutionResults",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.executionResultsfs.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/executionResultsfs/i18n/UIText.hdbtextbundle", "ExecutionResultsTitle"),
            resourceBundle : "/sap/secmon/ui/m/executionResultsfs/i18n/UIText.hdbtextbundle",
            fullWidth : true,
            patternExecutionResultConfig : {
                serviceUrl : "/sap/secmon/services/patternExecutionResult.xsodata"
            },
            workspacePatternConfig : {
                name : "workspacePatterns",
                serviceUrl : "/sap/secmon/services/ui/m/patterns/WorkspacePatternDefinition.xsodata"
            },
            backendConfig : {
                loadEnums : "sap.secmon.services.ui.m",
                loadPatternDefinitions : true,
                loadKnowledgeBaseTexts : true,
                loadCSRFToken : true
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.executionResultsfs.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "ExecutionResults",
                viewLevel : 0,
                targetControl : "idAppControl",
            }, {
                pattern : "executionResult/{id}",
                name : "executionResult",
                viewPath : "sap.secmon.ui.m.views.executionResult",
                view : "ExecutionResult",
                viewLevel : 0,
                targetControl : "idAppControl",
            } ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        // Create and set domain model to the component
        this.setDefaultODataModel("patternExecutionResultConfig");
        this.setODataModel("workspacePatternConfig");
        // define a model which holds (nearly) all executed patterns

        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());
    },

    onComponentReady : function() {
        this.setupRouting();
        this.getRouter().initialize();
    },

    setupRouting : function() {
        var that = this;
        this.getRouter().attachRouteMatched(function(oEvent) {
            var oView = oEvent.mParameters.view;
            var oController = oView.getController();
            if (oEvent.getParameter("name") === "executionResult") {
                // Navigation to execution result view
                var sExecutionResultId = oEvent.getParameters().arguments.id;
                oController.bindExecutionResult(that.getModel(), sExecutionResultId, this.navigateToPatternExecutionResult);
            }
        }, this);
    },

    navigateToPatternExecutionResult : function(executionResultId) {
        this.getRouter().navTo("executionResult", {
            id : executionResultId,
        }, false);
    },

});
