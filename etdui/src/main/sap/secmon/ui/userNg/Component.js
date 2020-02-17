jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");

sap.ui.define([ "sap/secmon/ui/m/commons/EtdComponent" ], function(EtdComponent) {
    "use strict";

    var sTextBundleUrl = "/sap/secmon/ui/userNg/i18n/UIText.hdbtextbundle";
    var oTextBundle = jQuery.sap.resources({
        url : sTextBundleUrl,
        locale : sap.ui.getCore().getConfiguration().getLanguage()
    });
    var oCommonFunctions = new sap.secmon.ui.commons.CommonFunctions();

    return EtdComponent.extend("sap.secmon.ui.userNg.Component", {

        metadata : {
            name : "ResolveUserUI",
            version : oCommonFunctions.getVersion(),
            includes : [],
            dependencies : {
                libs : [ "sap.ui.layout", "sap.m", ],
                components : []
            },
            handleValidation : true,
            rootView : "sap.secmon.ui.userNg.App",
            config : {
                // Will be used by the FLP as title in browser
                title : oTextBundle.getText("ResolveUser_ApplTitle"),
                resourceBundle : sTextBundleUrl,
                backendConfig : {
                    loadCSRFToken : true,
                    loadEnums : "sap.secmon.services.ui.systemcontext",
                    loadPatternDefinitions : false
                }
            },
            routing : {
                config : {
                    routerClass : sap.ui.core.routing.Router,
                    viewType : "XML",
                    viewPath : "sap.secmon.ui.userNg",
                    targetAggregation : "pages",
                    targetControl : "userNg-app",
                    clearTarget : false
                },
                routes : [ {
                    pattern : ":?query:",
                    name : "main",
                    view : "Main",
                    viewLevel : 0,
                    viewType : 'XML',
                } ]
            },
        },
        init : function() {
            sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
            this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());

            var oApplicationContextModel = new sap.ui.model.json.JSONModel("/sap/secmon/services/common/ApplicationContext.xsjs");
            this.setModel(oApplicationContextModel, "applicationContext");

            var oLogModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/protocol/pseudonymProtocol.xsodata", {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            this.setModel(oLogModel, "log");

            var oDefaultModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/user/account.xsodata", {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            this.setModel(oDefaultModel);

        },

        onComponentReady : function() {
            // this.setupRouting();
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

    });

});