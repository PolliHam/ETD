jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.systems.Component");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/systems/css/eventtrendanalysis.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/systems/css/systems.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.systems.Component", {

    metadata : {
        name : "Systems",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.viz", "sap.ui.commons" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.systems.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/systems/i18n/UIText.hdbtextbundle", "MSystems_App_Title"),
            resourceBundle : "/sap/secmon/ui/m/systems/i18n/UIText.hdbtextbundle",
            serviceConfig : {
                name : "SystemData",
                serviceUrl : "/sap/secmon/services/ui/systemcontext/SystemData.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadEnums : "sap.secmon.services.ui.systemcontext"
            }
        },
        routing : {
            config : {
                // injects component data into route parameters
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.systems.view",
                targetAggregation : "detailPages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "Master",
                viewLevel : 0,
                targetAggregation : "masterPages",
                targetControl : "idAppControl",
                subroutes : [ {
                    pattern : "system/{system}/:tab::?query:",
                    name : "system",
                    view : "Detail",
                    viewLevel : 2
                } ]
            }, {
                name : "catchallMaster",
                view : "Master",
                targetAggregation : "masterPages",
                targetControl : "idAppControl",
            } ]
        },
    },

    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        this.oDetailController = null;

        // initialize the router with component data.
        // In case that the component is embedded in Fiori launchpad the
        // parameters are found in property "startupParameters".
        var router = this.getRouter();

        this.setDefaultODataModel("serviceConfig");

        this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);
    },

    onComponentReady : function() {
        this.getRouter().initialize();
    }

});
