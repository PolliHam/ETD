jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.namespace.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.namespace.Component", {

    metadata : {
        name : "Namespaces",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.namespace.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/namespace/i18n/UIText.hdbtextbundle", "NamespaceTitle"),
            resourceBundle : "/sap/secmon/ui/m/namespace/i18n/UIText.hdbtextbundle",
            namespaceConfig : {
                name : "Namespaces",
                serviceUrl : "/sap/secmon/services/ui/m/namespace/system_namespace.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadHanaUsers : false,
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.namespace.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "Namespaces",
                viewLevel : 0,
                targetControl : "idAppControl",
            }, ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        // Create and set domain model to the component
        this.setDefaultODataModel("namespaceConfig");
        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());

    },

    onComponentReady : function() {
        this.getRouter().initialize();
    },

    destroy : function() {
        if (this.oRouteMatchedHandler) {
            this.oRouteMatchedHandler.destroy();
        }
        sap.secmon.ui.m.commons.EtdComponent.prototype.destroy.apply(this, arguments);
    },

});