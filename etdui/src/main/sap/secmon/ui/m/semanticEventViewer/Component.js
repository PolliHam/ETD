jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.semanticEventViewer.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");

jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.require("sap.secmon.ui.browse.Constants");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.semanticEventViewer.Component", {

    NAMESPACES_SOURCE_URL : "/sap/secmon/services/NameSpacesOriginalInSystem.xsodata",

    metadata : {
        name : "Events",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.semanticEventViewer.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/semanticEventViewer/i18n/UIText.hdbtextbundle", "SemanticEv_App_Title"),
            resourceBundle : "/sap/secmon/ui/m/semanticEventViewer/i18n/UIText.hdbtextbundle",
            serviceConfig : {
                name : "Events",
                serviceUrl : "/sap/secmon/ui/browse/services2/logEntries.xsjs"
            // serviceUrl : "/sap/secmon/services/ui/m/semanticEvents/logEvents.xsodata"
            },
            backendConfig : {
                loadHanaUsers : false,
                loadKnowledgeBaseTexts : true
            }
        },
        routing : {
            config : {
                // injects component data into route parameters
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.semanticEventViewer.view",
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
                    pattern : "SemanticEventViewer/{SemanticEventViewer}/:tab::?query:",
                    name : "SemanticEventViewer",
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
        var oDataModel;
        // initialize the router with component data.
        // In case that the component is embedded in Fiori launchpad the
        // parameters are found in property "startupParameters".

        var router = this.getRouter();

        this.setDefaultODataModel("serviceConfig");
        oDataModel = this.getModel();
        oDataModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
        this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);
        this.getRouter().initialize();

    }

});
