/* globals oTextBundle, d3, systemMiniView */
$.sap.declare("sap.secmon.ui.ssm.SystemContainer");

$.sap.require("sap/ui/thirdparty/d3");
$.sap.require("sap.secmon.ui.ssm.SystemMiniView-d3");
$.sap.require("sap.secmon.ui.ssm.Constants");
jQuery.sap.require("sap.ui.model.odata.CountMode");
/**
 * Custom control shows a list of Systems, represented with Id, Type and two bars for Criticality and Health status. System view displays in three levels according to the zooming scale factor.
 * 
 * @see: SystemMiniView-d3.js
 */

sap.ui.core.Control.extend("sap.secmon.ui.ssm.SystemContainer", {
    metadata : {
        properties : {
            height : {
                type : "string",
                defaultValue : "auto"
            },
            viewMode : {
                type : "string"
            }
        },

        aggregations : {},

        events : {
            navigate : {
                params : "object"
            }
        }
    },

    init : function() {
        // attribute distribution as default model
        var oMainSysModel = new sap.ui.model.json.JSONModel();
        this.setModel(oMainSysModel);

        // ThreatSituation Model
        var oThreatSituationModel = new sap.ui.model.json.JSONModel();
        this.setModel(oThreatSituationModel, "ThreatSituationModel");
    },

    renderer : function(oRm, oControl) {

        oRm.write("<div id='" + oControl.getId() + "' ");
        oRm.writeControlData(oControl);
        oRm.addClass('sapEtdSystemContainer');
        oRm.writeClasses();
        oRm.write(">");

        oRm.write("</div>");
    },

    onBeforeRendering : function() {
    },

    _systemMiniView : undefined,
    _isAscending : {
        "Criticality" : true,
        "Health" : true,
        "Role" : true,
        "Id" : true,
    },

    _handleFilterChange : function(oEvent) {
        var sProperty = oEvent.getParameter("selectedItem").getKey();
        var currData;

        var aSystems = this.getModel().getProperty("/associations");
        switch (sProperty) {
        case "Critical":
            currData = aSystems.filter(function(d) {
                return d.Criticality >= 50;
            });
            break;
        case "Healthy":
            currData = aSystems.filter(function(d) {
                return d.Health <= 50; // !SOC (State od Compromise) just
                // upside down!
            });
            break;
        case "Uncritical":
            currData = aSystems.filter(function(d) {
                return d.Criticality < 50;
            });
            break;
        case "Unhealthy":
            currData = aSystems.filter(function(d) {
                return d.Health > 50;
            });
            break;
        case "All":
        default:
            currData = aSystems;

            break;
        }

        var sId = "#" + this.getId();
        ($(sId + " div") || []).each(function(i, oInfo) {
            oInfo.remove();
        });

        if (currData.length <= 0) {
            $(sId).append("<div>No Data Available</div>");
        }

        var oRoot = d3.select("#" + this.getId() + ".sapEtdSystemContainer").select("svg").select("g");
        oRoot.selectAll("g").data(currData, function(d) {
            return d.id + d.type;
        }).call(this._systemMiniView);

        this._systemMiniView.redraw();
    },

    /*
     * Event handler for sorting
     */
    _handleSorterChange : function(oEvent) {

        var sProperty = oEvent.getParameter("item").getKey();

        var sort = this._isAscending[sProperty] = !this._isAscending[sProperty];

        var sign = sort === true ? 1 : -1;
        d3.select("#" + this.getId() + ".sapEtdSystemContainer").select("svg").select("g").selectAll("g").sort(function(a, b) {
            if (typeof (a[sProperty]) === 'number') {
                return sign * d3.ascending(a[sProperty], b[sProperty]);
            } else if (typeof (a[sProperty]) === 'string') {
                return sign * a[sProperty].localeCompare(b[sProperty]);
            } else {
                return sign * d3.ascending(a[sProperty], b[sProperty]);
            }
        }).call(this._systemMiniView.update);
    },

    /*
     * Event handler if a system is selected and a popup is launched
     */
    handleSelect : function(d, elm) {

        // get the popup menitems
        var that = this;

        // create popover
        var oInlineController = {};
        var oSelectPopover = sap.ui.xmlfragment("ppoSelect", "sap.secmon.ui.ssm.Navigation", oInlineController);

        // get the meta model for relation/navigation
        var oODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/SSM.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oODataModel.read("Navigation", {
            urlParameters : [ "$format=json" ],
            filters : [ new sap.ui.model.Filter({
                // path : "SourceEntityType",
                // operator : sap.ui.model.FilterOperator.EQ,
                // value1 : d.EntityType
                // }), new sap.ui.model.Filter({
                path : "SourceType",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : d.Type
            }) ],
            async : false, // using synchronous call
            success : function(oData, oResponse) {
                var aNaviItems = JSON.parse(oResponse.body).d.results;
                // if (d.Relation === "UnpatchedSystem" && d.SourceType ===
                // "SecurityNote") {
                // aNaviItems.push({
                // "Name" : "ThreatSituation",
                // // "SourceEntityType" : d.EntityType,
                // "SourceType" : d.Type
                // });
                // }
                var oDisplayNamesModel = sap.ui.getCore().getModel(sap.secmon.ui.ssm.Constants.C_SSM_MODEL.DISPLAYNAMES);
                var aaDisplayNames = oDisplayNamesModel.getData();
                aNaviItems.forEach(function(oNavigation) {
                    oSelectPopover.addButton(new sap.m.Button({
                        text : aaDisplayNames["NavType." + oNavigation.Name] || oNavigation.Name,
                        press : [ function(oEvent) {
                            // bubble up the event
                            var oParams = {
                                rootEvent : oEvent,
                                navigation : oNavigation,
                                source : d
                            };
                            that.fireNavigate(oParams);
                        }, this ]
                    }));
                });
            },
            error : function(oError) {
                sap.secmon.ui.ssm.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
            }
        });

        // we have to pass some data into popover
        oSelectPopover.setModel(new sap.ui.model.json.JSONModel());

        // set the data to the popover
        oSelectPopover.getModel().setData({
        // selections : oChartDataSelected,
        });

        // open the popover
        if (oSelectPopover.getButtons().length > 0) {
            oSelectPopover.openBy(elm);
        }
    },

    handleShowSoC : function(oData, fnCallback) {
        var oModel = this.getModel("ThreatSituationModel");

        // prepare the filters
        var dEndTimestamp = new Date();
        var sFrom = sap.secmon.ui.ssm.utils.formatDateTime(new Date(dEndTimestamp.getTime() - 90 * 24 * 3600 * 1000));

        // 5min caching time
        var sCurrPath = "/" + oData.SourceId + "." + oData.Id;
        var oCurrThreat = oModel.getProperty(sCurrPath);

        if (!oCurrThreat || Date.now() - oCurrThreat.timestamp > 60000) {
            // fetch data from backend via service
            new sap.ui.model.odata.ODataModel("/sap/secmon/services/SSM.xsodata", {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            }).read("/SSMPatterns", {
                urlParameters : [ "$format=json" ],
                filters : [ new sap.ui.model.Filter({
                    path : "Timestamp",
                    operator : sap.ui.model.FilterOperator.GT,
                    value1 : sFrom
                // '2016-03-13T12:00'
                }), new sap.ui.model.Filter({
                    path : "ResourceName",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : oData.SourceId,
                }), new sap.ui.model.Filter({
                    path : "SystemIdActor",
                    operator : sap.ui.model.FilterOperator.StartsWith,
                    value1 : oData.Id,
                }) ],
                success : function(oData, oResponse) {
                    var aPatterns = JSON.parse(oResponse.body).d.results;
                    var aMetadata = [];
                    var prop;
                    if (aPatterns.length > 0) {
                        for (prop in aPatterns[0]) {
                            if (prop === "__metadata") {
                                continue;
                            }
                            aMetadata.push(prop);
                        }
                        var aCriticalObjects = {};
                        var aUniqueUsers = {};

                        var sKey;
                        aPatterns.forEach(function(oPattern, i) {
                            sKey = (oPattern.ServiceTransactionName ? (oPattern.ServiceTransactionName) : "");
                            sKey += (sKey ? "/" : "") + (oPattern.ServiceProgramName ? oPattern.ServiceProgramName : "");
                            sKey += (sKey ? "/" : "") + (oPattern.ServiceFunctionName ? oPattern.ServiceFunctionName : "");

                            aCriticalObjects[sKey] += 1;

                            aUniqueUsers[oPattern.AccountNameHashActing] += 1;
                        });

                        // find the unique calls
                        oCurrThreat =
                                {
                                    timestamp : dEndTimestamp.getTime(),
                                    summary : "<p><strong style='font-size:250%'>" + Object.keys(aCriticalObjects).length +
                                            "</strong> <em>Critical Objects</em> have been called <strong style='font-size:250%'>" + aPatterns.length +
                                            "</strong> times</p><p> by <strong style='font-size:250%'>" + Object.keys(aUniqueUsers).length +
                                            "</strong> <em>Users</em> since last <strong style='font-size:250%'>90</strong> days</p>",
                                    detail : {
                                        metadata : aMetadata,
                                        data : aPatterns
                                    }
                                };
                    } else {
                        oCurrThreat = {
                            timestamp : dEndTimestamp.getTime(),
                            summary : "Critical objects have not been exploited since last 90 days",
                            detail : {
                                metadata : [],
                                data : []
                            }
                        };
                    }

                    oModel.setProperty(sCurrPath, oCurrThreat);
                    oModel.refresh(true);
                    // }

                    fnCallback.call(this, oCurrThreat.summary);
                },
                error : function(oError) {
                    sap.secmon.ui.ssm.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
                }
            });

        } else {
            fnCallback.call(this, oCurrThreat.summary);
        }

    },

    handleHideSoC : function() {
        var tooltip = d3.select("body").select("div.sapEtdSsmTooltip");

        tooltip.html("");
        tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
    },

    // Not used!
    handleShowSoCOri : function(oData, oEvent) {
        // alert(oData);
        var oText = new sap.m.Text({
            text : "{/summary}",
        });

        var oDetailsTable = new sap.ui.table.Table({
            // width : "100%",
            visibleRowCount : 5,
            selectionMode : sap.ui.table.SelectionMode.None,
            columnHeaderVisible : true,
            columns : {
                path : "/detail/metadata",
                factory : function(sId, oContext) {
                    var sColumnId = oContext.getObject();
                    return new sap.ui.table.Column({
                        label : sColumnId,
                        template : new sap.m.Text({
                            text : {
                                path : sColumnId
                            }
                        }),
                    });
                }
            }
        });

        var oModel = this.getModel("ThreatSituationModel");

        // prepare the filters
        var dEndTimestamp = new Date(Date.now());
        var sFrom = sap.secmon.ui.ssm.utils.formatDateTime(new Date(dEndTimestamp.getTime() - 90 * 24 * 3600 * 1000));

        // fetch data from backend via service
        var oMainSysODataModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/SSM.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oMainSysODataModel.read("/SSMPatterns", {
            urlParameters : [ "$format=json" ],
            filters : [ new sap.ui.model.Filter({
                path : "Timestamp",
                operator : sap.ui.model.FilterOperator.GT,
                value1 : sFrom
            // '2016-03-13T12:00'
            }), new sap.ui.model.Filter({
                path : "ResourceName",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : oData.SourceId,
            }), new sap.ui.model.Filter({
                path : "SystemIdActor",
                operator : sap.ui.model.FilterOperator.StartsWith,
                value1 : oData.Id,
            }) ],
            success : function(oData, oResponse) {
                var aPatterns = JSON.parse(oResponse.body).d.results;
                var aMetadata = [];
                var prop;
                if (aPatterns.length > 0) {
                    for (prop in aPatterns[0]) {
                        if (prop === "__metadata") {
                            continue;
                        }
                        aMetadata.push(prop);
                    }
                    var aCriticalObjects = {};
                    var aUniqueUsers = {};

                    var sKey;
                    aPatterns.forEach(function(oPattern, i) {
                        sKey = (oPattern.ServiceTransactionName ? (oPattern.ServiceTransactionName) : "");
                        sKey += (sKey ? "/" : "") + (oPattern.ServiceProgramName ? oPattern.ServiceProgramName : "");
                        sKey += (sKey ? "/" : "") + (oPattern.ServiceFunctionName ? oPattern.ServiceFunctionName : "");

                        aCriticalObjects[sKey] += 1;

                        aUniqueUsers[oPattern.AccountNameHashActing] += 1;
                    });

                    // var sCriticalObjects = "";
                    // for (prop in aCriticalObjects) {
                    // sCriticalObjects += prop + ", ";
                    //
                    // }
                    // // remove the last two chars
                    // sCriticalObjects = sCriticalObjects.substring(0,
                    // sCriticalObjects.length - 2);

                    // find the unique calls
                    oData =
                            {
                                summary : Object.keys(aCriticalObjects).length + " Critical objects have been called " + aPatterns.length + " times by " + Object.keys(aUniqueUsers).length +
                                        " users since last 3 months",
                                detail : {
                                    metadata : aMetadata,
                                    data : aPatterns
                                }
                            };
                } else {
                    oData = {
                        summary : "No threats found.",
                        detail : {
                            metadata : [],
                            data : []
                        }
                    };
                }

                oModel.setData(oData);
                oModel.refresh(true);
            },
            error : function(oError) {
                sap.secmon.ui.ssm.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
            }
        });

        oDetailsTable.setModel(oModel);
        oDetailsTable.bindRows("/detail/data");
        oText.setModel(oModel);

        var oPopover = new sap.m.Popover({
            title : "Threat Situation",
            placement : "Bottom",
            content : [ oText, oDetailsTable ],
        });
        oPopover.openBy(oEvent);
        /*
         * // setup fake data var oData = { summary : "3 unauthorized users have called the programm 'xxxx' since last 3 months.", detail : { metadata : [ "User", "Timestamp", "Terminal" ], data : [ {
         * "User" : "ABCD-123", "Timestamp" : "2016-05-04", "Terminal" : "10.12.34.7" }, { "User" : "BFCD-233", "Timestamp" : "2016-05-04", "Terminal" : "10.12.34.7" }, { "User" : "CDED-123",
         * "Timestamp" : "2016-05-04", "Terminal" : "10.12.34.7" } ] } };
         */
    },

    forceRerender : function() {
        this.onAfterRendering();
    },

    onAfterRendering : function() {

        var calculateHeight = function(size, count, width) {
            return Math.ceil(count * size[0] * 2 / width) * size[1] * 2;
        };

        var oRoot;

        // try to get the size of the screen area
        var iWidth = -1, iHeight = 0;
        var aSystems = this.getModel().getProperty("/associations") || [];
        iWidth = window.innerWidth;

        var sId = "#" + this.getId();
        ($(sId + " div") || []).each(function(i, oInfo) {
            oInfo.remove();
        });

        if (aSystems.length <= 0) {
            $(sId).append("<div>" + oTextBundle.getText("SSM_NoData_TXT") + "</div>");
            return;
        }

        iHeight = calculateHeight([ (50 + 10), (50 + 10) ], aSystems.length, iWidth);

        // attach the svg object to the root
        var oSvg = d3.select(sId + ".sapEtdSystemContainer").select("svg");
        if (oSvg.empty()) {
            oSvg = d3.select(sId + ".sapEtdSystemContainer").append("svg").attr("viewBox", "0 0 " + iWidth + " " + iHeight).attr("preserveAspectRatio", "xMidYMid meet");
            oRoot = oSvg.append("g").attr("transform", "translate(0,0)");
        } else {
            oSvg.attr("viewBox", "0 0 " + iWidth + " " + iHeight);
            oRoot = oSvg.select("g");
        }

        // Define zooming behaviour
        // Zoom with double click (zoom in) and shift+double click (zoom out)
        var that = this;
        oSvg.call(d3.behavior.zoom().scaleExtent([ 0.1, 10 ]).on("zoom", function() {
            var evt = d3.event;
            window.setTimeout(function() {
                iHeight = calculateHeight([ (50 + 10) * evt.scale, (50 + 10) * evt.scale ], aSystems.length, iWidth);
                oSvg.attr("viewBox", "0 0 " + iWidth + " " + iHeight);
                that._systemMiniView.scale(evt.scale).repack().redraw();
            }, 50);
        })).on("wheel.zoom", null).on("mousewheel.zoom", null);

        // Events registered for zoom behaviour
        // .on("mousedown.zoom", null);
        // .on("mousemove.zoom", null);
        // .on("dblclick.zoom", null);
        // .on("touchstart.zoom", null);
        // .on("wheel.zoom", null);
        // .on("mousewheel.zoom", null);
        // .on("MozMousePixelScroll.zoom", null);

        // create systemview if needed
        this._systemMiniView = this._systemMiniView || systemMiniView().animation(true);

        this._systemMiniView.width(iWidth).height(iHeight).on("click", function(d) {
            // Show navigation possibilities
            that.handleSelect(d, d3.event.target);
        }).on("mouseover", function(d, fnCallback) {
            // Open popup only if view mode is SecurityNote and Parent is
            // SecurityNote
             if (that.getViewMode() === sap.secmon.ui.ssm.Constants.C_SSM_VIEW_MODE.NOTES && d.SourceType === "SecurityNote") {
                that.handleShowSoC(d, fnCallback);
             }
        }).on("mouseout", function(d) {
            // if (that.getView() === C_SSM_VIEW_MODE.NOTES)
            // Hide the popup
            // that.handleHideSoC(d, d3.event.target);
        });

        oRoot.selectAll("g").data(aSystems, function(d) {
            return d.id + d.type;
        }).call(this._systemMiniView);
    }
});