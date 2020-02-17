/* exported oDateFormatter */
jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.registerResourcePath("sap.secmon.ui", "/sap/secmon/ui");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.secmon.ui.browse.Constants");
jQuery.sap.require("sap.ui.model.odata.CountMode");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/malimon/themes/sap_bluecrystal/library.css");

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

var oTimeRangeModel = new sap.ui.model.json.JSONModel();
sap.ui.getCore().setModel(oTimeRangeModel, "TimeRangeModel");

var oConfigModel = new sap.ui.model.json.JSONModel();
oConfigModel.setSizeLimit(999999);
oConfigModel.loadData("/sap/secmon/ui/malimon/config.json", null, false);
sap.ui.getCore().setModel(oConfigModel, "ConfigModel");

var oTop10Model = new sap.ui.model.json.JSONModel();
oTop10Model.setSizeLimit(999999);
sap.ui.getCore().setModel(oTop10Model, "Top10Model");

var oInvestigationODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/alertInvestigation.xsodata", {
    json : true,
    defaultCountMode : sap.ui.model.odata.CountMode.Inline
});
sap.ui.getCore().setModel(oInvestigationODataModel, "InvestigationODataModel");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.malimon.foa.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        dependencies : {
            libs : [ "sap.ui.commons", "sap.ui.layout", "sap.ui.unified", "sap.ui.core", "sap.m" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.malimon.App",
        config : {
            // TODO:
            title : oTextBundle.getText("MM_TIT_FOA"),
            resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
            backendConfig : {
                loadCSRFToken : true
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.malimon.foa",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "GraphVisualization",
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl"
            } ]
        },
    },

    fnLoadTimeRanges : function() {
        var oQuery = {
            operation : sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_TIMERANGE_LIST,
            requests : []
        };
        sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery)).done(function(response, textStatus, XMLHttpRequest) {
            var oTimeRangeList = [];
            for (var i = 0, maxLen = response.length; i < maxLen; i++) {
                oTimeRangeList.push(response[i]);
            }
            sap.ui.getCore().getModel("TimeRangeModel").setData(oTimeRangeList);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var sMessageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sMessageText);
        });
    },

    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());
    },

    onComponentReady : function() {
        // this.setupRouting();
        this.getRouter().initialize();
        this.fnLoadTimeRanges();
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
