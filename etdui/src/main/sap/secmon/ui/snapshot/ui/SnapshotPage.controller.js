/* globals oTextBundle, oCommonFunctions, Promise */
jQuery.sap.includeStyleSheet("/sap/secmon/ui/snapshot/ui/css/SnapshotStyle.css");
sap.ui.define([
    'jquery.sap.global',
    "sap/ui/core/UIComponent",
    "sap/secmon/ui/m/commons/EtdController",
    "sap/secmon/ui/commons/GlobalMessageUtil",
    "sap/secmon/ui/browse/Constants",
    "sap/secmon/ui/browse/utils",
    "sap/ui/model/odata/CountMode",
    "sap/ui/model/odata/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/commons/MessageBox",
    "sap/m/MessageToast",
    "sap/m/ResponsivePopover",
    "sap/m/List",
    "sap/m/FeedListItem",
    "sap/m/FeedInput"
], function (jQuery,
    UIComponent,
    Controller,
    oMessageUtil,
    Constants,
    Utils,
    CountMode,
    ODataModel,
    JSONModel,
    Filter,
    FilterOperator,
    MessageBox,
    MessageToast,
    ResponsivePopover,
    List,
    FeedListItem,
    FeedInput) {

        "use strict";

        var SnapshotPageListController =
            Controller.extend("sap.secmon.ui.snapshot.ui.SnapshotPage", {

                oInvestigationCreatorController: undefined,
                oInvestigationAddendumController: undefined,
                SNAPSHOT_MODEL: "SnapshotModel",
                QUBE_MODEL: "qubeModel",
                SNAPSHOT_PAGE_MODEL: "SnapshotPageModel",
                SNAPSHOTS_PATH : "/sap/secmon/services/Snapshot.xsjs",

                onInit: function () {

                    var oSnapshotReadModel = new ODataModel("/sap/secmon/services/Snapshot.xsodata", {
                        json: true,
                        defaultCountMode: CountMode.Inline
                    });
                    this.getView().setModel(oSnapshotReadModel, this.SNAPSHOT_MODEL);

                    var oWorkspaceListModel = new ODataModel(Constants.C_ODATA_QUBE_LIST_PATH, {
                        json: true,
                        defaultCountMode: CountMode.Inline
                    });
                    this.getView().setModel(oWorkspaceListModel, this.QUBE_MODEL);

                    this.getView().setModel(new JSONModel(), this.SNAPSHOT_PAGE_MODEL);
                    // default model for data binding
                    var oModel = new JSONModel();
                    var oView = this.getView();
                    oView.setModel(oModel);

                    this.oRouter = UIComponent.getRouterFor(this);

                    this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

                    // Time Ranges List
                    var oTimeRangeModel = new JSONModel();
                    sap.ui.getCore().setModel(oTimeRangeModel, "TimeRangeModel");
                    this._loadTimeRanges();
                },

                handleRouteMatched: function (oEvent) {
                    if (oEvent.getParameters().name !== "snapshotDetail") {
                        return;
                    }

                    // Investigation controller
                    this.oInvestigationCreatorController = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationCreatorDialog");
                    this.oInvestigationAddendumController = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationAddendumDialog");

                    var sSnapshotId = oEvent.getParameter("arguments").snapshotId;

                    this._getSnapshots(sSnapshotId)
                        .then(function (oData) {

                            var aSnapshots = this._convertDataToHexFormat(oData);
                            var iSnapshotIndex = oData.findIndex(function (oItem) { return oItem.Type === "Snapshot"; });
                            var oSnapshotPage = aSnapshots.splice(iSnapshotIndex, 1)[0];
                            var aChartIds = aSnapshots.map(function (oItem) { return oItem.ChartId; });

                            oSnapshotPage.snapshots = aSnapshots;
                            this.getView().getModel(this.SNAPSHOT_PAGE_MODEL).setData(oSnapshotPage);
                            return this._getSnapshotsDetails(aChartIds);
                        }.bind(this))
                        .then(function (oData) {
                            var oSnapshotPage = this._mapCharts2Snapshots(oData);
                            this.getView().getModel().setData(oSnapshotPage);
                        }.bind(this))
                        .catch(function (error) {
                            oMessageUtil.addMessage(sap.ui.core.MessageType.Error, error);
                        });

                    // set chart id model
                    var oAddChartModel = new JSONModel();
                    this.getView().setModel(oAddChartModel, "AddChartModel");
                    // TODO: add Type eq Pattern
                    this.getView().getModel("AddChartModel").loadData("/sap/secmon/ui/browse/services2/Qube.xsodata/Qube/?$select=Id,Name,SerializedData&$filter=Type eq 'Chart'", null, false);

                    // convert Ids
                    oAddChartModel.getProperty("/d/results").forEach(function (oItem) {
                        oItem.Id = Utils.CommonFunctions.base64ToHex(oItem.Id);
                    });
                },

                onAddPress : function(evt) {
                    if (!this._oSettingDialog) {
                        this._oSettingDialog = sap.ui.xmlfragment("sap.secmon.ui.snapshot.ui.SnapshotAddChart", this);
                        this.getView().addDependent(this._oSettingDialog);
                        if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
                            this._oSettingDialog.addStyleClass("sapUiSizeCompact");
                        }
                    }
                    this._oSettingDialog.open();
                },
                onOKPress : function(evt) {
                    var _convert2AbsoluteTimeRange = function(oRelativeTimeRange, dCreatedAt) {
                        var sOperator = oRelativeTimeRange.operartor;

                        if (sOperator === "BETWEEN") {
                            return oRelativeTimeRange;
                        }

                        var period = {};
                        period.operator = "BETWEEN";
                        period.searchTerms = [];

                        var dEndTimestamp = dCreatedAt || new Date(Date.now());
                        period.searchTerms.push(Utils.formatDateTime(dEndTimestamp));

                        var aTimeList = sap.ui.getCore().getModel("TimeRangeModel").getData();
                        var iMillSec = 0;
                        aTimeList.some(function(oTime) {
                            if (oTime.key === oRelativeTimeRange.searchTerms[0]) {
                                iMillSec = oTime.ms;
                                return true;
                            }
                        });

                        period.searchTerms.splice(0, 0, Utils.formatDateTime(new Date(dEndTimestamp.getTime() - iMillSec)));

                        return period;
                    };
                    // UTC data formatter
                    var oUTC = sap.ui.getCore().getModel('applicationContext').getData().UTC;
                    var oUTCDataFormatter = sap.secmon.ui.commons.Formatter.dateFormatterEx(oUTC, new Date());

                    // var oSelectedItem = sap.ui.getCore().byId("DropdownBoxChartID");
                    var dialog = evt.getSource().getParent().getParent();
                    var oSelectedItem = dialog.getContent()[0].getContent()[1].getSelectedItem();

                    var chartID = oSelectedItem.getKey();
                    var sName = oSelectedItem.getText();
                    var sType = "Chart";
                    var sSerializedData = oSelectedItem.getCustomData()[0].getValue();
                    var oModel = this.getView().getModel();
                    var oSnapshotPageData = oModel.getData();
                    // assign the time range of the chart
                    var oPeriod = JSON.parse(sSerializedData).period;
                    // var sNow = that.getModel().getProperty("/now");
                    if (oPeriod.operator === "=") {
                        oPeriod = _convert2AbsoluteTimeRange(oPeriod, new Date());
                    }
                    var oSnapshot = {
                        Id : "",
                        ParentId : oSnapshotPageData.ParentId,
                        // ParentId : JSON.parse(sSerializedData).parentId,
                        ChartId : chartID,
                        Name : sName,
                        Type : sType,
                        ChartFrom : new Date(oPeriod.searchTerms[0]),
                        ChartTo : new Date(oPeriod.searchTerms[1]),
                    };

                    var commentArea = dialog.getContent()[0].getContent()[3];
                    if (commentArea.getValue()) {
                        oSnapshot.comments = [ {
                            user : sap.ui.getCore().getModel("applicationContext").getProperty("/userName"),
                            timestamp : oUTCDataFormatter,
                            text : commentArea.getValue()
                        } ];
                    }
                    oSnapshot.SerializedData = JSON.stringify(oSnapshot);

                    oSnapshotPageData.snapshots.push(oSnapshot);
                    dialog.close();
                    try {
                        oModel.refresh();
                    } catch (e) {
                    }
                },

                onCancelPress : function() {
                    this._oSettingDialog.close();
                },

                onGlobalCommentPress : function(oEvent) {
                    this._handleShowComments(oEvent);
                },

                _handleShowComments : function(oEvent) {
                    var feedList = new List({
                        showSeparators : "Inner",
                        items : {
                            path : "/comments",
                            template : new FeedListItem({
                                icon : "sap-icon://employee",
                                text : "{text}",
                                timestamp : {
                                    path : "timestamp",
                                    formatter : function(dtVal) {
                                        return sap.secmon.ui.commons.Formatter.dateFormatterEx(sap.ui.getCore().getModel('applicationContext').getData().UTC, new Date(dtVal));
                                    }
                                },
                                iconDensityAware : false,
                                iconPress : function(oEvent) {
                                },
                                senderPress : function(oEvent) {
                                },
                                sender : "{user}"
                            })
                        }
                    });
                    feedList.setModel(this.getView().getModel());
                    if (!this._oCommentsRPopover) {
                        this._oCommentsRPopover = new ResponsivePopover({
                            placement : sap.m.PlacementType.Bottom,
                            title : oTextBundle.getText("SS_TIT_Comments"),
                            modal : false,
                            resizable : true,
                            content : [ new FeedInput({
                                icon : "sap-icon://employee",
                                post : [ function(oEvent) {
                                    var oData = this.getView().getModel().getData();
                                    oData.comments = oData.comments || [];
                                    oData.comments.unshift({
                                        user : sap.ui.getCore().getModel("applicationContext").getProperty("/userName"),
                                        timestamp : new Date(),
                                        text : oEvent.getParameter("value")
                                    });
                                    var oSerializedData = JSON.parse(oData.SerializedData);
                                    oSerializedData.comments = oData.comments;
                                    oData.SerializedData = JSON.stringify(oSerializedData);
                                    this.getView().getModel().refresh();
                                }, this ]
                            }), feedList ],
                        });
                        this._oCommentsRPopover.addStyleClass('sapUiSizeCompact');
                        // this._oCommentsRPopover.setModel(this.getModel());
                    }
                    if (this._oCommentsRPopover.isOpen()) {
                        this._oCommentsRPopover.close();
                    } else {
                        this._oCommentsRPopover.openBy(oEvent.getSource());
                    }
                },

                onStartInvestigation : function(oEvent) {
                    var sSnapshotId = this.getView().getModel().getData().Id;
                    if (sSnapshotId) {
                        this.oInvestigationCreatorController.openDialogEx([ {
                            ObjectType : 'SNAPSHOT',
                            ObjectId : sSnapshotId
                        } ], this.getView(), function() {
                            // doing nothing just a round trip
                        }, function() {
                            return Utils.XCSRFToken ? Utils.XCSRFToken : Utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                        });
                    } else {
                        alert(oTextBundle.getText("SS_MSG_NOTFOUND"));
                    }
                },

                onAdd2Investigation : function(oEvent) {
                    var sSnapshotId = this.getView().getModel().getData().Id;
                    if (sSnapshotId) {
                        this.oInvestigationAddendumController.openDialogEx([ {
                            ObjectType : 'SNAPSHOT',
                            ObjectId : sSnapshotId
                        } ], this.getView(), function() {
                            // doing nothing just a round trip
                        }, function() {
                            return Utils.XCSRFToken ? Utils.XCSRFToken : Utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                        });
                    } else {
                        alert(oTextBundle.getText("SS_MSG_NOTFOUND"));
                    }
                },

                onSendEmail : function() {
                    sap.m.URLHelper.triggerEmail("", "", oTextBundle.getText("SS_MSG_EMAIL", window.location.href));
                },

                onHelpPress : function(oEvent) {
                    window.open("/sap/secmon/help/40fdd5b5cc2e41b08448f577f447ae84.html");
                },

                onNavBack : function() {
                    this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
                        window.history.go(-1);
                    });
                },

                onSave : function() {

                    var oSnapshotModel = new ODataModel("/sap/secmon/services/Snapshot.xsodata", {
                        json : true,
                        defaultCountMode : CountMode.Inline
                    });

                    MessageToast.show(oTextBundle.getText("SPF_MSGToast"), {
                        width : "20em"
                    });

                    var oSnapshotPage = this.getView().getModel().getData();

                    oSnapshotPage.snapshots.forEach(function(oSnapshot, i) {

                        oSnapshot.__metadata = undefined;
                        oSnapshot.chartData = undefined;
                        for ( var prop in oSnapshot) {
                            if (!oSnapshot[prop]) {
                                oSnapshot[prop] = undefined;
                            }
                        }

                        // make a copy for oData submit, convert Ids back to based64
                        var oSnapshotOData = $.extend(true, {}, oSnapshot);
                        oSnapshotOData.ParentId = Utils.CommonFunctions.hexToBase64(oSnapshotOData.ParentId);
                        oSnapshotOData.ChartId = Utils.CommonFunctions.hexToBase64(oSnapshotOData.ChartId);

                        if (!oSnapshot.Id || (oSnapshot.Id && oSnapshot.Id === "")) { // NEW => CREATE IT
                            oSnapshot.Id = Utils.generateGUID();
                            oSnapshotOData.Id = oSnapshot.Id;
                            oSnapshotOData.Id = Utils.CommonFunctions.hexToBase64(oSnapshotOData.Id);
                            delete oSnapshotOData.comments;
                            oSnapshotModel.create("/Snapshot", oSnapshotOData, {
                                success : function(oResult1, oResponse1) {
                                },
                                error : function(oError) {
                                    MessageBox.show(oTextBundle.getText("SS_MSG_PageIdNotFound", oSnapshot.Id), MessageBox.Icon.ERROR, oTextBundle
                                            .getText("SS_TIT_Snapshot"), MessageBox.Action.OK);
                                }
                            });
                        } else { // UPDATE EXISTING ONE
                            oSnapshotOData.Id = Utils.CommonFunctions.hexToBase64(oSnapshotOData.Id);
                            // merge the snapshots in SerializedData of SnapshotPage
                            oSnapshotModel.update("/Snapshot(X'" + oSnapshot.Id + "')", {
                                SerializedData : oSnapshotOData.SerializedData
                            }, {
                                merge : true,
                                success : function(oResult1, oResponse1) {
                                },
                                error : function(oError) {
                                    MessageBox.show(oTextBundle.getText("SS_MSG_PageIdNotFound", oSnapshot.Id), MessageBox.Icon.ERROR, oTextBundle
                                            .getText("SS_TIT_Snapshot"), MessageBox.Action.OK);
                                }
                            });
                        }
                    });

                    oSnapshotModel.__metadata = undefined;
                    oSnapshotModel.chartData = undefined;
                    if (typeof oSnapshotPage.ChangedAt !== "object") {
                        oSnapshotPage.ChangedAt = new Date(+oSnapshotPage.ChangedAt.match(/\d+/)[0]);
                    }
                    oSnapshotModel.update("/Snapshot(X'" + oSnapshotPage.Id + "')", {
                        ChangedAt : oSnapshotPage.ChangedAt,
                        ChangedBy : oSnapshotPage.ChangedBy,
                        SerializedData : oSnapshotPage.SerializedData
                    }, {
                        merge : true,
                        success : function(oResult, oResponse) {
                        },
                        error : function(oError) {
                            MessageBox.show(oTextBundle.getText("SS_MSG_PageIdNotFound", oSnapshotPage.Id), MessageBox.Icon.ERROR,
                                    oTextBundle.getText("SS_TIT_Snapshot"), MessageBox.Action.OK);
                        }
                    });

                },

                _loadTimeRanges : function() {

                    var oQuery = {
                        operation : Constants.C_SERVICE_OPERATION.GET_TIMERANGE_LIST,
                        requests : []
                    };

                    var promise = Utils.postJSon(Constants.C_SERVICE_PATH, JSON.stringify(oQuery));

                    promise.done(function(response, textStatus, XMLHttpRequest) {
                        var oTimeRangeList = [];
                        for (var i = 0, maxLen = response.length; i < maxLen; i++) {
                            oTimeRangeList.push(response[i]);
                        }
                        sap.ui.getCore().getModel("TimeRangeModel").setData(oTimeRangeList);
                    });
                    promise.fail(function(jqXHR, textStatus, errorThrown) {
                        var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                        Utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                    });
                },

                _mapCharts2Snapshots: function (aCharts) {
                    var oData = this.getView().getModel(this.SNAPSHOT_PAGE_MODEL).getData();
                    oData.snapshots.forEach(function (oItem) {
                        var oChart = aCharts.find(function (oChart) {
                            return oItem.ChartId === oChart.Id;
                        });
                        if (oChart) { oItem.chartData = oChart; }
                    });
                    return oData;
                },

                _getSnapshotsDetails: function (aChartIds) {
                    
                    var oRequest = {
                        operation : "getChartsInformation",
                        chartsIds : this._getUniqueRecords(aChartIds)
                    };

                    return new Promise(function (fnResolve, fnReject) {
                        $.ajax({
                            type : "POST",
                            url : this.SNAPSHOTS_PATH,
                            data : JSON.stringify(oRequest),
                            contentType : "application/json; charset=UTF-8",
                            beforeSend : function(xhr) {
                                xhr.setRequestHeader("X-CSRF-Token", Utils.XCSRFToken);
                            },
                            success : function(data) {
                                fnResolve(data);
                            },
                            error : function(oError) {
                                Utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
                            }.bind(this)
                        });
                    }.bind(this));
                },

                _getSnapshots: function (sSnapshotId) {
                    var oSnapshotReadModel = this.getView().getModel(this.SNAPSHOT_MODEL);

                    return new Promise(function (fnResolve, fnReject) {
                        oSnapshotReadModel.read("/Snapshot", {
                            async: false,
                            urlParameters: ["$format=json", "$orderby=Sequence asc"],
                            filters: [new Filter({
                                path: "ParentId",
                                operator: FilterOperator.EQ,
                                value1: sSnapshotId
                            })],
                            success: function (oData, oResponse) {
                                var aResults = JSON.parse(oResponse.body).d.results;
                                fnResolve(aResults);
                            },
                            error: function () {
                                oMessageUtil.addMessage(sap.ui.core.MessageType.Error, oTextBundle.getText("SS_MSG_PageIdNotFound", sSnapshotId));
                            }
                        });
                    });
                },

                _getUniqueRecords : function(aItems){
                    return aItems.filter(function(oItem,iIndex,aItems){
                        return aItems.indexOf(oItem) === iIndex;
                    });
                },

                _convertDataToHexFormat: function (oData) {
                    return oData.map(function (oItem) {
                        oItem.Id = oCommonFunctions.base64ToHex(oItem.Id);
                        oItem.ParentId = oCommonFunctions.base64ToHex(oItem.ParentId);
                        oItem.comments = JSON.parse(oItem.SerializedData).comments;
                        if (oItem.Type !== "Snapshot") { oItem.ChartId = oCommonFunctions.base64ToHex(oItem.ChartId); }
                        return oItem;
                    });
                }
            });
    return SnapshotPageListController;

});