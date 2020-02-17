/* exported oDateFormatter, oCommonFunctions */
jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/replication/css/replication.css");

// global variables which are used in many controls
var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
var oDateFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
    style : "long",
    locale : sLocale
});
var oTextBundle = jQuery.sap.resources({
    url : "/sap/secmon/ui/UIText.hdbtextbundle",
    locale : sLocale
});

var oCommonFunctions = new sap.secmon.ui.commons.CommonFunctions();

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.replication.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.commons", "sap.ui.table", "sap.ui.layout", "sap.ui.ux3", "sap.ui.unified", "sap.ui.core", "sap.suite.ui.commons", "sap.ui.fl", "sap.ui.comp" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.replication.view.App",

        config : {
            // Will be used by the FLP as title in browser
            title : oTextBundle.getText("Repl_HeaderBrowserTab"),
            resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
            serviceConfig : {
                name : "Replication",
                serviceUrl : "/sap/secmon/services/replication/ContentReplication.xsodata"
            },
            backendConfig : {
                loadCSRFToken : true,
                loadHanaUsers : true,
                loadEnums : "sap.secmon.services.replication",
            },
        },
        routing : {
            config : {
                viewType : "XML",
                viewPath : "sap.secmon.ui.replication.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : "Export:?query:",
                name : "Export",
                view : "Main",
                viewLevel : 0,
                targetControl : "idAppControl"
            }, {
                pattern : "Import:?query:",
                name : "Import",
                view : "Main",
                viewLevel : 0,
                targetControl : "idAppControl"
            }, {
                pattern : ":?query:",
                name : "Main",
                view : "Main",
                viewLevel : 0,
                targetControl : "idAppControl"
            } ]
        },
    },

    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        var router = this.getRouter();
        this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);

        this.setDefaultODataModel("serviceConfig");
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
    }

});
