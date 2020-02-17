// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/alertsfs/css/style.css");

var ADependencies = [ "sap/secmon/ui/m/commons/EtdComponent", "sap/secmon/ui/commons/TextUtils", "sap/m/routing/RouteMatchedHandler", ];

sap.ui.define(ADependencies, function(EtdComponent, TextUtils, RouteMatchedHandler) {
    "use strict";
    return EtdComponent.extend("sap.secmon.ui.m.alertsfs.Component", {

        metadata : {
            name : "Alerts",
            version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
            includes : [],
            dependencies : {
                libs : [ "sap.m", "sap.ui.layout", "sap.ui.fl", "sap.ui.table", "sap.ui.comp", "sap.ui.commons", "sap.ui.vbm" ],
                components : []
            },
            rootView : "sap.secmon.ui.m.alertsfs.view.App",
            config : {
                // Will be used by the FLP as title in browser
                title : TextUtils.getText("/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle", "MobAlert_Alerts_Title"),
                resourceBundle : "/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle",
                serviceConfig : {
                    name : "Alerts",
                    serviceUrl : "/sap/secmon/services/patterndefinitionToAlerts.xsodata"
                },
                patternNameSpace : {
                    name : "patternNameSpace",
                    serviceUrl : "/sap/secmon/services/ui/m/patterns/WorkspacePatternDefinition.xsodata"
                },
                backendConfig : {
                    loadCSRFToken : true,
                    loadEnums : "sap.secmon.services.ui,sap.secmon.ui.browse",
                    loadHanaUsers : false,
                    loadPatternDefinitions : true,
                    loadKnowledgeBaseTexts : true
                }
            },
            routing : {
                config : {
                    routerClass : sap.ui.core.routing.Router,
                    viewType : "XML",
                    viewPath : "sap.secmon.ui.m.alertsfs.view",
                    targetAggregation : "pages",
                    clearTarget : false
                },
                routes : [ {
                    pattern : ":?query:",
                    name : "main",
                    view : "Alerts",
                    viewLevel : 0,
                    targetControl : "idAppControl",
                }, {
                    pattern : "graph:?query:",
                    name : "alertGraph",
                    view : "Alerts",
                    viewLevel : 0,
                    targetControl : "idAppControl",
                }, {
                    pattern : "graphSymbol:?query:",
                    name : "alertGraphSymbol",
                    view : "Alerts",
                    viewLevel : 0,
                    targetControl : "idAppControl",
                }, {
                    pattern : "systemLocation:?query:",
                    name : "systemLocation",
                    view : "Alerts",
                    viewLevel : 0,
                    targetControl : "idAppControl",
                }

                ]
            },
        },
        init : function() {
            sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

            // Create and set domain model to the component
            this.setDefaultODataModel("serviceConfig");
            this.setODataModel("patternNameSpace");
            // set variant model
            var oVariantModel = new sap.ui.model.json.JSONModel();
            this.setModel(oVariantModel, "variants");
            var router = this.getRouter();
            this.routeHandler = new RouteMatchedHandler(router);

        },

        onComponentReady : function() {
            this.getRouter().initialize();
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

});
