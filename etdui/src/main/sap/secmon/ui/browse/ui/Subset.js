/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.Subset");

$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.browse.Constants");
/**
 * Custom control to represent a Subset with count
 * 
 * @see Workspace, Path, Filter
 */

sap.ui.core.Control.extend("sap.secmon.ui.browse.Subset", {
    metadata : {
        properties : {
            text : "string",
            count : "string",
        },
        aggregations : {
            _count : {
                type : "sap.ui.commons.TextView",
                multiple : false,
                visibility : "hidden"
            },
            _lnkmn : {
                type : "sap.ui.commons.Button",
                multiple : false,
                visibility : "hidden"
            },
            _lnk2b : {
                type : "sap.ui.commons.Button",
                multiple : false,
                visibility : "hidden"
            },
            _layout : {
                type : "sap.ui.commons.layout.MatrixLayout",
                multiple : false,
                visibility : "hidden"
            },
            // include oMenu into aggregation so that the model TargetChartModel
            // van be checked
            _menu : {
                type : "sap.ui.unified.Menu",
                multiple : false,
                visibility : "hidden"
            },
        },

        events : {
            displayBrowsingChart : {
                oParam : "any"
            },

            subsetChanged : {
                oParam : "any"
            },

            createPattern : {
                oParam : "any"
            },

            createChart : {
                oParam : "any"
            },

            showData : {},

            showOriginalData : {},

            showAlertGraph : {},

            openCasefile : {
                oParam : "any"
            },
        }
    },

    // Workaround so that rerendering triggered if Count is changed
    setCount : function(value) {
        this.setProperty("count", value);
        this._oCount.setText(sap.secmon.ui.browse.utils.formatByThousands(value, ' '));
    },

    setText : function(sText) {
        // this.setProperty("count", sText);
        this._oCount.setText(sap.secmon.ui.browse.utils.formatByThousands(sText, ' '));
    },

    getText : function() {
        this.getAggregation("_mnbtn").getText();
    },

    _oCount : undefined,
    _oMICasefile : undefined,
    C_MAX_EVENTS_CASEFILE : 100,

    init : function() {

        var that = this;

        var oTargetChartModel = new sap.ui.model.json.JSONModel();
        this.setModel(oTargetChartModel, "TargetChartModel");

        var oMalimonChartModel = new sap.ui.model.json.JSONModel();
        this.setModel(oMalimonChartModel, "MalimonChartModel");

        this._oMICasefile = new sap.ui.unified.MenuItem({
            visible : {
                path : "WorkspaceModel>/",
                formatter : function(oWorkspaceData) {
                    var sBindingPath = this.getBindingContext().getPath(); // /paths/1/filters/2
                    var aPathItems = sBindingPath.split("/paths/");
                    var aFilterItems = aPathItems[1].split("/filters/");
                    var idxPath = parseInt(aFilterItems[0]);

                    var sContext = oWorkspaceData.paths[idxPath] ? oWorkspaceData.paths[idxPath].context : sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG;

                    return sContext === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG;
                }
            },
            startsSection : true,
            text : "{i18n>BU_LBL_OpenCasefile}", // "{i18n>BU_LBL_CreateChart}",
            tooltip : "{i18n>BU_TOL_OpenCasefile}",
            icon : sap.ui.core.IconPool.getIconURI("opportunity"),
            select : [ function(oEvent) {
                var sBindingPath = this.getBindingContext().getPath(); // /paths/1/filters/2

                var iCount = parseInt(sap.ui.getCore().getModel("WorkspaceModel").getProperty(sBindingPath + "/count"), 10);

                if (!isNaN(iCount) && iCount > this.C_MAX_EVENTS_CASEFILE) {
                    var messageText = oTextBundle.getText("BU_MSG_OpenCasefileTooManyEvents", iCount);
                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Information, messageText);
                } else {
                    this.fireOpenCasefile({
                        chartFunction : "OpenCasefile",
                        bindingPath : this.getBindingContext().getPath()
                    });
                }
            }, this ]
        });

        var oMenu = new sap.ui.unified.Menu({
            items : [ new sap.ui.unified.MenuItem({
                // startsSection : true,
                text : "{i18n>BU_LBL_CrPattern}",
                tooltip : "{i18n>BU_TOL_CrPattern}",
                visible : "{applicationContext>/userPrivileges/workspaceWrite}",
                icon : sap.ui.core.IconPool.getIconURI("generate-shortcut"),
                select : [ function(oEvent) {
                    this.fireCreatePattern();
                }, this ]
            }),

            new sap.ui.unified.MenuItem({
                startsSection : true,
                text : "{i18n>BU_LBL_CreateChart}",
                tooltip : "{i18n>BU_TOL_CreateChart}",
                // visible : "{applicationContext>/userPrivileges/workspaceWrite}",
                icon : sap.ui.core.IconPool.getIconURI("vertical-bar-chart"),
                select : [ function(oEvent) {
                    this.fireCreateChart({
                        chartFunction : "CreateChart"
                    });
                }, this ]
            }), new sap.ui.unified.MenuItem({
                visible : {
                    path : "TargetChartModel>/",
                    formatter : function(aVals) {
                        return aVals && aVals.length > 0;
                    }
                },
                text : "{i18n>BU_LBL_Add2Chart}",
                tooltip : "{i18n>BU_TOL_Add2Chart}",
                // visible : "{applicationContext>/userPrivileges/workspaceWrite}",
                icon : sap.ui.core.IconPool.getIconURI("vertical-bar-chart-2"),
                submenu : new sap.ui.unified.Menu({
                    items : {
                        path : "TargetChartModel>/",
                        template : new sap.ui.unified.MenuItem({
                            text : "{TargetChartModel>name}",
                            select : function(oEvent) {
                                var oParams = {
                                    // rootEvent : oEvent,
                                    // path :
                                    // oEvent.getSource().getBindingContext().getPath(),
                                    chartFunction : "Add2Chart",
                                    chartLuid : oEvent.getSource().data("luid"),
                                };
                                that.fireCreateChart(oParams);
                            }
                        }).data("luid", "{TargetChartModel>luid}"),
                    },
                }),
                select : [ function(oEvent) {
                }, this ],
            }),

            new sap.ui.unified.MenuItem({
                startsSection : true,
                text : "{i18n>BU_LBL_NormalizedData}",
                tooltip : "{i18n>BU_TOL_NormalizedData}",
                icon : sap.ui.core.IconPool.getIconURI("activity-items"),
                select : [ function(oEvent) {
                    this.fireShowData();
                }, this ]
            }),

            new sap.ui.unified.MenuItem({
                visible : {
                    parts : [ {
                        path : "WorkspaceModel>/"
                    }, {
                        path : "applicationContext>/userPrivileges/workspaceWrite"
                    } ],

                    formatter : function(oWorkspaceData, bPrivilege) {
                        // this is the menuttem which parent of parent is the
                        // subset
                        var oBindingCtx = this.getBindingContext();

                        var sBindingPath = (oBindingCtx || this.getBinding("count")).getPath(); // /paths/1/filters/2
                        var aPathItems = sBindingPath.split("/paths/");
                        var aFilterItems = aPathItems[1].split("/filters/");
                        var idxPath = parseInt(aFilterItems[0]);

                        var sContext = oWorkspaceData.paths[idxPath] ? oWorkspaceData.paths[idxPath].context : sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG;

                        return sContext === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG && bPrivilege;
                    }
                },
                text : "{i18n>BU_LBL_OriginalData}",// "Original Data",
                tooltip : "{i18n>BU_TOL_OriginalData}",
                icon : sap.ui.core.IconPool.getIconURI("activity-items"),
                select : [ function(oEvent) {
                    this.fireShowOriginalData();
                }, this ]
            }),

            new sap.ui.unified.MenuItem({
                visible : {
                    path : "WorkspaceModel>/",
                    formatter : function(oWorkspaceData) {
                        // this is the menuttem which parent of parent is the
                        // subset
                        var oBindingCtx = this.getBindingContext();

                        var sBindingPath = oBindingCtx.getPath(); // /paths/1/filters/2
                        var aPathItems = sBindingPath.split("/paths/");
                        var aFilterItems = aPathItems[1].split("/filters/");
                        var idxPath = parseInt(aFilterItems[0]);

                        var sContext = oWorkspaceData.paths[idxPath] ? oWorkspaceData.paths[idxPath].context : sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG;

                        return sContext === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.ALERT;
                    }
                },
                text : "{i18n>BU_LBL_ShowAlertGraph}",
                tooltip : "{i18n>BU_TOL_ShowAlertGraph}",
                icon : sap.ui.core.IconPool.getIconURI("alert"),
                select : [ function(oEvent) {
                    this.fireShowAlertGraph();
                }, this ]
            }), this._oMICasefile ]
        });

        this._oCount = new sap.ui.commons.TextView({
            // text : "{/count}",
            textAlign : sap.ui.core.TextAlign.Center,
            semanticColor : sap.ui.commons.TextViewColor.Positive,
            design : sap.ui.commons.TextViewDesign.H1,
            tooltip : "{i18n>BU_TOL_ShowDropDown}",
        });

        this._oCount.attachBrowserEvent("click", function(event) {
            oMenu.open(false, that._oCount.getDomRef(), sap.ui.core.Popup.Dock.BeginTop, sap.ui.core.Popup.Dock.RightBottom, that._oCount.getDomRef());
        });

        var oLink = new sap.ui.commons.Button({
            lite : true,
            icon : sap.ui.core.IconPool.getIconURI("dropdown"),
            tooltip : "{i18n>BU_TOL_ShowDropDown}",
            press : function() {
                oMenu.open(false, that._oCount.getDomRef(), sap.ui.core.Popup.Dock.BeginTop, sap.ui.core.Popup.Dock.RightBottom, that._oCount.getDomRef());
            }
        });

        var oLink2BrowsingCharts = new sap.ui.commons.Button({
            lite : true,
            icon : sap.ui.core.IconPool.getIconURI("pie-chart"),
            tooltip : "{i18n>BU_TOL_ShowBrChart}",
            press : function(oEvent) {
                that.fireDisplayBrowsingChart();
            }
        });

        this.setAggregation("_menu", oMenu);
        this.setAggregation("_count", this._oCount);
        this.setAggregation("_lnkmn", oLink);
        this.setAggregation("_lnk2b", oLink2BrowsingCharts);
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass("sapEtdSubset");
        oRm.writeClasses();
        oRm.write(">");
        oRm.renderControl(oControl.getAggregation("_lnk2b"));
        oRm.renderControl(oControl.getAggregation("_count"));
        oRm.renderControl(oControl.getAggregation("_lnkmn"));
        oRm.write("</div>");
    },

    onBeforeRendering : function() {
        var oBindingCtx = this.getBindingContext();

        var sBindingPath = oBindingCtx.getPath(); // /paths/1/filters/2
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);

        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        var sContext = oWorkspaceData.paths[idxPath].context;

        // update the targetChartmodel
        var aCharts = sap.secmon.ui.browse.utils.getController().getChartsByContext(sContext);
        this.getModel("TargetChartModel").setData(aCharts);

        // update the MalimonChartModel
        var sStartSubset = sap.secmon.ui.browse.utils.path2Id(sBindingPath);
        var aArtifacts = sap.secmon.ui.browse.utils.getController().getArtifactsByStartSubset(sStartSubset, true);
        this.getModel("MalimonChartModel").setData(aArtifacts);
    },

    onAfterRendering : function() {
        // var sId = "#" + this.getId();
        // $('span' + sId).click(function() {
        // $(this).attr('id'); // <--$(this) is a handle to the clicked span
        // $(this).parent().attr('id'); // <-- $(this).parent() references
        // });
    }

});
