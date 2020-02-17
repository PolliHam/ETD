//This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../../sap/secmon");

/*- This component displays alert details view full screen. 
 * The id of the alert to be displayed is expected as component startup parameter with name 
 * alert. (componentData.startupParameters.alert[0]="...").
 * */

var ADependencies = [ "sap/secmon/ui/m/commons/EtdComponent", "sap/secmon/ui/commons/TextUtils" ];

sap.ui.define(ADependencies, function(EtdComponent, TextUtils) {
    "use strict";

    return EtdComponent.extend("sap.secmon.ui.m.alerts.details.Component", {

        metadata : {
            name : "AlertDetails",
            version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
            includes : [],
            dependencies : {
                libs : [ "sap.m", "sap.ui.layout", "sap.ui.fl", "sap.ui.comp", "sap.viz" ],
                components : []
            },
            rootView : "sap.secmon.ui.m.alerts.OneViewApp",
            config : {
                // Will be used by the FLP as title in browser
                title : TextUtils.getText("/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle", "MobAlert_SingleAlertView"),
                resourceBundle : "/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle",
                alertsConfig : {
                    serviceUrl : "/sap/secmon/services/ui/m/alerts/AlertDetailsWithCounts.xsodata"
                },
                backendConfig : {
                    loadCSRFToken : true,
                    loadEnums : "sap.secmon.services.ui",
                    loadHanaUsers : false,
                    loadKnowledgeBaseTexts : true
                }
            },
            routing : {
                config : {
                    viewType : "XML",
                    viewPath : "sap.secmon.ui.m.alerts",
                    targetControl : "idAppControl",
                    targetAggregation : "pages",
                    clearTarget : false
                },
                routes : [ {
                    pattern : "alert/:tab::?query:",
                    name : "alert",
                    view : "Alert",
                    viewLevel : 2
                }, {
                    pattern : ":all*:",
                    name : "alert_default",
                    view : "Alert",
                    viewLevel : 2
                }, ]
            },
        },
        init : function() {
            EtdComponent.prototype.init.apply(this, arguments);

            var componentData = this.getComponentData();
            this.alertId = null;
            this.bEditAlert = false;
            if (componentData !== null && componentData !== undefined) {
                this.alertId = componentData.startupParameters.alert[0];
                if (componentData.startupParameters.change && componentData.startupParameters.change[0] === "true") {
                    this.bEditAlert = true;
                }
                if (componentData !== null && componentData !== undefined && componentData.startupParameters.tab && componentData.startupParameters.tab.length > 0) {
                    this.tab = componentData.startupParameters.tab[0];
                } else {
                    this.tab = null;
                }
            }

            this.setDefaultODataModel("alertsConfig");
        },

        onComponentReady : function() {
            var router = this.getRouter();
            router.initialize();
            var queryObj = {
                alert : this.alertId,
                edit : this.bEditAlert,
                fullscreen : "true"
            };
            if (this.tab === null) {
                router.navTo("alert", {
                    query : queryObj
                }, true);
            } else {
                router.navTo("alert", {
                    query : queryObj,
                    tab : this.tab
                }, true);
            }
        },

    });

});
