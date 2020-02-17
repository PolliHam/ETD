/* exported oCommonFunctions */
jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.declare("sap.secmon.ui.domainrating.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.commons.controls.ForceDirectedGraph");

// global variables which are used in many controls
var sLocale = sap.ui.getCore().getConfiguration().getLanguage();

var oTextBundle = jQuery.sap.resources({
    url : "/sap/secmon/ui/domainrating/i18n/UIText.hdbtextbundle",
    locale : sLocale
});

var oCommonFunctions = new sap.secmon.ui.commons.CommonFunctions();

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.domainrating.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.comp", "sap.ui.table" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.domainrating.App",
        config : {
            // Will be used by the FLP as title in browser
            title : oTextBundle.getText("DA_DomainRatings"),
            resourceBundle : "/sap/secmon/ui/domainrating/i18n/UIText.hdbtextbundle",
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.domainrating",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "domainRating",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "analysis/{nid}/:?query:",
                name : "analysis",
                view : "DomainGraph",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl",
            } ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());

        // var mConfig = this.getMetadata().getConfig();
        var router = this.getRouter();
        this.routeHandler = new sap.m.routing.RouteMatchedHandler(router);
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

});
