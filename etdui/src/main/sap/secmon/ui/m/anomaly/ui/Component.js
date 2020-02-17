/* exported oTextBundle, oTextBundleCommon */
// This is necessary to find sap secmon.ui.browse objects. Without it, they will
// be sought under sap.ui packages
// jQuery.sap.registerResourcePath("/sap/secmon/ui/browse/ui2",
// "../../../../../../../../../../../sap/secmon/ui/browse/ui2");
jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");

// jQuery.sap.registerResourcePath("/sap/secmon",
// "../../../../../../../../sap/secmon");
// jQuery.sap.registerModulePath("sap.secmon",
// "../../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.anomaly.ui.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");

// jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ViewSettingsStyle.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/anomaly/ui/themes/library.css");

// global variables which are used in many controls
var sLocale = sap.ui.getCore().getConfiguration().getLanguage();

// sap.secmon.ui.commons.Formatter;
sap.secmon.ui.m.anomaly.ui.Component = {
    TextBundle : jQuery.sap.resources({
        url : "/sap/secmon/ui/m/anomaly/i18n/UIText.hdbtextbundle",
        locale : sLocale
    })
};
var oTextBundle = sap.secmon.ui.m.anomaly.ui.Component.TextBundle;

var oTextBundleCommon = jQuery.sap.resources({
    url : "/sap/secmon/ui/CommonUIText.hdbtextbundle",
    locale : sLocale
});
sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.anomaly.ui.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.table" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.m.anomaly.ui.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.m.anomaly.ui.Component.TextBundle.getText("BU_Window_Title_ADL"),
            resourceBundle : "/sap/secmon/ui/m/anomaly/i18n/UIText.hdbtextbundle",
            defaultFeature : "/sap/secmon/ui/m/anomaly/ui/defaultFeature.json",
            defaultPattern : "/sap/secmon/ui/m/anomaly/ui/defaultPattern.json",
            defaultScenario : "/sap/secmon/ui/m/anomaly/ui/defaultScenario.json",
            defaultWorkspace : "/sap/secmon/ui/browse/ui/defaultWorkspace.json",
            backendConfig : {
                loadEnums : "sap.secmon.services.ui.m",
                loadKnowledgeBaseTexts : true
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.anomaly.ui",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : "configurePattern/scenario/{name}/{namespace}/:?query:",
                name : "scenario",
                view : "Pattern",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl",
            }, {
                pattern : "configurePattern/evaluation/{evaluationId}/:?query:",
                name : "evaluation",
                view : "Pattern",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl",
            }, {
                pattern : "configurePattern/{patternId}/:?query:",
                name : "pattern",
                view : "Pattern",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl",
            }, {
                pattern : "analysePattern/{patternId}/:?query:",
                name : "analysePattern",
                view : "Analysis",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl",
            }, {
                pattern : "analysis/:?query:",
                name : "analysis",
                view : "Analysis",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl",
            }, {
                pattern : ":?query:",
                name : "main",
                view : "Pattern",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl",
            }, ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());

        var mConfig = this.getMetadata().getConfig();

        // set default models
        var defFeatureModel = new sap.ui.model.json.JSONModel(mConfig.defaultFeature);
        this.setModel(defFeatureModel, "defaultFeature");
        var defPatternModel = new sap.ui.model.json.JSONModel(mConfig.defaultPattern);
        this.setModel(defPatternModel, "defaultPattern");
        var defScenarioModel = new sap.ui.model.json.JSONModel(mConfig.defaultScenario);
        this.setModel(defScenarioModel, "defaultScenario");
        var defWorkspaceModel = new sap.ui.model.json.JSONModel(mConfig.defaultWorkspace);
        this.setModel(defWorkspaceModel, "defaultWorkspace");

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
//
// setContainer : function(oContainer) {
// // remember container for FS mode
// this.oContainer = oContainer;
// sap.secmon.ui.m.commons.EtdComponent.prototype.setContainer.apply(this,
// arguments);
// }
});
