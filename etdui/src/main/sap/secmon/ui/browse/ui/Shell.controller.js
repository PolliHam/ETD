/* globals oTextBundle, Promise */
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.AjaxCache");
$.sap.require("sap.secmon.ui.browse.Workspace");
$.sap.require("sap.secmon.ui.browse.BrowsingChart");
$.sap.require("sap.secmon.ui.browse.RawData");
$.sap.require("sap.secmon.ui.browse.OriginalData");
$.sap.require("sap.ui.commons.MessageBox");
$.sap.require("sap.m.MessageBox");
$.sap.require("sap.secmon.ui.commons.EnumService");
$.sap.require("sap.secmon.ui.commons.controls.AlertForceDirectedGraph");
$.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.ui.model.odata.CountMode");

$.sap.require("sap.secmon.ui.commons.NavigationHelper");

sap.ui.controller("sap.secmon.ui.browse.Shell", {

    C_SPLITTER_LEFT_WIDTH : "33%",
    C_MAX_URL_PARAMS : 1024,
    C_MAX_URL_PARAM_LENGTH : 2048,

    // debug flag to enable backend query builder returns also SQL statement
    bDebug : false,

    // fetch data only from warm storage (SAP-IQ)
    _bForceWarm : false,

    _oSplitterLayout : undefined,
    _oFeatureSpaceLayout : undefined,
    // _oGraphSpace : undefined,
    // _oPlaygroundLayout : undefined,

    _oWorkspace : undefined,
    _oRawData : undefined,
    _oOriginalData : undefined,
    _oAlertGraph : undefined,
    _oBrowsingChart : undefined,

    // Cache to reduce the backend access
    // it can be deactivated via URL parameter
    // _oCache : new sap.secmon.ui.browse.AjaxCache(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_FIELD_LIST),
    _oCache : undefined,

    _oNavigationHelper : new sap.secmon.ui.commons.NavigationHelper(3600),

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf ui.Shell
     */

    onInit : function() {

        // set etd debug to true if sap-ui-debug is set to true
        var sDebugSetting = $.sap.getUriParameters().get('sap-etd-debug');
        this.bDebug = (sDebugSetting && sDebugSetting.toLowerCase() === 'true') ? true : false;
        this._oCache = new sap.secmon.ui.browse.AjaxCache(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_FIELD_LIST, this.bDebug);

        var thisController = this;

        // Global event bus to manage events
        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_DATA, function(sChannelId, sEventId, aParams) {
            // dispatch to log data process if it is normalized log (context = LOG)
            var sPath = aParams.context.getPath().split("/filters")[0]; // ex.:"/paths/0/filters/1"
            var oModel = aParams.context.getModel();
            var sBrowsingContext = oModel.getProperty(sPath).context;
            if (sBrowsingContext === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG) {
                aParams.original = false;
                thisController.handleShowLogData(aParams);
            } else {
                thisController.handleShowRawData(aParams);
            }
        });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_ORIGINAL_DATA,
                function(sChannelId, sEventId, aParams) {
                    thisController.handleShowLogData(aParams);
                });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXPAND_WORKSPACE,
                function(sChannelId, sEventId, aParams) {
                    thisController.handleExpandWorkspace();
                });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXPAND_CHART, function(sChannelId, sEventId, aParams) {
            thisController.handleExpandChart();
        });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXIT_FULL_SCREEN,
                function(sChannelId, sEventId, aParams) {
                    thisController.handleExitFullScreen();
                });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_ALERT_GRAPH,
                function(sChannelId, sEventId, aParams) {
                    thisController.handleShowAlertGraph(aParams);
                });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_OPEN_CASEFILE, function(sChannelId, sEventId, aParams) {
            thisController.handleOpenCasefile(aParams);
        });

        // Workspace list
        var oWorkspaceListModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_QUBE_LIST_PATH, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        sap.ui.getCore().setModel(oWorkspaceListModel, "WorkspaceListModel");

        // Original Namespace list
        var oOriginalNamespacesJSONModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oOriginalNamespacesJSONModel, "OriginalNamespacesJSONModel");
        sap.secmon.ui.browse.utils.readOriginalNamespaces(function(bSuccessful, oResponse) {
            if (bSuccessful) {
                oOriginalNamespacesJSONModel.setData(oResponse);
            } else {
                var messageText = oResponse.message;
                thisController.reportNotification(sap.ui.core.MessageType.Error, messageText);
            }
        });

        // Workspace: complete model
        var oWorkspaceModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oWorkspaceModel, "WorkspaceModel");

        var oAvailableFiltersModel = new sap.ui.model.json.JSONModel();
        oAvailableFiltersModel.setSizeLimit(sap.secmon.ui.browse.Constants.C_MODEL_SIZE_LIMIT.FIELD_LIST);
        sap.ui.getCore().setModel(oAvailableFiltersModel, 'AvailableFiltersModel');

        var oFieldNamesModel = new sap.ui.model.json.JSONModel();
        oFieldNamesModel.setSizeLimit(sap.secmon.ui.browse.Constants.C_MODEL_SIZE_LIMIT.FIELD_LIST);
        sap.ui.getCore().setModel(oFieldNamesModel, 'FieldNamesModel');

        var oDimensionsModel = new sap.ui.model.json.JSONModel();
        oDimensionsModel.setSizeLimit(sap.secmon.ui.browse.Constants.C_MODEL_SIZE_LIMIT.FIELD_LIST);
        sap.ui.getCore().setModel(oDimensionsModel, 'DimensionsModel');

        var oMeasuresModel = new sap.ui.model.json.JSONModel();
        oMeasuresModel.setSizeLimit(sap.secmon.ui.browse.Constants.C_MODEL_SIZE_LIMIT.FIELD_LIST);
        sap.ui.getCore().setModel(oMeasuresModel, 'MeasuresModel');

        // Navigation model
        sap.ui.getCore().setModel(new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_NAVIGATION_PATH, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }), "NavigationModel");

        // Browsing context
        var oBrowsingContextModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oBrowsingContextModel, "BrowsingContextModel");
        this._loadBrowsingContext();

        var oAttackPathJSONModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oAttackPathJSONModel, "AttackPathModel");

        // Time Ranges List
        var oTimeRangeModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oTimeRangeModel, "TimeRangeModel");
        this._loadTimeRanges();

        // Model fetching all the attributes mapping from techKey to {fieldName,
        // displayNa<me and description} for Log|Alert|HealthCheck
        var oAttributeMappingModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oAttributeMappingModel, "AttributeMappingModel");

        // Model to hold the mapping between key and attribute fields:
        // displayName, description etc
        // must be fetch for all contexts (Log|Alert|HealthCheck)
        var oDefaultWorkspaceModel = new sap.ui.model.json.JSONModel();
        oDefaultWorkspaceModel.loadData("ui/defaultWorkspace.json", null, false);
        var sNow = sap.secmon.ui.browse.utils.formatDateTime(new Date());
        oDefaultWorkspaceModel.setProperty("/now", sNow);
        var oWorkspaceData = oDefaultWorkspaceModel.getData();

        var aaAttributeMapping = {};
        oBrowsingContextModel = sap.ui.getCore().getModel("BrowsingContextModel");

        var id = setInterval(function() {
            if (oBrowsingContextModel.getData() && oBrowsingContextModel.getData().length > 0) {
                var nContext = oBrowsingContextModel.getData().length;
                oBrowsingContextModel.getData().forEach(function(oBrowsingContext) {
                    oWorkspaceData.context = oBrowsingContext.name;
                    var promise = sap.secmon.ui.browse.utils.getController()._oCache.getData([ {
                        context : oWorkspaceData.context,
                        subsetId : "Path0",
                    } ], oWorkspaceData);

                    promise.done(function(response, textStatus, XMLHttpRequest) {
                        // convert to associated array
                        var aAttrs = JSON.parse(JSON.stringify(response)).data;
                        aAttrs.forEach(function(oAttr) {
                            aaAttributeMapping[oAttr.key] = oAttr;
                        });

                        if (--nContext <= 0) {
                            oAttributeMappingModel.setData(aaAttributeMapping);
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                        var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                        sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                    });
                });

                clearInterval(id);
            }
        }, 500);

        // Normalized / Original data handling
        this._oRawData = new sap.secmon.ui.browse.RawData({});
        this._oOriginalData = new sap.secmon.ui.browse.OriginalData({});

        var oLogDataModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_LOGS_PATH_XSJS, true);
        oLogDataModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline); // $count shouldn't be called

        this._oRawData.setModel(oLogDataModel);
        this._oOriginalData.setModel(oLogDataModel);

        this._oBrowsingChart = new sap.secmon.ui.browse.BrowsingChart({
            newFilterSelected : [ function(oEvent) {
                this._oWorkspace.addSubsetFromChart(oEvent.mParameters);
            }, this ]
        });

        // Workspace: set up the control
        this._oWorkspace = new sap.secmon.ui.browse.Workspace({
            title : {
                parts : [ {
                    path : "WorkspaceModel>namespace"
                }, {
                    path : "WorkspaceModel>name"
                } ],

                formatter : function(sNamespace, sName) {
                    return sNamespace + ":" + sName;
                }
            },

            browsingChart : this._oBrowsingChart,
            artifactTypeChanged : [ function(oEvent) {
                this.handleArtifactTypeChanged(oEvent.getParameter("type"));
            }, this ]
        });

        this._oWorkspace.setLayoutData(new sap.ui.layout.SplitterLayoutData({
            size : this.C_SPLITTER_LEFT_WIDTH,
        // minSize : 200
        }));

        var oShell = this.byId("shlMain");

        // set mode to compact
        // oShell.addStyleClass("sapUiSizeCompact");
        // apply compact density if touch is not supported, the standard cozy
        // design otherwise
        this.getView().addStyleClass(sap.ui.Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact");

        this._oSplitterLayout = new sap.ui.layout.Splitter({
            id : "splitterLayout",
            width : "100%",
            contentAreas : [ this._oWorkspace ],
            resize : [ function(oEvent) {
                // update the threshold of a pattern
                if (this._oWorkspace.getChart()) {
                    this._oWorkspace.getChart().getModel().refresh(true);
                }
            }, this ]
        });

        oShell.setContent(this._oSplitterLayout);

        // // Test navigation
        // this._oPlaygroundLayout = new sap.ui.commons.layout.VerticalLayout({
        // content : [ new sap.secmon.ui.browse.Bubblegram({}) ]
        // });

        var notificationBar = this.byId("shlMain").getNotificationBar();
        notificationBar.getMessageNotifier().setTitle(oTextBundle.getText("BU_TIT_NotificationBar"));
        this.setNotifierIcon();
    },
    onShowHelp : function(oEvent) {
        var sLink = "/sap/secmon/help/" + "0ad2dcd5772145858c3b99fee060c259" + ".html";
        window.open(sLink);
    },
    onGoHome : function(oEvent) {
        window.location = sap.secmon.ui.m.commons.NavigationService.LAUNCHPAD_URL;
    },
    /*
     * when a user clicks on a message, remove it from the notifier
     */
    onMessageSelected : function(oEvent) {

        var notifier = oEvent.getParameters().notifier;
        var message = oEvent.getParameters().message;
        notifier.removeMessage(message);
        message.destroy();
        this.setNotifierIcon();
    },

    setNotifierIcon : function() {

        var notifier = this.byId("shlMain").getNotificationBar().getMessageNotifier();
        var icon = "ui/img/hint.png";

        var messages = notifier.getMessages();

        for (var i = 0, len = messages.length; i < len; i++) {
            switch (messages[i].getLevel()) {
            case sap.ui.core.MessageType.Error:
                icon = "ui/img/error.png";
                break;
            case sap.ui.core.MessageType.Warning:
                icon = "ui/img/warning.png";
                break;
            }

            if (icon === "ui/img/error.png") {
                break;
            }
        }

        notifier.setIcon(icon);
    },

    reportNotification : function(level, text) {

        var icon = "ui/img/hint.png";

        switch (level) {
        case sap.ui.core.MessageType.Error:
            icon = "ui/img/error.png";
            break;
        case sap.ui.core.MessageType.Warning:
            icon = "ui/img/warning.png";
            break;
        }

        var date = new Date();
        var message = new sap.ui.core.Message({
            text : text,
            icon : icon,
            timestamp : date.toLocaleString(),
            level : level
        });

        var notificationBar = this.byId("shlMain").getNotificationBar();
        notificationBar.getMessageNotifier().addMessage(message);
        if (notificationBar.getVisibleStatus() === sap.ui.ux3.NotificationBarStatus.None || notificationBar.getVisibleStatus() === sap.ui.ux3.NotificationBarStatus.Min) {
            notificationBar.setVisibleStatus(sap.ui.ux3.NotificationBarStatus.Default);
        }

        this.setNotifierIcon();
    },

    // Global helper functions
    /*
     * Returns charts created from the given browsing context (Events|Alerts|Health Checks)
     */
    getChartsByContext : function(sContext, bPublished) {
        var aCharts = [];
        $.each(sap.ui.getCore().getModel("WorkspaceModel").getProperty("/artifacts"), function(index, oArtifact) {

            var sArtifactContext = "";
            $.each(oArtifact.measures, function(idx, oMeasure) {
                if (oMeasure.context) {
                    sArtifactContext = oMeasure.context;
                    return false;
                }
            });

            if (oArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART && sArtifactContext === sContext) {
                aCharts.push(oArtifact);
            }
        });
        return aCharts;
    },

    getArtifactsByStartSubset : function(sStartSubset, bSaved) {
        var aArtifacts = [];
        $.each(sap.ui.getCore().getModel("WorkspaceModel").getProperty("/artifacts"), function(index, oArtifact) {

            var sArtifactStartDataSet = "";
            $.each(oArtifact.measures, function(idx, oMeasure) {
                if (oMeasure.startDatasets && oMeasure.startDatasets[0].name && oMeasure.startDatasets[0].name === sStartSubset) {
                    sArtifactStartDataSet = sStartSubset;
                    return false;
                }
            });

            if (sArtifactStartDataSet === sStartSubset && (bSaved === undefined || (bSaved !== undefined && oArtifact.artifactId !== undefined && oArtifact.artifactId))) {
                aArtifacts.push(oArtifact);
            }
        });
        return aArtifacts;
    },

    /*
     * Returns artifacts created from the given path (@params path: "Path2")
     */
    getArtifactsByPath : function(sPathName) {
        var aArtifactsFound = [];
        $.each(sap.ui.getCore().getModel("WorkspaceModel").getProperty("/artifacts"), function(index, oArtifact) {
            $.each(oArtifact.measures, function(idx, oMeasure) {
                if (oMeasure.startDatasets && oMeasure.startDatasets[0].name && jQuery.sap.startsWith(oMeasure.startDatasets[0].name, sPathName)) {
                    aArtifactsFound.push(oArtifact);
                    return false;
                }
            });
        });
        return aArtifactsFound;
    },

    // Local functions
    _loadBrowsingContext : function() {

        var oQuery = {
            operation : sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_CONTEXT_LIST,
            requests : [],
            verbose : this.bDebug
        };

        var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery));

        promise.done(function(response, textStatus, XMLHttpRequest) {
            var oBrowsingContextList = [];
            for (var i = 0, maxLen = response.length; i < maxLen; i++) {
                // replace gthe description with translated text
                response[i].description = oTextBundle.getText("BU_TXT_" + response[i].name);
                oBrowsingContextList.push(response[i]);
            }
            sap.ui.getCore().getModel("BrowsingContextModel").setData(oBrowsingContextList);
        });
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });
    },

    _loadTimeRanges : function() {

        var oQuery = {
            operation : sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_TIMERANGE_LIST,
            requests : [],
            verbose : this.bDebug
        };

        var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery));

        promise.done(function(response, textStatus, XMLHttpRequest) {
            var aTimeRangeList = [];
            for (var i = 0, maxLen = response.length; i < maxLen; i++) {
                aTimeRangeList.push(response[i]);
            }
            sap.ui.getCore().getModel("TimeRangeModel").setData(aTimeRangeList);

            // convert to AssociatedArray
            sap.secmon.ui.browse.Constants.C_REL_TIME_LIST = {};
            aTimeRangeList.forEach(function(oTimeRange) {
                sap.secmon.ui.browse.Constants.C_REL_TIME_LIST[oTimeRange.key] = oTimeRange.ms;
            });
        });
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });
    },

    /**
     * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered (NOT before the first rendering! onInit() is used for that one!).
     * 
     * @memberOf viz5.Shell
     */
    // onBeforeRendering : function() {
    // var sIdNavigation = $.sap.getUriParameters().get('nid');
    // if (sIdNavigation) {
    // this._oNavigationHelper.onNavigated(sIdNavigation, function(data) {
    // var oParameter = data.SerializedData;
    // var oWorkspace = that._oWorkspace;
    // oWorkspace._setWorkspaceData(sIdNavigation,
    // JSON.parse(data.SerializedData), true);
    //
    // console.log('Navigation data: ' + JSON.stringify(oParameter));
    // }, function() {
    //
    // });
    // }
    // },
    onBeforeRendering : function() {

        // Fetch log data from warm storage if explicitly required with URL
        // parameter <URL>?sap-etd-force-warm=true
        var sForceWarm = $.sap.getUriParameters().get('sap-etd-force-warm');
        if (sForceWarm && sForceWarm.toLowerCase() === 'true') {
            this._bForceWarm = true;
        }
    },

    _propagateAbsTimesToPathes : function(aPath, to) {
        var from, ms, i, k;
        var searchTerms = [];
        // propagate time range to time subsets in pathes
        for (i = 0; i < aPath.length; i++) {
            for (k = 0; k < aPath[i].filters.length; k++) {
                searchTerms = aPath[i].filters[k].valueRange.searchTerms;
                if (aPath[i].filters[k].dataType === "ValueTimeStamp" && searchTerms.length === 1) { // relative time, like lastHour
                    ms = sap.secmon.ui.browse.Constants.C_REL_TIME_LIST[searchTerms[0]];
                    if (!ms) {
                        continue;
                    } // some other values than time is written into searchTerms, like Start Timestamp
                    from = new Date(Date.parse(to) - ms).toISOString().substr(0, 19) + "Z";
                    aPath[i].filters[k].valueRange.searchTerms = [ from, to ];
                    aPath[i].filters[k].valueRange.operator = 'BETWEEN';
                }
            }
        }
    },

    /**
     * called when the hosting EtdComponent is ready for use i.e. models like the applicationContext model are loaded
     */
    onComponentReady : function() {
        var that = this;
        var sAttackPathId = $.sap.getUriParameters().get("Ids");
        var sRoleNames = $.sap.getUriParameters().get('Roles');
        var sAccountNamePseudonyms = $.sap.getUriParameters().get('AccountNamePseudonyms');
        // Test ---
        var sIdNavigation = $.sap.getUriParameters().get('nid');
        if (sIdNavigation) {
            this._oNavigationHelper.onNavigated(sIdNavigation, function(data) {
                var oWorkspace = that._oWorkspace;
                var oSData = JSON.parse(data.SerializedData);

                switch (oSData.operation) {
                case "WORKSPACE":
                    oWorkspace._setWorkspaceData(sIdNavigation, oSData.data);
                    break;
                case "OUTLIER":
                    oWorkspace._setWorkspaceData("", oSData.data, true);
                    break;
                // handle further workspace relevant navigation operation
                // case "WORKSPACE":
                // break;
                }

                // oWorkspace.refresh(true);
                // console.log('Navigation data: ' +
                // JSON.stringify(oParameter));
            }, function() {
            });
        }

        var sId = $.sap.getUriParameters().get('Id');
        if (sId) {
            var oWorkspaceListModel = sap.ui.getCore().getModel("WorkspaceListModel");
            var oWorkspace = this._oWorkspace;

            oWorkspaceListModel.read("/Qube(X'" + sId + "')", {
                success : function(data) {
                    var sUserName = that.getView().getModel("applicationContext").getProperty("/userName");
                    var oWorkspaceData = JSON.parse(data.SerializedData);
                    oWorkspaceData.now = sap.secmon.ui.browse.utils.formatDateTime(new Date());
                    var sParentId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(data.ParentId);
                    if (sParentId !== sId) {
                        // Id is the pattern/Chart Id -> set it as
                        // highlighted
                        oWorkspaceListModel.read("/Qube(X'" + sParentId + "')", {
                            success : function(data) {
                                oWorkspaceData = JSON.parse(data.SerializedData);
                                oWorkspaceData.now = sap.secmon.ui.browse.utils.formatDateTime(new Date());
                                if (data.SerializedData) {
                                    var sFrom = $.sap.getUriParameters().get('from');
                                    var sTo = $.sap.getUriParameters().get('to');
                                    if (sFrom && sTo) {
                                        // modify the time range
                                        sFrom = sFrom.splice(4, 0, "-").splice(7, 0, "-").splice(10, 0, "T").splice(13, 0, ":").splice(16, 0, ":") + "Z";
                                        sTo = sTo.splice(4, 0, "-").splice(7, 0, "-").splice(10, 0, "T").splice(13, 0, ":").splice(16, 0, ":") + "Z";
                                        oWorkspaceData.period = {
                                            "operator" : "BETWEEN",
                                            "searchTerms" : [ sFrom, sTo ]
                                        };
                                        oWorkspaceData.now = sTo;
                                        that._propagateAbsTimesToPathes(oWorkspaceData.paths, sTo);
                                    }
                                }
                                oWorkspace._setWorkspaceData(sParentId, oWorkspaceData, true, sId);
                            },
                        });
                    } else {
                        oWorkspace._setWorkspaceData(sParentId, oWorkspaceData);
                    }
                },
                error : function() {
                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_QubeIdNotFound", sId), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("BU_TIT_Workspace"),
                            sap.ui.commons.MessageBox.Action.OK);
                    that._oWorkspace.initialize();
                }
            });
        } else {
            // Receive necessary search parameters
            var sFrom = $.sap.getUriParameters().get('from');
            var sTo = $.sap.getUriParameters().get('to');
            var sIdSearch = $.sap.getUriParameters().get('sSearchId');
            var sRoleIndependentAttributeKey = $.sap.getUriParameters().get('key');

            if (sFrom && sTo && sIdSearch) {
                // Modify the time range
                sFrom = sFrom.splice(4, 0, "-").splice(7, 0, "-").splice(10, 0, "T").splice(13, 0, ":").splice(16, 0, ":").splice(19, 0, ".") + "Z";
                sTo = sTo.splice(4, 0, "-").splice(7, 0, "-").splice(10, 0, "T").splice(13, 0, ":").splice(16, 0, ":").splice(19, 0, ".") + "Z";

                // Open Forensic Lab workspace based on url parameters
                that._oWorkspace.initialize(sFrom, sTo, {
                    sSearchId : sIdSearch,
                    sKey : sRoleIndependentAttributeKey
                }, true, null, null);

            } else if (sAttackPathId) {
                this.handleAttackPathIds(sAttackPathId).then(function() {
                    var oWSData = this.getTimerange(this.getView().getModel("AttackPathModel").getProperty("/" + sAttackPathId));
                    var aData = this.getView().getModel("AttackPathModel").getProperty("/" + sAttackPathId);
                    var aEventsData = that.dynamicSort(aData);
                    that.setSemanticAttributesModel();
                    that._oWorkspace.initialize(oWSData[0], oWSData[1], null, true, null, aEventsData.reverse());
                }.bind(this));

            } else if (sRoleNames && sAccountNamePseudonyms) {
                this.displayRolesFilters(sRoleNames, sAccountNamePseudonyms);
            } else {
                that._oWorkspace.initialize();
            }
        }

        // turn the cache off if explicitly required with URL
        // parameter
        var sCachingSetting = $.sap.getUriParameters().get('sap-etd-cachíng');
        if (sCachingSetting && sCachingSetting.toLowerCase() === 'false') {
            this._oCache.setActive(false);
        }
    },

    /**
     * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
     * 
     * @memberOf viz5.Shell
     */
    // onExit: function() {
    //
    // },
    _setRawData : function(oParams) {

        this._oRawData.setHeaderIDs(oParams);
        // this._oRawData.setSubset(startSubset);

        this._oWorkspace._sDisplayedArtifactType = sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.RAWDATA;
        this._oWorkspace.setRawData(this._oRawData);
    },

    _setOriginalData : function(oParams) {

        var that = this;

        that._oOriginalData.setHeaderIDs(oParams);
        // that._oOriginalData.setSubset(startSubset);

        that._oWorkspace._sDisplayedArtifactType = sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.ORIGINALDATA;
        that._oWorkspace.setOriginalData(this._oOriginalData);
    },

    handleShowRawData : function(oParams) {

        var _oThisControl = this;
        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        var sBindingPath = oParams.context.getPath();
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        var startSubset = "Path" + oWorkspaceData.paths[idxPath].luid + (aFilterItems[1] ? ".Subset" + oWorkspaceData.paths[idxPath].filters[idxSubset].luid : "");

        var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(startSubset, oWorkspaceData, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_KEY_4_HEADER_IDS, null, null);
        oQuery.verbose = this.bDebug;

        // load log event from warm storage
        oQuery.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;

        var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery));

        promise.done(function(response, textStatus, XMLHttpRequest) {
            if (response.value) {
                // aHeaderIDs.push(response.value);
                var oParams = {
                    workspaceContext : oWorkspaceData.paths[idxPath].context || oWorkspaceData.context,
                    queryId : response.value,
                    queryStartTime : response.queryStartTime,
                    queryEndTime : response.queryEndTime,
                    subset : startSubset,
                    collection : response.collection,
                };
                _oThisControl._setRawData(oParams, startSubset);
            }
        });
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });

        this._oSplitterLayout.removeContentArea(1);
        this._oSplitterLayout.addContentArea(this._oRawData);
        this._oRawData.setBindingPath(sBindingPath);
        this._oRawData.setBusy(true);
    },

    handleShowLogData : function(oParams) {

        var that = this;
        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        var sBindingPath = oParams.context.getPath();
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        var startSubset = "Path" + oWorkspaceData.paths[idxPath].luid + (aFilterItems[1] ? ".Subset" + oWorkspaceData.paths[idxPath].filters[idxSubset].luid : "");

        // Call logEntries.xsjs via HTTP POST, submit the query in JSON
        var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(startSubset, oWorkspaceData, "getRecordsCount");
        oQuery.verbose = this.bDebug;
        // load log event from warm storage
        oQuery.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;

        var oDataObj, oDataFuc;
        if (oParams.original === undefined || oParams.original === true) {
            oDataObj = this._oOriginalData;
            oQuery.original = true;
            oDataFuc = that._setOriginalData;
        } else {
            oDataObj = this._oRawData;
            oQuery.original = false;
            oDataFuc = this._setRawData;
        }

        var oPromise = this.loadLogEvent(oQuery);
        oPromise.done(function(data) {
            var oParams = {
                workspaceContext : oWorkspaceData.paths[idxPath].context || oWorkspaceData.context,
                queryId : data,
                subset : startSubset,
                collection : oQuery.original ? "OriginalLog" : "NormalizedLog"// response.collection,
            };

            function setDataObj(oParams) {
                oDataObj.setHeaderIDs(oParams);
                // oDataObj.setSubset(startSubset);

                that._oWorkspace._sDisplayedArtifactType = oQuery.original ? sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.ORIGINALDATA : sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.RAWDATA;
                if (oQuery.original) {
                    that._oWorkspace.setOriginalData(oDataObj);
                } else {
                    that._oWorkspace.setRawData(oDataObj);
                }
            }

            this._oSplitterLayout.removeContentArea(1);
            this._oSplitterLayout.addContentArea(oDataObj);
            oDataObj.setBindingPath(sBindingPath);

            setDataObj(oParams, startSubset);

        }.bind(this));
    },

    loadLogEvent : function(oQuery) {
        var oDeferred = $.Deferred();
        $.ajax({
            url : sap.secmon.ui.browse.Constants.C_ODATA_LOGS_PATH_XSJS,
            type : "POST",
            contentType : "application/json;charset=utf-8",
            data : JSON.stringify(oQuery),
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
            },
            success : function(data) {
                oDeferred.resolve(data);
            }.bind(this),
            error : function() {
                oDeferred.reject();
                jQuery.sap.require("sap.ui.commons.MessageBox");
                sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_Download_ZIP_Failed"), sap.ui.commons.MessageBox.Icon.ERROR, "Error");
            }.bind(this)

        });

        return oDeferred.promise();
    },

    handleShowAlertGraph : function(oParams) {

        var that = this;

        this._oAlertGraph = this._oAlertGraph || new sap.secmon.ui.commons.controls.AlertForceDirectedGraph({
            showLegend : true,
            // disable navigation to AlertFS until issues resolved
            enableAlertFSNavigation : false
        });

        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        var sBindingPath = oParams.context.getPath();
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        var startSubset = "Path" + oWorkspaceData.paths[idxPath].luid + (aFilterItems[1] ? ".Subset" + oWorkspaceData.paths[idxPath].filters[idxSubset].luid : "");

        var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(startSubset, oWorkspaceData, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_KEY_4_HEADER_IDS, null, null);
        oQuery.verbose = this.bDebug;

        var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery));

        promise.done(function(response, textStatus, XMLHttpRequest) {
            if (response.value) {
                // read alert data
                // that._oAlertGraph.setTimeFrom(new
                // Date(response.queryStartTime));
                // that._oAlertGraph.setTimeTo(new Date(response.queryEndTime));
                var oAlertGraphModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_ALERTS_PATH, {
                    json : true,
                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                });

                oAlertGraphModel.read("/AlertData", {
                    urlParameters : [ "$format=json" ],
                    filters : [ new sap.ui.model.Filter({
                        path : "Id",
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : response.value
                    }), new sap.ui.model.Filter({
                        path : "AlertCreationTimestamp",
                        operator : sap.ui.model.FilterOperator.BT,
                        value1 : response.queryStartTime,
                        value2 : response.queryEndTime
                    }) ],
                    success : function(oData, oResponse) {
                        that._oAlertGraph.setAlertData(JSON.parse(oResponse.body).d.results);

                        that._oAlertGraph.createGraphData();
                        that._oAlertGraph.setBusy(false);
                    },
                    error : function(oError) {
                        console.error(oError);
                        that._oAlertGraph.setBusy(false);
                    },
                });
            }
        });
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });

        this._oSplitterLayout.removeContentArea(1);
        this._oSplitterLayout.addContentArea(this._oAlertGraph);
        this._oAlertGraph.setBusy(true);
    },

    handleArtifactTypeChanged : function(sType) {

        switch (sType) {
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART:
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN:
            // this._oWorkspace.setChart(sType ===
            // C_ARTIFACT_TYPE.PATTERN ?
            // this._oPattern : this._oChart);

            var oChart = this._oWorkspace.getChart();
            // if (this._oSplitterLayout.getContentAreas()[1]
            // !== oChart) {
            this._oSplitterLayout.removeContentArea(1);
            this._oSplitterLayout.addContentArea(oChart);
            // }
            break;
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.BROWSINGCHART:
            this._oSplitterLayout.removeContentArea(1);
            this._oSplitterLayout.addContentArea(this._oBrowsingChart);
            break;
        }

    },

    handleExpandWorkspace : function() {
        this._oSplitterLayout.getContentAreas()[0].setLayoutData(new sap.ui.layout.SplitterLayoutData({
            size : $(document).width() * 0.8 + "px",
        }));
    },

    handleExpandChart : function() {
        this._oSplitterLayout.getContentAreas()[0].setLayoutData(new sap.ui.layout.SplitterLayoutData({
            size : $(document).width() * 0.2 + "px",
        }));
    },

    handleExitFullScreen : function() {
        this._oSplitterLayout.getContentAreas()[0].setLayoutData(new sap.ui.layout.SplitterLayoutData({
            size : $(document).width() * 0.5 + "px",
        }));
    },

    handleAttackPathIds : function(sId) {
        var oPromise = new Promise(function(fnResolve, fnReject) {
            jQuery.ajax({
                method : "GET",
                url : "/sap/secmon/services/malimon/saveAttackPath.xsjs?attackPathId=" + sId,
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
                },
                success : function(data, status, oResponse) {
                    this.getView().getModel("AttackPathModel").setProperty("/" + sId, data);
                    fnResolve(data);
                }.bind(this),
                error : function(data, status, oResponse) {
                    fnReject({
                        data : data,
                        status : status,
                        response : oResponse
                    });
                }
            });
        }.bind(this));

        return oPromise;
    },

    handleOpenCasefile : function(aParams) {

        var sPath = aParams.context.getPath();

        if (!this._oCaseFilesDialog) {
            this._oCaseFilesDialog = sap.ui.xmlfragment("CaseFilesDialog", "sap.secmon.ui.sherlock.view.CaseFilesDialog", this);
            this._oCaseFilesDialog.setModel(new sap.ui.model.json.JSONModel());
            this._oCaseFilesDialog.getContent()[0].oController._setRefreshMode("onLogEvents");
            this.getView().addDependent(this._oCaseFilesDialog);
            $.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), this._oCaseFilesDialog);
        }
        this._oCaseFilesDialog.getModel().setData({
            bindingPath : sPath
        });
        this._oCaseFilesDialog.open();
    },

    onCloseCaseFile : function() {
        this._oCaseFilesDialog.close();
    },

    onAddAndShow : function(oEvent, bReturn) {
        var C_CF_DML_PATH = "/sap/secmon/services/malimon/malimonDML.xsjs";
        var aCasefiles = this._oCaseFilesDialog.getContent()[0].getModel("CaseFileList").getProperty("/selectedItems");

        // fetch the events
        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        var sBindingPath = oEvent.getSource().getModel().getProperty("/bindingPath");
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        var startSubset = "Path" + oWorkspaceData.paths[idxPath].luid + (aFilterItems[1] ? ".Subset" + oWorkspaceData.paths[idxPath].filters[idxSubset].luid : "");
        var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(startSubset, oWorkspaceData, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_KEY_4_HEADER_IDS, null, null);
        oQuery.verbose = this.bDebug;
        oQuery.operation = "getData";

        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle.getText("BU_MSG_OpenCasefiles"));

        sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery)).done(function(response, textStatus, XMLHttpRequest) {
            var aDetails = [];
            response.forEach(function(oEvent) {
                aDetails.push({
                    comments : [],
                    description : oEvent.EventSemantic,
                    objectId : oEvent.Id,
                    objectTimestamp : oEvent.Timestamp,
                    objectType : "EVENT"
                });
            });

            aCasefiles.forEach(function(oItem) {

                var oCaseFileData = {
                    caseFileId : sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oItem.Id),
                    comments : oItem.Comments || [],
                    createdAt : oItem.CreatedAt,
                    createdBy : oItem.CreatedBy,
                    details : aDetails,
                    details2del : [],
                    name : oItem.Name,
                    namespace : oItem.Namespace,
                    operation : "update"
                };
                sap.secmon.ui.browse.utils.postJSon(C_CF_DML_PATH, JSON.stringify(oCaseFileData)).then(function(response) {
                    if (!bReturn) {
                        var href = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#CaseFile-show&/CaseFile/" + response.caseFileId;
                        window.open(href, '_blank');
                    }
                });
            }.bind(this));

        }).fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });

        // close the dialog for all cases
        this.onCloseCaseFile();
    },

    onAddAndReturn : function(oEvent) {
        this.onAddAndShow(oEvent, true);
    },

    shlUILogout : function(oEvent) {

        requestWithXCSRF({
            url : "/sap/secmon/services/logout.xscfunc",
            type : "POST",
            success : function(ret) {
                document.location.reload(true);
            }
        });

        function requestWithXCSRF(ioRequest) {
            $.ajax({
                type : "GET",
                url : "/sap/secmon/services/token.xsjs",
                headers : {
                    "X-CSRF-Token" : "Fetch"
                },
                success : function(data, textStatus, jqXHR) {
                    var securityToken = jqXHR.getResponseHeader("X-CSRF-Token");
                    if (ioRequest.headers) {
                        ioRequest.headers['X-CSRF-Token'] = securityToken;
                    } else {
                        ioRequest.headers = {};
                        ioRequest.headers['X-CSRF-Token'] = securityToken;
                    }
                    $.ajax(ioRequest);
                },
                error : function(XMLHttpRequest, textStatus, errorThrown) {
                }

            });
        }
    },

    onWorksetItemSelected : function(oEvent) {
        var sId = oEvent.getParameter("id");
        var oShell = oEvent.oSource;
        switch (sId) {
        case "idShell--itemWorkspace":
            oShell.setContent(this._oSplitterLayout);
            break;
        // case "idShell--itemGraphSpace":
        // var oNotificationBarGraph =
        // this.byId("shlMain").getNotificationBar();
        // var oNotifierGraph = oNotificationBarGraph.getMessageNotifier();
        // var aMessagesGraph = oNotifierGraph.getMessages();
        // $.each(aMessagesGraph, function(idx, oMessage) {
        // oMessage.destroy();
        // });
        // this.setNotifierIcon();
        //
        // if (!this._oGraphSpace) {
        // this._oGraphSpace = new sap.secmon.ui.browse.GraphSpace({});
        // }
        // oShell.setContent(this._oGraphSpace);
        // break;
        // case "idShell--itemPlayground":
        // oShell.setContent(this._oPlaygroundLayout);
        // break;
        default:
            break;
        }
    },

    getTimerange : function(aEvents) {
        var oTimerangeResult = [];
        var aTimeranges = aEvents.map(function(item) {
            return new Date(item.timestamp);
        });
        var sFrom = new Date(Math.min.apply(null, aTimeranges));
        var sTo = new Date(Math.max.apply(null, aTimeranges));

        oTimerangeResult.push(sFrom.toISOString(), sTo.toISOString());
        return oTimerangeResult;
    },

    dynamicSort : function(aTempo) {
        return aTempo.sort(function(a, b) {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
    },

    displayRolesFilters : function(sRoles, sAccountNamePseudonyms) {
        this.setSemanticAttributesModel();

        var aRoles = sRoles.split(",");
        var aSearchTerms = sAccountNamePseudonyms.split(",");

        var aSearchKeys = aRoles.map(function(sItem, index) {
            var oFilterValue = this.getView().getModel("attrModel").getProperty("/" + sItem);
            oFilterValue.context = "Log";
            oFilterValue.count = "";
            oFilterValue.isFieldRef = 0;
            oFilterValue.luid = 1;
            oFilterValue.valueRange = {
                operator : "IN",
                searchTermRefKeys : [],
                searchTerms : aSearchTerms
            };
            oFilterValue.workspaceContext = "Path" + (index + 1) + ".Subset1";
            return oFilterValue;

        }.bind(this));
        this._oWorkspace.initialize(null, null, aSearchKeys);
    },

    setSemanticAttributesModel : function() {
        var oAttrModel = new sap.ui.model.json.JSONModel();
        oAttrModel.loadData("/sap/secmon/ui/m/semanticEventFS/attributes.json", null, false);
        this.getView().setModel(oAttrModel, "attrModel");
        this._oWorkspace.setModel(oAttrModel, "attrModel");
    }

});
