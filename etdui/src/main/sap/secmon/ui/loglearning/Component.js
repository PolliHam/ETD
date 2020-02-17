/* exported oCommonFunctions */
jQuery.sap.registerModulePath("sap.secmon", "/sap/secmon");
jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.ui.core.format.DateFormat");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
jQuery.sap.require("sap.ui.model.odata.CountMode");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/loglearning/css/loglearning.css");

// global variables which are used in many controls
var sLocale = sap.ui.getCore().getConfiguration().getLanguage();

var oTextBundle = jQuery.sap.resources({
    url : "/sap/secmon/ui/UIText.hdbtextbundle",
    locale : sLocale
});

var oRunModel = new sap.ui.model.json.JSONModel({
    selectedRunName : undefined
});
var oRunJSONModel = new sap.ui.model.json.JSONModel();
var oLogDiscoveryModel = new sap.ui.model.odata.ODataModel("/sap/secmon/loginterpretation/logDiscoveryAPI.xsodata", {
    json : true,
    defaultCountMode : sap.ui.model.odata.CountMode.Inline
});
var oKBModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/KnowledgeBase.xsodata", {
    json : true,
    defaultCountMode : sap.ui.model.odata.CountMode.Inline
});
var oCountModel = new sap.ui.model.json.JSONModel();
var oCountRunModel = new sap.ui.model.json.JSONModel();

sap.ui.getCore().setModel(oRunModel, "RunModel");
sap.ui.getCore().setModel(oRunJSONModel, "RunJSONModel");
sap.ui.getCore().setModel(oKBModel, "KBModel");
sap.ui.getCore().setModel(oLogDiscoveryModel, "logDiscovery");
sap.ui.getCore().setModel(oCountModel, "CountModel");
sap.ui.getCore().setModel(oCountRunModel, "CountRunModel");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.loglearning.Component", {

    metadata : {
        name : "DesignUI",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.commons", "sap.ui.table", "sap.ui.layout", "sap.ui.unified", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.comp" ],
            components : []
        },
        handleValidation : true,
        rootView : "sap.secmon.ui.loglearning.App",
        config : {
            // Will be used by the FLP as title in browser
            title : oTextBundle.getText("Interpret_HeaderBrowserTab"),
            resourceBundle : "/sap/secmon/ui/UIText.hdbtextbundle",
            backendConfig : {
                loadCSRFToken : true,
            },
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.loglearning",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "Shell", // list of runs
                viewLevel : 0,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "{run}/parameters:?query:",
                name : "parameters", // tab "Run Parameters"
                view : "ShellRun",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "{run}/entryTypes:?query:",
                name : "entryTypes", // tab "Entry Types"
                view : "ShellRun",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "{run}/entryType({entryType}):?query:",
                name : "entryTypeDetails", // single entry type
                view : "ShellRun",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "{run}/runtimeRules:?query:",
                name : "runtimeRules", // tab "RuntimeRules"
                view : "ShellRun",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "{run}/testResults:?query:",
                name : "testResults", // tab "Test Results"
                view : "ShellRun",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            }, {
                pattern : "{run}/protocol:?query:",
                name : "protocol", // tab "Protocol"
                view : "ShellRun",
                viewLevel : 1,
                viewType : 'XML',
                targetControl : "idAppControl"
            } ]
        },
    },
    init : function() {
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);
        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());

        var that = this;
        this.oKBModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/KnowledgeBase.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.setModel(this.oKBModel, "KBModel");

        var aPromises = [ this.createKBEventModelAsync(), this.createKBLogTypeModelAsync() ];
        $.when.apply($, aPromises).done(function() {
            that.onComponentReady();
        });

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

    createKBEventModelAsync : function() {
        var oDeferred = $.Deferred();
        var oModelKBEvent = new sap.ui.model.json.JSONModel();
        oModelKBEvent.setSizeLimit(1000);
        this.setModel(oModelKBEvent, "KBEventModel");

        this.oKBModel.read("/Event?$orderby=displayName", {
            success : function(oData, oResponse) {
                if (oData.results) {
                    oData.results.splice(0, 0, {
                        hash : "MA==",
                        name : "",
                        nameSpace : ""
                    });
                }
                oModelKBEvent.setData(oData.results);
                oDeferred.resolve();
            },
            error : function(oError) {
                console.error(oError);
                oDeferred.reject();
            }
        });
        return oDeferred.promise();
    },

    createKBLogTypeModelAsync : function() {
        var oDeferred = $.Deferred();
        var oLogTypeJsonModel = new sap.ui.model.json.JSONModel();
        this.setModel(oLogTypeJsonModel, "LogTypeModel");
        this.oKBModel.read("/LogType?$orderby=displayName", {
            success : function(oData, oResponse) {
                if (oData.results) {
                    oData.results.splice(0, 0, {
                        hash : "MA==",
                        name : "",
                        nameSpace : ""
                    });
                }
                oLogTypeJsonModel.setData(oData.results);
                oDeferred.resolve();
            },
            error : function(oError) {
                console.error(oError);
                oDeferred.reject();
            }
        });
        return oDeferred.promise();
    },

});
