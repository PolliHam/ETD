/* globals d3, eventseries */
$.sap.declare("sap.secmon.ui.malimon.EventSeries");

/**
 * Custom control to wrap the d3 implementation with SAPUI5 interface
 * 
 * @see: EventSeries-d3.js
 */

$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.malimon.EventSeries-d3");

sap.ui.core.Control.extend("sap.secmon.ui.malimon.EventSeries", {

    metadata : {
        properties : {
            width : {
                type : "string",
                defaultValue : "100%"
            },
            height : {
                type : "string",
                defaultValue : "100%"
            },
            extent : {
                type : "object[]"
            },
            showUTC : {
                type : "boolean"
            },
            count : {
                type : "string"
            },
            status : {
                type : "string",
                defaultValue : "loading..."
            },
            additionalInfo : {
                type : "string",
            },
            color : {
                type : "object"
            },
            data : {
                type : "object[]"
            },
        },

        aggregations : {
            data : {
                type : "sap.ui.base.ManagedObject"
            },
            _title : {
                type : "sap.m.Title",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            circlePress : {},
            zoomOut : {}
        }

    },

    _svg : undefined,

    setCount : function(sCount) {
        // this.setProperty("count", sCount);
        // this._updateTitle();
    },

    setStatus : function(sStatus) {
        // this.setProperty("status", sStatus);
        // this._updateTitle();
    },

    setAdditionalInfo : function(sAdditionalInfo) {
        // this.setProperty("additionalInfo", sAdditionalInfo);
        // this._updateTitle();
    },

    setExtent : function(aExtent) {
        this.setProperty("extent", aExtent, true);
        this._eventseries.extent(aExtent);
        // this._updateTitle();
    },

    getExtent : function() {
        return this._eventseries.extent();
    },

    _updateTitle : function() {
        // // toUTCString() toLocaleString('en-GB')
        // var from;
        // var to;
        // var timeRange = "";
        // if (this.getExtent() && this.getExtent().length == 2) {
        // from = this.getExtent()[0].toUTCString();
        // to = this.getExtent()[1].toUTCString();
        // timeRange = from.substring(0, from.length - 4) + " - " +
        // to.substring(0, to.length - 4) + " UTC";
        // }
        //
        // // update title
        // this.getAggregation("_title").setText(this.getAdditionalInfo() + ",
        // Events: " + this.getCount() + ", From-To: " + this.getStatus() +
        // timeRange);
    },

    init : function() {

        this.setModel(new sap.ui.model.json.JSONModel());

        // this.setAggregation("_title", new sap.m.Title({
        // level : sap.ui.core.TitleLevel.H4,
        // textAlign : sap.ui.core.TextAlign.Center,
        // }));

        this._eventseries = eventseries();
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass('sapEtdEventSeries');
        oRm.writeClasses();
        oRm.write(">");
        // oRm.renderControl(oControl.getAggregation("_title"));
        oRm.write("</div>");
    },

    _eventseries : undefined,

    _update : function() {

        var aData = this.getModel().getProperty("/data"); // this could be new data from Navigation or existent data

        this._eventseries.color(this.getColor()).data(aData).showUTC(this.getShowUTC());

        var iWidth = this.getWidth();
        var iHeight = this.getHeight();

        try {
            iHeight -= this.getParent().getItems()[0].getDomRef().offsetHeight;
        } catch (e) {

        }

        // iHeight = iHeight - 18;

        var oRoot;
        if (this._svg === undefined) {
            this._svg =
                    d3.select(".sapEtdEventSeries").append("svg").attr("viewBox", "0 0 " + iWidth + " " + iHeight).attr("preserveAspectRatio", "xMidYMid meet").classed("sapEtdEventSeriesResponsive",
                            true);
            oRoot = this._svg.append("g").attr("transform", "translate(0,0)");
        } else {
            oRoot = this._svg.select("g");
            this._svg.attr("viewBox", "0 0 " + iWidth + " " + iHeight).attr("preserveAspectRatio", "xMidYMid meet");
            d3.select(".sapEtdEventSeries").node().appendChild(this._svg.node());
        }

        // Tooltip
        var oTooltip = d3.select("body").select("div.sapEtdEventSeriesTooltip");
        if (oTooltip.empty()) {
            oTooltip = d3.select("body").append("div").attr("class", "sapEtdEventSeriesTooltip").style("opacity", 0);
        }

        // set CirclePress event to d3
        this._eventseries.width(iWidth).height(iHeight).tooltip(oTooltip).onCirclePress(jQuery.proxy(this.fireCirclePress, this)).onZoomOut(jQuery.proxy(this.fireZoomOut, this));

        // load and update
        oRoot.call(this._eventseries);
    },

    onCirclePress : function(oNode) {
        // call EventSeries with new Alert Number
        this.fireCirclePress(oNode);
    },

    onZoomOut : function(aNewDomain) {
        this.fireZoomOut(aNewDomain);
    },

    onAfterRendering : function() {
        var aData;
        if (this.getBinding("data")) {
            aData = this.getBinding("data").getContexts().map(function(oContext) {
                return oContext.getObject();
            });
            // update the graphic
        } else if (this.getModel().getProperty("/data")) {
            aData = this.getModel().getProperty("/data");
        }

        if (aData && aData.length > 0) {
            // update the graphic
            this._update(aData);
        }
    }
});