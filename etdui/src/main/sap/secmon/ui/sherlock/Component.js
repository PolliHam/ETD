/* exported oTextBundle, oCommonTextBundle */
jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");

// global variables which are used in many controls
var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
var oTextBundle = jQuery.sap.resources({
    url : "/sap/secmon/ui/sherlock/i18n/UIText.hdbtextbundle",
    locale : sLocale
});
var oCommonTextBundle = jQuery.sap.resources({
    url : "/sap/secmon/ui/CommonUIText.hdbtextbundle",
    locale : sLocale
});

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.sherlock.Component", {

    metadata : {
        rootView : "sap.secmon.ui.sherlock.view.App",
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            components : []
        },
        handleValidation : true,
        config : {
            // Will be used by the FLP as title in browser
            title : oTextBundle.getText("SH_Title"),
            resourceBundle : "/sap/secmon/ui/sherlock/i18n/UIText.hdbtextbundle",
            fullWidth : true
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.sherlock.view",
                controlId : "app",
                controlAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                target : "list"
            }, {
                pattern : "searchList",
                name : "searchList",
                target : "list"
            } ],
            targets : {
                list : {
                    viewName : "List",
                    viewLevel : 1
                }
            }
        }
    },

    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        // Translation Model
        var i18nBackendModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/texts/Texts.hdbtextbundle"
        });
        this.setModel(i18nBackendModel, "i18nBackend");

        this.getRouter().initialize();
    }
});
