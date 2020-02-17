/* globals oTextBundle, d3 */
$.sap.declare("sap.secmon.ui.browse.Bubblegram");

$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.browse.Bubblegram-d3");

/**
 * Custom control to provide a visual representation of data distribution in one dimension. The size / diameter of a bubble is made proportional in log scale to the "Ranking" of the attribute. In this
 * implementation this ranking is calculated with distinctCount
 * 
 * @see: Bubblegram-d3.js
 */

sap.ui.core.Control.extend("sap.secmon.ui.browse.Bubblegram", {

    metadata : {
        properties : {

            // data must be in format
            // {
            // key,
            // distinctCount
            // displayName
            // }
            data : {
                type : "object"
            },

            selectedNode : {
                type : "object"
            },

            startSubset : {
                type : "string",
                defaultValue : null,
            },

            browsingContext : {
                type : "string",
                defaultValue : sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG
            },
        },

        aggregations : {
            "_ddb" : {
                type : "sap.m.Select",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            drilldown : {
                startSubset : "string"
            },
        }
    },

    init : function() {
        this.addStyleClass("sapEtdBubblegram");

        // attribute distribution as default model
        this.setModel(new sap.ui.model.json.JSONModel());

        // attribute value distribution
        this.setModel(new sap.ui.model.json.JSONModel(), "AttrValueModel");

        this._bubblegram = sap.secmon.ui.browse["Bubblegram-d3"].bubblegram().range(this._range).selRatio(this._ratio);

        // UI
        var oBrowseDimension = new sap.m.Select({
            // type : sap.m.SelectType.IconOnly,
            // icon : "sap-icon://search",
            forceSelection : false,
            autoAdjustWidth : true,
            showSecondaryValues : true,
            items : {
                path : "/",
                template : new sap.ui.core.ListItem({
                    key : "{key}",
                    text : "{displayName}",
                    additionalText : "{displayName}",
                // "{count} ({distinctCount})"
                })
            },
            change : [ function(oEvent) {
                var sDropdown = oEvent.getSource();
                var sKey = sDropdown.getSelectedKey();

                this._bubblegram.select(sKey);
            }, this ]
        });
        this.setAggregation("_ddb", oBrowseDimension);
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.write(">");
        oRm.write("<div style='display:block;text-align:center'");
        oRm.write(" id=" + "'" + oControl.getId() + "_ToolBar" + "'");
        oRm.write(">");
        oRm.renderControl(oControl.getAggregation("_ddb"));
        oRm.write("</div>");
        oRm.write("<div");
        oRm.write(" id=" + "'" + oControl.getId() + "_Svg" + "'");
        oRm.addClass('sapEtdBubblegram');
        oRm.writeClasses();
        oRm.write(">");
        oRm.write("</div>");
        oRm.write("</div>");
    },

    _svg : undefined,
    _range : [ 80, 5 ],
    _ratio : 5, // 1.618,

    /*
     * Load data from backend asynchronously. Two step-loading to reduce the waiting time of user. Currently we wait for the first request to be executed then the second one. In the future it should
     * be possible to send both at the same time. We need to update the Bubblegram-d3 to render indept of which request arrives at first.
     */
    _loadData : function(sStartSubset, sBrowsingContext) {

        var that = this;
        var oAttributeMappingModel = sap.ui.getCore().getModel("AttributeMappingModel");
        var sContext;
        // same model is used for the current workspace
        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        oWorkspaceData.now = oWorkspaceData.now || sap.secmon.ui.browse.utils.formatDateTime(new Date());

        // get the current path
        sStartSubset = sStartSubset;
        sContext = sBrowsingContext;

        // setup the sync point
        var __syncCountUpdated = false;

        // try to get field list with count as measure
        var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(sStartSubset, oWorkspaceData, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_FIELD_LIST);
        oQuery.mode = "countShort";
        oQuery.verbose = sap.secmon.ui.browse.utils.getController().bDebug;
        // load log event from warm storage
        oQuery.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;
        var totalCount = 0;

        sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery), true).done(function(response, textStatus, XMLHttpRequest) {

            var aAttrs = JSON.parse(JSON.stringify(response)).data;
            var data = [];

            totalCount = response.totalCount || response.data.length;

            aAttrs.forEach(function(oAttr, idx) {
                var oMapping = oAttributeMappingModel.getData()[oAttr.key];
                oAttr.displayName = oMapping ? oMapping.displayName : oAttr.key;
                data.push(oAttr);
            });

            that.getModel().setData(data);
            that._update();
            __syncCountUpdated = true;

        }).fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });

        // try to get field list with disticnt count
        oQuery = sap.secmon.ui.browse.utils.mapUI2Query(sStartSubset, oWorkspaceData, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_FIELD_LIST);
        oQuery.mode = "distCountShort";
        oQuery.verbose = sap.secmon.ui.browse.utils.getController().bDebug;
        // load log event from warm storage
        oQuery.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;

        sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery), true).done(function(response, textStatus, XMLHttpRequest) {
            var aAttrs = JSON.parse(JSON.stringify(response)).data;
            // build an index
            var aaAttrs = {};
            aAttrs.forEach(function(oAttr, idx) {
                aaAttrs[oAttr.key] = oAttr;
            });

            var id = setInterval(function() {
                if (__syncCountUpdated) {
                    // merge the counts according to key instead of index
                    var data = that.getModel().getData();
                    data.forEach(function(oData, idx) {
                        // distinct count has to be corrected due to null values
                        // (attribute values not filled)

                        if (aaAttrs[oData.key] && aaAttrs[oData.key].detail && aaAttrs[oData.key].detail === true) { // detail
                            // fields
                            oData.distinctCount = aaAttrs[oData.key] ? aaAttrs[oData.key].distinctCount : 1;
                        } else { // non-detail fields
                            oData.distinctCount = aaAttrs[oData.key] ? aaAttrs[oData.key].distinctCount + (oData.count < totalCount ? 1 : 0) : 1;
                        }

                    });
                    that.getModel().setData(data);
                    that._update();
                    clearInterval(id);
                    __syncCountUpdated = false;
                } else {
                }
            }, 100);

        }).fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });

    },

    /*
     * Loading attributes to show as Donut chart
     */
    _loadAttrValues : function(oBubble) {

        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        var oWorkspaceDataCopy = $.extend(true, {}, oWorkspaceData);

        // / / get the current path
        var sStartSubset = this.getStartSubset();
        var sContext = this.getBrowsingContext();

        var oAttr = oBubble.datum();
        var oChartData = {
            context : sContext,
            operation : sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.CREATE_CHART,
            period : oWorkspaceData.period,
            name : "",
            namespace : oWorkspaceData.namespace,
            now : oWorkspaceDataCopy.now,
            dimensions : [ {
                context : sContext,
                key : oAttr.key,
                name : oAttr.displayName
            } ],
            measures : [ {
                context : sContext,
                displayName : "Count",
                distinct : false,
                fn : "COUNT",
                key : "*",
                name : "*",
                startDatasets : [ {
                    name : sStartSubset
                } ]
            } ],
            verbose : sap.secmon.ui.browse.utils.getController().bDebug,
            // load log event from warm storage
            forceWarm : sap.secmon.ui.browse.utils.getController()._bForceWarm
        };

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

        var updateDonut = this._bubblegram.updateDonut;
        var showTooltip = this._bubblegram.showTooltip;
        sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oChartData)).done(function(oData, textStatus, XMLHttpRequest) {
            var aData = [];
            oData.data.forEach(function(d, i) {
                var oItem = {};
                for ( var prop in d) {
                    if (d.hasOwnProperty(prop)) {
                        if (prop.indexOf("COUNT") > -1) {
                            oItem.value = d[prop];
                        } else {
                            oItem.id = d[prop];
                            oItem.id = oItem.id === null ? sap.secmon.ui.browse.Constants.C_VALUE.NULL : oItem.id;
                        }
                    }
                }
                aData.push(oItem);
            });
            // TODO: how to position the tooltip?
            if (oBubble.datum().distinctCount <= 1 && aData.length <= 1) {
                oBubble.call(showTooltip, aData);
            }
            oBubble.call(updateDonut, aData);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            if (errorThrown !== "abort") {
                var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            }
        });

    },

    /*
     * Add a new filter to a path
     */
    _updateSubsetInWorkspace : function(oNewFilterData) {

        var that = this;

        var oSelectedFilterData = oNewFilterData;

        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
        var oWorkspaceData = oWorkspaceModel.getData();

        var sStartSubset = this.getStartSubset();
        var sContext = this.getBrowsingContext();

        var aLuids = sStartSubset.split(".");
        var iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(aLuids[0].split("Path")[1], oWorkspaceData);

        var iSubsetLuid = sap.secmon.ui.browse.utils.generateLuid(oWorkspaceData.paths[iPathIdx].filters);
        oSelectedFilterData.luid = iSubsetLuid;

        var iSubsetIdx = oWorkspaceData.paths[iPathIdx].filters.push(oSelectedFilterData) - 1;
        oSelectedFilterData.workspaceContext = oWorkspaceData.paths[iPathIdx].name + ".Subset" + iSubsetLuid;

        sStartSubset = oSelectedFilterData.workspaceContext;

        // this triggers onAfterRendering() -> implicitly triggers _loadData()
        this.setStartSubset(sStartSubset);

        sap.secmon.ui.browse.utils.getController()._oCache.getData([ {
            context : sContext,
            subsetId : sStartSubset
        } ], oWorkspaceData);

        var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(oSelectedFilterData.workspaceContext, oWorkspaceData, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_RECORDS_COUNT, null, null);
        oQuery.verbose = sap.secmon.ui.browse.utils.getController().bDebug;
        // load log event from warm storage
        oQuery.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;

        sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery)).done(function(response, textStatus, XMLHttpRequest) {
            oWorkspaceData.paths[iPathIdx].filters[iSubsetIdx].count = response.data[0].COUNT;
            oWorkspaceModel.setData(oWorkspaceData);
            that.fireDrilldown({
                startSubset : sStartSubset
            });
            // Publich this event for highlighting
            sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_ADD_FILTER, [ {
                startSubset : sStartSubset
            } ]);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            oWorkspaceData.paths[iPathIdx].filters[iSubsetIdx].count = oTextBundle.getText("BrowseCountUnknown");
            oWorkspaceModel.setData(oWorkspaceData);
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });

    },

    _bubblegram : undefined,

    _update : function(aData) {

        var rawData = aData || this.getModel().getData();

        if (!rawData || $.isEmptyObject(rawData)) {
            return;
        }

        var data = rawData.map(function(d) {
            d.distinctCount = d.distinctCount ? +d.distinctCount : 0;
            return d;
        });

        // determine the scaling factor
        var scale = d3.scale.log().domain(d3.extent(data, function(d) {
            return d.distinctCount + 2;
        })).range(this._range);

        data = data.map(function(d) {
            d.value = scale(d.distinctCount + 2);
            return d;
        });

        // bubbles needs very specific format, convert data to this.
        var nodes = this._bubblegram.pack().nodes({
            children : data
        }).filter(function(d) {
            return !d.children;
        });

        this._svg.selectAll(".bubble").data(nodes, function(d) {
            return d.key;
        }).call(this._bubblegram);
    },

    onAfterRendering : function() {

        // find the parent and get the its width
        var sWidth = window.getComputedStyle(d3.select(".sapEtdBubblegram").node()).getPropertyValue("width").split("px")[0];
        var iDiameter = parseInt(sWidth) * 1.414;

        // attach the svg object to the root
        var oRoot = d3.select(".sapEtdBubblegram").select("svg");
        if (oRoot.empty()) {
            oRoot =
                    d3.select(".sapEtdBubblegram").append("svg").attr("viewBox", "0 0 " + iDiameter + " " + iDiameter).attr("preserveAspectRatio", "xMidYMid meet").classed(
                            "sapEtdBubblegramResponsive", true);
            this._svg = oRoot.append("g").attr("transform", "translate(0,0)");
        } else {
            this._svg = oRoot.select("g");
        }

        // handling zooming and dragging
        oRoot.call(d3.behavior.zoom().scaleExtent([ 0.1, 10 ]).on("zoom", function() {
            oRoot.select("g").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }));

        // create the bubblegram instance
        var that = this;
        this._bubblegram.width(iDiameter).height(iDiameter).on("select", function(bubble) {
            that._loadAttrValues(d3.select(bubble));
        }).donut().on("select", function(origin, bInverted, d, i) {
            // if an arc is selected from the donut
            // -> add as a filter
            var selNode = that._bubblegram.selected();

            // remove the donut arcs
            that._svg.selectAll("path").remove();

            var emptyBubbles = that._svg.selectAll(".bubble").data([]);

            var numBubbles = 0;
            emptyBubbles.exit().select("circle").transition().duration(3000).attr("r", 0).each("start", function() {
                ++numBubbles;
            }).each("end", function() {
                if (--numBubbles <= 0) {
                    // delay removal of parent for 100.
                    emptyBubbles.exit().remove();

                    // handle null <==> "No value" as filter
                    d.data.id = d.data.id === sap.secmon.ui.browse.Constants.C_VALUE.NULL ? null : d.data.id;

                    var oSelectedFilterData = {
                        key : selNode.key,
                        context : "Log",
                        displayName : selNode.displayName,
                        description : "",
                        isFieldRef : 0,
                        valueRange : {
                            operator : "IN",
                            searchTerms : [ d.data.id ],
                            searchTermRefKeys : []
                        }
                    };

                    that._updateSubsetInWorkspace(oSelectedFilterData);
                }
            });
        });

        // load and update
        this._loadData(this.getStartSubset(), this.getBrowsingContext());
    }
});