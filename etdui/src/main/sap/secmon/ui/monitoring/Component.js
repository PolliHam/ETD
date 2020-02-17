jQuery.sap.registerModulePath("sap.secmon.ui.monitoring", "/sap/secmon/ui/monitoring/ui");
jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.registerModulePath("sap.secmon.ui", "/sap/secmon/ui");
jQuery.sap.registerResourcePath("sap.secmon.ui.monitoring", "/sap/secmon/ui/monitoring/ui");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.ui.core.format.DateFormat");

var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
var oTextBundle = jQuery.sap.resources({
    url : "/sap/secmon/ui/UIText.hdbtextbundle",
    locale : sLocale
});

sap.ui.define([ "sap/secmon/ui/m/commons/EtdComponent", "sap/secmon/ui/browse/utils" ], function(EtdComponent, Utils) {
    "use strict";

    return EtdComponent.extend("sap.secmon.ui.monitoring.Component", {
        metadata : {
            includes : [ "ui/themes/sap_bluecrystal/library.css" ],
            config : {
                title : oTextBundle.getText("MonHeaderBrowserTab"),
                resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
                backendConfig : {
                    loadKnowledgeBaseTexts : true,
                    loadCSRFToken : true
                }
            }
        },

        init : function() {
            EtdComponent.prototype.init.apply(this, arguments);

            //Mock model. Used until the resource model is fully loaded
            Utils.getView().setModel(new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/texts/KnowledgeBase.hdbtextbundle", async: false
            }), "i18nknowledge");
        },

        createContent : function() {
            // create root view
            var oView = sap.ui.view({
                id : "idShell",
                viewName : "sap.secmon.ui.monitoring.Shell",
                type : sap.ui.core.mvc.ViewType.HTML
            });
            return oView;
        },

        onComponentReady : function(){
            Utils.getView().setModel(this.getModel("i18nknowledge"), "i18nknowledge");
            Utils.getView().setModel(this.getModel("applicationContext"), "ApplicationContext");
            sap.ui.getCore().setModel(this.getModel("i18n"), "i18n");      
        }
    });
});