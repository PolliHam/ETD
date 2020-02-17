//This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.invest.details.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.VetoCollector");

jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");

/*- This component displays investigation details view full screen. 
 * The id (in HEX) of the investigation to be displayed is expected as component startup parameter with name 
 * investigation. (componentData.startupParameters.investigation[0]="...").
 * */
sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.invest.details.Component", {

    metadata : {
        name : "InvestigationDetails",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.m", "sap.ui.layout" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.invest.view.OneViewApp",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/UIText.hdbtextbundle", "MInvest_InvestDet"),
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
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.invest.view",
                targetControl : "idAppControl",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : "investigation/{investigation}/:tab::?query:",
                name : "investigation",
                view : "Detail",
                viewLevel : 2
            }, ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        this.setModel(this.getModel("i18n"), "i18nInvest");
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
        this.setDefaultODataModel("serviceConfig");
    },

    onComponentReady : function() {
        this.setupRouting();
        this.getRouter().initialize();

        var componentData = this.getComponentData();
        var sInvestId = null;
        var bEdit = false;
        var sTab;

        if (componentData !== null && componentData !== undefined) {
            sInvestId = componentData.startupParameters.investigation[0];
            bEdit = componentData.startupParameters.change && componentData.startupParameters.change[0] === "true";
            sTab = componentData.startupParameters.tab ? componentData.startupParameters.tab : "discussion";
        }

        var investigation = "Investigation(X'" + sInvestId + "')";
        var queryObj = {
            fullscreen : "true",
            edit : bEdit
        };
        this.getRouter().navTo("investigation", {
            investigation : investigation,
            tab : sTab,
            query : queryObj
        }, true);
    },
    setupRouting : function() {
        this.getRouter().attachRouteMatched(function(oEvent) {
            var oArguments = oEvent.getParameter("arguments");
            var query = oArguments["?query"] ? oArguments["?query"] : {};
            //set current arguments if provided in url
            var componentData = this.getComponentData();
            if (componentData && componentData.startupParameters){
                componentData.startupParameters.tab = oArguments.tab;
                componentData.startupParameters.change = [query.edit];
            }
        }, this);
    },

    onAfterRendering : function() {
        // set FS mode on desktop if the requirements are met
        if (this.oContainer) {
            var oParent = (this.oContainer.getParent ? this.oContainer.getParent() : null);
            if (oParent) {
                oParent = (oParent.getParent ? oParent.getParent() : null);

                if (oParent.setAppWidthLimited) {
                    oParent.setAppWidthLimited(!sap.ui.Device.system.desktop);
                }
            }

        }
    },

    setContainer : function(oContainer) {
        // remember container for FS mode
        this.oContainer = oContainer;
        sap.secmon.ui.m.commons.EtdComponent.prototype.setContainer.apply(this, arguments);
    }

});
