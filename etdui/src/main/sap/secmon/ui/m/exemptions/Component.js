// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.exemptions.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.exemptions.Component", {

    EXCEPTION_SERVICE : "/sap/secmon/services/ui/m/alertexceptions/AlertException.xsodata/",
    metadata : {
        name : "Exemptions",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.comp", "sap.ui.table"],
            components : []
        },
        rootView : "sap.secmon.ui.m.exemptions.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/exemptions/i18n/UIText.hdbtextbundle", "ExemptionsTitle"),
            resourceBundle : "/sap/secmon/ui/m/exemptions/i18n/UIText.hdbtextbundle",
            serviceConfig : {
                name : "Patterns",
                serviceUrl : "/sap/secmon/services/patterndefinitionToAlerts.xsodata"
            },
            exemptionDetailConfig : {
                name : "exemptionDetail",
                serviceUrl : "/sap/secmon/services/ui/m/alertexceptions/AlertException.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadEnums : "sap.secmon.services.ui.m,sap.secmon.ui.browse",
                loadKnowledgeBaseTexts : true,
                loadPatternDefinitions : true
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.exemptions.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "Exemptions",
                targetControl : "idAppControl",
                clearTarget : true
            }, {
                pattern : "exemption/{Id}",
                name : "exemption",
                view : "Exemption",
                targetControl : "idAppControl",
                clearTarget : true
            } ]

        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        this.oDataModel = new sap.ui.model.odata.ODataModel(this.EXCEPTION_SERVICE, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.setModel(this.oDataModel, "exemptions");

        this.setDefaultODataModel("serviceConfig");
        // increase the size of list items which can be displayed otherwise the
        // view-settings dialog can only
        // show 100 items at all
        this.getModel().setSizeLimit(5000);
        this.setODataModel("exemptionDetailConfig");

        var resourceModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/texts/KnowlegeBase.hdbtextbundle"
        });
        this.setModel(resourceModel, "i18nknowledge");
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
        var exemptionId = null;
        var componentData = this.getComponentData();

        if (componentData && componentData.startupParameters && componentData.startupParameters.Id) {
            exemptionId = componentData.startupParameters.Id[0];
        }
        if (exemptionId) {
            this.getRouter().navTo("exemption", {
                Id : exemptionId,
            }, true);
        }
    },

    setupRouting : function() {
        var that = this;
        this.getRouter().attachRouteMatched(function(oEvent) {
            var oView = oEvent.mParameters.view;
            var oController = oView.getController();
            if (oEvent.getParameter("name") === "exemption") {
                // Navigation to exemption view
                var sExemptionId = oEvent.getParameters().arguments.Id;
                oController.bindExemption(that.getModel("exemptionDetail"), sExemptionId);
            }
        }, this);
    },

});
