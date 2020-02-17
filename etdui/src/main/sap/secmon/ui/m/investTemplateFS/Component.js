// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.investTemplateFS.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.investTemplateFS.Component", {

    metadata : {
        name : "InvestigationsTemplateFS",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.comp", "sap.ui.table", "sap.ui.commons" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.investTemplateFS.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/investTemplateFS/i18n/UIText.hdbtextbundle", "TemplateList_Title_LBL"),
            resourceBundle : "/sap/secmon/ui/m/investTemplateFS/i18n/UIText.hdbtextbundle",
            serviceConfig : {
                name : "investigationConfig",
                serviceUrl : "/sap/secmon/services/ui/m/invest/investigation.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadEnums : "sap.secmon.services.ui.m",
                loadPatternDefinitions : true,
                loadHanaUsers : true
            }
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.investTemplateFS.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "InvestigationTemplateTable",
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.investTemplateFS.view",
                viewLevel : 0,
                targetControl : "idAppControl",
            }, {
                pattern : "create/:?query:",
                name : "create",
                view : "InvestigationTemplateCreate",
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.investTemplateFS.view",
                viewLevel : 0,
                targetControl : "idAppControl",
            }, {
                pattern : "display/{id}:?query:",
                name : "display",
                view : "InvestigationTemplateDisplay",
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.investTemplateFS.view",
                viewLevel : 0,
                targetControl : "idAppControl",
            }, {
                pattern : "edit/{id}:?query:",
                name : "edit",
                view : "InvestigationTemplateEdit",
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.investTemplateFS.view",
                viewLevel : 0,
                targetControl : "idAppControl",
            } ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        // Create and set domain model to the component
        this.setDefaultODataModel("serviceConfig");

        // re-use texts of investigation
        var i18nInvestigationModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/UIText.hdbtextbundle"
        });
        this.setModel(i18nInvestigationModel, "i18nInvestigation");
        var router = this.getRouter();
        this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);
    },

    destroy : function() {
        if (this.routeHandler) {
            this.routeHandler.destroy();
        }

        sap.secmon.ui.m.commons.EtdComponent.prototype.destroy.apply(this, arguments);
    },

    onComponentReady : function() {
        this.getRouter().initialize();
    },

});