jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.registerModulePath("sap.secmon.ui", "/sap/secmon/ui");
jQuery.sap.registerResourcePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");

var sLocale = sap.ui.getCore().getConfiguration().getLanguage();
var oTextBundle = jQuery.sap.resources({
    url : "/sap/secmon/ui/UIText.hdbtextbundle",
    locale : sLocale
});

sap.ui.define([ "sap/secmon/ui/m/commons/EtdComponent", "sap/secmon/ui/browse/utils" ], function(EtdComponent, Utils) {
    "use strict";

    return EtdComponent.extend("sap.secmon.ui.browse.shell.Component", {
        metadata : {
            includes : [ "ui/themes/sap_bluecrystal/library.css" ],
            config : {
                title : oTextBundle.getText("BU_Window_Title"),
                resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
                backendConfig : {
                    loadEnums : "sap.secmon.ui.browse",
                    loadCSRFToken : true,
                    loadKnowledgeBaseTexts : true
                }
            }
        },

        init : function() {
            EtdComponent.prototype.init.apply(this, arguments);
        },

        createContent : function() {
            // create root view
            var oView = sap.ui.view({
                id : "idShell",
                viewName : "sap.secmon.ui.browse.Shell",
                type : sap.ui.core.mvc.ViewType.HTML
            });

            oView.setModel(sap.ui.getCore().getModel("WorkspaceModel"), "WorkspaceModel");
            oView.setModel(sap.ui.getCore().getModel("AvailableFiltersModel"), "AvailableFiltersModel");
            oView.setModel(sap.ui.getCore().getModel("DimensionsModel"), "DimensionsModel");
            oView.setModel(sap.ui.getCore().getModel("MeasuresModel"), "MeasuresModel");
            oView.setModel(sap.ui.getCore().getModel("BrowsingContextModel"), "BrowsingContextModel");

            sap.ui.getCore().attachFormatError(this._errorValidation);
            sap.ui.getCore().attachParseError(this._errorValidation);
            sap.ui.getCore().attachValidationError(this._errorValidation);
            sap.ui.getCore().attachValidationSuccess(function(oExeption) {
                var oElement = oExeption.getParameter("element");
                if (oElement.setValueState) {
                    oElement.setValueState(sap.ui.core.ValueState.None);
                }
            });
            return oView;
        },

        onComponentReady : function() {
            Utils.getView().setModel(this.getModel("applicationContext"), "applicationContext");
            Utils.getView().setModel(this.getModel("i18n"), "i18n");
            Utils.getView().setModel(this.getModel("i18nCommon"), "i18nCommon");
            Utils.getView().setModel(this.getModel("i18nknowledge"), "i18nknowledge");

            sap.secmon.ui.browse.utils.XCSRFToken = this.getCsrfToken();

            Utils.getView().getController().onComponentReady();
        },

        _errorValidation : function(oEvt) {
            var oElement = oEvt.getParameter("element");
            if (oElement.setValueState) {
                oElement.setValueState(sap.ui.core.ValueState.Error);
            }
        }
    });
});