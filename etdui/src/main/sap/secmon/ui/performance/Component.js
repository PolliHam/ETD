$.sap.registerModulePath("sap.secmon", "/sap/secmon");
$.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.registerModulePath("sap.secmon.ui", "/sap/secmon/ui");
$.sap.require("sap.secmon.ui.m.commons.EtdComponent");
$.sap.require("sap.ui.core.format.DateFormat");
$.sap.require("sap.secmon.ui.commons.TextUtils");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.m.routing.RouteMatchedHandler");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.m.commons.EtdController");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");

// global variables which are used in many controls
var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
var oTextBundle = $.sap.resources({
    url : "/sap/secmon/ui/UIText.hdbtextbundle",
    locale : sLocale
});

sap.ui.define([ "sap/secmon/ui/m/commons/EtdComponent", "sap/secmon/ui/browse/utils" ], function(EtdComponent, Utils) {
    "use strict";

    return EtdComponent.extend("sap.secmon.ui.performance.Component", {
        metadata : {
            name : "DesignUI",
            version : "1.0",
            includes : ["ui/themes/sap_bluecrystal/library.css"],
            dependencies : {
                libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl" ],
                components : []
            },
            handleValidation : true,
            config : {
                // Will be used by the FLP as title in browser
                title : oTextBundle.getText("PE_Title"),
                resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
                backendConfig : {
                    loadCSRFToken : true
                }
            }
        },

        init : function() {
            EtdComponent.prototype.init.apply(this, arguments);
        },

    createContent : function() {

            var oApplicationHeader = new sap.ui.commons.ApplicationHeader('appHeader', {
                logoText : oTextBundle.getText("PE_Title"),
                displayLogoff : true,
                displayWelcome : false,
                });
            oApplicationHeader.placeAt("appheader");

        // create root view
            var oView = sap.ui.view({
                id : "userShell",
                viewName : "sap.secmon.ui.performance.performance",
                type : sap.ui.core.mvc.ViewType.JS
            });
            oView.placeAt("content");
        },

        onComponentReady : function(){
            sap.ui.getCore().byId("userShell").setModel(this.getModel("applicationContext"), "applicationContext");
        }
    });
});