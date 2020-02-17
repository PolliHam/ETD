// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.investfs.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.investfs.Component", {

    metadata : {
        name : "InvestigationsFS",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.table", "sap.ui.comp" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.investfs.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/UIText.hdbtextbundle", "MInvest_List_Title"),
            resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
            serviceConfig : {
                name : "investigationConfig",
                serviceUrl : "/sap/secmon/services/ui/m/invest/investigation.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadHanaUsers : true,
                loadEnums : "sap.secmon.services.ui.m"
            },
            fullWidth : true
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.investfs.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "Investigations",
                viewLevel : 0,
                targetControl : "idAppControl",
            }, ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        // Create and set domain model to the component
        this.setDefaultODataModel("serviceConfig");
    },

    onComponentReady : function() {
        this.getRouter().initialize();
    },

});