/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.Chart");

$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.browse.AjaxCache");
$.sap.require("sap.secmon.ui.browse.Donut");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.commons.Formatter");
$.sap.require("sap.ui.model.odata.CountMode");
$.sap.require("sap.viz.ui5.Column");
$.sap.require("sap.viz.ui5.Line");

sap.ui.core.Control.extend("sap.secmon.ui.browse.Chart",
        {

            metadata : {
                properties : {
                    height : {
                        type : "sap.ui.core.CSSSize",
                        defaultValue : "100%"
                    },
                    width : {
                        type : "sap.ui.core.CSSSize",
                        defaultValue : "100%"
                    },
                    refreshMode : {
                        type : "object",
                        defaultValue : {
                            mode : {
                                type : "string",
                                defaultValue : "none" // none | onDMChange | periodic
                            },
                            interval : { // only for periodic
                                type : "int",
                                defaultValue : "60000" // 1 minute
                            }
                        }
                    },
                    artifactLuid : {
                        type : "int",
                        defaultValue : 0
                    },
                    fullScreen : {
                        type : "boolean",
                        defaultValue : false
                    },
                },

                aggregations : {
                    _layout : {
                        type : "sap.ui.commons.layout.BorderLayout",
                        multiple : false,
                    // visibility : "hidden"
                    }
                },

                events : {
                    newFilterSelected : {
                        selectedFilterData : "any"
                    },
                    dimensionChanged : {
                        context : "string", // browsingContext, Log
                        key : "string",
                        name : "string",
                    }
                }
            },

            // TODO: should be replaced by knowledge base
            // define allowed functions for different measure types

            _aFnGeoLocation : [ {
                key : "COUNT",
                text : "COUNT"
            }, {
                key : "DISTANCE",
                text : "DISTANCE"
            } ],

            _aFnMappedByDataType : {
                // *
                "" : [ {
                    key : "COUNT",
                    text : "COUNT"
                } ],

                // TimeStamp
                "ValueTimeStamp" : [ {
                    key : "COUNT",
                    text : "COUNT"
                } /*
                     * , { key : "MAX", text : "MAX" }, { key : "MIN", text : "MIN" }
                     */],

                "ValueVarChar" : [ {
                    key : "COUNT",
                    text : "COUNT"
                }, {
                    key : "MAX",
                    text : "MAX"
                }, {
                    key : "MIN",
                    text : "MIN"
                } ],

                "ValueInteger" : [ {
                    key : "COUNT",
                    text : "COUNT"
                }, {
                    key : "AVG",
                    text : "AVG"
                }, {
                    key : "MAX",
                    text : "MAX"
                }, {
                    key : "MIN",
                    text : "MIN"
                }, {
                    key : "SUM",
                    text : "SUM"
                } ],

                "ValueBigInt" : [ {
                    key : "COUNT",
                    text : "COUNT"
                }, {
                    key : "AVG",
                    text : "AVG"
                }, {
                    key : "MAX",
                    text : "MAX"
                }, {
                    key : "MIN",
                    text : "MIN"
                }, {
                    key : "SUM",
                    text : "SUM"
                } ],
            },

            _fnPeriodicChartRefresher : undefined,
            _oChartTypes : undefined,

            // the current chart;
            // is null if a table-representation is active
            _oCurrentChart : null,
            _oCurrentChartType : undefined,

            // the current table;
            // is null if a chart-representation is active
            _oCurrentTable : null,

            _oChartPopup : undefined,
            _oChartDataOriginal : undefined,
            _oEditMeasureDialog : undefined,
            _oEditDescriptionDialog : undefined,

            _oCreateChartPromise : undefined,
            _actionId : undefined,
            _selectedRow : undefined,

            oDimensionsTable : undefined,

            getMetadataPane : function() {
                return this._layout.getBegin();
            },

            _publishWSChanged : function() {
                sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_WORKSPACE_CHANGED);
            },

            _dynamicSort : function(property, desc) {
                if (desc) {
                    return function(a, b) {
                        if ($.isNumeric(a[property]) && $.isNumeric(b[property])) {
                            return Number(b[property]) - Number(a[property]);
                        } else {
                            return (a[property] > b[property]) ? -1 : (a[property] < b[property]) ? 1 : 0;
                        }
                    };
                }
                return function(a, b) {
                    if ($.isNumeric(a[property]) && $.isNumeric(b[property])) {
                        return Number(a[property]) - Number(b[property]);
                    } else {
                        return (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                    }
                };
            },

            // if one data or multiple data are selected
            // data can be excluded
            _handleSelectData : function(oEvent) {

                // get the selected data parameters (target, data)
                var oChartDataSelected = this._oCurrentChart.selection({
                    "withDataCtx" : true
                });

                var that = this;
                var oFeedModel = this.getModel();

                function add2Path(bExclude) {

                    var oChartData = oFeedModel.getData();
                    var oChartSelectionModel = that._oChartPopup.getModel();
                    var aSelections = oChartSelectionModel.getProperty("/selections");

                    var oSelectedFilterData = {};
                    oSelectedFilterData.key = oChartData.dimensions[0].key;
                    oSelectedFilterData.displayName = oChartData.dimensions[0].name;
                    oSelectedFilterData.description = "";
                    oSelectedFilterData.dataType = oChartData.dimensions[0].dataType;
                    oSelectedFilterData.filterOperators = oChartData.dimensions[0].filterOperators;
                    oSelectedFilterData.isFieldRef = 0;
                    oSelectedFilterData.valueRange = {};
                    if (bExclude) {
                        oSelectedFilterData.valueRange.exclude = true;
                    }
                    oSelectedFilterData.valueRange.operator = "IN";
                    oSelectedFilterData.valueRange.searchTerms = [];
                    oSelectedFilterData.valueRange.searchTermRefKeys = [];
                    oSelectedFilterData.count = oTextBundle.getText("BrowseCountLoading");

                    var oWorkspaceData = sap.ui.getCore().getModel("WorkspaceModel").getData();
                    var rePath = /Path\d+/g;
                    var reSubset = /Path\d+\.Subset\d+/g;
                    // TODO: add a filter from ref measure
                    if (oChartData.measures[0].startDatasets === undefined || (oChartData.measures[0].startDatasets !== undefined && oChartData.measures[0].startDatasets[0].name === "Workspace")) {
                        $.each(oWorkspaceData.paths, function(index, oPath) {
                            if ($.isEmptyObject(oPath.filters)) {
                                oSelectedFilterData.workspaceContext = "Path" + oPath.luid + ".Subset1";
                                oSelectedFilterData.luid = parseInt(1);
                                return false;
                            }
                        });
                    } else if (rePath.exec(oChartData.measures[0].startDatasets[0].name) !== null) {
                        var sPathLuid = "1";
                        if (reSubset.exec(oChartData.measures[0].startDatasets[0].name) !== null) {
                            var aBuf = oChartData.measures[0].startDatasets[0].name.split(".");
                            var aPath = aBuf[0].split("Path");
                            sPathLuid = aPath[1];
                        } else {
                            var aPathItems = oChartData.measures[0].startDatasets[0].name.split("Path");
                            sPathLuid = aPathItems[1];
                        }
                        var iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData);
                        var sSubsetLuid = sap.secmon.ui.browse.utils.generateLuid(oWorkspaceData.paths[iPathIdx].filters);
                        oSelectedFilterData.workspaceContext = 'Path' + sPathLuid + '.Subset' + sSubsetLuid;
                        oSelectedFilterData.luid = parseInt(sSubsetLuid);
                    }

                    for (var iSel = 0, nSel = aSelections.length; iSel < nSel; iSel++) {
                        var sFilterKey;
                        if (!aSelections[iSel].ctx) {
                            // handle data from Donut
                            sFilterKey = aSelections[iSel][oSelectedFilterData.key];
                        } else {
                            // handle data from UI5 VIZ
                            var obj = aSelections[iSel].ctx[0];
                            for ( var i in obj) {
                                if (obj.hasOwnProperty(i)) {
                                    if (i.indexOf('dii_a1') >= 0) {
                                        var idx = obj[i];
                                        if (sap.secmon.ui.browse.utils.isInteger(idx)) {
                                            sFilterKey = oChartData.chartData.data[idx][oSelectedFilterData.key];
                                        }
                                    }
                                }
                            }
                        }
                        // sFilterKey could be null!
                        // if (sFilterKey)
                        oSelectedFilterData.valueRange.searchTerms.push(sFilterKey);
                    }

                    if (that._oCurrentChart.selection) {
                        that._oCurrentChart.selection();
                    }
                    that.fireNewFilterSelected(oSelectedFilterData);
                }

                var oInlineController = {
                    handleAdd2Path : function() {
                        add2Path();
                    },

                    handleAdd2PathAsExclude : function() {
                        add2Path(true);
                    },

                    handleExcludeData : function() {

                        var oChartData = oFeedModel.getData();
                        if (that._oChartDataOriginal === undefined) {
                            // Make a copy of the data (this seems to be slower:
                            // jQuery.extend(true, {}, obj);)
                            that._oChartDataOriginal = JSON.parse(JSON.stringify(oChartData.chartData.data));
                        }

                        var oModel = that._oChartPopup.getModel();

                        var iRemoved = 0;

                        var aSelections = oModel.getProperty("/selections");
                        if (oChartData.dataExcluded === undefined) {
                            oChartData.dataExcluded = {
                                count : 0
                            };
                        }
                        oChartData.dataExcluded.count += aSelections.length;

                        // data[0].ctx.path:
                        // dii_a1 -> dimension index
                        // mi -> measure index
                        $.each(aSelections, function(index, oSelection) {
                            if (!oSelection.ctx) {
                                // handle data from Donut
                                var idx = oChartData.chartData.data.indexOf(oSelection);
                                if (idx !== -1) {
                                    // delete oChartData.chartData.data[idx];
                                    oChartData.chartData.data.splice(idx, 1);
                                    iRemoved++;
                                }
                            } else {
                                var oSelPath = oSelection.ctx[0];

                                var idxDim = -1;
                                var idxMeas = -1;

                                for ( var i in oSelPath) {
                                    if (oSelPath.hasOwnProperty(i)) {
                                        // dimension index
                                        if (i.indexOf('dii_a1') >= 0) {
                                            idxDim = oSelPath[i];
                                        }
                                        // measure index
                                        if (i.indexOf('mi') >= 0) {
                                            idxMeas = oSelPath[i];
                                        }
                                    }
                                }
                                if (sap.secmon.ui.browse.utils.isInteger(idxDim) && sap.secmon.ui.browse.utils.isInteger(idxMeas)) {
                                    // remove the data item
                                    // oChartData.measures[idxMeas].alias is the
                                    // property
                                    // name of the selected measure
                                    delete oChartData.chartData.data[idxDim][oChartData.measures[idxMeas].alias];

                                    iRemoved++;
                                } else {
                                    // throw exception!
                                }
                            }

                        });

                        // bForceUpdate must be set to true!?
                        oFeedModel.refresh(true);

                    },

                    // Copy the values (w/o count) to the clipboard
                    // so that user paste data to other apps
                    // with CTRL/Cmd + V
                    handleCopy2Clipboard : function() {
                        var oChartData = oFeedModel.getData();
                        var oChartSelectionModel = that._oChartPopup.getModel();
                        var aSelections = oChartSelectionModel.getProperty("/selections");

                        var sCopiedText = "";
                        var sCount = "";
                        aSelections.forEach(function(oSel, i) {
                            if (i) {
                                sCopiedText += ". \r\n";
                            }
                            oChartData.dimensions.forEach(function(oDim, j) {
                                if (j) {
                                    sCopiedText += "; \r\n";
                                }
                                var oSelData = oSel;
                                if (oSel.ctx) {
                                    var oSelPath = oSel.ctx[0];

                                    var idxDim = -1;
                                    var idxMeas = -1;

                                    for ( var i in oSelPath) {
                                        if (oSelPath.hasOwnProperty(i)) {
                                            // dimension index
                                            if (i.indexOf('dii_a1') >= 0) {
                                                idxDim = oSelPath[i];
                                            }
                                            // measure index
                                            if (i.indexOf('mi') >= 0) {
                                                idxMeas = oSelPath[i];
                                            }
                                        }
                                    }
                                    if (sap.secmon.ui.browse.utils.isInteger(idxDim) && sap.secmon.ui.browse.utils.isInteger(idxMeas)) {
                                        oSelData = oChartData.chartData.data[idxDim];
                                    } else {
                                        // throw exception!
                                    }
                                }
                                sCopiedText += oDim.name + ": " + oSelData[oDim.key];
                            });

                            sCount += ". \r\n";
                            oChartData.measures.forEach(function(oMea, k) {
                                if (k) {
                                    sCount += "; \r\n";
                                }
                                var oSelData = oSel;
                                if (oSel.ctx) {
                                    var oSelPath = oSel.ctx[0];

                                    var idxDim = -1;
                                    var idxMeas = -1;

                                    for ( var i in oSelPath) {
                                        if (oSelPath.hasOwnProperty(i)) {
                                            // dimension index
                                            if (i.indexOf('dii_a1') >= 0) {
                                                idxDim = oSelPath[i];
                                            }
                                            // measure index
                                            if (i.indexOf('mi') >= 0) {
                                                idxMeas = oSelPath[i];
                                            }
                                        }
                                    }
                                    if (sap.secmon.ui.browse.utils.isInteger(idxDim) && sap.secmon.ui.browse.utils.isInteger(idxMeas)) {
                                        oSelData = oChartData.chartData.data[idxDim];
                                    } else {
                                        // throw exception!
                                    }
                                }
                                sCount += "Count : " + oSelData[oMea.alias];
                            });

                        });
                        var aux = document.createElement("input");
                        aux.setAttribute("value", sCopiedText + sCount);
                        document.body.appendChild(aux);
                        aux.select();
                        document.execCommand("copy");

                        document.body.removeChild(aux);
                    }
                };
                // create popover
                if (!this._oChartPopup) {
                    this._oChartPopup = sap.ui.xmlfragment("ppoChartSelection", "sap.secmon.ui.browse.ChartPopup", oInlineController);

                    // we have to pass some data into popover
                    this._oChartPopup.setModel(new sap.ui.model.json.JSONModel());
                }

                // set the data to the popover
                this._oChartPopup.getModel().setData({
                    selections : oChartDataSelected,
                    excluded : this._oChartDataOriginal !== undefined
                });

                var oUIModel = this.getModel("UIModel");
                var oPopupModel = this._oChartPopup.getModel();
                var oPopupModelData = oPopupModel.getData();

                // first element - Count of Events
                // second element - One of selected data
                // If grouping > one element, dont show exlude/include options
                if (oChartDataSelected[0] && oChartDataSelected[0].data && Object.keys(oChartDataSelected[0].data).length > 2) {
                    oPopupModelData.add2PathVisible = oPopupModelData.editChartTypeVisible = false;
                } else {
                    oPopupModelData.add2PathVisible = oUIModel.getProperty("/add2PathVisible");
                    oPopupModelData.editChartTypeVisible = oUIModel.getProperty("/editChartTypeVisible"); // TODO:exclude
                }

                oPopupModel.setData(oPopupModelData);

                // sync compact style
                var oCurrDataSelected = oEvent.getParameter("data");
                var oLastSelectedData = oCurrDataSelected[oCurrDataSelected.length - 1];

                jQuery.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), this._oChartPopup);

                // open the popover
                this._oChartPopup.setModel(this.getModel("i18n"), "i18n");

                if (event && (event.ctrlKey || event.metaKey)) {
                    add2Path();
                } else {
                    this._oChartPopup.openBy(oLastSelectedData.target);
                }
            },

            _oSQLFnModel : undefined,

            init : function() {

                // Time Locale Model
                // sap.secmon.ui.browse.utils.createApplicationContextModelSync();

                sap.ui.model.Sorter.prototype.fnCompare = function(a, b) {
                    if ($.isNumeric(a) && $.isNumeric(b)) {
                        return Number(a) - Number(b);
                    } else {
                        if (a < b) {
                            return -1;
                        }
                        if (a > b) {
                            return 1;
                        }
                        // names must be equal
                        return 0;
                    }
                };

                var aColorPalette =
                        [ '#748CB2', '#9CC677', '#EACF5E', '#F9AD79', '#D16A7C', '#8873A2', '#3A95B3', '#B6D949', '#FDD36C', '#F47958', '#A65084', '#0063B1', '#0DA841', '#FCB71D', '#F05620',
                                '#B22D6E', '#3C368E', '#8FB2CF', '#95D4AB', '#EAE98F', '#F9BE92', '#EC9A99', '#BC98BD', '#1EB7B2', '#73C03C', '#F48323', '#EB271B', '#D9B5CA', '#AED1DA', '#DFECB2',
                                '#FCDAB0', '#F5BCB4' ];

                var oUIModel = new sap.ui.model.json.JSONModel();
                this.setModel(oUIModel, "UIModel");

                var oFeedModel = new sap.ui.model.json.JSONModel();
                this.setModel(oFeedModel);
                var aFnMap = this._aFnMappedByDataType[""];
                this._oSQLFnModel = new sap.ui.model.json.JSONModel();
                this._oSQLFnModel.setData({
                    items : aFnMap,
                });

                var oChartTitleTF = new sap.ui.commons.TextView({
                    text : "{/name}",
                    tooltip : "{/name}",
                    textAlign : sap.ui.core.TextAlign.Center,
                    maxLength : 60,
                    width : {
                        path : "/name",
                        formatter : function(sVal) {
                            if (sVal) {
                                // limit the width
                                var temp = Math.floor(sVal.length / 10);
                                return sVal.length - temp + "em";
                            } else {
                                return "auto";
                            }
                        }
                    }
                }).addStyleClass("sapEtdTitle");

                // var oChartTitleEdit = new sap.ui.commons.InPlaceEdit({
                // content : oChartTitleTF,
                // undoEnabled : false, // TODO
                // }).addStyleClass("sapEtdTitle");

                var oToolbar1 = new sap.ui.commons.Toolbar({
                    design : "Standard",
                    items : [ new sap.ui.commons.Button({
                        enabled : {
                            path : "/artifactId",
                            formatter : function(sVal) {
                                return sVal !== undefined;
                            }
                        },
                        lite : true,
                        icon : sap.ui.core.IconPool.getIconURI("add-photo"),
                        tooltip : "{i18n>BU_AddSnapshot}",
                        visible : "{applicationContext>/userPrivileges/snapshotWrite}",
                        press : [ function(oEvent) {
                            // this._handleAddSnapshot(oEvent);
                            this._handleAdd2Snapshot(oEvent);
                        }, this ]
                    }), oChartTitleTF, new sap.ui.commons.Button({
                        lite : true,
                        icon : sap.ui.core.IconPool.getIconURI("edit"),
                        visible : "{applicationContext>/userPrivileges/workspaceWrite}",
                        tooltip : "{i18n>BU_Chart_EditTitle}",
                        press : [ function(oEvent) {
                            this._handleEditTitle(oEvent);
                        }, this ]
                    }), new sap.ui.commons.Button({
                        lite : true,
                        icon : sap.ui.core.IconPool.getIconURI("document-text"),
                        visible : "{applicationContext>/userPrivileges/workspaceWrite}",
                        tooltip : "{i18n>BU_Chart_Description}",
                        press : [ function(oEvent) {
                            this._handleEditDescription(oEvent);
                        }, this ]
                    }) ],
                    visible : "{UIModel>/editChartTitleVisible}"
                });

                var that = this;
                this._oChartTypes = new sap.ui.commons.SegmentedButton({
                    visible : "{UIModel>/editChartTypeVisible}",
                    buttons : [ new sap.ui.commons.Button({
                        lite : true,
                        tooltip : "{i18n>BU_Chart_Column}",
                        icon : sap.ui.core.IconPool.getIconURI("vertical-bar-chart")
                    }).data("key", sap.secmon.ui.browse.Constants.C_CHART_TYPE.COLUMN), new sap.ui.commons.Button({
                        lite : true,
                        tooltip : "{i18n>BU_Chart_BarChart}",
                        icon : sap.ui.core.IconPool.getIconURI("horizontal-bar-chart")
                    }).data("key", sap.secmon.ui.browse.Constants.C_CHART_TYPE.BAR), new sap.ui.commons.Button({
                        enabled : {
                            path : "/measures",
                            formatter : function(aVals) {
                                return aVals ? aVals.length < 2 : false;
                            }
                        },
                        lite : true,
                        tooltip : "{i18n>BU_Chart_Treemap}",
                        icon : sap.ui.core.IconPool.getIconURI("upstacked-chart")
                    }).data("key", sap.secmon.ui.browse.Constants.C_CHART_TYPE.TREEMAP), new sap.ui.commons.Button({
                        lite : true,
                        tooltip : "{i18n>BU_Chart_Line}",
                        icon : sap.ui.core.IconPool.getIconURI("line-charts")
                    }).data("key", sap.secmon.ui.browse.Constants.C_CHART_TYPE.LINE), new sap.ui.commons.Button({
                        enabled : {
                            path : "/measures",
                            formatter : function(aVals) {
                                return aVals ? aVals.length < 2 : false;
                            }
                        },
                        lite : true,
                        tooltip : "{i18n>BU_Chart_Pie}",
                        icon : sap.ui.core.IconPool.getIconURI("pie-chart")
                    }).data("key", sap.secmon.ui.browse.Constants.C_CHART_TYPE.DONUT), new sap.ui.commons.Button({
                        lite : true,
                        tooltip : "{i18n>BU_Chart_Table}",
                        icon : sap.ui.core.IconPool.getIconURI("table-chart")
                    }).data("key", sap.secmon.ui.browse.Constants.C_CHART_TYPE.TABLE) ],
                    select : function(oEvent) {
                        $.each(oEvent.getSource().getButtons(), function(index, oButton) {
                            if (oButton.sId === oEvent.getParameters().selectedButtonId) {
                                that._chartTypeChanged(oButton.data("key"));
                                that._publishWSChanged();
                            }
                        });
                    }
                });

                var oExcludedData = new sap.ui.commons.TextView({
                    visible : {
                        path : "/dataExcluded",
                        formatter : function(oVal) {
                            return oVal !== undefined;
                        }
                    },
                    text : {
                        path : "/dataExcluded/count",
                        mode : sap.ui.model.BindingMode.TwoWay,
                        type : new sap.ui.model.type.String(),
                        formatter : function(iVal) {
                            return oTextBundle.getText("BU_MSG_ExcludedItems", iVal);
                        }
                    },
                });

                var oResetExcludedData = new sap.ui.commons.Button({
                    visible : {
                        path : "/dataExcluded",
                        formatter : function(oVal) {
                            return oVal !== undefined;
                        }
                    },
                    icon : sap.ui.core.IconPool.getIconURI("undo"),
                    text : "{i18n>BU_BUT_Reset}",
                    press : [ function(oEvent) {
                        if (this._oChartDataOriginal === undefined) {
                            return;
                        }

                        var oFeedModel = this.getModel();
                        delete oFeedModel.getData().dataExcluded;

                        oFeedModel.getData().chartData.data = JSON.parse(JSON.stringify(this._oChartDataOriginal));
                        delete this._oChartDataOriginal;

                        oFeedModel.refresh(false);
                    }, this ]
                });

                this._toolbar2 = new sap.ui.commons.Toolbar({
                    visible : "{UIModel>/editChartTypeVisible}",
                    design : "Standard",
                    items : [ this._oChartTypes, oExcludedData, oResetExcludedData ],

                    rightItems : [ new sap.ui.commons.Button({
                        lite : true,
                        visible : {
                            path : "UIModel>/hideFullscreen",
                            formatter : function(value) {
                                if (value === true) {
                                    return false;
                                } else {
                                    return true;
                                }
                            }
                        },
                        icon : {
                            path : "UIModel>/fullScreen",
                            formatter : function(value) {
                                if (value) {
                                    return sap.ui.core.IconPool.getIconURI("exit-full-screen");
                                } else {
                                    return sap.ui.core.IconPool.getIconURI("full-screen");
                                }
                            }
                        },
                        tooltip : {
                            path : "UIModel>/fullScreen",
                            formatter : function(value) {
                                if (value) {
                                    return oTextBundle.getText("BU_TOL_Restore");
                                } else {
                                    return oTextBundle.getText("BU_TOL_Expand");
                                }
                            }
                        },
                        press : [ function(oEvent) {
                            if (this.getFullScreen()) {
                                this.setFullScreen(false);
                                this.getModel("UIModel").setProperty("/fullScreen", false);
                                this._publishExitFullScreen();
                            } else {
                                this.setFullScreen(true);
                                this.getModel("UIModel").setProperty("/fullScreen", true);
                                this._publishExpandChart();
                            }
                        }, this ]
                    }) ]
                });

                var oBrowseDimension = new sap.m.ComboBox({
                    width : "320px",
                    selectedKey : "{/dimensions/0/key}",
                    items : {
                        path : "DimensionsModel>/data/",
                        // templateShareable : false,
                        template : new sap.ui.core.ListItem({
                            key : "{DimensionsModel>key}",
                            text : {
                                path : "DimensionsModel>displayName",
                                formatter : function(sDisplayName){
                                  return sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(this, sDisplayName, sDisplayName);
                                }
                            },
                            tooltip : {
                                path : "DimensionsModel>description",
                                formatter : function(sDescription){
                                    return sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(this, sDescription, sDescription);
                                  }
                            }, 
                            enabled : {
                                path : 'DimensionsModel>key',
                                formatter : this.formatDimensionItem
                            }
                        }),
                        templateShareable : false
                    },
                    selectionChange: [function (oEvent) {
                        var oSource = oEvent.getSource();
                        var sKey = oSource.getSelectedKey();
                        if (!(sKey && sKey.length > 0)) { return; }

                        var oSelectedItem = oEvent.getSource().getSelectedItem();
                        this.timestampedAttributesCheck(oSelectedItem);

                        var oFeed = this.getModel().getData();
                        var sPathSelectedDim = oSelectedItem.getBindingContext('DimensionsModel').getPath();
                        var oDimensionsModel = sap.ui.getCore().getModel("DimensionsModel");
                        var oSelectedField = oDimensionsModel.getProperty(sPathSelectedDim);

                        oFeed.dimensions[0].context = oFeed.measures[0].context;
                        oFeed.dimensions[0].key = oSelectedField.key;
                        oFeed.dimensions[0].name = oSelectedField.displayName;
                        oFeed.dimensions[0].filterOperators = oSelectedField.filterOperators;
                        oFeed.dimensions[0].dataType = oSelectedField.dataType;

                        this.handleFeedsChanged();
                        this.fireDimensionChanged({
                            context: oFeed.dimensions[0].context,
                            key: oFeed.dimensions[0].key,
                            name: oFeed.dimensions[0].name
                        });

                    }, this]
                });

                var oChartDimensionEditor = new sap.m.Toolbar({
                    design : "Transparent",
                    content : [ oBrowseDimension ],
                    visible : "{UIModel>/editChartDimension}"
                });

                var oAddDimensionLink = new sap.m.Link({
                    text : "{i18n>BU_LBL_NewDimension}",
                    tooltip : "{i18n>BU_TOL_NewDimension}",
                    enabled : {
                        path : "/dimensions",
                        formatter : function(aVals) {
                            var bEditable = true;
                            if (aVals && aVals.length > 0) {
                                $.each(aVals, function(idx, oVal) {
                                    if (!oVal.key) {
                                        bEditable = false;
                                        return false;
                                    }
                                });
                            }
                            return bEditable;
                        }
                    },
                    press : [ function(oEvent) {
                        this._actionId = oEvent.getId();
                        this._onOpenPopover();
                        this._publishWSChanged();
                    }, this ]
                });

                var oMeasureRowTemplate = new sap.ui.commons.layout.MatrixLayout({
                    columns : 4,
                    widths : [ "110px", "24px", "24px", "24px" ],
                    width : "100%",
                    rows : [ new sap.ui.commons.layout.MatrixLayoutRow({
                        cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                            content : new sap.ui.commons.Label({
                                text : "{displayName}"
                            }).addCustomData(new sap.ui.core.CustomData({
                                key : "color",
                                value : "color"
                            }))
                        }), new sap.ui.commons.layout.MatrixLayoutCell({
                            content : new sap.ui.commons.Button({
                                lite : true,
                                icon : sap.ui.core.IconPool.getIconURI("edit"),
                                tooltip : "{i18n>BU_TOL_EditMeasure}",
                                enabled : {
                                    path : "dummy", // dummy path
                                    formatter : function(sVal) {
                                        return oAddDimensionLink ? oAddDimensionLink.getEnabled() : true;
                                    }
                                },
                                press : [ function(oEvent) {
                                    this._handleEditMeasure(oEvent);
                                }, this ]
                            })
                        }), new sap.ui.commons.layout.MatrixLayoutCell({
                            content : new sap.ui.commons.Button({
                                lite : true,
                                icon : sap.ui.core.IconPool.getIconURI("delete"),
                                tooltip : "{i18n>BU_TOL_DelMeasure}",
                                enabled : {
                                    // path : "/measures",
                                    // formatter : function(aVals) {
                                    // return aVals ? aVals.length > 1 : false;
                                    // }

                                    parts : [ {
                                        path : "/measures"
                                    }, {
                                        path : "luid"
                                    }, {
                                        path : "reference"
                                    } ],

                                    formatter : function(aMeasures, iLuid, oReference) {
                                        var bEnabled = false;
                                        var iNormalMeasureCnt = 0;
                                        if (iLuid) {
                                            if (oReference) {
                                                bEnabled = true;
                                            } else {
                                                $.each(aMeasures, function(idx, oMeasure) {
                                                    if (!oMeasure.reference) {
                                                        iNormalMeasureCnt++;
                                                    }
                                                });
                                                if (iNormalMeasureCnt > 1) {
                                                    bEnabled = true;
                                                } else {
                                                    bEnabled = false;
                                                }
                                            }
                                        }
                                        return bEnabled;
                                    }
                                },
                                press : [ function(oEvent) {
                                    this._handleDeleteMeasure(oEvent);
                                    this._publishWSChanged();
                                }, this ]
                            })
                        }), new sap.ui.commons.layout.MatrixLayoutCell({
                            content : new sap.ui.commons.Button({
                                lite : true,
                                icon : sap.ui.core.IconPool.getIconURI("sorting-ranking"),
                                tooltip : "Sort",
                                press : [ function(oEvent) {
                                    var sPath = oEvent.getSource().getParent().getParent().getParent().getParent().getBindingContext().getPath();
                                    this.sortChartData(sPath);
                                    this.newDataAvailable();
                                }, this ]
                            })
                        }) ]
                    }) ]
                });

                var oMeasuresTable = new sap.ui.table.Table({
                    // width : "180px",
                    visibleRowCount : {
                        path : "/measures",
                        formatter : function(aVals) {
                            if (aVals === undefined) {
                                return 1;
                            } else {
                                return aVals.length;
                            }
                        }
                    },
                    selectionMode : sap.ui.table.SelectionMode.None,
                    columnHeaderVisible : false,
                    columns : [ new sap.ui.table.Column({
                        template : oMeasureRowTemplate
                    }) ]
                });
                oMeasuresTable.bindRows("/measures");
                // oMeasuresTable.setModel(this.getModel());

                oMeasuresTable.onAfterRendering = function() {
                    if (sap.ui.table.Table.prototype.onAfterRendering) {
                        sap.ui.table.Table.prototype.onAfterRendering.call(this);
                    }

                    $.each(this.getRows(), function(i, oRow) {

                        $.each(oRow.getCells(), function(j, oCell) {

                            $.each(oCell.getRows(), function(k, oMatrixRow) {

                                $.each(oMatrixRow.getCells(), function(l, oMatrixCell) {

                                    $.each(oMatrixCell.getContent(), function(m, oLabel) {

                                        $.each(oLabel.getCustomData(), function(n, oCustomData) {

                                            if (oCustomData.getKey() === "color") {
                                                var oBox = $('<div class="legendBox"></div>');
                                                oBox.css("background-color", aColorPalette[i]);
                                                oBox.css("width", "12px");
                                                oBox.css("height", "12px");
                                                oLabel.$().before(oBox);
                                                return false;
                                            }
                                        });
                                        oLabel.$().css("font-size", "12px");
                                    });
                                });
                            });
                        });
                    });
                };

                // dimensions
                this.oDimensionsTable = new sap.ui.table.Table({
                    // width : "180px",
                    visibleRowCount : {
                        path : "/dimensions",
                        formatter : function(aVals) {
                            if (aVals === undefined) {
                                return 1;
                            } else {
                                return aVals.length;
                            }
                        }
                    },
                    selectionMode : sap.ui.table.SelectionMode.None,
                    columnHeaderVisible : false,
                    columns : [ new sap.ui.table.Column({
                        template : new sap.m.Input({
                            tooltip : {
                                    path : "name",
                                    formatter : function(sDisplayName){
                                        return sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(this, sDisplayName, sDisplayName);
                                      }
                                    },
                            width : "130px",
                            selectedKey : "{key}",
                            inputType : Text,
                            type : sap.m.InputType.Text,
                            value : {
                                path : "name",
                                formatter : function(sDisplayName){
                                    return sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(this, sDisplayName, sDisplayName);
                                  }
                                },
                            enabled : true,
                            editable : true,
                            showValueHelp : true,
                            valueHelpOnly : true,
                            valueHelpRequest : [ function(oEvent) {
                                this._selectedRow = oEvent.getParameters().id;
                                this._actionId = oEvent.getId();
                                this._onOpenPopover();                       
                                this._publishWSChanged();
                            }, this]     
                           
                        })
                    }), new sap.ui.table.Column({
                        width : "26px",
                        template : new sap.ui.commons.Button({
                            lite : true,
                            icon : sap.ui.core.IconPool.getIconURI("delete"),
                            tooltip : "{i18n>BU_TOL_DelDimension}",
                            enabled : {
                                path : "key",
                                formatter : function(sVal) {
                                    return this.getParent().getParent().getColumns()[0].getTemplate().getEditable();
                                    // return
                                    // this.getParent().getParent().getCells()[0].getContent()[0].getEditable();
                                }
                            },
                            press : [ function(oEvent) {
                                this._handleDimensionDelete(oEvent);
                                // this._publishWSChanged();
                            }, this ]
                        })
                    }), new sap.ui.table.Column({
                        width : "26px",
                        template : new sap.ui.commons.Button({
                            lite : true,
                            icon : sap.ui.core.IconPool.getIconURI("sorting-ranking"),
                            tooltip : "Sort",
                            enabled : {
                                path : "key",
                                formatter : function(sVal) {
                                    return this.getParent().getParent().getColumns()[0].getTemplate().getEditable();
                                }
                            },
                            press : [ function(oEvent) {
                                var sPath = oEvent.getSource().getBindingContext().getPath();
                                this.sortChartData(sPath);
                                this.newDataAvailable();
                            }, this ]
                        })
                    }) ]
                }).toggleStyleClass("sapEtdDimTable");
                this.oDimensionsTable.bindRows("/dimensions");

                var oAddRef2MeasureLink = new sap.m.Link({
                    text : "{i18n>BU_LBL_NewRef2Measure}",
                    tooltip : "{i18n>BU_TOL_NewRef2Measure}",
                    press : [ function(oEvent) {
                        this._handleAddRef2Measure(oEvent);
                        this._publishWSChanged();
                    }, this ]
                });

                this._layout = new sap.ui.commons.layout.BorderLayout({
                    width : "100%",
                    height : "100%",
                    top : new sap.ui.commons.layout.BorderLayoutArea({
                        size : "70px",
                        contentAlign : "center",
                        content : [ oToolbar1, this._toolbar2, oChartDimensionEditor ]
                    }),
                    begin : new sap.ui.commons.layout.BorderLayoutArea({
                        size : "214px", // because of scrollbar
                        contentAlign : "left",
                        visible : "{UIModel>/editDMVisible}",
                        content : [ new sap.ui.layout.form.SimpleForm({
                            content : [ new sap.ui.commons.Label({
                                text : "{i18n>BU_LBL_Measures}"
                            }), oMeasuresTable, oAddRef2MeasureLink, new sap.ui.commons.Label({
                                text : "{i18n>BU_LBL_Dimensions}"
                            }), that.oDimensionsTable, oAddDimensionLink ]
                        }) ]
                    }),
                    center : new sap.ui.commons.layout.BorderLayoutArea({
                        contentAlign : "center",
                        visible : true,
                        content : [ this._oCurrentChart ]
                    }).setOverflowY("hidden").addStyleClass("sapCenterDiv")
                });
                this.setAggregation("_layout", this._layout);
            },

            _handleAdd2Snapshot : function(oEvent) {
                var that = this;
                var snapshotList = new sap.ui.xmlview({
                    viewName : "sap.secmon.ui.snapshot.ui.SnapshotPageList"
                });
                snapshotList.oController._setRefreshMode("onForensicLab");
                snapshotList.setModel(this.getModel(), "ChartModel");
                snapshotList.setModel(this.getModel("applicationContext"), "applicationContext");

                var oUIModel = this.getModel("UIModel");
                oUIModel.setProperty("/addButtonsEnabled", false);

                var _convert2AbsoluteTimeRange = function(oRelativeTimeRange, dCreatedAt) {
                    var sOperator = oRelativeTimeRange.operartor;

                    if (sOperator === "BETWEEN") {
                        return oRelativeTimeRange;
                    }

                    var period = {};
                    period.operator = "BETWEEN";
                    period.searchTerms = [];

                    var dEndTimestamp = dCreatedAt || new Date(Date.now());
                    period.searchTerms.push("/Date(" + Date.parse(dEndTimestamp) + ")/");
                    var aTimeList = sap.ui.getCore().getModel("TimeRangeModel").getData();
                    var iMillSec = 0;
                    aTimeList.some(function(oTime) {
                        if (oTime.key === oRelativeTimeRange.searchTerms[0]) {
                            iMillSec = oTime.ms;
                            return true;
                        }
                    });
                    period.searchTerms.splice(0, 0, "/Date(" + Date.parse(new Date(dEndTimestamp.getTime() - iMillSec)) + ")/");
                    return period;
                };

                var _convertString2DateTimeRange = function(oStringTimeRange) {
                    return {
                        operator: oStringTimeRange.operartor,
                        searchTerms: [
                            "/Date(" + Date.parse(oStringTimeRange.searchTerms[0]) + ")/",
                            "/Date(" + Date.parse(oStringTimeRange.searchTerms[1]) + ")/"
                        ]
                    };
                };

                if (!this._oAddSnapshotDialog) {
                    this._oAddSnapshotDialog =
                            new sap.m.Dialog({
                                showHeader : false,
                                contentWidth : document.documentElement.clientWidth * 1 / 2 + "px",
                                contentHeight : document.documentElement.clientHeight * 1 / 2 + "px",
                                content : snapshotList,
                                buttons : [
                                        new sap.m.Button({
                                            text : "{i18n>SPL_BUT_AddShow}",
                                            tooltip : "{i18n>SPL_TOL_AddShow}",
                                            enabled : "{ChartUIModel>/addButtonsEnabled}",
                                            press : function() {
                                                // assign the time range of the chart
                                                var oPeriod = that.getModel().getProperty("/period");
                                                var sNow = that.getModel().getProperty("/now");
                                                if (oPeriod.operator === "=") {
                                                    oPeriod = _convert2AbsoluteTimeRange(oPeriod, new Date(sNow));
                                                } else if (oPeriod.operator === "BETWEEN") {
                                                    oPeriod = _convertString2DateTimeRange(oPeriod);
                                                }

                                                var oSnapshotODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/Snapshot.xsodata", {
                                                    json : true,
                                                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                                                });
                                                var aId = snapshotList.getModel("SnapshotPageList").getProperty("/selected");
                                                var aAllItems = snapshotList.getModel("SnapshotPageList").getProperty("/all");
                                                for (var j = 0; j < aId.length; j++) {
                                                    var sId = aId[j];
                                                    aAllItems.forEach(function(oItem, i) {
                                                        var oPageId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oItem.Id);
                                                        if (sId === oPageId && oItem.Type === "Snapshot") {
                                                            var oNewSnapshot = {
                                                                Id : sap.secmon.ui.browse.utils.generateGUID(),
                                                                ChartId : that.getModel().getProperty("/artifactId"),
                                                                ChartFrom : oPeriod.searchTerms[0],
                                                                ChartTo : oPeriod.searchTerms[1],
                                                                ParentId : oPageId,
                                                                Name : that.getModel().getProperty("/name"),
                                                                Type : "Chart"
                                                            };
                                                            oNewSnapshot.SerializedData = JSON.stringify(oNewSnapshot);
                                                            var aSnapshotPage = JSON.parse(oItem.SerializedData);
                                                            if (aSnapshotPage.snapshots) {
                                                                aSnapshotPage.snapshots.push(oNewSnapshot);
                                                            } else {
                                                                aSnapshotPage.snapshots = [ oNewSnapshot ];
                                                            }
                                                            oItem.SerializedData = JSON.stringify(aSnapshotPage);

                                                            oNewSnapshot.Id = sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(oNewSnapshot.Id);
                                                            oNewSnapshot.ParentId = sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(oNewSnapshot.ParentId);
                                                            oNewSnapshot.ChartId = sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(oNewSnapshot.ChartId);
                                                            oSnapshotODataModel.create("/Snapshot", oNewSnapshot, {
                                                                success : function(oResult1, oResponse1) {
                                                                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle
                                                                            .getText("BU_MSG_ChartToSnapshot"));
                                                                },
                                                                error : function(oError) {
                                                                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_QubeIdNotFound", sId), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                                                            .getText("BU_TIT_Workspace"), sap.ui.commons.MessageBox.Action.OK);
                                                                }
                                                            });

                                                            // merge the snapshots in SerializedData of SnapshotPage
                                                            oSnapshotODataModel.update("/Snapshot(X'" + sId + "')", {
                                                                SerializedData : oItem.SerializedData
                                                            }, {
                                                                merge : true,
                                                                success : function(oResult1, oResponse1) {
                                                                },
                                                                error : function(oError) {
                                                                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_QubeIdNotFound", sId), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                                                            .getText("BU_TIT_Workspace"), sap.ui.commons.MessageBox.Action.OK);
                                                                }
                                                            });
                                                        }
                                                    });
                                                    var href = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#Snapshot-show&/" + sId;
                                                    window.open(href, '_blank');
                                                    // TODO: navigation
                                                    // var href =
                                                    // "/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html?siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad&sap-language=en#Snapshot-show&/"
                                                    // +
                                                    // sId + "";
                                                    // window.open(href, '_blank');
                                                    // Fiori Launchpad
                                                    // sap.ui.core.UIComponent.getRouterFor(this).navTo("snapshotDetail", {
                                                    // "snapshotId" : sId
                                                    // });
                                                }
                                            }
                                        }),
                                        new sap.m.Button({
                                            text : "{i18n>SPL_BUT_AddReturn}",
                                            tooltip : "{i18n>SPL_TOL_AddReturn}",
                                            enabled : "{ChartUIModel>/addButtonsEnabled}",
                                            press : function() {
                                                // assign the time range of the chart
                                                var oPeriod = that.getModel().getProperty("/period");
                                                var sNow = that.getModel().getProperty("/now");
                                                if (oPeriod.operator === "=") {
                                                    oPeriod = _convert2AbsoluteTimeRange(oPeriod, new Date(sNow));
                                                } else if (oPeriod.operator === "BETWEEN") {
                                                    oPeriod = _convertString2DateTimeRange(oPeriod);
                                                }

                                                var oSnapshotODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/Snapshot.xsodata", {
                                                    json : true,
                                                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                                                });
                                                var aId = snapshotList.getModel("SnapshotPageList").getProperty("/selected");
                                                var aAllItems = snapshotList.getModel("SnapshotPageList").getProperty("/all");
                                                for (var j = 0; j < aId.length; j++) {
                                                    var sId = aId[j];
                                                    aAllItems.forEach(function(oItem, i) {
                                                        var oPageId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oItem.Id);
                                                        if (sId === oPageId && oItem.Type === "Snapshot") {
                                                            var oNewSnapshot = {
                                                                Id : sap.secmon.ui.browse.utils.generateGUID(),
                                                                ChartId : that.getModel().getProperty("/artifactId"),
                                                                ChartFrom : oPeriod.searchTerms[0],
                                                                ChartTo : oPeriod.searchTerms[1],
                                                                ParentId : oPageId,
                                                                Name : that.getModel().getProperty("/name"),
                                                                Type : "Chart"
                                                            };
                                                            oNewSnapshot.SerializedData = JSON.stringify(oNewSnapshot);
                                                            var aSnapshotPage = JSON.parse(oItem.SerializedData);
                                                            if (aSnapshotPage.snapshots) {
                                                                aSnapshotPage.snapshots.push(oNewSnapshot);
                                                            } else {
                                                                aSnapshotPage.snapshots = [ oNewSnapshot ];
                                                            }
                                                            oItem.SerializedData = JSON.stringify(aSnapshotPage);

                                                            oNewSnapshot.Id = sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(oNewSnapshot.Id);
                                                            oNewSnapshot.ParentId = sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(oNewSnapshot.ParentId);
                                                            oNewSnapshot.ChartId = sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(oNewSnapshot.ChartId);
                                                            oSnapshotODataModel.create("/Snapshot", oNewSnapshot, {
                                                                success : function(oResult1, oResponse1) {
                                                                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle
                                                                            .getText("BU_MSG_ChartToSnapshot"));
                                                                },
                                                                error : function(oError) {
                                                                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_QubeIdNotFound", sId), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                                                            .getText("BU_TIT_Workspace"), sap.ui.commons.MessageBox.Action.OK);
                                                                }
                                                            });

                                                            // merge the snapshots in SerializedData of SnapshotPage
                                                            oSnapshotODataModel.update("/Snapshot(X'" + sId + "')", {
                                                                SerializedData : oItem.SerializedData
                                                            }, {
                                                                merge : true,
                                                                success : function(oResult1, oResponse1) {
                                                                },
                                                                error : function(oError) {
                                                                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_QubeIdNotFound", sId), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                                                            .getText("BU_TIT_Workspace"), sap.ui.commons.MessageBox.Action.OK);
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                                that._oAddSnapshotDialog.close();
                                            }
                                        }), new sap.m.Button({
                                            text : "{i18n>SPL_BUT_Close}",
                                            press : function() {
                                                that._oAddSnapshotDialog.close();

                                            }
                                        }) ]
                            });
                    this._oAddSnapshotDialog.setModel(this.getModel("i18n"), "i18n");
                    this._oAddSnapshotDialog.setModel(oUIModel, "ChartUIModel");
                }
                $.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), this._oAddSnapshotDialog);
                this._oAddSnapshotDialog.open();
            },

            _handleEditTitle : function(oEvent) {
                var that = this;
                var oMain = new sap.ui.commons.layout.MatrixLayout({
                    widths : [ "15%", "85%" ],
                    layoutFixed : true,
                    columns : 2
                });

                var oLabelName = new sap.m.Label({
                    text : oTextBundle.getText("BU_LBL_FL_Title"),
                });

                var oInputTitle = new sap.m.Input({
                    value : {
                        path : "/name",
                        formatter : function(sValue) {
                            if (sValue) {
                                return sValue;
                            } else {
                                return "";
                            }
                        }
                    },
                    textAlign : sap.ui.core.TextAlign.Begin,
                }).setModel(this.getModel());

                oMain.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
                    colSpan : 1,
                    content : [ oLabelName ],
                    hAlign : sap.ui.commons.layout.HAlign.End
                }), new sap.ui.commons.layout.MatrixLayoutCell({
                    colSpan : 1,
                    content : [ oInputTitle ],
                    hAlign : sap.ui.commons.layout.HAlign.Begin
                }));

                var oDialog = new sap.m.Dialog({
                    title : oTextBundle.getText("BU_TIT_RenameCurrWSArtifact"),
                    contentWidth : "500px",
                    buttons : [ new sap.m.Button({
                        text : oTextBundle.getText("BU_BUT_OK"),
                        tooltip : oTextBundle.getText("BU_BUT_OK"),
                        enabled : true,
                        press : function(oEvent) {
                            that.getModel().setProperty("/name", oInputTitle.getValue());
                            that._publishWSChanged();
                            sap.ui.getCore().getModel("WorkspaceModel").refresh(true);
                            oDialog.close();
                        }
                    }), new sap.m.Button({
                        text : oTextBundle.getText("BU_BUT_Cancel"),
                        tooltip : oTextBundle.getText("BU_BUT_Cancel"),
                        press : function(oEvent) {
                            oDialog.close();
                        }
                    }) ]
                });

                oDialog.addContent(oMain);
                oDialog.open();
            },

            _handleEditDescription : function(oEvent) {
                var that = this;
                if (!this._oEditDescriptionDialog) {
                    var oDummyController = {
                        closeDialog : function() {
                            that.getModel().setProperty("/description", that._oEditDescriptionDialog.getModel().getProperty("/description"));
                            that._publishWSChanged();
                            that._oEditDescriptionDialog.close();
                        },

                        cancelDialog : function() {
                            that._oEditDescriptionDialog.close();
                        }
                    };
                    this._oEditDescriptionDialog = sap.ui.xmlfragment("dlPDEdit", "sap.secmon.ui.browse.EditDescription", oDummyController);
                    this._oEditDescriptionDialog.setModel(new sap.ui.model.json.JSONModel());
                    this._oEditDescriptionDialog.setModel(this.getModel("i18n"), "i18n");
                }

                this._oEditDescriptionDialog.getModel().setData({
                    description : that.getModel().getProperty("/description")
                });

                this._oEditDescriptionDialog.open();
            },

            _handleAddRef2Measure : function(oEvent) {

                var that = this;
                var oFeed = this.getModel().getData();

                // create the dialog for Add reference measurement
                var oView = sap.secmon.ui.browse.utils.getView();
                var oRefMeasureSelect = new sap.m.ComboBox({
                    selectedKey : "{/reference/luid}",
                    items : {
                        path : "AvailableMeasuresModel>/items",
                        template : new sap.ui.core.ListItem({
                            key : "{AvailableMeasuresModel>luid}",
                            text : "{AvailableMeasuresModel>displayName}",
                        })
                    },
                });
                var oMeasureName = new sap.m.Input({
                    value : "{/displayName}"
                });

                var sTRType = sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_RELATIVE;
                var sRelativeValue = sap.secmon.ui.browse.Constants.C_TIMERANGE.LAST_DAY;
                var sToTS = new Date();
                var sFromTS = new Date(sToTS.getTime() - 24 * 3600 * 1000);

                sToTS = sap.secmon.ui.browse.utils.getDateAsYyyymmddUTC(sToTS) + 'T' + sap.secmon.ui.browse.utils.getTimeAsHHMMSSUTC(sToTS) + 'Z';
                sFromTS = sap.secmon.ui.browse.utils.getDateAsYyyymmddUTC(sFromTS) + 'T' + sap.secmon.ui.browse.utils.getTimeAsHHMMSSUTC(sFromTS) + 'Z';

                var oTimeRangeSelector = new sap.secmon.ui.browse.TimeRange({
                    type : sTRType,
                    visibleTo : false,
                    value : {
                        showUTC : that.getModel('applicationContext').getData().UTC,
                        relativeValue : sRelativeValue,
                        absoluteValue : {
                            from : sFromTS,
                            to : sToTS
                        }
                    },
                    relativeIntervals : {
                        path : "TimeRangeModel>/",
                        template : new sap.ui.base.ManagedObject(),
                        templateShareable : false
                    }
                });

                this._oAddRef2MeasureDialog = new sap.m.Dialog({
                    title : "{i18n>BU_TIT_MeasureRef}",
                    buttons : [ new sap.m.Button({
                        text : "{i18n>BU_BUT_OK}",
                        enabled : true,
                        press : [ function(oEvent) {
                            var oCustomData = oEvent.getSource().getParent().getParent().getCustomData();
                            var bIsNew = oCustomData[0].getValue();
                            if (bIsNew) {
                                this.createRef2MeasureController(true, null, oTimeRangeSelector);
                            } else {
                                var sPath = oCustomData[1].getValue();
                                this.createRef2MeasureController(false, sPath, oTimeRangeSelector);
                            }
                        }, this ]
                    }), new sap.m.Button({
                        text : "{i18n>BU_BUT_Cancel}",
                        enabled : true,
                        press : function(oEvent) {
                            that._oAddRef2MeasureDialog.close();
                        }
                    }) ],
                    content : [ new sap.ui.layout.form.SimpleForm({
                        editable : false,
                        layout : sap.ui.layout.form.SimpleFormLayout.ResponsiveGridLayout,
                        labelSpanL : 4,
                        labelSpanM : 12,
                        emptySpanL : 0,
                        emptySpanM : 0,
                        content : [ new sap.m.Label({
                            text : "{i18n>BU_LBL_MeasRefCompWith}"
                        }), oRefMeasureSelect, new sap.m.Label({
                            text : "{i18n>BU_LBL_CompWithWS}"
                        }), new sap.m.Text({
                            text : {
                                path : "FeedModel>/period",
                                formatter : function(value) {
                                    if (value === undefined) {
                                        return;
                                    }
                                    var bUTC = sap.secmon.ui.browse.utils.getView().getModel("applicationContext").UTC;

                                    return sap.secmon.ui.browse.utils.getSelectedPeriod(value, bUTC);
                                }
                            }
                        }), new sap.m.Label({
                            text : "{i18n>BU_LBL_MeasRefCompFrom}"
                        }), oTimeRangeSelector, new sap.m.Label({
                            text : "{i18n>BU_LBL_MeasureDisplayName}"
                        }), oMeasureName ]
                    }) ],
                });
                oView.addDependent(that._oAddRef2MeasureDialog);

                var oAvailableMeasuresModel = new sap.ui.model.json.JSONModel();
                var aAvailableMeasures = [];

                $.each(oFeed.measures, function(idx, oMeasure) {
                    if (!oMeasure.reference) {
                        var oAvailMeasure = {};
                        oAvailMeasure.displayName = oMeasure.displayName;
                        oAvailMeasure.luid = oMeasure.luid;
                        aAvailableMeasures.push(oAvailMeasure);
                    }
                });

                oAvailableMeasuresModel.setData({
                    items : aAvailableMeasures
                });
                this._oAddRef2MeasureDialog.setModel(oAvailableMeasuresModel, "AvailableMeasuresModel");

                var oRefMeasureModel = new sap.ui.model.json.JSONModel();

                var oTimeRangeData = sap.ui.getCore().getModel("TimeRangeModel").getData();
                var oRefTime = "";
                $.each(oTimeRangeData, function(idx, oTimeRange) {
                    if (oTimeRange.key === sap.secmon.ui.browse.Constants.C_TIMERANGE.LAST_DAY) {
                        oRefTime = oTimeRange.name;
                        return false;
                    }
                });

                oRefMeasureModel.setData({
                    displayName : aAvailableMeasures[0].displayName + " " + oRefTime + " ago",
                    reference : {
                        luid : aAvailableMeasures[0].luid,
                    }
                });
                this._oAddRef2MeasureDialog.setModel(oRefMeasureModel);
                this._oAddRef2MeasureDialog.setModel(this.getModel(), "FeedModel");

                $.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), this._oAddRef2MeasureDialog);
                // add custom data to detemine the mode is "Edit" or "Add"
                this._oAddRef2MeasureDialog.removeAllCustomData();
                this._oAddRef2MeasureDialog.addCustomData(new sap.ui.core.CustomData({
                    key : "bIsNew",
                    value : true
                }));
                this._oAddRef2MeasureDialog.open();
            },

            _handleDeleteMeasure : function(oEvent) {

                var that = this;

                var oFeed = this.getModel().getData();
                var sPath = oEvent.getSource().getParent().getParent().getParent().getParent().getBindingContext().getPath();
                var iMeasIndex = parseInt(sPath.split("/measures/")[1]);
                var sReferences = "";

                $.each(oFeed.measures, function(idx, oMeasure) {
                    if (oMeasure.reference) {
                        if (oMeasure.reference.luid === oFeed.measures[iMeasIndex].luid) {
                            sReferences = sReferences + oMeasure.displayName + ", ";
                        }
                    }
                });
                // remove the last ', '
                sReferences = sReferences.substr(0, sReferences.length - 2);

                if (sReferences === "") {
                    sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_MeasureDelete", oFeed.measures[iMeasIndex].displayName), fnCallbackConfirm, oTextBundle
                            .getText("BU_TIT_MeasureDelete"));
                } else {
                    sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_MeasureRefDel", [ oFeed.measures[iMeasIndex].displayName, sReferences ]), fnCallbackConfirm, oTextBundle
                            .getText("BU_TIT_MeasureRefDelete"));
                }

                function fnCallbackConfirm(bResult) {
                    if (bResult) {
                        // keep the luid to delete the refs && the measure itself
                        var iLuid = oFeed.measures[iMeasIndex].luid;
                        // delete the references to its luid
                        var aRefIndices = [];
                        $.each(oFeed.measures, function(idx, oMeasure) {
                            if (oMeasure.reference) {
                                if (oMeasure.reference.luid === iLuid) {
                                    // aMeasures.splice(idx, 1);
                                    aRefIndices.push(idx);
                                }
                            }
                        });
                        for (var i = 0, len = aRefIndices.length; i < len; i++) {
                            oFeed.measures.splice(aRefIndices[i] - i, 1);
                            if (oFeed.lastSortedBy && oFeed.lastSortedBy.path && oFeed.lastSortedBy.path === ("/measures/" + (aRefIndices[i] - i))) {
                                delete oFeed.lastSortedBy;
                            }
                        }
                        // delete the selected measure
                        $.each(oFeed.measures, function(idx, oMeasure) {
                            if (oMeasure.luid === iLuid) {
                                oFeed.measures.splice(idx, 1);
                                if (oFeed.lastSortedBy && oFeed.lastSortedBy.path && oFeed.lastSortedBy.path === ("/measures/" + idx)) {
                                    delete oFeed.lastSortedBy;
                                }
                                return false;
                            }
                        });
                        that.handleFeedsChanged();
                        that.getModel().refresh(true);
                    }
                }
            },

            _handleDimensionDelete : function(oEvent) {

                var oFeed = this.getModel().getData();
                var sPath = oEvent.getSource().getBindingContext().getPath();
                var iDimIndex = parseInt(sPath.split("/dimensions/")[1]);
                oFeed.dimensions.splice(iDimIndex, 1);
                if (oFeed.lastSortedBy && oFeed.lastSortedBy.path && oFeed.lastSortedBy.path === ("/dimensions/" + iDimIndex)) {
                    delete oFeed.lastSortedBy;
                }

                this.handleFeedsChanged();
                this.getModel().refresh(true);
            },

            _isDimensionSelected : function(oSelectedField) {
                var aVals = this.getModel().getProperty("/dimensions");
                for (var i = 0; aVals && i < aVals.length; i++) {
                    // due to databiding in selectedKey the key cannot be reset to ""
                    // we have to check the name also
                    if (aVals[i].name === oSelectedField.displayName && aVals[i].key === oSelectedField.key) {
                        return true;
                    }
                }
                return false;
            },

            _handleDimensionChange : function(oEvent) {

                var oFeed = this.getModel().getData();
                var sPath = oEvent.getSource().getBindingContext().getPath();
                var iDimIndex = parseInt(sPath.split("/dimensions/")[1]);

                var oSelectedItem = oEvent.getParameters().selectedItem;
                var sPathSelectedDim = oSelectedItem.oBindingContexts.DimensionsModel.sPath;
                var oDimensionsModel = sap.ui.getCore().getModel("DimensionsModel");
                var oSelectedField = oDimensionsModel.getProperty(sPathSelectedDim);

                var sContext = "";
                $.each(oFeed.measures, function(idx, oMeasure) {
                    if (oMeasure.context) {
                        sContext = oMeasure.context;
                        return false;
                    }
                });

                if (!this._isDimensionSelected(oSelectedField)) {
                    oFeed.dimensions[iDimIndex].context = sContext;
                    oFeed.dimensions[iDimIndex].key = oSelectedField.key;
                    oFeed.dimensions[iDimIndex].name = oSelectedField.displayName;
                    oFeed.dimensions[iDimIndex].filterOperators = oSelectedField.filterOperators;
                    oFeed.dimensions[iDimIndex].dataType = oSelectedField.dataType;

                    this.getModel().refresh(true);
                    this.handleFeedsChanged();

                    oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                } else {
                    oFeed.dimensions[iDimIndex].key = "";
                    oFeed.dimensions[iDimIndex].name = "";
                    this.getModel().refresh(true);
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                }

                // // fire the event so that Workspace can update the workspace model
                // this.fireDimensionsChanged({
                // dimensions : oFeed.dimensions
                // });
            },

            _publishExpandChart : function() {
                // Pass reference to this as first entry in event parameters array
                sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXPAND_CHART, [ this ]);
            },

            _publishExitFullScreen : function() {
                // Pass reference to this as first entry in event parameters array
                sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXIT_FULL_SCREEN, [ this ]);
            },

            setRefreshMode : function(oValue) {

                var that = this;
                this.setProperty("refreshMode", oValue);
                if (this.getRefreshMode().mode === 'periodic') {
                    this._refreshChartData();
                    this._fnPeriodicChartRefresher = setInterval(function() {
                        that._refreshChartData();
                    }, that.getRefreshMode().interval);
                } else {
                    clearInterval(this._fnPeriodicChartRefresher);
                }

                var oUIModelData = this.getModel("UIModel").getData();

                switch (this.getRefreshMode().mode) {
                case 'none':
                case 'periodic':
                    oUIModelData.editChartTitleVisible = false;
                    oUIModelData.editChartTypeVisible = false;
                    oUIModelData.editDMVisible = false;
                    oUIModelData.chartTitleVisible = true;
                    oUIModelData.chartLegendVisible = true;
                    oUIModelData.chartPopover = false;
                    oUIModelData.editChartDimension = false;
                    break;
                case 'onDMChange':
                    oUIModelData.editChartTitleVisible = true;
                    oUIModelData.editChartTypeVisible = true;
                    oUIModelData.editDMVisible = true;
                    oUIModelData.chartTitleVisible = false;
                    oUIModelData.chartLegendVisible = false;
                    oUIModelData.chartPopover = true;
                    oUIModelData.add2PathVisible = true;
                    oUIModelData.editChartDimension = false;
                    break;
                case 'onBrowse':
                    oUIModelData.editChartTitleVisible = false;
                    oUIModelData.editChartTypeVisible = false;
                    oUIModelData.editDMVisible = false;
                    oUIModelData.chartTitleVisible = false;
                    oUIModelData.chartLegendVisible = false;
                    oUIModelData.chartPopover = true;
                    oUIModelData.add2PathVisible = true;
                    oUIModelData.editChartDimension = true;
                    break;
                }
                this.getModel("UIModel").setData(oUIModelData);
            },

            handleFeedsChanged : function(context, callback) {

                if ($.isEmptyObject(this.getModel().getData())) {
                    this.newDataAvailable();
                } else {
                    this._refreshChartData(context, callback);
                }
            },

            _abortCreateChart : function() {
                if (this._oCreateChartPromise !== undefined) {
                    this._oCreateChartPromise.abort();
                }
            },

            _refreshChartData : function(context, callback) {

                this._abortCreateChart();

                var that = this;
                var oFeedModelData = this.getModel().getData();
                oFeedModelData.chartData = {};

                // assign now timestamp
                var oWorkspaceModel = sap.ui.getCore().getModel("WorkspaceModel");
                // it could be that property "now" doesn't exist in the model
                if (oWorkspaceModel && oWorkspaceModel.getProperty("/now")) {
                    oFeedModelData.now = oWorkspaceModel.getProperty("/now");
                } else {
                    oFeedModelData.now = sap.secmon.ui.browse.utils.formatDateTime(new Date());
                }

                try {
                    oFeedModelData.verbose = sap.secmon.ui.browse.utils.getController().bDebug;
                } catch (err) {
                }
                try {
                    // load log event from warm storage, but only for log event, not for alerts, configchecks and
                    // TODO
                    oFeedModelData.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;
                } catch (err) {
                }

                if (that._oCurrentChart) {
                    that._oCurrentChart.setBusy(true);
                }

                var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oFeedModelData));
                this._oCreateChartPromise = promise;

                promise.done(function(data, textStatus, XMLHttpRequest) {
                    that._oCreateChartPromise = undefined;
                    // TODO: BE should return always data
                    // var fixedData = {};
                    // if (data.result) {
                    // fixedData.data = data.result;
                    // } else {
                    // fixedData = data;
                    // }
                    oFeedModelData.chartData = data;
                    if (context && callback) {
                        callback.call(context);
                    }
                    that.convertTimes();
                    that.sortChartData();
                    that.newDataAvailable();
                });

                promise.fail(function(jqXHR, textStatus, errorThrown) {
                    that._oCreateChartPromise = undefined;
                    if (that._oCurrentChart) {
                        that._oCurrentChart.setBusy(false);
                    }
                    if (errorThrown !== "abort") {
                        var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                        sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                    }
                });
            },

            convertTimes : function() {
                var oFeedData = this.getModel().getData();
                if (oFeedData.dimensions === undefined || oFeedData.dimensions.length <= 0) {
                    oFeedData.dimensions = [];
                }

                // TODO: convert the times to local/utc values
                var aIndicesOfTimeBasedDims = [];
                $.each(oFeedData.dimensions, function(index, dimension) {
                    if (dimension.dataType === "ValueTimeStamp") {
                        aIndicesOfTimeBasedDims.push(index);
                    }
                });

                var bCarry = false; // GLOBAL, used in fnGetDateTimeLabel
                var that = this;
                var fnGetDateTimeLabel = function(value, from) {
                    var sDate = sap.secmon.ui.commons.Formatter.dateFormatterEx(false, new Date());
                    var sTimeZone = sDate.substring(sDate.indexOf("GMT"));

                    var sDateTime = value;
                    var sWeekDays = "Su, Mo, Tu, We, Th, Fr, Sa";
                    var sMonths = "Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec";
                    var sHours = "";
                    var sMinutes = "";
                    var sSeconds = "";
                    if (sMonths.indexOf(value) >= 0) { // months

                    } else if (sWeekDays.indexOf(value) >= 0) { // weekdays

                    } else if (value.indexOf("h") >= 0) { // hours
                        var iHours = parseInt(value);
                        if (bCarry) {
                            from.setTime(from.getTime() + 24 * 60 * 60 * 1000);
                        }
                        from.setUTCHours(iHours);
                        if (iHours === 23) {
                            bCarry = true;
                        }
                        if (that.getModel('applicationContext').getData().UTC) {
                            sHours = from.getUTCHours();
                            sTimeZone = "UTC";
                        } else {
                            sHours = from.getHours();
                        }
                        sHours = (sHours / 10) >= 1 ? sHours : "0" + sHours;
                        sDateTime = sHours + ":" + "00" + " " + sTimeZone;
                    } else if (value.indexOf("m") >= 0) { // minutes
                        var iMinutes = parseInt(value);
                        if (bCarry) {
                            from.setTime(from.getTime() + 60 * 60 * 1000);
                        }
                        from.setUTCMinutes(iMinutes);
                        if (iMinutes === 59) {
                            bCarry = true;
                        }
                        if (that.getModel('applicationContext').getData().UTC) {
                            sHours = from.getUTCHours();
                            sMinutes = from.getUTCMinutes();
                            sTimeZone = "UTC";
                        } else {
                            sHours = from.getHours();
                            sMinutes = from.getMinutes();
                        }
                        sHours = (sHours / 10) >= 1 ? sHours : "0" + sHours;
                        sMinutes = (sMinutes / 10) >= 1 ? sMinutes : "0" + sMinutes;
                        sDateTime = sHours + ":" + sMinutes + " " + sTimeZone;
                    } else if (value.indexOf("s") >= 0) { // seconds
                        var iSeconds = parseInt(value);
                        if (bCarry) {
                            from.setTime(from.getTime() + 60 * 1000);
                        }
                        from.setUTCSeconds(iSeconds);
                        if (iSeconds === 59) {
                            bCarry = true;
                        }
                        if (that.getModel('applicationContext').getData().UTC) {
                            sHours = from.getUTCHours();
                            sMinutes = from.getUTCMinutes();
                            sSeconds = from.getUTCSeconds();
                            sTimeZone = "UTC";
                        } else {
                            sHours = from.getHours();
                            sMinutes = from.getMinutes();
                            sSeconds = from.getSeconds();
                        }
                        sHours = (sHours / 10) >= 1 ? sHours : "0" + sHours;
                        sMinutes = (sMinutes / 10) >= 1 ? sMinutes : "0" + sMinutes;
                        sSeconds = (sSeconds / 10) >= 1 ? sSeconds : "0" + sSeconds;
                        sDateTime = sHours + ":" + sMinutes + ":" + sSeconds + " " + sTimeZone;
                    } else if (parseInt(value) >= 1 && parseInt(value) <= 31) { // date => when 19.05.2017, then value = 19 ;
                        if (bCarry) {
                            from.setUTCMonth(from.getUTCMonth() + 1);
                        }
                        from.setUTCDate(parseInt(value));
                        from.setUTCHours(0);
                        from.setUTCMinutes(0);
                        from.setUTCSeconds(0);
                        var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                            style : "short",
                            UTC : that.getModel('applicationContext').getData().UTC
                        });
                        sDateTime = oDateFormat.format(from);
                        var iCurrMonth = from.getUTCMonth();
                        from.setTime(from.getTime() + 24 * 60 * 60 * 1000);
                        if (from.getUTCMonth() !== iCurrMonth) {
                            bCarry = true;
                        }
                    } else if (value) { // some date string
                        sDateTime = sap.secmon.ui.commons.Formatter.dateFormatterEx(that.getModel('applicationContext').getData().UTC, new Date(value));
                    }
                    return sDateTime;
                };

                if (aIndicesOfTimeBasedDims.length && oFeedData.chartData && oFeedData.chartData.data) {
                    var dFrom = {};
                    var dTo = {};
                    if (oFeedData.period.operator === "=") {
                        if (oFeedData.now) {
                            dTo = new Date(Date.parse(oFeedData.now));
                        } else {
                            dTo = new Date();
                        }
                        dFrom = new Date(dTo.getTime() - sap.secmon.ui.browse.Constants.C_REL_TIME_LIST[oFeedData.period.searchTerms[0]]);
                    } else if (oFeedData.period.operator === "BETWEEN") {
                        dFrom = new Date(Date.parse(oFeedData.period.searchTerms[0]));
                    } else {
                        dFrom = new Date();
                    }

                    aIndicesOfTimeBasedDims.forEach(function(i) {
                        oFeedData.chartData.data.forEach(function(oData) {
                            oData[oFeedData.dimensions[i].key] = fnGetDateTimeLabel(oData[oFeedData.dimensions[i].key], new Date(dFrom));
                        });
                    });
                }
            },

            sortChartData : function(sPath) {
                var oFeed = this.getModel().getData();
                // set the new path
                if (sPath) {
                    // same path => change sort direction asc|desc
                    if (oFeed.lastSortedBy && oFeed.lastSortedBy.path === sPath) {
                        oFeed.lastSortedBy.desc = !oFeed.lastSortedBy.desc;
                    } else {
                        oFeed.lastSortedBy = {
                            path : sPath,
                            desc : false
                        };
                    }
                }

                if (oFeed.lastSortedBy && oFeed.lastSortedBy.path && oFeed.lastSortedBy.hasOwnProperty("desc")) {
                    var aPath = oFeed.lastSortedBy.path.split("/");
                    var iIndex = parseInt(aPath[2]);
                    var sProperty;
                    if (aPath[1] === "measures") {
                        sProperty = oFeed.measures[iIndex].alias;
                    } else if (aPath[1] === "dimensions") {
                        sProperty = oFeed.dimensions[iIndex].key;
                    }
                    if (sProperty && oFeed.chartData.data) {
                        oFeed.chartData.data.sort(this._dynamicSort(sProperty, oFeed.lastSortedBy.desc));
                    }
                }
            },

            timestampedAttributesCheck : function(oSelectedValue) {
                var sAttributeName = oSelectedValue.getProperty("key");
                var aAttrConstants = Object.values(sap.secmon.ui.browse.Constants.C_TIMESTAMP_ATTRIBUTES);
                if (aAttrConstants.indexOf(sAttributeName) > -1) {
                    this.feedModelChange(sap.secmon.ui.browse.Constants.C_CHART_TYPE.COLUMN);
                } else {
                    this.feedModelChange(sap.secmon.ui.browse.Constants.C_CHART_TYPE.DONUT);
                }
            },

            feedModelChange : function(sProperty) {
                var oDimension = this.getModel().getProperty("/dimensions");
                oDimension.map(function(item) {
                    item.chartType = sProperty;
                    return oDimension;
                });
                this.getModel().setProperty("/chartType", sProperty);
                this.getModel().setProperty("/dimensions", oDimension);
            },

            /**
             * called when new Q-result set in FeedModel/chartData
             */
            newDataAvailable : function() {
                var oFeedData = this.getModel().getData();
                if (oFeedData.dimensions === undefined || oFeedData.dimensions.length <= 0) {
                    oFeedData.dimensions = [];
                }

                if (this.getModel().getData().chartType !== undefined) {
                    this._chartTypeChanged(this.getModel().getData().chartType);
                } else {
                    this._chartTypeChanged(sap.secmon.ui.browse.Constants.C_CHART_TYPE.COLUMN);
                }
            },

            /**
             * updates the chart from the existing feed and result
             */
            _updateChart : function() {

                var oFeedModel = this.getModel();
                var oFeedModelData = oFeedModel.getData();
                var dimensionsAndMeasures = this._extractDimensionsAndMeasuresFromFeed(oFeedModelData);

                this._oCurrentChart.destroyDataset().setDataset(new sap.viz.ui5.data.FlattenedDataset({
                    dimensions : dimensionsAndMeasures.dimensions,
                    measures : dimensionsAndMeasures.measures,
                    data : {
                        path : "/chartData/data"
                    }
                }));

                oFeedModel.refresh();
            },

            /**
             * updates the table from the existing feed and result
             */
            _updateTable : function() {

                var oFeedModel = this.getModel();
                var oFeedModelData = oFeedModel.getData();
                var dimensionsAndMeasures = this._extractDimensionsAndMeasuresFromFeed(oFeedModelData);

                var oTable = this._oCurrentTable;
                oTable.destroyColumns();

                if (dimensionsAndMeasures.dimensions !== undefined) {
                    $.each(dimensionsAndMeasures.dimensions, function(index, value) {
                        value.value = value.value.substring(1, value.value.length - 1);
                        oTable.addColumn(new sap.ui.table.Column({
                            label : new sap.ui.commons.Label({
                                text : value.name
                            }),
                            template : new sap.ui.commons.TextView().bindProperty("text", value.value),
                            sortProperty : value.value,
                            filterProperty : value.value,
                            width : "200px"
                        }));
                    });
                }

                var appCtxtModel = this.getModel('applicationContext') || this.getModel('ApplicationContext');
                var bUTC = appCtxtModel.getProperty("/UTC");
                if (dimensionsAndMeasures.measures !== undefined) {
                    $.each(dimensionsAndMeasures.measures, function(index, value) {
                        value.value = value.value.substring(1, value.value.length - 1);
                        oTable.addColumn(new sap.ui.table.Column({
                            label : new sap.ui.commons.Label({
                                text : value.name
                            }),
                            template : new sap.ui.commons.TextView().bindProperty("text", {
                                path : value.value,
                                formatter : function(value) {
                                    var parsedDate = Date.parse(value);
                                    if (isNaN(value) && !isNaN(parsedDate)) {
                                        return sap.secmon.ui.commons.Formatter.dateFormatterEx(bUTC, new Date(value + 'UTC'));
                                    } else {
                                        return value;
                                    }
                                }.bind(this)
                            }),
                            sortProperty : value.value,
                            filterProperty : value.value
                        }));
                    });
                }

                this._oCurrentTable.setModel(oFeedModel);
                this._oCurrentTable.unbindRows().bindRows("/chartData/data");
            },

            /**
             * extract the dimensions and measures from the feed
             */
            _extractDimensionsAndMeasuresFromFeed : function(feed) {
                var that = this;
                var oUIModelData = this.getModel("UIModel").getData();
                oUIModelData.add2PathVisible = true;

                // dimensions
                var chartDimensions = [];
                if (feed.dimensions !== undefined) {
                    $.each(feed.dimensions, function(index, value) {
                        value.column = value.name;
                        if (value.dataType === "ValueTimeStamp") {
                            oUIModelData.add2PathVisible = false;
                        }
                        chartDimensions.push({
                            axis : 1,
                            name : value.context === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG ? that.getModel("i18nknowledge").getProperty(value.name) : value.name,
                            value : "{" + value.key + "}"
                        });
                    });
                }

                if (chartDimensions.length === 0) {
                    oUIModelData.add2PathVisible = false;
                    chartDimensions.push({
                        axis : 1,
                        value : "{NoDimensionKey}",
                        name : "No dimension",

                    });
                    if (feed.hasOwnProperty("data")) {
                        feed.chartData.data[0].NoDimensionKey = "Empty dimension: to be renamed";
                    }
                }

                // search for the prop "COUNT("23767qss)[2]" e.g.
                // var findMeasureAlias1 = function(index, data) {
                // for ( var prop in data) {
                // if (prop.indexOf("[" + index + "]") > -1)
                // return prop;
                // }
                // return null;
                // };

                // measures
                var chartMeasures = [];
                if (feed.measures !== undefined) {
                    $.each(feed.measures, function(index, oMeasure) {
                        oMeasure.displayName =
                                oMeasure.displayName || (oMeasure.fn + '(' + (oMeasure.distinct ? 'distinct ' : '') + oMeasure.name + ')' + 'based on ' + oMeasure.startDatasets[0].name);
                        if (oMeasure.reference) {
                            // take care of reference measurement that refers to the
                            // first
                            // measure
                            /*
                             * displayName: "Count of Events from Path1.Subset1 1 Day ago" luid: 2 reference: { luid: 1 offset: "last10Minutes" }
                             */
                            oMeasure.alias = feed.measures[0].alias;
                            // replace the index with the new index
                            oMeasure.alias = oMeasure.alias.replace("[0]", "[" + index + "]");
                        } else {
                            // oMeasure.alias = "COUNT|SUM|AVG" + (oMeasure.key)[2]
                            oMeasure.alias = oMeasure.fn + "(" + oMeasure.key + ")[" + index + "]";
                        }

                        chartMeasures.push({
                            name : oMeasure.displayName,
                            value : "{" + oMeasure.alias + "}"
                        });
                    });
                }

                return {
                    dimensions : chartDimensions,
                    measures : chartMeasures
                };
            },

            /**
             * notification that the drop down box for representation types (charts, table) has been changed. this function creates depending on the selected representation type a new table or a new
             * chart. the other object (_oCurrentChart or _oCurrentTable) is set to null.
             */
            _chartTypeChanged : function(sSelectedChartType) {
                var that = this;
                var oFeedModelData = this.getModel().getData();

                if (this._oCurrentChartType === sSelectedChartType) {
                    if (this._oCurrentChart !== null) {
                        this._updateChart();
                        this._oCurrentChart.setBusy(false);
                    } else if (this._oCurrentTable !== null) {
                        this._updateTable();
                    }
                    return;
                }

                if (sSelectedChartType === sap.secmon.ui.browse.Constants.C_CHART_TYPE.TABLE) {
                    if (!this._oCurrentTable) {
                        this._oCurrentTable = new sap.ui.table.Table({
                            selectionMode : sap.ui.table.SelectionMode.Single,
                            navigationMode : sap.ui.table.NavigationMode.Scrollbar,
                            width : "100%"
                        });
                    }

                    this._layout.getCenter().removeAllContent();
                    this._layout.getCenter().addContent(this._oCurrentTable);
                    this._updateTable();

                    // we are using _currentTable
                    // force the garbage collector to cleanup the memory
                    if (this._oCurrentChart) {
                        this._oCurrentChart.destroy();
                        delete this._oCurrentChart;
                    }
                } else {
                    if (this._oCurrentChart) {
                        this._oCurrentChart.destroy();
                        delete this._oCurrentChart;
                    }
                    switch (sSelectedChartType) {
                    case sap.secmon.ui.browse.Constants.C_CHART_TYPE.BAR:
                        this._oCurrentChart = new sap.viz.ui5.Bar({});
                        break;
                    case sap.secmon.ui.browse.Constants.C_CHART_TYPE.LINE:
                        this._oCurrentChart = new sap.viz.ui5.Line({});
                        break;
                    case sap.secmon.ui.browse.Constants.C_CHART_TYPE.PIE:
                        this._oCurrentChart = new sap.viz.ui5.Pie({});
                        break;
                    case sap.secmon.ui.browse.Constants.C_CHART_TYPE.DONUT:
                        this._oCurrentChart = new sap.secmon.ui.browse.Donut({
                            width : this.getWidth(),
                            height : this.getHeight()
                        });
                        break;
                    case sap.secmon.ui.browse.Constants.C_CHART_TYPE.TREEMAP:
                        this._oCurrentChart = new sap.viz.ui5.Treemap({});
                        break;
                    case sap.secmon.ui.browse.Constants.C_CHART_TYPE.COLUMN:
                    default:
                        this._oCurrentChart = new sap.viz.ui5.Column({});
                        break;
                    }

                    this._oCurrentChart.setHeight("100%");
                    this._oCurrentChart.setWidth("100%");

                    // selectability mode
                    var interactionSelectabilityMode = sap.viz.ui5.types.controller.Interaction_selectability_mode;
                    var selectabilityMode = this.getModel("UIModel").getProperty("/chartPopover") ? 
                        interactionSelectabilityMode.multiple :
                        interactionSelectabilityMode.none;
                    this._oCurrentChart.setInteraction(new sap.viz.ui5.types.controller.Interaction({
                        selectability : new sap.viz.ui5.types.controller.Interaction_selectability({
                            mode : selectabilityMode
                        })
                    }));

                    // assign the callbacks for viz chart if data has been changed
                    // currently only for PatternDefinition
                    if (this._oCurrentChart) {
                        this._oCurrentChart.addDelegate({
                            onBeforeRendering : function() {
                                try {
                                    if (that.handleBeforeRendering) {
                                        that.handleBeforeRendering();
                                    }
                                } catch (err) {
                                }
                            },
                            onAfterRendering : function() {
                                try {
                                    if (that.handleAfterRendering) {
                                        that.handleAfterRendering();
                                    }
                                } catch (err) {
                                }
                            },

                        });
                    }

                    this._oCurrentChart.setLegend(new sap.viz.ui5.types.legend.Common({
                        visible : {
                            path : "UIModel>/chartLegendVisible",
                            formatter : function(bChartLegendVisible) {
                                return sSelectedChartType === sap.secmon.ui.browse.Constants.C_CHART_TYPE.PIE ? true : bChartLegendVisible;
                            }
                        },
                        isScrollable : true,
                    }));

                    this._oCurrentChart.setTitle(new sap.viz.ui5.types.Title({
                        visible : "{UIModel>/chartTitleVisible}",
                        text : {
                            parts : [ {
                                path : "/namespace"
                            }, {
                                path : "/name"
                            } ],

                            formatter : function(sNamespace, sName) {
                                return sName;
                            }
                        }
                    }));

                    if (this.getModel("UIModel").getProperty("/chartPopover")) {                        
                        this._oCurrentChart.attachSelectData(function (oEvent) {
                            that._handleSelectData(oEvent);
                        });
                    }

                    this._layout.getCenter().removeAllContent();
                    this._layout.getCenter().addContent(this._oCurrentChart);
                    this._updateChart();
                    this._oCurrentChart.setBusy(false);

                    // we are using _currentChart
                    // force the garbage collector to cleanup the memory
                    if (this._oCurrentTable) {
                        this._oCurrentTable.destroy();
                        delete this._oCurrentTable;
                    }
                }

                this._oCurrentChartType = sSelectedChartType;
                oFeedModelData.chartType = sSelectedChartType;

                $.each(that._oChartTypes.getButtons(), function(index, oButton) {
                    if (oButton.data("key") === sSelectedChartType) {
                        that._oChartTypes.setSelectedButton(oButton.sId);
                    }
                });

            },

            _handleEditMeasure : function(oEvent) {

                var sPath = oEvent.getSource().getParent().getParent().getParent().getParent().getBindingContext().getPath();
                var oCurrentMeasureData = $.extend(true, {}, this.getModel().getProperty(sPath));
                var oCurrentMeasureModel = new sap.ui.model.json.JSONModel();
                oCurrentMeasureModel.setData(oCurrentMeasureData);
                var oValue;
                var that = this;
                if (oCurrentMeasureData.reference) {
                    var oFeed = that.getModel().getData();

                    var oAvailableMeasuresModel = new sap.ui.model.json.JSONModel();
                    var aAvailableMeasures = [];

                    $.each(oFeed.measures, function(idx, oMeasure) {
                        if (!oMeasure.reference) {
                            var oAvailMeasure = {};
                            oAvailMeasure.displayName = oMeasure.displayName;
                            oAvailMeasure.luid = oMeasure.luid;
                            aAvailableMeasures.push(oAvailMeasure);
                        }
                    });
                    oAvailableMeasuresModel.setData({
                        items : aAvailableMeasures
                    });
                    this._oAddRef2MeasureDialog.setModel(oAvailableMeasuresModel, "AvailableMeasuresModel");

                    var oRefMeasureModel = new sap.ui.model.json.JSONModel();
                    oRefMeasureModel.setData({
                        luid : oCurrentMeasureData.luid,
                        displayName : oCurrentMeasureData.displayName,
                        reference : {
                            luid : oCurrentMeasureData.reference.luid,
                        }
                    });

                    if (oCurrentMeasureData.reference.offset) {

                        oValue = {
                            relativeValue : oCurrentMeasureData.reference.offset
                        };
                        this._oAddRef2MeasureDialog.getContent()[0].getContent()[5].setType("Relative");
                        this._oAddRef2MeasureDialog.getContent()[0].getContent()[5].setValue(oValue);
                    } else {
                        oValue = {
                            absoluteValue : {
                                from : oCurrentMeasureData.reference.start
                            }
                        };
                        this._oAddRef2MeasureDialog.getContent()[0].getContent()[5].setType("Absolute");
                        this._oAddRef2MeasureDialog.getContent()[0].getContent()[5].setValue(oValue);
                    }

                    this._oAddRef2MeasureDialog.setModel(oRefMeasureModel);

                    $.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), this._oAddRef2MeasureDialog);
                    // add custom data to detemine the mode is "Edit" or "Add"
                    this._oAddRef2MeasureDialog.removeAllCustomData();
                    this._oAddRef2MeasureDialog.addCustomData(new sap.ui.core.CustomData({
                        key : "bIsNew",
                        value : false
                    }));
                    this._oAddRef2MeasureDialog.addCustomData(new sap.ui.core.CustomData({
                        key : "sPath",
                        value : sPath
                    }));
                    this._oAddRef2MeasureDialog.open();
                } else {
                    var oDummyController = {
                        onInit : function() {

                        },
                        pressedOK : function(oEvent) {
                            that.getModel().setProperty(sPath, that._oEditMeasureDialog.getModel().getData());
                            that.handleFeedsChanged();
                            that._publishWSChanged();
                            that._oEditMeasureDialog.close();
                        },

                        pressedCancel : function(oEvent) {
                            that._oEditMeasureDialog.close();
                        },
                        handleMeasureChange : function(oEvent) {
                            var oSQLFnModel = that._oEditMeasureDialog.getModel("SQLFnModel");
                            var oSelMeasureKey = oEvent.getSource().getSelectedKey();
                            var sDataType = oEvent.getSource().getSelectedItem().data().dataType;

                            oSQLFnModel.setProperty("/items", that._aFnMappedByDataType[sDataType]);

                            // TODO condition should check the dataType
                            if (oSelMeasureKey === '556CB95E730EAC24E10000000A4CF109' || oSelMeasureKey === '556CB95D730EAC24E10000000A4CF109') {
                                oSQLFnModel.setProperty("/items", that._aFnGeoLocation);
                            }

                            oSQLFnModel.refresh();
                        }
                    };

                    this._oEditMeasureDialog = sap.ui.xmlfragment("dlChartEditMeasure", "sap.secmon.ui.browse.EditMeasure", oDummyController);

                    this._oEditMeasureDialog.setModel(this._oSQLFnModel, "SQLFnModel");
                    this._oEditMeasureDialog.setModel(oCurrentMeasureModel);
                    var oSQLDropdown =
                            this._oEditMeasureDialog.getContent()[0].getAggregation('form').getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0]
                                    .getContent()[3];
                    var sBindingKey = oSQLDropdown.getBinding("selectedKey").getValue();
                    var aMeasures = sap.ui.getCore().getModel("MeasuresModel").getProperty("/data");
                    var sDataType = "";
                    aMeasures.some(function(oMeasure, iIdex) {
                        if (oMeasure.key === sBindingKey) {
                            sDataType = oMeasure.dataType;
                            return true;
                        }
                    });
                    this._oSQLFnModel.setProperty("/items", this._aFnMappedByDataType[sDataType]);

                    var oView = sap.secmon.ui.browse.utils.getView();
                    oView.addDependent(this._oEditMeasureDialog);

                    // sync compact style
                    // var oView =
                    // sap.secmon.ui.browse.utils.getController().getView().addDependent(oTimePeriodPopup);
                    $.sap.syncStyleClass("sapUiSizeCompact", oView, this._oEditMeasureDialog);

                    this._oEditMeasureDialog.open();
                }
            },

            createRef2MeasureController : function(bIsNew, sPath, oTimeRangeSelector) {
                var that = this;

                var oUIInputModel = that._oAddRef2MeasureDialog.getModel();
                var oUIInputData = oUIInputModel.getData();

                // check input
                if (!oUIInputData.displayName || oUIInputData.displayName === '') {
                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_Ref2MeasNoName"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("BU_TIT_MeasureRef"),
                            sap.ui.commons.MessageBox.Action.OK);
                    return;
                }

                var oFeed = that.getModel().getData();

                var iLuid;
                if (bIsNew) {
                    iLuid = sap.secmon.ui.browse.utils.generateLuid(oFeed.measures);
                } else {
                    iLuid = parseInt(oUIInputData.luid);
                }

                var oMeasure = {
                    luid : iLuid,
                    displayName : oUIInputData.displayName,
                    reference : {
                        luid : parseInt(oUIInputData.reference.luid)
                    }
                };

                if (oTimeRangeSelector.getType() === "Relative") {
                    oMeasure.reference.offset = oTimeRangeSelector.getValue().relativeValue;
                } else {
                    // "Absolute" case
                    oMeasure.reference.start = oTimeRangeSelector.getValue().absoluteValue.from;
                }

                if (bIsNew) {
                    oFeed.measures.push(oMeasure);
                    that.getModel().refresh(true);
                } else {
                    that.getModel().setProperty(sPath, oMeasure);
                }

                that.handleFeedsChanged();
                that._publishWSChanged();
                that._oAddRef2MeasureDialog.close();
            },

            renderer : function(oRm, oControl) {

                // oRm.write("<div");
                // oRm.writeControlData(oControl);
                // oRm.addClass('sapEtdChartHeight');
                // oRm.writeClasses();
                // oRm.write(">");
                oControl._layout.setHeight(oControl.getHeight());
                oRm.renderControl(oControl._layout);

                // oRm.write("</div>");
            },

            _onOpenPopover : function() {
                var oDimensionsModel = sap.ui.getCore().getModel("DimensionsModel");

                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("sap.secmon.ui.browse.Dimensions", this);
                    this._oDialog.setModel(oDimensionsModel);
                    this._oDialog.setModel(this.getModel("i18nknowledge"), "i18nknowledge");
                    this._oDialog.setModel(this.getModel("i18n"), "i18n");
                }

                // clear the old search filter
                if (this._oDialog.getBinding("items") !== undefined) {
                    this._oDialog.getBinding("items").filter([]);
                }

                var oFilter = new sap.ui.model.Filter("key", sap.ui.model.FilterOperator.NE, "");
                $.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), this._oDialog);
                this._oDialog.open();
                this._oDialog.getBinding("items").filter([ oFilter ]);

            },

            handleSearch: function(oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new sap.ui.model.Filter("displayName", sap.ui.model.FilterOperator.Contains, sValue);
                var oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([oFilter]);
           },

           handleClose: function(oEvent) {
            var oFeed = this.getModel().getData();   
            var aContexts = oEvent.getParameter("selectedContexts");            
            var oDimensionsModel = sap.ui.getCore().getModel("DimensionsModel");
            var oSelectedField = oDimensionsModel.getProperty(aContexts[0].getPath());
            oEvent.getSource().getBinding("items").filter([]);


            var sContext = "";
                $.each(oFeed.measures, function(idx, oMeasure) {
                    if (oMeasure.context) {
                        sContext = oMeasure.context;
                        return false;
                    }
                });
                
                 if(this._actionId === "press"){
                    oFeed.dimensions.push({
                        context : sContext,
                        key : oSelectedField.key,
                        name : oSelectedField.displayName,
                        filterOperators : oSelectedField.filterOperators,
                        dataType : oSelectedField.dataType
                    });
                }
                else if(this._actionId === "valueHelpRequest"){
                     for(var i = 0; i < this.oDimensionsTable.getRows().length; i++){
                         if(this.oDimensionsTable.getRows()[i].mAggregations.cells[0].sId === this._selectedRow){
                            var sPath = this.oDimensionsTable.getRows()[i].getBindingContext().sPath;
                             //var oDimensions = this.oDimensionsTable.getRows()[i].getBindingContext().getModel().getData().dimensions[i];
                            var iDimIndex = parseInt(sPath.split("/dimensions/")[1]);
                            oFeed.dimensions[iDimIndex].context = sContext;
                            oFeed.dimensions[iDimIndex].key = oSelectedField.key;
                            oFeed.dimensions[iDimIndex].name = oSelectedField.displayName;
                            oFeed.dimensions[iDimIndex].filterOperators = oSelectedField.filterOperators;
                            oFeed.dimensions[iDimIndex].dataType = oSelectedField.dataType;
                         }                
                     }
                }                

                this.getModel().refresh(true);
                this.handleFeedsChanged();
            },

            // onBeforeRendering : function() {
            //
            // // reset the correct binding for items
            // this.oDimensionsTable.unbindRows();
            // this.oDimensionsTable.bindRows("/dimensions");
            //
            // // var sPath = oEvent.getSource().getBindingContext().getPath();
            // // get the dimensions of chart data
            // // loop thru all the dimensions
            //
            // var aRows = this.oDimensionsTable.getRows();
            // var aDims = this.getModel().getProperty("/dimensions");
            // aDims.forEach(function(oDim, iIdx) {
            // var sKey = oDim.key;
            // try {
            // var oDropdown = aRows[iIdx].getCells()[0];
            // oDropdown.setSelectedKey(sKey);
            // } catch (e) {
            // }
            // })
            // //
            // //
            // this.oDimensionsTable.getColumns()[0].getTemplate().setSelectedKey(this.getModel().getProperty(sPath));
            // // this.oDimensionsTable.getColumns()[0].getTemplate().invalidate();
            // },

            // formatter for dimension items to get rid of <RoleIndependent> Attributes
            // @see: Dimensions.fragment.xml
            formatDimensionItem : function(value) {
                return Object.keys(sap.secmon.ui.browse.Constants.C_ROLE_INDEPENDENT_ATTRIBUTES).indexOf(value) === -1;
            }
        });
