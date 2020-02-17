//This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");

jQuery.sap.require("sap.secmon.ui.m.commons.RoutingParameterHelper");
// This is necessary so that the custom router specified in the config is found
// and instantiated
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.VetoCollector");
jQuery.sap.require("sap.secmon.ui.m.commons.LaunchpadRefresher");
jQuery.sap.require("sap.secmon.ui.m.commons.RoutingParameterHelper");

jQuery.sap.declare("sap.secmon.ui.m.settings.Component");
sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.settings.Component", {

    metadata : {
        name : "Settings",
        "library" : "sap.secmon.ui.m.manageEvents",
        "version" : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.settings.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/settings/i18n/UIText.hdbtextbundle", "SettingsTitle"),
            resourceBundle : "/sap/secmon/ui/m/settings/i18n/UIText.hdbtextbundle",
            ConfigurationParametersConfig : {
                name : "ConfigurationParameters",
                serviceUrl : "/sap/secmon/services/ConfigurationParameters.xsodata"
            },
            PatternFiltersConfig : {
                name : "PatternFilters",
                serviceUrl : "/sap/secmon/services/patternfilter/PatternFilter.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadEnums : "sap.secmon",
                loadPatternDefinitions : true
            },
            fullWidth : true
        },
        routing : {
            config : {
                // injects component data into route parameters
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.settings.view",
                targetAggregation : "detailPages",
                clearTarget : false,
                transition : "show"
            },
            routes : [ {
                pattern : "",
                name : "main",
                view : "Master",
                viewLevel : 0,
                targetAggregation : "masterPages",
                targetControl : "idAppControl",
                subroutes : [ {
                    pattern : "manageEvents",
                    name : "manageEvents",
                    view : "EventDetail",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,
                }, {
                    pattern : "manageAlerts",
                    name : "manageAlerts",
                    view : "AlertDetail",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,
                }, {
                    pattern : "patternFilter",
                    name : "patternFilter",
                    view : "PatternFilter",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,
                }, {
                    pattern : "patternFilterDetails/{id}",
                    name : "patternFilterDetails",
                    view : "PatternFilterDetails",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,
                }, {
                    pattern : "contentReplications",
                    name : "contentReplications",
                    view : "ContentReplications",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,
                }, {
                    pattern : "contentSync",
                    name : "contentSync",
                    view : "ContentSync",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,
                }, {
                    pattern : "timeZone",
                    name : "timeZone",
                    view : "TimeZone",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,
                }, {
                    pattern : "anomaly",
                    name : "anomaly",
                    view : "AnomalyDetail",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,
                }, {
                    pattern : "customProcess",
                    name : "customProcess",
                    view : "EnumExtensions",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,

                }, {
                    pattern : "workloadManagement",
                    name : "workloadManagement",
                    view : "WorkloadManagement",
                    viewPath : "sap.secmon.ui.m.settings.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2,

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

        // Initialize the router with component data.
        // In case that the component is embedded in Fiori
        // launchpad the
        // parameters are found in property "startupParameters".
        var router = this.getRouter();
        var componentData = this.getComponentData();
        if (componentData) {
            var oRoutingParameterHelper = new sap.secmon.ui.m.commons.RoutingParameterHelper();

            oRoutingParameterHelper.setHashFromParametersIfHashIsEmpty(componentData.startupParameters, "manageEvents");
        }
        this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);

        this.setODataModel("ConfigurationParametersConfig");
        this.setODataModel("PatternFiltersConfig");

        // content sync
        var oContentSyncModel = new sap.ui.model.json.JSONModel();
        oContentSyncModel.setSizeLimit(500);
        oContentSyncModel.setData({
            logs : []
        });
        this.setModel(oContentSyncModel, "ContentSyncModel");
    },

    onComponentReady : function() {

        // Must be done inside Component.js init: View controller rely on models
        // set up in init
        this.getRouter().initialize();

    }

});
