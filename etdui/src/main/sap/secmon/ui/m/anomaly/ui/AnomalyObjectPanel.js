/* globals oTextBundle,oTextBundleCommon */
$.sap.declare("sap.secmon.ui.m.anomaly.ui.AnomalyObjectPanel");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
// Requesting the files "sap/secmon/ui/browse/ui2/*.js" which contain JS objects
// "sap.secmon.ui.browse.*"
$.sap.require("sap.secmon.ui.browse.Chart");
$.sap.require("sap.secmon.ui.m.anomaly.ui.FacetExplorer");
$.sap.require("sap.secmon.ui.m.anomaly.ui.FeatureExplorer");
$.sap.require("sap.ui.core.format.DateFormat");
$.sap.require("sap.ui.table.Table");
$.sap.require("sap.ui.ux3.ToolPopup");
$.sap.require("sap.secmon.ui.m.anomaly.ui.SNDistribution");
$.sap.require("sap.secmon.ui.m.anomaly.ui.Formatter");
$.sap.require("sap.secmon.ui.m.anomaly.util.Formatter");
jQuery.sap.require("sap.ui.commons.RichTooltip");
jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.ui.model.odata.CountMode");

/**
 * Add panel in workspace, which can be a scenario, feature or pattern
 * 
 * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyObjectPanel
 */
sap.m.Panel.extend("sap.secmon.ui.m.anomaly.ui.AnomalyObjectPanel", {

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
            showCollapseIcon : {
                type : "boolean",
                "default" : false
            },
            type : {
                type : "string",
            }
        },
        aggregations : {
            buttons : {
                type : "sap.ui.core.Control",
                multiple : true
            }
        },
        events : {
            nav2Evalutation : {
                data : "any"
            },
            removeMe : {
                data : "any"
            },
            nav2Analysis : {
                data : "any"
            },
            update : {},
            refreshRequested : {}
        }
    },

    _oChart : undefined,
    _oFeatures : undefined,
    _bChartIdChanged : undefined,
    _bBuildUI : undefined,
    _oTagsTable : undefined,
    // use the super renderer
    renderer : {},

    init : function() {
        // Call super constructor
        if (sap.ui.commons.Panel.prototype.init) {
            sap.ui.commons.Panel.prototype.init.apply(this, arguments);
        }
        // init models
        var oWorkspaceListModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.m.anomaly.ui.Constants.C_ODATA_QUBE_LIST_PATH, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.setModel(oWorkspaceListModel, "WorkspaceListModel");

        this._bBuildUI = true;
    },

    getText : function(sTextKey, aValues) {
        return oTextBundle.getText(sTextKey, aValues);
    },

    getCommonText : function(sTextKey, aValues) {
        return oTextBundleCommon.getText(sTextKey, aValues);
    },

    /**
     * Build UI as all the properties are available now
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.AnomalyObjectPanel
     */
    onBeforeRendering : function() {
        // Call super implementation
        if (sap.ui.commons.Panel.prototype.onBeforeRendering) {
            sap.ui.commons.Panel.prototype.onBeforeRendering.apply(this, arguments);
        }

        // create header: title, name and tags button
        if (this._bBuildUI === true) {
            this._createHeader();
            var sPath = this.getBindingContext().getPath();

            switch (this.getType()) {
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                var sChartId = this.getModel().getProperty(sPath + "/FeatureProperties/BaseMeasureId");
                if (sChartId) {
                    // Read chart data
                    this._readChart(sChartId);
                } else {
                    this.destroyContent();
                    this.addContent(this._createContentLayout());
                }
                break;
            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                this.destroyContent();
                this.addContent(this._createContentLayout());
                break;
            default:
                this.destroyContent();
                this.addContent(this._createContentLayout());
                break;
            }
            this._bChartIdChanged = false;
            this._bBuildUI = false;
        }
    },

    /**
     * Assign chart to feature
     * 
     * @param oChartData
     */
    _assignChart : function(oData) {
        var sPath = this.getBindingContext().getPath();
        var myModel = this.getModel();
        var sChartName = "";
        if (this._oChart) {
            sChartName = this._oChart.getModel().getData().name;
        }
        // 1. UPDATE CHART
        this._oChart = new sap.secmon.ui.browse.Chart({
            width : "100%",
            height : "100%",
            refreshMode : {
                mode : "none"
            }
        });
        var oChartData = JSON.parse(oData.SerializedData);
        // remove the chartData so that new data can be loaded
        delete oChartData.chartData;

        // in case no timerange has been set yet, set default chart time
        // range
        // ,which is last full hour
        var oDateTimeFrom = myModel.getProperty(sPath + "/FeatureProperties/Period/From");
        var oDateTimeTo = myModel.getProperty(sPath + "/FeatureProperties/Period/To");

        if (!oDateTimeFrom && !oDateTimeTo) {
            var oDateTo = new Date();
            var iTo = oDateTo.getHours();
            oDateTo = new Date(oDateTo.setHours(iTo, 0, 0, 0));
            var oDateFrom = new Date(oDateTo.getTime() - 3600 * 1000 * 8);

            oDateTimeFrom = new sap.secmon.ui.commons.CommonFunctions().formatDateTime(new Date(oDateFrom.getTime()));
            oDateTimeTo = new sap.secmon.ui.commons.CommonFunctions().formatDateTime(new Date(oDateTo.getTime()));
            var Period = {
                From : oDateTimeFrom.toString(),
                To : oDateTimeTo.toString()
            };
            myModel.setProperty(sPath + "/FeatureProperties/Period", Period);
        }

        oChartData.period.operator = "BETWEEN";
        oChartData.period.searchTerms = [];
        oChartData.period.searchTerms.push(oDateTimeFrom);
        oChartData.period.searchTerms.push(oDateTimeTo);

        // define what to be displayed in chart
        var oChartUIModelData = this._oChart.getModel("UIModel").getData();
        // oChartUIModelData.chartTitleVisible = true;
        oChartUIModelData.editChartTypeVisible = true;
        oChartUIModelData.chartLegendVisible = false;
        oChartUIModelData.chartPopover = false;
        oChartUIModelData.editChartDimension = false;
        oChartUIModelData.editChartTitleVisible = false;
        oChartUIModelData.hideFullscreen = true;
        // changing measureand dimension currently not supported
        oChartUIModelData.editDMVisible = false;
        this._oChart.getModel("UIModel").setData(oChartUIModelData);
        // trigger chart update
        this._oChart.getModel().setData(oChartData);
        this._oChart.handleFeedsChanged(this, this._countChartGroupsAmount);

        // 2. UPDATE FEATURE CHARACTERISTIC SETTINGS
        // only in case chartId has been changed
        if (this._bChartIdChanged === true) {
            var aDimensions = [];
            for (var i = 0; i < oChartData.dimensions.length; i++) {
                aDimensions.push({
                    "AggregationCalculationId.Id" : null,
                    "DimensionNumber" : i,
                    "DimensionId" : oChartData.dimensions[i].key,
                    "Included" : 1,
                    "displayName" : oChartData.dimensions[i].name
                });
            }

            myModel.setProperty(sPath + "/FeatureProperties/Dimensions", aDimensions);
            myModel.setProperty(sPath + "/FeatureProperties/DimensionCount", aDimensions.length);
            myModel.setProperty(sPath + "/FeatureProperties/AggregationCount", aDimensions.length);
            myModel.setProperty(sPath + "/FeatureProperties/BaseMeasureId", oData.Id);
            // only if not yet set
            var sName = myModel.getProperty(sPath + "/Name");
            if (!sName || sName === "New Evaluation" || sChartName !== "" && sChartName === sName) {
                myModel.setProperty(sPath + "/Name", oChartData.name);
                // in case of type = Feature name on header must be
                // changed too
                if (myModel.getData().Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE) {
                    myModel.setProperty("/Name", oChartData.name);
                }
            }
        }
        this.destroyContent();
        this.addContent(this._createContentLayout());
    },

    _countChartGroupsAmount : function() {
        var sPath = this.getBindingContext().getPath();
        var oModel = this.getModel();
        var oChartData = this._oChart.getModel().getData().chartData.data;      
        oModel.setProperty(sPath + "/FeatureProperties/ChartGroupsAmount", oChartData.length);              
    },

    /**
     * Reads chart via OData service from data base for given ID
     * 
     * @param sQubeId
     */
    _readChart : function(sChartId) {
        var _that = this;
        var oDataReq = "/Qube(X'" + sChartId + "')";
        var oWorkspaceListModel = this.getModel("WorkspaceListModel");
        oWorkspaceListModel.read(oDataReq, {
            success : function(data) {
                var oChartData = {};
                oChartData.Id = new sap.secmon.ui.commons.CommonFunctions().base64ToHex(data.Id);
                oChartData.Name = data.Name;
                oChartData.CreationTimestamp = data.CreationTimestamp;
                oChartData.CreationByUserId = data.UserId;
                oChartData.ChangeTimestamp = data.ChangeTimestamp;
                oChartData.ChangedByUserId = data.ChangedByUserId;
                oChartData.Description = data.Description;
                oChartData.WorkspaceId = new sap.secmon.ui.commons.CommonFunctions().base64ToHex(data.ParentId);
                oChartData.Namespace = data.Namespace;
                oChartData.Search = data.Name + data.Namespace + data.UserId + data.ChangedByUserId + data.Description;
                oChartData.SerializedData = data.SerializedData;
                oChartData.Type = data.Type;
                oChartData.Type = data.Type;
                _that._assignChart(oChartData);
            },
            error : function() {
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), _that.getText("ChartIdNotRetrieved_MSG", sChartId));
            }
        });

    },
    _createContentLayout : function() {
        var sType = this.getType();

        var oLayout = new sap.ui.commons.layout.MatrixLayout({
            columns : 2,
            layoutFixed : true,
            width : "100%",
            height : "100%",
            widths : [ "50%", "50%" ]
        });
        oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            vAlign : sap.ui.commons.layout.VAlign.Top,
            content : [ this._createBaseObjectLayout(sType) ]
        }), new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            separation : sap.ui.commons.layout.Separation.SmallWithLine,
            vAlign : sap.ui.commons.layout.VAlign.Top,
            content : [ this._createObjectPropertiesLayout(sType) ]
        }));
        return oLayout;
    },
    _createObjectPropertiesLayout : function(sType) {
        if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE) {
            return this._createFeatureProperties();
        } else if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
            return this._createPatternProperties();
        }
    },
    _createBaseObjectLayout : function(sType) {
        if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE) {
            return this._createChartSettings();
        } else if (sType === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
            return this._createFeatureSettings();
        }
    },
    _createHeader : function() {
        var _that = this;
        var sPath = this.getBindingContext().getPath();
        // set title
        var oObjectName = new sap.m.Title({
            titleStyle : sap.ui.core.TitleLevel.H5,
            text : {
                parts : [ {
                    path : "Type"
                }, {
                    path : "Name"
                }, {
                    path : "Namespace"
                }, {
                    path : "i18n>Evaluation_TXT"
                }, {
                    path : "i18n>Pattern_TXT"
                } ],
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.titleFormatter
            },
            tooltip : {
                parts : [ {
                    path : "Type"
                }, {
                    path : "Name"
                }, {
                    path : "Namespace",
                }, {
                    path : "i18n>Evaluation_TXT"
                }, {
                    path : "i18n>Pattern_TXT"
                } ],
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.titleFormatter
            }
        });
        var oIcon = new sap.ui.core.Icon({
            src : {
                path : "Type",
                formatter : sap.secmon.ui.m.anomaly.ui.Formatter.iconFormatter
            }
        });
        // name + tag button
        var oButtonAnalyze = new sap.m.Button({
            icon : "sap-icon://overview-chart",
            type : 'Transparent',
            tooltip : {
                parts : [ {
                    path : sPath + "/Name"
                }, {
                    path : sPath + "/Namespace"
                }, {
                    path : 'i18n>BU_FLOD_TOL_AnPatternRes'
                }, {
                    path : 'i18n>AnPatternRes_TOL'
                } ],
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.analysisTooltipFormatter
            },
            enabled : {
                parts : [ {
                    path : sPath + "/Id"
                }, {
                    path : sPath + "/Type"
                },{
                    path : "applicationContext>/userPrivileges/anomalyDetectionRead"
                } ],
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.isPatternAndHasId
            },
            visible : {
                path : sPath + "/Type",
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.isPattern
            },
            press : [ function(oEvent) {
                // fire the navigation event with selected data
                var oDataSelected = oEvent.getSource().getParent().getModel().getProperty(oEvent.getSource().getParent().getBindingContext().getPath());
                _that.fireNav2Analysis({
                    data : oDataSelected
                });
            }, this ]
        });

        // name + tag button
        var oButtonExport = new sap.m.Button({
            icon : "sap-icon://shipping-status",
            type : 'Transparent',
            tooltip : {
                parts : [ {
                    path : 'i18n>ExportPattern_TOL'
                }, {
                    path : sPath + "/Name"
                }, {
                    path : sPath + "/Namespace"
                } ],
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.exportButtonToolTipText
            },
            visible : {
                parts : [ {
                    path : sPath + "/Id"
                }, {
                    path : sPath + "/Type"
                },{
                    path : "applicationContext>/userPrivileges/anomalyDetectionWrite" 
                }],
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.isPatternAndHasId
            },
            press : [ this.handleExport, this ]
        });

        var oButtonRemove = new sap.m.Button({
            icon : "sap-icon://decline",
            type : 'Transparent',
            tooltip : "{i18n>Remove_TOL}",
            visible : {
                parts : [ {
                    path : sPath + "/Id",
                }, {
                    path : sPath + "/Type"
                },{
                    path : "applicationContext>/userPrivileges/anomalyDetectionWrite"
                } ],
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.isScenarioAndHasId

            },
            press : [ this.handleRemove, this ]
        });
        var oButtonEditTags = new sap.m.Button({
            icon : "sap-icon://tags",
            type : 'Transparent',
            tooltip : {
                parts : [ {
                    path : sPath + "/Type"
                }, {
                    path : sPath + "/Name"
                }, {
                    path : sPath + "/Namespace"
                } ],
                formatter : function(Type, Name, Namespace) {
                    if (Name && Namespace && Type) {
                        if (Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
                            return _that.getText("AddPatToScen_TOL", [ Namespace, Name ]);
                        } else if (Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE) {
                            return _that.getText("AddEvaToScen_TOL", [ Namespace, Name ]);
                        }
                    } else {
                        if (Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
                            return _that.getText("APatToScen_TOL");
                        } else if (Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE) {
                            return _that.getText("AEvaToScen_TOL");
                        }
                    }
                }
            },
            visible : "{applicationContext>/userPrivileges/anomalyDetectionWrite}",
            enabled : {
                path : sPath + "/Id",
                formatter : function(Id) {
                    if (Id) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            press : [ this.handleEditTags, this ]
        });

        var oButtonEditName = new sap.m.Button({
            icon : "sap-icon://edit",
            type : 'Transparent',
            tooltip : "{i18n>DefineNNS_TXT}",
            visible : { 
                parts:[{
                    path : "/Type"
                },{
                    path : "applicationContext>/userPrivileges/anomalyDetectionWrite"
                } ], 
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.isScenario
            },
            enabled : { 
                path : "IsNonOriginal",
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.invert
            },
            press : [ this.handleEditName, this ]
        });
        var oToolBar = new sap.m.Toolbar({
            content : [ oIcon, oObjectName, new sap.m.ToolbarSpacer({}), oButtonEditName, oButtonEditTags, oButtonRemove, oButtonExport, oButtonAnalyze ]
        });
        this.setHeaderToolbar(oToolBar);
    },

    _createChartSettings : function() {
        var sPath = this.getBindingContext().getPath();
        var oLayout = new sap.ui.commons.layout.MatrixLayout({
            columns : 2,
            layoutFixed : false,
            width : "100%",
            height : "100%",
            widths : [ "60%", "40%" ]
        });

        // Chart time range controls
        var oButtonFacetTimeRange = new sap.m.Button({
            icon : "sap-icon://edit",
            type : 'Transparent',
            iconFirst : false,
            text : {
                parts : [ {
                    path : sPath + "/FeatureProperties/Period/From"
                }, {
                    path : sPath + "/FeatureProperties/Period/To"
                }, {
                    path : 'applicationContext>/UTC'
                } ],
                formatter : function(sFrom, sTo, isUTC) {
                    if (sFrom && sTo) {
                        var sDateFrom = sap.secmon.ui.commons.Formatter.dateFormatterEx(isUTC, sFrom, 'short', 'short');
                        var sDateTo = sap.secmon.ui.commons.Formatter.dateFormatterEx(isUTC, sTo, 'short', 'short');
                        return sDateFrom + " - " + sDateTo + (isUTC === true ? ' UTC' : '');
                    } else {
                        return "";
                    }
                },
            },
            tooltip : "{i18n>ChangeChartTimeRange_TXT}",
            press : [ this.handleChangeFacetTimeRange, this ],
            enabled : {
                path : sPath + "/FeatureProperties/BaseMeasureId",
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.hasValue
            }
        });
        var oButtonSelectFacet = new sap.m.Button({
            icon : "sap-icon://wrench",
            type : 'Transparent',
            text : "{i18n>AssignChart_BUT}",
            tooltip : "{i18n>AssignChart_BUT}",
            enabled : {
                parts : [ {
                    path : sPath + "/Id"
                }, {
                    path : "IsNonOriginal"
                },{
                    path : "applicationContext>/userPrivileges/anomalyDetectionWrite"
                } ],
                formatter : function(id, isNonOriginal, bPrivilege) {
                    if (id || !bPrivilege) {
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            press : [ this.handleSelectFacet, this ]
        });

        var oButtonNavigate = new sap.m.Button({
            icon : "sap-icon://action",
            type : 'Transparent',
            tooltip : "{i18n>OpenChart_TOL}",
            press : [ this.handleOpenChart, this ],
            enabled : {
                path : sPath + "/FeatureProperties/BaseMeasureId",
                formatter : sap.secmon.ui.m.anomaly.util.Formatter.hasValue
            }
        });

        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "35px",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 1,
                hAlign : sap.ui.commons.layout.HAlign.Begin,
                content : [ oButtonSelectFacet, ]
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 1,
                hAlign : sap.ui.commons.layout.HAlign.End,
                content : [ oButtonFacetTimeRange, oButtonNavigate ]
            }) ]
        }));
        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                hAlign : sap.ui.commons.layout.HAlign.Begin,
                content : [ this._oChart ]
            }) ]
        }));

        return oLayout;
    },
    _createFeatureSettings : function() {
        var _that = this;
        var myModel = this.getModel("ObjectModel");
        var sPath = this.getBindingContext().getPath();
        var oLayout = new sap.ui.commons.layout.MatrixLayout({
            columns : 2,
            layoutFixed : false,
            width : "100%",
            height : "100%",
            widths : [ "50%", "50%" ]
        });
        if (!this._oFeatures) {
            this._oFeatures = new sap.ui.table.Table({
                width : "100%",
                rowHeight : 90,
                visibleRowCount : 4,
                visibleRowCountMode : sap.ui.table.VisibleRowCountMode.Fixed,// sap.ui.table.VisibleRowCountMode.Auto,
                selectionMode : sap.ui.table.SelectionMode.Multi,
                columnHeaderVisible : false,
                noDataText : "{i18n>AssignEV2Pattern_TXT}"
            });
            this._oFeatures.addColumn(new sap.ui.table.Column({
                width : "50%",
                hAlign : sap.ui.core.HorizontalAlign.Center,
                template : new sap.m.Link({
                    width : "100%",
                    wrapping : true,
                    textAlign : sap.ui.core.TextAlign.Begin,
                    text : {
                        parts : [ {
                            path : "Name"
                        }, {
                            path : "Namespace"
                        } ],
                        formatter : function(sName, sNamespace) {
                            if (sName && sNamespace) {
                                return sNamespace + ': ' + sName;
                            }
                        }
                    },
                    press : [ function(oEvent) {
                        // fire the naviation event with selected data
                        var oDataSelected = oEvent.getSource().getParent().getModel().getProperty(oEvent.getSource().getParent().getBindingContext().getPath());
                        _that.fireNav2Evalutation({
                            data : oDataSelected
                        });
                    }, this ]
                }).addStyleClass("sapEtdSubSubSubTitle")
            }));

            this._oFeatures.addColumn(new sap.ui.table.Column({
                width : "50%",
                hAlign : sap.ui.core.HorizontalAlign.Center,
                template : new sap.m.VBox({
                    items: [ new sap.secmon.ui.m.anomaly.ui.SNDistribution({
                        width : "220px",
                        height : "100px",
                        data : "{}",
                        isNonOriginal : "{" + sPath + "/IsNonOriginal}"
                    }),
                    new sap.m.Text({
                        text: {
                            path : "EvaluationStatusKey",
                            formatter : function(sTextKey) {
                                return _that.getText(sTextKey + "_SHORT");
                            }
                        },
                        tooltip: {
                            path : "EvaluationStatusKey",
                            formatter : function(sTextKey) {
                                return _that.getText(sTextKey);
                            }    
                        }
                    }).addStyleClass("sapEtdSubSubSubTitle") ]
                })
            }));
            this._oFeatures.setModel(myModel);
            this._oFeatures.bindRows(sPath + "/PatternProperties/Features");
        }
        var aF = myModel.getProperty(sPath + "/PatternProperties/Features");
        if (aF) {
            var numberOfFeatures = aF.length;
            if (numberOfFeatures <= 4 && numberOfFeatures > 0) {
                this._oFeatures.setVisibleRowCount(numberOfFeatures);
            }
        }

        var oButtonAddFeature =
                new sap.m.Button({
                    text : "{i18n>AssignEvaluation_TXT}",
                    icon : sap.ui.core.IconPool.getIconURI("add"),
                    tooltip : "{i18n>AssignEvaluation_TXT}",
                    type : 'Transparent',
                    enabled : {
                        path : "IsNonOriginal",
                        formatter : function(sValue) {
                            if (sValue === true) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    },
                    visible : "{applicationContext>/userPrivileges/anomalyDetectionWrite}",
                    press : [
                            function(oEvent) {
                                var aFilter = [];
                                var aFeatureList = myModel.getProperty(sPath + "/PatternProperties/Features");
                                if (aFeatureList) {
                                    for (var i = 0; i < aFeatureList.length; i++) {
                                        aFilter.push({
                                            Type : sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.DIMENSIONS,
                                            Id : aFeatureList[i].Id
                                        });
                                    }
                                }

                                var oDialog = new sap.m.Dialog({
                                    title : _that.getText("AssignEvaluation_TIT"),
                                    afterClose : function() {
                                        oDialog.destroyContent();
                                        oDialog.destroy();
                                    },
                                    buttons : [ new sap.m.Button({
                                        text : _that.getText("BU_FLOD_LBL_Close"),
                                        press : function() {
                                            oDialog.close();
                                        }
                                    }) ]
                                });
                                _that.addDependent(oDialog);
                                oDialog.addContent(new sap.secmon.ui.m.anomaly.ui.FeatureExplorer({
                                    filters : aFilter,
                                    selectObject : [
                                            function(oEvent) {
                                                var oUIModel = this.getModel("uiModel");
                                                if (oUIModel.getProperty("/savedItemSelected") && !oUIModel.getProperty("/infoMessageWasShown")) {
                                                    sap.m.MessageToast.show(_that.getText("StatusRelatesToSavedPattern", [ this.getModel().getProperty("/Name") ]), {
                                                        duration: 5000
                                                    });
                                                    oUIModel.setProperty("/infoMessageWasShown", true);
                                                }
                                                var oData = oEvent.getParameter("data");
                                                // read feature data
                                                var sURL =
                                                        sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH + '?Type=' + oData.Type + '&Name=' + encodeURIComponent(oData.Name) +
                                                                '&Namespace=' + encodeURIComponent(oData.Namespace) + '&Id=' + oData.Id;

                                                var oModelTmp = new sap.ui.model.json.JSONModel();
                                                oModelTmp.loadData(sURL, null, false);
                                                var oModelTmpData = oModelTmp.getData();

                                                // copy feature data
                                                var aFeatures = myModel.getProperty(sPath + "/PatternProperties/Features");

                                                var iThreshold = null;
                                                if (oModelTmpData.Content[0].FeatureProperties.AggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.SND) {
                                                    iThreshold = 2;
                                                }
                                                var featureCopy = {
                                                    Id : oModelTmpData.Content[0].Id,
                                                    Name : oModelTmpData.Name,
                                                    Namespace : oModelTmpData.Namespace,
                                                    AggregationMethod : oModelTmpData.Content[0].FeatureProperties.AggregationMethod,
                                                    Threshold : iThreshold,
                                                    Dimensions : oModelTmpData.Content[0].FeatureProperties.Dimensions,
                                                    IncludeNegativeScore : oModelTmpData.Content[0].FeatureProperties.IncludeNegativeScore,
                                                    BaselineSampleDuration : oModelTmpData.Content[0].FeatureProperties.BaselineSampleDuration,
                                                    EvaluationStatusKey: oModelTmpData.Content[0].EvaluationStatusKey
                                                };

                                                aFeatures.unshift(featureCopy);
                                                myModel.setProperty(sPath + "/PatternProperties/Features", aFeatures);

                                                if (aFeatures.length <= 4 && aFeatures.length > 0) {
                                                    this._oFeatures.setVisibleRowCount(aFeatures.length);
                                                }
                                                myModel.refresh(true);
                                            }, this ],
                                    facetListRetrieved : [ function(oEvent) {
                                        oEvent.getSource().getParent().setBusy(false);
                                        var sStatus = oEvent.getParameter("status");
                                        if (sStatus === 'E') {
                                            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), _that.getText("ChartsNotRet_MSG"));
                                        }
                                    }, this ]
                                }));
                                oDialog.open();
                            }, this ]
                });
        var oButtonRemoveFeature = new sap.m.Button({
            text : "{i18n>RemoveEvaluation_TXT}",
            icon : sap.ui.core.IconPool.getIconURI("delete"),
            tooltip : "{i18n>RemoveEvaluation_TXT}",
            type : 'Transparent',
            enabled : {
                path : "IsNonOriginal",
                formatter : function(sValue) {
                    if (sValue === true) {
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            visible :  "{applicationContext>/userPrivileges/anomalyDetectionWrite}",
            press : [ function(oEvent) {
                var oUIModel = this.getModel("uiModel");
                if (oUIModel.getProperty("/savedItemSelected") && !oUIModel.getProperty("/infoMessageWasShown")) {
                    sap.m.MessageToast.show(_that.getText("StatusRelatesToSavedPattern", [ this.getModel().getProperty("/Name") ]), {
                        duration: 5000
                    });
                    oUIModel.setProperty("/infoMessageWasShown", true);
                }
                // get index to be deleted
                var idx = this._oFeatures.getSelectedIndex();
                // remove selected row from feature array
                var aFeatures = this.getModel().getProperty(sPath + '/PatternProperties/Features');
                aFeatures.splice(idx, 1);
                // update Model
                this.getModel().setProperty(sPath + '/PatternProperties/Features', aFeatures);
                // update visible number of rows
                if (aFeatures.length <= 4 && aFeatures.length > 0) {
                    this._oFeatures.setVisibleRowCount(aFeatures.length);
                } else if (aFeatures.length === 0) {
                    this._oFeatures.setVisibleRowCount(4);
                }
            }, this ]
        });

        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "35px",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                vAlign : sap.ui.commons.layout.VAlign.Top,
                hAlign : sap.ui.commons.layout.HAlign.Begin,
                content : [ oButtonAddFeature, oButtonRemoveFeature ]
            }) ]
        }));
        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                vAlign : sap.ui.commons.layout.VAlign.Top,
                content : [ this._oFeatures ]
            }) ]
        }));

        return oLayout;
    },

    _createFeatureProperties : function() {
        var _that = this;
        var sPath = this.getBindingContext().getPath();
        var dbInitialValues = {};
        function aggregationMethodFormatter(sValue) {
            if (sValue === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) {
                return true;
            } else {
                return false;
            }
        }
        if (this.getModel().getProperty(sPath + "/Id") !== null) {
            dbInitialValues = {
                BaselineSampleDuration : this.getModel().getProperty(sPath + "/FeatureProperties/BaselineSampleDuration"),
                AggregationMethod : this.getModel().getProperty(sPath + "/FeatureProperties/AggregationMethod"),
                AggregationView : this.getModel().getProperty(sPath + "/FeatureProperties/AggregationView"),
                Dimensions : this.getModel().getProperty(sPath + "/FeatureProperties/Dimensions")
            };
            // needs to be changed, because otherwise it has the same data as
            // the model
            dbInitialValues = jQuery.extend(true, {}, dbInitialValues);
        }

        var oStatusText = new sap.m.Text({
            text: {
                path : sPath + "/EvaluationStatusKey",
                formatter : function(sTextKey) {
                    return _that.getText(sTextKey);
                }
            }
        });

        var oTooltip = new sap.ui.commons.RichTooltip({
            title : "{i18nCommon>Warning_TIT}",
            imageSrc : "/sap/secmon/ui/m/anomaly/ui/img/warning.png",
            text : "{i18n>DataResetTooltip}"
        });

        var oLabelDescription = new sap.m.Label({
            text : this.getCommonText("Description_LBL")
        });

        var oTAreaDescription = new sap.m.TextArea({
            growing : false,
            value : {
                path : "Description",
                mode : sap.ui.model.BindingMode.TwoWay,
                formatter : function(sValue) {
                    return sValue;
                }
            },
            editable : { 
                parts : [{
                    path : 'applicationContext>/userPrivileges/anomalyDetectionWrite'
                },{
                    path : "IsNonOriginal"
                }], 
                formatter : function(bPrivilege, bValue) {
                    if (!bPrivilege || bValue) {
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            change : function(oEvent) {
                this.getBindingContext().getModel().setProperty(sPath + "/Description", this.getValue());
            }
        });
        var oMethodLbl = new sap.m.Label({
            text : "{i18n>EvaluationMethod_LBL}",
        });
        var oDdbMethod =
                new sap.m.ComboBox({
                    selectedKey : "{FeatureProperties/AggregationMethod}",
                    items : [ new sap.ui.core.ListItem({
                        text : "{i18n>SND_TXT}",
                        key : sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.SND
                    }), new sap.ui.core.ListItem({
                        text : "{i18n>RVM_TXT}",
                        key : sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM
                    }) ],
                    enabled : {
                        parts : [{
                            path : "IsNonOriginal"
                        },{
                            path : "applicationContext>/userPrivileges/anomalyDetectionWrite"
                        }],
                        formatter : function(sValue, bPrivilege) {
                            if (sValue || !bPrivilege) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    },
                    change : function(oEvent) {
                        var aDimensions = _that.getModel().getProperty(_that.getBindingContext().getPath() + "/FeatureProperties/Dimensions");
                        var i;
                        if (oEvent.getSource().getSelectedKey() === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.SND) {
                            oEvent.getSource().getBindingContext().getModel().setProperty("FeatureProperties/AggregationView", sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_TIME_UNIT.HOURLY_DAY,
                                    oEvent.getSource().getBindingContext());
                            oEvent.getSource().getBindingContext().getModel().setProperty("FeatureProperties/AggregationPivotView",
                                    sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_TIME_UNIT_PIVOT.HOURLY_DAY, oEvent.getSource().getBindingContext());
                            if (aDimensions) {
                                for (i = 0; i < aDimensions.length; i++) {
                                    aDimensions[i].Included = 1;
                                }
                                _that.getModel().setProperty(_that.getBindingContext().getPath() + "/FeatureProperties/Dimensions", aDimensions);
                            }
                            oEvent.getSource().getBindingContext().getModel().setProperty("FeatureProperties/IncludeNegativeScore", 0, oEvent.getSource().getBindingContext());
                        } else if (oEvent.getSource().getSelectedKey() === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) {
                            oEvent.getSource().getBindingContext().getModel().setProperty("FeatureProperties/AggregationView", null, oEvent.getSource().getBindingContext());
                            oEvent.getSource().getBindingContext().getModel().setProperty("FeatureProperties/AggregationPivotView", null, oEvent.getSource().getBindingContext());
                            oEvent.getSource().getBindingContext().getModel().setProperty("FeatureProperties/IncludeNegativeScore", null, oEvent.getSource().getBindingContext());
                        }

                        if (dbInitialValues.AggregationMethod !== undefined && oEvent.getSource().getSelectedKey() !== dbInitialValues.AggregationMethod) {
                            oEvent.getSource().addStyleClass("sapEtdWarningValueState");
                            // setTooltip(oTooltip) doesn't work here. Dunno why
                            oEvent.getSource().setTooltip(new sap.ui.commons.RichTooltip({
                                title : "{i18nCommon>Warning_TIT}",
                                imageSrc : "/sap/secmon/ui/m/anomaly/ui/img/warning.png",
                                text : "{i18n>DataResetTooltip}"
                            }));
                        } else {
                            oEvent.getSource().removeStyleClass("sapEtdWarningValueState");
                            oEvent.getSource().setTooltip("");
                        }
                        if (aDimensions) {
                            for (i = 0; i < aDimensions.length; i++) {
                                if (dbInitialValues.Dimensions !== undefined && dbInitialValues.Dimensions[i].Included !== aDimensions[i].Included) {
                                    _that.Dimensions[i].addStyleClass("sapEtdWarningValueState");
                                    // setTooltip(oTooltip) doesn't work here. Dunno why
                                    _that.Dimensions[i].setTooltip(new sap.ui.commons.RichTooltip({
                                        title : "{i18nCommon>Warning_TIT}",
                                        imageSrc : "/sap/secmon/ui/m/anomaly/ui/img/warning.png",
                                        text : "{i18n>DataResetTooltip}"
                                    }));
                                } else {
                                    _that.Dimensions[i].removeStyleClass("sapEtdWarningValueState");
                                    _that.Dimensions[i].setTooltip("");
                                }
                            }
                        }
                        if (dbInitialValues.AggregationView !== undefined && _that.MethodUnit.getSelectedKey() !== dbInitialValues.AggregationView) {
                            _that.MethodUnit.addStyleClass("sapEtdWarningValueState");
                            // setTooltip(oTooltip) doesn't work here. Dunno why
                            _that.MethodUnit.setTooltip(new sap.ui.commons.RichTooltip({
                                title : "{i18nCommon>Warning_TIT}",
                                imageSrc : "/sap/secmon/ui/m/anomaly/ui/img/warning.png",
                                text : "{i18n>DataResetTooltip}"
                            }));

                        } else {
                            _that.MethodUnit.removeStyleClass("sapEtdWarningValueState");
                            _that.MethodUnit.setTooltip("");
                        }
                    }
                });

        var oTimerangeLbl = new sap.m.Label({
            text : "{i18n>TimeRangeInWeeks_LBL}",
        });

        var oTimerangeInput = new sap.m.Input({
            width : "50px",
            value : "{path: 'FeatureProperties/BaselineSampleDuration', type: 'sap.ui.model.type.Integer'}",
            enabled : {
                parts : [{
                    path : 'applicationContext>/userPrivileges/anomalyDetectionWrite'
                },{
                    path : "IsNonOriginal"
                }], 
                formatter : function(bPrivilege, bValue) {
                    if (!bPrivilege || bValue) {
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            change : function(oEvent) {
                var newValue = oEvent.getSource().getBindingContext().getModel().getProperty(sPath + "/FeatureProperties/BaselineSampleDuration");
                if (dbInitialValues.BaselineSampleDuration !== undefined && parseInt(newValue) > parseInt(dbInitialValues.BaselineSampleDuration)) {
                    oEvent.getSource().addStyleClass("sapEtdWarningValueState");
                    oEvent.getSource().setTooltip(oTooltip);
                } else {
                    oEvent.getSource().removeStyleClass("sapEtdWarningValueState");
                    oEvent.getSource().setTooltip("");
                }
            }
        });
        var oMethodUnitLbl = new sap.m.Label({
            text : "{i18n>TimeUnit_LBL}",
            visible : {
                path : "FeatureProperties/AggregationMethod",
                formatter : function(sValue) {
                    if (sValue === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
        });
        var oDdbMethodUnit =
                new sap.m.ComboBox({
                    selectedKey : "{FeatureProperties/AggregationView}",
                    items : [ new sap.ui.core.ListItem({
                        text : "{i18n>HourlyDay_TXT}",
                        key : sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_TIME_UNIT.HOURLY_DAY
                    }), new sap.ui.core.ListItem({
                        text : "{i18n>QuarterlyDay_TXT}",
                        key : sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_TIME_UNIT.QUARTERLY_DAY
                    }) ],
                    visible : {
                        path : "FeatureProperties/AggregationMethod",
                        formatter : function(sValue) {
                            if (sValue === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    },
                    enabled : {
                        parts : [{
                            path : 'applicationContext>/userPrivileges/anomalyDetectionWrite'
                        },{
                            path : "IsNonOriginal"
                        }], 
                        formatter : function(bPrivilege, bValue) {
                            if (!bPrivilege || bValue) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    },
                    change : function(oEvent) {
                        if (dbInitialValues.AggregationView !== undefined && oEvent.getSource().getSelectedKey() !== dbInitialValues.AggregationView) {
                            oEvent.getSource().addStyleClass("sapEtdWarningValueState");
                            oEvent.getSource().setTooltip(oTooltip);
                        } else {
                            oEvent.getSource().removeStyleClass("sapEtdWarningValueState");
                            oEvent.getSource().setTooltip("");
                        }
                        var sKey = oEvent.getSource().getSelectedKey();
                        if (sKey === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_TIME_UNIT.HOURLY_DAY) {
                            oEvent.getSource().getBindingContext().getModel().setProperty("FeatureProperties/AggregationPivotView",
                                    sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_TIME_UNIT_PIVOT.HOURLY_DAY, oEvent.getSource().getBindingContext());
                        } else if (sKey === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_TIME_UNIT.QUARTERLY_DAY) {
                            oEvent.getSource().getBindingContext().getModel().setProperty("FeatureProperties/AggregationPivotView",
                                    sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_TIME_UNIT_PIVOT.QUARTERLY_DAY, oEvent.getSource().getBindingContext());
                        }
                    }
                });
        this.MethodUnit = oDdbMethodUnit;
        var oIncludeNegativeScoreLbl = new sap.m.Label({
            text : "{i18n>IncludeNegativeScore_LBL}",
            visible : {
                path : "FeatureProperties/AggregationMethod",
                formatter : aggregationMethodFormatter
            }
        });
        var oIncludeNegativeScore = new sap.m.ComboBox({
            selectedKey : "{FeatureProperties/IncludeNegativeScore}",
            items : [ new sap.ui.core.ListItem({
                text : "{i18n>OnlyAbove_TXT}",
                key : 0
            }), new sap.ui.core.ListItem({
                text : "{i18n>AboveAndBelow_TXT}",
                key : 1
            }) ],
            enabled : {
                parts : [{
                    path : 'applicationContext>/userPrivileges/anomalyDetectionWrite'
                },{
                    path : "IsNonOriginal"
                }], 
                formatter : function(bPrivilege, bValue) {
                    if (!bPrivilege || bValue) {
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            visible : {
                path : "FeatureProperties/AggregationMethod",
                formatter : function(sValue) {
                    if (sValue === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
        });

        var oAnomalyTypeLbl = new sap.m.Label({
            text : "{i18n>AnomalyType_LBL}"
        });
        var oVLayout = new sap.ui.commons.layout.VerticalLayout();
        var aDimensions = this.getModel().getProperty(this.getBindingContext().getPath() + "/FeatureProperties/Dimensions");
        this.Dimensions = [];
        if (aDimensions) {
            for (var i = 0; i < aDimensions.length; i++) {
                var oDimension = new sap.m.CheckBox({
                    text : {
                        path : "FeatureProperties/Dimensions/" + i + "/displayName"
                    },
                    editable : {
                        path : "FeatureProperties/AggregationMethod",
                        formatter : aggregationMethodFormatter

                    },
                    enabled : {
                        path : "IsNonOriginal",
                        formatter : function(sValue) {
                            if (sValue) {
                                return false;
                            } else {
                                return true;
                            }
                        }
                    },
                    selected : {
                        path : "FeatureProperties/Dimensions/" + i + "/Included",
                        formatter : function(iIncluded) {
                            if (iIncluded === 1) {
                                return true;
                            } else {
                                return false;
                            }
                        }
                    },
                    select : function(oEvent) {
                        var iSelected = 0, i;
                        if (oEvent.getParameter("selected") === true) {
                            iSelected = 1;
                        }
                        // update model
                        _that.getModel().setProperty(_that.getBindingContext().getPath() + '/' + oEvent.getSource().mBindingInfos.selected.binding.getPath(), iSelected);

                        for (i = 0; i < _that.Dimensions.length; i++) {
                            if (_that.Dimensions[i].getId() === oEvent.getSource().getId()) {
                                if (dbInitialValues.Dimensions !== undefined && iSelected !== dbInitialValues.Dimensions[i].Included) {
                                    _that.Dimensions[i].addStyleClass("sapEtdWarningValueState");
                                    _that.Dimensions[i].setTooltip(oTooltip);
                                } else {
                                    _that.Dimensions[i].removeStyleClass("sapEtdWarningValueState");
                                    _that.Dimensions[i].setTooltip("");
                                }
                                break;
                            }
                        }
                        // update count
                        var aContent = oEvent.getSource().getParent().getContent();
                        var count = 0;
                        for (i = 0; i < aContent.length; i++) {
                            if (aContent[i].getSelected() === true) {
                                count++;
                            }
                        }
                        _that.getModel().setProperty(_that.getBindingContext().getPath() + "/FeatureProperties/AggregationCount", count);
                    }
                });
                oVLayout.addContent(oDimension);
                _that.Dimensions.push(oDimension);
            }
        }

        var oLayout =
                new sap.ui.layout.form.SimpleForm({
                    maxContainerCols : 2,
                    editable : true,
                    content : [ oStatusText, oLabelDescription, oTAreaDescription, oMethodLbl, oDdbMethod, oTimerangeLbl, oTimerangeInput, oMethodUnitLbl, oDdbMethodUnit, oIncludeNegativeScoreLbl,
                            oIncludeNegativeScore, oAnomalyTypeLbl, oVLayout ]
                });

        return oLayout;
    },
    _createPatternProperties : function() {
        var _that = this;
        var sPath = this.getBindingContext().getPath();

        var oStatusText = new sap.m.Text({
            text: {
                path : sPath + "/PatternProperties/PatternStatusKey",
                formatter : function(sTextKey) {
                    return _that.getText(sTextKey);
                }
            }
        });

        // Description
        var oDescriptionTextAreaLbl = new sap.m.Label({
            text : this.getCommonText("Description_LBL")
        });
        var oDescriptionTextArea = new sap.m.TextArea({
            growing : false,
            value : {
                path : "Description",
                formatter : function(sValue) {
                    return sValue;
                }
            },
            editable : {
                parts : [{
                    path : "IsNonOriginal"
                },{
                    path : "applicationContext>/userPrivileges/anomalyDetectionWrite"
                }],
                formatter : function(sValue, bPrivilege){
                    if (sValue || !bPrivilege) {
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            change : function(oEvent) {
                this.getBindingContext().getModel().setProperty(this.getBindingContext().getPath() + "/Description", this.getValue());
            }
        });

        // Execution Output
        var oDdbExecOutputLbl = new sap.m.Label({
            text : "{i18n>NotificationType_LBL}"
        });
        var oDdbExecOutput = new sap.m.ComboBox({
            selectedKey : "{PatternProperties/ExecutionOutput}",
            enabled : {
                parts : [{
                    path : "IsNonOriginal"
                },{
                    path : "applicationContext>/userPrivileges/anomalyDetectionWrite"
                }],
                formatter : function(sValue, bPrivilege) {
                    if (sValue || !bPrivilege) {
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            items : [ new sap.ui.core.ListItem({
                text : "{i18n>Alert_TXT}",
                key : sap.secmon.ui.m.anomaly.ui.Constants.C_NOTIFICATION_TYPE.ALERT
            }), new sap.ui.core.ListItem({
                text : "{i18n>Indicator_TXT}",
                key : sap.secmon.ui.m.anomaly.ui.Constants.C_NOTIFICATION_TYPE.INDICATOR
            }) ]
        });

        // Alert Function
        var oDdbFunctionLbl = new sap.m.Label({
            text : "{i18n>NotificationMode_LBL}"
        });

        var oDdbFunction = new sap.m.ComboBox({
            selectedKey : "{PatternProperties/Function}",
            items : [ new sap.ui.core.ListItem({
                text : "{i18n>AllEvaluationInPattern_TXT}",
                key : sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MIN
            }), new sap.ui.core.ListItem({
                text : "{i18n>OneEvaluationInPattern_TXT}",
                key : sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MAX
            }), new sap.ui.core.ListItem({
                text : "{i18n>AvgEvaluationInPattern_TXT}",
                key : sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.AVG
            }) ],
            enabled : "{applicationContext>/userPrivileges/anomalyDetectionWrite}"
        });

        // Severity
        var oDdbSeverityLbl = new sap.m.Label({
            text : "{i18nCommon>Severity_LBL}"
        });
        var oDdbSeverity = new sap.m.ComboBox({
            selectedKey : "{PatternProperties/Severity}",
            items : [ new sap.ui.core.ListItem({
                text : "{i18nCommon>Severity_Low_LBL}",
                key : "LOW"
            }), new sap.ui.core.ListItem({
                text : "{i18nCommon>Severity_Medium_LBL}",
                key : "MEDIUM"
            }), new sap.ui.core.ListItem({
                text : "{i18nCommon>Severity_High_LBL}",
                key : "HIGH"
            }), new sap.ui.core.ListItem({
                text : "{i18nCommon>Severity_VeryHigh_LBL}",
                key : "VERY HIGH"
            }) ],
            enabled : "{applicationContext>/userPrivileges/anomalyDetectionWrite}"
        });

        // Status
        var oDdbStatusLbl = new sap.m.Label({
            text : "{i18nCommon>Status_LBL}"
        });
        var oDdbStatus = new sap.m.ComboBox({
            selectedKey : "{PatternProperties/Status}",
            items : [ new sap.ui.core.ListItem({
                text : "{i18nCommon>Inactive_LBL}",
                key : "INACTIVE"
            }), new sap.ui.core.ListItem({
                text : "{i18nCommon>Active_LBL}",
                key : "ACTIVE"
            }) ],
            enabled : "{applicationContext>/userPrivileges/anomalyDetectionWrite}"
        });

        // Testmode
        var oTestModeLbl = new sap.m.Label({
            text : "{i18n>Testmode_LBL}",
            visible : {
                path : "PatternProperties/ExecutionOutput",
                formatter : function(sValue) {
                    if (sValue === 'ALERT') {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        });

        var oTestMode = new sap.m.CheckBox({
            selected : {
                path : "PatternProperties/TestMode",
                formatter : function(sValue) {
                    if (sValue === "TRUE") {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            select : function(oEvent) {
                if (oEvent.getParameter("selected") === true) {
                    this.getBindingContext().getModel().setProperty(this.getBindingContext().getPath() + "/PatternProperties/TestMode", "TRUE");
                } else {
                    this.getBindingContext().getModel().setProperty(this.getBindingContext().getPath() + "/PatternProperties/TestMode", "FALSE");
                }
            },
            visible : {
                path : "PatternProperties/ExecutionOutput",
                formatter : function(sValue) {
                    if (sValue === sap.secmon.ui.m.anomaly.ui.Constants.C_NOTIFICATION_TYPE.ALERT) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            enabled : "{applicationContext>/userPrivileges/anomalyDetectionWrite}"
        });

        var oLayout =
                new sap.ui.layout.form.SimpleForm({
                    maxContainerCols : 2,
                    editable : true,
                    content : [ oStatusText, oDescriptionTextAreaLbl, oDescriptionTextArea, oDdbExecOutputLbl, oDdbExecOutput, oDdbFunctionLbl, oDdbFunction, oDdbSeverityLbl, oDdbSeverity, 
                        oDdbStatusLbl, oDdbStatus, oTestModeLbl, oTestMode ]
                });

        return oLayout;
    },
    /**
     * Is invoked when the user exports pattern
     * 
     * @param oEvent
     */

    handleExport : function(oEvent) {
        var _that = this;
        var oData = this.getModel().getProperty(oEvent.getSource().getBindingContext().getPath());
        if (oData.Id) {
            var oPayload = {
                Id : oData.Id,
                ObjectType : "AnomalyPattern",
                ObjectName : oData.Name,
                ObjectNamespace : oData.Namespace
            };
            // Ajax
            var promise = new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.m.anomaly.ui.Constants.C_EXPORT_SERVICE, JSON.stringify(oPayload));
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), jqXHR.responseText);
            });
            promise.done(function(data, textStatus, jqXHR) {
                var oData = _that.getModel("ObjectModel").getData();
                var type = "";
                switch (oData.Type) {
                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
                    type = _that.getText("Scenario_TXT");
                    break;
                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                    type = _that.getText("Evaluation_TXT");
                    break;
                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                    type = _that.getText("Pattern_TXT");
                    break;
                }
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, _that.getText("ExportSuccess_MSG", [ type, oData.Namespace, oData.Name ]));
            });
        } else {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("ExportError_MSG"));
        }
    },
    /**
     * Is invoked when the user remove evaluation or pattern that has not been saved yet
     * 
     * @param oEvent
     */

    handleRemove : function(oEvent) {
        // fire the naviation event with selected data
        var oDataSelected = this.getModel().getProperty(oEvent.getSource().getBindingContext().getPath());
        this.fireRemoveMe({
            data : oDataSelected
        });
    },
    /**
     * Is invoked when the user changes tags
     * 
     * @param oEvent
     */

    handleEditTags : function(oEvent) {
        var myModel = this.getModel();
        var sPath = this.getBindingContext().getPath();

        // load Tags
        var oProperty = myModel.getProperty(sPath);
        var aTags = this._getScenarioTags(oProperty.Type, oProperty.Id);

        var oTagsTableModel = new sap.ui.model.json.JSONModel();
        oTagsTableModel.setData({
            Type : oProperty.Type,
            Id : oProperty.Id,
            Name : oProperty.Name,
            Namespace : oProperty.Namespace,
            Tags : aTags
        });

        // build UI
        var oLayout = new sap.ui.commons.layout.MatrixLayout({
            columns : 2,
            layoutFixed : false,
            width : "400px",
            height : "300px",
            widths : [ "50%", "50%" ]
        });
        this._oTagsTable = new sap.ui.table.Table({
            visibleRowCountMode : sap.ui.table.VisibleRowCountMode.Fixed,
            selectionMode : sap.ui.table.SelectionMode.Multi,
            columnHeaderVisible : false,
            noDataText : this.getText("NoTagsAvailable_TXT")
        });
        this._oTagsTable.addColumn(new sap.ui.table.Column({
            hAlign : sap.ui.core.HorizontalAlign.Begin,
            template : new sap.ui.commons.TextView({
                text : "{Name}"
            })
        }));
        this._oTagsTable.addColumn(new sap.ui.table.Column({
            hAlign : sap.ui.core.HorizontalAlign.Begin,
            template : new sap.ui.commons.TextView({
                text : "{Namespace}"
            })
        }));
        this._oTagsTable.setModel(oTagsTableModel);
        this._oTagsTable.bindRows("/Tags");

        if (aTags) {
            var numberOfTags = aTags.length;
            if (numberOfTags <= 10 && numberOfTags > 0) {
                this._oTagsTable.setVisibleRowCount(numberOfTags);
            }
        }
        var oClose = new sap.ui.commons.Link({
            text : this.getCommonText("Close_BUT"),
            press : [ function(oEvent) {
                // close and destroy TagsPopup
                oEvent.getSource().getParent().getParent().getParent().getParent().destroy();
            }, this ]
        });
        var oButtonAdd =
                new sap.m.Button({
                    text : "{i18n>AddTag_TXT}",
                    icon : sap.ui.core.IconPool.getIconURI("add"),
                    tooltip : "{i18n>AddTag_TXT}",
                    type : 'Transparent',
                    press : [
                            function(oEvent) {
                                var _that = this;
                                var oDialog =
                                        new sap.m.Dialog({
                                            title : _that.getText("AddTag_TXT"),
                                            contentWidth : "500px",
                                            contentHeight : "120px",
                                            afterClose : function() {
                                                _that.fireRefreshRequested();
                                                oDialog.destroyContent();
                                                oDialog.destroy();
                                            },
                                            buttons : [
                                                    new sap.m.Button({
                                                        text : _that.getText("OK_TXT"),
                                                        tooltip : _that.getText("AddTag_TXT"),
                                                        press : [
                                                                function(oEvent) {
                                                                    var _that = this;
                                                                    var sName = oEvent.getSource().getParent().getParent().getContent()[0].getRows()[1].getCells()[1].getContent()[0].getValue();
                                                                    var sNamespace = oEvent.getSource().getParent().getParent().getContent()[0]
                                                                        .getRows()[2].getCells()[1].getContent()[0].getSelectedKey();
                                                                    var oMyModel = _that.getModel("ObjectModel");

                                                                    var oObject = oMyModel.getProperty(_that.getBindingContext().getPath());
                                                                    var oTag = {
                                                                        CreatedBy : null,
                                                                        CreatedTimestamp : null,
                                                                        Id : oObject.Id,
                                                                        Name : sName,
                                                                        Namespace : sNamespace,
                                                                        Prefix : "Manual",
                                                                        Type : oObject.Type
                                                                    };

                                                                    if (!sName || !sNamespace) {
                                                                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), _that
                                                                                .getText("NNSNotDefined_MSG"));
                                                                        return;
                                                                    }
                                                                    // create tag via
                                                                    // AJAX Post
                                                                    // Ajax
                                                                    var promise = new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.m.anomaly.ui.Constants.C_TAG_PATH, JSON.stringify(oTag));
                                                                    promise.fail(function(jqXHR, textStatus, errorThrown) {
                                                                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"),
                                                                                jqXHR.responseText);
                                                                    });
                                                                    promise.done(function(data, textStatus, jqXHR) {
                                                                        // update Table
                                                                        var aTags = [];
                                                                        var oTagTable = _that._oTagsTable;
                                                                        var oTableData = oTagTable.getModel().getData();
                                                                        var oModel = new sap.ui.model.json.JSONModel();
                                                                        var sURL = sap.secmon.ui.m.anomaly.ui.Constants.C_TAG_PATH + '?Type=' + oTableData.Type + '&Id=' + oTableData.Id;
                                                                        oModel.loadData(sURL, null, false);
                                                                        if (oModel.getData()) {
                                                                            $.each(oModel.getData(), function(index, oTag) {
                                                                                if (oTag.Prefix === "Manual") {
                                                                                    aTags.push(oTag);
                                                                                }
                                                                            });
                                                                        }
                                                                        oTagTable.getModel().setProperty("/Tags", aTags);
                                                                        // update
                                                                        // visible
                                                                        // number
                                                                        // of rows
                                                                        if (aTags.length <= 10 && aTags.length > 0) {
                                                                            oTagTable.setVisibleRowCount(aTags.length);
                                                                        } else if (aTags.length === 0) {
                                                                            oTagTable.setVisibleRowCount(10);
                                                                        }
                                                                        // add
                                                                        // notification
                                                                        var type = "";
                                                                        switch (oTableData.Type) {
                                                                        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
                                                                            type = _that.getText("Scenario_TXT");
                                                                            break;
                                                                        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                                                                            type = _that.getText("Evaluation_TXT");
                                                                            break;
                                                                        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                                                                            type = _that.getText("Pattern_TXT");
                                                                            break;
                                                                        }
                                                                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, _that.getText("TagAssignSuccess_TXT",
                                                                                [ type, oTableData.Namespace, oTableData.Name ]));
                                                                    });
                                                                    oEvent.getSource().getParent().close();
                                                                    // fire update
                                                                    _that.fireUpdate();
                                                                }, this ]
                                                    }), new sap.m.Button({
                                                        text : _that.getText("Cancel_TXT"),
                                                        tooltip : _that.getText("Cancel_TXT"),
                                                        press : function(oEvent) {
                                                            oDialog.close();
                                                        }
                                                    }) ]
                                        });

                                oDialog.addContent(this._createNNSLayout());
                                oDialog.open();
                            }, this ]
                });

        var oButtonRemove = new sap.m.Button({
            text : "{i18n>RemoveTag_TXT}",
            icon : sap.ui.core.IconPool.getIconURI("decline"),
            tooltip : "{i18n>RemoveTag_TXT}",
            type : 'Transparent',
            visible: "{applicationContext>/userPrivileges/anomalyDetectionWrite}",
            press : [ function(oEvent) {
                // get index to be deleted
                var _that = this;
                var oSelected = this._oTagsTable.getRows()[this._oTagsTable.getSelectedIndex()];
                if (oSelected) {
                    var oTag2BDeleted = oSelected.getModel().getProperty(oSelected.getBindingContext().getPath());

                    // Ajax
                    var promise = new sap.secmon.ui.commons.AjaxUtil().deleteJSON(sap.secmon.ui.m.anomaly.ui.Constants.C_TAG_PATH, JSON.stringify(oTag2BDeleted), false);
                    promise.fail(function(jqXHR, textStatus, errorThrown) {
                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), jqXHR.responseText);
                    });
                    promise.done(function(data, textStatus, jqXHR) {

                        // update Table
                        var aTags = [];
                        var oTagTable = _that._oTagsTable;
                        var oTableData = oTagTable.getModel().getData();
                        var oModel = new sap.ui.model.json.JSONModel();
                        var sURL = sap.secmon.ui.m.anomaly.ui.Constants.C_TAG_PATH + '?Type=' + oTableData.Type + '&Id=' + oTableData.Id;
                        oModel.loadData(sURL, null, false);
                        if (oModel.getData()) {
                            $.each(oModel.getData(), function(index, oTag) {
                                if (oTag.Prefix === "Manual") {
                                    aTags.push(oTag);
                                }
                            });
                        }
                        oTagTable.getModel().setProperty("/Tags", aTags);
                        // update visible number of rows
                        if (aTags.length <= 10 && aTags.length > 0) {
                            oTagTable.setVisibleRowCount(aTags.length);
                        } else if (aTags.length === 0) {
                            oTagTable.setVisibleRowCount(10);
                        }
                        // fire update
                        _that.fireUpdate();
                        _that.fireRefreshRequested();
                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, _that.getText("TagDelSuccess_MSG"));
                    });
                } else {
                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), _that.getText("ErrorNoTagSelected_TXT"));
                }
            }, this ]
        });

        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "35px",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 1,
                vAlign : sap.ui.commons.layout.VAlign.Bottom,
                hAlign : sap.ui.commons.layout.HAlign.Begin,
                content : [ oButtonAdd, oButtonRemove ]
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 1,
                vAlign : sap.ui.commons.layout.VAlign.Bottom,
                hAlign : sap.ui.commons.layout.HAlign.End,
                content : [ oClose ]
            }) ]
        }));
        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                vAlign : sap.ui.commons.layout.VAlign.Top,
                content : [ this._oTagsTable ]
            }) ]
        }));
        var oTagsPopup = new sap.ui.ux3.ToolPopup({
            content : [ oLayout ],
            opener : oEvent.getSource().getId()
        });
        oTagsPopup.open();

    },
    /**
     * Is invoked when user changes name and namespace of feature or pattern created from scenario view
     * 
     * @param oEvent
     */
    handleEditName : function(oEvent) {
        var _that = this;
        var oModelTmp = this.getModel();
        var sPath = _that.getBindingContext().getPath();
        var oMain = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : true,
            widths : [ "25%", "75%" ],
            columns : 2
        });

        var oLabelName = new sap.m.Label({
            text : this.getCommonText("Name_LBL") + ': '
        });

        var oTFieldName = new sap.m.Input({
            value : {
                path : sPath + "/Name",
                formatter : function(sValue) {
                    if (sValue) {
                        return sValue;
                    } else {
                        return "";
                    }
                }
            },
            textAlign : sap.ui.core.TextAlign.Begin,
            width : "300px"
        }).setModel(oModelTmp);

        var oLabelNamespace = new sap.m.Label({
            text : this.getCommonText("Namespace_LBL") + ': '
        });

        var oNamespaceSelect = new sap.m.Select({
            selectedKey : "{/Namespace}",
            width : "300px",
            items : {
                path : "NamespacesModel>/",
                template : new sap.ui.core.ListItem({
                    key : "{NamespacesModel>NameSpace}",
                    text : "{NamespacesModel>NameSpace}"
                })
            }
        }).setModel(this.getModel("NamespacesModel"), "NamespacesModel")
            .setModel(this.getModel());

        oMain.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oLabelName ],
            hAlign : sap.ui.commons.layout.HAlign.End
        }), new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oTFieldName ],
            hAlign : sap.ui.commons.layout.HAlign.Begin
        }));

        oMain.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oLabelNamespace ],
            hAlign : sap.ui.commons.layout.HAlign.End
        }), new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oNamespaceSelect ],
            hAlign : sap.ui.commons.layout.HAlign.Begin
        }));

        var oDialog = new sap.m.Dialog({
            title : this.getText("DefineNNS_TXT"),
            contentWidth : "500px",
            contentHeight : "130px",
            buttons : [ new sap.m.Button({
                text : this.getText("OK_TXT"),
                tooltip : this.getText("OK_TXT"),
                press : function(oEvent) {
                    var sName = oEvent.getSource().getParent().getParent().getContent()[0].getRows()[0].getCells()[1].getContent()[0].getValue();
                    var sNamespace = oEvent.getSource().getParent().getParent().getContent()[0].getRows()[1].getCells()[1].getContent()[0].getValue();
                    _that.getModel().setProperty(sPath + "/Name", sName);
                    _that.getModel().setProperty(sPath + "/Namespace", sNamespace);
                    oEvent.getSource().getParent().close();
                }
            }), new sap.m.Button({
                text : this.getText("Cancel_TXT"),
                tooltip : this.getText("Cancel_TXT"),
                press : function(oEvent) {
                    oDialog.close();
                }
            }) ]
        });

        oDialog.addContent(oMain);
        oDialog.open();
    },
    /**
     * Is invoked when the user navigates to the workspace of a shown chart/pattern
     * 
     * @param oEvent
     */
    handleOpenChart : function(oEvent) {
        var sChartId = this.getModel().getProperty(this.getBindingContext().getPath() + "/FeatureProperties/BaseMeasureId");
        var oTimeRange = this.getModel().getProperty(this.getBindingContext().getPath() + "/FeatureProperties/Period");
        sap.secmon.ui.m.commons.NavigationService.openBrowseUI(sChartId, new Date(oTimeRange.From), new Date(oTimeRange.To));
    },

    /**
     * Is invoked when the user changes facet => show list of charts (in future also patterns selectable?)
     * 
     * @param oEvent
     */
    handleSelectFacet : function(oEvent) {
        var _that = this;
        var bUTC = this.getModel('applicationContext').getData().UTC;
        var oDialog = new sap.m.Dialog({
            title : this.getText("SelectChart_TXT"),
            afterClose : function() {
                oDialog.destroyContent();
                oDialog.destroy();
            },
            buttons : [ new sap.m.Button({
                text : this.getText("BU_FLOD_LBL_Close"),
                press : function() {
                    oDialog.close();
                }
            }) ]
        });
        oDialog.addContent(new sap.secmon.ui.m.anomaly.ui.FacetExplorer({
            showUTC : bUTC,
            selectFacet : [ function(oEvent) {
                oEvent.getSource().getParent().close();
                var oChartData = oEvent.getParameter("data");
                // read chart content
                _that._bChartIdChanged = true;
                _that._assignChart(oChartData);
            }, this ],
            facetListRetrieved : [ function(oEvent) {
                oEvent.getSource().getParent().setBusy(false);
                var sStatus = oEvent.getParameter("status");
                if (sStatus === 'E') {
                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), _that.getText("ChartsNotRet_MSG"));
                }
            }, this ]
        }));
        oDialog.setBusy(false);
        oDialog.open();
    },
    /**
     * Is invoked wants to change charts time range => show Date/Time Picker
     * 
     * @param oEvent
     */
    handleChangeFacetTimeRange : function(oEvent) {
        var _that = this;
        var oModelTmp = new sap.ui.model.json.JSONModel();
        var bIsUTC = this.getModel('applicationContext').getData().UTC;
        var sPath = _that.getBindingContext().getPath();

        var sFrom = _that.getModel().getProperty(sPath + "/FeatureProperties/Period/From");
        var sTo = _that.getModel().getProperty(sPath + "/FeatureProperties/Period/To");
        var oDateFrom = new Date(sap.secmon.ui.commons.Formatter.dateFormatterEx(bIsUTC, sFrom, 'short', 'short'));
        var sDateFromTime = oDateFrom.getHours();
        var oDateTo = new Date(sap.secmon.ui.commons.Formatter.dateFormatterEx(bIsUTC, sTo, 'short', 'short'));
        var sDateToTime = oDateTo.getHours();

        oModelTmp.setData({
            dateFrom : sap.secmon.ui.m.anomaly.ui.Formatter.DateFormatter.format(oDateFrom),
            dateTo : sap.secmon.ui.m.anomaly.ui.Formatter.DateFormatter.format(oDateTo),
            timeFrom : sDateFromTime,
            timeTo : sDateToTime
        });

        var oMain = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : true,
            widths : [ "50%", "50%" ],
            columns : 2
        });

        // date from
        var oDatePickerFrom = new sap.m.DatePicker("datePickerDateFrom", {
            value : {
                path : "/dateFrom",
                formatter : function(oValue) {
                    if (oValue) {
                        return oValue;
                    } else {
                        return "";
                    }
                }
            },
            width : "170px",
            change : function(oEvent) {
                if (!oEvent.getParameter("invalidValue")) {
                    sap.ui.getCore().byId(oEvent.getParameters().id).setValueState(sap.ui.core.ValueState.None);
                } else {
                    sap.ui.getCore().byId(oEvent.getParameters().id).setValueState(sap.ui.core.ValueState.Error);
                }
            }
        }).setModel(oModelTmp);

        // date to
        var oDatePickerTo = new sap.m.DatePicker("datePickerDateTo", {
            value : {
                path : "/dateTo",
                formatter : function(oValue) {
                    if (oValue) {
                        return oValue;
                    } else {
                        return "";
                    }
                }
            },
            width : "170px",
            change : function(oEvent) {
                if (!oEvent.getParameter("invalidValue")) {
                    sap.ui.getCore().byId(oEvent.getParameters().id).setValueState(sap.ui.core.ValueState.None);
                } else {
                    sap.ui.getCore().byId(oEvent.getParameters().id).setValueState(sap.ui.core.ValueState.Error);
                }
            }
        }).setModel(oModelTmp);

        var oLabelTo = new sap.m.Label({
            text : _that.getText("TimerangeTo_LBL") + ': ',
            labelFor : oDatePickerTo
        });

        if (bIsUTC === true) {
            oLabelTo.setText(_that.getText("UTCTimerangeTo_LBL") + ': ');
        }

        // time from
        var oDdbTimeFrom = new sap.m.ComboBox("timePickerFrom", {
            width : "120px",
            selectedKey : {
                path : "/timeFrom",
                formatter : function(oValue) {
                    return oValue;
                }
            },
            items : [ new sap.ui.core.ListItem({
                text : "0:00",
                key : "0"
            }), new sap.ui.core.ListItem({
                text : "1:00",
                key : "1"
            }), new sap.ui.core.ListItem({
                text : "2:00",
                key : "2"
            }), new sap.ui.core.ListItem({
                text : "3:00",
                key : "3"
            }), new sap.ui.core.ListItem({
                text : "4:00",
                key : "4"
            }), new sap.ui.core.ListItem({
                text : "5:00",
                key : "5"
            }), new sap.ui.core.ListItem({
                text : "6:00",
                key : "6"
            }), new sap.ui.core.ListItem({
                text : "7:00",
                key : "7"
            }), new sap.ui.core.ListItem({
                text : "8:00",
                key : "8"
            }), new sap.ui.core.ListItem({
                text : "9:00",
                key : "9"
            }), new sap.ui.core.ListItem({
                text : "10:00",
                key : "10"
            }), new sap.ui.core.ListItem({
                text : "11:00",
                key : "11"
            }), new sap.ui.core.ListItem({
                text : "12:00",
                key : "12"
            }), new sap.ui.core.ListItem({
                text : "13:00",
                key : "13"
            }), new sap.ui.core.ListItem({
                text : "14:00",
                key : "14"
            }), new sap.ui.core.ListItem({
                text : "15:00",
                key : "15"
            }), new sap.ui.core.ListItem({
                text : "16:00",
                key : "16"
            }), new sap.ui.core.ListItem({
                text : "17:00",
                key : "17"
            }), new sap.ui.core.ListItem({
                text : "18:00",
                key : "18"
            }), new sap.ui.core.ListItem({
                text : "19:00",
                key : "19"
            }), new sap.ui.core.ListItem({
                text : "20:00",
                key : "20"
            }), new sap.ui.core.ListItem({
                text : "21:00",
                key : "21"
            }), new sap.ui.core.ListItem({
                text : "22:00",
                key : "22"
            }), new sap.ui.core.ListItem({
                text : "23:00",
                key : "23"
            }) ]
        }).setModel(oModelTmp);

        // time to
        var oDdbTimeTo = new sap.m.ComboBox("timePickerTo", {
            width : "120px",
            selectedKey : {
                path : "/timeTo",
                formatter : function(oValue) {
                    return oValue;
                }
            },
            items : [ new sap.ui.core.ListItem({
                text : "0:00",
                key : "0"
            }), new sap.ui.core.ListItem({
                text : "1:00",
                key : "1"
            }), new sap.ui.core.ListItem({
                text : "2:00",
                key : "2"
            }), new sap.ui.core.ListItem({
                text : "3:00",
                key : "3"
            }), new sap.ui.core.ListItem({
                text : "4:00",
                key : "4"
            }), new sap.ui.core.ListItem({
                text : "5:00",
                key : "5"
            }), new sap.ui.core.ListItem({
                text : "6:00",
                key : "6"
            }), new sap.ui.core.ListItem({
                text : "7:00",
                key : "7"
            }), new sap.ui.core.ListItem({
                text : "8:00",
                key : "8"
            }), new sap.ui.core.ListItem({
                text : "9:00",
                key : "9"
            }), new sap.ui.core.ListItem({
                text : "10:00",
                key : "10"
            }), new sap.ui.core.ListItem({
                text : "11:00",
                key : "11"
            }), new sap.ui.core.ListItem({
                text : "12:00",
                key : "12"
            }), new sap.ui.core.ListItem({
                text : "13:00",
                key : "13"
            }), new sap.ui.core.ListItem({
                text : "14:00",
                key : "14"
            }), new sap.ui.core.ListItem({
                text : "15:00",
                key : "15"
            }), new sap.ui.core.ListItem({
                text : "16:00",
                key : "16"
            }), new sap.ui.core.ListItem({
                text : "17:00",
                key : "17"
            }), new sap.ui.core.ListItem({
                text : "18:00",
                key : "18"
            }), new sap.ui.core.ListItem({
                text : "19:00",
                key : "19"
            }), new sap.ui.core.ListItem({
                text : "20:00",
                key : "20"
            }), new sap.ui.core.ListItem({
                text : "21:00",
                key : "21"
            }), new sap.ui.core.ListItem({
                text : "22:00",
                key : "22"
            }), new sap.ui.core.ListItem({
                text : "23:00",
                key : "23"
            }) ]
        }).setModel(oModelTmp);

        var oFromHLayout = new sap.ui.commons.layout.HorizontalLayout();
        oFromHLayout.addContent(oDatePickerFrom);
        oFromHLayout.addContent(new sap.m.Label({
            width : "20px"
        }));
        oFromHLayout.addContent(oDdbTimeFrom);

        var oToHLayout = new sap.ui.commons.layout.HorizontalLayout();
        oToHLayout.addContent(oDatePickerTo);
        oToHLayout.addContent(new sap.m.Label({
            width : "20px"
        }));
        oToHLayout.addContent(oDdbTimeTo);

        var oMatrixEntitySelection = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : true,
            widths : [ "30%", "70%" ],
            columns : 2
        });

        var oLabelFrom = new sap.m.Label({
            text : _that.getText("TimerangeFrom_LBL") + ': ',
            labelFor : oDatePickerFrom
        });

        if (bIsUTC === true) {
            oLabelFrom.setText(_that.getText("UTCTimerangeFrom_LBL") + ': ');
        }

        // Row containing time From
        oMatrixEntitySelection.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            hAlign : sap.ui.commons.layout.HAlign.End,
            content : [ oLabelFrom ]
        }), oFromHLayout);

        // Row containing time To
        oMatrixEntitySelection.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            hAlign : sap.ui.commons.layout.HAlign.End,
            content : [ oLabelTo ]
        }), oToHLayout);

        // for spacing purpose
        oMain.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "35px",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                hAlign : sap.ui.commons.layout.HAlign.End,
                content : [ new sap.m.Label({
                    text : ""
                }) ]
            }) ]
        }));

        oMain.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 2,
            content : [ oMatrixEntitySelection ]
        }));

        var oDialog = new sap.m.Dialog({
            title : this.getText("ChangeChartTimeRange_TXT"),
            contentWidth : "550px",
            contentHeight : "160px",
            afterClose : function() {
                oDialog.destroyContent();
                oDialog.destroy();
            },
            buttons : [ new sap.m.Button({
                text : this.getText("OK_TXT"),
                tooltip : this.getText("ChangeChartTimeRange_TXT"),
                press : function(oEvent) {
                    var sDateFrom = sap.secmon.ui.m.anomaly.ui.Formatter.DateFormatter.parse(sap.ui.getCore().byId('datePickerDateFrom').getValue());
                    var sDateTo = sap.secmon.ui.m.anomaly.ui.Formatter.DateFormatter.parse(sap.ui.getCore().byId('datePickerDateTo').getValue());

                    if (sDateFrom === null) {
                        sap.ui.getCore().byId('datePickerDateFrom').setValueState(sap.ui.core.ValueState.Error);
                        return;
                    }
                    if (sDateTo === null) {
                        sap.ui.getCore().byId('datePickerDateTo').setValueState(sap.ui.core.ValueState.Error);
                        return;
                    }

                    sap.ui.getCore().byId('datePickerDateFrom').setValueState(sap.ui.core.ValueState.None);
                    sap.ui.getCore().byId('datePickerDateTo').setValueState(sap.ui.core.ValueState.None);

                    var iTimeFrom = sap.ui.getCore().byId('timePickerFrom').getSelectedKey();
                    var iTimeTo = sap.ui.getCore().byId('timePickerTo').getSelectedKey();
                    var oDateFrom = new Date(sap.ui.getCore().byId('datePickerDateFrom').getValue());
                    var oDateTo = new Date(sap.ui.getCore().byId('datePickerDateTo').getValue());

                    if (bIsUTC) {
                        // add timeoffset
                        iTimeFrom = (parseInt(iTimeFrom) - oDateFrom.getTimezoneOffset() / 60);
                        iTimeTo = (parseInt(iTimeTo) - oDateTo.getTimezoneOffset() / 60);
                    }
                    oDateFrom = new Date(oDateFrom.getTime() + 3600 * 1000 * iTimeFrom);
                    oDateTo = new Date(oDateTo.getTime() + 3600 * 1000 * iTimeTo);

                    var sDateTimeFrom = new sap.secmon.ui.commons.CommonFunctions().formatDateTime(oDateFrom);
                    var sDateTimeTo = new sap.secmon.ui.commons.CommonFunctions().formatDateTime(oDateTo);

                    var oChartData = _that._oChart.getModel().getData();
                    delete oChartData.chartData;

                    oChartData.period.operator = "BETWEEN";
                    oChartData.period.searchTerms = [];
                    oChartData.period.searchTerms.push(sDateTimeFrom);
                    oChartData.period.searchTerms.push(sDateTimeTo);
                    var Period = {
                        From : sDateTimeFrom,
                        To : sDateTimeTo
                    };
                    _that.getModel().setProperty(sPath + "/FeatureProperties/Period", Period);
                    // update chart
                    _that._oChart.getModel().setData(oChartData);
                    _that._oChart.handleFeedsChanged();
                    oEvent.getSource().getParent().close();
                }
            }), new sap.m.Button({
                text : this.getText("Cancel_TXT"),
                tooltip : this.getText("Cancel_TXT"),
                press : function(oEvent) {
                    oDialog.close();
                }
            }) ]
        });

        oDialog.addContent(oMain);
        oDialog.open();
    },
    _createNNSLayout : function() {
        var _that = this;
        var oMain = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : true,
            widths : [ "25%", "75%" ],
            columns : 2
        });

        // for spacing purpose
        oMain.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "35px",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                hAlign : sap.ui.commons.layout.HAlign.End,
                content : [ new sap.m.Label({
                    text : ""
                }) ]
            }) ]
        }));
        var oLabelName = new sap.m.Label({
            text : this.getCommonText("Name_LBL") + ': '
        });
        var oTFieldName = new sap.ui.commons.ValueHelpField({
            width : "300px",
            tooltip : this.getText("SelectCreateScen_TXT"),
            valueHelpRequest : function() {
                var oDialog = new sap.m.Dialog({
                    title : _that.getText("SelectScen_TIT"),
                    afterClose : function() {
                        oDialog.destroyContent();
                        oDialog.destroy();
                    },
                    buttons : [ new sap.m.Button({
                        text : _that.getText("BU_FLOD_LBL_Close"),
                        press : function() {
                            oDialog.close();
                        }
                    }) ]
                });
                oDialog.addContent(new sap.secmon.ui.m.anomaly.ui.ObjectsExplorer({
                    type : 'Scenario',
                    selectObject : [ function(oEvent) {
                        var oData = oEvent.getParameter("data");
                        this.getParent().getParent().getParent().getRows()[1].getCells()[1].getContent()[0].setValue(oData.Name);
                        this.getParent().getParent().getParent().getRows()[2].getCells()[1].getContent()[0].setValue(oData.Namespace);
                        oEvent.getSource().getParent().close();
                    }, this ],
                    facetListRetrieved : [ function(oEvent) {
                        oEvent.getSource().getParent().setBusy(false);
                        var sStatus = oEvent.getParameter("status");
                        if (sStatus === 'E') {
                            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), _that.getText("ChartsNotRet_MSG"));
                        }
                    }, this ]
                }));
                oDialog.open();
            }
        });
        var oLabelNamespace = new sap.m.Label({
            text : this.getCommonText("Namespace_LBL") + ': '
        });

        var oNamespaceSelect = new sap.m.Select({
            selectedKey : "{/Namespace}",
            width : "300px",
            items : {
                path : "NamespacesModel>/",
                template : new sap.ui.core.ListItem({
                    key : "{NamespacesModel>NameSpace}",
                    text : "{NamespacesModel>NameSpace}"
                })
            }
        }).setModel(this.getModel("NamespacesModel"), "NamespacesModel");

        oMain.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oLabelName ],
            hAlign : sap.ui.commons.layout.HAlign.End
        }), new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oTFieldName ],
            hAlign : sap.ui.commons.layout.HAlign.Begin
        }));

        oMain.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oLabelNamespace ],
            hAlign : sap.ui.commons.layout.HAlign.End
        }), new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            content : [ oNamespaceSelect ],
            hAlign : sap.ui.commons.layout.HAlign.Begin
        }));

        return oMain;
    },

    _getScenarioTags : function(sType, sId) {
        var aTags = [];
        var oModel = new sap.ui.model.json.JSONModel();
        var sURL = sap.secmon.ui.m.anomaly.ui.Constants.C_TAG_PATH + '?Type=' + sType + '&Id=' + sId;
        oModel.loadData(sURL, null, false);
        if (oModel.getData()) {
            $.each(oModel.getData(), function(index, oTag) {
                if (oTag.Prefix === "Manual") {
                    aTags.push(oTag);
                }
            });
        }
        return aTags;
    }
});