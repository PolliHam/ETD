/* globals oTextBundle */
$.sap.require("sap.secmon.ui.browse.Chart");
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.ui.commons.MessageBox");
$.sap.require("sap.secmon.ui.monitoring.MonitoringPanel");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.commons.NavigationHelper");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.m.MessageToast");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.secmon.ui.m.commons.EtdController");

// Constants
var C_KB_SYSTEM_KEY = '547DF3D6DD747331E10000000A4CF109';
var C_KB_HEALTH_CHECK = '547DF3D7DD747331E10000000A4CF109';
var C_KB_HEALTH_CHECK_RESULT = '55B7BB94849E895AE24B192DA65BB37B';
var C_KB_HEALTH_CHECK_TIMESTAMP = 'MAX(547E59BAFC1C7331E10000000A4CF109)[0]';

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.monitoring.Shell", {
    oContentBeforeFullscreen : undefined,
    oPanelBeforeFullscreen : undefined,
    bShowIndicatorBar : undefined,
    /**
     * array containing all displayed panels which contain the charts
     */
    aPanels : [],
    _oMonitoringPersonalizationModel : undefined,
    _oMonitoringPersonalizationData : undefined,
    _bPersonalizationExists : undefined,
    _oQubeListModel : undefined,
    _iIndicatorBarHeight : undefined,
    _fnCountFresher : undefined,
    _fnAlertCountFresher : undefined,
    _oInvestigationModel : undefined,
    _oAlertData : undefined,
    _bNavigationFromAlert : false,
    _oCommonFunctions : new sap.secmon.ui.commons.CommonFunctions(),
    _oNavigationHelper : new sap.secmon.ui.commons.NavigationHelper(3600),
    _aFilters : [],
    _oPeriod : undefined,
    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf monitoring.Shell
     */
    onInit : function() {
        var that = this;

        var oShell = this.byId("shlMain");
        oShell.addStyleClass("sapUiSizeCompact");

        this.byId("textSelectedConfiguration").bindProperty("text", {
            parts : [ {
                path : "/selectedConfigurationName",
                model : "MonitoringModel"
            }, {
                path : "/isSaveNeeded",
                model : "MonitoringModel"
            } ],
            formatter : function(sName, bIsSaveNeeded) {
                if (bIsSaveNeeded) {
                    return "*" + sName;
                } else {
                    return sName;
                }
            }
        });

        this.byId("btnFavorite").bindProperty("icon", {
            path : "/IsFavorite",
            model : "MonitoringModel",
            formatter : function(bIsFavorite) {
                if (bIsFavorite === 'X') {
                    return "sap-icon://favorite";
                } else {
                    return "sap-icon://unfavorite";
                }
            }
        });

        // Qube odata model
        this._oQubeListModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/monitoringPage.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        sap.ui.getCore().setModel(this._oQubeListModel, "QubeListModel");

        // init investigation model
        this._oInvestigationModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/ui/m/invest/investigation.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        sap.ui.getCore().setModel(this._oInvestigationModel, "InvestigationModel");

        // Get URL parameters
        var sName = $.sap.getUriParameters().get("name");
        if (sName) {
            sName = decodeURIComponent(sName);
        }
        var sNamespace = $.sap.getUriParameters().get("namespace");
        if (sNamespace) {
            sNamespace = decodeURIComponent(sNamespace);
        }
        var sPageId = $.sap.getUriParameters().get("Id");
        var sAlertId = $.sap.getUriParameters().get("alertId");
        var sNavigationId = $.sap.getUriParameters().get("nid");

        // init personalization model and read it
        this._oMonitoringPersonalizationModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/MonitoringConfiguration.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        if (sAlertId) {
            this._bNavigationFromAlert = true;
            this.bShowIndicatorBar = false;
            this.readConfiguration(null, null, null, sAlertId);
        } else if (sName && sNamespace) {
            this.bShowIndicatorBar = false;
            this.readConfiguration(null, sName, sNamespace);
        } else if (sNavigationId) {
            this._bNavigationFromAlert = true;
            this.bShowIndicatorBar = false;

            that._oNavigationHelper.onNavigated(sNavigationId, function(oData) {
                var oSerializedData = JSON.parse(oData.SerializedData);
                that._aFilters = oSerializedData.filters;
                that._oPeriod = oSerializedData.period;
                that.readConfiguration(oSerializedData.id);
            }, function(oError) {
                console.error(oError);
            });
        } else if (sPageId) {
            this.bShowIndicatorBar = true;
            this.readConfiguration(sPageId);
        } else {
            this.bShowIndicatorBar = true;
            this.readConfiguration();
        }
        sap.ui.getCore().setModel(this._oMonitoringPersonalizationModel, "PersonalizationModel");

        var notificationBar = oShell.getNotificationBar();
        notificationBar.getMessageNotifier().setTitle(oTextBundle.getText("BU_TIT_NotificationBar"));

        // Time Ranges List
        var oTimeRangeModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oTimeRangeModel, "TimeRangeModel");
        this.loadTimeRanges();

    },

    /**
     * Loads available time ranges
     */
    loadTimeRanges : function() {

        var oQuery = {
            operation : sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_TIMERANGE_LIST,
            requests : []
        };

        var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery));

        promise.done(function(response, textStatus, XMLHttpRequest) {
            var oTimeRangeList = [];
            for (var i = 0, maxLen = response.length; i < maxLen; i++) {
                oTimeRangeList.push(response[i]);
            }
            sap.ui.getCore().getModel("TimeRangeModel").setData(oTimeRangeList);
        });
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.ui.getCore().byId('idShell--shlMain').getParent().getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });
    },

    /**
     * when a user clicks on a message, remove it from the notifier
     */
    onMessageSelected : function(oEvent) {

        var notifier = oEvent.getParameters().notifier;
        var message = oEvent.getParameters().message;
        notifier.removeMessage(message);
        message.destroy();
    },

    reportNotification : function(level, text, header) {
        switch (level) {
            case sap.ui.core.MessageType.Success:
                sap.m.MessageToast.show(text);
                break;
            case sap.ui.core.MessageType.Error:
                var title = header ? header : oTextBundle.getText("MonErrorTitle");
                sap.ui.commons.MessageBox.show(text, sap.ui.commons.MessageBox.Icon.ERROR, title);
                break;        
            default:
                break;
        }
    },

    shlUILogout : function(oEvent) {

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
                        ioRequest.headers["X-CSRF-Token"] = securityToken;
                    } else {
                        ioRequest.headers = {};
                        ioRequest.headers["X-CSRF-Token"] = securityToken;
                    }
                    $.ajax(ioRequest);
                },
                error : function(XMLHttpRequest, textStatus, errorThrown) {
                }
            });

        }

        requestWithXCSRF({
            url : "/sap/secmon/services/logout.xscfunc",
            type : "POST",
            success : function(ret) {
                document.location.reload(true);
            }
        });

    },
    /**
     * Creates the main content area where the charts resides
     */
    createContentArea : function() {
        var that = this;
        var iRowCounter = 0;
        var aRows = [];

        if (sap.ui.getCore().byId("contentLayout")) {
            sap.ui.getCore().byId("contentLayout").destroy();
        }

        var oLayoutContent = new sap.ui.commons.layout.MatrixLayout({
            id : "contentLayout",
            layoutFixed : true,
            columns : 1,
            width : "100%",
            height : "100%"
        });
        oLayoutContent.addStyleClass("contentArea");

        // Create charts
        for (var i = 0; i < this._oMonitoringPersonalizationData.NumberOfColumns * this._oMonitoringPersonalizationData.NumberOfRows; i++) {
            var oRowContent;

            // If number of columns is reached, create a new row
            // in layout
            if (i % this._oMonitoringPersonalizationData.NumberOfColumns === 0) {

                // Create rows and cells in matrix layout
                var oLayoutRow = new sap.ui.commons.layout.MatrixLayout({
                    id : "contentRowMatrixLayout" + iRowCounter,
                    layoutFixed : true,
                    columns : this._oMonitoringPersonalizationData.NumberOfColumns,
                    width : "100%",
                    height : "100%"
                });

                aRows.push(oLayoutRow);
                oRowContent = new sap.ui.commons.layout.MatrixLayoutRow("contentRowLayout" + iRowCounter, {});
                oLayoutRow.addRow(oRowContent);
                iRowCounter++;
            }

            // Create panel for each chart
            var sChartId;
            if (this._oMonitoringPersonalizationData.Charts) {
                if (this._oMonitoringPersonalizationData.Charts[i]) {
                    sChartId = this._oMonitoringPersonalizationData.Charts[i].ChartId;
                }
            }
            // Get URL parameters
            var sTimeFrom = $.sap.getUriParameters().get("from");
            var sTimeTo = $.sap.getUriParameters().get("to");
            if (sTimeFrom && sTimeTo) {
                this._oPeriod = {
                    "operator" : "BETWEEN",
                    "searchTerms" : [ sTimeFrom, sTimeTo ]
                };
            }

            this.aPanels[i] = new sap.secmon.ui.monitoring.MonitoringPanel({
                id : "ChartPanel-" + i,
                chartId : sChartId,
                monPageConfigId : that._oMonitoringPersonalizationData.Id,
                chartRefreshInterval : this._oMonitoringPersonalizationData.RefreshInterval * 1000,
                height : "100%",
                width : "100%",
                chartSelected : that.onNewChartSelected,
                chartMaximized : that.handleExpandChart,
                chartMinimized : that.handleExitFullScreen,
                alertId : this._alertId,
                filters : this._aFilters,
                period : this._oPeriod
            });
            this.aPanels[i].addStyleClass("tile");
            this.aPanels[i].addStyleClass("header");

            // Add panel to matrix layout
            oRowContent.addCell(new sap.ui.commons.layout.MatrixLayoutCell("cellPanel-" + i, {
                vAlign : sap.ui.commons.layout.VAlign.Top,
                content : this.aPanels[i],
                padding : sap.ui.commons.layout.Padding.None,
                height : "100%"
            }));
        }

        // Create splitter between each row
        var oSplitter, oSplitterOld;
        $.each(aRows, function(iIndex, oRowLayout) {
            if (oSplitter && oSplitter.getSecondPaneContent().length > 0) {
                oSplitterOld = oSplitter;
                oSplitter = new sap.ui.commons.Splitter({
                    height : "100%",
                    width : "100%",
                    splitterPosition : "50%",
                    splitterOrientation : sap.ui.commons.Orientation.horizontal
                });
                oSplitter.addFirstPaneContent(oSplitterOld);
                oSplitter.addSecondPaneContent(oRowLayout);
            } else if (!oSplitter) {
                oSplitter = new sap.ui.commons.Splitter({
                    height : "100%",
                    width : "100%",
                    splitterPosition : "50%",
                    splitterOrientation : sap.ui.commons.Orientation.horizontal
                });
                oSplitter.addFirstPaneContent(oRowLayout);
            } else {
                oSplitter.addSecondPaneContent(oRowLayout);
            }
        });

        oLayoutContent.createRow(oSplitter);

        return oLayoutContent;
    },
    /**
     * Specifies the Controller belonging to this View. In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * 
     * @memberOf views.Companies
     */
    getControllerName : function() {
        return "sap.secmon.ui.monitoring.Shell";
    },

    /**
     * Creates the bar containing the indicators
     */
    createIndicatorBar : function() {

        this._iIndicatorBarHeight = 100;

        return this.createTiles(this.createTileData());
    },

    /**
     * Create the tiles in the indicator bar
     * 
     * @param oData
     *            data needed to construct the tiles
     * @returns {Array} the tiles
     */
    createTiles : function(oData) {
        var aTileArray = [];

        if (sap.ui.getCore().byId("MatrixLayoutIndicator")) {
            sap.ui.getCore().byId("MatrixLayoutIndicator").destroy();
        }

        var oMatrixIndicator = new sap.ui.commons.layout.MatrixLayout({
            id : "MatrixLayoutIndicator",
            layoutFixed : true,
            width : "100%",
            columns : 3
        });

        for (var i = 0; i < oData.length; i++) {
            var oMatrix = new sap.ui.commons.layout.MatrixLayout({
                id : oData[i].type + "-MatrixLayout",
                layoutFixed : true,
                columns : 2,
                width : "100%",
                widths : [ "33.3%", "66.6%" ]
            });

            // Create a header
            var oCell = new sap.ui.commons.layout.MatrixLayoutCell("cellHeader" + i, {
                colSpan : 2,
                hAlign : sap.ui.commons.layout.HAlign.Left,
                vAlign : sap.ui.commons.layout.VAlign.Top
            });
            var oTextView = new sap.ui.commons.TextView({
                text : oData[i].title,
            });
            oTextView.addStyleClass("header");
            oCell.addContent(oTextView);
            oMatrix.createRow(oCell);

            // Create a standard divider
            oCell = new sap.ui.commons.layout.MatrixLayoutCell("cellDivider" + i, {
                colSpan : 1
            });
            oCell.addContent(new sap.ui.commons.HorizontalDivider({
                height : sap.ui.commons.HorizontalDividerHeight.Ruleheight
            }));
            oMatrix.createRow(oCell);

            var oCellIcon = new sap.ui.commons.layout.MatrixLayoutCell("cellIcon" + i, {
                colSpan : 1,
                hAlign : sap.ui.commons.layout.HAlign.Center
            });

            var oIcon = new sap.ui.core.Icon(oData[i].iconID);
            oIcon.setSrc(oData[i].iconSrc);
            oIcon.setSize("4.2em");
            oCellIcon.addContent(oIcon);
            var oVertical = new sap.ui.commons.layout.VerticalLayout();
            for (var j = 0; j < oData[i].navigations.length; j++) {
                var oLabel = new sap.ui.commons.Label({
                    text : oData[i].navigations[j].text
                });
                oLabel.addStyleClass("details");
                var oLink = new sap.ui.commons.Link(oData[i].navigations[j].id, {
                    text : oData[i].navigations[j].count,
                    tooltip : oData[i].navigations[j].linkTt,
                    press : function(oEvent) {
                        var aComponents = oEvent.getSource().sId.split("-");
                        for (var k = 0; k < oData.length; k++) {
                            if (oData[k].type === aComponents[0]) {
                                for (var l = 0; l < oData[k].navigations.length; l++) {
                                    if (l === parseInt(aComponents[1])) {
                                        var sLink = oData[k].navigations[l].link;
                                        if (oData[k].type === "Alerts") {
                                            var oMonitoringData = sap.ui.getCore().getModel("MonitoringModel").getData();
                                            var oFromDate = new Date(oMonitoringData.alertCount.timeranges.from);
                                            var oToDate = new Date(oMonitoringData.alertCount.timeranges.to);
                                            sLink = sLink + "&timeFromDate=" + oFromDate.getTime() + "&timeToDate=" + oToDate.getTime();
                                        }
                                        window.open(sLink);
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    }
                });
                oLink.addStyleClass("header");
                var oHorizontal = new sap.ui.commons.layout.HorizontalLayout();
                oHorizontal.addContent(oLabel);
                oHorizontal.addContent(oLink);

                oVertical.addContent(oHorizontal);
            }

            oMatrix.createRow(oCellIcon, oVertical);
            oMatrix.addStyleClass("tile");
            aTileArray[i] = new sap.ui.commons.layout.MatrixLayoutCell("cellTile" + i, {
                content : oMatrix,
                padding : sap.ui.commons.layout.Padding.None,
                vAlign : sap.ui.commons.layout.VAlign.Top,
            });
        }

        oMatrixIndicator.createRow(aTileArray[0], aTileArray[1], aTileArray[2]);

        return oMatrixIndicator;
    },

    createTileData : function() {
        var aDataArray = [];
        // Alerts
        var aNavigationsAlert = [];

        aNavigationsAlert[0] =
                {
                    "id" : "Alerts-0",
                    "text" : "{i18n>MonTotalNoAlertsOpen}",
                    "count" : "{MonitoringModel>/alertCount/totalOpen}",
                    "link" : "/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html?" + sap.secmon.ui.m.commons.NavigationService.getLanguage().substring(1) +
                            "&siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad#AlertsList-show&/?orderBy=creationDate&orderDesc=false&status=OPEN&timeSelectionType=absolute",
                    "linkTt" : "{i18n>MonOpenAlertTt}"
                };

        aNavigationsAlert[1] =
                {
                    "id" : "Alerts-1",
                    "text" : "{i18n>MonNoAlertsVeryHighOpen}",
                    "count" : "{MonitoringModel>/alertCount/veryHighOpen}",
                    "link" : "/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html?" + sap.secmon.ui.m.commons.NavigationService.getLanguage().substring(1) +
                            "&siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad#AlertsList-show&/?orderBy=creationDate&orderDesc=false&severity=VERY_HIGH&status=OPEN&timeSelectionType=absolute",
                    "linkTt" : "{i18n>MonOpenAlertTt}"
                };

        aDataArray[0] = {
            "type" : "Alerts",
            "title" : "{i18n>MonAlerts}",
            "iconID" : "IconAlert",
            "navigations" : aNavigationsAlert
        };

        // Investigations
        var aNavigationsInvestigation = [];
        aNavigationsInvestigation[0] =
                {
                    "id" : "Investigations-0",
                    "text" : "{i18n>MonMyInvestigationsOpen}",
                    "count" : "{MonitoringModel>/investigationCount/totalOpen}",
                    "link" : "/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html?" + sap.secmon.ui.m.commons.NavigationService.getLanguage().substring(1) +
                            "&siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad#InvestigationList-show&/?status=OPEN",
                    "linkTt" : "{i18n>MonOpenInvTt}"
                };

        aNavigationsInvestigation[1] =
                {
                    "id" : "Investigations-1",
                    "text" : "{i18n>MonMyInvestVeryHighOpen}",
                    "count" : "{MonitoringModel>/investigationCount/veryHighOpen}",
                    "link" : "/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html?" + sap.secmon.ui.m.commons.NavigationService.getLanguage().substring(1) +
                            "&siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad#InvestigationList-show&/?status=OPEN&severity=VERY_HIGH",
                    "linkTt" : "{i18n>MonOpenInvTt}"
                };

        aDataArray[1] = {
            "type" : "Investigations",
            "title" : "{i18n>MonInvestigations}",
            "iconID" : "IconInvestigation",
            "navigations" : aNavigationsInvestigation
        };

        // Health Check
        var aNavigationsHealthCheck = [];

        aNavigationsHealthCheck[1] = {
            "id" : "HealthChecks-1",
            "text" : "{i18n>MonSystemsUnavailable}",
            "count" : "{MonitoringModel>/healthCheckCount}",
            "link" : "/sap/secmon/ui/monitoring/?Id=1419AD5882AC89C7E10000000A600446" + sap.secmon.ui.m.commons.NavigationService.getLanguage(),
            "linkTt" : "{MonitoringModel>/healthCheckDetails}"
        };

        aNavigationsHealthCheck[0] = {
            "id" : "HealthChecks-0",
            "text" : "{i18n>MonSystemsAvailable}",
            "count" : "{MonitoringModel>/healthCheckCountOK}",
            "link" : "/sap/secmon/ui/monitoring/?Id=1419AD5882AC89C7E10000000A600446" + sap.secmon.ui.m.commons.NavigationService.getLanguage(),
            "linkTt" : "{MonitoringModel>/healthCheckOKDetails}"
        };

        aDataArray[2] = {
            "type" : "HealthChecks",
            "title" : "{i18n>MonHealthChecks}",
            "iconID" : "IconHealthCheck",
            "navigations" : aNavigationsHealthCheck
        };

        return aDataArray;
    },

    readConfiguration : function(sId, sName, sNamespace, sAlertId) {
        var that = this;
        var oShell = sap.ui.getCore().byId("idShell--shlMain");
        oShell.setBusy(true);
        var sUrl;
        if (sId) {
            sUrl = "/sap/secmon/services/MonitoringPageService.xsjs?id=" + sId;
        } else if (sName && sNamespace) {
            sUrl = "/sap/secmon/services/MonitoringPageService.xsjs?name=" + encodeURIComponent(sName) + "&namespace=" + encodeURIComponent(sNamespace);
        } else if (sAlertId) {
            that._alertId = sAlertId;
            sUrl = "/sap/secmon/services/MonitoringPageService.xsjs?alertId=" + sAlertId;
        } else {
            sUrl = "/sap/secmon/services/MonitoringPageService.xsjs";
        }

        jQuery.ajax({
            url : sUrl,
            async : false,
            type : "GET",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", "Fetch");
            },
            success : function(data, textStatus, XMLHttpRequest) {
                if (sap.ui.getCore().byId("personalizeToolPopUp")) {
                    sap.ui.getCore().byId("personalizeToolPopUp").destroy();
                }
                that._oMonitoringPersonalizationData = data;

                if (that._oMonitoringPersonalizationData.Charts) {
                    that._oMonitoringPersonalizationData.Charts = JSON.parse(that._oMonitoringPersonalizationData.Charts);
                }

                if (sap.ui.getCore().byId("comboBoxConfiguration")) {
                    sap.ui.getCore().byId("comboBoxConfiguration").setSelectedKey(that._oMonitoringPersonalizationData.Id);
                }

                // init monitoring page model
                var oMonitoringModel = new sap.ui.model.json.JSONModel();
                var oMonitoringModelData = {
                    selectedChartId : undefined,
                    selectedConfigurationId : that._oMonitoringPersonalizationData.Id,
                    selectedConfigurationName : that._oMonitoringPersonalizationData.Name,
                    isSaveNeeded : false,
                    IsFavorite : that._oMonitoringPersonalizationData.IsFavorite,
                    isDefault : that._oMonitoringPersonalizationData.IsDefault,
                    editable : that._oMonitoringPersonalizationData.editable,
                    alertCount : {
                        totalOpen : oTextBundle.getText("MonLoading"),
                        veryHighOpen : oTextBundle.getText("MonLoading"),
                        icon : "grey"
                    },
                    period : that._oMonitoringPersonalizationData.TimeRange,
                    healthCheckCount : oTextBundle.getText("MonLoading"),
                    investigationCount : {
                        totalOpen : oTextBundle.getText("MonLoading"),
                        veryHighOpen : oTextBundle.getText("MonLoading")
                    }
                };

                if (sap.ui.getCore().byId("charColumnCountTextField")) {
                    sap.ui.getCore().byId("charColumnCountTextField").setValue(that._oMonitoringPersonalizationData.NumberOfColumns);
                }
                if (sap.ui.getCore().byId("chartRefreshTextField")) {
                    sap.ui.getCore().byId("chartRefreshTextField").setValue(that._oMonitoringPersonalizationData.RefreshInterval);
                }
                if (sap.ui.getCore().byId("chartRowCountTextField")) {
                    sap.ui.getCore().byId("chartRowCountTextField").setValue(that._oMonitoringPersonalizationData.NumberOfRows);
                }

                oMonitoringModel.setData(oMonitoringModelData);
                sap.ui.getCore().setModel(oMonitoringModel, "MonitoringModel");

                // add content to shell
                var oLayout = sap.ui.getCore().byId("layoutContentShell");
                if (oLayout) {
                    oLayout.destroy();
                }
                oLayout = new sap.ui.commons.layout.MatrixLayout("layoutContentShell", {
                    layoutFixed : true,
                    width : "100%",
                    height : "100%",
                    columns : 1
                });

                // Chart area
                oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell("cellChartContent", {
                    vAlign : sap.ui.commons.layout.VAlign.Top,
                    padding : sap.ui.commons.layout.Padding.None,
                    content : that.createContentArea()
                }));
                oShell.setContent(oLayout);

                oShell.setBusy(false);
            },
            fail : function(xhr, textStatus, errorThrown) {
                console.error(xhr.status + " " + errorThrown + ': ' + xhr.responseText);
            }
        });

    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/e542b232d6294657b79db5b42486cfd2.html");
    },

    onPressedFavorite : function(oEvent) {
        var that = this;
        var sUrl;
        if (this._oMonitoringPersonalizationData.IsFavorite === 'X') {
            sUrl = "/sap/secmon/services/MonitoringPageService.xsjs?operation=unfavorite";
        } else {
            sUrl = "/sap/secmon/services/MonitoringPageService.xsjs?operation=favorite";
        }
        var promise = new sap.secmon.ui.commons.AjaxUtil().putJson(sUrl, JSON.stringify({
            "Id" : that._oMonitoringPersonalizationData.Id
        }));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            console.error(textStatus + " " + errorThrown);
            var messageText = "Configuration " + that._oMonitoringPersonalizationData.Name + " could not be saved as favorite: " + errorThrown + ". " + jqXHR.responseText;
            that.reportNotification(sap.ui.core.MessageType.Error, messageText);
        });
        promise.done(function(data, textStatus, jqXHR) {
            var messageText;
            if (data.IsFavorite === 'X') {
                messageText = oTextBundle.getText("MonCfgFavorited", [ that._oMonitoringPersonalizationData.Name, that._oMonitoringPersonalizationData.Namespace ]);
            } else {
                messageText = oTextBundle.getText("MonCfgUnfavorited", [ that._oMonitoringPersonalizationData.Name, that._oMonitoringPersonalizationData.Namespace ]);
            }
            that.reportNotification(sap.ui.core.MessageType.Success, messageText);
            that._oMonitoringPersonalizationData.IsFavorite = data.IsFavorite;
            that.getView().getModel("MonitoringModel").setProperty("/IsFavorite", data.IsFavorite);
        });
    },

    /**
     * Invoked when user presses the personalize button in the upper right corner This should open a dialog where the user can personalize the layout etc
     */
    onPressedConfigure : function(oEvent) {
        var that = this;
        var oLabel;
        var oPersonalizeToolPopUp = sap.ui.getCore().byId("personalizeToolPopUp");
        if (!oPersonalizeToolPopUp) {

            this.createAndFillNamespacesModel();

            var oMatrixLayout = new sap.ui.commons.layout.MatrixLayout("layoutConfigurePopup", {
                layoutFixed : false,
                columns : 4,
            });

            var oComboBox = new sap.m.ComboBox({
                id : "comboBoxConfiguration",
                showSecondaryValues : true,
                selectionChange : [ that.onSelectConfiguration, that ],
                selectedKey : "{MonitoringModel>/selectedConfigurationId}",
                items : {
                    path : "/Configurations",
                    model : "PersonalizationModel",
                    template : new sap.ui.core.ListItem({
                        text : "{PersonalizationModel>Name}",
                        additionalText : "{PersonalizationModel>Namespace}",
                        key : "{PersonalizationModel>Id}"
                    })
                }
            }).setModel(sap.ui.getCore().getModel("MonitoringModel"));
            oLabel = new sap.m.Label({
                text : "{i18n>MonConfiguration}",
                labelFor : oComboBox
            });

            oMatrixLayout.createRow(oLabel, new sap.ui.commons.layout.MatrixLayoutCell({
                content : oComboBox,
                colSpan : 3
            }));

            var oCell = new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 4
            });
            oCell.addContent(new sap.ui.commons.HorizontalDivider({
                height : sap.ui.commons.HorizontalDividerHeight.Ruleheight
            }));
            oMatrixLayout.createRow(oCell);

            var oTextField = new sap.m.Input({
                id : "chartRefreshTextField",
                change : function(oEvent) {
                    if (oEvent.getParameter("newValue") < 60 || oEvent.getParameter("newValue") > 600) {
                        oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                        oEvent.getSource().focus();

                        that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonInvalidValueBetween", [ 60, 600 ]), oTextBundle.getText("MonInvalidValue"));
                    } else {
                        sap.ui.getCore().byId("idShell").getController()._setSaveNeeded();
                        oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                    }
                }
            });
            oLabel = new sap.m.Label({
                text : "{i18n>MonRefreshInterval}",
                labelFor : oTextField
            });

            oMatrixLayout.createRow(oLabel, new sap.ui.commons.layout.MatrixLayoutCell({
                content : oTextField,
                colSpan : 3
            }));

            oTextField = new sap.m.Input({
                id : "charColumnCountTextField",
                change : function(oEvent) {
                    if (oEvent.getParameter("newValue") < 1 || oEvent.getParameter("newValue") > 4) {
                        oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                        oEvent.getSource().focus();                        
                        that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonInvalidValueBetween", [ 1, 4 ]), oTextBundle.getText("MonInvalidValue"));
                    } else {
                        sap.ui.getCore().byId("idShell").getController()._setSaveNeeded();
                        oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                    }
                }
            });

            oLabel = new sap.m.Label({
                text : "{i18n>MonChartColumnCount}",
                labelFor : oTextField
            });

            oMatrixLayout.createRow(oLabel, new sap.ui.commons.layout.MatrixLayoutCell({
                content : oTextField,
                colSpan : 3
            }));

            oTextField = new sap.m.Input({
                id : "chartRowCountTextField",
                change : function(oEvent) {
                    if (oEvent.getParameter("newValue") < 1 || oEvent.getParameter("newValue") > 4) {
                        oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                        oEvent.getSource().focus();
                        that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonInvalidValueBetween", [ 1, 4 ]), oTextBundle.getText("MonInvalidValue"));
                    } else {
                        sap.ui.getCore().byId("idShell").getController()._setSaveNeeded();
                        oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                    }
                }
            });

            oLabel = new sap.m.Label("chartRowCountLabel", {
                text : "{i18n>MonChartRowCount}",
                labelFor : oTextField
            });

            oMatrixLayout.createRow(oLabel, new sap.ui.commons.layout.MatrixLayoutCell({
                content : oTextField,
                colSpan : 3
            }));

            var oDropDown = new sap.m.ComboBox({
                id : "periodDropDown",
                selectedKey : "{MonitoringModel>/period}",
                items : {
                    path : "/",
                    model : "TimeRangeModel",
                    template : new sap.ui.core.Item({
                        text : "{TimeRangeModel>name}",
                        key : "{TimeRangeModel>key}"
                    })
                },
                change : function(oEvent) {
                    sap.ui.getCore().byId("idShell").getController()._setSaveNeeded();
                }
            });

            oLabel = new sap.m.Label({
                text : "{i18n>MonRangeIndicators}",
                labelFor : oDropDown
            });

            oMatrixLayout.createRow(oLabel, new sap.ui.commons.layout.MatrixLayoutCell({
                content : oDropDown,
                colSpan : 3
            }));

            var oCheckbox = new sap.m.CheckBox("checkBoxDefaultConfiguration", {
                selected : {
                    path : "/isDefault",
                    model : "MonitoringModel",
                    formatter : function(sValue) {
                        if (sValue === "X") {
                            return true;
                        } else {
                            return false;
                        }
                    }
                },
                select : function(oEvent) {
                    sap.ui.getCore().byId("idShell").getController()._setSaveNeeded();
                }
            });
            oLabel = new sap.m.Label({
                text : "{i18n>MonDefaultCfg}",
                labelFor : oCheckbox
            });

            oMatrixLayout.createRow(oLabel, new sap.ui.commons.layout.MatrixLayoutCell({
                content : oCheckbox,
                colSpan : 3
            }));

            var oLinkSave = new sap.m.Link({
                text : "{i18n>MonSavePersonalization}",
                press : function(oEvent) {
                    that.onSaveConfiguration(oPersonalizeToolPopUp);
                },
                visible : that.getView().getModel("ApplicationContext").getProperty("/userPrivileges/monitoringPageWrite"),
                enabled : {
                    parts : [ {
                        path : "/editable",
                        model : "MonitoringModel"
                    }, {
                        path : "/isSaveNeeded",
                        model : "MonitoringModel"
                    } ],
                    formatter : function(sEditable, bIsSaveNeeded) {
                        if (sEditable && bIsSaveNeeded) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            });

            var oLinkClose = new sap.m.Link({
                text : "{i18n>MonClose}",
                press : function(oEvent) {
                    if (oPersonalizeToolPopUp.isOpen()) {
                        oPersonalizeToolPopUp.close();
                    }
                }
            });

            var oLinkSaveAs = new sap.m.Link({
                text : "{i18n>MonSaveAs}",
                press : function(oEvent) {
                    var oLayout = sap.ui.getCore().byId("layoutSaveAs"), oDialog;
                    if (!oLayout) {
                        oLayout = new sap.ui.commons.layout.MatrixLayout("layoutSaveAs", {
                            layoutFixed : false,
                            width : "100%"
                        });
                    }
                    var oTextFieldName = sap.ui.getCore().byId("textName");
                    if (!oTextFieldName) {
                        oTextFieldName = new sap.m.Input("textName");
                    }
                    var oLabel = sap.ui.getCore().byId("labelName");
                    if (!oLabel) {
                        oLabel = new sap.m.Label("labelName", {
                            text : "{i18n>MonName}",
                            labelFor : oTextFieldName
                        });
                    }
                    oLayout.createRow(oLabel, oTextFieldName);

                    var oTextFieldNamespace = sap.ui.getCore().byId("textNameSpace");
                    if (!oTextFieldNamespace) {
                        oTextFieldNamespace = new sap.m.Select({
                            id : "textNameSpace",
                            selectedKey : "{/Namespace}",
                            width : "280px",
                            items : {
                                path : "NamespacesModel>/",
                                template : new sap.ui.core.ListItem({
                                    key : "{NamespacesModel>NameSpace}",
                                    text : "{NamespacesModel>NameSpace}"
                                })
                            }
                        }).setModel(that.getView().getModel("NamespacesModel"), "NamespacesModel");
                    }
                    oLabel = null;
                    oLabel = sap.ui.getCore().byId("labelNamespace");
                    if (!oLabel) {
                        oLabel = new sap.m.Label("labelNamespace", {
                            text : "{i18n>MonNamespace}",
                            labelFor : oTextFieldNamespace
                        });
                    }
                    oLayout.createRow(oLabel, oTextFieldNamespace);

                    oDialog = sap.ui.getCore().byId("dialogSaveAs");
                    if (!oDialog) {
                        oDialog = new sap.m.Dialog("dialogSaveAs", {
                            draggable : true,
                            title : "{i18n>MonSaveAs}",
                            buttons : [ new sap.m.Button({
                                text : "{i18n>MonSavePersonalization}",
                                press : function(oEvent) {
                                    that.onSaveAsConfiguration(oPersonalizeToolPopUp, oTextFieldName.getValue(), oTextFieldNamespace.getSelectedKey());
                                    oDialog.close();
                                }
                            }), new sap.m.Button({
                                text : "{i18n>MonClose}",
                                press : function() {
                                    oDialog.close();
                                }
                            }) ]
                        });

                        oDialog.addContent(oLayout);
                    }
                    oDialog.open();

                },
                visible : that.getView().getModel("ApplicationContext").getProperty("/userPrivileges/monitoringPageWrite")

            });

            var oLinkDelete = new sap.m.Link({
                text : "{i18n>MonDeleteConfiguration}",
                press : function(oEvent) {
                    that.onDeleteConfiguration(oPersonalizeToolPopUp);
                },
                visible : that.getView().getModel("ApplicationContext").getProperty("/userPrivileges/monitoringPageWrite"),
                enabled : {
                    path : "/editable",
                    model : "MonitoringModel",
                    formatter : function(sValue) {
                        if (sValue === "true") {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            });

            var oLinkExport = new sap.m.Link({
                text : "{i18n>MonExportConfig}",
                press : function(oEvent) {
                    that.onExportConfiguration(oPersonalizeToolPopUp);
                },
                visible : that.getView().getModel("ApplicationContext").getProperty("/userPrivileges/settingsContentReplicationWrite"),
            });

            oCell = new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 4
            });
            oCell.addContent(new sap.ui.commons.HorizontalDivider({
                height : sap.ui.commons.HorizontalDividerHeight.Ruleheight
            }));
            oMatrixLayout.createRow(oCell);

            oCell = new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 3
            });

            oCell.addContent(oLinkSave);
            oCell.addContent(new sap.ui.commons.TextView({
                width : "20px"
            }));
            oCell.addContent(oLinkSaveAs);
            oCell.addContent(new sap.ui.commons.TextView({
                width : "20px"
            }));
            oCell.addContent(oLinkDelete);
            oCell.addContent(new sap.ui.commons.TextView({
                width : "20px"
            }));
            oCell.addContent(oLinkExport);

            var oCellClose = new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 1,
                hAlign : "End"
            });
            oCellClose.addContent(oLinkClose);
            oMatrixLayout.createRow(oCell, oCellClose);

            oPersonalizeToolPopUp = new sap.ui.ux3.ToolPopup("personalizeToolPopUp", {
                content : oMatrixLayout,
                opener : oEvent.getSource()
            });
            oPersonalizeToolPopUp.addStyleClass("sapUiSizeCompact");
        }

        if (oPersonalizeToolPopUp.isOpen()) {
            oPersonalizeToolPopUp.close();
        } else {
            sap.ui.getCore().byId("charColumnCountTextField").setValue(that._oMonitoringPersonalizationData.NumberOfColumns);
            sap.ui.getCore().byId("chartRefreshTextField").setValue(that._oMonitoringPersonalizationData.RefreshInterval);
            sap.ui.getCore().byId("chartRowCountTextField").setValue(that._oMonitoringPersonalizationData.NumberOfRows);
            oPersonalizeToolPopUp.open(sap.ui.core.Popup.Dock.RightTop, sap.ui.core.Popup.Dock.LeftCenter);
        }

    },

    /**
     * Save configuration under new name
     * 
     * @param oPersonalizeToolPopUp
     * @param Name
     * @param Namespace
     */
    onSaveAsConfiguration : function(oPersonalizeToolPopUp, sName, sNamespace) {
        var that = this;
        var sUrl;
        var oNameControl = sap.ui.getCore().byId("textName");

        // persist Name
        if (!sName) {
            that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonErrorName", [sName]));
            oNameControl.setValueState(sap.ui.core.ValueState.Error);
            return;
        } else {
            oNameControl.setValueState(sap.ui.core.ValueState.None);
        }
        
        that._oMonitoringPersonalizationData.Name = sName;
        that._oMonitoringPersonalizationData.Namespace = sNamespace;
        console.log("Creating configuration %s {%s}", that._oMonitoringPersonalizationData.Name, that._oMonitoringPersonalizationData.Namespace);
        that._oMonitoringPersonalizationData.NumberOfColumns = parseInt(sap.ui.getCore().byId("charColumnCountTextField").getValue());
        that._oMonitoringPersonalizationData.NumberOfRows = parseInt(sap.ui.getCore().byId("chartRowCountTextField").getValue());
        that._oMonitoringPersonalizationData.RefreshInterval = sap.ui.getCore().byId("chartRefreshTextField").getValue();
        that._oMonitoringPersonalizationData.TimeRange = sap.ui.getCore().getModel("MonitoringModel").getProperty("/period");
        that._oMonitoringPersonalizationData.IsDefault = sap.ui.getCore().byId("checkBoxDefaultConfiguration").getSelected() === true ? "X" : "";

        // Check for valid values
        if (that._oMonitoringPersonalizationData.RefreshInterval < 60 || that._oMonitoringPersonalizationData.RefreshInterval > 600) {
            that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonInvalidValueBetween", [ 60, 600 ]), oTextBundle.getText("MonInvalidValue"));
            return;
        }
        if (that._oMonitoringPersonalizationData.NumberOfColumns < 1 || that._oMonitoringPersonalizationData.NumberOfColumns > 4) {
            that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonInvalidValueBetween", [ 1, 4 ]), oTextBundle.getText("MonInvalidValue"));
            return;
        }
        if (that._oMonitoringPersonalizationData.NumberOfRows < 1 || that._oMonitoringPersonalizationData.NumberOfRows > 4) {
            that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonInvalidValueBetween", [ 1, 4 ]), oTextBundle.getText("MonInvalidValue"));
            return;
        }

        // Copy the data into oEntry by
        // serializing/deserializing
        // to/from json
        var oEntry = JSON.parse(JSON.stringify(that._oMonitoringPersonalizationData));
        if (oEntry.Charts) {
            oEntry.Charts = JSON.stringify(oEntry.Charts);
            oEntry.Id = "";
        }

        sUrl = "/sap/secmon/services/MonitoringPageService.xsjs?operation=create";
        var promise = new sap.secmon.ui.commons.AjaxUtil().putJson(sUrl, JSON.stringify(oEntry));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            console.error(textStatus + " " + errorThrown);
            var messageText = "Configuration " + that._oMonitoringPersonalizationData.Name + " could not be saved: " + errorThrown + ". " + jqXHR.responseText;
            that.reportNotification(sap.ui.core.MessageType.Error, messageText);
            oPersonalizeToolPopUp.close();
        });
        promise.done(function(data, textStatus, jqXHR) {
            var messageText = oTextBundle.getText("MonPersCreated", [ data.Name, data.Namespace ]);
            that.reportNotification(sap.ui.core.MessageType.Success, messageText);
            oPersonalizeToolPopUp.close();
            var oDialogSaveAs = sap.ui.getCore().byId("dialogSaveAs");
            if (oDialogSaveAs) {
                oDialogSaveAs.close();
                oDialogSaveAs.destroy();
            }
            sap.ui.getCore().byId("comboBoxConfiguration").setSelectedKey(data.Id);
            that.readConfiguration(data.Id);
        });        
    },

    onDeleteConfiguration : function(oPersonalizeToolPopUp) {
        var that = this;
        var sHexId = that._oMonitoringPersonalizationData.Id;
        if (that._oMonitoringPersonalizationData.Namespace === "http://sap.com/secmon") {
            that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonCantBeDeleted", that._oMonitoringPersonalizationData.Namespace),
                    "{i18n>MonDeleteConfiguration}");
            return;
        }
        var sUrl;
        // Confirmation Dialog
        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("MonDelReally", [ that._oMonitoringPersonalizationData.Name, that._oMonitoringPersonalizationData.Namespace ]), function(bConfirmed) {
            if (bConfirmed) {
                sUrl = "/sap/secmon/services/MonitoringPageService.xsjs?id=" + sHexId;

                var promise = new sap.secmon.ui.commons.AjaxUtil().deleteJSON(sUrl);
                promise.fail(function(jqXHR, textStatus, errorThrown) {
                    console.error(textStatus + " " + errorThrown);
                    var messageText = "Configuration " + that._oMonitoringPersonalizationData.Name + " could not be deleted: " + errorThrown + ". " + jqXHR.responseText;
                    that.reportNotification(sap.ui.core.MessageType.Error, messageText);
                    oPersonalizeToolPopUp.close();
                });
                promise.done(function(data, textStatus, jqXHR) {
                    var messageText = oTextBundle.getText("MonCfgDeleted", [ that._oMonitoringPersonalizationData.Name, that._oMonitoringPersonalizationData.Namespace ]);
                    that.reportNotification(sap.ui.core.MessageType.Success, messageText);
                    oPersonalizeToolPopUp.close();
                    that.readConfiguration(); // Load

                    var promise = sap.secmon.ui.browse.utils.postJSon("/sap/secmon/services/replication/export.xsjs", JSON.stringify({
                        "ObjectType" : "MonitoringPage",
                        "ObjectName" : that._oMonitoringPersonalizationData.Name,
                        "ObjectNamespace" : that._oMonitoringPersonalizationData.Namespace,
                        "Operation" : "Delete"
                    }));
                    promise.fail(function(jqXHR, textStatus, errorThrown) {
                        var oError = jqXHR.responseText;
                        that.reportNotification(sap.ui.core.MessageType.Error, oError, "{i18n>Repl_Error}");
                    });
                    promise.done(function(data, textStatus, jqXHR) {
                        // Do nothing to prevent two success messages being shown to user
                    });
                });

            }
        }, "{i18n>MonDeleteConfiguration}");
    },

    /**
     * Saves the current configuration
     * 
     * @param oPersonalizeToolPopUp
     */
    onSaveConfiguration : function(oPersonalizeToolPopUp) {
        var that = this, sUrl;
        var sHexId = that._oMonitoringPersonalizationData.Id;
        if (that._oMonitoringPersonalizationData.Namespace === "http://sap.com/secmon") {
            that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonCantBeDeleted", that._oMonitoringPersonalizationData.Namespace),
                    "{i18n>MonSavePersonalization}");
            return;
        }
        console.log("Saving configuration %s (Id=%s)", that._oMonitoringPersonalizationData.Name, sHexId);
        that._oMonitoringPersonalizationData.NumberOfColumns = parseInt(sap.ui.getCore().byId("charColumnCountTextField").getValue());
        that._oMonitoringPersonalizationData.NumberOfRows = parseInt(sap.ui.getCore().byId("chartRowCountTextField").getValue());
        that._oMonitoringPersonalizationData.RefreshInterval = sap.ui.getCore().byId("chartRefreshTextField").getValue();
        that._oMonitoringPersonalizationData.TimeRange = sap.ui.getCore().getModel("MonitoringModel").getProperty("/period");
        that._oMonitoringPersonalizationData.IsDefault = sap.ui.getCore().byId("checkBoxDefaultConfiguration").getSelected() === true ? "X" : "";

        // Check for valid values
        if (that._oMonitoringPersonalizationData.RefreshInterval < 60 || that._oMonitoringPersonalizationData.RefreshInterval > 600) {
            that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonInvalidValueBetween", [ 60, 600 ]), oTextBundle.getText("MonInvalidValue"));
            return;
        }
        if (that._oMonitoringPersonalizationData.NumberOfColumns < 1 || that._oMonitoringPersonalizationData.NumberOfColumns > 4) {
            that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonInvalidValueBetween", [ 1, 4 ]), oTextBundle.getText("MonInvalidValue"));
            return;
        }
        if (that._oMonitoringPersonalizationData.NumberOfRows < 1 || that._oMonitoringPersonalizationData.NumberOfRows > 4) {
            that.reportNotification(sap.ui.core.MessageType.Error, oTextBundle.getText("MonInvalidValueBetween", [ 1, 4 ]), oTextBundle.getText("MonInvalidValue"));
            return;
        }

        // Copy the data into oEntry by
        // serializing/deserializing
        // to/from json
        var oEntry = JSON.parse(JSON.stringify(that._oMonitoringPersonalizationData));
        if (oEntry.Charts) {
            oEntry.Charts = JSON.stringify(oEntry.Charts);
        }

        sUrl = "/sap/secmon/services/MonitoringPageService.xsjs?operation=update";
        var promise = new sap.secmon.ui.commons.AjaxUtil().putJson(sUrl, JSON.stringify(oEntry));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            console.error(textStatus + " " + errorThrown);
            var messageText = "Configuration " + that._oMonitoringPersonalizationData.Name + " could not be saved: " + errorThrown + ". " + jqXHR.responseText;
            that.reportNotification(sap.ui.core.MessageType.Error, messageText);
            oPersonalizeToolPopUp.close();
        });
        promise.done(function(data, textStatus, jqXHR) {
            var messageText = oTextBundle.getText("MonPersUpdated", [ data.Name, data.Namespace ]);
            that.reportNotification(sap.ui.core.MessageType.Success, messageText);
            oPersonalizeToolPopUp.close();
            sap.ui.getCore().byId("comboBoxConfiguration").setSelectedKey(data.Id);
            that.readConfiguration(data.Id);
        });

    },

    /**
     * Retrieves number of investigations and health checks
     * 
     * @param bFirstTime
     *            Method is invoked for the first time
     */
    getCounts : function(bFirstTime) {

        /*
         * Get health check count
         */

        var oJsonHealthChecks = {
            "period" : {
                "operator" : "=",
                "searchTerms" : [ "last5Minutes" ]
            },
            "operation" : "createChart",
            "dimensions" : [ {
                "context" : "HealthCheck",
                "key" : "547DF3D6DD747331E10000000A4CF109"
            }, {
                "context" : "HealthCheck",
                "key" : "547DF3D7DD747331E10000000A4CF109"
            }, {
                "context" : "HealthCheck",
                "key" : "55B7BB94849E895AE24B192DA65BB37B"
            }, {
                "context" : "HealthCheck",
                "key" : "547D2E96B7907331E10000000A4CF109"
            } ],
            "measures" : [ {
                "context" : "HealthCheck",
                "fn" : "MAX",
                "distinct" : false,
                "key" : "547E59BAFC1C7331E10000000A4CF109",
                "name" : "*",
                "dataSets" : [ {
                    "name" : "Path1.Subset1",
                    "context" : "HealthCheck",
                    "filters" : [ {
                        "key" : "547E59BAFC1C7331E10000000A4CF109",
                        "valueRange" : {
                            "operator" : "=",
                            "searchTerms" : [ "last5Minutes" ]
                        }
                    } ],
                    "dependsOn" : []
                } ],
                "alias" : "MAX(547E59BAFC1C7331E10000000A4CF109)[0]"
            } ]
        };
        sap.ui.getCore().byId("HealthChecks-MatrixLayout").setBusy(true);
        var promiseHealthChecks = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oJsonHealthChecks));
        promiseHealthChecks.done(function(data, textStatus, XMLHttpRequest) {
            var oData = sap.ui.getCore().getModel("MonitoringModel").getData();

            var oDataHealthCheckCountOld = oData.healthCheckCount;
            var oDataHealthCheckCountOkOld = oData.healthCheckCountOK;
            oData.healthCheckCount = oData.healthCheckCountOK = 0;
            oData.healthCheckOKDetails = oData.healthCheckDetails = "";
            var aSystemsStatus = [];

            $.each(data.data, function(index, element) {
                var iSysIdx = -1;
                $.each(aSystemsStatus, function(idx, system) {
                    if (system.system === element[C_KB_SYSTEM_KEY]) {
                        iSysIdx = idx;
                        return false;
                    }
                });

                if (iSysIdx === -1) {
                    aSystemsStatus.push({
                        system : element[C_KB_SYSTEM_KEY],
                        status : element[C_KB_HEALTH_CHECK_RESULT]
                    });
                } else if (aSystemsStatus[iSysIdx].status === "Success") {
                    aSystemsStatus[iSysIdx].status = element[C_KB_HEALTH_CHECK_RESULT];
                }

            });

            $.each(aSystemsStatus, function(i, s) {
                if (s.status === "Success") { // OK
                    oData.healthCheckCountOK += 1;
                    if (!oData.healthCheckOKDetails) {
                        oData.healthCheckOKDetails = "Systems OK: " + "\n" + s.system;
                    } else {
                        oData.healthCheckOKDetails = oData.healthCheckOKDetails + "\n" + s.system;
                    }
                } else { // Not OK
                    oData.healthCheckCount += 1;
                    if (!oData.healthCheckDetails) {
                        oData.healthCheckDetails = "Systems Not OK: " + "\n" + s.system;
                    } else {
                        oData.healthCheckDetails = oData.healthCheckDetails + "\n" + s.system;
                    }
                }
            });

            if (oData.healthCheckCount > 0) {
                sap.ui.getCore().byId("IconHealthCheck").setSrc("sap-icon://alert");
                sap.ui.getCore().byId("IconHealthCheck").setColor("#dd0000");
            } else {
                sap.ui.getCore().byId("IconHealthCheck").setSrc("sap-icon://sys-enter");
                sap.ui.getCore().byId("IconHealthCheck").setColor("green");
            }

            sap.ui.getCore().getModel("MonitoringModel").setData(oData);
            sap.ui.getCore().byId("HealthChecks-MatrixLayout").setBusy(false);

            // CSS animation for icon
            if (!bFirstTime && (oData.healthCheckCount !== oDataHealthCheckCountOld || oData.healthCheckCountOK !== oDataHealthCheckCountOkOld)) {
                sap.ui.getCore().byId("IconHealthCheck").removeStyleClass("shrink");
                sap.ui.getCore().byId("IconHealthCheck").addStyleClass("grow");

                setTimeout(function() {
                    sap.ui.getCore().byId("IconHealthCheck").removeStyleClass("grow");
                    sap.ui.getCore().byId("IconHealthCheck").addStyleClass("shrink");
                }, 1500);
            }
        });
        promiseHealthChecks.fail(function(jqXHR, textStatus, errorThrown) {
            var oDataTemp = sap.ui.getCore().getModel("MonitoringModel").getData();
            oDataTemp.healthCheckCount = oTextBundle.getText("MonLoading");
            sap.ui.getCore().byId("IconHealthCheck").setSrc("sap-icon://alert");
            sap.ui.getCore().byId("IconHealthCheck").setColor("gray");
            sap.ui.getCore().getModel("MonitoringModel").setData(oDataTemp);

            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.ui.getCore().byId('idShell--shlMain').getParent().getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            console.error(messageText);
            sap.ui.getCore().byId("HealthChecks-MatrixLayout").setBusy(false);
        });

        /*
         * Get investigation count
         */
        sap.ui.getCore().byId("Investigations-MatrixLayout").setBusy(true);
        this._oInvestigationModel.read("/Investigation", {
            filters : [ new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "OPEN") ],
            success : function(oData) {
                var oDataTemp = sap.ui.getCore().getModel("MonitoringModel").getData();

                // CSS animation for icon
                if (!bFirstTime && oDataTemp.investigationCount.totalOpen !== oData.results.length) {
                    sap.ui.getCore().byId("IconInvestigation").removeStyleClass("shrink");
                    sap.ui.getCore().byId("IconInvestigation").addStyleClass("grow");

                    setTimeout(function() {
                        sap.ui.getCore().byId("IconInvestigation").removeStyleClass("grow");
                        sap.ui.getCore().byId("IconInvestigation").addStyleClass("shrink");
                    }, 1500);
                }

                oDataTemp.investigationCount.totalOpen = oData.results.length;

                if (oDataTemp.investigationCount.veryHighOpen > 0) {
                    sap.ui.getCore().byId("IconInvestigation").setSrc("sap-icon://alert");
                    sap.ui.getCore().byId("IconInvestigation").setColor("#dd0000");
                } else if (oDataTemp.investigationCount.totalOpen > 0) {
                    sap.ui.getCore().byId("IconInvestigation").setSrc("sap-icon://warning2");
                    sap.ui.getCore().byId("IconInvestigation").setColor("gold");
                } else {
                    sap.ui.getCore().byId("IconInvestigation").setSrc("sap-icon://sys-enter");
                    sap.ui.getCore().byId("IconInvestigation").setColor("green");
                }

                sap.ui.getCore().getModel("MonitoringModel").setData(oDataTemp);
                sap.ui.getCore().byId("Investigations-MatrixLayout").setBusy(false);
            },
            error : function(oError) {
                var oDataTemp = sap.ui.getCore().getModel("MonitoringModel").getData();
                oDataTemp.investigationCount.totalOpen = oTextBundle.getText("MonLoading");
                sap.ui.getCore().byId("IconInvestigation").setSrc("sap-icon://alert");
                sap.ui.getCore().byId("IconInvestigation").setColor("gray");
                sap.ui.getCore().getModel("MonitoringModel").setData(oDataTemp);
                console.error(oError);
                sap.ui.getCore().byId("Investigations-MatrixLayout").setBusy(false);
                var messageText = oError.message;
                sap.ui.getCore().byId('idShell--shlMain').getParent().getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            }
        });

        /*
         * Get investigation count very high
         */
        sap.ui.getCore().byId("Investigations-MatrixLayout").setBusy(true);
        this._oInvestigationModel.read("/Investigation", {
            filters : [ new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "OPEN"), new sap.ui.model.Filter("Severity", sap.ui.model.FilterOperator.EQ, "VERY_HIGH") ],
            success : function(oData) {
                var oDataTemp = sap.ui.getCore().getModel("MonitoringModel").getData();
                oDataTemp.investigationCount.veryHighOpen = oData.results.length;

                if (oDataTemp.investigationCount.veryHighOpen > 0) {
                    sap.ui.getCore().byId("IconInvestigation").setSrc("sap-icon://alert");
                    sap.ui.getCore().byId("IconInvestigation").setColor("#dd0000");
                } else if (oDataTemp.investigationCount.totalOpen > 0) {
                    sap.ui.getCore().byId("IconInvestigation").setSrc("sap-icon://warning2");
                    sap.ui.getCore().byId("IconInvestigation").setColor("gold");
                } else {
                    sap.ui.getCore().byId("IconInvestigation").setSrc("sap-icon://sys-enter");
                    sap.ui.getCore().byId("IconInvestigation").setColor("green");
                }

                sap.ui.getCore().getModel("MonitoringModel").setData(oDataTemp);
                sap.ui.getCore().byId("Investigations-MatrixLayout").setBusy(false);
            },
            error : function(oError) {
                var oDataTemp = sap.ui.getCore().getModel("MonitoringModel").getData();
                oDataTemp.investigationCount.veryHighOpen = oTextBundle.getText("MonLoading");
                sap.ui.getCore().byId("IconInvestigation").setSrc("sap-icon://alert");
                sap.ui.getCore().byId("IconInvestigation").setColor("gray");
                sap.ui.getCore().getModel("MonitoringModel").setData(oDataTemp);
                console.error(oError);
                sap.ui.getCore().byId("Investigations-MatrixLayout").setBusy(false);
                var messageText = oError.message;
                sap.ui.getCore().byId('idShell--shlMain').getParent().getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            }
        });
    },

    /**
     * Retrieves number of alerts
     * 
     * @param bFirstTime
     *            Invoked the first time
     */
    getAlertCounts : function(bFirstTime) {
        var period = sap.ui.getCore().getModel("MonitoringModel").getProperty("/period");

        /*
         * Get alert count
         */
        var oJsonAlerts = {
            "operation" : "getAlertCounts",
            "period" : {
                "operator" : "=",
                "searchTerms" : [ period ]
            }
        };

        sap.ui.getCore().byId("Alerts-MatrixLayout").setBusy(true);
        var promiseAlerts = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oJsonAlerts));
        promiseAlerts.done(function(data, textStatus, XMLHttpRequest) {
            var oData = sap.ui.getCore().getModel("MonitoringModel").getData();

            // CSS animation for icon
            if (!bFirstTime && (oData.alertCount.totalOpen !== data.all || oData.alertCount.veryHighOpen !== data.vh)) {
                sap.ui.getCore().byId("IconAlert").removeStyleClass("shrink");
                sap.ui.getCore().byId("IconAlert").addStyleClass("grow");

                setTimeout(function() {
                    sap.ui.getCore().byId("IconAlert").removeStyleClass("grow");
                    sap.ui.getCore().byId("IconAlert").addStyleClass("shrink");
                }, 1500);
            }

            oData.alertCount.totalOpen = data.all;
            oData.alertCount.veryHighOpen = data.vh;
            oData.alertCount.timeranges = {
                from : data.timeranges[0],
                to : data.timeranges[1]
            };

            if (oData.alertCount.veryHighOpen > 0) {
                sap.ui.getCore().byId("IconAlert").setSrc("sap-icon://alert");
                sap.ui.getCore().byId("IconAlert").setColor("#dd0000");
            } else if (oData.alertCount.totalOpen > 0) {
                sap.ui.getCore().byId("IconAlert").setSrc("sap-icon://warning2");
                sap.ui.getCore().byId("IconAlert").setColor("gold");
            } else {
                sap.ui.getCore().byId("IconAlert").setSrc("sap-icon://sys-enter");
                sap.ui.getCore().byId("IconAlert").setColor("green");
            }

            sap.ui.getCore().getModel("MonitoringModel").setData(oData);
            sap.ui.getCore().byId("Alerts-MatrixLayout").setBusy(false);
        });
        promiseAlerts.fail(function(jqXHR, textStatus, errorThrown) {
            var oDataTemp = sap.ui.getCore().getModel("MonitoringModel").getData();
            oDataTemp.alertCount.totalOpen = oTextBundle.getText("MonLoading");
            sap.ui.getCore().byId("IconAlert").setSrc("sap-icon://alert");
            sap.ui.getCore().byId("IconAlert").setColor("gray");
            sap.ui.getCore().getModel("MonitoringModel").setData(oDataTemp);

            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.ui.getCore().byId('idShell--shlMain').getParent().getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            console.error(messageText);
            sap.ui.getCore().byId("Alerts-MatrixLayout").setBusy(false);
        });

    },

    /**
     * Expands the given chart to fullscreen
     * 
     * @param oEvent.chart
     *            Ref to chart
     */
    handleExpandChart : function(oEvent) {
        var oShell = sap.ui.getCore().byId("idShell--shlMain");
        var oController = sap.ui.getCore().byId("idShell").getController();
        var oChart = oEvent.getParameter("chart");

        // Set content of shell to chart
        oController.oContentBeforeFullscreen = oShell.getContent();
        oController.oPanelBeforeFullscreen = oChart.getParent();
        oShell.setContent(oChart);

        // show Chart title in chart
        var oChartUIModelData = oChart.getModel("UIModel").getData();
        oChartUIModelData.chartTitleVisible = true;
        oChart.getModel("UIModel").setData(oChartUIModelData);
    },

    /**
     * Recovers the regular layout
     * 
     * @param oEvent.chart
     *            Ref to chart
     */
    handleExitFullScreen : function(oEvent) {
        var oShell = sap.ui.getCore().byId("idShell").getController().byId("shlMain");
        var oController = sap.ui.getCore().byId("idShell").getController();
        var oChart = oEvent.getParameter("chart");

        // Set content of shell to saved old state
        oShell.setContent(oController.oContentBeforeFullscreen);
        oController.oPanelBeforeFullscreen.addContent(oChart);
        oController.oPanelBeforeFullscreen = oController.oContentBeforeFullscreen = undefined;

        // hide Chart title in chart
        var oChartUIModelData = oChart.getModel("UIModel").getData();
        oChartUIModelData.chartTitleVisible = false;
        oChart.getModel("UIModel").setData(oChartUIModelData);
    },

    /**
     * Triggered when the user selects a new chart for a panel
     * 
     * @param oEvent.newChartId
     *            ID of the selected chart
     */
    onNewChartSelected : function(oEvent) {
        console.log("New chart %s selected", oEvent.getParameter("newChartId"));
        var oViewController = sap.ui.getCore().byId("idShell").getController();

        // Update personalization
        var iPersonalizationChartId = oEvent.getSource().getId().split("-")[1];
        if (!oViewController._oMonitoringPersonalizationData.Charts) {
            oViewController._oMonitoringPersonalizationData.Charts = [];
        }
        oViewController._oMonitoringPersonalizationData.Charts[iPersonalizationChartId] = {
            ChartId : oEvent.getParameter("newChartId")
        };

        sap.ui.getCore().byId("idShell").getController()._setSaveNeeded();
    },

    _setSaveNeeded : function() {
        sap.ui.getCore().getModel("MonitoringModel").setProperty("/isSaveNeeded", true);
    },

    /**
     * Triggered when a different configuration has been selected
     * 
     * @param oEvent
     */
    onSelectConfiguration : function(oEvent) {
        var sId = oEvent.getParameter("selectedItem").getKey();
        console.log("Configuration %s (Id=%s) selected", oEvent.getParameter("selectedItem").getText(), sId);
        this.readConfiguration(sId);
    },

    onExportConfiguration : function(oPersonalizeToolPopup) {
        var that = this;
        var promise = sap.secmon.ui.browse.utils.postJSon("/sap/secmon/services/replication/export.xsjs", JSON.stringify({
            ObjectType : "MonitoringPage",
            "ObjectName" : that._oMonitoringPersonalizationData.Name,
            "ObjectNamespace" : that._oMonitoringPersonalizationData.Namespace
        }));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            var oError = jqXHR.responseText;
            that.reportNotification(sap.ui.core.MessageType.Error, oError, "{i18n>Repl_Error}");
        });
        promise.done(function(data, textStatus, jqXHR) {
            that.reportNotification(sap.ui.core.MessageType.Success, "Success", "{i18n>Repl_Success}");
        });
    }
});