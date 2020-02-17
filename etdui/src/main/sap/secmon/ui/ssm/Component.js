jQuery.sap.registerModulePath("sap.secmon.ui.ssm", "/sap/secmon/ui/ssm");
jQuery.sap.registerModulePath("sap.secmon.ui", "/sap/secmon/ui");
jQuery.sap.registerResourcePath("sap.secmon.ui.ssm", "/sap/secmon/ui/ssm");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");

var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
var oTextBundle = jQuery.sap.resources({ 
    url:"/sap/secmon/ui/UIText.hdbtextbundle",  
    locale: sLocale
});

sap.ui.define([ "sap/secmon/ui/m/commons/EtdComponent", "sap/secmon/ui/commons/TextUtils"], function(EtdComponent, TextUtils) {
    "use strict";
            
        return EtdComponent.extend("sap.secmon.ui.ssm.Component", {
            metadata : {
                includes : [ "ui/themes/sap_bluecrystal/library.css" ],
                    config : {
                        title : oTextBundle.getText("SSM_Systems_Window_Title"),
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
                     // create root view
                    var oView = sap.ui.view({
                        id:"idShell", 
                        viewName:"sap.secmon.ui.ssm.Shell", 
                        type:sap.ui.core.mvc.ViewType.HTML
                    });
                    return oView;
                },

                onComponentReady : function(){
                    sap.ui.getCore().setModel(this.getModel("i18n"), "i18n");  
                }
            });
        });
