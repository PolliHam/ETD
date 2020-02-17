/* globals oTextBundle */
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.m.commons.EtdController");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.malimon.Constants");
$.sap.require("sap.secmon.ui.malimon.foa.ETDEntityGraphLegend");
$.sap.require("sap.secmon.ui.malimon.foa.ETDEntityGraphSettings");
$.sap.require("sap.secmon.ui.malimon.foa.ETDEntityGraphFilter");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Constants");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.malimon.foa.GraphVisualization", {

    _oGraphSettingsDialog : undefined,
    _oGraphFilterRPopover : undefined,
    _oGraphLegendRPopover : undefined,

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.malimon.EventsVisualization
     */

    /**
     * oQueryParams.from && oQueryParams.to are ISO
     */
    onInit : function() {
        var oETDGraphModel = new sap.ui.model.json.JSONModel();
        oETDGraphModel.setSizeLimit(999999);
        oETDGraphModel.setData({
            data : [],
            dimensions : [],
            representation : ""
        });
        this.getView().byId("etdEntityGraph").setModel(oETDGraphModel);

        var oModel = new sap.ui.model.json.JSONModel();
        oModel.setProperty("/title", oTextBundle.getText("MM_TIT_FOA"));
        this.getView().setModel(oModel);

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
    },

    onAfterRendering : function() {
        
    },

    onHelpPress : function(oEvent) {
        window.open("/sap/secmon/help/ebba99f11040400395bf1cd49d31ba12.html");
    },

    onNavBack : function(oEvent) {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    handleRouteMatched : function(oEvent) {
        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }
        var oModel = this.getView().getModel();
        var oQueryParams = args["?query"] || {};
        if (!(oQueryParams.hasOwnProperty("relativeTime") || (oQueryParams.hasOwnProperty("from") && oQueryParams.hasOwnProperty("to")))) {
            oQueryParams.relativeTime = "last15Minutes";
            oQueryParams.top = 20;
        }
        if (!oQueryParams.hasOwnProperty("focus")) {
            oQueryParams.focus = "User";
        }
        if (oQueryParams.hasOwnProperty("extraDims") && !oQueryParams.extraDims) {
            delete oQueryParams.extraDims;
        }
        oModel.setProperty("/queryParams", oQueryParams);
        this.fnCreateGraph();
    },

    fnUpdateTitle : function() {
        var oQueryParams = this.getView().getModel().getProperty("/queryParams");

        var oPeriod = oQueryParams.hasOwnProperty("relativeTime") ? {
            operator : "=",
            searchTerms : [ oQueryParams.relativeTime ]
        } : {
            operator : "BETWEEN",
            searchTerms : [ oQueryParams.from, oQueryParams.to ]
        };

        var bUTC = this.getComponent().getModel("applicationContext").getProperty("/UTC");
        var sPeriod = sap.secmon.ui.browse.utils.getSelectedPeriod(oPeriod, bUTC);
        var sTitle = oTextBundle.getText("MM_LBL_FOA", [ oQueryParams.top, sPeriod, oQueryParams.focus ]);
        this.getView().getModel().setProperty("/title", sTitle);
    },

    fnGetDims4Focus : function(sFocus) {
        var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
        var aGraphFocus = oConfigModel.getProperty("/config/focus");
        var iIdx = aGraphFocus.map(function(x) {
            return x.name;
        }).indexOf(sFocus);
        return aGraphFocus[iIdx].dimensions.filter(function(oDim) {
            return oDim.key !== "0001" && oDim.required;
        });
    },

    fnCreateGraph : function() {
        var sMessageText = "";
        var oEntityGraph = this.getView().byId("etdEntityGraph");
        oEntityGraph.setLastSelectedNode(undefined);

        var oQuery = sap.ui.getCore().getModel("ConfigModel").getProperty("/query/Alert");
        var oQueryParams = this.getView().getModel().getProperty("/queryParams");
        if (oQueryParams.hasOwnProperty("relativeTime")) {
            oQuery.period.operator = "=";
            oQuery.period.searchTerms = [ oQueryParams.relativeTime ];
        } else if (oQueryParams.hasOwnProperty("from") && oQueryParams.hasOwnProperty("to")) {
            oQuery.period.operator = "BETWEEN";
            oQuery.period.searchTerms = [ oQueryParams.from, oQueryParams.to ];
        }
        if (oQueryParams.hasOwnProperty("top")) {
            oQuery.queryOptions.top = oQueryParams.top;
        }
        if (oQueryParams.hasOwnProperty("focus")) {
            oQuery.dimensions = this.fnGetDims4Focus(oQueryParams.focus);
        }
        if (oQueryParams.hasOwnProperty("extraDims")) {
            var aDimKeys = oQueryParams.extraDims.split(",");
            if (aDimKeys.length) {
                aDimKeys.forEach(function(sDimKey) {
                    oQuery.dimensions.push({
                        key : sDimKey
                    });
                });
            }
        }

        this.fnUpdateTitle();
        oEntityGraph.setBusy(true);

        var oInvestigationODataModel = sap.ui.getCore().getModel("InvestigationODataModel");
        oInvestigationODataModel.read("/Investigations", {
            success : function(data) {
                sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery)).done(function(response, textStatus, XMLHttpRequest) {
                    var aEntries = JSON.parse(JSON.stringify(response)).data;
                    sap.ui.getCore().getModel("Top10Model").setProperty("/selected", []);
                    var oData = {
                        data : aEntries,
                        dimensions : oQuery.dimensions,
                        representation : oQueryParams.focus,
                        investigations : data.results
                    };
                    oEntityGraph.getModel().setData(oData);
                    oEntityGraph._update(null); // TODO: ???
                    oEntityGraph.setBusy(false);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    sMessageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sMessageText);
                    oEntityGraph.setBusy(false);
                });
            },
            error : function(oError) {
                sMessageText = decodeURIComponent(oError.message) + "\n" + oError.response.body;
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sMessageText);
                oEntityGraph.setBusy(false);
            }
        });
    },

    onSettingsPress : function(oEvent) {
        if (!this._oGraphSettingsDialog) {
            this._oGraphSettingsDialog = new sap.m.Dialog({
                title : oTextBundle.getText("MM_XTIT_GSETTINGS"),
                content : [ new sap.secmon.ui.malimon.foa.ETDEntityGraphSettings({}) ],
                buttons : [ new sap.m.Button({
                    text : oTextBundle.getText("Commons_Ok"),
                    press : [ function(oEvent) {
                        var oQueryParams = {};
                        var oGraphSettings = this._oGraphSettingsDialog.getContent()[0];
                        var oTRValue = oGraphSettings.getTRValue();
                        if (oGraphSettings.getTRType() === "Relative") {
                            oQueryParams.relativeTime = oTRValue.relativeValue;
                        } else {
                            oQueryParams.from = oTRValue.absoluteValue.from;
                            oQueryParams.to = oTRValue.absoluteValue.to;
                        }
                        oQueryParams.focus = oGraphSettings.getFocus();
                        oQueryParams.top = oGraphSettings.getTop();
                        oQueryParams.extraDims = oGraphSettings.getExtraGraphDims();
                        this._oGraphSettingsDialog.close();
                        sap.secmon.ui.m.commons.NavigationService.openFieldsOfAttention(oQueryParams);
                    }, this ]
                }), new sap.m.Button({
                    text : oTextBundle.getText("Commons_Cancel"),
                    press : [ function(oEvent) {
                        this._oGraphSettingsDialog.close();
                    }, this ]
                }) ],
                beforeOpen : [ function(oEvent) {
                    var oQueryParams = this.getView().getModel().getProperty("/queryParams");
                    var oGraphSettings = this._oGraphSettingsDialog.getContent()[0];
                    var sTRType = "Relative";
                    var oTRValue = {
                        showUTC : this.getComponent().getModel("applicationContext").getProperty("/UTC")
                    };
                    if (oQueryParams.hasOwnProperty("relativeTime")) {
                        oTRValue.relativeValue = oQueryParams.relativeTime;
                    } else if (oQueryParams.hasOwnProperty("from") && oQueryParams.hasOwnProperty("to")) {
                        sTRType = "Absolute";
                        oTRValue.absoluteValue = {
                            from : oQueryParams.from,
                            to : oQueryParams.to
                        };
                        oTRValue.relativeValue = "";
                    }
                    oGraphSettings.setTRType(sTRType);
                    oGraphSettings.setTRValue(oTRValue);
                    oGraphSettings.setFocus(oQueryParams.focus);
                    oGraphSettings.setTop(oQueryParams.top);
                    var aDims = this.fnGetDims4Focus(oQueryParams.focus);
                    if (oQueryParams.hasOwnProperty("extraDims")) {
                        // aDims = aDims.concat(oQueryParams.extraDims);
                        var aaEntities = sap.ui.getCore().getModel("ConfigModel").getData().config.entities;
                        oQueryParams.extraDims.split(',').forEach(function(sKey) {
                            var oDim = JSON.parse(JSON.stringify(aaEntities[sKey]));
                            oDim.key = sKey;
                            aDims = aDims.concat(oDim);
                        });
                    }
                    oGraphSettings.setGraphDims(aDims);
                }, this ],
                beforeClose : function(oEvent) {
                }
            });
            this._oGraphSettingsDialog.addStyleClass('sapUiSizeCompact');
        }
        this._oGraphSettingsDialog.open();
    },

    onFilterPress : function(oEvent) {
        var oEntityGraph = this.getView().byId("etdEntityGraph");
        if (!this._oGraphFilterRPopover) {
            this._oGraphFilterRPopover = new sap.m.ResponsivePopover({
                placement : sap.m.PlacementType.Bottom,
                title : oTextBundle.getText("MM_XTIT_GFILTER"),
                content : [ new sap.secmon.ui.malimon.foa.ETDEntityGraphFilter({
                    // tokenPressed : function(oEvent) {
                    // oEntityGraph.triggerNodePress(oEvent.getParameters().sNodeId, false);
                    // },
                    top10SelectionChanged : function(oEvent) {
                        oEntityGraph._update(oEvent);
                    }
                }) ],
                modal : false,
                resizable : true,
                beginButton : new sap.m.Button({
                    text : oTextBundle.getText("MM_BUT_Close"),
                    press : [ function() {
                        this._oGraphFilterRPopover.close();
                    }, this ]
                }),
                beforeOpen : [ function(oEvent) {
                    var oTable = this._oGraphFilterRPopover.getContent()[0].mAggregations.control.getItems()[1];

                    // reset the column name, based on the role of the focus
                    var oConfigModel = sap.ui.getCore().getModel("ConfigModel");
                    var aGraphFocus = oConfigModel.getProperty("/config/focus");
                    var index = 0;
                    if (this._oGraphSettingsDialog) {
                        var oGraphSettings = this._oGraphSettingsDialog.getContent()[0];
                        index = oGraphSettings._oFocusRGrp.getSelectedIndex();
                    }
                    var name = aGraphFocus[index].name;
                    oTable.getColumns()[0].getHeader().setText(name);

                    var aSelected = sap.ui.getCore().getModel("Top10Model").getProperty("/selected");
                    aSelected.forEach(function(oSelectedItem) {
                        var items = oTable.getItems();
                        items.forEach(function(item) {
                            var oModel = item.oBindingContexts.Top10Model;
                            var id = oModel.getProperty(oModel.sPath).id;
                            if (id === oSelectedItem.id) {
                                oTable.setSelectedItem(item, true);
                            }
                        });
                    });
                }, this ],

            });
            this._oGraphFilterRPopover.addStyleClass('sapUiSizeCompact').addStyleClass('sapEtdPopoverTransparent');
        }
        if (this._oGraphFilterRPopover.isOpen()) {
            this._oGraphFilterRPopover.close();
        } else {
            this._oGraphFilterRPopover.openBy(oEvent.getSource());
        }
    },

    onLegendPress : function(oEvent) {
        if (!this._oGraphLegendRPopover) {
            this._oGraphLegendRPopover = new sap.m.ResponsivePopover({
                placement : sap.m.PlacementType.Bottom,
                title : oTextBundle.getText("MM_TIT_GLEGEND"),
                content : [ new sap.secmon.ui.malimon.foa.ETDEntityGraphLegend({}) ],
                modal : false,
                resizable : true
            });
            this._oGraphLegendRPopover.addStyleClass('sapUiSizeCompact').addStyleClass('sapEtdPopoverTransparent');
        }
        if (this._oGraphLegendRPopover.isOpen()) {
            this._oGraphLegendRPopover.close();
        } else {
            this._oGraphLegendRPopover.openBy(oEvent.getSource());
        }
    },

    onNodePress : function(oEvent) {
        var oEntityGraph = this.getView().byId("etdEntityGraph");
        var oLastSelectedNode = oEvent.getParameters().node;
        oEntityGraph.setLastSelectedNode(oLastSelectedNode);

        switch (oLastSelectedNode.type) {
        case sap.secmon.ui.malimon.Constants.C_TYPE.INVESTIGATION:
            var sInvestigationId = oEvent.getParameter("node").id.split("Investigation:")[1];
            var sUrl = sap.secmon.ui.m.commons.NavigationService.investigationURL(sInvestigationId);
            window.open(sUrl);
            break;
        case sap.secmon.ui.malimon.Constants.C_TYPE.ALERT:
            sap.secmon.ui.m.commons.NavigationService.openEventSeries(undefined, undefined, [ oLastSelectedNode.name ]);
            break;
        case sap.secmon.ui.malimon.Constants.C_TYPE.PATTERN:
            sap.secmon.ui.m.commons.NavigationService.openEventSeries(undefined, undefined, oEvent.getParameters().alerts);
            break;
        default:
            if (oLastSelectedNode.name === sap.secmon.ui.browse.Constants.C_VALUE.NULL) {
                return;
            }
            var sFrom, sTo;
            var oQueryParams = this.getView().getModel().getProperty("/queryParams");
            if (oQueryParams.hasOwnProperty("relativeTime")) {
                var now = new Date();
                sTo = sap.secmon.ui.browse.utils.formatDateTime(now);
                var oTimeRanges = sap.ui.getCore().getModel("TimeRangeModel").getData();
                var iOffset = 0;
                for (var i = 0; i < oTimeRanges.length; i++) {
                    if (oTimeRanges[i].key === oQueryParams.relativeTime) {
                        iOffset = oTimeRanges[i].ms;
                        break;
                    }
                }
                sFrom = sap.secmon.ui.browse.utils.formatDateTime(new Date(now.getTime() - iOffset));
            } else if (oQueryParams.hasOwnProperty("from") && oQueryParams.hasOwnProperty("to")) {
                sFrom = oQueryParams.from;
                sTo = oQueryParams.to;
            }
            sap.secmon.ui.m.commons.NavigationService.openEventSeries(sFrom, sTo, oEvent.getParameters().alerts, undefined, (oLastSelectedNode.fieldName + "=" + oLastSelectedNode.name));
        }
    },
});