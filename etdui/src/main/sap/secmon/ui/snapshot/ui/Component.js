/* exported oDateFormatter, oTextBundle, oCommonFunctions */
jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/snapshot/ui/themes/sap_blue_crystal/library.css");

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

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.snapshot.ui.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.commons", "sap.ui.table", "sap.ui.layout", "sap.ui.unified", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.snapshot.ui.App",
        config : {
            title : oTextBundle.getText("SU_FioWin_Tab"),
            resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
            backendConfig : {
                loadCSRFToken : true,
                loadKnowledgeBaseTexts : true
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.snapshot.ui",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "SnapshotPageList",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "{snapshotId}:?query:",
                name : "snapshotDetail",
                view : "SnapshotPage",
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
        this.setModel(this.getModel("i18nknowledge"), "i18nknowledge");
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
