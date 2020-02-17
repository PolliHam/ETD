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
    url : "/sap/secmon/ui/UIText.hdbtextbundle",
    locale : sLocale
});

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.loglearning.blocks.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.commons", "sap.ui.table", "sap.ui.fl", "sap.ui.comp" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.loglearning.blocks.App",
        config : {
            // Will be used by the FLP as title in browser
            title : oTextBundle.getText("Interpret_Blocks"),
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
                viewPath : "sap.secmon.ui.loglearning.blocks",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "BuildingBlocks",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "Group/{GroupHash}:?query:",
                name : "BuildingBlockDetails",
                view : "BuildingBlocksDetail",
                viewLevel : 2,
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
