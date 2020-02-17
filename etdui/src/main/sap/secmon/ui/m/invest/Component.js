//This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.invest.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.RoutingParameterHelper");
// This is necessary so that the custom router specified in the config is found
// and instantiated
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.VetoCollector");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.invest.Component", {

    metadata : {
        name : "Investigations",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.commons", "sap.ui.richtexteditor" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.invest.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/UIText.hdbtextbundle", "MInvest_List_Title"),
            resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
            serviceConfig : {
                name : "Investigations",
                serviceUrl : "/sap/secmon/services/ui/m/invest/investigation.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadEnums : "sap.secmon.services.ui.m",
                loadHanaUsers : true,
                loadKnowledgeBaseTexts : true
            }
        },
        routing : {
            config : {
                // injects component data into route parameters
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.invest.view",
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
                    pattern : "investigation/{investigation}/:tab::?query:",
                    name : "investigation",
                    view : "Detail",
                    viewLevel : 2
                }, ]
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
        var i18nValuelist = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle"
        });
        this.setModel(i18nValuelist, "i18nValue");
        var i18nAlert = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle"
        });
        this.setModel(i18nAlert, "i18nAlert");
        var i18nMCommons = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/commons/i18n/UIText.hdbtextbundle"
        });
        this.setModel(i18nMCommons, "i18nMCommons");
        this.setModel(this.getModel("i18n"), "i18nInvest");
        // initialize the router with component data.
        // In case that the component is embedded in Fiori launchpad the
        // parameters are found in property "startupParameters".
        var router = this.getRouter();
        var componentData = this.getComponentData();
        if (componentData !== null && componentData !== undefined) {
            var oRoutingParameterHelper = new sap.secmon.ui.m.commons.RoutingParameterHelper();

            // QuickFix for HANA Revision 94+, ServiceURL does not transform <ME> to SessionUser anymore
            if (componentData.startupParameters &&
                    ($.isArray(componentData.startupParameters.processor) && componentData.startupParameters.processor.length > 0 && (componentData.startupParameters.processor[0] === "<ME>" ||

                    decodeURIComponent(componentData.startupParameters.processor[0]) === "<ME>"))) {

                componentData.startupParameters.processor = this.oCommons.getSessionUser();
            }

            oRoutingParameterHelper.setHashFromParametersIfHashIsEmpty(componentData.startupParameters);
        }

        this.setDefaultODataModel("serviceConfig");

        this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);
    },

    onComponentReady : function() {
        this.getRouter().initialize();
    },
});
