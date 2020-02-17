// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.changelog.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.changelog.Component", {

    metadata : {
        name : "Changelog",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.comp", "sap.ui.table" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.changelog.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/changelog/i18n/UIText.hdbtextbundle", "ChangelogTitle"),
            resourceBundle : "/sap/secmon/ui/m/changelog/i18n/UIText.hdbtextbundle",
            serviceConfig : {
                name : "Changelog",
                serviceUrl : "/sap/secmon/services/protocol/protocolService.xsodata"
            },
            backendConfig : {
                loadEnums : "sap.secmon.services.protocol",
            }
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.changelog.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "Changelog",
                targetControl : "idAppControl",
                clearTarget : true
            }, {
                pattern : "record/{id}",
                name : "record",
                viewPath : "sap.secmon.ui.m.changelog.view",
                view : "Record",
                targetControl : "idAppControl"
            } ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        this.setDefaultODataModel("serviceConfig");
        // increase the size of list items which can be displayed otherwise the
        // view-settings dialog can only
        // show 100 items at all
        this.getModel().setSizeLimit(5000);

        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());
    },

    destroy : function() {
        if (this.oRouteMatchedHandler) {
            this.oRouteMatchedHandler.destroy();
        }
        sap.secmon.ui.m.commons.EtdComponent.prototype.destroy.apply(this, arguments);
    },

    onComponentReady : function() {
        this.getRouter().initialize();
    }

});
