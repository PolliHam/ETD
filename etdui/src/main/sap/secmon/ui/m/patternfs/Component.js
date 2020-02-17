// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.patternfs.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/views/pattern//css/patterns.css");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.patternfs.Component", {

    metadata : {
        name : "Patterns",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.table", "sap.ui.comp" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.patternfs.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/patternfs/i18n/UIText.hdbtextbundle", "PatternsTitle"),
            resourceBundle : "/sap/secmon/ui/m/patternfs/i18n/UIText.hdbtextbundle",
            fullWidth : true,
            serviceConfig : {
                name : "Patterns",
                serviceUrl : "/sap/secmon/services/patterndefinitionToAlerts.xsodata"
            },
            patternExecutionResultConfig : {
                name : "patternExecutionResult",
                serviceUrl : "/sap/secmon/services/patternExecutionResult.xsodata"
            },
            patternNameSpace : {
                name : "patternNameSpace",
                serviceUrl : "/sap/secmon/services/ui/m/patterns/WorkspacePatternDefinition.xsodata"
            },
            originalNamespace : {
                name : "originalNamespace",
                serviceUrl : "/sap/secmon/services/NameSpacesOriginalInSystem.xsodata"
            },

            ConfigurationParameters : {
                name : "ConfigurationParameters",
                serviceUrl : "/sap/secmon/services/ConfigurationParameters.xsodata"
            },

            backendConfig : {
                loadCSRFToken : true,
                loadEnums : "sap.secmon.services.ui.m,sap.secmon.ui.browse",
                loadPatternDefinitions : true,
                loadKnowledgeBaseTexts : true
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.patternfs.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : "executionResult/{id}",
                name : "executionResult",
                viewPath : "sap.secmon.ui.m.views.executionResult",
                view : "ExecutionResult",
                viewLevel : 0,
                targetControl : "idAppControl",
            }, {
                pattern : "pattern/{id}/:tab:",
                name : "pattern",
                viewPath : "sap.secmon.ui.m.views.pattern",
                view : "Pattern",
                targetControl : "idAppControl",
            }, {
                pattern : ":?query:",
                name : "main",
                view : "Patterns",
                targetControl : "idAppControl",
                clearTarget : true
            }, ]

        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        this.setDefaultODataModel("serviceConfig");
        // increase the size of list items which can be displayed otherwise the
        // view-settings dialog can only
        // show 100 items at all
        this.getModel().setSizeLimit(5000);
        var i18n = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/patternfs/i18n/UIText.hdbtextbundle"
        });
        this.setModel(i18n, "i18n");
        this.setODataModel("patternExecutionResultConfig");
        this.setODataModel("ConfigurationParameters");
        this.setODataModel("patternNameSpace");
        this.setODataModel("originalNamespace");

        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());
    },

    destroy : function() {
        if (this.oRouteMatchedHandler) {
            this.oRouteMatchedHandler.destroy();
        }
        sap.secmon.ui.m.commons.EtdComponent.prototype.destroy.apply(this, arguments);
    },

    onComponentReady : function() {
        this.setupRouting();

        this.getRouter().initialize();

        // Navigate to Pattern view if pattern is provided in startup parameters
        var sPatternId = null, sTab = null;
        var componentData = this.getComponentData();
        if (componentData && componentData.startupParameters && componentData.startupParameters.patternId) {
            sPatternId = componentData.startupParameters.patternId[0];
        }
        if (componentData && componentData.startupParameters && componentData.startupParameters.tab) {
            sTab = componentData.startupParameters.tab;
        }
        if (sPatternId) {
            this.getRouter().navTo("pattern", {
                id : sPatternId,
                tab : sTab
            }, true);
        }

    },

    setupRouting : function() {
        var that = this;
        this.getRouter().attachRouteMatched(function(oEvent) {
            var oView = oEvent.getParameter("view");
            var oController = oView.getController();
            var oArguments = oEvent.getParameter("arguments");
            // set tab if provided in url
            if (oArguments.tab && this.getComponentData() && this.getComponentData().startupParameters) {
                this.getComponentData().startupParameters.tab = oArguments.tab;
            }
            if (oEvent.getParameter("name") === "executionResult") {
                // Navigation to execution result view
                var sExecutionResultId = oArguments.id;
                oController.bindExecutionResult(that.getModel("patternExecutionResult"), sExecutionResultId);
            } else if (oEvent.getParameter("name") === "pattern") {
                // Navigation to execution pattern view
                var sPatternId = oArguments.id;
                oController.bindPattern(that.getModel(), sPatternId, that.navigateToPatternExecutionResult, that.handleNavBackFromPatternView, that);
            }
        }, this);
    },

    /**
     * Callback function for reusable Pattern view. Will be called when pattern was executed. Navigates to ExecutionResultView.
     */
    navigateToPatternExecutionResult : function(executionResultId) {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("executionResult", {
            id : executionResultId,
        }, false);
    },

    handleNavBackFromPatternView : function() {
        this.getModel().refresh();
    }

});
