/* globals d3, oTextBundle, Promise */
$.sap.require("sap.secmon.ui.malimon.Constants");
$.sap.require("sap.secmon.ui.malimon.EventAttributes");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.m.commons.EtdController");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.ui.thirdparty.d3");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.malimon.EventsVisualization", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.malimon.EventsVisualization
     */
    _oEventSeriesPromise: undefined,
    _oEventAttributesRPopover: undefined,
    ATTACK_PATH_MODEL: "attackPathModel",
    EVENT_SERIES_MODEL: "EventSeriesODataModel",
    iMaxShownEvents: sap.secmon.ui.malimon.Constants.C_MAX_SHOWN_EVENTS,

    onInit: function () {

        // create a new empty CaseFile
        var oCaseFileModel = new sap.ui.model.json.JSONModel({
            caseFileId: "",
            name: oTextBundle.getText("MM_NewCFName"),
            namespace: "",
            createdBy: "",
            createdAt: "",
            changedBy: "",
            changedAt: "",
            comments: [],
            details: [],
            details2del: [],
            selected: []
        });

        var oAttackPathsModel = new sap.ui.model.json.JSONModel({
            idAttackPath: "",
            nameAttackPath: "",
            description: "",
            caseFileId: ""
        });

        this.createAndFillNamespacesModel();

        var oCaseFileControl = this.getView().byId("etdCaseFile");

        oCaseFileControl.setModel(oCaseFileModel);
        oCaseFileControl.setModel(oAttackPathsModel, this.ATTACK_PATH_MODEL);
        oCaseFileControl.setModel(this.getView().getModel("NamespacesModel"), "NamespacesModel");
        oCaseFileControl.setComponent(this.getComponent());

        var oEventSeriesModel = new sap.ui.model.json.JSONModel();
        oEventSeriesModel.setSizeLimit(999999);
        var oEventSeries = this.getView().byId("etdEventSeries");
        oEventSeries.setModel(oEventSeriesModel);
        oEventSeries.setColor(sap.ui.getCore().getModel("ConfigModel").getProperty("/config/displaySettings/Events"));
        oEventSeries.setShowUTC(this.getComponent().getModel("applicationContext").getProperty("/UTC"));

        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setProperty("/title", oTextBundle.getText("MM_TIT_CaseFile"));
        this.getView().setModel(oModel);

        var oTable = this.getAttackPathsTable();
        this.enableButtonsIfAtLeastOneRowIsSelected(oTable, ["idDeleteAttackPath"]);
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

        var oEventSeriesODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/eventSeries.xsodata", {
            json: true,
            defaultCountMode: sap.ui.model.odata.CountMode.Inline
        });
        this.getView().setModel(oEventSeriesODataModel, this.EVENT_SERIES_MODEL);
    },

    onAfterRendering : function() {
        var oJQContainer = $("[id$=etdCaseFileContainer]");
        var iContainerHeight = oJQContainer.parent().height();
        var iCaseFileTableHeight = $(oJQContainer.children()[0]).height();
        var iCaseFileHeaderHeight = $(oJQContainer.parent().parent().children()[0]).height();
        var oEventSeries = this.getView().byId("etdEventSeries");
        oEventSeries.setHeight(iContainerHeight - iCaseFileHeaderHeight - iCaseFileTableHeight);
        oEventSeries.setWidth(oJQContainer.width());
    },

    onNavBack : function(oEvent) {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onDisplayPath : function(oEvent) {
        var aEvents = oEvent.getParameter("aEvents");
        this.oRouter.navTo("attackPath");
        var eventBus = sap.ui.getCore().getEventBus();
        eventBus.publish("AttackPathChannel", "onNavigateEvent", aEvents);
    },

    onDeleteAttackPath : function(oEvent) {
        var aSelectedPaths = this.getView().byId("attackPathTable").getSelectedItems();
        var aIds = aSelectedPaths.map(function(oPath) {
            var oPathtData = oPath.getBindingContext("tableModel").getObject();
            return oPathtData.Id;
        });
        sap.m.MessageBox.confirm(oTextBundle.getText("KB_ConfirmDelete"), {
            title : this.getCommonText("Delete_TIT"),
            icon : sap.m.MessageBox.Icon.WARNING,
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.DELETE) {
                    this.sendDeletionRequest(aIds).then(function(oData) {
                        this.getAttackPath(this.getView().byId("etdCaseFile").getModel().getProperty("/caseFileId"));
                    }.bind(this));
                }
            }.bind(this)
        });
    },

    sendDeletionRequest : function(aIds) {
        var oPreparedData = {
            attackPathIds : aIds,
            caseFileId : this.getView().byId("etdCaseFile").getModel().getProperty("/caseFileId")
        };
        var oPromise = new Promise(function(fnResolve, fnReject) {
            jQuery.ajax({
                method : "POST",
                url : "/sap/secmon/services/malimon/saveAttackPath.xsjs",
                data : JSON.stringify(oPreparedData),
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
                },
                success : function(data, status, oResponse) {
                    fnResolve(data);
                },
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

    getAttackPathsTable : function() {
        this.attackPathsTable = this.attackPathsTable || this.getView().byId("attackPathTable");
        return this.attackPathsTable;
    },

    handleRouteMatched : function(oEvent) {
        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }

        var oModel = this.getView().getModel();
        var oRoute = {};
        var sCaseFileId;

        switch (oEvent.getParameters().name) {
        case "caseFileDetails":
            sCaseFileId = args.caseFileId;
            if (!sCaseFileId) {
                return;
            }
            oRoute.name = oEvent.getParameters().name;
            oRoute.parameters = {
                caseFileId : sCaseFileId
            };
            oModel.setProperty("/route", oRoute);
            this._displayCaseFile(sCaseFileId);
            break;
        case "eventSeries":
            var aaQueryParams = args["?query"];
            var aAlertNumbers;
            var sFrom, sTo;
            var oFilter;
            for ( var sQueryParam in aaQueryParams) {
                if (aaQueryParams.hasOwnProperty(sQueryParam)) {
                    if (sQueryParam === "alerts") {
                        aAlertNumbers = aaQueryParams[sQueryParam].split(",");
                    } else if (sQueryParam === "from") {
                        sFrom = aaQueryParams[sQueryParam];
                    } else if (sQueryParam === "to") {
                        sTo = aaQueryParams[sQueryParam];
                    } else if (sQueryParam === "caseFileId") {
                        sCaseFileId = aaQueryParams[sQueryParam];
                    } else if (sQueryParam) {
                        oFilter = {
                            fieldName : sQueryParam,
                            value : aaQueryParams[sQueryParam]
                        };
                    }
                }
            }
            oRoute.name = oEvent.getParameters().name;
            oRoute.parameters = {
                from : sFrom,
                to : sTo,
                filter : oFilter,
                alerts : aAlertNumbers,
                caseFileId : sCaseFileId
            };
            oModel.setProperty("/route", oRoute);
            if (!sFrom && !sTo && !oFilter && aAlertNumbers.length) {
                // this._fetchEvents4Alert(aAlertNumbers);
                this._displayCaseFile(sCaseFileId, this._fetchEvents4Alert.bind(this, aAlertNumbers));
            } else {
                if (!sFrom || !sTo) {
                    var dtNow = new Date();
                    sTo = sap.secmon.ui.browse.utils.formatDateTime(dtNow);
                    sFrom = sap.secmon.ui.browse.utils.formatDateTime(new Date(dtNow.getTime() - 300000));// last 5 minutes
                }
                // this._fetchEvents4Log(sFrom, sTo, oFilter, aAlertNumbers);
                this.iMaxShownEvents *= 2;
                this._displayCaseFile(sCaseFileId, this._fetchEvents4Alert.bind(this, aAlertNumbers, sFrom, sTo));
            }
            break;
        default:
            return;
        }
    },

    caseFileVisibleFormatter : function(aVal) {
        return aVal && aVal.length > 0;
    },

    onCirclePress : function(oEvent) {
        var that = this;
        var oEventSeries = this.getView().byId("etdEventSeries");
        var oCaseFileModel = this.getView().byId("etdCaseFile").getModel();
        if (!this._oEventAttributesRPopover) {
            var oEventAttributesModel = new sap.ui.model.json.JSONModel();
            var oEventAttributes = new sap.secmon.ui.malimon.EventAttributes({
                data : {
                    path : "/data",
                    template : new sap.ui.base.ManagedObject()
                },
                add2CaseFile : [ function(oEvent) {
                    var oParameter = oEvent.getParameters();
                    var oDetailEntry = {};
                    oDetailEntry.objectType = oParameter.Type;
                    oDetailEntry.objectId = oParameter.Id;
                    oDetailEntry.objectTimestamp = new Date(oParameter.Timestamp);// TODO: ???
                    oDetailEntry.description = oParameter.EventSemantic;
                    oDetailEntry.comments = [];
                    var aDetails = oCaseFileModel.getProperty("/details");
                    if (aDetails && aDetails.length) {
                        aDetails.push(oDetailEntry);
                    } else {
                        aDetails = [ oDetailEntry ];
                    }
                    oCaseFileModel.setProperty("/details", aDetails);
                    this._oEventAttributesRPopover.close();

                    var oEventSeriesModel = this.getView().byId("etdEventSeries").getModel();
                    var aEvents = oEventSeriesModel.getProperty("/data");
                    aEvents.forEach(function(oEvent) {
                        if (oEvent.Id === oDetailEntry.objectId) {
                            oEvent.InCaseFile = true;
                            if (oDetailEntry.caseFileId) {
                                oEvent.CaseFileId = oDetailEntry.caseFileId;
                            } else {
                                oEvent.CaseFileId = "";
                            }
                        }
                    });
                    // var aEvents = oEventSeriesModel.setProperty("/data", aEvents);
                    oEventSeries._update();

                }, this ],
                filterAttribute : [ function(oEvent) {
                    this._oEventAttributesRPopover.close();
                    var oModel = this.getView().getModel();
                    var oRoute = oModel.getProperty("/route");
                    // TODO: check what comes back in case of UTC/Local
                    var sFrom = sap.secmon.ui.browse.utils.formatDateTime(oEventSeries.getExtent()[0]);
                    var sTo = sap.secmon.ui.browse.utils.formatDateTime(oEventSeries.getExtent()[1]);
                    var sCaseFileId = oCaseFileModel.getProperty("/caseFileId");
                    var sFilter = (oEvent.getParameter("name") + "=" + oEvent.getParameter("value"));
                    sap.secmon.ui.m.commons.NavigationService.openEventSeries(sFrom, sTo, oRoute.parameters.alerts, sCaseFileId, sFilter);
                }, this ]
            }).setModel(oEventAttributesModel);

            this._oEventAttributesRPopover = new sap.m.ResponsivePopover({
                title : oTextBundle.getText("MM_TIT_EventAttribs"),
                // placement : sap.m.PlacementType.Auto,
                content : [ oEventAttributes ],
                modal : false,
                resizable : true,
                afterClose: function(oEvent){
                    that._oEventAttributesRPopover = undefined;
				},
            }).setModel(oEventAttributesModel);
            this._oEventAttributesRPopover.addStyleClass('sapUiSizeCompact').addStyleClass('sapUiContentPadding').addStyleClass('sapEtdPopoverTransparent');
            this.getView().addDependent(this._oEventAttributesRPopover);
        }

        if (this._oEventAttributesRPopover.isOpen()) {
            this._oEventAttributesRPopover.close();
        } else {
            var oCircle = oEvent.getParameters().circle;
            if (!oCircle.Type) {
                oCircle.Type =
                        oCircle.Number ? sap.secmon.ui.malimon.Constants.C_TYPE.ALERT : (oCircle.EventLogType ? sap.secmon.ui.malimon.Constants.C_TYPE.EVENT
                                : sap.secmon.ui.malimon.Constants.C_TYPE.HEALTHCHECK);
            }
            this._fetchAttributes(oCircle);
            var oTarget = oEvent.getParameters().target;
            var nTargetCX = oTarget.getAttribute("cx");
            if ((nTargetCX - 100) > (document.documentElement.clientWidth / 2)) {
                this._oEventAttributesRPopover.setPlacement(sap.m.PlacementType.Left);
            } else {
                this._oEventAttributesRPopover.setPlacement(sap.m.PlacementType.Right);
            }

            // Avoid adding the same circle to the case file by disabling the Add2CaseFile button
            this._oEventAttributesRPopover.getContent()[0].setShowAdd2CaseFile(!oCircle.InCaseFile);

            this._oEventAttributesRPopover.openBy(oTarget);
        }
    },

    onZoomOut : function(oEvent) {
        // TODO: enable zooming in case file mode
        var oModel = this.getView().getModel();
        var oRoute = oModel.getProperty("/route");
        var oSelectedPeriod = oEvent.getParameters();
        var sNewFrom = sap.secmon.ui.browse.utils.formatDateTime(oSelectedPeriod.newFrom);
        var sNewTo = sap.secmon.ui.browse.utils.formatDateTime(oSelectedPeriod.newTo);
        var sCaseFileId = this.getView().byId("etdCaseFile").getModel().getProperty("/caseFileId");
        var sFilter;
        if (oRoute.parameters.filter && oRoute.parameters.filter.fieldName && oRoute.parameters.filter.value) {
            sFilter = oRoute.parameters.filter.fieldName + "=" + oRoute.parameters.filter.value;
        }
        sap.secmon.ui.m.commons.NavigationService.openEventSeries(sNewFrom, sNewTo, oRoute.parameters.alerts, sCaseFileId, sFilter);
    },

    onDisplayAttributes : function(oEvent) {

    },

    onDetailsDeleted : function(oEvent) {
        var oCaseFile = this.getView().byId("etdCaseFile");
        var aDetails = oCaseFile.getModel().getProperty("/details");

        var oEventSeries = this.getView().byId("etdEventSeries");
        var aEventPoints = oEventSeries.getModel().getProperty("/data");

        (aEventPoints || []).forEach(function(oEventPoint) {
            oEventPoint.CaseFileId = "";
            oEventPoint.InCaseFile = false;
            aDetails.forEach(function(oDetail) {
                if (oDetail.objectId === oEventPoint.Id) {
                    oEventPoint.InCaseFile = true;
                    if (oDetail.caseFileId) {
                        oEventPoint.CaseFileId = oDetail.caseFileId;
                    } else {
                        oEventPoint.CaseFileId = "";
                    }
                }
            });
        });
        oEventSeries.getModel().setProperty("/data", aEventPoints);
        oEventSeries._update();
    },

    onTableUpdateFinished : function(oEvent) {

    },

    _setESTitle : function() {
        var oEventSeries = this.getView().byId("etdEventSeries");
        var sFrom = sap.secmon.ui.commons.Formatter.dateFormatterEx(this.getComponent().getModel('applicationContext').getData().UTC, oEventSeries.getExtent()[0]);
        var sTo = sap.secmon.ui.commons.Formatter.dateFormatterEx(this.getComponent().getModel('applicationContext').getData().UTC, oEventSeries.getExtent()[1]);
        var sESTitle = oTextBundle.getText("MM_TIT_EVENTSERIES", [ sFrom, sTo ]);
        this.getView().getModel().setProperty("/eventSeriesTitle", sESTitle);
    },

    _displayCaseFile : function(sCaseFileId, onSuccesFn) {

        var oCaseFileModel = this.getView().byId("etdCaseFile").getModel();
        if (sCaseFileId && sCaseFileId !== oCaseFileModel.getProperty("/caseFileId")) {
            var that = this;
            var oEventSeries = this.getView().byId("etdEventSeries");
            var sMessageText = "";

            $.ajax({
                url : sap.secmon.ui.malimon.Constants.C_CASEFILE_GET_PATH + "?caseFileId=" + sCaseFileId,
                type : "GET",
                contentType : "application/json;charset=utf-8",
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
                },
            }).done(function(data, textStatus, XMLHttpRequest) {
                data.selected = [];
                oCaseFileModel.setData(data);
                if (onSuccesFn && typeof onSuccesFn === "function") {
                    onSuccesFn();
                } else {
                    var aCaseFileEvents = that._convertCFDetails2Events(data.details);
                    oEventSeries.getModel().setProperty("/data", aCaseFileEvents);
                    oEventSeries.setExtent(d3.extent(aCaseFileEvents, function(d) {
                        return d.Timestamp;
                    }));
                    that._setESTitle();
                    oEventSeries._update();
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                sMessageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sMessageText);
            });
        } else {
            if (onSuccesFn) {
                onSuccesFn();
            }
        }
        if (sCaseFileId) {
            this.getAttackPath(sCaseFileId);
        }
    },

    _convertCFDetail2Event : function(oDetail) {
        var oEvent = {};
        oEvent.Timestamp = new Date(oDetail.objectTimestamp);
        oEvent.Id = oDetail.objectId;
        oEvent.InCaseFile = true;
        oEvent.Deleted = oDetail.deleted;
        if (oDetail.caseFileId) {
            oEvent.CaseFileId = oDetail.caseFileId;
        } else {
            oEvent.CaseFileId = "";
        }
        if (oDetail.objectType === sap.secmon.ui.malimon.Constants.C_TYPE.ALERT) {
            oEvent.Number = oDetail.description.split(sap.secmon.ui.malimon.Constants.C_TYPE.ALERT)[1].trim();
            oEvent.EventName = sap.secmon.ui.malimon.Constants.C_TYPE.ALERT;
        } else {
            oEvent.EventName = oDetail.description;
            oEvent.EventLogType = "Case File";
        }
        return oEvent;
    },

    _convertCFDetails2Events : function(aDetails) {
        var that = this;
        var aEvents = [], oEvent = {};
        (aDetails || []).forEach(function(oDetail) {
            oEvent = that._convertCFDetail2Event(oDetail);
            if (oEvent.EventName === sap.secmon.ui.malimon.Constants.C_TYPE.ALERT) {
                aEvents.unshift(oEvent);
            } else {
                aEvents.push(oEvent);
            }
        });
        return aEvents;
    },

    _convertAlerts2Events : function(aAlertNumbers) {
        var oAlertODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/ui/browse/services2/alerts.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        var aAlerts = [];
        (aAlertNumbers || []).forEach(function(sAlertNumber) {
            oAlertODataModel.read("/AlertMalimonHeader", {
                async : false,
                filters : [ new sap.ui.model.Filter({
                    path : "Number",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : sAlertNumber
                }) ],
                success : function(data) {
                    if (data.results.length) {
                        var oAlert = data.results[0];
                        oAlert.AlertId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(data.results[0].AlertId);
                        oAlert.EventName = "Alert";
                        aAlerts.push(oAlert);
                    }
                },
                error : function() {
                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, oTextBundle.getText("MM_MSG_AlertNumNotFound", sAlertNumber));
                }
            });
        });
        return aAlerts;
    },

    _abortEventSeries : function() {
        if (this._oEventSeriesPromise !== undefined) {
            this._oEventSeriesPromise.abort();
        }
    },

    _fetchEvents4Alert : function(aAlertNumbers, sNewFrom, sNewTo) {

        var oEventSeries = this.getView().byId("etdEventSeries");
        var oCaseFile = this.getView().byId("etdCaseFile");
        var that = this;

        var aAlertsAsEvents = this._convertAlerts2Events(aAlertNumbers);
        var aAllEvents = [].concat(aAlertsAsEvents);

        var sFrom, sTo;

        var oQuery4Alerts = {
            operation : "getMapIdForAlertTrigger",
            alertNumber : ""
        };
             
        oEventSeries.setBusy(true);

        // Step1: get the MapId given the Alert Number
        var aAlertsWithDeletedTriggeringEvents = [], aAlertNumbersLength = aAlertNumbers.length, countLoops = 0;
        aAlertNumbers.forEach(function(sNumber) {
            oQuery4Alerts.alertNumber = sNumber;

            sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery4Alerts)).done(
                    function(response, textStatus, XMLHttpRequest) {
                        // Step2: With the MapId fetch the Raw data
                        var oResult = JSON.parse(JSON.stringify(response));
                        if (oResult.queryStartTime && oResult.queryEndTime) {
                            var sMapId;

                            if (sNewFrom && sNewTo) {
                                sFrom = sNewFrom;
                                sTo = sNewTo;
                            } else {
                                if (sFrom) {
                                    if (sFrom > oResult.queryStartTime) {
                                        sFrom = oResult.queryStartTime;
                                    }
                                } else {
                                    sFrom = oResult.queryStartTime;
                                }

                                if (sTo) {
                                    if (sTo < oResult.queryEndTime) {
                                        sTo = oResult.queryEndTime;
                                    }
                                } else {
                                    sTo = oResult.queryEndTime;
                                }
                            }

                            // Extent padding is now done in EventSeries-d3
                            oEventSeries.setExtent([ new Date(Date.parse(sFrom)), new Date(Date.parse(sTo)) ]);
                            that._setESTitle();

                            var sEntity;
                            // support of Extended Tables with collection LogHeaderDT
                            var sCollection = oResult.collection || "LogHeader";
                            sMapId = oResult.data[0].key;

                            var oODataModel;
                            var sId, sSelectFieldString;
                            switch (oResult.data[0].context) {
                            case "HealthCheck":
                                oODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/ui/browse/services2/healthCheckEntries.xsodata", {
                                    json : true,
                                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                                });
                                sId = "Id";
                                sEntity = "/LogHeader";
                                sSelectFieldString = sap.secmon.ui.malimon.Constants.C_SELECTED_FIELDS.HEALTHCHECK;
                                break;
                            case "ConfigurationCheck":
                                oODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/ui/browse/services2/configCheckEntries.xsodata", {
                                    json : true,
                                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                                });
                                sId = "Id";
                                sEntity = "/LogHeader";
                                sSelectFieldString = sap.secmon.ui.malimon.Constants.C_SELECTED_FIELDS.CONFIGCHECK;
                                break;
                            case "Alert":
                                oODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/ui/browse/services2/alerts.xsodata", {
                                    json : true,
                                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                                });
                                sId = "Id";
                                sEntity = "/AlertMalimon";
                                sSelectFieldString = sap.secmon.ui.malimon.Constants.C_SELECTED_FIELDS.ALERT;
                                break;
                            default:
                                oODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/ui/browse/services2/logEntries.xsodata", {
                                    json : true,
                                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                                });
                                sId = "MapId";
                                sEntity = "/" + sCollection;
                                sSelectFieldString = sap.secmon.ui.malimon.Constants.C_SELECTED_FIELDS.LOG;
                            }

                            // fetch the event data
                            // TODO: collect all the promises in an array to cancel them at once
                            oODataModel.read(sEntity, {
                                urlParameters : [ "$top=" + that.iMaxShownEvents, "$orderby=Timestamp desc", "$format=json", sSelectFieldString ],
                                filters : [ new sap.ui.model.Filter({
                                    path : "Timestamp",
                                    operator : sap.ui.model.FilterOperator.BT,
                                    value1 : sFrom, // '2016-08-04T08:30:08',
                                    value2 : sTo, // '2016-08-04T09:30:08',
                                    and : true
                                }), new sap.ui.model.Filter({
                                    path : sId,
                                    operator : sap.ui.model.FilterOperator.EQ,
                                    value1 : sMapId
                                }) ],
                                success : function(oData, oResponse) {
                                    var aEvents = JSON.parse(oResponse.body).d.results;
                                    var aDetails = oCaseFile.getModel().getProperty("/details");
                                    // convert JSON Date to JS Date
                                    aEvents.forEach(function(oEvent) {
                                        var milisec = +oEvent.Timestamp.substring(6, 19);
                                        oEvent.Timestamp = new Date(milisec);
                                        if (oEvent.Id) {
                                            oEvent.Id = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oEvent.Id);
                                        }
                                        if (oEvent.HeaderId) {
                                            oEvent.Id = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oEvent.HeaderId);
                                            oEvent.Type = sap.secmon.ui.malimon.Constants.C_TYPE.HEALTHCHECK;
                                            delete oEvent.HeaderId;
                                        }
                                        if (oEvent.TechnicalId) {
                                            oEvent.Id = oEvent.TechnicalId;
                                            oEvent.EventName = oEvent.CheckName;
                                            oEvent.Type = sap.secmon.ui.malimon.Constants.C_TYPE.CONFIGCHECK;
                                            delete oEvent.TechnicalId;
                                        }
                                        if (oEvent.AlertId) {
                                            oEvent.Id = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oEvent.HeaderId);
                                            oEvent.Type = sap.secmon.ui.malimon.Constants.C_TYPE.ALERT;
                                            delete oEvent.AlertId;
                                            milisec = +oEvent.MaxTimestamp.substring(6, 19);
                                            oEvent.MaxTimestamp = new Date(milisec);

                                            milisec = +oEvent.MinTimestamp.substring(6, 19);
                                            oEvent.MinTimestamp = new Date(milisec);
                                        }
                                        if (!oEvent.Type) {
                                            oEvent.Type = sap.secmon.ui.malimon.Constants.C_TYPE.EVENT;
                                        }
                                        (aDetails || []).forEach(function(oDetail) {
                                            if (oEvent.Id === oDetail.objectId) {
                                                oEvent.InCaseFile = true;
                                                if (oDetail.caseFileId) {
                                                    oEvent.CaseFileId = oDetail.caseFileId;
                                                } else {
                                                    oEvent.CaseFileId = "";
                                                }
                                            }
                                        });
                                    });
                                    aAllEvents = aAllEvents.concat(aEvents);
                                    // check whether the case file entry is already in the events list
                                    (aDetails || []).forEach(function(oDetail) {
                                        var bFound = false;
                                        aAllEvents.forEach(function(oEvent) {
                                            if (oEvent.Id === oDetail.objectId) {
                                                bFound = true;
                                            }
                                        });
                                        if (!bFound) {
                                            oDetail.notInList = true;
                                        }
                                    });

                                    // add the case file to the events list if it is within the time range
                                    var oConvertedEvent = {};
                                    (aDetails || []).forEach(function(oDetail) {
                                        if (oDetail.hasOwnProperty("notInList") && oDetail.notInList && new Date(oDetail.objectTimestamp) >= new Date(Date.parse(sFrom)) &&
                                                new Date(oDetail.objectTimestamp) <= new Date(Date.parse(sTo))) {
                                            oConvertedEvent = that._convertCFDetail2Event(oDetail);
                                            if (oConvertedEvent.EventName === sap.secmon.ui.malimon.Constants.C_TYPE.ALERT) {
                                                aAllEvents.unshift(oConvertedEvent);// Alerts should be on the first line
                                            } else {
                                                aAllEvents.push(oConvertedEvent);
                                            }
                                        }
                                    });
                                    oEventSeries.getModel().setProperty("/data", aAllEvents);
                                    oEventSeries._update();
                                    oEventSeries.setBusy(false);
                                },
                                error : function(oError) {
                                    that._oEventSeriesPromise = undefined;
                                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, oError.message);
                                    oEventSeries.setBusy(false);
                                }
                            });
                        } else {
                            aAlertsWithDeletedTriggeringEvents.push(sNumber);
                        }
                        countLoops++;
                        if (countLoops === aAlertNumbersLength) {
                            if (aAlertsWithDeletedTriggeringEvents.length > 0) {
                                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Information, "Triggering Events for the alert(s) " +
                                        aAlertsWithDeletedTriggeringEvents.join(', ') + " were already deleted.", null, false);
                            }
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {
                var sMessageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sMessageText);
            });
        });
    },

    /*_fetchEvents4Log : function(sFrom, sTo, oSelection, aAlertNumbers) {

        var oEventSeries = this.getView().byId("etdEventSeries");
        var oCaseFile = this.getView().byId("etdCaseFile");
        var that = this;

        var aAlertsAsEvents = this._convertAlerts2Events(aAlertNumbers);

        var dStartTimestamp = Date.parse(sFrom);
        var dEndTimestamp = Date.parse(sTo);
        (aAlertsAsEvents || []).forEach(function(oAlertsAsEvent) {
            if (oAlertsAsEvent.Timestamp > dEndTimestamp) {
                dEndTimestamp = oAlertsAsEvent.Timestamp;
            }
            if (oAlertsAsEvent.Timestamp < dStartTimestamp) {
                dStartTimestamp = oAlertsAsEvent.Timestamp;
            }
        });
        oEventSeries.setExtent([ new Date(dStartTimestamp), new Date(dEndTimestamp) ]);
        this._setESTitle();

        // TODO: ?_abortEventSeries
        this._abortEventSeries();

        // build the filters role-independent
        // for UserPseudonym:
        // Acting, Initiating, Targeted,Targeting
        // for NetworkHostname:
        // Actor, Initiator, Intermediary, Reporter, Target
        // for SystemId:
        // Actor, Initiator, Intermediary, Reporter, Target

        var aFilters = [];
        if (oSelection) {
            // get the roles from config
            // sFilters = "(";

            var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
            var aaRoles = oConfigModel.getProperty("/config/displaySettings/Roles");

            var aFieldNameParts = oSelection.fieldName.split(/(?=[A-Z])/);
            var sFieldNameRoleIndep = aFieldNameParts[0] + aFieldNameParts[1];

            if (aaRoles.hasOwnProperty(sFieldNameRoleIndep)) {
                var aaFieldNameRoles = aaRoles[sFieldNameRoleIndep];
                for ( var sRole in aaFieldNameRoles) {
                    aFilters.push(new sap.ui.model.Filter({
                        path : sFieldNameRoleIndep + sRole,
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : oSelection.value
                    }));
                }
            } else {
                aFilters.push(new sap.ui.model.Filter({
                    path : oSelection.fieldName,
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : oSelection.value
                }));
            }
        }

        oEventSeries.setBusy(true);

        // Fetch events
        var oEventSeriesODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/eventSeries.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        var oODataFilters = [ new sap.ui.model.Filter({
            path : "Timestamp",
            operator : sap.ui.model.FilterOperator.BT,
            value1 : sFrom, // '2016-08-04T08:30:08',
            value2 : sTo, // '2016-08-04T09:30:08',
            and : true
        }) ];
        if (aFilters.length) {
            oODataFilters.push(new sap.ui.model.Filter({
                filters : aFilters,
                and : false
            }));
        }
        this._oEventSeriesPromise =
                oEventSeriesODataModel.read("/Events", {
                    urlParameters : [ "$top=" + sap.secmon.ui.malimon.Constants.C_MAX_SHOWN_EVENTS, "$format=json", sap.secmon.ui.malimon.Constants.C_SELECTED_FIELDS.LOG ],
                    filters : oODataFilters,
                    success : function(oData, oResponse) {
                        that._oEventSeriesPromise = undefined;
                        var aEvents = JSON.parse(oResponse.body).d.results;
                        var aDetails = oCaseFile.getModel().getProperty("/details");
                        // convert JSON Date to JS Date
                        aEvents.forEach(function(oEvent) {
                            var milisec = +oEvent.Timestamp.substring(6, 19);
                            oEvent.Timestamp = new Date(milisec);
                            if (oEvent.Id) {
                                oEvent.Id = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oEvent.Id);
                            }
                            oEvent.Type = sap.secmon.ui.malimon.Constants.C_TYPE.EVENT;

                            (aDetails || []).forEach(function(oDetail) {
                                if (oEvent.Id === oDetail.objectId) {
                                    oEvent.InCaseFile = true;
                                    if (oDetail.caseFileId) {
                                        oEvent.CaseFileId = oDetail.caseFileId;
                                    } else {
                                        oEvent.CaseFileId = "";
                                    }
                                }
                            });
                        });
                        // check whether the case file entry is already in the events list
                        (aDetails || []).forEach(function(oDetail) {
                            var bFound = false;
                            aEvents.forEach(function(oEvent) {
                                if (oEvent.Id === oDetail.objectId) {
                                    bFound = true;
                                }
                            });
                            if (!bFound) {
                                oDetail.notInList = true;
                            }
                        });
                        var aAllEvents = aAlertsAsEvents.concat(aEvents);

                        // add the case file to the events list if it is within the time range
                        var oConvertedEvent = {};
                        (aDetails || []).forEach(function(oDetail) {
                            if (oDetail.hasOwnProperty("notInList") && oDetail.notInList && new Date(oDetail.objectTimestamp) >= new Date(dStartTimestamp) &&
                                    new Date(oDetail.objectTimestamp) <= new Date(dEndTimestamp)) {
                                oConvertedEvent = that._convertCFDetail2Event(oDetail);
                                if (oConvertedEvent.EventName === sap.secmon.ui.malimon.Constants.C_TYPE.ALERT) {
                                    aAllEvents.unshift(oConvertedEvent);// Alerts should be on the first line
                                } else {
                                    aAllEvents.push(oConvertedEvent);
                                }
                            }
                        });
                        oEventSeries.getModel().setProperty("/data", aAllEvents);
                        oEventSeries._update();
                        oEventSeries.setBusy(false);
                    },
                    error : function(oError) {
                        oEventSeries.setBusy(false);
                        that._oEventSeriesPromise = undefined;
                        if (oError.message !== "Request aborted") {
                            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, oError.message);
                        }
                    }
                });
    },*/

    /*
     * Fetch all attributes from a single alert/event in async mode
     * 
     * @param: sId id in binary format
     * 
     */
    _fetchAttributes: function (oCircle) {

        var sContext = "Log";
        var oFieldNamesData = sap.ui.getCore().getModel("FieldNamesModel").getData();
        var oEventSeriesODataModel = this.getView().getModel(this.EVENT_SERIES_MODEL);

        var fnToGoodName = function (sName) {

            if (oFieldNamesData[sContext]) {
                if (sName === sap.secmon.ui.malimon.Constants.C_TYPE.EVENT && oFieldNamesData[sContext].EventCode){ 
                    return oFieldNamesData[sContext].EventCode.displayName; 
                }
                if (oFieldNamesData[sContext][sName] && oFieldNamesData[sContext][sName].displayName){
                    return oFieldNamesData[sContext][sName].displayName;
                } 
            }
            return;
        };

        var oEventAttributesModel = this._oEventAttributesRPopover.getModel();
        var oComponent = this.getComponent();
        if (oCircle.Type === sap.secmon.ui.malimon.Constants.C_TYPE.ALERT) {
            var aAttrs = [];
            for (var prop in oCircle) {
                if (prop === "__metadata" || !oCircle[prop]){
                    continue;
                }

                if ((prop === sap.secmon.ui.malimon.Constants.C_TYPE.TIMESTAMP || prop === sap.secmon.ui.malimon.Constants.C_TYPE.MINTIMESTAMP || 
                    prop === sap.secmon.ui.malimon.Constants.C_TYPE.MAXTIMESTAMP) && typeof oCircle[prop] !== 'string') {

                    oCircle[prop] = sap.secmon.ui.commons.Formatter.dateFormatterEx(oComponent.getModel("applicationContext").getProperty("/UTC"), oCircle[prop]);
                    // TODO workaround for russian format
                    oCircle[prop] = oCircle[prop].replace(/(\d{2})\.(\d{2})\.(\d{2})/, '$2/$1/$3');
                }
                aAttrs.push({
                    "name": prop,
                    "displayName": fnToGoodName(prop),
                    "value": oCircle[prop],
                    "isHyperlink": false
                });
            }
            oEventAttributesModel.setProperty("/data", aAttrs);
            return;
        }

        // fetch all attributes for a single event
        var sCollection;
        var iMetaDataIndex = 0;
        if (oCircle.Type === sap.secmon.ui.malimon.Constants.C_TYPE.EVENT) {
            sCollection = "/Events(X";

        } else if (oCircle.Type === sap.secmon.ui.malimon.Constants.C_TYPE.CONFIGCHECK) {
            sCollection = "/ConfigChecks(";
            iMetaDataIndex = 2;
        } else {
            sCollection = "/HealthChecks(X";
            iMetaDataIndex = 1;
        }

        oEventSeriesODataModel.read(sCollection + "'" + oCircle.Id + "')", {
            urlParameters: ["$format=json"],
            success: function (oData, oResponse) {
                var oEvent = JSON.parse(oResponse.body).d;
                var oMetadata = oEventSeriesODataModel.getServiceMetadata();
                var aFieldMetadata = oMetadata.dataServices.schema[0].entityType[iMetaDataIndex].property;
                // convert properties to array
                var aAttrs = [];
                var isHyperlink = true;
                aFieldMetadata.forEach(function (oFieldMetadata) {
                    isHyperlink = true;

                    if (!oEvent[oFieldMetadata.name]){
                        return;
                    } 

                    if (oFieldMetadata.type === sap.secmon.ui.malimon.Constants.C_TYPE.BINARY) {
                        oEvent[oFieldMetadata.name] = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oEvent[oFieldMetadata.name]);
                    } else if (oFieldMetadata.type === sap.secmon.ui.malimon.Constants.C_TYPE.DATETIME) {
                        var milisec = +oEvent[oFieldMetadata.name].substring(6, 19);
                        oEvent[oFieldMetadata.name] = sap.secmon.ui.commons.Formatter.dateFormatterEx(oComponent.getModel("applicationContext").getProperty("/UTC"), new Date(milisec));
                        // TODO workaround for russian format
                        oEvent[oFieldMetadata.name] = oEvent[oFieldMetadata.name].replace(/(\d{2})\.(\d{2})\.(\d{2})/, '$2/$1/$3');
                        isHyperlink = false;
                    }

                    var sDisplayName = fnToGoodName(oFieldMetadata.name);
                    if (!sDisplayName){
                        return;
                    } 

                    aAttrs.push({
                        "name": oFieldMetadata.name,
                        "displayName": sDisplayName,
                        "value": oEvent[oFieldMetadata.name],
                        "isHyperlink": isHyperlink
                    });
                });
                oEventAttributesModel.setProperty("/data", aAttrs);
            },
            error: function (oError) {
                // event is older than retention period
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, oTextBundle.getText("MM_MSG_EventRetention"));
            }
        });
        
    },

    getAttackPath : function(sCaseFileId) {
        var oModel = this.getView().byId("etdCaseFile").getModel(this.ATTACK_PATH_MODEL);
        var oTable = this.getView().byId("attackPathTable");
        var oTemplate = this.getView().byId("attackPathTable").getBindingInfo("items").template;

        var oPromise = new Promise(function(fnResolve, fnReject) {
            jQuery.ajax({
                method : "GET",
                url : sap.secmon.ui.malimon.Constants.C_SAVE_CASE_FILE.PATH + sap.secmon.ui.malimon.Constants.C_SAVE_CASE_FILE.ATTRIBUTE_ID + sCaseFileId,
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
                },
                success : function(data, status, oResponse) {
                    oModel.setData(data);
                    oTable.setModel(oModel, "tableModel");
                    oTable.bindItems("tableModel>/", oTemplate);
                    fnResolve(data);

                },
                error : function(data, status, oResponse) {
                    fnReject({
                        data : data,
                        status : status,
                        response : oResponse
                    });
                }.bind(this)
            });
        }.bind(this));

        return oPromise;
    },

    onSelect : function(oEvent) {
        var oModel = this.getView().byId("etdCaseFile").getModel().getData();
        var item = oEvent.getSource().getBindingContext("tableModel").getProperty("Id");
        this.oRouter.navTo("attackPath");
        var eventBus = sap.ui.getCore().getEventBus();
        eventBus.publish("AttackPathDetailsChannel", "onNavigateEvent", { events : oModel.details, idAttackPath : item});
    }
});