/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.BrowsingChart");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Chart");
$.sap.require("sap.secmon.ui.browse.Bubblegram");
$.sap.require("sap.secmon.ui.browse.Constants");

sap.ui.core.Control.extend("sap.secmon.ui.browse.BrowsingChart", {

    metadata : {
        properties : {
            fullScreen : {
                type : "boolean",
                defaultValue : false
            }
        },
        aggregations : {
            _layout : {
                type : "sap.ui.commons.layout.BorderLayout",
                multiple : false,
            // visibility : "hidden"
            }
        },
        // associations : {
        // bubblegram : "sap.secmon.ui.browse.Bubblegram",
        // multiple : false
        // },
        events : {
            newFilterSelected : {
                selectedFilterData : "any"
            },
        }
    },

    _aCharts : [],
    _oBrowsingChartTitle : undefined,
    _oMatrixlayout : undefined,
    _oDistributionDialog : undefined,
    _bubblegram : undefined,

    showBubblegram : function() {
        var sBrowsingView = sap.ui.getCore().getModel("WorkspaceModel").getProperty("/browsingView");
        return sBrowsingView && sBrowsingView === sap.secmon.ui.browse.Constants.C_BROWSING_VIEW.BUBBLEGRAM;
    },

    getBubblegram : function() {
        return this._bubblegram;
    },

    _publishExpandChart : function() {
        // Pass reference to this as first entry in event parameters array
        sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXPAND_CHART, [ this ]);
    },

    _publishExitFullScreen : function() {
        // Pass reference to this as first entry in event parameters array
        sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXIT_FULL_SCREEN, [ this ]);
    },

    init : function() {

        var oBrowsingChartModel = new sap.ui.model.json.JSONModel();
        oBrowsingChartModel.loadData("ui/browsingChart.json", null, false);
        sap.ui.getCore().setModel(oBrowsingChartModel, "BrowsingChartModel");

        this._oBrowsingChartTitle = new sap.ui.commons.Label({}).addStyleClass("sapEtdTitle");

        var oTitleToolbar = new sap.ui.commons.Toolbar({
            design : "Standard",
            items : [ this._oBrowsingChartTitle ],
            rightItems : [ // add help link
            new sap.ui.core.Icon({
                src : "sap-icon://sys-help-2",
                size : "1.5em",
                width : "1.5em",
                color : "grey",
                hoverColor : "black",
                hoverBackgroundColor : "#009de0",
                visible : {
                    path : "WorkspaceModel>/browsingView",
                    formatter : function(value) {
                        return (value === sap.secmon.ui.browse.Constants.C_BROWSING_VIEW.BUBBLEGRAM); // BubbleChart
                    }
                },
                press : [ function(oEvent) {
                    window.open("/sap/secmon/help/f03baff03ecb407a8ba0445c030f53ba.html");
                }, this ]
            }), new sap.ui.commons.ToggleButton({
                id : "browsingView",
                // lite : true,
                icon : "sap-icon://bubble-chart",
                tooltip : "{i18n>BU_TOL_SwitchBrwBbl}",
                pressed : {
                    path : "WorkspaceModel>/browsingView",
                    formatter : function(value) {
                        return (value === sap.secmon.ui.browse.Constants.C_BROWSING_VIEW.BUBBLEGRAM); // BubbleChart
                    }
                },
                press : [ function(oEvent) {
                    var maxCountEntities = 1000000;
                    var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');

                    var sSelectedSubsetId = oWorkspaceModel.getProperty("/selectedSubsetId");
                    var aBuf = sSelectedSubsetId.split(".");

                    var aPath = aBuf[0].split("Path");
                    var sPathLuid = aPath[1];
                    var idxPath = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceModel.getData());
                    var iCountPathItems = sap.secmon.ui.browse.utils.getPathCountItems(sPathLuid, oWorkspaceModel.getData());
                    var idxSubset, iCountSubsetItems;
                    if (aBuf.length > 1) {
                        var sSubsetLuid = aBuf[1].split("Subset")[1];
                        idxSubset = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(sSubsetLuid, idxPath, oWorkspaceModel.getData());
                        iCountSubsetItems = sap.secmon.ui.browse.utils.getSubsetCountItems(sSubsetLuid, idxPath, oWorkspaceModel.getData());
                    }

                    var sContext = oWorkspaceModel.getProperty("/paths/" + idxPath + "/context");
                    var sSubsetId = sSelectedSubsetId;
                    var oPressed = oEvent.getSource().getPressed();
                    if ((iCountPathItems > maxCountEntities || iCountSubsetItems > maxCountEntities) && oPressed) {
                        sap.m.MessageBox.confirm(oTextBundle.getText("BubbleGramWarningPrior"), {
                            title : oTextBundle.getText("MonInfo"),
                            styleClass : "",
                            onClose : function(sChosenAction) {
                                if (sChosenAction === "OK") {
                                    this.setShowBubblegram(oPressed);
                                    this.display(sSubsetId, sContext, true);
                                } else {
                                    sap.ui.getCore().byId("browsingView").setPressed(false);
                                }
                            }.bind(this),
                            icon : sap.m.MessageBox.Icon.INFORMATION,
                            initialFocus : null
                        });
                    } else {
                        this.setShowBubblegram(oPressed);
                        this.display(sSubsetId, sContext, true);
                    }
                }, this ]
            }), new sap.ui.commons.Button({
                lite : true,
                icon : sap.ui.core.IconPool.getIconURI("full-screen"),
                tooltip : "{i18n>BU_TOL_Expand}",
                press : [ function(oEvent) {
                    if (this.getFullScreen()) {
                        this.setFullScreen(false);
                        this._publishExitFullScreen();
                    } else {
                        this.setFullScreen(true);
                        this._publishExpandChart();
                    }
                }, this ]
            }) ]
        });

        this._oMatrixlayout = new sap.ui.commons.layout.MatrixLayout({
            columns : 2,
            widths : [ "auto" ],
            width : "100%",
            height : "100%",
        });

        this._layout = new sap.ui.commons.layout.BorderLayout({
            width : "100%",
            height : "100%",
            top : new sap.ui.commons.layout.BorderLayoutArea({
                size : "28px",
                contentAlign : "center",
                content : [ oTitleToolbar ]
            }),
            center : new sap.ui.commons.layout.BorderLayoutArea({
                contentAlign : "center",
                visible : true,
                content : [ this._oMatrixlayout ]
            })
        });

        this.setAggregation("_layout", this._layout);
        // this.setShowBubblegram(this.getShowBubblegram);
    },

    display : function(sStartSubset, sBrowsingContext, bForceBERead) {
        this._oBrowsingChartTitle.setText(oTextBundle.getText("BU_TXT_Distribution", sStartSubset));
        var sBrowsingView = sap.ui.getCore().getModel('WorkspaceModel').getProperty("/browsingView");
        if (sBrowsingView === sap.secmon.ui.browse.Constants.C_BROWSING_VIEW.BUBBLEGRAM) {
            this.displayBubblegram(sStartSubset, sBrowsingContext);
        } else {
            this.displayBrowsingChart(sStartSubset, sBrowsingContext, bForceBERead);
        }
    },

    setShowBubblegram : function(show) {
        sap.ui.getCore().getModel('WorkspaceModel').setProperty("/browsingView",
                show === true ? sap.secmon.ui.browse.Constants.C_BROWSING_VIEW.BUBBLEGRAM : sap.secmon.ui.browse.Constants.C_BROWSING_VIEW.BROWSING_CHART);
    },

    /*
     * Show the Bubblegramby reusing the instance already exists Thru setting the context for Bubblegram a reloading of data is triggered
     */
    displayBubblegram : function(sStartSubset, sBrowsingContext) {

        this._bubblegram = this._bubblegram || new sap.secmon.ui.browse.Bubblegram({
            // startsSubset : sStartSubset,
            // browsingContext : sBrowsingContext,
            drilldown : [ function(oEvent) {
                var sStartSubset = oEvent.getParameter("startSubset");
                if (this._aCharts && this._aCharts[0]) {
                    this._aCharts[0].getModel().setProperty("/measures/0/startDatasets/0/name", sStartSubset);
                }
                this._oBrowsingChartTitle.setText(oTextBundle.getText("BU_TXT_Distribution", sStartSubset));
            }, this ]
        });

        this._bubblegram.setStartSubset(sStartSubset);
        this._bubblegram.setBrowsingContext(sBrowsingContext);

        // Layout the control
        this._oMatrixlayout.removeAllRows();
        var oRow = new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : this._bubblegram,
                vAlign : sap.ui.commons.layout.VAlign.Top,
                colSpan : 2,
            }) ]
        });
        this._oMatrixlayout.addRow(oRow);
    },

    displayBrowsingChart : function(sStartSubset, sContext, bForceBERead) {

        var that = this;
        this._aCharts = [];

        var oBrowsingChartModelData = sap.ui.getCore().getModel("BrowsingChartModel").getData();

        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        var oWorkspaceDataCopy = $.extend(true, {}, oWorkspaceData);

        var oDimensionsModel = sap.ui.getCore().getModel('DimensionsModel');
        var oMeasuresModel = sap.ui.getCore().getModel('MeasuresModel');
        var oDimsData, oMeasData;

        sap.secmon.ui.browse.utils.getController()._oCache.getData([ {
            context : sContext,
            subsetId : sStartSubset
        } ], oWorkspaceData)
                .done(
                        function(response, textStatus, XMLHttpRequest) {
                            var oBackendata = JSON.parse(JSON.stringify(response));

                            // sort the list
                            oBackendata.data = sap.secmon.ui.browse.utils.sortFieldList(oBackendata.data);
                            if (!oDimensionsModel.getProperty("/data") ||
                                    !(oBackendata.data.length + 1 === oDimensionsModel.getProperty("/data").length && oBackendata.data[oBackendata.data.length - 1] === oDimensionsModel
                                            .getProperty("/data")[oDimensionsModel.getProperty("/data").length - 1])) {
                               var aDimensionsData = [].concat(oBackendata.data);
                        
                                // Show "Username <Role> attributes" field only if according Authorization exists
                                if (!that.getModel("applicationContext").getProperty("/userPrivileges/plainUser")) {
                                    var aAttrConstantsKeys = [];
                                    for (var oProp in sap.secmon.ui.browse.Constants.C_USERNAME_ATTRIBUTES){
                                        aAttrConstantsKeys.push(sap.secmon.ui.browse.Constants.C_USERNAME_ATTRIBUTES[oProp].key);
                                    }

                                        oDimsData =  aDimensionsData.filter(function(oItem){
                                            if (aAttrConstantsKeys.indexOf(oItem.key) === -1){ 
                                                return oItem;
                                            }
                                        }.bind(this));
                                    } else { 
                                        oDimsData = aDimensionsData;
                                    }

                                // Remove "Event, Original Data" since we don't have the aggregation
                                var iToDelete;
                                (oDimsData || []).some(function(dim, i) {
                                    // key for "Event,Original Message"
                                    if (dim.key === '566CDFB06EFAAC24E10000000A4CF109') {
                                        iToDelete = i;
                                        return true;
                                    }
                                });

                                if (iToDelete) {
                                    oDimsData.splice(iToDelete, 1);
                                }

                                oDimensionsModel.setProperty("/data", oDimsData);

                                oMeasData = [ {
                                    "displayName" : "*",
                                    "description" : "All",
                                    "key" : "*",
                                    "dataType" : "",
                                    "filterOperators" : []
                                } ].concat(oBackendata.data);
                                oMeasuresModel.setProperty("/data", oMeasData);
                            }
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                    var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                });

        var aDimensions = [];
        this._oMatrixlayout.removeAllRows();
        if (oBrowsingChartModelData.hasOwnProperty(sContext)) {
            aDimensions = oBrowsingChartModelData[sContext].dimensions;
        }

        var aBrowsingCharts = [];
        $.each(aDimensions, function(index, oDimension) {
            var oChartData = {};
            oChartData.context = sContext;
            oChartData.period = oWorkspaceData.period;
            // oChartData.name = "Distribution of " + sStartSubset + " by ";
            oChartData.name = "";
            oChartData.namespace = oWorkspaceData.namespace;
            oChartData.operation = sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.CREATE_CHART;
            oChartData.chartType = oDimension.chartType;
            oChartData.dimensions = [];
            oChartData.dimensions.push(oDimension);
            oChartData.measures = [];
            oChartData.measures.push({
                context : sContext,
                fn : "COUNT",
                distinct : oDimension.distinct,
                key : "*",
                name : "*",
                displayName : "Count of " + sContext,
                startDatasets : [ {
                    name : sStartSubset
                } ]
            });
            oChartData.verbose = sap.secmon.ui.browse.utils.getController().bDebug;

            var aaUsedDatasets = {};
            var aSubsets2Visit = [];
            var reSubset = /Path\d+\.Subset\d+/g;
            $.each(oChartData.measures, function(index, oMeasure) {
                if (oMeasure.startDatasets && reSubset.exec(oMeasure.startDatasets[0].name) !== null) {
                    oMeasure.dataSets = [];
                    aaUsedDatasets = {};
                    aSubsets2Visit = [];
                    aSubsets2Visit.push(oMeasure.startDatasets[0].name);
                    sap.secmon.ui.browse.utils.visitSubset(aSubsets2Visit, oWorkspaceDataCopy, oMeasure, aaUsedDatasets);
                }
            });

            aBrowsingCharts.push(oChartData);
        });

        var iLen = aBrowsingCharts.length;
        var iTwoChartRows = Math.floor(iLen / 2);
        var iOneChartRow = iLen % 2;
        var sSecondPaneSize = sap.ui.getCore().byId('idShell--shlMain').getContent()[0].getContentAreas()[1].getLayoutData().getSize();
        var sChartWidth = "", oRow;
        if (sSecondPaneSize === "auto") {
            sChartWidth = $(document).width() * 0.5 * 0.5 + "px";
        } else {
            sChartWidth = sSecondPaneSize * 0.5 + "px";
        }

        for (var i = 0; i < iTwoChartRows; i++) {
            oRow = new sap.ui.commons.layout.MatrixLayoutRow({
                cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                    content : fnCreateChart(i * 2),
                    vAlign : sap.ui.commons.layout.VAlign.Top
                }), new sap.ui.commons.layout.MatrixLayoutCell({
                    content : fnCreateChart(i * 2 + 1),
                    vAlign : sap.ui.commons.layout.VAlign.Top
                }) ]
            });
            this._oMatrixlayout.addRow(oRow);
        }

        if (iOneChartRow) {
           oRow = new sap.ui.commons.layout.MatrixLayoutRow({
                cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                    content : fnCreateChart((i + 1)),
                    vAlign : sap.ui.commons.layout.VAlign.Top,
                    colSpan : 2,
                }) ]
            });
            this._oMatrixlayout.addRow(oRow);
        }

        function fnCreateChart(iIdx) {
            var oChart = new sap.secmon.ui.browse.Chart({
                refreshMode : {
                    mode : "onBrowse"
                },
                artifactLuid : -1,
                newFilterSelected : function(oEvent) {
                    that.fireNewFilterSelected(oEvent.mParameters);
                },
                dimensionChanged : function(oEvent) {
                    var oBrowsingChartModel = sap.ui.getCore().getModel("BrowsingChartModel");
                    var sPath = "/" + oEvent.getParameter("context") + "/dimensions/" + iIdx;
                    oBrowsingChartModel.setProperty(sPath + "/key", oEvent.getParameter("key"));
                    oBrowsingChartModel.setProperty(sPath + "/name", oEvent.getParameter("name"));
                },
                width : sChartWidth,
                height : {
                    path : "/",
                    formatter : function(oVal) {
                        var iHeight = $(document).height() - 44 - 41 - 40;
                        var sStatus = sap.secmon.ui.browse.utils.getController().byId("shlMain").getNotificationBar().getVisibleStatus();
                        if (sStatus === sap.ui.ux3.NotificationBarStatus.None || sStatus === sap.ui.ux3.NotificationBarStatus.Min) {
                            iHeight = iHeight - 45;
                        }
                        iHeight = iHeight / (iTwoChartRows + iOneChartRow);

                        return iHeight + "px";
                    }
                }
            });
            oChart.getModel().setData(aBrowsingCharts[iIdx]);
            if (bForceBERead) {
                oChart.handleFeedsChanged();
            }
            that._aCharts.push(oChart);
            return oChart;
        }
    },

    handleFeedsChanged : function() {
        $.each(this._aCharts, function(index, oChart) {
            oChart.handleFeedsChanged();
        });
    },

    // No need to store startSubset in the control
    // it is in the workspace model
    getStartSubset : function() {
        if (this._aCharts && this._aCharts[0]) {
            return this._aCharts[0].getModel().getProperty("/measures/0/startDatasets/0/name");
        }
    },

    getContext : function() {
        if (this._aCharts && this._aCharts[0]) {
            return this._aCharts[0].getModel().getProperty("/measures/0/context");
        }
    },

    updatePeriod : function(oWorkspacePeriod) {

        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');

        var sSelectedSubsetId = oWorkspaceModel.getProperty("/selectedSubsetId");
        var aBuf = sSelectedSubsetId.split(".");

        var aPath = aBuf[0].split("Path");
        var sPathLuid = aPath[1];
        var idxPath = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceModel.getData());

        var idxSubset;
        if (aBuf.length > 1) {
            var sSubsetLuid = aBuf[1].split("Subset")[1];
            idxSubset = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(sSubsetLuid, idxPath, oWorkspaceModel.getData());
        }

        var sContext = oWorkspaceModel.getProperty("/paths/" + idxPath + "/context");
        var sSubsetId = sSelectedSubsetId;

        this.display(sSubsetId, sContext, true);
    },

    renderer : function(oRm, oControl) {
        oRm.renderControl(oControl._layout);
    },
});
