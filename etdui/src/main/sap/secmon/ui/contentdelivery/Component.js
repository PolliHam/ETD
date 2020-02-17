jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");

// global variables which are used in many controls
var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
var oTextBundle = jQuery.sap.resources({
    url : "/sap/secmon/ui/contentdelivery/i18n/UIText.hdbtextbundle",
    locale : sLocale
});

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.contentdelivery.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.comp", "sap.ui.table", "sap.ui.commons" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.contentdelivery.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : oTextBundle.getText("CD_Title"),
            resourceBundle : "/sap/secmon/ui/contentdelivery/i18n/UIText.hdbtextbundle"
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.contentdelivery.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "contentDelivery",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "{Id}:?query:",
                name : "ImportItems",
                view : "importItems",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            } ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());

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
