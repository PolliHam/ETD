//This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");

jQuery.sap.require("sap.secmon.ui.m.commons.RoutingParameterHelper");
// This is necessary so that the custom router specified in the config is found
// and instantiated
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.declare("sap.secmon.ui.m.knowledgebase.Component");
sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.knowledgebase.Component", {

    metadata : {
        name : "Knowledge Base",
        "version" : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.m", "sap.ui.layout" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.knowledgebase.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/knowledgebase/i18n/UIText.hdbtextbundle", "Title"),
            resourceBundle : "/sap/secmon/ui/m/knowledgebase/i18n/UIText.hdbtextbundle",
            KnowledgebaseConfig : {
                name : "Knowledgebase",
                serviceUrl : "/sap/secmon/services/KnowledgeBase.xsodata"
            },
            NamespaceConfig : {
                name : "Namespace",
                serviceUrl : "/sap/secmon/services/NameSpacesOriginalInSystem.xsodata"
            },

            backendConfig : {
                loadKnowledgeBaseTexts : true,
                loadCSRFToken : true,
                loadEnums : "sap.secmon.services.ui.m"
            },
            fullWidth : true
        },
        routing : {
            config : {
                // injects component data into route parameters
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.knowledgebase.view",
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
                    pattern : "events",
                    name : "events",
                    view : "Events",
                    viewPath : "sap.secmon.ui.m.knowledgebase.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 1
                }, {
                    pattern : "events/{id}",
                    name : "eventDetail",
                    view : "EventDetail",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2
                }, {
                    pattern : "logtypes",
                    name : "logtypes",
                    view : "LogTypes",
                    viewPath : "sap.secmon.ui.m.knowledgebase.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 1
                }, {
                    pattern : "attributes",
                    name : "attributes",
                    view : "Attributes",
                    viewPath : "sap.secmon.ui.m.knowledgebase.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 1
                }, {
                    pattern : "logtypes/{id}",
                    name : "logtypeDetail",
                    view : "LogTypesDetail",
                    viewPath : "sap.secmon.ui.m.knowledgebase.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2
                }, {
                    pattern : "attributes/{id}",
                    name : "attributesDetail",
                    view : "AttributesDetail",
                    viewPath : "sap.secmon.ui.m.knowledgebase.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 2
                }, {
                    pattern : "logtypes-new",
                    name : "logtypes-new",
                    view : "CreateNew",
                    viewPath : "sap.secmon.ui.m.knowledgebase.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 1
                }, {
                    pattern : "events-new",
                    name : "events-new",
                    view : "CreateNew",
                    viewPath : "sap.secmon.ui.m.knowledgebase.view",
                    viewType : "XML",
                    targetAggregation : "detailPages",
                    viewLevel : 1
                } ]
            }, {
                name : "catchallMaster",
                view : "Master",
                targetAggregation : "masterPages",
                targetControl : "idAppControl"
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

            oRoutingParameterHelper.setHashFromParametersIfHashIsEmpty(componentData.startupParameters, "events");
        }
        this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);

        this.setDefaultODataModel("KnowledgebaseConfig");
        this.setODataModel("KnowledgebaseConfig");
        this.setODataModel("NamespaceConfig");

        var oModel = new sap.ui.model.json.JSONModel("/sap/secmon/services/knowledgebase/getWorkspacesForLogtype.xsjs");
        this.setModel(oModel, "Workspace");

    },

    onComponentReady : function() {

        // Must be done inside Component.js init: View controller rely on models
        // set up in init
        this.getRouter().initialize();

    }

});
