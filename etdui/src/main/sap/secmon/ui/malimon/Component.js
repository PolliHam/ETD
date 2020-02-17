/* exported oDateFormatter */
jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.browse.utils");
jQuery.sap.require("sap.secmon.ui.browse.Constants");

// jQuery.sap.includeStyleSheet("/sap/secmon/ui/loglearning/css/loglearning.css");

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

var oConfigModel = new sap.ui.model.json.JSONModel();
oConfigModel.loadData("/sap/secmon/ui/malimon/config.json", null, false);
oConfigModel.setSizeLimit(999999);
sap.ui.getCore().setModel(oConfigModel, "ConfigModel");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.malimon.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [ "themes/sap_bluecrystal/library.css" ],
        dependencies : {
            libs : [ "sap.ui.commons", "sap.ui.layout", "sap.ui.unified", "sap.ui.core", "sap.m", "sap.ui.fl" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.malimon.App",
        config : {
            // TODO:
            title : oTextBundle.getText("MM_TIT_CaseFile"),
            resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
            backendConfig : {
                loadCSRFToken : true
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.malimon",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "CaseFileList",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "EventSeries/:?query:",
                name : "eventSeries",
                view : "EventsVisualization",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "CaseFile/{caseFileId}:?query:",
                name : "caseFileDetails",
                view : "EventsVisualization",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "AttackPath",
                name : "attackPath",
                view : "PathVisualization",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            },{
                pattern : "CaseFile/{caseFileId}/AttackPath/{attackPathId}",
                name : "attackPath2",
                view : "PathVisualization",
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

        var oFieldNamesModel = new sap.ui.model.json.JSONModel();
        oFieldNamesModel.setSizeLimit(999999);
        sap.ui.getCore().setModel(oFieldNamesModel, 'FieldNamesModel');
        var oQuery = {
            operation : "getFieldList",
            period : {
                operator : "=",
                searchTerms : [ "lastHour" ]
            },
            now : (new Date()).toUTCString(),
            dataSets : [],
            context : "Log",
            startDatasets : [ {
                name : "Path1"
            } ]
        };
        sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery)).done(function(response, textStatus, XMLHttpRequest) {
            var aaFieldNames = {};
            var oFieldNamesData = {
                Log : {}
            };
            response.data.forEach(function(oAttr) {
                aaFieldNames[oAttr.name] = {
                    displayName : oAttr.displayName,
                    description : oAttr.description
                };
            });
            oFieldNamesData.Log = aaFieldNames;
            oFieldNamesModel.setData(oFieldNamesData);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var sMessageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sMessageText);
        });
    },
});
